'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Calendar,
  ChevronDown,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatDate, formatTime, formatRelativeDate } from '@/lib/formatters';
import { ProductStockSummary } from '@/types';
import UniversalPlusModal from '@/components/common/UniversalPlusModal';

export default function StockTrackingPage() {
  const [products, setProducts] = useState<ProductStockSummary[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [loading, setLoading] = useState(true);
  const [plusModalOpen, setPlusModalOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<'Monthly' | 'This Week'>('Monthly');

  const loadData = async () => {
    try {
      const [invRes, movRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/inventory/movements'),
      ]);
      if (invRes.ok) setProducts(await invRes.json());
      if (movRes.ok) setMovements(await movRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-4">
      {/* 1. Header with Add Stock Trigger */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 bg-white border border-[#ECEEF3] rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-800 shadow-card">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Stock Tracking (IST)</span>
        </div>

        <button
          onClick={() => setPlusModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs px-3 py-2 rounded-2xl transition-colors active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>+ Add Stock / Batch</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. STOCK REPORT CARD WITH LINE CHART (Reference Screen 3) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-5 border border-[#ECEEF3] shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">Stock Report</h3>
          <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-600 cursor-pointer">
            <span>{timeframe}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span>Stock In (Manufactured)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-200" />
            <span>Stock Out (Delivered)</span>
          </div>
        </div>

        {/* Line Chart Visualization matching Reference */}
        <div className="pt-2 pb-2">
          <div className="h-36 w-full relative flex flex-col justify-between">
            {/* Grid lines */}
            <div className="w-full border-b border-slate-100 h-0" />
            <div className="w-full border-b border-slate-100 h-0" />
            <div className="w-full border-b border-slate-100 h-0" />

            {/* SVG Line Chart */}
            <svg
              viewBox="0 0 350 120"
              className="w-full h-full absolute inset-0 overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Secondary faint line (Stock Out) */}
              <path
                d="M 10 90 Q 60 70, 110 80 T 210 50 T 280 65 T 340 30"
                fill="none"
                stroke="#E0E3FD"
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
              {/* Primary vibrant line (Stock In) */}
              <path
                d="M 10 95 L 60 70 L 115 85 L 175 45 L 230 75 L 290 30 L 340 20"
                fill="none"
                stroke="#5046E5"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Glowing Points */}
              <circle cx="10" cy="95" r="3.5" fill="#5046E5" />
              <circle cx="60" cy="70" r="3.5" fill="#5046E5" />
              <circle cx="115" cy="85" r="3.5" fill="#5046E5" />
              <circle cx="175" cy="45" r="4.5" fill="#5046E5" />
              <circle cx="230" cy="75" r="3.5" fill="#5046E5" />
              <circle cx="290" cy="30" r="4.5" fill="#5046E5" />
              <circle cx="340" cy="20" r="5" fill="#5046E5" stroke="#FFFFFF" strokeWidth="2" />
            </svg>
          </div>

          {/* Days on X-Axis */}
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-2 px-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. TABS: FINISHED CANS VS MOVEMENTS                       */}
      {/* ========================================================= */}
      <div className="flex bg-white p-1 rounded-2xl border border-[#ECEEF3] shadow-2xs">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'stock'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Finished Goods (Cans)
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'movements'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Audit Ledger (Movements)
        </button>
      </div>

      {/* ========================================================= */}
      {/* 4. CONTENT LIST                                           */}
      {/* ========================================================= */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading inventory data...</div>
      ) : activeTab === 'stock' ? (
        /* Finished Product Cards */
        <div className="space-y-3">
          {products.map((prod, idx) => (
            <div
              key={prod.id}
              className={`p-4 rounded-3xl border transition-all ${
                prod.isLowStock
                  ? 'bg-amber-50/70 border-amber-300 shadow-card'
                  : 'bg-white border-[#ECEEF3] shadow-card'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl shrink-0">
                    {prod.imageEmoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {prod.name}
                      </h4>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      SKU: <span className="font-mono">{prod.sku}</span> • Selling Price: {formatCurrency(prod.currentSellingPrice)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-2xl font-black font-tabular ${
                      prod.isLowStock ? 'text-amber-700' : 'text-slate-900'
                    }`}
                  >
                    {prod.currentStock}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Cans Ready</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500">
                  Min Alert: <strong className="text-slate-700">{prod.minStockAlertLevel} cans</strong>
                </div>
                <div>
                  {prod.isLowStock ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Low Stock!
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      In Stock ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Movements Audit Ledger */
        <div className="bg-white rounded-3xl p-5 border border-[#ECEEF3] shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Stock Movements History</h3>
            <span className="text-[11px] text-slate-400 font-medium">Immutable ledger</span>
          </div>

          {movements.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No stock movements found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {movements.map((mov) => {
                const isPositive = mov.quantityChange > 0;
                return (
                  <div key={mov.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base ${
                          isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {mov.product?.imageEmoji || '📦'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {mov.product?.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {mov.notes || mov.movementType} • {formatRelativeDate(mov.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`font-black font-tabular text-sm shrink-0 ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {mov.quantityChange} cans
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Universal Plus Modal */}
      <UniversalPlusModal
        isOpen={plusModalOpen}
        onClose={() => setPlusModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
