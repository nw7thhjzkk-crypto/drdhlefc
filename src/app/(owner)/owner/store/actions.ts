"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

async function softFailAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  args: {
    p_action: string;
    p_entity_type: string;
    p_entity_id: string;
    p_member_id: string | null;
    p_details: Record<string, unknown> | null;
  }
) {
  try {
    await supabase.rpc("insert_audit_log", args);
  } catch (err) {
    console.error("Failed to insert audit log:", err);
  }
}

export async function createProduct(formData: FormData) {
  const { supabase } = await requireOwner();

  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const category = formData.get("category") as string;
  const supplier = formData.get("supplier") as string;
  const purchase_price =
    parseFloat(formData.get("purchase_price") as string) || 0;
  const selling_price = parseFloat(formData.get("selling_price") as string);
  const stock_quantity = parseInt(
    formData.get("stock_quantity") as string,
    10
  );
  const minimum_stock = parseInt(formData.get("minimum_stock") as string, 10);

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

  await softFailAudit(supabase, {
    p_action: "CREATE_PRODUCT",
    p_entity_type: "product",
    p_entity_id: data.id,
    p_member_id: null,
    p_details: { name, sku, selling_price, stock_quantity },
  });

  revalidatePath("/owner/store");
}

/**
 * Increase product stock by a positive integer delta.
 * Absolute stock_quantity is never set from the client here.
 */
export async function restockProduct(productId: string, quantityDelta: number) {
  const { supabase } = await requireOwner();

  if (!productId) throw new Error("productId is required");
  if (!Number.isInteger(quantityDelta) || quantityDelta < 1) {
    throw new Error("quantityDelta must be a positive integer");
  }

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("id, stock_quantity, name")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    throw new Error(fetchError?.message || "Product not found");
  }

  const current = product.stock_quantity ?? 0;
  const nextStock = current + quantityDelta;

  const { error } = await supabase
    .from("products")
    .update({
      stock_quantity: nextStock,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  await softFailAudit(supabase, {
    p_action: "RESTOCK_PRODUCT",
    p_entity_type: "product",
    p_entity_id: productId,
    p_member_id: null,
    p_details: {
      name: product.name,
      quantity_delta: quantityDelta,
      stock_before: current,
      stock_after: nextStock,
    },
  });

  revalidatePath("/owner/store");
}

/**
 * Edit product metadata. Does not accept absolute stock_quantity — use restockProduct.
 */
export async function updateProduct(productId: string, formData: FormData) {
  const { supabase } = await requireOwner();

  if (!productId) throw new Error("productId is required");

  const name = (formData.get("name") as string)?.trim();
  const sku = (formData.get("sku") as string)?.trim() || null;
  const category = (formData.get("category") as string)?.trim() || null;
  const supplier = (formData.get("supplier") as string)?.trim() || null;
  const purchase_price =
    parseFloat(formData.get("purchase_price") as string) || 0;
  const selling_price = parseFloat(formData.get("selling_price") as string);
  const minimum_stock = parseInt(formData.get("minimum_stock") as string, 10);
  const statusRaw = (formData.get("status") as string) || "active";
  const status = statusRaw === "inactive" ? "inactive" : "active";

  if (!name) throw new Error("name is required");
  if (Number.isNaN(selling_price)) throw new Error("selling_price is required");
  if (Number.isNaN(minimum_stock) || minimum_stock < 0) {
    throw new Error("minimum_stock must be a non-negative integer");
  }

  const { error } = await supabase
    .from("products")
    .update({
      name,
      sku,
      category,
      supplier,
      purchase_price,
      selling_price,
      minimum_stock,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  await softFailAudit(supabase, {
    p_action: "UPDATE_PRODUCT",
    p_entity_type: "product",
    p_entity_id: productId,
    p_member_id: null,
    p_details: {
      name,
      sku,
      category,
      supplier,
      purchase_price,
      selling_price,
      minimum_stock,
      status,
    },
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
  const { supabase } = await requireOwner();

  const member_id = (formData.get("member_id") as string) || null;
  const payment_method = (formData.get("payment_method") as string) || "cash";
  const items_raw = formData.get("items") as string;

  if (!items_raw) {
    throw new Error("No items provided");
  }

  let items: { product_id: string; quantity: number }[] = [];
  try {
    items = JSON.parse(items_raw);
  } catch (err) {
    throw new Error("Invalid items format");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty");
  }

  for (const item of items) {
    if (!item.product_id || typeof item.quantity !== "number" || item.quantity < 1) {
      throw new Error("Invalid item in cart");
    }
  }

  const { data: sale_id, error } = await supabase.rpc("checkout_store_sale", {
    p_member_id: member_id,
    p_items: items,
    p_payment_method: payment_method,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/owner/store");
  return { success: true, sale_id };
}

export async function seedStarterProducts() {
  const { supabase } = await requireOwner();

  const { count, error: countError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  if (countError) throw new Error(countError.message);

  if (count && count > 0) {
    return; // idempotent: only seed if empty
  }

  const starterProducts = [
    {
      name: "Whey Protein Isolate (Vanilla)",
      sku: "WHEY-VAN-01",
      category: "Supplements",
      supplier: "Optimum Nutrition",
      purchase_price: 30.0,
      selling_price: 45.0,
      stock_quantity: 20,
      minimum_stock: 5,
      status: "active",
    },
    {
      name: "Pre-Workout Energy",
      sku: "PRE-NRG-01",
      category: "Supplements",
      supplier: "Cellucor",
      purchase_price: 20.0,
      selling_price: 35.0,
      stock_quantity: 15,
      minimum_stock: 5,
      status: "active",
    },
    {
      name: "GymSmart Shaker Bottle",
      sku: "BOT-SHK-01",
      category: "Accessories",
      supplier: "BlenderBottle",
      purchase_price: 5.0,
      selling_price: 12.0,
      stock_quantity: 50,
      minimum_stock: 10,
      status: "active",
    },
  ];

  const { data, error } = await supabase
    .from("products")
    .insert(starterProducts)
    .select("id");

  if (error) throw new Error(error.message);

  if (data && data.length > 0) {
    try {
      await supabase.rpc("insert_audit_log", {
        p_action: "SEED_STARTER_PRODUCTS",
        p_entity_type: "product",
        p_entity_id: data[0].id,
        p_member_id: null,
        p_details: { count: starterProducts.length },
      });
    } catch (err) {
      console.error("Failed to insert audit log:", err);
    }
  }

  revalidatePath("/owner/store");
}
