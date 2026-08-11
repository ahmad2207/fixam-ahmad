'use client';

import { X, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

export interface ThermalItem {
  product_name: string;
  variation?: string;
  quantity: number;
  price: string | number;
}

export interface ThermalReceipt {
  receiptNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  total: string;
  subtotal: string;
  deliveryFee: string;
  paymentMethod?: string | null;
  notes?: string | null;
  salesRep?: string | null;
  items: string;
  createdAt: Date | string;
  type: string;
}

interface Props {
  receipt: ThermalReceipt;
  storeAddress?: string;
  storePhone?: string;
  onClose: () => void;
}

export function buildThermalHtml(receipt: ThermalReceipt, items: ThermalItem[], logoUrl: string, storeAddress: string, storePhone: string): string {
  const rows = items
    .map(
      (item) =>
        `<div style="margin-bottom:3px">
          <div style="font-weight:700">${item.product_name}${item.variation ? ` (${item.variation})` : ''}</div>
          <div style="display:flex;justify-content:space-between">
            <span>${item.quantity} x ${formatCurrency(Number(item.price))}</span>
            <span style="font-weight:700">${formatCurrency(item.quantity * Number(item.price))}</span>
          </div>
        </div>`,
    )
    .join('');

  const subtotalRow =
    Number(receipt.deliveryFee) > 0
      ? `<div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>${formatCurrency(Number(receipt.subtotal))}</span></div>
         <div style="display:flex;justify-content:space-between"><span>Delivery</span><span>${formatCurrency(Number(receipt.deliveryFee))}</span></div>`
      : '';

  const notesRow = receipt.notes
    ? `<div style="border-top:1px dashed #000;margin:4px 0"></div><div style="font-size:9px">Note: ${receipt.notes}</div>`
    : '';

  const dateStr = format(new Date(receipt.createdAt), 'dd/MM/yyyy HH:mm');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Receipt-${receipt.receiptNumber}</title>
    <style>
      body{margin:0;padding:0;font-family:"Courier New",Courier,monospace;font-size:11px;color:#000}
      @page{size:80mm auto;margin:0}
      @media print{body{width:80mm}}
    </style>
  </head><body>
    <div style="width:80mm;padding:4mm;box-sizing:border-box">
      <div style="text-align:center;margin-bottom:4px">
        <img src="${logoUrl}" alt="Fixam" style="height:28px;width:auto;display:block;margin:0 auto 3px" />
        <div style="font-size:9px;font-weight:700">Fixam Africa Ltd.</div>
        <div style="font-size:9px">${storeAddress}</div>
        ${storePhone ? `<div style="font-size:9px">${storePhone}</div>` : ''}
        <div style="font-size:9px">fixam.africa</div>
      </div>
      <div style="border-top:1px dashed #000;margin:4px 0"></div>
      <div style="font-size:10px;margin-bottom:4px">
        <div>Receipt: ${receipt.receiptNumber}</div>
        <div>Date: ${dateStr}</div>
        <div>Type: ${receipt.type?.toUpperCase()}</div>
        ${receipt.customerName ? `<div>Customer: ${receipt.customerName}</div>` : ''}
        ${receipt.customerPhone ? `<div>Phone: ${receipt.customerPhone}</div>` : ''}
        ${receipt.salesRep ? `<div>Sales Rep: ${receipt.salesRep}</div>` : ''}
      </div>
      <div style="border-top:1px dashed #000;margin:4px 0"></div>
      <div style="font-size:10px">${rows}</div>
      <div style="border-top:1px dashed #000;margin:4px 0"></div>
      <div style="font-size:10px">
        ${subtotalRow}
        <div style="display:flex;justify-content:space-between;font-weight:900;font-size:14px;margin-top:2px">
          <span>TOTAL</span><span>${formatCurrency(Number(receipt.total))}</span>
        </div>
        ${receipt.paymentMethod ? `<div style="margin-top:2px">Payment: ${receipt.paymentMethod.replace(/_/g, ' ').toUpperCase()}</div>` : ''}
      </div>
      ${notesRow}
      <div style="border-top:1px dashed #000;margin:4px 0"></div>
      <div style="text-align:center;font-size:9px;margin-top:4px">
        <div style="font-weight:700">Thank you for shopping at Fixam!</div>
        <div>fixam.africa</div>
      </div>
    </div>
  </body></html>`;
}

/**
 * Builds and immediately prints a thermal receipt in a popup window — shared by
 * this component's own "Print Thermal" button and by the POS page, which
 * triggers it automatically right after a sale completes.
 */
export function printThermalReceipt(
  receipt: ThermalReceipt,
  items: ThermalItem[],
  storeAddress = 'Abuja, FCT, Nigeria',
  storePhone = '',
) {
  const logoUrl = `${window.location.origin}/logo.png`;
  const html = buildThermalHtml(receipt, items, logoUrl, storeAddress, storePhone);
  const w = window.open('', '_blank', 'width=340,height=700');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); w.close(); }, 300);
}

export default function ThermalReceiptPreview({ receipt, storeAddress = 'Abuja, FCT, Nigeria', storePhone = '', onClose }: Props) {
  let items: ThermalItem[] = [];
  try { items = JSON.parse(receipt.items); } catch { items = []; }

  const handlePrintThermal = () => printThermalReceipt(receipt, items, storeAddress, storePhone);

  const dateStr = format(new Date(receipt.createdAt), 'dd/MM/yyyy HH:mm');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col max-h-[90vh]">
        {/* Dialog header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <h2 className="font-bold text-sm">Thermal Receipt Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview area */}
        <div className="overflow-y-auto flex-1 bg-gray-200 p-4 flex justify-center">
          <div
            className="bg-white shadow-sm"
            style={{ width: '80mm', fontFamily: '"Courier New", Courier, monospace', fontSize: '11px', lineHeight: '1.45' }}
          >
            <div style={{ padding: '4mm' }}>
              {/* Store header */}
              <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Fixam" style={{ height: '28px', width: 'auto', display: 'block', margin: '0 auto 3px' }} />
                <div style={{ fontSize: '9px', fontWeight: 700 }}>Fixam Africa Ltd.</div>
                <div style={{ fontSize: '9px' }}>{storeAddress}</div>
                {storePhone && <div style={{ fontSize: '9px' }}>{storePhone}</div>}
                <div style={{ fontSize: '9px' }}>fixam.africa</div>
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

              {/* Receipt info */}
              <div style={{ fontSize: '10px', marginBottom: '4px' }}>
                <div>Receipt: {receipt.receiptNumber}</div>
                <div>Date: {dateStr}</div>
                <div>Type: {receipt.type?.toUpperCase()}</div>
                {receipt.customerName && <div>Customer: {receipt.customerName}</div>}
                {receipt.customerPhone && <div>Phone: {receipt.customerPhone}</div>}
                {receipt.salesRep && <div>Sales Rep: {receipt.salesRep}</div>}
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

              {/* Items */}
              <div style={{ fontSize: '10px' }}>
                {items.map((item, i) => (
                  <div key={i} style={{ marginBottom: '3px' }}>
                    <div style={{ fontWeight: 700 }}>
                      {item.product_name}{item.variation ? ` (${item.variation})` : ''}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.quantity} x {formatCurrency(Number(item.price))}</span>
                      <span style={{ fontWeight: 700 }}>{formatCurrency(item.quantity * Number(item.price))}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

              {/* Totals */}
              <div style={{ fontSize: '10px' }}>
                {Number(receipt.deliveryFee) > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Subtotal</span><span>{formatCurrency(Number(receipt.subtotal))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Delivery</span><span>{formatCurrency(Number(receipt.deliveryFee))}</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '14px', marginTop: '2px' }}>
                  <span>TOTAL</span><span>{formatCurrency(Number(receipt.total))}</span>
                </div>
                {receipt.paymentMethod && (
                  <div style={{ marginTop: '2px' }}>
                    Payment: {receipt.paymentMethod.replace(/_/g, ' ').toUpperCase()}
                  </div>
                )}
              </div>

              {receipt.notes && (
                <>
                  <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
                  <div style={{ fontSize: '9px' }}>Note: {receipt.notes}</div>
                </>
              )}

              <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
              <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '4px' }}>
                <div style={{ fontWeight: 700 }}>Thank you for shopping at Fixam!</div>
                <div>fixam.africa</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t flex-shrink-0">
          <button
            onClick={handlePrintThermal}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition"
          >
            <Printer className="w-4 h-4" />
            Print Thermal
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
