import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import { productService } from "../services/productService.js";
import { clientService } from "../services/clientService.js";
import { ShoppingBag, Plus, Sparkles, Tag, Check, Boxes, User } from "lucide-react";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recommendation modal
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recClient, setRecClient] = useState("");
  const [recReason, setRecReason] = useState("");
  const [recDosage, setRecDosage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, cRes, clRes] = await Promise.all([
          productService.getAll(),
          productService.getCategories(),
          clientService.getAll({ limit: 100 })
        ]);
        if (pRes.success) setProducts(pRes.data);
        if (cRes.success) setCategories(cRes.data);
        if (clRes.success) setClients(clRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRecommend = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !recClient || !recReason) return;
    setSubmitting(true);
    try {
      await productService.createRecommendation({
        productId: selectedProduct.id,
        clientId: parseInt(recClient),
        reason: recReason,
        dosageNotes: recDosage
      });
      setIsRecModalOpen(false);
      setRecReason("");
      setRecDosage("");
      alert("Product recommended to client's portal!");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to recommend product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Products & Clinical Formulations"
        subtitle="Herbal teas, therapeutic oils, clean nutrition supplements, and practitioner prescription engine"
      />

      <div className="p-8 space-y-6 flex-1">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2" />
            Loading product catalog...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="h-44 bg-slate-100 overflow-hidden relative">
                    <img
                      src={p.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-extrabold text-slate-800 shadow-xs">
                      SKU: {p.sku}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-700">{p.brand_name}</span>
                      <span className="text-slate-400 font-medium">{p.category_name}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{p.name}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{p.description}</p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Retail Price</span>
                      <span className="text-lg font-bold text-slate-900">₹{parseFloat(p.price).toLocaleString()}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedProduct(p);
                        setIsRecModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Recommend to Client</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Practitioner Recommendation Modal */}
      <Modal
        isOpen={isRecModalOpen}
        onClose={() => setIsRecModalOpen(false)}
        title={`Recommend ${selectedProduct?.name}`}
      >
        <form onSubmit={handleRecommend} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Client *</label>
            <select
              required
              value={recClient}
              onChange={(e) => setRecClient(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              <option value="">-- Choose Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.client_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Rationale & Why Recommended *</label>
            <textarea
              rows={2}
              required
              value={recReason}
              onChange={(e) => setRecReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder="e.g. Recommended as part of metabolic fat loss and circadian sleep reset..."
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dosage / Usage Instructions</label>
            <input
              type="text"
              value={recDosage}
              onChange={(e) => setRecDosage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder="e.g. 1 scoop in 250ml water after workout; or 1 cup tea 30 min after dinner"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRecModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Recommending..." : "Send Recommendation"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
