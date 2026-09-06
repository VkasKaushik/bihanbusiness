'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';

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

export default function SalesPage() {
  const searchParams = useSearchParams();
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('UPI');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [salesRes, prodRes, custRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/products'),
        fetch('/api/customers'),
      ]);

      if (salesRes.ok) setSales(await salesRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData);
        if (custData.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(custData[0].id);
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
      setModalOpen(true);
    }
  }, [searchParams]);

  // Calculations inside modal
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
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error recording sale');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Sale Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Sales Orders</h1>
          <p className="text-xs text-slate-500">Record sales & automatic inventory deduction</p>
        </div>

        <button
          onClick={() => {
            setModalOpen(true);
            setError('');
          }}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-3.5 py-2 rounded-2xl flex items-center gap-1.5 shadow-md shadow-blue-700/20 text-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Quick Sale</span>
        </button>
      </div>

      {/* Sales List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading sales history...</div>
      ) : sales.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">No sales recorded yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Tap "+ Quick Sale" above to log a new delivery or order in seconds.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-extrabold text-sm text-slate-900">
                    {sale.customer?.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {sale.customer?.businessName ? `${sale.customer.businessName} • ` : ''}
                    {sale.customer?.phone}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-slate-900 font-tabular">
                    {formatCurrency(sale.totalAmount)}
                  </div>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                      sale.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sale.paymentStatus === 'PARTIALLY_PAID'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {sale.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Items summary */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-xs text-slate-600 flex flex-wrap gap-2">
                {sale.items?.map((item: any) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg text-[11px]"
                  >
                    <span>{item.product?.imageEmoji}</span>
                    <span>{item.product?.name}</span>
                    <span className="font-bold">×{item.quantity}</span>
                  </span>
                ))}
              </div>

              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{sale.saleNumber}</span>
                <span>{formatDate(sale.date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUICK SALE MODAL (< 15 Second Entry) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end md:justify-center p-0 md:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col max-w-md md:max-w-lg w-full mx-auto overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900">New Sale (Quick Entry)</h2>
                  <p className="text-[11px] text-slate-500">Inventory & due update automatically</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSale} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Customer Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.businessName ? `(${c.businessName})` : ''} • Due: {formatCurrency(c.outstandingBalance)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Products Stepper List */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Products & Quantity (5L Cans)
                </label>
                <div className="space-y-2.5">
                  {products.map((prod) => {
                    const qty = itemQuantities[prod.id] || 0;
                    return (
                      <div
                        key={prod.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                          qty > 0
                            ? 'bg-blue-50/60 border-blue-300 shadow-xs'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="text-2xl">{prod.imageEmoji}</span>
                          <div>
                            <div className="text-xs font-bold text-slate-900 leading-snug">
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Selling Price: <span className="font-bold text-blue-700">{formatCurrency(prod.currentSellingPrice)}</span> • Stock: {prod.currentStock}
                            </div>
                          </div>
                        </div>

                        {/* Stepper Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, -1)}
                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center font-bold text-base text-slate-700"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-extrabold text-sm font-tabular">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, 1)}
                            className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center font-bold text-base shadow-xs"
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
                  <span className="text-lg font-extrabold text-blue-900 font-tabular">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Status / Collection Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Payment Collection</label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleFullPayment}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
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
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
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
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-700/25 text-sm active:scale-98 transition-all"
              >
                {submitting ? (
                  <span>Recording Sale...</span>
                ) : (
                  <span>Confirm Sale ({formatCurrency(totalAmount)})</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
