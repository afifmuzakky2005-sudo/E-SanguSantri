import React, { useState, useEffect, useRef } from 'react';
import { ScanLine, ShieldAlert, CheckCircle2, Radio } from 'lucide-react';
import { playSuccessSound, playErrorSound } from '../lib/soundHelper';

interface PhysicalQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
}

export const PhysicalQrScanner: React.FC<PhysicalQrScannerProps> = ({
  onScanSuccess,
  title = 'Pindai QR Scanner',
  subtitle = 'Tempelkan kartu santri pada alat scanner fisik/tempel'
}) => {
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [manualBlockedAlert, setManualBlockedAlert] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Scanner buffer & timing references
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const keyIntervalsRef = useRef<number[]>([]);
  const blockTimeoutRef = useRef<any>(null);

  // Focus lock input ref
  const scannerInputRef = useRef<HTMLInputElement>(null);

  const triggerManualBlocked = (reason: string) => {
    playErrorSound();
    setManualBlockedAlert(reason);
    if (blockTimeoutRef.current) clearTimeout(blockTimeoutRef.current);
    blockTimeoutRef.current = setTimeout(() => {
      setManualBlockedAlert(null);
    }, 3500);
  };

  useEffect(() => {
    // Keep focus on component input if available
    const ensureFocus = () => {
      if (scannerInputRef.current && document.activeElement !== scannerInputRef.current) {
        // Only focus if user isn't actively interacting with another input
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'select' && activeTag !== 'textarea') {
          scannerInputRef.current?.focus({ preventScroll: true });
        }
      }
    };

    ensureFocus();
    const interval = setInterval(ensureFocus, 2000);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore functional control combinations
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const now = performance.now();
      const delta = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Handle Enter (which hardware barcode/QR scanners send at the end of scan)
      if (e.key === 'Enter') {
        e.preventDefault();
        const rawCode = bufferRef.current.trim();
        const intervals = keyIntervalsRef.current;
        bufferRef.current = '';
        keyIntervalsRef.current = [];

        if (!rawCode || rawCode.length < 3) {
          if (rawCode.length > 0) {
            triggerManualBlocked('Karakter tidak mencukupi untuk sebuah kode santri.');
          }
          return;
        }

        // Validate that keystrokes came from a hardware scanner (rapid burst: average delta < 50ms)
        const avgDelta = intervals.length > 0
          ? intervals.reduce((a, b) => a + b, 0) / intervals.length
          : 999;

        // If average typing speed was slow (human typing), REJECT
        if (avgDelta > 60) {
          triggerManualBlocked('⚠️ Pengetikan manual dikunci! Harap tempelkan kartu santri pada alat QR Scanner fisik.');
          return;
        }

        // Valid hardware scanner burst
        handleValidScan(rawCode);
        return;
      }

      // Handle printable characters
      if (e.key.length === 1) {
        // If the gap between this key and previous key is large (> 70ms),
        // it means someone is typing manually by hand!
        if (bufferRef.current.length > 0 && delta > 75) {
          // Reset buffer and reject human keyboard typing
          bufferRef.current = '';
          keyIntervalsRef.current = [];
          triggerManualBlocked('⚠️ Pengetikan manual tidak diizinkan! Sistem hanya menerima pindaian otomatis dari alat scanner fisik.');
          return;
        }

        bufferRef.current += e.key;
        if (bufferRef.current.length > 1) {
          keyIntervalsRef.current.push(delta);
        }

        // Safety timeout: if no subsequent key or Enter within 250ms, wipe buffer
        setTimeout(() => {
          if (performance.now() - lastKeyTimeRef.current > 200 && bufferRef.current.length > 0) {
            // Check if it was stalled human typing
            bufferRef.current = '';
            keyIntervalsRef.current = [];
          }
        }, 220);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (blockTimeoutRef.current) clearTimeout(blockTimeoutRef.current);
    };
  }, [onScanSuccess]);

  const handleValidScan = (code: string) => {
    setIsProcessing(true);
    setLastScanned(code);
    playSuccessSound();

    setTimeout(() => {
      setIsProcessing(false);
      onScanSuccess(code);
    }, 400);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden space-y-6">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Invisible/Protected Input to block manual typing */}
      <input
        ref={scannerInputRef}
        type="text"
        readOnly
        aria-hidden="true"
        className="opacity-0 absolute w-0 h-0 pointer-events-none"
        onPaste={(e) => {
          e.preventDefault();
          triggerManualBlocked('Penempelan (Paste) tidak diizinkan. Gunakan alat scanner fisik!');
        }}
      />

      {/* Top Status Header */}
      <div className="flex items-center justify-between w-full border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
            QR Scanner Aktif
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span className="text-[9.5px] font-bold text-slate-300">Siap Mendeteksi</span>
        </div>
      </div>

      {/* Physical Scanner Target Area with Animated Laser */}
      <div className="relative w-64 h-64 bg-slate-950/80 rounded-2xl border-2 border-dashed border-emerald-500/40 flex flex-col items-center justify-center p-4 shadow-inner group">
        {/* Animated Laser Beam */}
        <div
          className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] pointer-events-none"
          style={{
            animation: 'scanLaser 2.4s ease-in-out infinite alternate',
          }}
        />

        {/* Center Target Icon */}
        <div className="w-24 h-24 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
          <ScanLine className="w-14 h-14 text-emerald-400 stroke-[1.5]" />
        </div>

        {/* Scanner Corner Accents */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br" />

        {/* Target overlay caption */}
        <div className="absolute bottom-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Sensor Scanner Tempel
          </p>
        </div>
      </div>

      {/* Instruction Content */}
      <div className="text-center space-y-1 max-w-sm">
        <h4 className="text-base font-black text-white tracking-wide">
          Tempelkan Kartu Santri pada Scanner
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          Dekatkan kode QR pada kartu tabungan santri ke sensor alat pemindai fisik. Sistem akan langsung membaca data tanpa menekan tombol.
        </p>
      </div>

      {/* Alert when user tried to type manually */}
      {manualBlockedAlert && (
        <div className="w-full bg-rose-950/90 border-2 border-rose-500 text-rose-100 rounded-2xl p-3.5 flex items-center gap-3 animate-shake shadow-lg">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
          <div className="text-left">
            <p className="text-xs font-black text-white">Akses Ditolak!</p>
            <p className="text-[10.5px] font-medium text-rose-200 mt-0.5">
              {manualBlockedAlert}
            </p>
          </div>
        </div>
      )}

      {/* Success indicator when scanned */}
      {isProcessing && lastScanned && (
        <div className="w-full bg-emerald-900/90 border-2 border-emerald-400 text-emerald-100 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 animate-pulse" />
          <div className="text-left">
            <p className="text-xs font-black text-white">Kartu Terdeteksi!</p>
            <p className="text-[10.5px] font-mono text-emerald-300">
              NIS: {lastScanned} • Membuka data santri...
            </p>
          </div>
        </div>
      )}

      {/* Laser beam style */}
      <style>{`
        @keyframes scanLaser {
          0% {
            top: 16px;
            opacity: 0.2;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            top: 236px;
            opacity: 0.2;
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};
