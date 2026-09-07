'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  Share2,
  AlertCircle,
  Loader2,
  Check,
  FileText,
} from 'lucide-react';
import { InvoiceDocument, InvoiceSale } from '@/components/invoice/InvoiceDocument';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [sale, setSale] = useState<InvoiceSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchSale() {
      try {
        setLoading(true);
        const res = await fetch(`/api/sales/${id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load invoice details');
        }
        const data = await res.json();
        setSale(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error fetching invoice');
      } finally {
        setLoading(false);
      }
    }
    fetchSale();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppShareUrl = () => {
    if (!sale) return '#';
    const displayInvoiceNumber = sale.saleNumber.replace(/^SAL-/, 'BH-');
    const customerName = sale.customer.businessName || sale.customer.name;
    const balanceDue = Math.max(0, sale.totalAmount - sale.paidAmount);

    const itemsSummary = sale.items
      .map(
        (it) =>
          `• ${it.product?.name || 'Item'} (${it.product?.packSizeLitres || 5}L) x ${it.quantity}`
      )
      .join('\n');

    const msg = `Hello *${customerName}*,\n\n` +
      `Thank you for choosing *BIHAAN HOME CARE*!\n` +
      `Here are the details for your recent invoice:\n\n` +
      `📄 *Invoice No:* ${displayInvoiceNumber}\n` +
      `📅 *Date:* ${formatDate(sale.date)}\n` +
      `📦 *Items:*\n${itemsSummary}\n\n` +
      `💰 *Total Amount:* ${formatCurrency(sale.totalAmount)}\n` +
      `✅ *Paid Amount:* ${formatCurrency(sale.paidAmount)}\n` +
      (balanceDue > 0
        ? `⚠️ *Balance Due:* ${formatCurrency(balanceDue)}\n\n`
        : `🎉 *Status:* Fully Paid\n\n`) +
      `_Every day is a fresh beginning._\n` +
      `*BIHAAN HOME CARE*, Raipur`;

    // Clean phone number (strip whitespace/hyphens)
    let cleanPhone = sale.customer.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleCopySummary = () => {
    if (!sale) return;
    const displayInvoiceNumber = sale.saleNumber.replace(/^SAL-/, 'BH-');
    const customerName = sale.customer.businessName || sale.customer.name;
    const balanceDue = Math.max(0, sale.totalAmount - sale.paidAmount);
    const itemsSummary = sale.items
      .map(
        (it) =>
          `• ${it.product?.name || 'Item'} (${it.product?.packSizeLitres || 5}L) x ${it.quantity}`
      )
      .join('\n');

    const text = `BIHAAN HOME CARE — Invoice ${displayInvoiceNumber}\n` +
      `Customer: ${customerName}\n` +
      `Date: ${formatDate(sale.date)}\n` +
      `Items:\n${itemsSummary}\n` +
      `Total: ${formatCurrency(sale.totalAmount)} | Paid: ${formatCurrency(sale.paidAmount)} | Due: ${formatCurrency(balanceDue)}\n` +
      `Non-GST Sales Invoice`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-sm font-bold text-slate-600">Loading invoice details...</p>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-extrabold text-slate-900">Unable to load invoice</h2>
        <p className="text-xs text-slate-500">{error || 'Invoice record not found.'}</p>
        <div className="pt-2">
          <Link
            href="/sales"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sales
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 print:pb-0">
      {/* Top Action Bar (Hidden during printing) */}
      <div className="max-w-[210mm] mx-auto mb-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopySummary}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 px-3 rounded-xl transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 py-2 px-3.5 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share WhatsApp</span>
            </a>

            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-[#07478E] hover:bg-[#063b77] py-2 px-4 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Document Body */}
      <div className="print:m-0 print:p-0">
        <InvoiceDocument sale={sale} />
      </div>
    </div>
  );
}
