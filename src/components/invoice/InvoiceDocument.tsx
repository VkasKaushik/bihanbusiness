import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  FileText,
  Coins,
  Info,
  Leaf,
  ShieldCheck,
  Home,
  CheckCircle2,
} from 'lucide-react';
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
  createdBy?: {
    id: string;
    name: string;
  } | null;
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

// Helper to provide nice brand product tagline matching official branding
function getProductSubtitle(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('classic') || lower.includes('white')) {
    return 'Fresh & Clean Floors';
  }
  if (lower.includes('lavender')) {
    return 'Fresh Lavender Fragrance';
  }
  if (lower.includes('toilet')) {
    return 'Cleaner Toilets, Fresher Starts';
  }
  return 'Premium Surface Care & Hygiene';
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ sale }) => {
  const displayInvoiceNumber = sale.saleNumber.replace(/^SAL-/, 'BH-');
  const balanceDue = Math.max(0, sale.totalAmount - sale.paidAmount);

  // Determine payment terms display
  const paymentTerms =
    sale.paidAmount >= sale.totalAmount && sale.totalAmount > 0
      ? 'Paid / Immediate'
      : sale.paidAmount > 0
      ? 'Cash / Credit'
      : 'Credit / Due';

  const salesperson = sale.createdBy?.name || 'Vikas Kaushik';

  // Customer display values
  const customerTitle = sale.customer.businessName || sale.customer.name;
  const customerFullAddress = [
    sale.customer.address,
    sale.customer.city || 'Bilaspur, Chhattisgarh 495001',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="invoice-document bg-white text-slate-800 font-sans mx-auto max-w-[210mm] p-6 sm:p-9 border border-slate-200 shadow-xl rounded-2xl print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none flex flex-col justify-between select-none">
      <div className="space-y-4">
        {/* ========================================================= */}
        {/* 1. TOP HEADER: LOGO, COMPANY INFO & BRAND SLOGAN         */}
        {/* ========================================================= */}
        <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-100 relative">
          {/* Logo & Company Address */}
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="shrink-0 pt-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bihan-logo.png"
                alt="BIHAAN HOME CARE"
                className="h-14 sm:h-16 w-auto object-contain"
              />
              <p className="text-[10px] italic font-medium text-slate-400 mt-1 tracking-tight">
                Every day is a fresh beginning.
              </p>
            </div>

            {/* Vertical Divider */}
            <div className="w-[1.5px] h-20 bg-slate-200 self-center hidden sm:block mx-1" />

            {/* Company Details */}
            <div className="text-left space-y-1">
              <div>
                <h1 className="text-sm font-black tracking-tight text-[#07478E] uppercase leading-none">
                  BIHAAN HOME CARE
                </h1>
                <p className="text-[11px] font-semibold text-[#0284c7] mt-0.5">
                  Cleaning Solutions for Healthier Spaces
                </p>
              </div>

              <div className="text-[10px] text-slate-500 space-y-0.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-[#07478E] shrink-0" />
                  <span>Bilaspur, Chhattisgarh 495001</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-[#07478E] shrink-0" />
                  <span>+91 93000 12345 / +91 91095 86968</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-[#07478E] shrink-0" />
                  <span>care@bihanhomecare.in</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-[#07478E] shrink-0" />
                  <span>bihanhomecare.in</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Top Slogan & Soft Decorative Wave */}
          <div className="text-right shrink-0 pt-1">
            <div className="inline-block relative">
              <div className="text-right font-black tracking-wider text-[11px] sm:text-xs text-[#07478E] uppercase leading-tight">
                <span>CLEANER</span>
                <br />
                <span>SAFER</span>
                <br />
                <span>HAPPIER SPACES</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. INVOICE TITLE & META TABLE                             */}
        {/* ========================================================= */}
        <div className="flex justify-between items-center gap-4 pt-1">
          {/* Left Title */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-wider text-[#07478E] leading-none">
              INVOICE
            </h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-[0.22em] uppercase mt-1">
              THANK YOU FOR YOUR BUSINESS
            </p>
          </div>

          {/* Right Meta Grid Table */}
          <div className="w-60 sm:w-64 border border-slate-200/90 rounded-lg overflow-hidden text-xs bg-white">
            <div className="divide-y divide-slate-200/90">
              <div className="flex">
                <span className="w-28 px-3 py-1 bg-slate-50 text-slate-500 font-medium border-r border-slate-200/90 text-[11px]">
                  Invoice No.
                </span>
                <span className="flex-1 px-3 py-1 font-black text-slate-900 font-tabular text-[11px]">
                  {displayInvoiceNumber}
                </span>
              </div>

              <div className="flex">
                <span className="w-28 px-3 py-1 bg-slate-50 text-slate-500 font-medium border-r border-slate-200/90 text-[11px]">
                  Date
                </span>
                <span className="flex-1 px-3 py-1 font-bold text-slate-900 text-[11px]">
                  {formatDate(sale.date)}
                </span>
              </div>

              <div className="flex">
                <span className="w-28 px-3 py-1 bg-slate-50 text-slate-500 font-medium border-r border-slate-200/90 text-[11px]">
                  Payment Terms
                </span>
                <span className="flex-1 px-3 py-1 font-bold text-slate-800 text-[11px]">
                  {paymentTerms}
                </span>
              </div>

              <div className="flex">
                <span className="w-28 px-3 py-1 bg-slate-50 text-slate-500 font-medium border-r border-slate-200/90 text-[11px]">
                  Sales Person
                </span>
                <span className="flex-1 px-3 py-1 font-bold text-slate-800 text-[11px]">
                  {salesperson}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. CUSTOMER SECTION: BILL TO & SHIP TO                    */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* BILL TO Card */}
          <div className="bg-[#F1F6FD] rounded-xl p-3.5 border border-[#E1EDFC] flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E1EDFC] text-[#07478E] flex items-center justify-center shrink-0 mt-0.5">
              <Building2 className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5 text-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#07478E] block">
                BILL TO
              </span>
              <div className="font-black text-slate-900 text-xs sm:text-sm truncate">
                {customerTitle}
              </div>
              <p className="text-[11px] text-slate-600 leading-tight line-clamp-2">
                {customerFullAddress}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 pt-0.5">
                <Phone className="w-3 h-3 text-[#07478E]" />
                <span>+91 {sale.customer.phone.replace(/[^0-9]/g, '').slice(-10)}</span>
              </div>
              {sale.customer.gstNumber && (
                <p className="text-[10px] font-bold text-[#07478E] pt-0.5">
                  GSTIN: {sale.customer.gstNumber}
                </p>
              )}
            </div>
          </div>

          {/* SHIP TO Card */}
          <div className="bg-[#F1F6FD] rounded-xl p-3.5 border border-[#E1EDFC] flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E1EDFC] text-[#07478E] flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#07478E]">
                  SHIP TO
                </span>
                <span className="text-[9px] text-slate-400 font-medium">(If Different)</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-700 pt-1">
                {sale.notes ? sale.notes : 'Same as Bill To'}
              </p>
              <p className="text-[10px] text-slate-500 leading-snug">
                Delivery Location: {sale.customer.city || 'Bilaspur, Chhattisgarh'}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. PRODUCT TABLE                                          */}
        {/* ========================================================= */}
        <div className="pt-1 rounded-xl overflow-hidden border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#07478E] text-white text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-center w-24">Pack Size</th>
                <th className="py-2.5 px-3 text-center w-16">Qty</th>
                <th className="py-2.5 px-3 text-right w-24">Rate (₹)</th>
                <th className="py-2.5 px-3 text-right w-28">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {sale.items.map((item, index) => {
                const pack = item.product?.packSizeLitres
                  ? `${item.product.packSizeLitres}L`
                  : '5L';
                const subtitle = getProductSubtitle(item.product?.name || '');

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-extrabold text-slate-900 text-xs sm:text-[13px]">
                        {item.product?.name || 'BIHAAN Product'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {subtitle}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700 whitespace-nowrap">
                      {pack}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black font-tabular text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold font-tabular text-slate-700">
                      {Math.round(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black font-tabular text-slate-900 text-xs sm:text-[13px]">
                      {Math.round(item.lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ========================================================= */}
        {/* 5. PAYMENT CARD + TOTAL CALCULATION                       */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 items-start">
          {/* Left Column: PAYMENT Summary Box */}
          <div className="bg-[#F1F6FD] rounded-xl p-4 border border-[#E1EDFC] flex items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#E1EDFC] text-[#07478E] flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-[#07478E]">
                  PAYMENT
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-700">
                <div className="flex gap-2">
                  <span className="w-24 text-slate-500 font-medium">Total Amount</span>
                  <span className="text-slate-400">:</span>
                  <span className="font-black font-tabular text-slate-900">
                    {formatCurrency(sale.totalAmount)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="w-24 text-slate-500 font-medium">Amount Paid</span>
                  <span className="text-slate-400">:</span>
                  <span className="font-bold font-tabular text-emerald-700">
                    {formatCurrency(sale.paidAmount)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="w-24 text-slate-500 font-medium">Balance Due</span>
                  <span className="text-slate-400">:</span>
                  <span className="font-black font-tabular text-slate-900">
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Red / Green Status Callout Badge */}
            {balanceDue > 0 ? (
              <div className="bg-[#FFF0F0] border border-[#FECDD3] rounded-xl px-4 py-3 text-center shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">
                  AMOUNT DUE
                </span>
                <span className="text-2xl font-black font-tabular text-rose-600 tracking-tight">
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            ) : (
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl px-4 py-3 text-center shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                  STATUS
                </span>
                <span className="text-lg font-black font-tabular text-emerald-700 tracking-tight">
                  FULLY PAID
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Subtotal, TOTAL Banner, Words */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600 px-1">
              <span className="font-bold">Subtotal</span>
              <span className="font-extrabold text-slate-900 font-tabular">
                {formatCurrency(sale.subtotalAmount)}
              </span>
            </div>

            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-xs text-rose-600 px-1">
                <span className="font-bold">Discount</span>
                <span className="font-extrabold font-tabular">
                  -{formatCurrency(sale.discountAmount)}
                </span>
              </div>
            )}

            {/* Big Royal Blue Total Banner */}
            <div className="bg-[#07478E] text-white rounded-lg px-4 py-2.5 flex justify-between items-center shadow-xs">
              <span className="text-base font-black tracking-wider uppercase">TOTAL</span>
              <span className="text-2xl sm:text-3xl font-black font-tabular tracking-tight">
                {formatCurrency(sale.totalAmount)}
              </span>
            </div>

            {/* Amount in Words */}
            <div className="px-1 pt-0.5 space-y-0.5 text-left">
              <span className="text-[10px] font-semibold text-slate-400 block">
                Amount in Words:
              </span>
              <p className="text-xs font-bold text-slate-800 italic">
                {numberToWordsIndian(sale.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 6. NOTE SECTION (Subtle & Professional)                  */}
        {/* ========================================================= */}
        <div className="bg-[#F1F6FD] rounded-xl p-3 border border-[#E1EDFC] flex items-center gap-3 text-xs text-slate-700">
          <div className="w-6 h-6 rounded-full bg-[#07478E] text-white flex items-center justify-center shrink-0">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div className="text-[11px] leading-snug">
            <span className="font-black text-slate-900">Note: </span>
            <span>
              BIHAAN HOME CARE is currently not registered under GST. No GST has been charged on
              this invoice.
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. FOOTER: THANK YOU, BRAND PILLARS & SIGN-OFF            */}
      {/* ========================================================= */}
      <div className="pt-4 border-t border-slate-100 mt-4 relative">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Left Thank You Message */}
          <div className="text-left space-y-0.5">
            <p className="text-xl sm:text-2xl font-serif italic font-bold text-[#07478E] leading-none">
              Thank you
            </p>
            <p className="text-xs font-bold text-slate-800">
              for choosing <span className="text-[#07478E]">BIHAAN HOME CARE.</span>
            </p>
            <p className="text-[11px] italic text-slate-400">Every day is a fresh beginning.</p>
          </div>

          {/* Center 3 Brand Pillars */}
          <div className="flex items-center gap-3 sm:gap-4 divide-x divide-slate-200">
            <div className="text-center space-y-1">
              <div className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center mx-auto text-[#07478E]">
                <Leaf className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-black uppercase text-[#07478E] block leading-tight">
                CLEANER
                <br />
                SPACES
              </span>
            </div>

            <div className="pl-3 sm:pl-4 text-center space-y-1">
              <div className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center mx-auto text-[#07478E]">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-black uppercase text-[#07478E] block leading-tight">
                HEALTHIER
                <br />
                PEOPLE
              </span>
            </div>

            <div className="pl-3 sm:pl-4 text-center space-y-1">
              <div className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center mx-auto text-[#07478E]">
                <Home className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-black uppercase text-[#07478E] block leading-tight">
                BRIGHTER
                <br />
                TOMORROWS
              </span>
            </div>
          </div>

          {/* Right Signature Script Brand line */}
          <div className="text-right">
            <div className="text-right leading-tight font-serif italic text-base sm:text-lg text-[#07478E]">
              <span>Clean</span>
              <br />
              <span className="text-slate-600">Care</span>
              <br />
              <span className="text-[#F97316] font-bold">Continue...</span>
            </div>
          </div>
        </div>

        {/* Decorative Wave/Gradient Bar at bottom */}
        <div className="mt-3 h-1 w-full bg-gradient-to-r from-[#07478E] via-[#0284c7] to-[#F97316] rounded-full opacity-80" />
      </div>
    </div>
  );
};
