import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isMirrored, setIsMirrored] = useState(() => {
    return localStorage.getItem('esangu_scanner_mirrored') === 'true';
  });
  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const elementId = "camera-qr-reader";

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setIsInitializing(true);

    const timer = setTimeout(() => {
      try {
        const scanner = new Html5Qrcode(elementId);
        qrCodeRef.current = scanner;

        scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (width, height) => {
              const minDim = Math.min(width, height);
              let size = Math.floor(minDim * 0.7);
              if (size < 150) {
                size = minDim >= 150 ? 150 : Math.max(50, minDim);
              }
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            if (scanner.isScanning) {
              scanner.stop().then(() => {
                onScanSuccess(decodedText);
              }).catch(() => {
                onScanSuccess(decodedText);
              });
            } else {
              onScanSuccess(decodedText);
            }
          },
          () => {
            // silent fail for scan frames
          }
        ).then(() => {
          setIsInitializing(false);
        }).catch((err) => {
          console.error("Camera start error:", err);
          setError("Gagal mengakses kamera. Pastikan Anda memberikan izin kamera pada peramban Anda.");
          setIsInitializing(false);
        });
      } catch (err) {
        console.error("Scanner init error:", err);
        setError("Sistem pemindai QR gagal diinisialisasi.");
        setIsInitializing(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (qrCodeRef.current) {
        if (qrCodeRef.current.isScanning) {
          qrCodeRef.current.stop().catch(err => console.error("Error stopping scanner on unmount:", err));
        }
      }
    };
  }, [isOpen, onClose, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-emerald-950/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden border border-emerald-100 shadow-2xl relative flex flex-col transform animate-in zoom-in-95 duration-250">
        {/* Top bar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-950 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">Pindai QR Sangu</h3>
              <p className="text-[9px] text-emerald-300 font-bold">Arahkan kamera ke barcode/QR santri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-emerald-900 rounded-full transition border-none bg-transparent cursor-pointer text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera container */}
        <div className="p-6 flex flex-col items-center justify-center space-y-4 bg-gray-50 min-h-[300px]">
          {error ? (
            <div className="text-center p-6 space-y-3 bg-red-50 rounded-2xl border border-red-100 max-w-xs">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-black text-red-800 uppercase tracking-widest">Akses Kamera Ditolak</h4>
              <p className="text-[10px] text-red-600 font-bold leading-relaxed">{error}</p>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider border-none transition cursor-pointer"
              >
                Tutup & Coba Lagi
              </button>
            </div>
          ) : (
            <div className="relative w-full aspect-square max-w-[240px] bg-black rounded-2xl overflow-hidden shadow-inner border border-emerald-900/10">
              {/* Active Scanner Frame Overlay */}
              {!isInitializing && (
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                  {/* Laser line animation */}
                  <div className="absolute w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce" style={{ animationDuration: '2.5s' }} />
                  {/* Target frame corners */}
                  <div className="absolute w-40 h-40 border border-emerald-450/40 rounded-xl flex items-center justify-center">
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />
                  </div>
                </div>
              )}

              {/* The element where html5-qrcode will bind */}
              <div 
                id={elementId} 
                className={`w-full h-full object-cover transition-transform ${isMirrored ? '[&_video]:-scale-x-100' : ''}`}
                style={isMirrored ? { transform: 'scaleX(-1)' } : undefined}
              />

              {/* Loader */}
              {isInitializing && (
                <div className="absolute inset-0 bg-emerald-950 flex flex-col items-center justify-center space-y-3 z-20">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest animate-pulse">Menyalakan Kamera...</p>
                </div>
              )}
            </div>
          )}
          
          {/* CAMERA MIRROR SWITCH */}
          {!error && !isInitializing && (
            <div className="flex items-center justify-between w-full max-w-[240px] px-3 py-2 bg-emerald-50/60 rounded-xl border border-emerald-100/40">
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black text-emerald-950 uppercase tracking-wider">Mirror Kamera</span>
                <span className="text-[7px] text-gray-400 font-bold">Membalik tampilan secara horizontal</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newVal = !isMirrored;
                  setIsMirrored(newVal);
                  localStorage.setItem('esangu_scanner_mirrored', String(newVal));
                }}
                className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isMirrored ? 'bg-emerald-600' : 'bg-gray-200'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isMirrored ? 'translate-x-3.5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          )}
          
          {!error && (
            <p className="text-[10px] text-gray-400 font-bold text-center italic leading-normal">
              Aplikasi akan memindai NIS secara otomatis jika terdeteksi
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
