import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, AlertCircle, RefreshCw, SwitchCamera } from 'lucide-react';

interface InlineQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  elementId?: string;
}

export const InlineQrScanner: React.FC<InlineQrScannerProps> = ({
  onScanSuccess,
  elementId = "beranda-inline-qr-reader"
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isMirrored, setIsMirrored] = useState(() => {
    return localStorage.getItem('esangu_scanner_mirrored') === 'true';
  });
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(() => {
    return (localStorage.getItem('esangu_scanner_facing_mode') as 'environment' | 'user') || 'environment';
  });
  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  const startScanner = () => {
    setError(null);
    setIsInitializing(true);

    setTimeout(() => {
      try {
        const scanner = new Html5Qrcode(elementId);
        qrCodeRef.current = scanner;

        scanner.start(
          { facingMode: facingMode },
          {
            fps: 15,
            qrbox: (width, height) => {
              const minDim = Math.min(width, height);
              let size = Math.floor(minDim * 0.75);
              if (size < 150) size = minDim >= 150 ? 150 : Math.max(50, minDim);
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            if (scanner.isScanning) {
              scanner.stop().then(() => {
                onScanSuccessRef.current(decodedText);
              }).catch(() => {
                onScanSuccessRef.current(decodedText);
              });
            } else {
              onScanSuccessRef.current(decodedText);
            }
          },
          () => {}
        ).then(() => {
          setIsInitializing(false);
        }).catch((err) => {
          console.error("Camera start error:", err);
          setError("Gagal mengakses kamera. Silakan periksa izin kamera pada peramban Anda.");
          setIsInitializing(false);
        });
      } catch (err) {
        console.error("Scanner init error:", err);
        setError("Sistem pemindai QR gagal diinisialisasi.");
        setIsInitializing(false);
      }
    }, 300);
  };

  useEffect(() => {
    startScanner();
    return () => {
      if (qrCodeRef.current) {
        if (qrCodeRef.current.isScanning) {
          qrCodeRef.current.stop().catch(err => console.error("Error stopping scanner on unmount:", err));
        }
      }
    };
  }, [elementId, facingMode]);

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-3">
      <style>{`
        #${elementId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1rem !important;
          ${isMirrored ? 'transform: scaleX(-1) !important;' : 'transform: none !important;'}
        }
        #${elementId} {
          border: none !important;
          background: #000000 !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>

      {error ? (
        <div className="text-center p-5 space-y-3 bg-red-50 rounded-2xl border border-red-100 w-full">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-black text-red-800 uppercase tracking-widest">Kamera Tidak Aktif</h4>
          <p className="text-[10px] text-red-600 font-bold leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={startScanner}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider border-none transition cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Cek Kamera Lagi
          </button>
        </div>
      ) : (
        <div className="relative w-full aspect-square max-w-[280px] bg-black rounded-2xl overflow-hidden shadow-inner border border-emerald-900/10">
          {!isInitializing && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              <div className="absolute w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce" style={{ animationDuration: '2.5s' }} />
              <div className="absolute w-44 h-44 border border-emerald-450/40 rounded-xl flex items-center justify-center">
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />
              </div>
            </div>
          )}

          <div id={elementId} className="w-full h-full" />

          {isInitializing && (
            <div className="absolute inset-0 bg-emerald-950 flex flex-col items-center justify-center space-y-3 z-20">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest animate-pulse">Menyalakan Kamera...</p>
            </div>
          )}
        </div>
      )}

      {!error && !isInitializing && (
        <div className="flex flex-col gap-2 w-full max-w-[280px]">
          {/* Mirror Toggle */}
          <div className="flex items-center justify-between w-full px-3 py-2 bg-emerald-50/60 rounded-xl border border-emerald-100/40">
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

          {/* Switch Camera Button */}
          <button
            type="button"
            onClick={() => {
              const nextMode = facingMode === 'environment' ? 'user' : 'environment';
              setFacingMode(nextMode);
              localStorage.setItem('esangu_scanner_facing_mode', nextMode);
            }}
            className="flex items-center justify-between w-full px-3 py-2 bg-emerald-50/60 hover:bg-emerald-100/60 rounded-xl border border-emerald-100/40 transition-all cursor-pointer text-left"
          >
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-emerald-950 uppercase tracking-wider">Ganti Kamera</span>
              <span className="text-[7px] text-gray-400 font-bold">
                {facingMode === 'environment' ? 'Kamera Belakang (Aktif)' : 'Kamera Depan (Aktif)'}
              </span>
            </div>
            <div className="p-1 bg-white rounded-lg border border-emerald-100 text-emerald-700 shadow-sm">
              <SwitchCamera className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
