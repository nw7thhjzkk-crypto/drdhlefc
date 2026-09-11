"use client";

import { useState } from "react";
import { processSale } from "./actions";
import { formatINR } from "@/lib/currency";

type Member = { id: string; name: string };
type Product = { id: string; name: string; selling_price: number; stock_quantity: number; status: string };
type CartItem = { product: Product; quantity: number };

export default function POSCart({ members, products }: { members: Member[]; products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [memberId, setMemberId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const activeProducts = products.filter(p => p.stock_quantity > 0 && p.status !== "inactive");

  const handleAddToCart = () => {
    if (!selectedProductId) return;

    const product = activeProducts.find(p => p.id === selectedProductId);
    if (!product) return;

    if (quantity < 1) return;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });

    setQuantity(1);
    setSelectedProductId("");
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0);

  const cartPayload = cart.map(item => ({ product_id: item.product.id, quantity: item.quantity }));

  return (
    <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6">
      <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">
        New Sale (POS)
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400">
            Member (Optional)
          </label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
          >
            <option value="">Walk-in Customer</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {activeProducts.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">No active products available.</p>
        ) : (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-400">
                Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              >
                <option value="">Select product...</option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatINR(p.selling_price)} ({p.stock_quantity} in stock)
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-zinc-400">
                Qty
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              />
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedProductId || quantity < 1}
              className="bg-zinc-800 text-yellow-500 font-bold px-4 py-2 rounded hover:bg-zinc-700 transition-colors border border-zinc-700 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        )}

        {cart.length > 0 && (
          <div className="mt-6 border border-zinc-800 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                {cart.map(item => (
                  <tr key={item.product.id}>
                    <td className="px-4 py-2 text-sm text-zinc-200">{item.product.name}</td>
                    <td className="px-4 py-2 text-sm text-zinc-200">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm text-zinc-200">{formatINR(item.product.selling_price * item.quantity)}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="text-red-500 hover:text-red-400 font-bold text-xs"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-950">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm font-bold text-zinc-400 text-right">Total:</td>
                  <td colSpan={2} className="px-4 py-3 text-sm font-bold text-green-400">{formatINR(totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {cart.length > 0 && (
          <form
            action={async (formData) => {
              await processSale(formData);
              setCart([]);
              setMemberId("");
            }}
            className="mt-4"
          >
            <input type="hidden" name="member_id" value={memberId} />
            <input type="hidden" name="items" value={JSON.stringify(cartPayload)} />
            <input type="hidden" name="payment_method" value={paymentMethod} />

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white font-bold px-4 py-3 rounded hover:bg-green-500 transition-colors"
            >
              Checkout ({formatINR(totalAmount)})
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
