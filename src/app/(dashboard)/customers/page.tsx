'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Receipt,
  CheckCircle,
  AlertCircle,
  X,
  CreditCard,
  Building,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { CustomerSummary } from '@/types';

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyDue, setOnlyDue] = useState(false);

  // New Customer Modal
  const [newCustModal, setNewCustModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBusiness, setNewBusiness] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('Raipur');
  const [newAddress, setNewAddress] = useState('');

  // Collect Payment Modal
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER'>('UPI');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Delete Customer Modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    if (searchParams.get('action') === 'new') {
      setNewCustModal(true);
    }
    if (searchParams.get('filter') === 'due') {
      setOnlyDue(true);
    }
  }, [searchParams]);

  const filteredCustomers = customers.filter((c) => {
    if (onlyDue && c.outstandingBalance <= 0) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.businessName && c.businessName.toLowerCase().includes(q)) ||
      c.phone.includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newName || !newPhone) {
      setError('Name and phone number are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          businessName: newBusiness,
          phone: newPhone,
          city: newCity,
          address: newAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create customer');

      setNewName('');
      setNewBusiness('');
      setNewPhone('');
      setNewAddress('');
      setNewCustModal(false);
      await loadCustomers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentModal = (cust: CustomerSummary) => {
    setSelectedCustomer(cust);
    setPayAmount(cust.outstandingBalance > 0 ? cust.outstandingBalance : 0);
    setPayReference('');
    setPayNotes('');
    setError('');
    setPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || payAmount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          amount: payAmount,
          paymentMethod: payMethod,
          referenceNumber: payReference,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      setPaymentModal(false);
      await loadCustomers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/customers?id=${customerToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove customer');

      setDeleteModal(false);
      setCustomerToDelete(null);
      await loadCustomers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Customers</h1>
          <p className="text-xs text-slate-500">Live outstanding balances & collections</p>
        </div>

        <button
          onClick={() => {
            setError('');
            setNewCustModal(true);
          }}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-3 py-2 rounded-2xl flex items-center gap-1.5 shadow-md shadow-blue-700/20 text-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Customer</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, hotel..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <button
          onClick={() => setOnlyDue(!onlyDue)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
            onlyDue
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Has Due
        </button>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading customers...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">No customers found</h3>
          <p className="text-xs text-slate-500 mt-1">Tap "+ Customer" to add a new account.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>{cust.name}</span>
                    {cust.businessName && (
                      <span className="text-[11px] font-normal text-slate-500">
                        ({cust.businessName})
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${cust.phone}`} className="hover:underline text-blue-700">
                        {cust.phone}
                      </a>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {cust.city}
                    </span>
                  </div>
                </div>

                {/* Outstanding Balance Badge */}
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Balance Due
                  </div>
                  <div
                    className={`text-base font-extrabold font-tabular mt-0.5 ${
                      cust.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {cust.outstandingBalance > 0
                      ? formatCurrency(cust.outstandingBalance)
                      : 'Cleared ✓'}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Quick Collect & Call */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  Total Billed: <span className="font-semibold text-slate-600">{formatCurrency(cust.totalPurchased)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPaymentModal(cust)}
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Collect ₹</span>
                  </button>

                  <button
                    onClick={() => {
                      setCustomerToDelete(cust);
                      setError('');
                      setDeleteModal(true);
                    }}
                    title="Remove / Delete Customer"
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Add Customer */}
      {newCustModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-sm text-slate-900">+ Add New Customer</h2>
              <button
                onClick={() => setNewCustModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Verma"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Business / Hotel / Shop Name</label>
                <input
                  type="text"
                  value={newBusiness}
                  onChange={(e) => setNewBusiness(e.target.value)}
                  placeholder="e.g. Hotel Grand Raipur"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mobile / WhatsApp</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="98270XXXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Raipur / Durg"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all mt-2"
              >
                {submitting ? 'Saving...' : 'Save Customer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Collect Payment */}
      {paymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-extrabold text-sm text-slate-900">Record Collection (Payment)</h2>
                <p className="text-[11px] text-slate-500">{selectedCustomer.name}</p>
              </div>
              <button
                onClick={() => setPaymentModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 flex justify-between items-center">
                <span className="text-xs font-semibold text-rose-800">Current Outstanding:</span>
                <span className="text-sm font-extrabold text-rose-900 font-tabular">
                  {formatCurrency(selectedCustomer.outstandingBalance)}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Amount Received (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  placeholder="₹ Amount"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-base font-extrabold font-tabular text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Mode</label>
                <select
                  value={payMethod}
                  onChange={(e: any) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reference / Note (Optional)</label>
                <input
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="e.g. UPI Ref # / Cheque #"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || payAmount <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-md transition-all mt-2"
              >
                {submitting ? 'Recording...' : `Confirm Collection (${formatCurrency(payAmount)})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Customer Confirmation */}
      {deleteModal && customerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h2 className="font-extrabold text-sm text-slate-900">Remove Customer</h2>
              </div>
              <button
                onClick={() => {
                  setDeleteModal(false);
                  setCustomerToDelete(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="font-extrabold text-slate-900 text-sm">
                  {customerToDelete.businessName || customerToDelete.name}
                </div>
                {customerToDelete.businessName && (
                  <div className="text-slate-500 mt-0.5">Contact: {customerToDelete.name}</div>
                )}
                <div className="text-slate-400 mt-0.5">Phone: +91 {customerToDelete.phone}</div>
              </div>

              {customerToDelete.outstandingBalance > 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Pending Due: {formatCurrency(customerToDelete.outstandingBalance)}</span>
                  </div>
                  <p className="text-[11px] text-amber-800/80 leading-relaxed">
                    This customer still owes money. Removing them will archive their account and hide them from new sales while preserving their historical payment ledger.
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 leading-relaxed">
                  Are you sure you want to remove this customer? They will be removed from customer lists and sales search.
                </p>
              )}
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteModal(false);
                  setCustomerToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCustomer}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                {deleting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
