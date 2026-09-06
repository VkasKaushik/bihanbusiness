'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Building,
  Tags,
  Calculator,
  FileSpreadsheet,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  TrendingUp,
  Percent,
  FlaskConical,
  Factory,
  ArrowDownRight,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CurrentUser } from '@/types';

export default function MorePage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [productCount, setProductCount] = useState<number>(3);
  const [toolModal, setToolModal] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d?.user))
      .catch(console.error);

    fetch('/api/customers')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setCustomerCount(d.length);
      })
      .catch(console.error);

    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setProductCount(d.length);
      })
      .catch(console.error);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">More & Tools</h1>
        <p className="text-xs text-slate-500">Business directory, calculators, reports and settings</p>
      </div>

      {/* ========================================================= */}
      {/* 1. PRIMARY OPERATIONAL DESTINATIONS                       */}
      {/* ========================================================= */}
      <section className="space-y-2">
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
          Operations & Masters
        </h2>

        <div className="bg-white rounded-3xl border border-[#ECEEF3] divide-y divide-slate-100 shadow-card overflow-hidden">
          {/* Customers */}
          <Link
            href="/customers"
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600">
                  Customers Directory
                </div>
                <div className="text-xs text-slate-400">
                  {customerCount} registered buyers & credit balances
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Open
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </Link>

          {/* Stock (Moved from permanent bottom nav into More) */}
          <Link
            href="/inventory"
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600">
                  Stock & Inventory
                </div>
                <div className="text-xs text-slate-400">
                  Finished 5L cans on hand & stock movements
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Manage
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </Link>

          {/* Products & Pricing */}
          <Link
            href="/products"
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Tags className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600">
                  Products & Pricing
                </div>
                <div className="text-xs text-slate-400">
                  Centralized MRP, selling prices & costs
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                {productCount} items
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </Link>

          {/* Suppliers */}
          <div
            onClick={() => setToolModal('Suppliers & Vendors')}
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900">
                  Suppliers & Vendors
                </div>
                <div className="text-xs text-slate-400">
                  Chemical, can, cap, and label suppliers
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>

          {/* Purchases */}
          <div
            onClick={() => setToolModal('Raw Material Purchases')}
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900">
                  Purchases & Inward Goods
                </div>
                <div className="text-xs text-slate-400">
                  Raw materials, packaging & vendor bills
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>

          {/* Production */}
          <div
            onClick={() => setToolModal('Production Batches')}
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900">
                  Production & Batches
                </div>
                <div className="text-xs text-slate-400">
                  Manufacturing logs & dilution batches
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. BUSINESS TOOLS & CALCULATORS                           */}
      {/* ========================================================= */}
      <section className="space-y-2">
        <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-1">
          Business Tools & Calculators
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Product Cost Calculator */}
          <div
            onClick={() => setToolModal('Product Cost Calculator')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-2xs cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-900">Product Cost</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Chemical + 5L Can + Cap + Label</div>
          </div>

          {/* Pricing Calculator */}
          <div
            onClick={() => setToolModal('Volume Pricing Calculator')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-2xs cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
              <Percent className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-900">Pricing & Margin</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Bulk tier discounts & profit margins</div>
          </div>

          {/* Dilution Calculator */}
          <div
            onClick={() => setToolModal('Dilution Calculator')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-2xs cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-900">Dilution Ratios</div>
            <div className="text-[10px] text-slate-500 mt-0.5">1:10, 1:20 mixing guides for hotels</div>
          </div>

          {/* Production Calculator */}
          <div
            onClick={() => setToolModal('Production Batch Calculator')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-2xs cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2">
              <Factory className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-900">Production Plan</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Batches, material yield & packaging</div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. REPORTS                                                */}
      {/* ========================================================= */}
      <section className="space-y-2">
        <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-1">
          Reports
        </h2>

        <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden text-xs">
          <Link href="/sales" className="p-3.5 flex items-center justify-between hover:bg-slate-50">
            <span className="font-bold text-slate-800">Sales Report (Orders & Delivery History)</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link href="/customers?filter=due" className="p-3.5 flex items-center justify-between hover:bg-slate-50">
            <span className="font-bold text-slate-800">Customer Due & Outstanding Report</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link href="/inventory" className="p-3.5 flex items-center justify-between hover:bg-slate-50">
            <span className="font-bold text-slate-800">Stock on Hand & Movement Audit Ledger</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link href="/money" className="p-3.5 flex items-center justify-between hover:bg-slate-50">
            <span className="font-bold text-slate-800">Liquid Balances & Cash/Bank Flow</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link href="/founder-expenses" className="p-3.5 flex items-center justify-between hover:bg-slate-50">
            <span className="font-bold text-slate-800">Founder Expense Split & Settlements</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. SETTINGS & FOUNDERS                                    */}
      {/* ========================================================= */}
      <section className="space-y-2">
        <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-1">
          Settings & Account
        </h2>

        <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-slate-900">
                Logged in as {user?.name || 'Founder'}
              </div>
              <div className="text-[11px] text-slate-500">
                Role: {user?.role || 'FOUNDER'} • Timezone: Asia/Kolkata
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>BIHAN BUSINESS v1.2</span>
            <span>Database: SQLite / Supabase Ready</span>
          </div>
        </div>
      </section>

      {/* Tool preview modal */}
      {toolModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">{toolModal}</h3>
            <p className="text-xs text-slate-500">
              This module uses the centralized product configuration and real transaction formulas. Scheduled for Phase 2 expansion.
            </p>
            <button
              onClick={() => setToolModal(null)}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
