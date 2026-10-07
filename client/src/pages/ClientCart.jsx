import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import api from "../services/api.js";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function ClientCart() {
  const { cart, updateQuantity, fetchCart } = useCart();
  const navigate = useNavigate();

  // Checkout dialog states
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("Flat 402, Green Acres Apt, Indiranagar, Bengaluru, 560038");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [notes, setNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!shippingAddress) return;
    setPlacingOrder(true);
    try {
      const res = await api.post("/orders/checkout", {
        shippingAddress,
        paymentMethod,
        notes
      });
      if (res.data.success) {
        setOrderSuccess(res.data.data.order);
        fetchCart();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Order Placed & Paid!</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Order <strong>{orderSuccess.order_number}</strong> for ₹{orderSuccess.total_amount} has been processed. Stock deducted and tax invoice issued.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link
            to="/orders"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs"
          >
            Track in My Orders
          </Link>
          <Link
            to="/store"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Shopping Cart</h1>
        <p className="text-xs text-slate-500 mt-1">Review formulations and finalize your wellness order</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-3">
          <ShoppingCart className="w-12 h-12 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-700 text-sm">Your cart is empty</p>
          <p className="text-xs text-slate-400">Browse practitioner recommendations or the wellness apothecary</p>
          <Link
            to="/store"
            className="mt-3 inline-block px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items list */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={item.image_url || "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=200&q=80"}
                    alt={item.product_name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.product_name}</h3>
                    <p className="text-xs font-mono text-slate-400">{item.sku}</p>
                    <p className="text-xs font-extrabold text-emerald-700 mt-1">
                      ₹{parseFloat(item.unit_price).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-extrabold text-slate-900 text-sm min-w-[70px] text-right">
                    ₹{(item.quantity * parseFloat(item.unit_price)).toLocaleString()}
                  </span>

                  <button
                    onClick={() => updateQuantity(item.product_id, 0)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary & Checkout Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5 h-fit">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Order Summary</h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">₹{cart?.subtotal?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST Tax</span>
                <span className="font-bold text-slate-900">₹{cart?.tax?.toLocaleString() || 0}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between text-base font-extrabold text-slate-900">
                <span>Total Amount</span>
                <span className="text-emerald-700">₹{cart?.total?.toLocaleString() || 0}</span>
              </div>
            </div>

            {!isCheckingOut ? (
              <button
                onClick={() => setIsCheckingOut(true)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shipping Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={placingOrder}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {placingOrder ? "Processing Payment & Order..." : `Pay ₹${cart?.total} & Complete Order`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
