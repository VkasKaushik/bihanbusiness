'use client';

import { useState, useEffect } from 'react';
import { Tags, Edit2, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { ProductStockSummary } from '@/types';
import { ProductImage } from '@/components/common/ProductImage';

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductStockSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit fields
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editMrp, setEditMrp] = useState<number>(0);
  const [editCost, setEditCost] = useState<number>(0);
  const [editMinStock, setEditMinStock] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const startEdit = (prod: ProductStockSummary) => {
    setEditingId(prod.id);
    setEditPrice(prod.currentSellingPrice);
    setEditMrp(prod.mrp);
    setEditCost(prod.currentEstimatedCost);
    setEditMinStock(prod.minStockAlertLevel);
  };

  const handleSavePricing = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          mrp: editMrp,
          currentSellingPrice: editPrice,
          currentEstimatedCost: editCost,
          minStockAlertLevel: editMinStock,
        }),
      });

      if (res.ok) {
        setEditingId(null);
        await loadProducts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Product Master</h1>
          <p className="text-xs text-slate-500">Centralized pricing, MRP & cost configuration</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-900 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p>
          Changes made here instantly update across all sales modals, order receipts, and profit
          calculators without modifying historical records.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading products...</div>
      ) : (
        <div className="space-y-3">
          {products.map((prod) => {
            const isEditing = editingId === prod.id;
            const unitMargin = prod.currentSellingPrice - prod.currentEstimatedCost;
            const marginPct =
              prod.currentSellingPrice > 0
                ? Math.round((unitMargin / prod.currentSellingPrice) * 100)
                : 0;

            return (
              <div
                key={prod.id}
                className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-xs">
                      <ProductImage product={prod} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {prod.name}
                      </h3>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        SKU: <span className="font-mono">{prod.sku}</span> • 5 Litres
                      </div>
                    </div>
                  </div>

                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(prod)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Edit Price & Cost"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSavePricing(prod.id)}
                        disabled={submitting}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs hover:bg-emerald-700"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {!isEditing ? (
                  /* Standard View */
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-2xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">MRP</div>
                      <div className="text-sm font-extrabold text-slate-700 font-tabular line-through decoration-slate-400">
                        {formatCurrency(prod.mrp)}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-2 rounded-2xl border border-blue-100">
                      <div className="text-[10px] text-blue-600 font-bold uppercase">Selling Price</div>
                      <div className="text-sm font-extrabold text-blue-900 font-tabular">
                        {formatCurrency(prod.currentSellingPrice)}
                      </div>
                    </div>

                    <div className="bg-emerald-50 p-2 rounded-2xl border border-emerald-100">
                      <div className="text-[10px] text-emerald-700 font-bold uppercase">Unit Profit</div>
                      <div className="text-sm font-extrabold text-emerald-800 font-tabular">
                        {formatCurrency(unitMargin)}
                        <span className="text-[10px] font-normal block text-emerald-600">
                          {marginPct}% margin
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Edit Form */
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">MRP (₹)</label>
                        <input
                          type="number"
                          value={editMrp}
                          onChange={(e) => setEditMrp(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-1.5 text-xs font-bold font-tabular"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-blue-600 block mb-0.5">Selling Price (₹)</label>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          className="w-full bg-blue-50 border border-blue-300 rounded-xl px-2 py-1.5 text-xs font-bold font-tabular text-blue-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Cost (₹)</label>
                        <input
                          type="number"
                          value={editCost}
                          onChange={(e) => setEditCost(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-1.5 text-xs font-bold font-tabular"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
