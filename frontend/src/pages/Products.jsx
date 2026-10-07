import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import { productService } from "../services/productService.js";
import { clientService } from "../services/clientService.js";
import api from "../services/api.js";
import { Plus, Edit2, Search, Trash2, Send, Tag } from "lucide-react";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Product Add/Edit Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    brandId: "",
    description: "",
    price: "",
    costPrice: "",
    taxRate: 18,
    imageUrl: "",
    isActive: true
  });

  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const res = await api.post("/products/categories", { name: newCatName.trim() });
      if (res.data.success) {
        const created = res.data.data;
        setCategories((prev) => [...prev, created]);
        setProductForm((prev) => ({ ...prev, categoryId: created.id }));
        setNewCatName("");
        setShowNewCat(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to create category");
    } finally {
      setCreatingCat(false);
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    setCreatingBrand(true);
    try {
      const res = await api.post("/products/brands", { name: newBrandName.trim() });
      if (res.data.success) {
        const created = res.data.data;
        setBrands((prev) => [...prev, created]);
        setProductForm((prev) => ({ ...prev, brandId: created.id }));
        setNewBrandName("");
        setShowNewBrand(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to create brand");
    } finally {
      setCreatingBrand(false);
    }
  };

  // Recommendation modal
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recClient, setRecClient] = useState("");
  const [recReason, setRecReason] = useState("");
  const [recDosage, setRecDosage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes, bRes, clRes] = await Promise.all([
        productService.getAll(),
        productService.getCategories(),
        productService.getBrands(),
        clientService.getAll({ limit: 100 })
      ]);
      if (pRes.success) setProducts(pRes.data);
      if (cRes.success) setCategories(cRes.data);
      if (bRes.success) setBrands(bRes.data);
      if (clRes.success) setClients(clRes.data);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      categoryId: categories.length > 0 ? categories[0].id : "",
      brandId: brands.length > 0 ? brands[0].id : "",
      description: "",
      price: "",
      costPrice: "",
      taxRate: 18,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
      isActive: true
    });
    setIsProductModalOpen(true);
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name || "",
      sku: p.sku || "",
      categoryId: p.category_id || "",
      brandId: p.brand_id || "",
      description: p.description || "",
      price: p.price || "",
      costPrice: p.cost_price || "",
      taxRate: p.tax_rate ?? 18,
      imageUrl: p.image_url || "",
      isActive: p.is_active !== false
    });
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku || !productForm.price) {
      alert("Name, SKU, and Retail Price are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        sku: productForm.sku.trim().toUpperCase(),
        categoryId: productForm.categoryId ? parseInt(productForm.categoryId) : null,
        brandId: productForm.brandId ? parseInt(productForm.brandId) : null,
        description: productForm.description,
        price: parseFloat(productForm.price),
        costPrice: parseFloat(productForm.costPrice || 0),
        taxRate: parseFloat(productForm.taxRate || 0),
        imageUrl: productForm.imageUrl,
        isActive: productForm.isActive
      };

      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
      } else {
        await productService.create(payload);
      }

      setIsProductModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate "${name}"?`)) return;
    try {
      await productService.delete(id);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to deactivate product");
    }
  };

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

  const filtered = products.filter((p) => {
    const matchesCat = !selectedCategory || p.category_id === parseInt(selectedCategory);
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand_name && p.brand_name.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Products & Clinical Formulations Master"
        subtitle="Herbal teas, therapeutic oils, clean nutrition supplements, and practitioner prescription catalog"
        actions={
          <button
            onClick={openAddProduct}
            className="crm-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3.5 flex-1 max-w-full">
        {/* Controls: Search & Category */}
        <div className="crm-card p-2 sm:p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex flex-1 w-full sm:w-auto items-center gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by title, SKU, brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="crm-input pl-8 w-full"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="crm-input w-44"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="text-[11px] font-medium text-slate-500 self-end sm:self-center">
            Showing <span className="font-bold text-slate-900">{filtered.length}</span> of {products.length} products
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading product catalog...
          </div>
        ) : filtered.length === 0 ? (
          <div className="crm-card py-12 text-center text-slate-400 text-xs">
            No products match your filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <div key={p.id} className="crm-card overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
                <div>
                  <div className="h-32 bg-slate-100 overflow-hidden relative">
                    <img
                      src={p.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-white/95 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-800 shadow-xs border border-slate-200">
                      SKU: {p.sku}
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-blue-700">{p.brand_name || "VGT Herbals"}</span>
                      <span className="text-slate-400 font-medium">{p.category_name || "General"}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {p.description || "Authentic wellness formulation with verified ingredients."}
                    </p>
                  </div>
                </div>

                <div className="p-3 pt-0">
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Retail Price</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900">
                          ₹{parseFloat(p.price).toLocaleString()}
                        </span>
                        {p.cost_price > 0 && (
                          <span className="text-[10px] text-slate-400">
                            (Cost: ₹{parseFloat(p.cost_price).toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditProduct(p)}
                        className="crm-btn-secondary text-[11px] h-7 px-2 inline-flex items-center gap-1 text-slate-700 hover:text-blue-700"
                        title="Edit Product"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setIsRecModalOpen(true);
                        }}
                        className="crm-btn-primary text-[11px] h-7 px-2.5"
                        title="Prescribe to Client"
                      >
                        <span>Recommend</span>
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="crm-btn-secondary text-[11px] h-7 px-2 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                        title="Deactivate Product"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Product */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : "Add New Clinical Product"}
      >
        <form onSubmit={handleProductSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="crm-input w-full"
                placeholder="e.g. Ashwagandha Organic Sleep Elixir 100ml"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU / Item Code *</label>
              <input
                type="text"
                required
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                className="crm-input w-full font-mono uppercase"
                placeholder="SKU-ASHWA-01"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Category</label>
                <button
                  type="button"
                  onClick={() => setShowNewCat(!showNewCat)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                >
                  {showNewCat ? "Cancel" : "+ New"}
                </button>
              </div>

              {showNewCat ? (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="New category..."
                    className="crm-input flex-1 py-1 text-xs"
                  />
                  <button
                    type="button"
                    disabled={creatingCat || !newCatName.trim()}
                    onClick={handleCreateCategory}
                    className="crm-btn-primary py-1 px-2.5 text-xs h-7"
                  >
                    {creatingCat ? "Adding..." : "Add"}
                  </button>
                </div>
              ) : null}

              <select
                value={productForm.categoryId}
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                className="crm-input w-full"
              >
                <option value="">-- Select Category ({categories.length} available) --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Brand / Formulation Line</label>
                <button
                  type="button"
                  onClick={() => setShowNewBrand(!showNewBrand)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                >
                  {showNewBrand ? "Cancel" : "+ New"}
                </button>
              </div>

              {showNewBrand ? (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <input
                    type="text"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="New brand..."
                    className="crm-input flex-1 py-1 text-xs"
                  />
                  <button
                    type="button"
                    disabled={creatingBrand || !newBrandName.trim()}
                    onClick={handleCreateBrand}
                    className="crm-btn-primary py-1 px-2.5 text-xs h-7"
                  >
                    {creatingBrand ? "Adding..." : "Add"}
                  </button>
                </div>
              ) : null}

              <select
                value={productForm.brandId}
                onChange={(e) => setProductForm({ ...productForm, brandId: e.target.value })}
                className="crm-input w-full"
              >
                <option value="">-- Select Brand ({brands.length} available) --</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Retail Selling Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="crm-input w-full"
                placeholder="e.g. 1250"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase / Cost Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={productForm.costPrice}
                onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                className="crm-input w-full"
                placeholder="e.g. 750"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax Rate (GST %)</label>
              <select
                value={productForm.taxRate}
                onChange={(e) => setProductForm({ ...productForm, taxRate: e.target.value })}
                className="crm-input w-full"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST (Supplements standard)</option>
                <option value="18">18% GST (Cosmetics standard)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Product Image URL</label>
              <input
                type="url"
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                className="crm-input w-full"
                placeholder="https://..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Clinical Description & Ingredients</label>
              <textarea
                rows={3}
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="crm-input w-full"
                placeholder="Usage indications, therapeutic benefits, active ingredients..."
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="pActive"
                checked={productForm.isActive}
                onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="pActive" className="text-slate-700 font-medium cursor-pointer">
                Active for Prescription & Sale
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="crm-btn-primary"
            >
              {submitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

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
              className="crm-input w-full"
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
              className="crm-input w-full"
              placeholder="e.g. Recommended as part of metabolic fat loss and circadian sleep reset..."
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dosage & Frequency Instructions</label>
            <input
              type="text"
              value={recDosage}
              onChange={(e) => setRecDosage(e.target.value)}
              className="crm-input w-full"
              placeholder="e.g. 10ml with lukewarm water before bedtime daily for 30 days"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRecModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="crm-btn-primary"
            >
              {submitting ? "Saving..." : "Prescribe Formulation"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
