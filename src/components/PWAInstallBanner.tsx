import React, { useState } from 'react';
import { usePWAInstall } from '../lib/usePWAInstall';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

interface PWAInstallProps {
  variant?: 'button' | 'compact';
  className?: string;
  showAlways?: boolean;
  label?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallProps> = ({ 
  variant = 'button', 
  className = '', 
  showAlways = false,
  label = 'INSTAL APLIKASI'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as a standalone PWA and showAlways is false, hide install prompts completely
  if (isInstalled && !showAlways) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstalled) {
      setShowIOSGuide(true);
      return;
    }
    if (isIOS) {
      setShowIOSGuide(true);
    } else if (isInstallable) {
      await install();
    } else {
      // Fallback for browsers where beforeinstallprompt hasn't fired yet or manual install
      setShowIOSGuide(true);
    }
  };

  // Dedicated button placement
  if (variant === 'button' || variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          id="btn-install-pwa"
          className={`group flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-900/20 active:scale-95 cursor-pointer border-none ${className}`}
          title="Instal Aplikasi ke Layar Utama HP / Komputer"
        >
          <Smartphone className="w-4 h-4 text-yellow-300 group-hover:scale-110 transition-transform shrink-0" />
          <span>{label}</span>
        </button>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  // No ad/notification banner
  return null;
};

// Modal for iOS / Safari or browsers without beforeinstallprompt
function IOSInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-emerald-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-emerald-100 text-slate-800 space-y-4 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wide">
                Pasang di HP / iPhone
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold">
                Jalankan seperti aplikasi mandiri asli
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="font-bold text-emerald-950">Buka Menu Browser</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Tekan tombol <span className="font-black text-emerald-800">Bagikan (Share)</span> <Share className="inline w-3.5 h-3.5 mx-0.5 text-blue-600" /> di Safari iOS, atau titik tiga <span className="font-bold text-slate-700">⋮</span> di pojok kanan Chrome.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="font-bold text-emerald-950">Tambahkan ke Layar Utama</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Pilih menu <span className="font-black text-emerald-800">"Tambah ke Layar Utama"</span> <PlusSquare className="inline w-3.5 h-3.5 mx-0.5 text-emerald-700" /> atau <span className="font-bold text-slate-700">"Install Aplikasi"</span>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="font-bold text-emerald-950">Selesai!</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Ikon aplikasi E-Sangu akan muncul di layar HP Anda dan siap dibuka tanpa tab browser.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-900/10 hover:from-emerald-700 hover:to-teal-700 cursor-pointer"
        >
          Mengerti, Tutup Panduan
        </button>
      </div>
    </div>
  );
}
