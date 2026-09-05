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
          <InstallGuideModal 
            isIOS={isIOS}
            onClose={() => setShowIOSGuide(false)} 
          />
        )}
      </>
    );
  }

  // No ad/notification banner
  return null;
};

// Modal guide for Android & iOS to ensure standalone WebAPK / app mode
function InstallGuideModal({ isIOS, onClose }: { isIOS: boolean; onClose: () => void }) {
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
                {isIOS ? 'Pasang di iPhone / iPad' : 'Instal Aplikasi Mandiri (WebAPK)'}
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold">
                Aplikasi berdiri sendiri tanpa bilah browser
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
          {isIOS ? (
            <>
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-bold text-emerald-950">Buka Menu Bagikan</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Buka website ini di Safari, lalu tekan tombol <span className="font-black text-emerald-800">Bagikan (Share)</span> <Share className="inline w-3.5 h-3.5 mx-0.5 text-blue-600" /> di bagian bawah.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-bold text-emerald-950">Pilih Tambah ke Layar Utama</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Gulir ke bawah dan pilih <span className="font-black text-emerald-800">"Tambah ke Layar Utama"</span> <PlusSquare className="inline w-3.5 h-3.5 mx-0.5 text-emerald-700" />.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-bold text-emerald-950">Buka di Browser Google Chrome</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Pastikan Anda membuka website ini langsung di aplikasi <strong>Google Chrome</strong> (bukan di dalam browser aplikasi pesan seperti WhatsApp).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-bold text-emerald-950">Pilih "Instal Aplikasi"</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Tekan tombol menu titik tiga <span className="font-black text-slate-800">⋮</span> di pojok kanan atas Chrome, lalu pilih <span className="font-black text-emerald-800">"Instal Aplikasi"</span> (bukan sekadar pintasan).
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <p className="font-bold text-emerald-950">Aplikasi Mandiri Aktif</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Aplikasi akan dipasang ke daftar aplikasi HP sebagai aplikasi mandiri (WebAPK) dengan jendela penuh tanpa bilah URL browser.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-900/10 hover:from-emerald-700 hover:to-teal-700 cursor-pointer"
        >
          Mengerti, Tutup
        </button>
      </div>
    </div>
  );
}
