'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeSvgProps {
  value: string;
  height?: number;
  fontSize?: number;
  className?: string;
}

/**
 * Renders `value` as a CODE128 barcode, regardless of the value's real-world
 * symbology (EAN-13, UPC-A, internal, etc). CODE128 encodes any digit/alnum
 * string of any practical length, so this never throws the way a strict
 * `format: 'EAN13'` render would on a non-conforming value.
 */
export default function BarcodeSvg({ value, height = 50, fontSize = 14, className }: BarcodeSvgProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    if (!value) {
      svgRef.current.innerHTML = '';
      return;
    }
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        displayValue: true,
        fontSize,
        height,
        margin: 6,
      });
    } catch {
      // Extremely unlikely for CODE128 (near-universal charset) — leave blank rather than crash.
      svgRef.current.innerHTML = '';
    }
  }, [value, height, fontSize]);

  return <svg ref={svgRef} className={className} />;
}
