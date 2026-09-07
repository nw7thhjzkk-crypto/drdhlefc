import { createClient } from "@/utils/supabase/server";
import {
  createProduct,
  restockProduct,
  updateProduct,
  seedStarterProducts,
} from "./actions";
import POSCart from "./POSCart";

export default async function StorePage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  const { data: recentSales } = await supabase
    .from("store_sales")
    .select("*, members(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: members } = await supabase
    .from("members")
    .select("id, name")
    .order("name");

  const lowStockProducts =
    products?.filter(
      (p) =>
        (p.stock_quantity ?? 0) <= (p.minimum_stock ?? 0) &&
        p.status !== "inactive"
    ) || [];

  const inventory = products ?? [];
  const sales = recentSales ?? [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Store & POS</h1>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-red-950/50 border border-red-900 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-500 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Low Stock Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((product) => (
              <div
                key={`alert-${product.id}`}
                className="bg-red-950 border border-red-900/50 rounded p-3 flex justify-between items-center"
              >
                <div>
                  <div className="text-sm font-medium text-red-200">
                    {product.name}
                  </div>
                  <div className="text-xs text-red-400/70">
                    SKU: {product.sku || "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-500">
                    {product.stock_quantity ?? 0}
                  </div>
                  <div className="text-xs text-red-400/50">
                    Min: {product.minimum_stock ?? 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* POS Flow */}
        <div className="space-y-8">
          <POSCart members={members || []} products={products || []} />

          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">
              Add New Product
            </h2>
            <form action={createProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400">
                    Product Name
                  </label>
                  <input
                    name="name"
                    required
                    className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400">
                    SKU
                  </label>
                  <input
                    name="sku"
                    required
                    className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400">
                    Selling Price
                  </label>
                  <input
                    name="selling_price"
                    type="number"
                    step="0.01"
                    required
                    className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400">
                    Initial Stock
                  </label>
                  <input
                    name="stock_quantity"
                    type="number"
                    required
                    className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400">
                    Min Stock
                  </label>
                  <input
                    name="minimum_stock"
                    type="number"
                    defaultValue="5"
                    required
                    className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
              >
                Add Product to Inventory
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          {/* Inventory List */}
          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between">
              <h2 className="text-lg font-semibold text-zinc-100">Inventory</h2>
            </div>
            {inventory.length === 0 ? (
              <div className="m-6 flex flex-col items-center justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-10 text-center">
                <h3 className="text-lg font-semibold text-yellow-500">
                  Inventory empty
                </h3>
                <p className="max-w-md text-sm text-zinc-500">
                  No products yet. Seed starter products or add your first item
                  to start selling from the POS.
                </p>
                <form action={seedStarterProducts}>
                  <button
                    type="submit"
                    className="bg-zinc-800 text-yellow-500 font-bold px-4 py-2 rounded hover:bg-zinc-700 border border-zinc-700"
                  >
                    Seed Starter Products
                  </button>
                </form>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {inventory.map((product) => (
                  <div key={product.id} className="px-6 py-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-zinc-200">
                          {product.name}
                        </div>
                        <div className="text-xs text-zinc-500">
                          SKU: {product.sku || "—"} · ${
                            product.selling_price
                          }{" "}
                          ·{" "}
                          <span
                            className={`px-2 py-0.5 rounded ${
                              (product.stock_quantity ?? 0) >
                              (product.minimum_stock ?? 0)
                                ? "bg-green-900/50 text-green-400"
                                : "bg-red-900/50 text-red-400"
                            }`}
                          >
                            stock {product.stock_quantity ?? 0}
                          </span>{" "}
                          · {product.status || "active"}
                        </div>
                      </div>
                      <form
                        action={async (formData) => {
                          "use server";
                          const delta = parseInt(
                            formData.get("quantity_delta") as string,
                            10
                          );
                          await restockProduct(product.id, delta);
                        }}
                        className="flex items-end gap-2"
                      >
                        <div>
                          <label className="block text-xs font-medium text-zinc-500">
                            Restock +
                          </label>
                          <input
                            name="quantity_delta"
                            type="number"
                            min="1"
                            defaultValue="1"
                            required
                            className="mt-1 w-20 bg-zinc-950 border border-zinc-800 rounded p-1.5 text-zinc-200 text-sm"
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-zinc-800 text-yellow-500 text-xs font-semibold px-3 py-2 rounded hover:bg-zinc-700 border border-zinc-700"
                        >
                          Add stock
                        </button>
                      </form>
                    </div>

                    <details className="group">
                      <summary className="cursor-pointer text-xs text-zinc-400 hover:text-yellow-500 list-none">
                        Edit product
                      </summary>
                      <form
                        action={async (formData) => {
                          "use server";
                          await updateProduct(product.id, formData);
                        }}
                        className="mt-3 grid grid-cols-2 gap-2 text-sm"
                      >
                        <div className="col-span-2">
                          <label className="block text-xs text-zinc-500">Name</label>
                          <input
                            name="name"
                            defaultValue={product.name ?? ""}
                            required
                            className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500">SKU</label>
                          <input
                            name="sku"
                            defaultValue={product.sku ?? ""}
                            className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500">
                            Category
                          </label>
                          <input
                            name="category"
                            defaultValue={product.category ?? ""}
                            className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500">
                            Supplier
                          </label>
                          <input
                            name="supplier"
                            defaultValue={product.supplier ?? ""}
                            className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500">
                            Purchase $
                          </label>
                          <input
                            name="purchase_price"
                            type="number"
                            step="0.01"
                            defaultValue={product.purchase_price ?? 0}
                            className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500">
                            Selling $
                          </label>
                          <input
                            name="selling_price"
                            type="number"
                            step="0.01"
                            defaultValue={product.selling_price ?? 0}
                            required
                            className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500">
                            Min stock
                          </label>
                          <input
                            name="minimum_stock"
                            type="number"
                            min="0"
                            defaultValue={product.minimum_stock ?? 0}
                            required
                            className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500">
                            Status
                          </label>
                          <select
                            name="status"
                            defaultValue={product.status || "active"}
                            className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                          >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <button
                            type="submit"
                            className="w-full bg-yellow-600 text-zinc-950 font-bold px-3 py-2 rounded hover:bg-yellow-500 text-sm"
                          >
                            Save product
                          </button>
                        </div>
                      </form>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sales */}
          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-100">
                Recent Sales
              </h2>
            </div>
            {sales.length === 0 ? (
              <div className="m-6 flex flex-col items-center justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-10 text-center">
                <h3 className="text-lg font-semibold text-yellow-500">
                  No recent sales
                </h3>
                <p className="max-w-md text-sm text-zinc-500">
                  Completed POS checkouts will show up here. Add inventory and
                  ring up a sale to get started.
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-200">
                        {sale.members?.name || "Walk-in"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-400">
                        ${sale.total_amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
