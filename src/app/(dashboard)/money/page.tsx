'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  Users,
  Building,
  UserCheck,
  Calendar,
  ChevronDown,
  ChevronRight,
  Sparkles,
  CreditCard,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { MoneyOverview } from '@/types';
import {
  formatCurrency,
  formatCompactCurrency,
  formatDate,
  formatRelativeDate,
} from '@/lib/formatters';
import UniversalPlusModal from '@/components/common/UniversalPlusModal';

export default function FinancialReportsPage() {
  const [data, setData] = useState<MoneyOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [plusModalOpen, setPlusModalOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<'Monthly' | 'This Week'>('Monthly');
  const [deletingTx, setDeletingTx] = useState<{ id: string; type: string; title: string; amount: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch('/api/money');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTx) return;
    setIsDeleting(true);
    try {
      const endpoint =
        deletingTx.type === 'COLLECTION'
          ? `/api/payments/customer?id=${deletingTx.id}`
          : `/api/expenses?id=${deletingTx.id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        setDeletingTx(null);
        await loadData();
      } else {
        const err = await res.json();
        alert(err?.error || 'Failed to delete transaction');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error deleting transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-white rounded-2xl w-1/2 border border-[#ECEEF3]" />
        <div className="h-56 bg-white rounded-3xl border border-[#ECEEF3]" />
        <div className="h-28 bg-white rounded-2xl border border-[#ECEEF3]" />
      </div>
    );
  }

  const monthlyBars = [
    { label: 'Week 1', h1: '65%', h2: '35%' },
    { label: 'Week 2', h1: '45%', h2: '20%' },
    { label: 'Week 3', h1: '80%', h2: '40%' },
    { label: 'Week 4', h1: '30%', h2: '15%' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Date Filter Bar matching Reference UI */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 bg-white border border-[#ECEEF3] rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-800 shadow-card">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Financial Reports (IST)</span>
        </div>

        <button
          onClick={() => setPlusModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs px-3 py-2 rounded-2xl transition-colors active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>+ Record Money</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. ANALYTICS REPORT CARD (Reference Screen 2)             */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-5 border border-[#ECEEF3] shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">Analytics Report</h3>
          <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-600 cursor-pointer">
            <span>{timeframe}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span>Income (Collections)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-200" />
            <span>Outcome (Expenses)</span>
          </div>
        </div>

        {/* Bar Chart Visualization matching Reference */}
        <div className="pt-2 pb-1">
          <div className="h-40 flex items-end justify-between gap-3 px-4 border-b border-slate-100">
            {monthlyBars.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full max-w-[32px] flex items-end justify-center gap-1 h-full">
                  <div
                    style={{ height: item.h1 }}
                    className="w-3.5 rounded-t-lg bg-indigo-600 transition-all duration-500"
                  />
                  <div
                    style={{ height: item.h2 }}
                    className="w-3.5 rounded-t-lg bg-indigo-200 transition-all duration-500"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. INCOME & OUTCOME METRIC CARDS (Reference Screen 2)     */}
      {/* ========================================================= */}
      <div className="space-y-3">
        {/* Income Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#ECEEF3] shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-500">Total Liquid Money</span>
            </div>
            <button className="text-slate-300 hover:text-slate-500">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="text-2xl font-black text-slate-900 font-tabular tracking-tight">
            {formatCurrency(data.availableMoney.total)}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 rounded-xl p-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Cash in Hand</div>
              <div className="font-bold text-slate-800 font-tabular mt-0.5">
                {formatCurrency(data.availableMoney.cash)}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase">UPI Balance</div>
              <div className="font-bold text-slate-800 font-tabular mt-0.5">
                {formatCurrency(data.availableMoney.upi)}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Bank Account</div>
              <div className="font-bold text-slate-800 font-tabular mt-0.5">
                {formatCurrency(data.availableMoney.bank)}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Due Card */}
        <Link
          href="/customers?filter=due"
          className="bg-white rounded-2xl p-4 border border-[#ECEEF3] shadow-card block hover:border-indigo-300 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-500">Customer Due</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {data.customerMoney.debtorsCount} buyers
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900 font-tabular tracking-tight">
            {formatCurrency(data.customerMoney.totalCustomerDue)}
          </div>

          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Pending collections</span>
            <span className="text-indigo-600 font-bold flex items-center group-hover:underline">
              View debtors <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </Link>

        {/* Supplier Due Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#ECEEF3] shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-500">Supplier Due</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {data.supplierMoney.suppliersCount} accounts
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900 font-tabular tracking-tight">
            {formatCurrency(data.supplierMoney.totalSupplierDue)}
          </div>

          <div className="mt-1 text-[11px] text-slate-400">
            Pending payouts for chemicals & packaging
          </div>
        </div>

        {/* Founder 50/50 Settlement Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#ECEEF3] shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-500">Founder Expense Split (50/50)</span>
            </div>
          </div>

          <div className="bg-indigo-50/70 rounded-2xl p-3 border border-indigo-100 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900">
              {data.founderMoney.settlementMessage}
            </span>
            <span className="text-[11px] font-semibold text-indigo-700">
              Total: {formatCurrency(data.founderMoney.businessOwesFounders)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {data.founderMoney.details.map((f) => (
              <div key={f.founderName} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[11px]">{f.founderName} paid:</div>
                <div className="font-extrabold text-slate-900 font-tabular text-sm mt-0.5">
                  {formatCurrency(f.paidPersonally)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. RECENT TRANSACTIONS FEED                               */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-5 border border-[#ECEEF3] shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">Recent Cash & Bank Transactions</h3>
          <span className="text-[11px] text-slate-400 font-medium">Real-time ledger</span>
        </div>

        {data.recentTransactions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No payments or expenses recorded yet. Tap "+ Record Money" to add one.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentTransactions.map((tx) => {
              const isCollection = tx.type === 'COLLECTION';
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCollection
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isCollection ? (
                        <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{tx.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {tx.subtitle} • {formatRelativeDate(tx.date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`font-black font-tabular text-sm ${
                          isCollection ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isCollection ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{tx.method}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeletingTx({ id: tx.id, type: tx.type, title: tx.title, amount: tx.amount })}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Delete Transaction?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete this {deletingTx.type === 'COLLECTION' ? 'customer collection' : 'expense'} of{' '}
                <span className="font-bold text-slate-800">{formatCurrency(deletingTx.amount)}</span> ({deletingTx.title})?
              </p>
              <p className="text-[11px] text-amber-600 font-medium pt-1">
                This will recalculate balances and cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingTx(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-rose-200"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
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
