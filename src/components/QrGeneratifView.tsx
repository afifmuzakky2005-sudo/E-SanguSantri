import React, { useState, useEffect } from 'react';
import { Santri, Transaction, InstitutionSettings, FinancialSettings } from '../types';
import { calculateBalances } from '../data/mockData';
import { playSuccessSound, playErrorSound } from '../lib/soundHelper';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { QrScannerModal } from './QrScannerModal';
import { 
  QrCode, 
  Sparkles, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Camera 
} from 'lucide-react';

interface QrGeneratifViewProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  financial: FinancialSettings;
}

export const QrGeneratifView: React.FC<QrGeneratifViewProps> = ({
  students,
  transactions,
  institution,
  financial
}) => {
  const [selectedQrStudentId, setSelectedQrStudentId] = useState<string>('');
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState<string>('');
  const [testQrNisInput, setTestQrNisInput] = useState<string>('');
  const [testQrResult, setTestQrResult] = useState<{
    success: boolean;
    message: string;
    student?: Santri;
    balances?: { tabungan: number; penitipan: number; total: number };
  } | null>(null);
  const [isScanningSim, setIsScanningSim] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const studentsWithSavings = students.filter(s => s.hasSavings && s.savingsActive !== false);

  const downloadSinglePlainQr = async (student: Santri) => {
    return new Promise<void>(async (resolve) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve();
          return;
        }

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render QR Code
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, student.nis, { width: 240, margin: 1 });
        ctx.drawImage(qrCanvas, (canvas.width - 240) / 2, 20, 240, 240);

        // Draw NIS under QR
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px Courier New, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(student.nis, canvas.width / 2, 290);

        // Draw Name under NIS
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 12px Arial, sans-serif';
        const nameText = student.name.toUpperCase();
        const maxLen = 28;
        const displayName = nameText.length > maxLen ? nameText.substring(0, maxLen) + '...' : nameText;
        ctx.fillText(displayName, canvas.width / 2, 315);

        // Draw Class / Dorm under Name
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px Arial, sans-serif';
        ctx.fillText(`${student.className} • ${student.dorm || '-'}`, canvas.width / 2, 335);

        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `QR_POLOS_${student.nis}_${student.name.replace(/\s+/g, '_')}.png`);
          }
          resolve();
        });
      } catch (err) {
        console.error("Error generating plain QR:", err);
        resolve();
      }
    });
  };

  const handleDownloadAllQr = async () => {
    const list = students.filter(s => s.hasSavings);
    if (list.length === 0) {
      alert("Tidak ada data santri dengan fasilitas tabungan aktif.");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin mengunduh ${list.length} QR code santri sekaligus? Beberapa peramban mungkin akan meminta izin unduhan ganda.`)) {
      return;
    }

    setIsDownloadingAll(true);
    setDownloadProgress({ current: 0, total: list.length });

    for (let i = 0; i < list.length; i++) {
      const student = list[i];
      setDownloadProgress({ current: i + 1, total: list.length });
      await downloadSinglePlainQr(student);
      // stagger to avoid browser downloads blocking
      await new Promise(r => setTimeout(r, 450));
    }

    setIsDownloadingAll(false);
  };

  useEffect(() => {
    if (!selectedQrStudentId && studentsWithSavings.length > 0) {
      setSelectedQrStudentId(studentsWithSavings[0].id);
    }
  }, [students, selectedQrStudentId]);

  useEffect(() => {
    if (!selectedQrStudentId) {
      setGeneratedQrDataUrl('');
      return;
    }
    const student = students.find(s => s.id === selectedQrStudentId);
    if (student) {
      QRCode.toDataURL(student.nis, { width: 250, margin: 2 }, (err, url) => {
        if (!err && url) {
          setGeneratedQrDataUrl(url);
        }
      });
    }
  }, [selectedQrStudentId, students]);

  // --- QR Helper Functions ---
  const downloadQrPng = async (student: Santri, qrValue: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 550;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border & Header
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    ctx.fillStyle = '#064e3b';
    ctx.fillRect(10, 10, canvas.width - 20, 90);

    // Logo if exists
    if (institution.logoUrl) {
      try {
        const img = new Image();
        img.src = institution.logoUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        ctx.drawImage(img, 25, 25, 60, 60);
      } catch (e) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.fillText('🕌', 35, 65);
      }
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Arial';
      ctx.fillText('🕌', 35, 65);
    }

    // Header Texts
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('E-SANGU SANTRI', 100, 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    const instName = institution.name.length > 25 ? institution.name.substring(0, 25) + '...' : institution.name;
    ctx.fillText(instName, 100, 60);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 9px Arial';
    ctx.fillText('PASPOR BUKU TABUNGAN', 100, 78);

    // Student Info Box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(25, 120, canvas.width - 50, 90);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(25, 120, canvas.width - 50, 90);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px Arial';
    ctx.fillText('NAMA SANTRI', 40, 145);
    ctx.fillText('NOMOR INDUK SANTRI (NIS)', 40, 185);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(student.name.toUpperCase(), 40, 162);
    ctx.font = 'bold 14px Arial';
    ctx.fillText(student.nis, 40, 202);

    // QR Code Generation
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, qrValue, { width: 220, margin: 1 });
    ctx.drawImage(qrCanvas, (canvas.width - 220) / 2, 230, 220, 220);

    // Footer text
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TEMPELKAN KARTU INI DI BUKU TABUNGAN', canvas.width / 2, 480);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('SCAN UNTUK CEK SALDO REALTIME', canvas.width / 2, 505);

    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `PASPOR_QR_${student.nis}_${student.name.replace(/\s+/g, '_')}.png`);
      }
    });
  };

  const downloadQrPdf = async (student: Santri, qrValue: string) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a6'
    });

    // Card Background box
    doc.setDrawColor(6, 78, 59);
    doc.setLineWidth(1.5);
    doc.rect(5, 5, 95, 138);

    // Header Banner
    doc.setFillColor(6, 78, 59);
    doc.rect(5.5, 5.5, 94, 25, 'F');

    // Logo
    if (institution.logoUrl) {
      try {
        doc.addImage(institution.logoUrl, 'JPEG', 8, 8, 18, 18);
      } catch (e) {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('🕌', 10, 20);
      }
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('🕌', 10, 20);
    }

    // Header Titles
    doc.setTextColor(52, 211, 153);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('E-SANGU SANTRI', 28, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    const instName = institution.name.length > 25 ? institution.name.substring(0, 25) + '...' : institution.name;
    doc.text(instName, 28, 18);

    doc.setTextColor(167, 243, 208);
    doc.setFontSize(7);
    doc.text('PASPOR BUKU TABUNGAN', 28, 23);

    // Student Info Card
    doc.setFillColor(248, 250, 252);
    doc.rect(10, 36, 85, 26, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(10, 36, 85, 26);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text('NAMA LENGKAP SANTRI', 14, 42);
    doc.text('NOMOR INDUK SANTRI (NIS)', 14, 53);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(student.name.toUpperCase(), 14, 47);
    doc.setFontSize(10);
    doc.text(student.nis, 14, 59);

    // QR Code
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, qrValue, { width: 220, margin: 1 });
    const qrDataUrl = qrCanvas.toDataURL('image/jpeg', 1.0);
    doc.addImage(qrDataUrl, 'JPEG', 27, 68, 50, 50);

    // Footer info
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('TEMPELKAN KARTU INI DI BUKU TABUNGAN', 52.5, 126, { align: 'center' });
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('SCAN UNTUK CEK SALDO REALTIME', 52.5, 132, { align: 'center' });

    doc.save(`PASPOR_QR_${student.nis}.pdf`);
  };

  const handleTestQr = (inputNis: string) => {
    const student = students.find(s => s.nis === inputNis);
    if (!student) {
      playErrorSound();
      setTestQrResult({
        success: false,
        message: `Nomor Induk Santri (NIS) "${inputNis}" tidak ditemukan dalam database atau belum terdaftar.`
      });
      return;
    }
    if (!student.hasSavings) {
      playErrorSound();
      setTestQrResult({
        success: false,
        message: `Santri "${student.name}" ditemukan, tetapi belum memiliki atau belum mengaktifkan fasilitas tabungan.`
      });
      return;
    }

    playSuccessSound();
    const balances = calculateBalances(student.id, transactions);
    setTestQrResult({
      success: true,
      message: 'Verifikasi identitas QR berhasil!',
      student,
      balances
    });
  };

  const handleSimulateScan = (inputNis: string) => {
    setIsScanningSim(true);
    setTestQrResult(null);
    setTimeout(() => {
      setIsScanningSim(false);
      handleTestQr(inputNis);
    }, 1500);
  };

  const handleCameraScanSuccess = (decodedText: string) => {
    setIsCameraScannerOpen(false);
    setTestQrNisInput(decodedText);
    handleSimulateScan(decodedText);
  };

  return (
    <div className="space-y-6">
      {/* ----------------- SEKSI QR GENERATIF ----------------- */}
      <div className="bg-white border border-slate-200/80 rounded-[32px] p-8 text-slate-800 space-y-6 shadow-xl relative overflow-hidden">
        {/* Decorative background lights */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight mt-1.5 flex items-center gap-2 text-slate-900">
              <QrCode className="w-6 h-6 text-emerald-600" />
              QR GENERATIF & CEK SALDO
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Kloning, cetak, atau uji kode QR identitas NIS santri untuk dipasang pada buku tabungan fisik.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isDownloadingAll ? (
              <div className="flex flex-col sm:items-end justify-center bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl min-w-[180px]">
                <div className="flex justify-between items-center w-full mb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 animate-pulse">Mengunduh QR Polos...</span>
                  <span className="text-[10px] font-bold font-mono text-slate-800">{downloadProgress.current}/{downloadProgress.total}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={handleDownloadAllQr}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer border-none shadow-md shadow-emerald-600/15 shrink-0"
              >
                <Download className="w-4 h-4" />
                Unduh Semua QR Polos
              </button>
            )}
            <div className="text-[10px] text-center font-black text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-3 rounded-xl font-mono uppercase tracking-wider h-full flex items-center justify-center">
              Status: Aktif
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 1. PEMBUAT QR BARU & UNDUH */}
          <div className="lg:col-span-7 bg-slate-50/60 border border-slate-100 p-6 rounded-2xl space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black text-xs">01</div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Pembuat QR Baru</h3>
                <p className="text-[10px] text-slate-500 font-bold">Pilih santri untuk membuat passbook QR identitas</p>
              </div>
            </div>

            {/* Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Pilih Santri Terdaftar</label>
              <select
                value={selectedQrStudentId}
                onChange={(e) => setSelectedQrStudentId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer shadow-xs"
              >
                <option value="" disabled>-- Pilih Santri --</option>
                {students.filter(s => s.hasSavings).map((student) => (
                  <option key={student.id} value={student.id}>
                    [{student.nis}] - {student.name.toUpperCase()} ({student.className})
                  </option>
                ))}
              </select>
            </div>

            {selectedQrStudentId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                {/* QR Preview Wrapper */}
                <div className="flex flex-col items-center justify-center bg-white p-3.5 rounded-2xl shadow-md border border-slate-200 w-full max-w-[180px] mx-auto">
                  {generatedQrDataUrl ? (
                    <img src={generatedQrDataUrl} alt="Generated QR" className="w-36 h-36 object-contain" />
                  ) : (
                    <div className="w-36 h-36 bg-slate-100 animate-pulse rounded-lg" />
                  )}
                  <span className="mt-2 text-[10px] font-mono font-black text-slate-800 tracking-widest">
                    NIS: {students.find(s => s.id === selectedQrStudentId)?.nis}
                  </span>
                </div>

                {/* Export Options */}
                <div className="space-y-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      {students.find(s => s.id === selectedQrStudentId)?.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold font-mono">
                      Kelas: {students.find(s => s.id === selectedQrStudentId)?.className}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold font-mono">
                      Asrama: {students.find(s => s.id === selectedQrStudentId)?.dorm || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        const s = students.find(s => s.id === selectedQrStudentId);
                        if (s) downloadQrPng(s, s.nis);
                      }}
                      className="flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer border-none shadow-md shadow-emerald-600/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh Kartu PNG
                    </button>
                    <button
                      onClick={() => {
                        const s = students.find(s => s.id === selectedQrStudentId);
                        if (s) downloadQrPdf(s, s.nis);
                      }}
                      className="flex items-center justify-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer border-none shadow-md shadow-teal-600/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh PDF (A6)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. CEK / TEST QR */}
          <div className="lg:col-span-5 bg-slate-50/60 border border-slate-100 p-6 rounded-2xl space-y-4 relative">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center font-black text-xs">02</div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Cek / Test QR</h3>
                <p className="text-[10px] text-slate-500 font-bold">Pindai QR lewat kamera atau jalankan simulasi</p>
              </div>
            </div>

            {/* Direct Input & Simulator UI */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  maxLength={8}
                  placeholder="Masukkan atau Scan NIS (8 digit)..."
                  value={testQrNisInput}
                  onChange={(e) => setTestQrNisInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-xs"
                />
                <button
                  onClick={() => {
                    if (testQrNisInput.length === 8) {
                      handleTestQr(testQrNisInput);
                    }
                  }}
                  className="absolute right-2 top-1.5 p-1.5 text-emerald-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border-none cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setIsCameraScannerOpen(true)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
                >
                  <Camera className="w-4 h-4" />
                  Buka Scanner Kamera
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const student = students.find(s => s.id === selectedQrStudentId);
                      if (student) {
                        setTestQrNisInput(student.nis);
                        handleSimulateScan(student.nis);
                      } else {
                        alert('Silakan pilih santri terlebih dahulu di kolom kiri untuk melakukan tes scan!');
                      }
                    }}
                    className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-extrabold text-[9px] uppercase tracking-widest rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Simulasi Scan
                  </button>
                  {testQrResult && (
                    <button
                      type="button"
                      onClick={() => {
                        setTestQrResult(null);
                        setTestQrNisInput('');
                      }}
                      className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-extrabold text-[9px] uppercase tracking-widest rounded-xl transition cursor-pointer shadow-xs"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Scanning visual animation state */}
            {isScanningSim && (
              <div className="p-10 bg-slate-50/80 rounded-xl border border-slate-200 text-center space-y-4 animate-pulse relative overflow-hidden">
                <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981] animate-bounce" style={{ animationDuration: '1.5s' }} />
                <QrCode className="w-12 h-12 text-emerald-600 mx-auto animate-spin" style={{ animationDuration: '4s' }} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Menghubungkan Scanner & Membaca Data...</p>
              </div>
            )}

            {/* Scan / Test result details */}
            {!isScanningSim && testQrResult && (
              <div className={`p-4 rounded-xl border border-slate-200 bg-white shadow-sm animate-in zoom-in-95 duration-200 ${
                testQrResult.success 
                  ? 'space-y-3' 
                  : 'text-center py-6 space-y-2'
              }`}>
                {testQrResult.success && testQrResult.student && testQrResult.balances ? (
                  <>
                    <div className="flex items-center gap-2 text-emerald-600 border-b border-slate-100 pb-2.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Hasil Scan: Berhasil Diverifikasi</span>
                    </div>
                    
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{testQrResult.student.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 font-mono">NIS: {testQrResult.student.nis} • Kelas: {testQrResult.student.className}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Asrama: {testQrResult.student.dorm || '-'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1.5 text-left">
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                        <span className="block text-[8px] text-teal-600 font-black uppercase tracking-widest">Saldo Tabungan</span>
                        <span className="text-[11px] font-black font-mono text-slate-800">{formatCurrency(testQrResult.balances.tabungan)}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                        <span className="block text-[8px] text-emerald-600 font-black uppercase tracking-widest">Saldo Penitipan</span>
                        <span className="text-[11px] font-black font-mono text-slate-800">{formatCurrency(testQrResult.balances.penitipan)}</span>
                      </div>
                      <div className="col-span-2 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-slate-200 p-2.5 rounded-lg flex justify-between items-center">
                        <span className="text-[9px] text-emerald-700 font-black uppercase tracking-widest">Total Saldo Aktif</span>
                        <span className="text-sm font-black font-mono text-emerald-800">{formatCurrency(testQrResult.balances.total)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-black text-red-600 uppercase tracking-wider">Verifikasi Gagal</p>
                    <p className="text-[10px] text-red-500/80 font-bold leading-relaxed">{testQrResult.message}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Camera scanner modal wrapper */}
      <QrScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
      />
    </div>
  );
};
