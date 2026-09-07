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

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ sale }) => {
  const displayInvoiceNumber = sale.saleNumber.replace(/^SAL-/, 'BH-');
  const balanceDue = Math.max(0, sale.totalAmount - sale.paidAmount);

  // Determine payment terms & mode
  const paymentTerms =
    sale.paidAmount >= sale.totalAmount && sale.totalAmount > 0
      ? 'Paid in Full'
      : sale.paidAmount > 0
      ? 'Partially Paid / Credit'
      : 'Credit / Due';

  const paymentMode =
    sale.payments && sale.payments.length > 0
      ? sale.payments[0].paymentMethod
      : sale.paidAmount > 0
      ? 'UPI / Cash'
      : 'On Account';

  const salesperson = sale.createdBy?.name || 'Vikas Kaushik';

  // Customer display values
  const customerTitle = sale.customer.businessName || sale.customer.name;
  const contactPerson =
    sale.customer.businessName && sale.customer.name !== sale.customer.businessName
      ? sale.customer.name
      : null;

  const customerFullAddress = [
    sale.customer.address,
    sale.customer.city || 'Bilaspur, Chhattisgarh',
  ]
    .filter(Boolean)
    .join(', ');

  const totalCans = sale.items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="invoice-document bg-white text-slate-900 font-sans mx-auto w-full max-w-[210mm] p-6 sm:p-8 border border-slate-300 shadow-lg print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none flex flex-col justify-between text-xs leading-normal">
      <div>
        {/* ========================================================= */}
        {/* 1. HEADER: BRANDING (LEFT) & INVOICE METADATA (RIGHT)    */}
        {/* ========================================================= */}
        <div className="flex justify-between items-start gap-4 pb-4 border-b-2 border-[#07478E]">
          {/* Left: Company Logo & Details */}
          <div className="flex items-start gap-3.5 max-w-[58%]">
            <div className="shrink-0 pt-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bihan-logo.png"
                alt="BIHAAN HOME CARE"
                className="h-12 sm:h-14 w-auto object-contain"
              />
            </div>

            <div className="space-y-0.5 text-[11px] text-slate-600 leading-tight">
              <h1 className="text-sm font-black tracking-tight text-[#07478E] uppercase leading-none">
                BIHAAN HOME CARE
              </h1>
              <p className="text-[10px] italic text-[#F97316] font-semibold">
                Every day is a fresh beginning.
              </p>
              <p className="text-slate-500 pt-0.5">
                Cleaning Solutions for Healthier Spaces
              </p>
              <p>Bilaspur, Chhattisgarh 495001</p>
              <p>
                Phone: <span className="font-semibold text-slate-700">+91 93000 12345 / +91 91095 86968</span>
              </p>
              <p>
                Email: care@bihanhomecare.in • Web: bihanhomecare.in
              </p>
            </div>
          </div>

          {/* Right: INVOICE Title & Metadata Table */}
          <div className="w-56 sm:w-64 shrink-0 text-right space-y-1.5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#07478E] uppercase leading-none">
                INVOICE
              </h2>
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                SALES INVOICE (NON-GST)
              </p>
            </div>

            <div className="border border-slate-300 divide-y divide-slate-200 text-left text-[11px] bg-slate-50/50">
              <div className="flex">
                <span className="w-24 px-2 py-1 bg-slate-100/80 text-slate-600 font-semibold border-r border-slate-200">
                  Invoice No.
                </span>
                <span className="flex-1 px-2 py-1 font-extrabold text-slate-900 font-tabular">
                  {displayInvoiceNumber}
                </span>
              </div>

              <div className="flex">
                <span className="w-24 px-2 py-1 bg-slate-100/80 text-slate-600 font-semibold border-r border-slate-200">
                  Date
                </span>
                <span className="flex-1 px-2 py-1 font-bold text-slate-800">
                  {formatDate(sale.date)}
                </span>
              </div>

              <div className="flex">
                <span className="w-24 px-2 py-1 bg-slate-100/80 text-slate-600 font-semibold border-r border-slate-200">
                  Terms
                </span>
                <span className="flex-1 px-2 py-1 font-semibold text-slate-800">
                  {paymentTerms}
                </span>
              </div>

              <div className="flex">
                <span className="w-24 px-2 py-1 bg-slate-100/80 text-slate-600 font-semibold border-r border-slate-200">
                  Sales Person
                </span>
                <span className="flex-1 px-2 py-1 font-semibold text-slate-800">
                  {salesperson}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. BILL TO / SHIP TO SECTION (CLEAN 2-COLUMN GRID)        */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-[11px]">
          {/* Column 1: BILL TO */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#07478E] block pb-0.5 border-b border-slate-200">
              BILL TO (BUYER DETAILS)
            </span>
            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
              {customerTitle}
            </div>
            {contactPerson && (
              <p className="text-slate-600">
                <span className="text-slate-400">Attn:</span> {contactPerson}
              </p>
            )}
            <p className="text-slate-600 leading-snug">{customerFullAddress}</p>
            <p className="text-slate-700 font-semibold">
              <span className="text-slate-400 font-normal">Phone:</span> +91{' '}
              {sale.customer.phone.replace(/[^0-9]/g, '').slice(-10)}
            </p>
            {sale.customer.gstNumber && (
              <p className="text-slate-800 font-bold">
                <span className="text-slate-400 font-normal">Customer GSTIN:</span>{' '}
                {sale.customer.gstNumber}
              </p>
            )}
          </div>

          {/* Column 2: SHIP TO / DISPATCH DETAILS */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#07478E] block pb-0.5 border-b border-slate-200">
              SHIP TO (DELIVERY ADDRESS)
            </span>
            <div className="font-semibold text-slate-800 text-xs">
              {sale.notes ? sale.notes : 'Same as Bill To Address'}
            </div>
            <p className="text-slate-600">
              <span className="text-slate-400">Place of Supply:</span> Bilaspur, Chhattisgarh
            </p>
            <p className="text-slate-600">
              <span className="text-slate-400">Total Quantity:</span> {totalCans} Cans ({sale.items.length}{' '}
              {sale.items.length === 1 ? 'Item' : 'Items'})
            </p>
            <p className="text-slate-600">
              <span className="text-slate-400">Order Ref:</span> Sale #{sale.saleNumber}
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. PRODUCT TABLE (FULL WIDTH, MAXIMUM DESCRIPTION SPACE)   */}
        {/* ========================================================= */}
        <div className="pt-3 pb-3">
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-[#07478E] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2 px-2.5 w-10 text-center border-r border-blue-800">#</th>
                <th className="py-2 px-3 border-r border-blue-800">Item Description</th>
                <th className="py-2 px-2.5 text-center w-24 border-r border-blue-800">Pack Size</th>
                <th className="py-2 px-2.5 text-center w-16 border-r border-blue-800">Qty</th>
                <th className="py-2 px-3 text-right w-24 border-r border-blue-800">Rate (₹)</th>
                <th className="py-2 px-3 text-right w-28">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {sale.items.map((item, index) => {
                const pack = item.product?.packSizeLitres
                  ? `${item.product.packSizeLitres} Litres`
                  : '5 Litres';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-2.5 text-center font-semibold text-slate-400 border-r border-slate-200">
                      {index + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900 text-xs">
                        {item.product?.name || 'BIHAAN Product'}
                      </div>
                      {item.product?.sku && (
                        <span className="text-[10px] font-mono text-slate-400">
                          SKU: {item.product.sku}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-center font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap">
                      {pack}
                    </td>
                    <td className="py-2 px-2.5 text-center font-black font-tabular text-slate-900 border-r border-slate-200">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 text-right font-medium font-tabular text-slate-700 border-r border-slate-200">
                      {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-black font-tabular text-slate-900">
                      {item.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ========================================================= */}
        {/* 4. FINANCIAL SUMMARY & AMOUNT IN WORDS                    */}
        {/* ========================================================= */}
        <div className="grid grid-cols-12 gap-4 pt-1">
          {/* Left: Words & Payment Breakdown (7 cols) */}
          <div className="col-span-7 space-y-2.5">
            {/* Amount in Words */}
            <div className="border border-slate-200 p-2.5 bg-slate-50/60 rounded-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Amount Chargeable (in words):
              </span>
              <p className="font-extrabold text-slate-900 text-xs italic mt-0.5">
                {numberToWordsIndian(sale.totalAmount)}
              </p>
            </div>

            {/* Payment Summary */}
            <div className="border border-slate-200 p-2.5 text-[11px] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block border-b border-slate-200 pb-0.5">
                Payment Details
              </span>
              <div className="flex justify-between text-slate-600 pt-0.5">
                <span>Payment Mode:</span>
                <span className="font-semibold text-slate-900">{paymentMode}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-700 font-tabular">
                  {formatCurrency(sale.paidAmount)}
                </span>
              </div>
              {balanceDue > 0 ? (
                <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200 pt-1">
                  <span>Balance Due:</span>
                  <span className="font-black font-tabular text-xs">
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200 pt-1">
                  <span>Status:</span>
                  <span className="font-black">Fully Cleared</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Subtotal, Total, Balance Due Table (5 cols) */}
          <div className="col-span-5">
            <div className="border border-slate-300 divide-y divide-slate-200 text-xs">
              <div className="flex justify-between py-1.5 px-3 bg-white">
                <span className="font-semibold text-slate-600">Subtotal:</span>
                <span className="font-bold font-tabular text-slate-900">
                  {formatCurrency(sale.subtotalAmount)}
                </span>
              </div>

              {sale.discountAmount > 0 && (
                <div className="flex justify-between py-1.5 px-3 bg-white text-rose-600">
                  <span className="font-semibold">Discount:</span>
                  <span className="font-bold font-tabular">
                    -{formatCurrency(sale.discountAmount)}
                  </span>
                </div>
              )}

              {/* TOTAL ROW (Strongest visual element) */}
              <div className="flex justify-between py-2.5 px-3 bg-[#07478E] text-white">
                <span className="text-sm font-black uppercase tracking-wider">TOTAL:</span>
                <span className="text-base sm:text-lg font-black font-tabular tracking-tight">
                  {formatCurrency(sale.totalAmount)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 px-3 bg-white text-slate-700">
                <span className="font-medium text-slate-500">Amount Paid:</span>
                <span className="font-bold font-tabular text-emerald-700">
                  {formatCurrency(sale.paidAmount)}
                </span>
              </div>

              {balanceDue > 0 && (
                <div className="flex justify-between py-1.5 px-3 bg-rose-50 text-rose-700 border-t-2 border-rose-200">
                  <span className="font-bold uppercase tracking-wide text-[11px]">
                    Balance Due:
                  </span>
                  <span className="font-black font-tabular text-sm">
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. SUBTLE NON-GST NOTICE                                  */}
        {/* ========================================================= */}
        <div className="mt-3 pt-1.5 pb-1.5 border-t border-b border-slate-200 text-[10px] text-slate-500 text-center">
          <span className="font-semibold text-slate-700">Declaration:</span> BIHAAN HOME CARE is
          currently not registered under GST. No GST has been charged on this invoice.
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. COMPACT PROFESSIONAL FOOTER                            */}
      {/* ========================================================= */}
      <div className="pt-4 border-t border-slate-300 mt-4 text-[11px]">
        <div className="flex justify-between items-end">
          {/* Left Terms & Thank you */}
          <div className="space-y-1 text-slate-500 max-w-[55%]">
            <p className="font-bold text-slate-700 text-xs">
              Thank you for choosing BIHAAN HOME CARE!
            </p>
            <p className="text-[10px] leading-tight">
              1. Goods once sold will not be taken back or exchanged except for manufacturing defects.
              <br />
              2. Subject to Bilaspur, Chhattisgarh jurisdiction.
            </p>
          </div>

          {/* Right Signature Box */}
          <div className="text-right space-y-8">
            <p className="font-black text-slate-900 text-xs uppercase">
              For BIHAAN HOME CARE
            </p>
            <div className="border-t border-slate-500 pt-1 w-44 inline-block text-center">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                Authorized Signatory
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
