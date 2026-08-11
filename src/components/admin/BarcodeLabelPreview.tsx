'use client';

import { useRef, useState } from 'react';
import { X, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import BarcodeSvg from './BarcodeSvg';

interface BarcodeLabelPreviewProps {
  productName: string;
  price: number;
  barcode: string;
  onClose: () => void;
}

type Rotation = 0 | 90 | 180 | 270;

const ROTATIONS: Rotation[] = [0, 90, 180, 270];

// The label's own content is always laid out the same way (50mm x 30mm,
// landscape); rotation just spins that block inside a container sized to fit
// whatever the rotated bounding box ends up being — 30mm x 50mm on its side.
const CONTENT_W = 50;
const CONTENT_H = 30;

function isSideways(rotation: Rotation) {
  return rotation === 90 || rotation === 270;
}

export default function BarcodeLabelPreview({ productName, price, barcode, onClose }: BarcodeLabelPreviewProps) {
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState<Rotation>(0);

  const sideways = isSideways(rotation);
  const outerW = sideways ? CONTENT_H : CONTENT_W;
  const outerH = sideways ? CONTENT_W : CONTENT_H;

  const handlePrint = () => {
    // Re-use the already-rendered on-screen SVG's markup so the printed barcode is
    // pixel-identical to the preview, instead of rendering it a second time.
    const svgMarkup = svgWrapRef.current?.querySelector('svg')?.outerHTML ?? '';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Label-${barcode}</title>
      <style>
        body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#000}
        @page{size:${outerW}mm ${outerH}mm;margin:0}
        @media print{body{width:${outerW}mm}}
      </style>
    </head><body>
      <div style="width:${outerW}mm;height:${outerH}mm;position:relative;overflow:hidden">
        <div style="width:${CONTENT_W}mm;height:${CONTENT_H}mm;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(${rotation}deg);padding:2mm;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden">
          <div style="font-size:8px;font-weight:700;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${productName}</div>
          <div style="font-size:9px;font-weight:900;margin:1px 0 2px">${formatCurrency(price)}</div>
          <div style="max-width:100%">${svgMarkup}</div>
        </div>
      </div>
    </body></html>`;

    const w = window.open('', '_blank', `width=${Math.round(outerW * 3.78) + 40},height=${Math.round(outerH * 3.78) + 40}`);
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); w.close(); }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <h2 className="font-bold text-sm">Barcode Label Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orientation control */}
        <div className="flex items-center gap-2 px-4 pt-3 flex-shrink-0">
          <span className="text-xs font-medium text-gray-500">Orientation</span>
          <div className="flex gap-1">
            {ROTATIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRotation(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  rotation === r
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {r}°
              </button>
            ))}
          </div>
        </div>

        {/* Preview area — sized to mimic the label at its printed dimensions */}
        <div className="overflow-y-auto flex-1 bg-gray-200 p-6 flex justify-center items-center">
          <div
            className="bg-white shadow-sm relative overflow-hidden"
            style={{ width: `${outerW}mm`, height: `${outerH}mm` }}
          >
            <div
              className="absolute top-1/2 left-1/2 flex flex-col items-center justify-center text-center px-2 py-2"
              style={{
                width: `${CONTENT_W}mm`,
                height: `${CONTENT_H}mm`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              }}
            >
              <p className="text-[8px] font-bold leading-tight truncate w-full">{productName}</p>
              <p className="text-[9px] font-black mt-0.5 mb-1">{formatCurrency(price)}</p>
              <div ref={svgWrapRef} className="w-full flex justify-center">
                <BarcodeSvg value={barcode} height={30} fontSize={9} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t flex-shrink-0">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition"
          >
            <Printer className="w-4 h-4" /> Print Label
          </button>
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
