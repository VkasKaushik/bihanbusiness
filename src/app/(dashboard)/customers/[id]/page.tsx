'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Building,
  MapPin,
  Calendar,
  CreditCard,
  Receipt,
  Plus,
  Clock,
  User,
  FileText,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Send,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatDate, formatISTDateTime } from '@/lib/formatters';
import { CustomerDetail, CustomerDetailSale, CustomerNote } from '@/types';
import { ProductImage } from '@/components/common/ProductImage';

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  currentSellingPrice: number;
  currentStock: number;
  imageEmoji: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [selectedSale, setSelectedSale] = useState<CustomerDetailSale | null>(null);
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);

  // Delete Customer State
  const [deleteCustomerModalOpen, setDeleteCustomerModalOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [deleteCustomerError, setDeleteCustomerError] = useState('');

  // Delete Sale State
  const [saleToDelete, setSaleToDelete] = useState<CustomerDetailSale | null>(null);
  const [deletingSale, setDeletingSale] = useState(false);
  const [deleteSaleError, setDeleteSaleError] = useState('');

  // New Note State
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  // Collect Payment Form State
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER'>('UPI');
  const [collectRef, setCollectRef] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // New Sale Form State
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [saleDiscount, setSaleDiscount] = useState<number>(0);
  const [salePaidAmount, setSalePaidAmount] = useState<number>(0);
  const [saleMethod, setSaleMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER'>('UPI');
  const [saleNotes, setSaleNotes] = useState('');
  const [submittingSale, setSubmittingSale] = useState(false);
  const [saleError, setSaleError] = useState('');

  const loadCustomer = async () => {
    try {
      setError('');
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Customer not found');
        throw new Error('Failed to load customer details');
      }
      const data: CustomerDetail = await res.json();
      setCustomer(data);
      setCollectAmount(data.financialSummary.totalDue > 0 ? data.financialSummary.totalDue : 0);
    } catch (err: any) {
      setError(err.message || 'Error loading customer');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const prodData = await res.json();
        setProducts(Array.isArray(prodData) ? prodData : []);
      }
    } catch (e) {
      console.error('Error fetching products:', e);
    }
  };

  useEffect(() => {
    loadCustomer();
    loadProducts();
  }, [id]);

  // Clean phone number for WhatsApp & Tel
  const cleanPhone = customer?.phone?.replace(/[^0-9]/g, '') || '';
  const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const greetingText = encodeURIComponent(
    `Hello ${customer?.businessName || customer?.name || ''}, greetings from BIHAN!`
  );

  // Delete Customer handler
  const handleDeleteCustomer = async () => {
    setDeletingCustomer(true);
    setDeleteCustomerError('');
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove customer');

      router.push('/customers');
    } catch (err: any) {
      setDeleteCustomerError(err.message || 'Error removing customer');
      setDeletingCustomer(false);
    }
  };

  // Delete Sale handler
  const handleDeleteSale = async () => {
    if (!saleToDelete) return;
    setDeletingSale(true);
    setDeleteSaleError('');
    try {
      const res = await fetch(`/api/sales?id=${saleToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove sale');

      setSaleToDelete(null);
      setSelectedSale(null);
      await loadCustomer();
    } catch (err: any) {
      setDeleteSaleError(err.message || 'Error removing sale');
    } finally {
      setDeletingSale(false);
    }
  };

  // Add Note handler
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setSubmittingNote(true);
    setNoteError('');
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNoteText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add note');

      setNewNoteText('');
      await loadCustomer();
    } catch (err: any) {
      setNoteError(err.message || 'Error saving note');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Collect Payment handler
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (collectAmount <= 0) {
      setPaymentError('Please enter a valid amount');
      return;
    }

    setSubmittingPayment(true);
    setPaymentError('');
    try {
      const res = await fetch('/api/payments/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: id,
          amount: collectAmount,
          paymentMethod: collectMethod,
          referenceNumber: collectRef.trim() || undefined,
          notes: collectNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      setCollectModalOpen(false);
      setCollectRef('');
      setCollectNotes('');
      await loadCustomer();
    } catch (err: any) {
      setPaymentError(err.message || 'Error recording payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // New Sale handler
  const selectedSaleItems = Object.entries(itemQuantities)
    .filter(([_, qty]) => qty > 0)
    .map(([productId, quantity]) => {
      const prod = products.find((p) => p.id === productId);
      return {
        productId,
        quantity,
        unitPrice: prod?.currentSellingPrice || 0,
      };
    });

  const saleSubtotal = selectedSaleItems.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0
  );
  const saleTotal = Math.max(0, saleSubtotal - saleDiscount);

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSaleItems.length === 0) {
      setSaleError('Please add at least one product item');
      return;
    }

    setSubmittingSale(true);
    setSaleError('');
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: id,
          items: selectedSaleItems,
          discountAmount: saleDiscount,
          paidAmount: salePaidAmount,
          paymentMethod: saleMethod,
          notes: saleNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create sale');

      setSaleModalOpen(false);
      setItemQuantities({});
      setSaleDiscount(0);
      setSalePaidAmount(0);
      setSaleNotes('');
      await loadCustomer();
    } catch (err: any) {
      setSaleError(err.message || 'Error recording sale');
    } finally {
      setSubmittingSale(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse pt-2 max-w-3xl mx-auto">
        <div className="h-6 bg-slate-200 rounded-lg w-28" />
        <div className="h-40 bg-white rounded-3xl border border-[#ECEEF3]" />
        <div className="h-32 bg-white rounded-3xl border border-[#ECEEF3]" />
        <div className="h-64 bg-white rounded-3xl border border-[#ECEEF3]" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-extrabold text-slate-900">
          {error || 'Customer not found'}
        </h2>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
      </div>
    );
  }

  const isDue = customer.financialSummary.totalDue > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4 pt-1 pb-12">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Customers</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 font-tabular">
            ID: {customer.id.slice(-6).toUpperCase()}
          </span>
          <button
            type="button"
            onClick={() => {
              setDeleteCustomerError('');
              setDeleteCustomerModalOpen(true);
            }}
            title="Remove Customer"
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. CUSTOMER HEADER                                        */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl p-5 border border-[#ECEEF3] shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                {customer.businessName || customer.name}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700">
                {customer.businessName ? 'Business Account' : 'Retail Customer'}
              </span>
            </div>

            {customer.businessName && (
              <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact: {customer.name}</span>
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-1 hover:text-indigo-600 font-bold"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.phone}</span>
              </a>

              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.city}</span>
                {customer.address && (
                  <span className="text-slate-400 font-normal truncate max-w-[200px]">
                    • {customer.address}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Quick Communication Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://wa.me/${waPhone}?text=${greetingText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-2xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>

            <a
              href={`tel:${customer.phone}`}
              className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-2xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Phone className="w-4 h-4 text-slate-600" />
              <span>Call</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. FINANCIAL SUMMARY                                      */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl p-5 border border-[#ECEEF3] shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
            Financial Summary
          </h2>
          {isDue ? (
            <span className="text-[11px] font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
              Payment Pending
            </span>
          ) : (
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              All Clear ✓
            </span>
          )}
        </div>

        {/* 3 Metric Cards: Purchased, Paid, Due */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block">
              Total Purchased
            </span>
            <div className="text-base sm:text-lg font-black text-slate-900 font-tabular tracking-tight mt-1">
              {formatCurrency(customer.financialSummary.totalPurchased)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {customer.sales.length} {customer.sales.length === 1 ? 'sale' : 'sales'}
            </span>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block">
              Total Paid
            </span>
            <div className="text-base sm:text-lg font-black text-emerald-700 font-tabular tracking-tight mt-1">
              {formatCurrency(customer.financialSummary.totalPaid)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {customer.payments.length} {customer.payments.length === 1 ? 'payment' : 'payments'}
            </span>
          </div>

          <div
            className={`rounded-2xl p-3.5 border ${
              isDue
                ? 'bg-amber-50/80 border-amber-200/80'
                : 'bg-emerald-50/40 border-emerald-100'
            }`}
          >
            <span
              className={`text-[11px] font-semibold block ${
                isDue ? 'text-amber-800' : 'text-emerald-700'
              }`}
            >
              Total Due
            </span>
            <div
              className={`text-base sm:text-lg font-black font-tabular tracking-tight mt-1 ${
                isDue ? 'text-amber-950' : 'text-emerald-800'
              }`}
            >
              {isDue ? formatCurrency(customer.financialSummary.totalDue) : '₹0'}
            </div>
            <span
              className={`text-[10px] font-bold mt-1 block ${
                isDue ? 'text-amber-700' : 'text-emerald-600'
              }`}
            >
              {isDue ? 'Balance pending' : 'Zero balance'}
            </span>
          </div>
        </div>

        {/* Clear Collect Payment Action */}
        <div className="pt-1">
          <button
            onClick={() => {
              setCollectAmount(
                customer.financialSummary.totalDue > 0
                  ? customer.financialSummary.totalDue
                  : 0
              );
              setPaymentError('');
              setCollectModalOpen(true);
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-extrabold py-3 px-4 rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>
              {isDue
                ? `Collect Payment (${formatCurrency(customer.financialSummary.totalDue)})`
                : 'Record Advance Payment'}
            </span>
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. PURCHASE HISTORY                                       */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl p-5 border border-[#ECEEF3] shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Purchase History</span>
              <span className="text-[10px] font-bold text-slate-400 font-tabular bg-slate-100 px-2 py-0.5 rounded-full">
                {customer.sales.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Tap any sale to view items, invoice details, and receipt
            </p>
          </div>
        </div>

        {customer.sales.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">No sales recorded yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Record a new sale using the Quick Actions below.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {customer.sales.map((sale) => {
              const productCount = sale.items.length;
              const totalCans = sale.items.reduce((s, it) => s + it.quantity, 0);

              return (
                <div
                  key={sale.id}
                  onClick={() => setSelectedSale(sale)}
                  className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 -mx-2 px-2 rounded-2xl transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900 font-tabular">
                        {sale.saleNumber}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatISTDateTime(sale.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                      <span className="font-semibold text-slate-700">
                        {productCount} {productCount === 1 ? 'item' : 'items'} • {totalCans} cans
                      </span>
                      {sale.items[0]?.product && (
                        <span className="text-slate-400 truncate max-w-[180px]">
                          ({sale.items[0].product.name}
                          {sale.items.length > 1 ? ` +${sale.items.length - 1}` : ''})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 font-tabular">
                        {formatCurrency(sale.totalAmount)}
                      </div>
                      <span
                        className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 uppercase tracking-wide ${
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSaleToDelete(sale);
                        setDeleteSaleError('');
                      }}
                      title="Remove Sale"
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 4. NOTES                                                  */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl p-5 border border-[#ECEEF3] shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Customer Notes</span>
              <span className="text-[10px] font-bold text-slate-400 font-tabular bg-slate-100 px-2 py-0.5 rounded-full">
                {customer.notes.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Internal notes, order preferences, delivery instructions
            </p>
          </div>
        </div>

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="space-y-2">
          <div className="relative">
            <textarea
              rows={2}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Add a customer note (e.g. preferred delivery days, UPI payment details, discount agreement)..."
              className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {noteError && (
            <p className="text-xs font-bold text-rose-600">{noteError}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingNote || !newNoteText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 active:scale-95 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingNote ? 'Saving...' : 'Add Note'}</span>
            </button>
          </div>
        </form>

        {/* Notes List */}
        {customer.notes.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            No notes logged for this customer yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {customer.notes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3 text-xs space-y-1"
              >
                <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {note.text}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold pt-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{formatISTDateTime(note.createdAt)}</span>
                  {note.authorName && (
                    <>
                      <span>•</span>
                      <span>By {note.authorName}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 5. CUSTOMER DETAILS                                       */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl p-5 border border-[#ECEEF3] shadow-card space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
          Customer Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Business Name
            </span>
            <span className="font-extrabold text-slate-900 block mt-0.5">
              {customer.businessName || '— (Direct Customer)'}
            </span>
          </div>

          <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Contact Person
            </span>
            <span className="font-extrabold text-slate-900 block mt-0.5">
              {customer.name}
            </span>
          </div>

          <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Phone / WhatsApp
            </span>
            <span className="font-extrabold text-slate-900 block mt-0.5 font-tabular">
              +91 {customer.phone}
            </span>
          </div>

          <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              City
            </span>
            <span className="font-extrabold text-slate-900 block mt-0.5">
              {customer.city || 'Raipur'}
            </span>
          </div>

          <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100 sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Address
            </span>
            <span className="font-medium text-slate-700 block mt-0.5">
              {customer.address || 'No physical address provided'}
            </span>
          </div>

          <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Business Type
            </span>
            <span className="font-extrabold text-slate-900 block mt-0.5">
              {customer.businessName ? 'Commercial / Business' : 'Individual / Retail'}
            </span>
          </div>

          <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Customer Since
            </span>
            <span className="font-extrabold text-slate-900 block mt-0.5">
              {formatDate(customer.createdAt)}
            </span>
          </div>

          <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100 sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              GSTIN (Optional)
            </span>
            <span className="font-medium text-slate-500 block mt-0.5">
              Unregistered / Composition Scheme
            </span>
          </div>

          <div className="p-3 bg-rose-50/40 rounded-2xl border border-rose-100 sm:col-span-2 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 block">
                Account Removal
              </span>
              <span className="text-xs text-slate-600 font-medium block mt-0.5">
                Permanently remove or archive this customer profile
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteCustomerError('');
                setDeleteCustomerModalOpen(true);
              }}
              className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 active:scale-95 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Remove Customer</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. QUICK ACTIONS                                          */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl p-5 border border-[#ECEEF3] shadow-card space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => {
              setItemQuantities({});
              setSaleDiscount(0);
              setSalePaidAmount(0);
              setSaleError('');
              setSaleModalOpen(true);
            }}
            className="p-3.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 rounded-2xl text-left border border-indigo-100/80 transition-all flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-indigo-950 block">New Sale</span>
              <span className="text-[10px] text-indigo-700/80 font-medium">Record order</span>
            </div>
          </button>

          <button
            onClick={() => {
              setCollectAmount(
                customer.financialSummary.totalDue > 0
                  ? customer.financialSummary.totalDue
                  : 0
              );
              setPaymentError('');
              setCollectModalOpen(true);
            }}
            className="p-3.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 rounded-2xl text-left border border-emerald-100/80 transition-all flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-emerald-950 block">Collect</span>
              <span className="text-[10px] text-emerald-700/80 font-medium">Receive payment</span>
            </div>
          </button>

          <a
            href={`https://wa.me/${waPhone}?text=${greetingText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 bg-teal-50 hover:bg-teal-100 active:scale-95 rounded-2xl text-left border border-teal-100/80 transition-all flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-2 shadow-xs">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-teal-950 block">WhatsApp</span>
              <span className="text-[10px] text-teal-700/80 font-medium">Chat directly</span>
            </div>
          </a>

          <a
            href={`tel:${customer.phone}`}
            className="p-3.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-2xl text-left border border-slate-200 transition-all flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center mb-2 shadow-xs">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 block">Call</span>
              <span className="text-[10px] text-slate-500 font-medium">Phone contact</span>
            </div>
          </a>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MODAL: SALE DETAILS                                       */}
      {/* ========================================================= */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Sale Details
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 font-tabular">
                  {selectedSale.saleNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sale Meta */}
            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="space-y-0.5">
                <span className="block font-semibold text-slate-700">
                  {formatISTDateTime(selectedSale.date)}
                </span>
                {selectedSale.createdBy && (
                  <span className="text-[10px] text-slate-400 block">
                    Recorded by: {selectedSale.createdBy.name}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                  selectedSale.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedSale.paymentStatus === 'PARTIALLY_PAID'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {selectedSale.paymentStatus}
              </span>
            </div>

            {/* Itemized Line Items */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Line Items
              </span>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {selectedSale.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center justify-between bg-white text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 truncate flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-xs">
                          <ProductImage product={item.product} className="w-full h-full object-contain" />
                        </div>
                        <span>{item.product?.name || 'Product'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-tabular">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                    <div className="text-right font-extrabold text-slate-900 font-tabular shrink-0">
                      {formatCurrency(item.lineTotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-tabular">{formatCurrency(selectedSale.subtotalAmount)}</span>
              </div>
              {selectedSale.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount</span>
                  <span className="font-tabular">-{formatCurrency(selectedSale.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-slate-900 border-t border-slate-200/80 pt-1.5 text-sm">
                <span>Total Amount</span>
                <span className="font-tabular">{formatCurrency(selectedSale.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold pt-0.5">
                <span>Paid Amount</span>
                <span className="font-tabular">{formatCurrency(selectedSale.paidAmount)}</span>
              </div>
              {selectedSale.totalAmount - selectedSale.paidAmount > 0 && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Balance Due</span>
                  <span className="font-tabular">
                    {formatCurrency(selectedSale.totalAmount - selectedSale.paidAmount)}
                  </span>
                </div>
              )}
            </div>

            {selectedSale.notes && (
              <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-100 text-xs">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Note</span>
                <p className="text-slate-700 mt-0.5">{selectedSale.notes}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSaleToDelete(selectedSale);
                  setDeleteSaleError('');
                }}
                className="bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold py-2.5 px-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Sale</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold py-2.5 rounded-2xl text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: COLLECT PAYMENT                                    */}
      {/* ========================================================= */}
      {collectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Collect Customer Payment</h3>
                <p className="text-[11px] text-slate-400">
                  {customer.businessName || customer.name} • Due:{' '}
                  <span className="font-bold text-amber-700 font-tabular">
                    {formatCurrency(customer.financialSummary.totalDue)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setCollectModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                {paymentError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Collection Amount (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={collectAmount || ''}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-base font-extrabold font-tabular text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'CASH', 'BANK_TRANSFER'] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setCollectMethod(m)}
                      className={`py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                        collectMethod === m
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m === 'BANK_TRANSFER' ? 'Bank' : m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reference / UTR Number (Optional)
                </label>
                <input
                  type="text"
                  value={collectRef}
                  onChange={(e) => setCollectRef(e.target.value)}
                  placeholder="e.g. UPI Ref / Cheque No."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder="e.g. Cleared bill for last order"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCollectModalOpen(false)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="w-2/3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition-all disabled:opacity-50"
                >
                  {submittingPayment ? 'Recording...' : 'Confirm Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NEW SALE                                           */}
      {/* ========================================================= */}
      {saleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">New Sale / Order</h3>
                <p className="text-[11px] text-slate-400">
                  Customer: <span className="font-bold text-slate-700">{customer.name}</span>
                </p>
              </div>
              <button
                onClick={() => setSaleModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                {saleError}
              </div>
            )}

            <form onSubmit={handleCreateSale} className="space-y-4">
              {/* Product Steppers */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Select Products
                </label>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                  {products.map((p) => {
                    const qty = itemQuantities[p.id] || 0;
                    return (
                      <div
                        key={p.id}
                        className="p-3 flex items-center justify-between bg-white text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-900 flex items-center gap-2 truncate">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-xs">
                              <ProductImage product={p} className="w-full h-full object-contain" />
                            </div>
                            <span>{p.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-tabular mt-0.5">
                            {formatCurrency(p.currentSellingPrice)} • Stock: {p.currentStock}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setItemQuantities((prev) => ({
                                ...prev,
                                [p.id]: Math.max(0, (prev[p.id] || 0) - 1),
                              }))
                            }
                            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-95"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-extrabold text-slate-900 font-tabular">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setItemQuantities((prev) => ({
                                ...prev,
                                [p.id]: (prev[p.id] || 0) + 1,
                              }))
                            }
                            className="w-7 h-7 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation Banner */}
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-tabular font-bold">{formatCurrency(saleSubtotal)}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Discount (₹)</span>
                  <input
                    type="number"
                    min="0"
                    value={saleDiscount || ''}
                    onChange={(e) => setSaleDiscount(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="w-24 text-right bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-tabular font-bold"
                  />
                </div>

                <div className="flex justify-between font-black text-slate-900 border-t border-slate-200/80 pt-1.5 text-sm">
                  <span>Total Payable</span>
                  <span className="font-tabular text-indigo-700">{formatCurrency(saleTotal)}</span>
                </div>
              </div>

              {/* Upfront Payment */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Upfront Payment Collected (₹)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={salePaidAmount || ''}
                    onChange={(e) => setSalePaidAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-extrabold font-tabular text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setSalePaidAmount(saleTotal)}
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-xl text-xs font-bold active:scale-95"
                  >
                    Full Paid
                  </button>
                </div>
              </div>

              {salePaidAmount > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['UPI', 'CASH', 'BANK_TRANSFER'] as const).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setSaleMethod(m)}
                        className={`py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                          saleMethod === m
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {m === 'BANK_TRANSFER' ? 'Bank' : m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Sale Notes (Optional)
                </label>
                <input
                  type="text"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  placeholder="e.g. Delivery on Thursday"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSaleModalOpen(false)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSale || selectedSaleItems.length === 0}
                  className="w-2/3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition-all disabled:opacity-50"
                >
                  {submittingSale ? 'Creating...' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRM REMOVE CUSTOMER                            */}
      {/* ========================================================= */}
      {deleteCustomerModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-extrabold text-base text-slate-900">
                Remove Customer Account?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove{' '}
                <span className="font-extrabold text-slate-900">
                  {customer.businessName || customer.name}
                </span>
                ? If they have existing transactions, the account will be safely archived without affecting accounting history.
              </p>
            </div>

            {deleteCustomerError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 text-center">
                {deleteCustomerError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={deletingCustomer}
                onClick={() => setDeleteCustomerModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingCustomer}
                onClick={handleDeleteCustomer}
                className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deletingCustomer ? 'Removing...' : 'Yes, Remove Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRM REMOVE SALE                                */}
      {/* ========================================================= */}
      {saleToDelete && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-extrabold text-base text-slate-900">
                Remove Sale #{saleToDelete.saleNumber}?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete this sale for{' '}
                <span className="font-extrabold font-tabular text-slate-900">
                  {formatCurrency(saleToDelete.totalAmount)}
                </span>
                ? This will archive the transaction, revert stock deductions, and update customer balances.
              </p>
            </div>

            {deleteSaleError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 text-center">
                {deleteSaleError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={deletingSale}
                onClick={() => setSaleToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingSale}
                onClick={handleDeleteSale}
                className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deletingSale ? 'Removing...' : 'Yes, Remove Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
