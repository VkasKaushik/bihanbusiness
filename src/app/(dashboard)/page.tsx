'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { DashboardSummary } from '@/types';
import { formatCurrency, formatRelativeDate } from '@/lib/formatters';

export default function OverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    try {
      const res = await fetch('/api/dashboard/summary');
      if (res.ok) {
        setSummary(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading || !summary) {
    return (
      <div className="space-y-4 animate-pulse pt-2">
        <div className="h-6 bg-slate-200 rounded-lg w-36" />
        <div className="h-36 bg-white rounded-2xl border border-[#ECEEF3]" />
        <div className="h-28 bg-white rounded-2xl border border-[#ECEEF3]" />
        <div className="h-20 bg-white rounded-2xl border border-[#ECEEF3]" />
        <div className="h-44 bg-white rounded-2xl border border-[#ECEEF3]" />
      </div>
    );
  }

  // Compile items needing attention
  const attentionItems: Array<{ text: string; link?: string }> = [];

  if (summary.totalCustomerDue > 0) {
    if (summary.pendingCustomerPayments.length > 0) {
      attentionItems.push({
        text: `${formatCurrency(summary.totalCustomerDue)} customer payment pending (${summary.pendingCustomerPayments[0].name} & ${summary.pendingCustomerPayments.length} buyers)`,
        link: '/customers?filter=due',
      });
    } else {
      attentionItems.push({
        text: `${formatCurrency(summary.totalCustomerDue)} customer payment pending`,
        link: '/customers?filter=due',
      });
    }
  }

  if (summary.lowStockItems.length > 0) {
    summary.lowStockItems.forEach((item) => {
      attentionItems.push({
        text: `${item.name} stock is low (${item.currentStock} left)`,
        link: '/inventory',
      });
    });
  }

  if (summary.supplierDueAmount > 0) {
    attentionItems.push({
      text: `${formatCurrency(summary.supplierDueAmount)} supplier payment due`,
      link: '/money',
    });
  }

  return (
    <div className="space-y-5 pt-1 pb-6">
      {/* 1. BUSINESS PULSE TITLE */}
      <div className="pt-1">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Business Pulse
        </h2>
      </div>

      {/* 2. TODAY'S KEY NUMBERS */}
      <section className="space-y-2">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-0.5">
          Today
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Sales → Blue */}
          <div className="bg-blue-50/40 border border-blue-100/80 rounded-2xl p-3.5 shadow-card">
            <div className="text-xs font-semibold text-blue-700/80">Sales</div>
            <div className="text-2xl font-black text-slate-900 font-tabular tracking-tight mt-1">
              {formatCurrency(summary.todaySalesAmount)}
            </div>
          </div>

          {/* Collected → Green (Positive) */}
          <div className="bg-emerald-50/40 border border-emerald-100/80 rounded-2xl p-3.5 shadow-card">
            <div className="text-xs font-semibold text-emerald-700/90">Collected</div>
            <div className="text-2xl font-black text-emerald-700 font-tabular tracking-tight mt-1">
              {formatCurrency(summary.todayCollectionsAmount)}
            </div>
          </div>

          {/* Expenses → Red/Orange (Cost) */}
          <div className="bg-rose-50/40 border border-rose-100/80 rounded-2xl p-3.5 shadow-card">
            <div className="text-xs font-semibold text-rose-700/90">Expenses</div>
            <div className="text-2xl font-black text-rose-700 font-tabular tracking-tight mt-1">
              {formatCurrency(summary.todayExpensesAmount)}
            </div>
          </div>

          {/* Customer Due → Amber/Yellow (Pending) */}
          <Link
            href="/customers?filter=due"
            className="bg-amber-50/40 border border-amber-100/80 rounded-2xl p-3.5 shadow-card block hover:border-amber-200 transition-all"
          >
            <div className="text-xs font-semibold text-amber-800/90">Customer Due</div>
            <div className="text-2xl font-black text-amber-900 font-tabular tracking-tight mt-1">
              {formatCurrency(summary.totalCustomerDue)}
            </div>
          </Link>
        </div>
      </section>

      {/* 3. THIS MONTH'S OVERVIEW */}
      <section className="space-y-2">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-0.5">
          This Month
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#ECEEF3] shadow-card">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-slate-500">Month Sales</div>
              <div className="text-xl font-black text-slate-900 font-tabular tracking-tight mt-0.5">
                {formatCurrency(summary.monthSalesAmount)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                {summary.monthOrdersCount} {summary.monthOrdersCount === 1 ? 'order' : 'orders'}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500">Estimated Profit</div>
              <div className="text-xl font-black text-emerald-600 font-tabular tracking-tight mt-0.5">
                {formatCurrency(summary.monthEstimatedProfit)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                After expenses
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOUNDER EXPENSE SPLIT (Clickable card leading to /founder-expenses) */}
      <section className="space-y-2">
        <Link
          href="/founder-expenses"
          className="bg-white rounded-2xl p-4 border border-[#ECEEF3] shadow-card block hover:border-indigo-300 transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Founder Expense Split
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100">
            <div>
              <div className="text-xs font-medium text-slate-500">Business paid</div>
              <div className="text-xl font-black text-slate-900 font-tabular tracking-tight mt-0.5">
                {formatCurrency(summary.founderExpenseSplit?.businessPaid || 0)}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500">Founder paid</div>
              <div className="text-xl font-black text-indigo-600 font-tabular tracking-tight mt-0.5">
                {formatCurrency(summary.founderExpenseSplit?.founderPaid || 0)}
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* 5. THINGS NEEDING ATTENTION */}
      {attentionItems.length > 0 ? (
        <section className="space-y-2">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 px-0.5">
            Needs Attention
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
            <ul className="space-y-2 text-xs text-amber-950 font-medium">
              {attentionItems.map((item, idx) => (
                <li key={idx} className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{item.text}</span>
                  </div>
                  {item.link && (
                    <Link
                      href={item.link}
                      className="font-bold text-amber-800 hover:underline shrink-0 text-[11px]"
                    >
                      View
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 px-1 py-1">
          <span>✓</span>
          <span>All clear</span>
        </div>
      )}

      {/* 5. RECENT ACTIVITY (RECENT SALES) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Recent Sales
          </div>
          <Link
            href="/sales"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-[#ECEEF3] shadow-card divide-y divide-slate-100 overflow-hidden">
          {summary.recentSales.length > 0 ? (
            summary.recentSales.map((sale) => {
              const statusLabel =
                sale.paymentStatus === 'PAID'
                  ? 'Paid'
                  : sale.paymentStatus === 'PARTIAL'
                  ? 'Partial'
                  : 'Pending';
              const dateText = formatRelativeDate(sale.createdAt);

              return (
                <div
                  key={sale.id}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-bold text-slate-900 truncate leading-tight">
                      {sale.customerName}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {dateText} · {statusLabel}
                    </div>
                  </div>
                  <div className="text-sm font-black text-slate-900 font-tabular shrink-0 text-right">
                    {formatCurrency(sale.totalAmount)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-5 text-center text-xs text-slate-400 font-medium">
              No recent sales recorded yet
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
