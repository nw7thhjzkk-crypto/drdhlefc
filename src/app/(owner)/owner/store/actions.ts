"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name          = formData.get("name")          as string;
  const sku           = formData.get("sku")           as string;
  const category      = formData.get("category")      as string;
  const supplier      = formData.get("supplier")      as string;
  const purchase_price  = parseFloat(formData.get("purchase_price")  as string) || 0;
  const selling_price   = parseFloat(formData.get("selling_price")   as string);
  const stock_quantity  = parseInt(formData.get("stock_quantity")    as string, 10);
  const minimum_stock   = parseInt(formData.get("minimum_stock")     as string, 10);

  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      sku: sku || null,
      category: category || null,
      supplier: supplier || null,
      purchase_price,
      selling_price,
      stock_quantity,
      minimum_stock,
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.rpc("insert_audit_log", {
    p_action:      "CREATE_PRODUCT",
    p_entity_type: "product",
    p_entity_id:   data.id,
    p_member_id:   null,
    p_details:     { name, sku, selling_price, stock_quantity },
  });

  revalidatePath("/owner/store");
}

/**
 * Process a POS sale atomically.
 *
 * Security:
 * - Delegates entirely to the SECURITY DEFINER RPC checkout_store_sale(),
 *   which: fetches authoritative server-side prices, locks product rows
 *   FOR UPDATE, checks stock, inserts the sale + items, decrements stock,
 *   and writes the audit log — all in one transaction.
 * - Client cannot override selling_price or inject arbitrary totals.
 * - Concurrent checkouts cannot corrupt stock due to row-level locking.
 */
export async function processSale(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const member_id    = (formData.get("member_id")    as string) || null;
  const product_id   = formData.get("product_id")   as string;
  const quantity_raw = formData.get("quantity")      as string;
  const payment_method = (formData.get("payment_method") as string) || "cash";

  const quantity = parseInt(quantity_raw, 10);
  if (!product_id || isNaN(quantity) || quantity < 1) {
    throw new Error("product_id and a positive quantity are required");
  }

  // Build line items array for the RPC (supports multi-item future extension)
  const items = [{ product_id, quantity }];

  const { data: sale_id, error } = await supabase.rpc("checkout_store_sale", {
    p_member_id:      member_id,
    p_items:          items,
    p_payment_method: payment_method,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/owner/store");
  return { success: true, sale_id };
}
