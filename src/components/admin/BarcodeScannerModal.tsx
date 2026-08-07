'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertTriangle } from 'lucide-react';
import type { IScannerControls } from '@zxing/browser';

interface BarcodeScannerModalProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

/**
 * Camera-based barcode scanner. Uses @zxing/browser (pure JS/canvas decoding)
 * rather than the native BarcodeDetector API so it also works on Safari/iOS/iPadOS,
 * which has no built-in barcode decoder.
 */
export default function BarcodeScannerModal({ onDetected, onClose }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const detectedRef = useRef(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest callback in a ref so the scan effect below doesn't need it in its
  // dependency array — an inline arrow prop would otherwise restart the camera every render.
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    let cancelled = false;
    detectedRef.current = false;

    (async () => {
      try {
        const { BrowserMultiFormatReader, BrowserCodeReader } = await import('@zxing/browser');
        const { DecodeHintType, BarcodeFormat, NotFoundException } = await import('@zxing/library');

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
        ]);

        const reader = new BrowserMultiFormatReader(hints);
        if (cancelled || !videoRef.current) return;

        const controls = await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err, ctrl) => {
          if (cancelled || detectedRef.current) return;
          if (result) {
            detectedRef.current = true;
            ctrl.stop();
            onDetectedRef.current(result.getText());
            return;
          }
          if (err && !(err instanceof NotFoundException)) {
            // NotFoundException just means "nothing decoded this frame" — not a real error.
            setError(err.message || 'Scan error');
          }
        });
        if (cancelled) { controls.stop(); return; }
        controlsRef.current = controls;

        // Device labels are blank until permission is granted, so enumerate after starting.
        const list = await BrowserCodeReader.listVideoInputDevices();
        if (!cancelled) setDevices(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Could not access the camera');
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [deviceId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" /> Scan Barcode
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera preview */}
        <div className="relative bg-black aspect-square flex items-center justify-center flex-shrink-0">
          <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-6 border-2 border-white/70 rounded-xl pointer-events-none" />
          {error && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-2 text-center px-6">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <p className="text-white text-xs">{error}</p>
              <p className="text-white/60 text-[11px]">You can still type the barcode in manually.</p>
            </div>
          )}
        </div>

        {devices.length > 1 && (
          <div className="px-4 py-2 border-b flex-shrink-0">
            <select
              value={deviceId ?? ''}
              onChange={(e) => setDeviceId(e.target.value || undefined)}
              className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none bg-white"
            >
              <option value="">Default camera</option>
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>
              ))}
            </select>
          </div>
        )}

        <div className="px-4 py-3 border-t flex-shrink-0">
          <p className="text-[11px] text-gray-400 text-center mb-2">Point the camera at a product's barcode</p>
          <button onClick={onClose} className="w-full border rounded-lg py-2 text-sm hover:bg-gray-50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
