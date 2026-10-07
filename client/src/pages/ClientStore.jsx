import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";
import { ShoppingBag, Sparkles, Plus, Check, Star } from "lucide-react";

export default function ClientStore() {
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState(null);
  const [addedSuccessId, setAddedSuccessId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, rRes] = await Promise.all([
          api.get("/products"),
          api.get("/products/recommendations")
        ]);
        if (pRes.data.success) setProducts(pRes.data.data);
        if (rRes.data.success) setRecommendations(rRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAddToCart = async (productId) => {
    setAddingId(productId);
    try {
      await addToCart(productId, 1);
      setAddedSuccessId(productId);
      setTimeout(() => setAddedSuccessId(null), 2000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to add to cart");
    } finally {
      setAddingId(null);
    }
  };

  const recommendedProductIds = new Set(recommendations.map(r => r.product_id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Aura Life Apothecary & Wellness Store</h1>
        <p className="text-xs text-slate-500 mt-1">
          Certified organic herbal teas, physician-formulated nutritional supplements, and therapeutic Abhyanga oils
        </p>
      </div>

      {/* Practitioner Recommendations Showcase */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Recommended Specifically For You</h2>
          </div>
          <p className="text-xs text-emerald-200/80 max-w-2xl">
            These formulas have been selected by your physician or clinical nutritionist according to your biometric assessments and metabolic goals.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {recommendations.map((rec) => (
              <div key={rec.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-400 text-slate-950">
                    Prescribed by Dr. {rec.practitioner_first_name}
                  </span>
                  <h3 className="font-bold text-sm text-white mt-1">{rec.product_name}</h3>
                  <p className="text-[11px] text-emerald-100/90 leading-relaxed italic">"{rec.reason}"</p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-base font-bold text-emerald-300">₹{parseFloat(rec.price).toLocaleString()}</span>
                  <button
                    onClick={() => handleAddToCart(rec.product_id)}
                    disabled={addingId === rec.product_id}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-emerald-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {addedSuccessId === rec.product_id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Catalog */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">All Formulations & Products</h2>

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            Loading products...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              const isRec = recommendedProductIds.has(p.id);
              return (
                <div key={p.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="h-48 bg-slate-100 overflow-hidden relative">
                      <img
                        src={p.image_url || "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80"}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                      {isRec && (
                        <div className="absolute top-3 left-3 bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-3 h-3" />
                          <span>Recommended</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-700">{p.brand_name}</span>
                        <span className="text-slate-400">{p.category_name}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{p.description}</p>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Price</span>
                        <span className="text-base font-extrabold text-slate-900">₹{parseFloat(p.price).toLocaleString()}</span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(p.id)}
                        disabled={addingId === p.id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {addedSuccessId === p.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
