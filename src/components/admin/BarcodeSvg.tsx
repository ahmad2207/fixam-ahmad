'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeSvgProps {
  value: string;
  height?: number;
  fontSize?: number;
  margin?: number;
  className?: string;
}

/**
 * Renders `value` as a CODE128 barcode, regardless of the value's real-world
 * symbology (EAN-13, UPC-A, internal, etc). CODE128 encodes any digit/alnum
 * string of any practical length, so this never throws the way a strict
 * `format: 'EAN13'` render would on a non-conforming value.
 */
export default function BarcodeSvg({ value, height = 50, fontSize = 14, margin = 6, className }: BarcodeSvgProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (!value) {
      svg.innerHTML = '';
      return;
    }
    try {
      JsBarcode(svg, value, {
        format: 'CODE128',
        displayValue: true,
        fontSize,
        height,
        margin,
      });

      // JsBarcode sets fixed width/height attributes sized to whatever `value`
      // needed (a long admin-typed code renders wider than a short generated
      // one) and never revisits them — dropped straight into a small fixed-size
      // label, an oversized barcode just gets sliced off by the label's
      // overflow:hidden instead of shrinking to fit. Giving it a viewBox lets
      // CSS rescale the internal artwork instead of cropping it; max-width
      // (rather than width) means it only ever shrinks to fit a tighter
      // container — a barcode that already fits renders at its normal size.
      const w = svg.getAttribute('width');
      const h = svg.getAttribute('height');
      if (w && h) {
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
        svg.style.display = 'block';
      }
    } catch {
      // Extremely unlikely for CODE128 (near-universal charset) — leave blank rather than crash.
      svg.innerHTML = '';
    }
  }, [value, height, fontSize, margin]);

  return <svg ref={svgRef} className={className} />;
}
