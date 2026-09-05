import React, { useState } from 'react';
import { usePWAInstall } from '../lib/usePWAInstall';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

interface PWAInstallProps {
  variant?: 'button' | 'banner' | 'compact';
  className?: string;
  showAlways?: boolean;
  label?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallProps> = ({ 
  variant = 'button', 
  className = '', 
  showAlways = false,
  label = 'Instal Aplikasi'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('pwa_banner_dismissed') === 'true';
  });

  // If already installed as a standalone PWA and showAlways is false, hide install prompts completely
  if (isInstalled && !showAlways) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

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

  // Compact button for header / navigation / custom placements
  if (variant === 'button' || variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          id="btn-install-pwa"
          className={`group flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md shadow-emerald-900/20 active:scale-95 cursor-pointer border-none ${className}`}
          title="Instal Aplikasi ke Layar Utama HP / Komputer"
        >
          <Smartphone className="w-4 h-4 text-yellow-300 group-hover:scale-110 transition-transform shrink-0" />
          <span>{isInstalled ? 'Aplikasi Terpasang (PWA)' : label}</span>
        </button>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  // Floating banner for mobile screens
  if (variant === 'banner' && !isDismissed) {
    return (
      <>
        <aside
          aria-label="Pemberitahuan Pemasangan Aplikasi"
          className={`fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-96 z-40 bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-700/50 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 ${className}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shrink-0">
                <Smartphone className="w-5 h-5 text-emerald-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-xs uppercase tracking-wider text-emerald-300">
                    Aplikasi PWA Mandiri
                  </h4>
                  <span className="bg-yellow-400/20 text-yellow-300 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-yellow-400/30">
                    Standalone
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Pasang di layar utama HP Anda untuk akses cepat tanpa bilah browser.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pasang Sekarang</span>
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-3 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold rounded-xl transition"
            >
              Nanti Saja
            </button>
          </div>
        </aside>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

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
