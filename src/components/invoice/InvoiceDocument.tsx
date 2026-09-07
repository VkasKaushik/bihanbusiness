import React from 'react';
import { formatCurrency, formatDate, numberToWordsIndian } from '@/lib/formatters';

export interface InvoiceSale {
  id: string;
  saleNumber: string;
  date: string | Date;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paidAmount: number;
  notes?: string | null;
  customer: {
    id: string;
    name: string;
    businessName?: string | null;
    phone: string;
    address?: string | null;
    city?: string | null;
    gstNumber?: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product: {
      id: string;
      name: string;
      sku: string;
      category?: string;
      packSizeLitres?: number;
      imageEmoji?: string;
    };
  }>;
  payments?: Array<{
    id: string;
    paymentNumber: string;
    amount: number;
    paymentDate: string | Date;
    paymentMethod: string;
    notes?: string | null;
  }>;
}

interface InvoiceDocumentProps {
  sale: InvoiceSale;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ sale }) => {
  const displayInvoiceNumber = sale.saleNumber.replace(/^SAL-/, 'BH-');
  const balanceDue = Math.max(0, sale.totalAmount - sale.paidAmount);
  const totalCans = sale.items.reduce((sum, it) => sum + it.quantity, 0);

  // Determine payment method from payments or fallback
  const paymentMethod =
    sale.payments && sale.payments.length > 0
      ? sale.payments[0].paymentMethod
      : sale.paidAmount > 0
      ? 'UPI / Cash'
      : 'Credit (Due)';

  return (
    <div className="invoice-document bg-white text-slate-800 font-sans mx-auto max-w-[210mm] min-h-[297mm] p-8 sm:p-12 border border-slate-200 print:border-none print:p-0 print:m-0 print:max-w-none print:min-h-0 print:w-full print:shadow-none shadow-xl rounded-2xl print:rounded-none flex flex-col justify-between">
      <div>
        {/* ========================================================= */}
        {/* 1. HEADER: BRANDING & INVOICE META                       */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-slate-900/80">
          {/* Brand Left */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bihan-logo.png"
                alt="BIHAAN HOME CARE"
                className="h-12 sm:h-14 w-auto object-contain"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  BIHAAN HOME CARE
                </h1>
                <p className="text-xs font-semibold text-emerald-700 italic tracking-wide">
                  Every day is a fresh beginning.
                </p>
              </div>
            </div>

            <div className="text-[11px] sm:text-xs text-slate-500 space-y-0.5 pt-1">
              <p className="font-medium">Premium Cleaning & Home Care Products</p>
              <p>Raipur, Chhattisgarh — 492001, India</p>
              <p>Phone / WhatsApp: +91 91095 86968</p>
            </div>
          </div>

          {/* Invoice Meta Right */}
          <div className="sm:text-right space-y-2 self-stretch sm:self-auto flex flex-col justify-between sm:items-end">
            <div>
              <span className="inline-block text-2xl sm:text-3xl font-black text-slate-900 tracking-wider">
                INVOICE
              </span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Sales Invoice (Non-GST)
              </p>
            </div>

            <div className="space-y-1 text-xs sm:text-sm font-medium pt-1">
              <div className="flex sm:justify-end gap-2">
                <span className="text-slate-400 font-semibold">Invoice No:</span>
                <span className="font-black text-slate-900 font-tabular">{displayInvoiceNumber}</span>
              </div>
              <div className="flex sm:justify-end gap-2">
                <span className="text-slate-400 font-semibold">Invoice Date:</span>
                <span className="font-bold text-slate-900">{formatDate(sale.date)}</span>
              </div>
              <div className="flex sm:justify-end items-center gap-2 pt-1">
                <span className="text-slate-400 font-semibold text-xs">Payment Status:</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    sale.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : sale.paymentStatus === 'PARTIALLY_PAID'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {sale.paymentStatus === 'PAID'
                    ? 'PAID'
                    : sale.paymentStatus === 'PARTIALLY_PAID'
                    ? 'PARTIAL'
                    : 'PAYMENT DUE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. BILL TO SECTION                                        */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 text-xs border-b border-slate-200">
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Bill To / Buyer Details
            </span>
            <div className="text-sm font-black text-slate-900">
              {sale.customer.businessName || sale.customer.name}
            </div>
            {sale.customer.businessName && sale.customer.name && (
              <p className="text-slate-600 font-medium">
                <span className="text-slate-400">Contact:</span> {sale.customer.name}
              </p>
            )}
            <p className="text-slate-600 font-medium">
              <span className="text-slate-400">Phone:</span> {sale.customer.phone}
            </p>
            {(sale.customer.address || sale.customer.city) && (
              <p className="text-slate-600 font-medium">
                <span className="text-slate-400">Address:</span>{' '}
                {[sale.customer.address, sale.customer.city].filter(Boolean).join(', ')}
              </p>
            )}
            {sale.customer.gstNumber && (
              <p className="text-slate-700 font-bold pt-0.5">
                <span className="text-slate-400 font-semibold">Customer GSTIN:</span>{' '}
                {sale.customer.gstNumber}
              </p>
            )}
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-1.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Dispatch & Order Details
              </span>
              <p className="text-slate-600 font-medium">
                <span className="text-slate-400">Order Reference:</span> #{sale.saleNumber}
              </p>
              <p className="text-slate-600 font-medium">
                <span className="text-slate-400">Place of Supply:</span> Raipur, Chhattisgarh
              </p>
              <p className="text-slate-600 font-medium">
                <span className="text-slate-400">Total Units:</span> {totalCans} Cans ({sale.items.length} {sale.items.length === 1 ? 'Item' : 'Items'})
              </p>
            </div>

            {sale.notes && (
              <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                <span className="font-bold text-slate-700">Remarks:</span> {sale.notes}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. ITEMS TABLE                                            */}
        {/* ========================================================= */}
        <div className="py-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[11px] font-black uppercase tracking-wider text-slate-900 bg-slate-100/70">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Product Description</th>
                <th className="py-3 px-3 text-center">Pack Size</th>
                <th className="py-3 px-3 text-right">Qty</th>
                <th className="py-3 px-3 text-right">Rate (₹)</th>
                <th className="py-3 px-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {sale.items.map((item, index) => {
                const pack = item.product?.packSizeLitres
                  ? `${item.product.packSizeLitres} Litres`
                  : '5 Litres';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {item.product?.name || 'BIHAAN Product'}
                      </div>
                      {item.product?.sku && (
                        <div className="text-[10px] font-mono text-slate-400">
                          SKU: {item.product.sku}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-600 whitespace-nowrap">
                      {pack}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold font-tabular text-slate-900">
                      {item.quantity} cans
                    </td>
                    <td className="py-3 px-3 text-right font-semibold font-tabular text-slate-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-black font-tabular text-slate-900 text-xs sm:text-sm">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ========================================================= */}
        {/* 4. TOTALS & SUMMARY BREAKDOWN                             */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 pb-6 border-t-2 border-slate-900">
          {/* Left Column: Words & Payment Details */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Amount in Words
              </span>
              <p className="font-black text-slate-900 italic leading-snug">
                {numberToWordsIndian(sale.totalAmount)}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Payment Information
              </span>
              <div className="flex justify-between text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-extrabold text-slate-900">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Received:</span>
                <span className="font-bold text-emerald-700 font-tabular">
                  {formatCurrency(sale.paidAmount)}
                </span>
              </div>
              {balanceDue > 0 && (
                <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200/80 pt-1">
                  <span>Balance Due:</span>
                  <span className="font-tabular font-black">{formatCurrency(balanceDue)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Financial Calculation */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 py-1">
              <span className="font-semibold">Subtotal</span>
              <span className="font-extrabold text-slate-900 font-tabular text-sm">
                {formatCurrency(sale.subtotalAmount)}
              </span>
            </div>

            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600 py-1">
                <span className="font-semibold">Special Discount</span>
                <span className="font-extrabold font-tabular text-sm">
                  -{formatCurrency(sale.discountAmount)}
                </span>
              </div>
            )}

            {/* Total Amount High-Emphasis Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 my-2 flex justify-between items-center shadow-md">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block">
                  Total Payable
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  Net invoice value
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-tabular tracking-tight text-white">
                {formatCurrency(sale.totalAmount)}
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-slate-600 py-0.5">
                <span className="font-semibold">Amount Paid:</span>
                <span className="font-extrabold text-emerald-700 font-tabular">
                  {formatCurrency(sale.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-800 py-0.5 border-t border-slate-200 pt-1">
                <span className="font-bold">Balance Outstanding:</span>
                <span
                  className={`font-black font-tabular text-sm ${
                    balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. NON-GST COMPLIANCE DECLARATION                        */}
        {/* ========================================================= */}
        <div className="my-4 p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
          <span className="font-black text-amber-800 shrink-0">Note:</span>
          <span>
            BIHAAN HOME CARE is currently not registered under GST. No GST has been charged on
            this invoice.
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. SIGN-OFF & FOOTER                                      */}
      {/* ========================================================= */}
      <div className="pt-6 border-t border-slate-200 mt-6 space-y-6">
        <div className="flex justify-between items-end">
          <div className="text-[11px] text-slate-500 max-w-xs space-y-1">
            <p className="font-bold text-slate-700">Terms & Conditions:</p>
            <p>1. Goods once sold are non-refundable except for manufacturing defects.</p>
            <p>2. Please check cans and pack seals upon receipt.</p>
          </div>

          <div className="text-right space-y-12">
            <p className="text-xs font-black text-slate-900 uppercase">
              For BIHAAN HOME CARE
            </p>
            <div className="border-t border-slate-400 pt-1 w-44 inline-block text-center">
              <p className="text-[11px] font-bold text-slate-600">Authorized Signatory</p>
            </div>
          </div>
        </div>

        <div className="text-center border-t border-slate-100 pt-4 text-[11px] text-slate-400 space-y-0.5">
          <p className="font-bold text-slate-600">
            Thank you for choosing BIHAAN HOME CARE!
          </p>
          <p>
            Every day is a fresh beginning. • Raipur, Chhattisgarh • Support: +91 91095 86968
          </p>
        </div>
      </div>
    </div>
  );
};
