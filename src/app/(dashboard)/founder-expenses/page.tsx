'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  UserCheck,
  Building,
  Receipt,
  CheckCircle2,
  Clock,
  X,
  CreditCard,
  User,
  Calendar,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/formatters';

interface FounderExpenseTransaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  paidBy: string;
  paidByUsername: string;
  paymentSource: string;
  paymentMethodLabel: string;
  notes: string | null;
  receiptUrl: string | null;
  isSettled: boolean;
  settlementStatus: string;
}

interface FounderExpensesData {
  summary: {
    totalPaidByBusiness: number;
    totalPaidPersonally: number;
    totalBusinessOwesFounder: number;
    totalReimbursed: number;
    settlementMessage: string;
    founderBreakdown: Array<{
      founderName: string;
      paidPersonally: number;
    }>;
  };
  transactions: FounderExpenseTransaction[];
}

export default function FounderExpensesPage() {
  const [data, setData] = useState<FounderExpensesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'FOUNDER_PERSONAL' | 'BUSINESS'>('ALL');
  const [selectedTransaction, setSelectedTransaction] = useState<FounderExpenseTransaction | null>(null);

  useEffect(() => {
    fetch('/api/founder-expenses')
      .then((res) => res.json())
      .then((resData) => {
        if (resData?.summary) {
          setData(resData);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-4 animate-pulse pt-2">
        <div className="h-10 bg-slate-200 rounded-xl w-48" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-white rounded-2xl border border-[#ECEEF3]" />
          <div className="h-24 bg-white rounded-2xl border border-[#ECEEF3]" />
          <div className="h-24 bg-white rounded-2xl border border-[#ECEEF3]" />
          <div className="h-24 bg-white rounded-2xl border border-[#ECEEF3]" />
        </div>
        <div className="h-44 bg-white rounded-2xl border border-[#ECEEF3]" />
      </div>
    );
  }

  const filteredTransactions = data.transactions.filter((tx) => {
    if (filter === 'FOUNDER_PERSONAL') return tx.paymentSource === 'FOUNDER_PERSONAL';
    if (filter === 'BUSINESS') return tx.paymentSource !== 'FOUNDER_PERSONAL';
    return true;
  });

  return (
    <div className="space-y-5 pt-1 pb-10">
      {/* 1. HEADER WITH BACK NAVIGATION */}
      <div className="flex items-center gap-3 pt-1">
        <Link
          href="/"
          className="w-9 h-9 rounded-xl bg-white border border-[#ECEEF3] shadow-card flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
            Founder Settlements
          </h1>
          <p className="text-[11px] font-medium text-slate-400">
            Personal expenses & business reimbursements
          </p>
        </div>
      </div>

      {/* 2. FOUR SUMMARY METRICS */}
      <section className="space-y-2">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-0.5">
          Settlement Overview
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Total Paid by Business */}
          <div className="bg-blue-50/40 border border-blue-100/80 rounded-2xl p-3.5 shadow-card">
            <div className="text-xs font-semibold text-blue-700/80">
              Paid by Business
            </div>
            <div className="text-2xl font-black text-slate-900 font-tabular tracking-tight mt-1">
              {formatCurrency(data.summary.totalPaidByBusiness)}
            </div>
            <div className="text-[10px] text-blue-600/70 mt-1 font-medium">
              Direct company cash & bank
            </div>
          </div>

          {/* Total Paid Personally */}
          <div className="bg-purple-50/40 border border-purple-100/80 rounded-2xl p-3.5 shadow-card">
            <div className="text-xs font-semibold text-purple-700/80">
              Paid by Founders
            </div>
            <div className="text-2xl font-black text-purple-900 font-tabular tracking-tight mt-1">
              {formatCurrency(data.summary.totalPaidPersonally)}
            </div>
            <div className="text-[10px] text-purple-600/70 mt-1 font-medium">
              From personal accounts
            </div>
          </div>

          {/* Business Owes Founder */}
          <div className="bg-amber-50/40 border border-amber-100/80 rounded-2xl p-3.5 shadow-card">
            <div className="text-xs font-semibold text-amber-800/90">
              Business Owes Founder
            </div>
            <div className="text-2xl font-black text-amber-900 font-tabular tracking-tight mt-1">
              {formatCurrency(data.summary.totalBusinessOwesFounder)}
            </div>
            <div className="text-[10px] text-amber-700/70 mt-1 font-medium">
              Pending reimbursement
            </div>
          </div>

          {/* Total Reimbursed */}
          <div className="bg-emerald-50/40 border border-emerald-100/80 rounded-2xl p-3.5 shadow-card">
            <div className="text-xs font-semibold text-emerald-700/90">
              Total Reimbursed
            </div>
            <div className="text-2xl font-black text-emerald-700 font-tabular tracking-tight mt-1">
              {formatCurrency(data.summary.totalReimbursed)}
            </div>
            <div className="text-[10px] text-emerald-600/70 mt-1 font-medium">
              Settled to founders
            </div>
          </div>
        </div>
      </section>

      {/* 3. 50/50 SPLIT & FOUNDER BREAKDOWN */}
      <div className="bg-white rounded-2xl p-4 border border-[#ECEEF3] shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                50/50 Founder Settlement
              </div>
              <div className="text-[11px] text-slate-400">
                Equal partner split calculation
              </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100/80 flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-900">
            {data.summary.settlementMessage}
          </span>
          <span className="text-[11px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-100">
            50% Rule
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {data.summary.founderBreakdown.map((f) => (
            <div
              key={f.founderName}
              className="p-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div className="text-[11px] font-medium text-slate-500">
                {f.founderName} paid:
              </div>
              <div className="text-base font-black text-slate-900 font-tabular mt-0.5">
                {formatCurrency(f.paidPersonally)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. COMPLETE EXPENSE / SETTLEMENT HISTORY */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Expense & Settlement History
          </div>
          <div className="text-xs font-medium text-slate-400">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'record' : 'records'}
          </div>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({data.transactions.length})
          </button>
          <button
            onClick={() => setFilter('FOUNDER_PERSONAL')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === 'FOUNDER_PERSONAL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Founder Paid
          </button>
          <button
            onClick={() => setFilter('BUSINESS')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === 'BUSINESS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Business Paid
          </button>
        </div>

        {/* Transaction Rows */}
        <div className="bg-white rounded-2xl border border-[#ECEEF3] shadow-card divide-y divide-slate-100 overflow-hidden">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => {
              const isPending = tx.settlementStatus === 'Pending Reimbursement';
              const isReimbursed = tx.settlementStatus === 'Reimbursed';

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTransaction(tx)}
                  className="p-3.5 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {tx.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPending
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                              : isReimbursed
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                              : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          {tx.settlementStatus}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-900 truncate">
                        {tx.notes || tx.category}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <span>Paid by {tx.paidBy}</span>
                        <span>•</span>
                        <span>{tx.paymentMethodLabel}</span>
                        <span>•</span>
                        <span>{formatDateTime(tx.date)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-slate-900 font-tabular">
                        {formatCurrency(tx.amount)}
                      </div>
                      <div className="text-[10px] font-semibold text-indigo-600 group-hover:underline flex items-center justify-end mt-1">
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No transactions found for this filter
            </div>
          )}
        </div>
      </section>

      {/* 5. INDIVIDUAL TRANSACTION DETAIL MODAL */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Transaction Details
                </h3>
                <p className="text-[11px] text-slate-400">
                  ID: {selectedTransaction.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Amount Banner */}
            <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
              <div className="text-xs font-semibold text-slate-500">Expense Amount</div>
              <div className="text-3xl font-black text-slate-900 font-tabular tracking-tight mt-1">
                {formatCurrency(selectedTransaction.amount)}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold">
                <span
                  className={`px-2.5 py-0.5 rounded-full ${
                    selectedTransaction.settlementStatus === 'Pending Reimbursement'
                      ? 'bg-amber-100 text-amber-900'
                      : selectedTransaction.settlementStatus === 'Reimbursed'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {selectedTransaction.settlementStatus}
                </span>
              </div>
            </div>

            {/* Details List */}
            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Date & Time</span>
                </div>
                <div className="font-bold text-slate-900">
                  {formatDateTime(selectedTransaction.date)}
                </div>
              </div>

              <div className="pt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Category</span>
                </div>
                <div className="font-bold text-slate-900">
                  {selectedTransaction.category}
                </div>
              </div>

              <div className="pt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Paid By</span>
                </div>
                <div className="font-bold text-slate-900">
                  {selectedTransaction.paidBy} ({selectedTransaction.paidByUsername})
                </div>
              </div>

              <div className="pt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Payment Method</span>
                </div>
                <div className="font-bold text-slate-900">
                  {selectedTransaction.paymentMethodLabel}
                </div>
              </div>

              <div className="pt-2.5 flex items-start justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <span>Notes / Purpose</span>
                </div>
                <div className="font-medium text-slate-800 text-right max-w-[200px]">
                  {selectedTransaction.notes || 'No notes provided'}
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedTransaction(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors active:scale-98"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
