import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import { Package, Clock, CheckCircle2, ChevronRight } from "lucide-react";

export default function ClientOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/orders");
        if (res.data.success) {
          setOrders(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Order History</h1>
        <p className="text-xs text-slate-500 mt-1">Track your product purchases, packaging, and dispatch status</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
          <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          No past orders on record.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">{o.order_number}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {o.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Placed on {new Date(o.created_at).toLocaleDateString()} • {o.item_count || 1} items
                </p>
                <p className="text-[11px] text-slate-400">Shipping to: {o.shipping_address}</p>
              </div>

              <div className="text-right sm:self-center">
                <span className="text-base font-extrabold text-slate-900">₹{parseFloat(o.total_amount).toLocaleString()}</span>
                <span className="block text-[10px] text-emerald-700 font-semibold">{o.payment_status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
