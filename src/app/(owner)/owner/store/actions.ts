"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const selling_price = parseFloat(formData.get("selling_price") as string);
  const stock_quantity = parseInt(formData.get("stock_quantity") as string, 10);
  const minimum_stock = parseInt(formData.get("minimum_stock") as string, 10);

  const { error } = await supabase.from("products").insert({
    name,
    sku,
    selling_price,
    stock_quantity,
    minimum_stock,
    status: "active"
  });

  if (error) {
    console.error("Error creating product:", error);
    throw new Error(error.message);
  }

  revalidatePath("/owner/store");
}

export async function processSale(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const member_id = formData.get("member_id") as string;
  const product_id = formData.get("product_id") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);

  // 1. Fetch product price and verify stock
  const { data: product } = await supabase
    .from("products")
    .select("selling_price, stock_quantity")
    .eq("id", product_id)
    .single();

  if (!product) throw new Error("Product not found");
  if (product.stock_quantity < quantity) throw new Error("Insufficient stock");

  const total_amount = product.selling_price * quantity;

  // 2. Create Sale
  const { data: sale, error: saleError } = await supabase.from("store_sales").insert({
    member_id: member_id ? member_id : null,
    total_amount,
    paid_amount: total_amount,
    payment_method: "Cash",
    created_by: user.id
  }).select().single();

  if (saleError) throw new Error(saleError.message);

  // 3. Create Sale Item
  await supabase.from("store_sale_items").insert({
    sale_id: sale.id,
    product_id,
    quantity,
    unit_price: product.selling_price,
    amount: total_amount
  });

  // 4. Decrement Stock
  await supabase.from("products").update({
    stock_quantity: product.stock_quantity - quantity
  }).eq("id", product_id);

  // 5. Audit Log
  await supabase.from("audit_logs").insert({
    actor_profile_id: user.id,
    action: "STORE_SALE",
    entity_type: "store_sale",
    entity_id: sale.id,
    details: { total: total_amount }
  });

  revalidatePath("/owner/store");
}
