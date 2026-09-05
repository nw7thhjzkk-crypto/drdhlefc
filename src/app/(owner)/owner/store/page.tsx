import { createClient } from "@/utils/supabase/server";
import { createProduct, processSale } from "./actions";

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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Store & POS</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* POS Flow */}
        <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">New Sale (POS)</h2>
          <form action={async (formData) => { "use server"; await processSale(formData); }} className="space-y-4">
             <div>
              <label className="block text-sm font-medium text-zinc-400">Member (Optional)</label>
              <select name="member_id" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
                <option value="">Walk-in Customer</option>
                {members?.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Product</label>
              <select name="product_id" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
                <option value="">Select product...</option>
                {products?.filter(p => p.stock_quantity > 0).map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ${p.selling_price} ({p.stock_quantity} in stock)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Quantity</label>
              <input name="quantity" type="number" min="1" defaultValue="1" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white font-bold px-4 py-2 rounded hover:bg-green-500 transition-colors">
              Complete Sale (Cash)
            </button>
          </form>

          <div className="mt-8 border-t border-zinc-800 pt-6">
              <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">Add New Product</h2>
              <form action={createProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400">Product Name</label>
                        <input name="name" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400">SKU</label>
                        <input name="sku" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400">Selling Price</label>
                        <input name="selling_price" type="number" step="0.01" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400">Initial Stock</label>
                        <input name="stock_quantity" type="number" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400">Min Stock</label>
                        <input name="minimum_stock" type="number" defaultValue="5" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
                    </div>
                </div>
                <button type="submit" className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors">
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
            <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-950">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Stock</th>
                </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                {products?.map((product) => (
                    <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-zinc-200">{product.name}</div>
                        <div className="text-xs text-zinc-500">SKU: {product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        ${product.selling_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${product.stock_quantity > product.minimum_stock ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                            {product.stock_quantity}
                        </span>
                    </td>
                    </tr>
                ))}
                {(!products || products.length === 0) && (
                    <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">Inventory empty.</td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>

            {/* Recent Sales */}
            <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-100">Recent Sales</h2>
            </div>
            <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-950">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Total</th>
                </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                {recentSales?.map((sale) => (
                    <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {new Date(sale.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-200">
                        {sale.members?.name || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-400">
                        ${sale.total_amount}
                    </td>
                    </tr>
                ))}
                {(!recentSales || recentSales.length === 0) && (
                    <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">No recent sales.</td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        </div>

      </div>
    </div>
  );
}
