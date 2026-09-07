'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  CreditCard,
  UserPlus,
  FileText,
  MessageCircle,
  Share2,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  formatISTDateTime,
} from '@/lib/formatters';
import {
  getISTDateParts,
  getStartOfISTDay,
  getEndOfISTDay,
  getStartOfISTMonth,
} from '@/lib/date-utils';
import { ProductImage } from '@/components/common/ProductImage';

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  currentSellingPrice: number;
  currentStock: number;
  imageEmoji: string;
}

interface CustomerOption {
  id: string;
  name: string;
  businessName: string | null;
  phone: string;
  city: string;
  outstandingBalance: number;
}

type PeriodFilter = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL_TIME';

export default function SalesPage() {
  const searchParams = useSearchParams();
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Period Filter: Today / This Week / This Month / All Time
  const [period, setPeriod] = useState<PeriodFilter>('THIS_WEEK');

  // View all recent sales toggle
  const [showAllSales, setShowAllSales] = useState(false);

  // Modal States
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [createdSaleForInvoice, setCreatedSaleForInvoice] = useState<any | null>(null);

  // New Sale Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('UPI');
  const [notes, setNotes] = useState('');

  // Collect Payment Form State
  const [collectCustomerId, setCollectCustomerId] = useState('');
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER'>('UPI');
  const [collectRef, setCollectRef] = useState('');

  // Add Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustBusiness, setNewCustBusiness] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCity, setNewCustCity] = useState('Raipur');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [salesRes, prodRes, custRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/products'),
        fetch('/api/customers'),
      ]);

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(Array.isArray(salesData) ? salesData : []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : []);
      }
      if (custRes.ok) {
        const custData = await custRes.json();
        const validCusts = Array.isArray(custData) ? custData : [];
        setCustomers(validCusts);
        if (validCusts.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(validCusts[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (searchParams.get('action') === 'new') {
      setSaleModalOpen(true);
    }
  }, [searchParams]);

  // ==========================================
  // 1. SALES SUMMARY CALCULATIONS (IST Aware)
  // ==========================================
  const summaryMetrics = useMemo(() => {
    const now = new Date();

    // Today boundaries in IST
    const todayStart = getStartOfISTDay(now).getTime();
    const todayEnd = getEndOfISTDay(now).getTime();

    // Week boundaries (Monday 00:00:00 to Sunday 23:59:59 IST)
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const mondayMs = todayStart - dayOfWeek * 24 * 60 * 60 * 1000;
    const weekStart = mondayMs;
    const weekEnd = todayEnd;

    // Month boundaries in IST
    const monthStart = getStartOfISTMonth(now).getTime();
    const monthEnd = todayEnd;

    const filtered = sales.filter((sale) => {
      const saleTime = new Date(sale.date).getTime();
      if (period === 'TODAY') {
        return saleTime >= todayStart && saleTime <= todayEnd;
      }
      if (period === 'THIS_WEEK') {
        return saleTime >= weekStart && saleTime <= weekEnd;
      }
      if (period === 'THIS_MONTH') {
        return saleTime >= monthStart && saleTime <= monthEnd;
      }
      return true; // ALL_TIME
    });

    const totalSales = filtered.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const collected = filtered.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
    const due = Math.max(0, totalSales - collected);

    return {
      totalSales,
      collected,
      due,
      count: filtered.length,
    };
  }, [sales, period]);

  // ==========================================
  // 2. SALES THIS WEEK (Trend Bar Chart)
  // ==========================================
  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const todayStart = getStartOfISTDay(now).getTime();
    const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0, Sun=6
    const mondayMs = todayStart - dayOfWeek * 24 * 60 * 60 * 1000;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const dayTotals = days.map((dayLabel, idx) => {
      const dayStart = mondayMs + idx * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + (24 * 60 * 60 * 1000 - 1);
      const isToday = idx === dayOfWeek;
      const isFuture = idx > dayOfWeek;

      const daySales = sales
        .filter((s) => {
          const t = new Date(s.date).getTime();
          return t >= dayStart && t <= dayEnd;
        })
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

      return {
        label: dayLabel,
        amount: daySales,
        isToday,
        isFuture,
      };
    });

    const maxAmount = Math.max(...dayTotals.map((d) => d.amount), 1);
    const weekTotal = dayTotals.reduce((sum, d) => sum + d.amount, 0);

    return {
      dayTotals,
      maxAmount,
      weekTotal,
    };
  }, [sales]);

  // ==========================================
  // 3. RECENT SALES
  // ==========================================
  const displayedSales = useMemo(() => {
    if (showAllSales) return sales;
    return sales.slice(0, 5);
  }, [sales, showAllSales]);

  // ==========================================
  // 4. CUSTOMER DUE
  // ==========================================
  const debtorCustomers = useMemo(() => {
    return customers
      .filter((c) => (c.outstandingBalance || 0) > 0)
      .sort((a, b) => (b.outstandingBalance || 0) - (a.outstandingBalance || 0));
  }, [customers]);

  const totalCustomerDue = useMemo(() => {
    return debtorCustomers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
  }, [debtorCustomers]);

  // Quick action: Open Collect Payment pre-filled for a specific customer
  const handleQuickCollect = (customer: CustomerOption) => {
    setCollectCustomerId(customer.id);
    setCollectAmount(customer.outstandingBalance);
    setCollectMethod('UPI');
    setCollectRef('');
    setError('');
    setCollectModalOpen(true);
  };

  // Calculations inside sale modal
  const subtotal = products.reduce((sum, p) => {
    const qty = itemQuantities[p.id] || 0;
    return sum + qty * p.currentSellingPrice;
  }, 0);

  const totalAmount = Math.max(0, subtotal - discountAmount);

  const updateQuantity = (productId: string, delta: number) => {
    setItemQuantities((prev) => {
      const curr = prev[productId] || 0;
      const next = Math.max(0, curr + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleFullPayment = () => {
    setPaidAmount(totalAmount);
  };

  const handleNoPayment = () => {
    setPaidAmount(0);
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const items = Object.entries(itemQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      setError('Please add at least one product quantity.');
      return;
    }

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items,
          discountAmount,
          paidAmount,
          paymentMethod,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record sale');
      }

      // Reset form & reload
      setItemQuantities({});
      setDiscountAmount(0);
      setPaidAmount(0);
      setNotes('');
      setSaleModalOpen(false);
      setCreatedSaleForInvoice(data.sale);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error recording sale');
    } finally {
      setSubmitting(false);
    }
  };

  const getCreatedSaleWhatsAppUrl = () => {
    if (!createdSaleForInvoice) return '#';
    const displayInvoiceNumber = createdSaleForInvoice.saleNumber.replace(/^SAL-/, 'BH-');
    const cust = customers.find((c) => c.id === createdSaleForInvoice.customerId);
    const customerName = cust?.businessName || cust?.name || 'Customer';
    const balanceDue = Math.max(
      0,
      (createdSaleForInvoice.totalAmount || 0) - (createdSaleForInvoice.paidAmount || 0)
    );

    const msg = `Hello *${customerName}*,\n\n` +
      `Thank you for choosing *BIHAAN HOME CARE*!\n` +
      `Here are the details for your recent invoice:\n\n` +
      `📄 *Invoice No:* ${displayInvoiceNumber}\n` +
      `💰 *Total Amount:* ${formatCurrency(createdSaleForInvoice.totalAmount)}\n` +
      `✅ *Paid Amount:* ${formatCurrency(createdSaleForInvoice.paidAmount)}\n` +
      (balanceDue > 0
        ? `⚠️ *Balance Due:* ${formatCurrency(balanceDue)}\n\n`
        : `🎉 *Status:* Fully Paid\n\n`) +
      `_Every day is a fresh beginning._\n` +
      `*BIHAAN HOME CARE*, Raipur`;

    let cleanP = cust?.phone?.replace(/[^0-9]/g, '') || '';
    if (cleanP.length === 10) cleanP = '91' + cleanP;

    return `https://wa.me/${cleanP}?text=${encodeURIComponent(msg)}`;
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!collectCustomerId || collectAmount <= 0) {
      setError('Select customer and enter a valid payment amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: collectCustomerId,
          amount: collectAmount,
          paymentMethod: collectMethod,
          referenceNumber: collectRef,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      setCollectModalOpen(false);
      setCollectAmount(0);
      setCollectRef('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error recording payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newCustName.trim() || !newCustPhone.trim()) {
      setError('Name and phone number are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName.trim(),
          businessName: newCustBusiness.trim() || undefined,
          phone: newCustPhone.trim(),
          city: newCustCity.trim() || 'Raipur',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create customer');

      setAddCustomerModalOpen(false);
      setNewCustName('');
      setNewCustBusiness('');
      setNewCustPhone('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error creating customer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse pt-2">
        <div className="h-6 bg-slate-200 rounded-lg w-32" />
        <div className="h-32 bg-white rounded-3xl border border-[#ECEEF3]" />
        <div className="h-44 bg-white rounded-3xl border border-[#ECEEF3]" />
        <div className="h-48 bg-white rounded-3xl border border-[#ECEEF3]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1 pb-6">
      {/* ========================================================= */}
      {/* 1. SALES SUMMARY                                          */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECEEF3] shadow-card space-y-4">
        {/* Header & Period Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Sales Summary</span>
              <span className="text-[10px] font-bold text-slate-400 font-tabular bg-slate-100 px-2 py-0.5 rounded-full">
                {summaryMetrics.count} {summaryMetrics.count === 1 ? 'sale' : 'sales'}
              </span>
            </h2>
          </div>

          {/* Period Toggle Pill */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl gap-1 text-[11px] font-bold self-start sm:self-auto overflow-x-auto max-w-full">
            {(
              [
                { id: 'TODAY', label: 'Today' },
                { id: 'THIS_WEEK', label: 'This Week' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'ALL_TIME', label: 'All Time' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-2.5 py-1 rounded-xl transition-all whitespace-nowrap active:scale-95 ${
                  period === tab.id
                    ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Metric Cards: Total Sales, Collected, Due */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Total Sales */}
          <div className="bg-blue-50/50 border border-blue-100/80 rounded-2xl p-3 sm:p-3.5">
            <span className="text-[11px] font-semibold text-blue-700 block">Total Sales</span>
            <span className="text-base sm:text-xl font-black text-slate-900 font-tabular tracking-tight block mt-0.5">
              {formatCurrency(summaryMetrics.totalSales)}
            </span>
          </div>

          {/* Collected */}
          <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-3 sm:p-3.5">
            <span className="text-[11px] font-semibold text-emerald-700 block">Collected</span>
            <span className="text-base sm:text-xl font-black text-emerald-700 font-tabular tracking-tight block mt-0.5">
              {formatCurrency(summaryMetrics.collected)}
            </span>
          </div>

          {/* Due */}
          <div className="bg-amber-50/50 border border-amber-100/80 rounded-2xl p-3 sm:p-3.5">
            <span className="text-[11px] font-semibold text-amber-800 block">Due</span>
            <span className="text-base sm:text-xl font-black text-amber-900 font-tabular tracking-tight block mt-0.5">
              {formatCurrency(summaryMetrics.due)}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. SALES THIS WEEK (Minimal Trend Chart)                  */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECEEF3] shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Sales This Week
            </h3>
            <div className="text-base font-black text-slate-900 font-tabular tracking-tight mt-0.5">
              {formatCurrency(weeklyTrend.weekTotal)}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-600" />
            <span>Mon – Sun</span>
          </div>
        </div>

        {/* Minimal Bar Chart */}
        <div className="pt-2">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 items-end h-28 border-b border-slate-100 pb-2">
            {weeklyTrend.dayTotals.map((d) => {
              const heightPercent =
                weeklyTrend.maxAmount > 0 ? Math.round((d.amount / weeklyTrend.maxAmount) * 100) : 0;
              const displayHeight = d.amount > 0 ? Math.max(heightPercent, 12) : 6;

              return (
                <div key={d.label} className="flex flex-col items-center justify-end h-full group">
                  {/* Tooltip on hover */}
                  <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-tabular">
                    {d.amount > 0 ? formatCurrency(d.amount) : '₹0'}
                  </span>

                  {/* Bar */}
                  <div className="w-full max-w-[28px] bg-slate-100 rounded-xl overflow-hidden flex flex-col justify-end p-0.5 h-full">
                    <div
                      style={{ height: `${displayHeight}%` }}
                      className={`w-full rounded-lg transition-all duration-300 ${
                        d.isToday
                          ? 'bg-indigo-600 shadow-sm'
                          : d.amount > 0
                          ? 'bg-indigo-400/80 hover:bg-indigo-500'
                          : 'bg-slate-200/70'
                      }`}
                    />
                  </div>

                  {/* Day Label */}
                  <span
                    className={`text-[10px] mt-2 font-bold ${
                      d.isToday ? 'text-indigo-600 font-extrabold' : 'text-slate-400'
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. RECENT SALES                                           */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECEEF3] shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Recent Sales</h3>
            <p className="text-[11px] text-slate-400">Latest recorded customer sales transactions</p>
          </div>

          {sales.length > 5 && (
            <button
              onClick={() => setShowAllSales(!showAllSales)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 active:scale-95 transition-all"
            >
              <span>{showAllSales ? 'Show less' : 'View all →'}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAllSales ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>

        {sales.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">No sales recorded yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Use the Quick Action buttons below to record your first sale.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedSales.map((sale) => {
              const productCount = sale.items?.length || 0;
              const totalCans =
                sale.items?.reduce((sum: number, it: any) => sum + (it.quantity || 0), 0) || 0;

              return (
                <div
                  key={sale.id}
                  className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {sale.customer?.id ? (
                        <Link
                          href={`/customers/${sale.customer.id}`}
                          className="font-extrabold text-sm text-slate-900 hover:text-indigo-600 transition-colors truncate"
                        >
                          {sale.customer.name}
                        </Link>
                      ) : (
                        <span className="font-extrabold text-sm text-slate-900 truncate">
                          {sale.customer?.name || 'Walk-in Customer'}
                        </span>
                      )}
                      {sale.customer?.businessName && (
                        <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                          ({sale.customer.businessName})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                      <span className="font-semibold text-slate-600">
                        {productCount} {productCount === 1 ? 'product' : 'products'} • {totalCans} cans
                      </span>
                      <span>•</span>
                      <span>{formatISTDateTime(sale.date)}</span>
                      {sale.saleNumber && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline font-tabular">{sale.saleNumber}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-sm font-black text-slate-900 font-tabular">
                        {formatCurrency(sale.totalAmount)}
                      </div>
                      <span
                        className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 uppercase tracking-wide ${
                          sale.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sale.paymentStatus === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sale.paymentStatus === 'PAID'
                          ? 'Paid'
                          : sale.paymentStatus === 'PARTIALLY_PAID'
                          ? 'Partial'
                          : 'Due'}
                      </span>
                    </div>

                    <Link
                      href={`/invoices/${sale.id}`}
                      title="View / Print Non-GST Invoice"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 4. CUSTOMER DUE                                           */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECEEF3] shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Customer Due</h3>
            <p className="text-[11px] text-slate-400">
              Total outstanding across {debtorCustomers.length} {debtorCustomers.length === 1 ? 'customer' : 'customers'}
            </p>
          </div>

          <Link
            href="/customers?filter=due"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 active:scale-95 transition-all"
          >
            <span>View all →</span>
          </Link>
        </div>

        {/* Total Outstanding Banner */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-800 block">
              Total Customer Outstanding
            </span>
            <span className="text-lg font-black text-amber-950 font-tabular mt-0.5 block">
              {formatCurrency(totalCustomerDue)}
            </span>
          </div>
          <span className="text-xs font-extrabold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-xl">
            {debtorCustomers.length} Pending
          </span>
        </div>

        {/* Short list of debtor customers */}
        {debtorCustomers.length === 0 ? (
          <div className="py-4 text-center text-xs font-bold text-emerald-700 bg-emerald-50/50 rounded-2xl border border-emerald-100">
            All customer dues are clear! ✓
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {debtorCustomers.slice(0, 4).map((c) => (
              <div key={c.id} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-2">
                <Link href={`/customers/${c.id}`} className="min-w-0 flex-1 block group">
                  <div className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {c.businessName ? `${c.businessName} • ` : ''}
                    {c.phone}
                  </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-extrabold text-amber-900 font-tabular">
                    {formatCurrency(c.outstandingBalance)}
                  </span>
                  <button
                    onClick={() => handleQuickCollect(c)}
                    className="bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 text-[11px] font-extrabold px-2.5 py-1 rounded-xl transition-all"
                  >
                    Collect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 5. QUICK ACTION BUTTONS                                   */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECEEF3] shadow-card space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h3>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* New Sale */}
          <button
            onClick={() => {
              setError('');
              setSaleModalOpen(true);
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 active:scale-95 transition-all text-indigo-700 group border border-indigo-100/80"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold leading-tight text-center">New Sale</span>
            <span className="text-[10px] text-indigo-500 font-medium">Order Entry</span>
          </button>

          {/* Collect Payment */}
          <button
            onClick={() => {
              setError('');
              if (customers.length > 0 && !collectCustomerId) {
                setCollectCustomerId(customers[0].id);
              }
              setCollectModalOpen(true);
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all text-emerald-700 group border border-emerald-100/80"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold leading-tight text-center">Collect Payment</span>
            <span className="text-[10px] text-emerald-600 font-medium">Quick Entry</span>
          </button>

          {/* Add Customer */}
          <button
            onClick={() => {
              setError('');
              setAddCustomerModalOpen(true);
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all text-slate-700 group border border-slate-200"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold leading-tight text-center">Add Customer</span>
            <span className="text-[10px] text-slate-500 font-medium">+ Register</span>
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MODAL 1: NEW SALE MODAL                                   */}
      {/* ========================================================= */}
      {saleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end md:justify-center p-0 md:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col max-w-md md:max-w-lg w-full mx-auto overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900">New Sale / Order</h2>
                  <p className="text-[11px] text-slate-500">Live inventory deduction & customer due</p>
                </div>
              </div>
              <button
                onClick={() => setSaleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSale} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Customer Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Customer</label>
                {customers.length === 0 ? (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                    No customers found. Please add a customer first.
                  </div>
                ) : (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.businessName ? `(${c.businessName})` : ''} • Due: {formatCurrency(c.outstandingBalance)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Products Stepper */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Products & Quantity (5L Cans)
                </label>
                <div className="space-y-2">
                  {products.map((prod) => {
                    const qty = itemQuantities[prod.id] || 0;
                    return (
                      <div
                        key={prod.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                          qty > 0
                            ? 'bg-indigo-50/50 border-indigo-200 shadow-xs'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                            <ProductImage product={prod} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 leading-snug">
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Price: <span className="font-bold text-indigo-700">{formatCurrency(prod.currentSellingPrice)}</span> • Stock: {prod.currentStock}
                            </div>
                          </div>
                        </div>

                        {/* Steppers */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, -1)}
                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center font-bold text-base text-slate-700 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-extrabold text-sm font-tabular">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, 1)}
                            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center font-bold text-base shadow-xs transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Total Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold font-tabular">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Discount (₹)</span>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-24 text-right bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold font-tabular"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-extrabold text-slate-900">Total Bill</span>
                  <span className="text-lg font-black text-indigo-950 font-tabular">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Payment Collection</label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleFullPayment}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        paidAmount === totalAmount && totalAmount > 0
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Full Paid ✓
                    </button>
                    <button
                      type="button"
                      onClick={handleNoPayment}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        paidAmount === 0
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Credit / Due
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Amount Collected</span>
                    <input
                      type="number"
                      min="0"
                      max={totalAmount}
                      value={paidAmount || ''}
                      onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                      placeholder="₹0"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-tabular"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Payment Mode</span>
                    <select
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                      disabled={paidAmount <= 0}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      <option value="UPI">UPI (GooglePay/PhonePe)</option>
                      <option value="CASH">Cash in Hand</option>
                      <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    </select>
                  </div>
                </div>

                {totalAmount > paidAmount && (
                  <div className="text-[11px] text-rose-600 font-semibold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                    Remaining {formatCurrency(totalAmount - paidAmount)} will be added to customer due balance.
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting || totalAmount <= 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 text-sm active:scale-98 transition-all"
              >
                {submitting ? 'Recording Sale...' : `Confirm Sale (${formatCurrency(totalAmount)})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: COLLECT PAYMENT MODAL                             */}
      {/* ========================================================= */}
      {collectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end md:justify-center p-0 md:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col max-w-md w-full mx-auto overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900">Collect Payment</h2>
                  <p className="text-[11px] text-slate-500">Record collection towards customer balance</p>
                </div>
              </div>
              <button
                onClick={() => setCollectModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Customer</label>
                <select
                  value={collectCustomerId}
                  onChange={(e) => {
                    setCollectCustomerId(e.target.value);
                    const cust = customers.find((c) => c.id === e.target.value);
                    if (cust) setCollectAmount(cust.outstandingBalance);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.businessName ? `(${c.businessName})` : ''} • Outstanding: {formatCurrency(c.outstandingBalance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Amount Received (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={collectAmount || ''}
                  onChange={(e) => setCollectAmount(Number(e.target.value) || 0)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black font-tabular text-slate-900 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={collectMethod}
                  onChange={(e: any) => setCollectMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe)</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reference / Note (Optional)</label>
                <input
                  type="text"
                  value={collectRef}
                  onChange={(e) => setCollectRef(e.target.value)}
                  placeholder="Transaction UTR, receipt, or notes"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || collectAmount <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 text-sm active:scale-98 transition-all"
              >
                {submitting ? 'Recording...' : `Record Payment (${formatCurrency(collectAmount)})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ADD CUSTOMER MODAL                               */}
      {/* ========================================================= */}
      {addCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end md:justify-center p-0 md:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col max-w-md w-full mx-auto overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900">Add New Customer</h2>
                  <p className="text-[11px] text-slate-500">Register buyer in BIHAN directory</p>
                </div>
              </div>
              <button
                onClick={() => setAddCustomerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Business Name (Optional)</label>
                <input
                  type="text"
                  value={newCustBusiness}
                  onChange={(e) => setNewCustBusiness(e.target.value)}
                  placeholder="e.g. Patel Traders / Hotel Blue Star"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  value={newCustCity}
                  onChange={(e) => setNewCustCity(e.target.value)}
                  placeholder="Raipur"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 text-sm active:scale-98 transition-all"
              >
                {submitting ? 'Saving Customer...' : 'Save Customer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: POST-SALE INVOICE SUCCESS CONFIRMATION             */}
      {/* ========================================================= */}
      {createdSaleForInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-base text-slate-900">
                Sale Recorded Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                Invoice #{createdSaleForInvoice.saleNumber?.replace(/^SAL-/, 'BH-')}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-extrabold font-tabular text-slate-900">
                  {formatCurrency(createdSaleForInvoice.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid Amount:</span>
                <span className="font-bold font-tabular text-emerald-700">
                  {formatCurrency(createdSaleForInvoice.paidAmount)}
                </span>
              </div>
              {createdSaleForInvoice.totalAmount - createdSaleForInvoice.paidAmount > 0 && (
                <div className="flex justify-between border-t border-slate-200/80 pt-1">
                  <span className="text-rose-600 font-bold">Balance Due:</span>
                  <span className="font-black font-tabular text-rose-700">
                    {formatCurrency(
                      createdSaleForInvoice.totalAmount - createdSaleForInvoice.paidAmount
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <Link
                href={`/invoices/${createdSaleForInvoice.id}`}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>View / Print Invoice</span>
              </Link>

              <a
                href={getCreatedSaleWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setCreatedSaleForInvoice(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
