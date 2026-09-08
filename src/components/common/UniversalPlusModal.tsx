'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  X,
  UserPlus,
  ShoppingCart,
  Receipt,
  ArrowDownRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Search,
  Sparkles,
  Building,
  Phone,
  CreditCard,
  ChevronRight,
  FileText,
  MessageCircle,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { getISTDateParts, formatISTDate } from '@/lib/date-utils';
import { ProductImage } from '@/components/common/ProductImage';

interface UniversalPlusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type MainView =
  | 'MENU'
  | 'ADD_CUSTOMER'
  | 'NEW_SALE'
  | 'COLLECTION'
  | 'EXPENSE'
  | 'SUCCESS';

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

function getTodayISTString(): string {
  const parts = getISTDateParts(new Date());
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  return `${parts.year}-${mm}-${dd}`;
}

function getYesterdayISTString(): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const parts = getISTDateParts(yesterday);
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  return `${parts.year}-${mm}-${dd}`;
}

export default function UniversalPlusModal({
  isOpen,
  onClose,
  onSuccess,
}: UniversalPlusModalProps) {
  const router = useRouter();

  const [activeView, setActiveView] = useState<MainView>('MENU');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Loaded database items
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  // ==========================================
  // FLOW 1: ADD CUSTOMER (5-Step Wizard)
  // Step 1: Business Name
  // Step 2: Phone Number
  // Step 3: First Order (optional)
  // Step 4: Payment
  // Step 5: Done (SUCCESS)
  // ==========================================
  const [custWizardStep, setCustWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [newCustBusinessName, setNewCustBusinessName] = useState('');
  const [newCustContactName, setNewCustContactName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCity, setNewCustCity] = useState('Raipur');
  const [custOrderQuantities, setCustOrderQuantities] = useState<Record<string, number>>({});
  const [custPaymentType, setCustPaymentType] = useState<'FULL' | 'UNPAID' | 'PARTIAL'>('FULL');
  const [custCustomPaidAmount, setCustCustomPaidAmount] = useState<number>(0);
  const [custPaymentMethod, setCustPaymentMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER'>('UPI');

  // ==========================================
  // FLOW 2: NEW SALE (Existing Customer)
  // Step 1: Select Customer
  // Step 2: Select Products
  // Step 3: Payment
  // Step 4: Done (SUCCESS)
  // ==========================================
  const [saleWizardStep, setSaleWizardStep] = useState<1 | 2 | 3>(1);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedSaleCustomerId, setSelectedSaleCustomerId] = useState('');
  const [saleOrderQuantities, setSaleOrderQuantities] = useState<Record<string, number>>({});
  const [salePaymentType, setSalePaymentType] = useState<'FULL' | 'UNPAID' | 'PARTIAL'>('FULL');
  const [saleCustomPaidAmount, setSaleCustomPaidAmount] = useState<number>(0);
  const [salePaymentMethod, setSalePaymentMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER'>('UPI');

  // ==========================================
  // FLOW 3: COLLECT PAYMENT
  // ==========================================
  const [collCustomerId, setCollCustomerId] = useState('');
  const [collAmount, setCollAmount] = useState<number>(0);
  const [collMethod, setCollMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER'>('UPI');
  const [collRef, setCollRef] = useState('');

  // ==========================================
  // FLOW 4: ADD EXPENSE
  // ==========================================
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDesc, setExpDesc] = useState('');
  const [expCategoryId, setExpCategoryId] = useState('');
  const [expSource, setExpSource] = useState<'BUSINESS_CASH' | 'BUSINESS_BANK' | 'FOUNDER_PERSONAL'>('BUSINESS_CASH');
  const [expDate, setExpDate] = useState<string>(getTodayISTString());

  // SUCCESS Confirmation State
  const [successHeadline, setSuccessHeadline] = useState('');
  const [successDetails, setSuccessDetails] = useState<string[]>([]);
  const [createdSaleId, setCreatedSaleId] = useState<string | null>(null);
  const [createdSaleWhatsAppUrl, setCreatedSaleWhatsAppUrl] = useState<string>('');

  // Load data on open
  useEffect(() => {
    if (isOpen) {
      setActiveView('MENU');
      setError('');
      resetAllForms();

      Promise.all([
        fetch('/api/customers').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/expenses').then((r) => r.json()),
      ])
        .then(([custData, prodData, expData]) => {
          if (Array.isArray(custData)) {
            setCustomers(custData);
            if (custData.length > 0) setCollCustomerId(custData[0].id);
          }
          if (Array.isArray(prodData)) {
            setProducts(prodData);
          }
          if (expData?.categories && Array.isArray(expData.categories)) {
            setCategories(expData.categories);
            if (expData.categories.length > 0) {
              setExpCategoryId(expData.categories[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const resetAllForms = () => {
    setCustWizardStep(1);
    setNewCustBusinessName('');
    setNewCustContactName('');
    setNewCustPhone('');
    setNewCustCity('Raipur');
    setCustOrderQuantities({});
    setCustPaymentType('FULL');
    setCustCustomPaidAmount(0);
    setCustPaymentMethod('UPI');

    setSaleWizardStep(1);
    setCustomerSearch('');
    setSelectedSaleCustomerId('');
    setSaleOrderQuantities({});
    setSalePaymentType('FULL');
    setSaleCustomPaidAmount(0);
    setSalePaymentMethod('UPI');

    setCollAmount(0);
    setCollRef('');
    setExpAmount(0);
    setExpDesc('');
    setExpDate(getTodayISTString());
    setCreatedSaleId(null);
    setCreatedSaleWhatsAppUrl('');
  };

  // Total calculations for Add Customer order
  const custOrderTotal = (products || []).reduce((sum, p) => {
    const qty = custOrderQuantities[p.id] || 0;
    return sum + qty * (p.currentSellingPrice || 0);
  }, 0);

  const custTotalCans = Object.values(custOrderQuantities).reduce((a, b) => a + b, 0);

  // Total calculations for Existing Sale order
  const saleOrderTotal = (products || []).reduce((sum, p) => {
    const qty = saleOrderQuantities[p.id] || 0;
    return sum + qty * (p.currentSellingPrice || 0);
  }, 0);

  const saleTotalCans = Object.values(saleOrderQuantities).reduce((a, b) => a + b, 0);

  const filteredCustomers = useMemo(() => {
    if (!customers || !Array.isArray(customers)) return [];
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.businessName && c.businessName.toLowerCase().includes(q)) ||
        String(c.phone || '').includes(q)
    );
  }, [customers, customerSearch]);

  const selectedCustomerObj = (customers || []).find((c) => c.id === selectedSaleCustomerId);

  // ----------------------------------------------------
  // SUBMIT FLOW 1: SAVE CUSTOMER ONLY (No order)
  // ----------------------------------------------------
  const handleSaveCustomerOnly = async () => {
    setError('');
    if (!newCustBusinessName.trim()) {
      setError('Business name is required');
      return;
    }
    if (!newCustPhone.trim()) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustContactName.trim() || newCustBusinessName.trim(),
          businessName: newCustBusinessName.trim(),
          phone: newCustPhone.trim(),
          city: newCustCity.trim() || 'Raipur',
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to save customer');

      setSuccessHeadline('Customer Saved Successfully!');
      setSuccessDetails([
        newCustBusinessName.trim(),
        `Phone: +91 ${newCustPhone.trim()}`,
        'No order placed • Ready for future sales',
      ]);
      setActiveView('SUCCESS');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // SUBMIT FLOW 1: SAVE CUSTOMER WITH ORDER & PAYMENT
  // ----------------------------------------------------
  const handleCompleteCustomerAndOrder = async () => {
    setError('');
    setLoading(true);
    try {
      // 1. Create Customer
      const custRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustContactName.trim() || newCustBusinessName.trim(),
          businessName: newCustBusinessName.trim(),
          phone: newCustPhone.trim(),
          city: newCustCity.trim() || 'Raipur',
        }),
      });

      const custData = await custRes.json();
      if (!custRes.ok) throw new Error(custData.error || 'Failed to save customer');

      const customerId = custData.customer.id;

      // 2. Determine payment amount
      let paidAmt = custOrderTotal;
      if (custPaymentType === 'UNPAID') paidAmt = 0;
      else if (custPaymentType === 'PARTIAL') paidAmt = Math.min(custOrderTotal, custCustomPaidAmount);

      const items = Object.entries(custOrderQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([productId, quantity]) => ({ productId, quantity }));

      // 3. Create Sale
      const saleRes = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          items,
          discountAmount: 0,
          paidAmount: paidAmt,
          paymentMethod: custPaymentMethod,
          notes: 'First order via Add Customer visit',
        }),
      });

      const saleData = await saleRes.json();
      if (!saleRes.ok) throw new Error(saleData.error || 'Failed to record first order');

      if (saleData.sale) {
        setCreatedSaleId(saleData.sale.id);
        const displayInvNo = (saleData.sale.saleNumber || '').replace(/^SAL-/, 'BH-');
        const balDue = Math.max(0, (saleData.sale.totalAmount || 0) - (saleData.sale.paidAmount || 0));
        const msg = `Hello *${newCustBusinessName.trim()}*,\n\n` +
          `Thank you for choosing *BIHAAN HOME CARE*!\n` +
          `Here are the details for your recent invoice:\n\n` +
          `📄 *Invoice No:* ${displayInvNo}\n` +
          `💰 *Total Amount:* ${formatCurrency(saleData.sale.totalAmount)}\n` +
          `✅ *Paid Amount:* ${formatCurrency(saleData.sale.paidAmount)}\n` +
          (balDue > 0
            ? `⚠️ *Balance Due:* ${formatCurrency(balDue)}\n\n`
            : `🎉 *Status:* Fully Paid\n\n`) +
          `_Every day is a fresh beginning._\n` +
          `*BIHAAN HOME CARE*, Raipur`;

        let cleanP = newCustPhone.replace(/[^0-9]/g, '');
        if (cleanP.length === 10) cleanP = '91' + cleanP;
        setCreatedSaleWhatsAppUrl(`https://wa.me/${cleanP}?text=${encodeURIComponent(msg)}`);
      }

      setSuccessHeadline('Customer & Order Recorded! ✓');
      setSuccessDetails([
        `Customer: ${newCustBusinessName.trim()}`,
        `First Order: ${formatCurrency(custOrderTotal)} (${custTotalCans} cans)`,
        paidAmt >= custOrderTotal
          ? `Paid in Full via ${custPaymentMethod}`
          : paidAmt === 0
          ? `Recorded on Credit (Due: ${formatCurrency(custOrderTotal)})`
          : `Partial: ${formatCurrency(paidAmt)} paid, ${formatCurrency(custOrderTotal - paidAmt)} due`,
        'Inventory stock automatically updated',
      ]);
      setActiveView('SUCCESS');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // SUBMIT FLOW 2: SAVE SALE FOR EXISTING CUSTOMER
  // ----------------------------------------------------
  const handleCompleteExistingSale = async () => {
    setError('');
    if (!selectedSaleCustomerId) {
      setError('Please select a customer');
      return;
    }
    if (saleOrderTotal <= 0) {
      setError('Please add at least 1 product');
      return;
    }

    setLoading(true);
    try {
      let paidAmt = saleOrderTotal;
      if (salePaymentType === 'UNPAID') paidAmt = 0;
      else if (salePaymentType === 'PARTIAL') paidAmt = Math.min(saleOrderTotal, saleCustomPaidAmount);

      const items = Object.entries(saleOrderQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([productId, quantity]) => ({ productId, quantity }));

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedSaleCustomerId,
          items,
          discountAmount: 0,
          paidAmount: paidAmt,
          paymentMethod: salePaymentMethod,
          notes: 'Order recorded via Quick Action',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record sale');

      const customerName = selectedCustomerObj?.businessName || selectedCustomerObj?.name || 'Customer';

      if (data.sale) {
        setCreatedSaleId(data.sale.id);
        const displayInvNo = (data.sale.saleNumber || '').replace(/^SAL-/, 'BH-');
        const balDue = Math.max(0, (data.sale.totalAmount || 0) - (data.sale.paidAmount || 0));
        const msg = `Hello *${customerName}*,\n\n` +
          `Thank you for choosing *BIHAAN HOME CARE*!\n` +
          `Here are the details for your recent invoice:\n\n` +
          `📄 *Invoice No:* ${displayInvNo}\n` +
          `💰 *Total Amount:* ${formatCurrency(data.sale.totalAmount)}\n` +
          `✅ *Paid Amount:* ${formatCurrency(data.sale.paidAmount)}\n` +
          (balDue > 0
            ? `⚠️ *Balance Due:* ${formatCurrency(balDue)}\n\n`
            : `🎉 *Status:* Fully Paid\n\n`) +
          `_Every day is a fresh beginning._\n` +
          `*BIHAAN HOME CARE*, Raipur`;

        let cleanP = selectedCustomerObj?.phone?.replace(/[^0-9]/g, '') || '';
        if (cleanP.length === 10) cleanP = '91' + cleanP;
        setCreatedSaleWhatsAppUrl(`https://wa.me/${cleanP}?text=${encodeURIComponent(msg)}`);
      }

      setSuccessHeadline('Order Recorded Successfully! ✓');
      setSuccessDetails([
        `Customer: ${customerName}`,
        `Order Amount: ${formatCurrency(saleOrderTotal)} (${saleTotalCans} cans)`,
        paidAmt >= saleOrderTotal
          ? `Paid in full via ${salePaymentMethod}`
          : paidAmt === 0
          ? `Added to Customer Due (Due: ${formatCurrency(saleOrderTotal)})`
          : `Partial: ${formatCurrency(paidAmt)} paid, ${formatCurrency(saleOrderTotal - paidAmt)} due`,
        'Stock deducted from inventory automatically',
      ]);
      setActiveView('SUCCESS');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // SUBMIT FLOW 3: COLLECT PAYMENT
  // ----------------------------------------------------
  const handleCollectionSubmit = async () => {
    setError('');
    if (!collCustomerId || collAmount <= 0) {
      setError('Select customer and enter a valid payment amount');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: collCustomerId,
          amount: collAmount,
          paymentMethod: collMethod,
          referenceNumber: collRef,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      const cust = customers.find((c) => c.id === collCustomerId);
      const custName = cust?.businessName || cust?.name || 'Customer';

      setSuccessHeadline('Payment Received! ✓');
      setSuccessDetails([
        `From: ${custName}`,
        `Amount: ${formatCurrency(collAmount)} via ${collMethod}`,
        'Customer balance & cash/bank updated automatically',
      ]);
      setActiveView('SUCCESS');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // SUBMIT FLOW 4: ADD EXPENSE
  // ----------------------------------------------------
  const handleExpenseSubmit = async () => {
    setError('');
    if (expAmount <= 0 || !expDesc.trim()) {
      setError('Enter expense amount and a brief description');
      return;
    }

    const selectedDate = expDate ? new Date(`${expDate}T12:00:00+05:30`) : new Date();

    setLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: expAmount,
          description: expDesc.trim(),
          categoryId: expCategoryId,
          paymentSource: expSource,
          date: selectedDate.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record expense');

      const sourceLabel =
        expSource === 'BUSINESS_CASH'
          ? 'Business Cash'
          : expSource === 'BUSINESS_BANK'
          ? 'Business Bank'
          : 'Founder Personal';

      setSuccessHeadline('Expense Recorded! ✓');
      setSuccessDetails([
        `Amount: ${formatCurrency(expAmount)}`,
        `Date: ${formatISTDate(selectedDate)}`,
        `Description: ${expDesc.trim()}`,
        `Paid by: ${sourceLabel}`,
        'Updated ledger and settlement balances',
      ]);
      setActiveView('SUCCESS');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Close and refresh
  const handleFinish = () => {
    onClose();
    if (onSuccess) onSuccess();
    router.refresh();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end md:justify-center p-0 md:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-t-3xl md:rounded-3xl max-h-[92vh] flex flex-col max-w-md w-full mx-auto overflow-hidden shadow-2xl">
        {/* ========================================================= */}
        {/* MODAL TOP HEADER                                         */}
        {/* ========================================================= */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-[#F8F9FD]">
          <div className="flex items-center gap-2">
            {activeView !== 'MENU' && activeView !== 'SUCCESS' && (
              <button
                onClick={() => {
                  setError('');
                  if (activeView === 'ADD_CUSTOMER') {
                    if (custWizardStep > 1) setCustWizardStep((s) => (s - 1) as any);
                    else setActiveView('MENU');
                  } else if (activeView === 'NEW_SALE') {
                    if (saleWizardStep > 1) setSaleWizardStep((s) => (s - 1) as any);
                    else setActiveView('MENU');
                  } else {
                    setActiveView('MENU');
                  }
                }}
                className="w-8 h-8 rounded-xl bg-white border border-[#ECEEF3] text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors mr-1 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div>
              <h2 className="font-extrabold text-sm text-slate-900 leading-tight">
                {activeView === 'MENU' && 'Quick Record'}
                {activeView === 'ADD_CUSTOMER' && `Add Customer (Step ${custWizardStep} of ${custTotalCans > 0 ? 4 : 3})`}
                {activeView === 'NEW_SALE' && `New Sale (Step ${saleWizardStep} of 3)`}
                {activeView === 'COLLECTION' && 'Collect Payment'}
                {activeView === 'EXPENSE' && 'Add Expense'}
                {activeView === 'SUCCESS' && 'Confirmation'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {activeView === 'MENU' && 'Fast 1-tap entry for founders'}
                {activeView === 'ADD_CUSTOMER' && custWizardStep === 1 && 'Step 1: Business name'}
                {activeView === 'ADD_CUSTOMER' && custWizardStep === 2 && 'Step 2: Phone & WhatsApp'}
                {activeView === 'ADD_CUSTOMER' && custWizardStep === 3 && 'Step 3: First order (optional)'}
                {activeView === 'ADD_CUSTOMER' && custWizardStep === 4 && 'Step 4: Payment details'}
                {activeView === 'NEW_SALE' && saleWizardStep === 1 && 'Select customer'}
                {activeView === 'NEW_SALE' && saleWizardStep === 2 && 'Select products & cans'}
                {activeView === 'NEW_SALE' && saleWizardStep === 3 && 'Payment & credit terms'}
                {activeView === 'COLLECTION' && 'Record payment received from buyer'}
                {activeView === 'EXPENSE' && 'Record business or personal expense'}
                {activeView === 'SUCCESS' && 'Transaction recorded ✓'}
              </p>
            </div>
          </div>

          <button
            onClick={activeView === 'SUCCESS' ? handleFinish : onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-100 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: MAIN "QUICK RECORD" MENU (4 Simple Buttons)        */}
        {/* ========================================================= */}
        {activeView === 'MENU' && (
          <div className="p-5 space-y-2.5">
            {/* 1. Add Customer */}
            <button
              onClick={() => {
                setError('');
                setActiveView('ADD_CUSTOMER');
                setCustWizardStep(1);
              }}
              className="w-full p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 flex items-center gap-3.5 text-left transition-all active:scale-[0.99] group shadow-card"
            >
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-950 flex items-center justify-between">
                  <span>+ Add Customer</span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                    Fast Entry
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  New hotel, shop, or clinic lead • 30-sec wizard
                </div>
              </div>
            </button>

            {/* 2. New Sale / Order */}
            <button
              onClick={() => {
                setError('');
                setActiveView('NEW_SALE');
                setSaleWizardStep(1);
              }}
              className="w-full p-4 rounded-2xl border border-[#ECEEF3] hover:border-emerald-200 bg-white hover:bg-emerald-50/30 flex items-center gap-3.5 text-left transition-all active:scale-[0.99] group shadow-card"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-950">
                  + New Sale / Order
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Record sale for existing customer & auto-deduct stock
                </div>
              </div>
            </button>

            {/* 3. Collect Payment */}
            <button
              onClick={() => {
                setError('');
                setActiveView('COLLECTION');
              }}
              className="w-full p-4 rounded-2xl border border-[#ECEEF3] hover:border-purple-200 bg-white hover:bg-purple-50/30 flex items-center gap-3.5 text-left transition-all active:scale-[0.99] group shadow-card"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-600/30">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-sm text-slate-900 group-hover:text-purple-950">
                  + Collect Payment
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Receive cash, UPI, or bank payment against due
                </div>
              </div>
            </button>

            {/* 4. Add Expense */}
            <button
              onClick={() => {
                setError('');
                setActiveView('EXPENSE');
              }}
              className="w-full p-4 rounded-2xl border border-[#ECEEF3] hover:border-rose-200 bg-white hover:bg-rose-50/30 flex items-center gap-3.5 text-left transition-all active:scale-[0.99] group shadow-card"
            >
              <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-sm text-slate-900 group-hover:text-rose-950">
                  + Add Expense
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Fuel, raw materials, packaging, tea, delivery
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: ADD CUSTOMER WIZARD                                 */}
        {/* ========================================================= */}
        {activeView === 'ADD_CUSTOMER' && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {/* STEP 1: BUSINESS NAME */}
            {custWizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Business / Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={newCustBusinessName}
                    onChange={(e) => setNewCustBusinessName(e.target.value)}
                    placeholder="e.g. Hotel Grand Raipur or Ramesh Store"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-900 focus:bg-white outline-hidden transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    The trade name or owner name recognized by founders.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Contact Person Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCustContactName}
                    onChange={(e) => setNewCustContactName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar (Manager / Owner)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white outline-hidden"
                  />
                </div>

                <button
                  type="button"
                  disabled={!newCustBusinessName.trim()}
                  onClick={() => {
                    setError('');
                    setCustWizardStep(2);
                  }}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
                >
                  <span>Continue to Phone Number</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: PHONE NUMBER */}
            {custWizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Phone / WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      autoFocus
                      maxLength={10}
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 rounded-xl px-3.5 py-3 text-sm font-black font-tabular text-slate-900 focus:bg-white outline-hidden transition-all tracking-wider"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Used for WhatsApp bill dispatch & payment reminders.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    City / Area (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    placeholder="Raipur, Bilaspur, Durg..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white outline-hidden"
                  />
                </div>

                <button
                  type="button"
                  disabled={newCustPhone.trim().length < 10}
                  onClick={() => {
                    setError('');
                    setCustWizardStep(3);
                  }}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
                >
                  <span>Continue to First Order (Optional)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 3: FIRST ORDER (OPTIONAL) */}
            {custWizardStep === 3 && (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-950 font-medium">
                  Did <strong className="font-bold">{newCustBusinessName}</strong> take products right now during this visit?
                </div>

                {/* 3 Standard Products List */}
                <div className="space-y-2.5">
                  {products.map((p) => {
                    const qty = custOrderQuantities[p.id] || 0;
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                            <ProductImage product={p} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 leading-tight">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {formatCurrency(p.currentSellingPrice)} / can • Stock: {p.currentStock}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setCustOrderQuantities((prev) => ({
                                ...prev,
                                [p.id]: Math.max(0, (prev[p.id] || 0) - 1),
                              }));
                            }}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-black font-tabular text-slate-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCustOrderQuantities((prev) => ({
                                ...prev,
                                [p.id]: (prev[p.id] || 0) + 1,
                              }));
                            }}
                            className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal preview if cans selected */}
                {custTotalCans > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">
                      Order Subtotal ({custTotalCans} cans):
                    </span>
                    <span className="font-black text-slate-900 text-sm font-tabular">
                      {formatCurrency(custOrderTotal)}
                    </span>
                  </div>
                )}

                {/* Progressive Actions: Continue to Payment OR Save Customer Only */}
                {custTotalCans > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setCustWizardStep(4);
                    }}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
                  >
                    <span>Continue to Payment ({formatCurrency(custOrderTotal)})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSaveCustomerOnly}
                    className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
                  >
                    <span>{loading ? 'Saving...' : 'Save Customer (No Order Placed) ✓'}</span>
                  </button>
                )}
              </div>
            )}

            {/* STEP 4: PAYMENT (When customer placed first order) */}
            {custWizardStep === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-emerald-800">Total Order Amount</div>
                    <div className="text-2xl font-black text-emerald-950 font-tabular mt-0.5">
                      {formatCurrency(custOrderTotal)}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white text-emerald-800 border border-emerald-200">
                    {custTotalCans} cans
                  </span>
                </div>

                {/* Payment Option Pills */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    How is this order being paid?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustPaymentType('FULL')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        custPaymentType === 'FULL'
                          ? 'bg-emerald-600 border-emerald-600 text-white font-black'
                          : 'bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">Paid in Full</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{formatCurrency(custOrderTotal)}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustPaymentType('UNPAID')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        custPaymentType === 'UNPAID'
                          ? 'bg-amber-600 border-amber-600 text-white font-black'
                          : 'bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">On Credit</div>
                      <div className="text-[10px] opacity-80 mt-0.5">₹0 Paid</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustPaymentType('PARTIAL')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        custPaymentType === 'PARTIAL'
                          ? 'bg-indigo-600 border-indigo-600 text-white font-black'
                          : 'bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">Partial</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Split</div>
                    </button>
                  </div>
                </div>

                {/* Partial amount input if selected */}
                {custPaymentType === 'PARTIAL' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Amount Collected Now (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={custOrderTotal}
                      value={custCustomPaidAmount || ''}
                      onChange={(e) => setCustCustomPaidAmount(Number(e.target.value))}
                      placeholder="e.g. 500"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-base font-black font-tabular text-slate-900"
                    />
                    <div className="text-[11px] text-amber-700 mt-1 font-semibold">
                      Remaining Due: {formatCurrency(Math.max(0, custOrderTotal - custCustomPaidAmount))}
                    </div>
                  </div>
                )}

                {/* Payment Method Selector (if payment > 0) */}
                {custPaymentType !== 'UNPAID' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['UPI', 'CASH', 'BANK_TRANSFER'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCustPaymentMethod(m)}
                          className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                            custPaymentMethod === m
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {m === 'BANK_TRANSFER' ? 'Bank' : m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Finish Button */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompleteCustomerAndOrder}
                  className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
                >
                  <span>{loading ? 'Recording Order...' : 'Complete & Record Sale ➔'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: NEW SALE (Existing Customer)                        */}
        {/* ========================================================= */}
        {activeView === 'NEW_SALE' && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {/* STEP 1: SELECT CUSTOMER */}
            {saleWizardStep === 1 && (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by hotel, shop, phone..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white outline-hidden"
                  />
                </div>

                {/* Customer List */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white">
                  {filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedSaleCustomerId(c.id);
                        setError('');
                        setSaleWizardStep(2);
                      }}
                      className="p-3 hover:bg-indigo-50/50 cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600">
                          {c.businessName || c.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {c.name !== c.businessName && c.businessName ? `${c.name} • ` : ''}
                          {c.phone}
                        </div>
                      </div>
                      <div className="text-right">
                        {c.outstandingBalance > 0 ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Due: {formatCurrency(c.outstandingBalance)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Clear ✓
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredCustomers.length === 0 && (
                    <div className="p-5 text-center text-xs text-slate-400 font-medium">
                      No matching customers found.
                    </div>
                  )}
                </div>

                {/* Shortcut to switch to Add Customer */}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setActiveView('ADD_CUSTOMER');
                    setCustWizardStep(1);
                  }}
                  className="w-full py-2.5 rounded-xl border border-dashed border-indigo-300 hover:bg-indigo-50/50 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add New Customer Instead</span>
                </button>
              </div>
            )}

            {/* STEP 2: SELECT PRODUCTS */}
            {saleWizardStep === 2 && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Buyer:</span>
                  <strong className="text-slate-900 font-bold">
                    {selectedCustomerObj?.businessName || selectedCustomerObj?.name}
                  </strong>
                </div>

                {/* 3 Products Counter */}
                <div className="space-y-2.5">
                  {products.map((p) => {
                    const qty = saleOrderQuantities[p.id] || 0;
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                            <ProductImage product={p} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 leading-tight">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {formatCurrency(p.currentSellingPrice)} / can • Stock: {p.currentStock}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setSaleOrderQuantities((prev) => ({
                                ...prev,
                                [p.id]: Math.max(0, (prev[p.id] || 0) - 1),
                              }));
                            }}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-black font-tabular text-slate-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSaleOrderQuantities((prev) => ({
                                ...prev,
                                [p.id]: (prev[p.id] || 0) + 1,
                              }));
                            }}
                            className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal Preview */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    Total ({saleTotalCans} cans):
                  </span>
                  <span className="font-black text-slate-900 text-sm font-tabular">
                    {formatCurrency(saleOrderTotal)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={saleTotalCans === 0}
                  onClick={() => {
                    setError('');
                    setSaleWizardStep(3);
                  }}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
                >
                  <span>Continue to Payment ({formatCurrency(saleOrderTotal)})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 3: PAYMENT */}
            {saleWizardStep === 3 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-emerald-800">Total Order Amount</div>
                    <div className="text-2xl font-black text-emerald-950 font-tabular mt-0.5">
                      {formatCurrency(saleOrderTotal)}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white text-emerald-800 border border-emerald-200">
                    {saleTotalCans} cans
                  </span>
                </div>

                {/* Payment Option Buttons */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Payment Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSalePaymentType('FULL')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        salePaymentType === 'FULL'
                          ? 'bg-emerald-600 border-emerald-600 text-white font-black'
                          : 'bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">Full Paid</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{formatCurrency(saleOrderTotal)}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSalePaymentType('UNPAID')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        salePaymentType === 'UNPAID'
                          ? 'bg-amber-600 border-amber-600 text-white font-black'
                          : 'bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">On Credit</div>
                      <div className="text-[10px] opacity-80 mt-0.5">₹0 Paid</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSalePaymentType('PARTIAL')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        salePaymentType === 'PARTIAL'
                          ? 'bg-indigo-600 border-indigo-600 text-white font-black'
                          : 'bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">Partial</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Split</div>
                    </button>
                  </div>
                </div>

                {/* Partial amount input if selected */}
                {salePaymentType === 'PARTIAL' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Amount Collected Now (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={saleOrderTotal}
                      value={saleCustomPaidAmount || ''}
                      onChange={(e) => setSaleCustomPaidAmount(Number(e.target.value))}
                      placeholder="e.g. 500"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-base font-black font-tabular text-slate-900"
                    />
                    <div className="text-[11px] text-amber-700 mt-1 font-semibold">
                      Remaining Due: {formatCurrency(Math.max(0, saleOrderTotal - saleCustomPaidAmount))}
                    </div>
                  </div>
                )}

                {/* Payment Method Selector (if payment > 0) */}
                {salePaymentType !== 'UNPAID' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['UPI', 'CASH', 'BANK_TRANSFER'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSalePaymentMethod(m)}
                          className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                            salePaymentMethod === m
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {m === 'BANK_TRANSFER' ? 'Bank' : m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Finish Button */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompleteExistingSale}
                  className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
                >
                  <span>{loading ? 'Confirming Sale...' : 'Confirm Order & Deduct Stock ➔'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: COLLECT PAYMENT                                     */}
        {/* ========================================================= */}
        {activeView === 'COLLECTION' && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Select Customer
              </label>
              <select
                value={collCustomerId}
                onChange={(e) => setCollCustomerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-900 outline-hidden"
              >
                {(customers || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName || c.name} {(c.outstandingBalance || 0) > 0 ? `• Due: ${formatCurrency(c.outstandingBalance)}` : '• Clear'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Payment Amount Received (₹)
              </label>
              <input
                type="number"
                min="1"
                autoFocus
                value={collAmount || ''}
                onChange={(e) => setCollAmount(Number(e.target.value))}
                placeholder="₹ Amount received"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-3 text-2xl font-black font-tabular text-slate-900 outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'CASH', 'BANK_TRANSFER'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCollMethod(m)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                      collMethod === m
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {m === 'BANK_TRANSFER' ? 'Bank' : m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Reference ID / Note (Optional)
              </label>
              <input
                type="text"
                value={collRef}
                onChange={(e) => setCollRef(e.target.value)}
                placeholder="UPI Ref ID or check note"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-hidden"
              />
            </div>

            <button
              type="button"
              disabled={loading || collAmount <= 0}
              onClick={handleCollectionSubmit}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
            >
              <span>{loading ? 'Recording...' : 'Record Payment Collection ✓'}</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: ADD EXPENSE                                         */}
        {/* ========================================================= */}
        {activeView === 'EXPENSE' && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Expense Category
              </label>
              <select
                value={expCategoryId}
                onChange={(e) => setExpCategoryId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-900 outline-hidden"
              >
                {(categories || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                autoFocus
                value={expAmount || ''}
                onChange={(e) => setExpAmount(Number(e.target.value))}
                placeholder="₹ Amount spent"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-3 text-2xl font-black font-tabular text-slate-900 outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Description / Purpose
              </label>
              <input
                type="text"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="e.g. Fuel for Bhilai delivery, 50 can caps, tea..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-hidden"
              />
            </div>

            {/* Expense Date */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Expense Date</span>
                </label>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                  {expDate === getTodayISTString()
                    ? 'Today'
                    : expDate === getYesterdayISTString()
                    ? 'Yesterday'
                    : 'Past Date'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpDate(getTodayISTString())}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      expDate === getTodayISTString()
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpDate(getYesterdayISTString())}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      expDate === getYesterdayISTString()
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Yesterday
                  </button>
                </div>

                <input
                  type="date"
                  max={getTodayISTString()}
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-hidden focus:border-rose-500 focus:bg-white transition-all cursor-pointer"
                />

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Recording for date:</span>
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-600" />
                    {formatISTDate(new Date(`${expDate}T12:00:00+05:30`))}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Paid From
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'BUSINESS_CASH', label: 'Company Cash' },
                  { id: 'BUSINESS_BANK', label: 'Company Bank' },
                  { id: 'FOUNDER_PERSONAL', label: 'Personal (You)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setExpSource(s.id as any)}
                    className={`py-2 px-1.5 text-[11px] font-bold rounded-xl border text-center transition-all ${
                      expSource === s.id
                        ? 'bg-rose-600 border-rose-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={loading || expAmount <= 0 || !expDesc.trim()}
              onClick={handleExpenseSubmit}
              className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
            >
              <span>
                {loading
                  ? 'Recording...'
                  : `Record Expense for ${formatISTDate(new Date(`${expDate}T12:00:00+05:30`))} ✓`}
              </span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: SUCCESS CONFIRMATION                                */}
        {/* ========================================================= */}
        {activeView === 'SUCCESS' && (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-75 duration-200">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {successHeadline}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Updated in real-time across BIHAN BUSINESS
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-1.5">
              {successDetails.map((detail, idx) => (
                <div key={idx} className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>

            {createdSaleId && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href={`/invoices/${createdSaleId}`}
                  onClick={() => onClose()}
                  className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Invoice</span>
                </Link>

                <a
                  href={createdSaleWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Share WhatsApp</span>
                </a>
              </div>
            )}

            <button
              onClick={handleFinish}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98"
            >
              Done & Return to Dashboard ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
