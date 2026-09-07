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
    <div className="invoice-document bg-white text-slate-900 font-sans mx-auto w-full max-w-[210mm] p-5 sm:p-7 border border-slate-300 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none flex flex-col justify-between text-xs leading-normal">
      <div>
        {/* ========================================================= */}
        {/* 1. HEADER: BRANDING (LEFT 7 COLS) & META (RIGHT 5 COLS)   */}
        {/* ========================================================= */}
        <div className="grid grid-cols-12 gap-4 pb-2.5 border-b-2 border-[#07478E] items-start">
          {/* Left: Company Logo & Details (7 cols) */}
          <div className="col-span-7 flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bihan-logo.png"
              alt="BIHAAN HOME CARE"
              className="h-12 w-auto object-contain shrink-0 pt-0.5"
            />

            <div className="space-y-0.5 text-[10.5px] text-slate-600 leading-tight">
              <h1 className="text-sm font-black tracking-tight text-[#07478E] uppercase leading-none">
                BIHAAN HOME CARE
              </h1>
              <p className="text-[9.5px] italic text-[#F97316] font-semibold">
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

          {/* Right: INVOICE Title & Metadata Table (5 cols) */}
          <div className="col-span-5 text-right space-y-1">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-[#07478E] uppercase leading-none">
                INVOICE
              </h2>
              <p className="text-[8.5px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                SALES INVOICE (NON-GST)
              </p>
            </div>

            <table className="w-full border border-slate-300 text-[10px] text-left divide-y divide-slate-200 bg-slate-50/50">
              <tbody>
                <tr>
                  <td className="w-24 px-2 py-0.5 bg-slate-100/90 text-slate-600 font-semibold border-r border-slate-200">
                    Invoice No.
                  </td>
                  <td className="px-2 py-0.5 font-extrabold text-slate-900 font-tabular">
                    {displayInvoiceNumber}
                  </td>
                </tr>
                <tr>
                  <td className="w-24 px-2 py-0.5 bg-slate-100/90 text-slate-600 font-semibold border-r border-slate-200">
                    Date
                  </td>
                  <td className="px-2 py-0.5 font-bold text-slate-800">
                    {formatDate(sale.date)}
                  </td>
                </tr>
                <tr>
                  <td className="w-24 px-2 py-0.5 bg-slate-100/90 text-slate-600 font-semibold border-r border-slate-200">
                    Terms
                  </td>
                  <td className="px-2 py-0.5 font-semibold text-slate-800">
                    {paymentTerms}
                  </td>
                </tr>
                <tr>
                  <td className="w-24 px-2 py-0.5 bg-slate-100/90 text-slate-600 font-semibold border-r border-slate-200">
                    Sales Person
                  </td>
                  <td className="px-2 py-0.5 font-semibold text-slate-800">
                    {salesperson}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. BILL TO / SHIP TO SECTION (CLEAN 2-COLUMN GRID)        */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-200 text-[10.5px]">
          {/* Column 1: BILL TO */}
          <div className="space-y-0.5">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-[#07478E] block pb-0.5 border-b border-slate-200">
              BILL TO (BUYER DETAILS)
            </span>
            <div className="font-extrabold text-slate-900 text-xs">
              {customerTitle}
            </div>
            {contactPerson && (
              <p className="text-slate-600">
                <span className="text-slate-400">Attn:</span> {contactPerson}
              </p>
            )}
            <p className="text-slate-600 leading-tight">{customerFullAddress}</p>
            <p className="text-slate-700 font-medium">
              <span className="text-slate-400">Phone:</span> +91{' '}
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
          <div className="space-y-0.5">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-[#07478E] block pb-0.5 border-b border-slate-200">
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
        <div className="pt-2 pb-2">
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-[#07478E] text-white text-[10.5px] font-bold uppercase tracking-wider">
                <th className="py-1.5 px-2 w-9 text-center border-r border-blue-800">#</th>
                <th className="py-1.5 px-2.5 border-r border-blue-800">Item Description</th>
                <th className="py-1.5 px-2 text-center w-20 border-r border-blue-800">Pack Size</th>
                <th className="py-1.5 px-2 text-center w-14 border-r border-blue-800">Qty</th>
                <th className="py-1.5 px-2.5 text-right w-24 border-r border-blue-800">Rate (₹)</th>
                <th className="py-1.5 px-2.5 text-right w-24">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {sale.items.map((item, index) => {
                const pack = item.product?.packSizeLitres
                  ? `${item.product.packSizeLitres} Litres`
                  : '5 Litres';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="py-1.5 px-2 text-center font-medium text-slate-400 border-r border-slate-200">
                      {index + 1}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200">
                      <span className="font-bold text-slate-900">
                        {item.product?.name || 'BIHAAN Product'}
                      </span>
                      {item.product?.sku && (
                        <span className="text-[9.5px] font-mono text-slate-400 ml-2">
                          ({item.product.sku})
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-center font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap">
                      {pack}
                    </td>
                    <td className="py-1.5 px-2 text-center font-black font-tabular text-slate-900 border-r border-slate-200">
                      {item.quantity}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-medium font-tabular text-slate-700 border-r border-slate-200">
                      {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-black font-tabular text-slate-900">
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
        <div className="grid grid-cols-12 gap-3 pt-1 items-start">
          {/* Left: Words & Payment Breakdown (7 cols) */}
          <div className="col-span-7 space-y-2">
            {/* Amount in Words */}
            <div className="border border-slate-200 p-2 bg-slate-50/70 rounded-xs">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">
                Amount Chargeable (in words):
              </span>
              <p className="font-extrabold text-slate-900 text-[11px] italic mt-0.5">
                {numberToWordsIndian(sale.totalAmount)}
              </p>
            </div>

            {/* Payment Summary */}
            <div className="border border-slate-200 p-2 text-[10.5px] space-y-0.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block border-b border-slate-200 pb-0.5">
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
                <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200 pt-0.5">
                  <span>Balance Due:</span>
                  <span className="font-black font-tabular text-[11px]">
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200 pt-0.5">
                  <span>Status:</span>
                  <span className="font-black">Fully Paid</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Subtotal, Total, Balance Due Table (5 cols) */}
          <div className="col-span-5">
            <div className="border border-slate-300 divide-y divide-slate-200 text-[11px]">
              <div className="flex justify-between py-1 px-2.5 bg-white">
                <span className="font-semibold text-slate-600">Subtotal:</span>
                <span className="font-bold font-tabular text-slate-900">
                  {formatCurrency(sale.subtotalAmount)}
                </span>
              </div>

              {sale.discountAmount > 0 && (
                <div className="flex justify-between py-1 px-2.5 bg-white text-rose-600">
                  <span className="font-semibold">Discount:</span>
                  <span className="font-bold font-tabular">
                    -{formatCurrency(sale.discountAmount)}
                  </span>
                </div>
              )}

              {/* TOTAL ROW (Strongest visual element) */}
              <div className="flex justify-between py-1.5 px-2.5 bg-[#07478E] text-white">
                <span className="text-xs font-black uppercase tracking-wider">TOTAL:</span>
                <span className="text-sm font-black font-tabular tracking-tight">
                  {formatCurrency(sale.totalAmount)}
                </span>
              </div>

              <div className="flex justify-between py-1 px-2.5 bg-white text-slate-700">
                <span className="font-medium text-slate-500">Amount Paid:</span>
                <span className="font-bold font-tabular text-emerald-700">
                  {formatCurrency(sale.paidAmount)}
                </span>
              </div>

              {balanceDue > 0 && (
                <div className="flex justify-between py-1 px-2.5 bg-rose-50 text-rose-700 border-t border-rose-200">
                  <span className="font-bold uppercase tracking-wide text-[10px]">
                    Balance Due:
                  </span>
                  <span className="font-black font-tabular text-xs">
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
        <div className="mt-2 py-1 border-t border-b border-slate-200 text-[9.5px] text-slate-500 text-center">
          <span className="font-semibold text-slate-700">Declaration:</span> BIHAAN HOME CARE is
          currently not registered under GST. No GST has been charged on this invoice.
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. COMPACT PROFESSIONAL FOOTER                            */}
      {/* ========================================================= */}
      <div className="pt-2 mt-2 text-[10.5px]">
        <div className="flex justify-between items-end">
          {/* Left Terms & Thank you */}
          <div className="space-y-0.5 text-slate-500 max-w-[58%]">
            <p className="font-bold text-slate-700 text-[11px]">
              Thank you for choosing BIHAAN HOME CARE!
            </p>
            <p className="text-[9px] leading-tight text-slate-400">
              1. Goods once sold will not be taken back or exchanged except for manufacturing defects.
              <br />
              2. Subject to Bilaspur, Chhattisgarh jurisdiction.
            </p>
          </div>

          {/* Right Signature Box */}
          <div className="text-right">
            <p className="font-black text-slate-900 text-[10.5px] uppercase mb-6">
              For BIHAAN HOME CARE
            </p>
            <div className="border-t border-slate-500 pt-0.5 w-36 inline-block text-center">
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wide">
                Authorized Signatory
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
