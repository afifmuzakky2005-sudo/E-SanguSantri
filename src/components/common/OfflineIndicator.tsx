import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showReconnected) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600/95 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-emerald-400/40 backdrop-blur animate-in slide-in-from-top-4 duration-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        <span>Koneksi kembali online. Data tersinkron otomatis.</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-600/95 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-amber-400/40 backdrop-blur animate-in slide-in-from-top-4 duration-300">
        <WifiOff className="w-3.5 h-3.5 text-white animate-pulse" />
        <span>Mode Offline Aktif — Transaksi tersimpan lokal di perangkat.</span>
      </div>
    );
  }

  return null;
};
