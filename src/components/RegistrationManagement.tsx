import React, { useState } from 'react';
import { PendingRegistration } from '../types';
import { 
  CheckCircle, 
  Clock, 
  UserCheck, 
  Search, 
  Info, 
  Trash2, 
  MessageCircle, 
  Eye, 
  Image, 
  X, 
  Coins, 
  FileText, 
  ArrowRightCircle,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RegistrationManagementProps {
  registrations: PendingRegistration[];
  onConfirm: (regId: string, nis: string, sendWa: boolean) => void;
  onReject: (regId: string, reason?: string) => void;
  onApproveDeposit?: (reg: PendingRegistration) => void;
}

export default function RegistrationManagement({ 
  registrations, 
  onConfirm, 
  onReject,
  onApproveDeposit
}: RegistrationManagementProps) {
  const [activeTab, setActiveTab] = useState<'buka_akun' | 'setor_dana'>('buka_akun');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [nisInput, setNisInput] = useState('');
  
  // Rejection modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Lightbox receipt preview state
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // Filter registrations by type
  const pendingBukaAkun = (registrations || []).filter(r => r.status === 'Pending' && (!r.type || r.type === 'Buka Akun'));
  const pendingSetorDana = (registrations || []).filter(r => r.status === 'Pending' && r.type === 'Setor Dana');

  // Apply search filter
  const filteredBukaAkun = pendingBukaAkun.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.className && r.className.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSetorDana = pendingSetorDana.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.className && r.className.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleConfirmClick = (id: string) => {
    setConfirmingId(id);
    setNisInput('');
  };

  const handleConfirmSubmit = (e: React.FormEvent, sendWa: boolean) => {
    e.preventDefault();
    if (confirmingId && nisInput.length === 8 && /^\d{8}$/.test(nisInput)) {
      onConfirm(confirmingId, nisInput, sendWa);
      setConfirmingId(null);
      setNisInput('');
      alert('Pendaftaran berhasil dikonfirmasi! Santri telah ditambahkan ke database.');
    } else {
      alert('NIS wajib berisi 8 digit angka!');
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectingId) {
      const reg = registrations.find(r => r.id === rejectingId);
      const name = reg ? reg.name : 'Santri';
      const reason = rejectReasonInput || 'Tanpa alasan';
      
      const isConfirmed = window.confirm(`Apakah Anda yakin ingin menolak pengajuan dari ${name} dengan alasan: "${reason}"?`);
      if (!isConfirmed) return;

      onReject(rejectingId, reason);
      setRejectingId(null);
      setRejectReasonInput('');
      alert(`Pengajuan dari ${name} telah BERHASIL DITOLAK.\nAlasan: "${reason}"`);
    }
  };

  const exportToExcel = () => {
    try {
      const dataToExport = (registrations || []).map((reg, idx) => ({
        'No': idx + 1,
        'Tanggal': new Date(reg.timestamp).toLocaleString('id-ID'),
        'Jenis Pengajuan': reg.type || 'Buka Akun',
        'Nama Santri/Calon': reg.name,
        'Kelas': reg.className || '-',
        'Asrama': reg.dorm || '-',
        'No. WA Wali': reg.guardianPhone || '-',
        'Nominal Setor': reg.amount || '-',
        'Jenis Akun': reg.accountType || '-',
        'Catatan Wali': reg.note || '-',
        'Status': reg.status === 'Pending' ? 'Pending (Diproses)' : reg.status === 'Confirmed' ? 'Confirmed (Disetujui)' : 'Rejected (Ditolak)',
        'Alasan Penolakan': reg.rejectionReason || '-'
      }));

      if (dataToExport.length === 0) {
        alert('Tidak ada data riwayat pengajuan untuk diexport.');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Pengajuan");

      // Auto-fit column widths
      const maxLens = Object.keys(dataToExport[0] || {}).map(key => {
        let maxLen = key.length;
        dataToExport.forEach(row => {
          const val = (row as any)[key];
          if (val) maxLen = Math.max(maxLen, String(val).length);
        });
        return { wch: maxLen + 3 };
      });
      worksheet['!cols'] = maxLens;

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `Riwayat_Pengajuan_Portal_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Gagal mendownload file Excel.');
    }
  };

  const exportToPDF = () => {
    try {
      if ((registrations || []).length === 0) {
        alert('Tidak ada data riwayat pengajuan untuk diexport.');
        return;
      }

      const doc = new jsPDF('l', 'pt', 'a4'); // Use landscape for wide table
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RIWAYAT PENGAJUAN & VERIFIKASI PORTAL', pageWidth / 2, 40, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 40, 60);

      const head = [[
        'No', 'Tanggal', 'Jenis', 'Nama Santri', 'Kelas', 'Nominal', 'Jenis Akun', 'Catatan Wali', 'Status', 'Alasan Tolak'
      ]];

      const body = (registrations || []).map((reg, idx) => [
        idx + 1,
        new Date(reg.timestamp).toLocaleDateString('id-ID'),
        reg.type || 'Buka Akun',
        reg.name,
        reg.className || '-',
        reg.amount ? formatCurrency(reg.amount) : '-',
        reg.accountType || '-',
        reg.note || '-',
        reg.status === 'Pending' ? 'Diproses' : reg.status === 'Confirmed' ? 'Disetujui' : 'Ditolak',
        reg.rejectionReason || '-'
      ]);

      autoTable(doc, {
        startY: 80,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [4, 120, 87] }, // Emerald header
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 60 },
          2: { cellWidth: 60 },
          3: { cellWidth: 100 },
          4: { cellWidth: 40 },
          5: { cellWidth: 65 },
          6: { cellWidth: 50 },
          7: { cellWidth: 100 },
          8: { cellWidth: 50 },
          9: { cellWidth: 100 }
        }
      });

      doc.save(`Riwayat_Pengajuan_Portal_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Gagal mendownload file PDF.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-black text-emerald-950 tracking-tight uppercase flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            PENGAJUAN & VERIFIKASI PORTAL
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Kelola pendaftaran akun santri baru dan verifikasi pengajuan setoran transfer mandiri.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={exportToExcel}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-black rounded-xl text-[10px] uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Export Semua Riwayat Pengajuan ke Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Excel
          </button>
          
          <button
            type="button"
            onClick={exportToPDF}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-black rounded-xl text-[10px] uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Export Semua Riwayat Pengajuan ke PDF"
          >
            <Download className="w-4 h-4 text-rose-600" />
            Export PDF
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-emerald-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all w-full sm:w-48 font-bold"
            />
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-gray-200 gap-2 shrink-0">
        <button
          onClick={() => { setActiveTab('buka_akun'); setSearchTerm(''); }}
          className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-2 cursor-pointer bg-transparent ${
            activeTab === 'buka_akun'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Buka Akun Baru
          {pendingBukaAkun.length > 0 && (
            <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">
              {pendingBukaAkun.length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('setor_dana'); setSearchTerm(''); }}
          className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-2 cursor-pointer bg-transparent ${
            activeTab === 'setor_dana'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          Setoran Mandiri (Transfer)
          {pendingSetorDana.length > 0 && (
            <span className="bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black">
              {pendingSetorDana.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        {activeTab === 'buka_akun' ? (
          /* TAB 1: BUKA AKUN BARU */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-emerald-50/70 text-emerald-950 font-black border-b border-emerald-100 uppercase tracking-wider text-[10px]">
                  <th className="p-4">Tanggal Pengajuan</th>
                  <th className="p-4 min-w-[200px]">Nama Calon Santri</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Asrama</th>
                  <th className="p-4">No. WA Wali</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 font-bold text-gray-750">
                {filteredBukaAkun.length > 0 ? (
                  filteredBukaAkun.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-mono text-gray-500 text-[11px]">
                        {new Date(reg.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-4 font-black text-slate-900">{reg.name}</td>
                      <td className="p-4 text-emerald-850 font-extrabold">{reg.className}</td>
                      <td className="p-4 text-gray-600">{reg.dorm || '-'}</td>
                      <td className="p-4 font-mono text-gray-600">{reg.guardianPhone || '-'}</td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-amber-55 text-amber-850 text-[9px] font-black uppercase flex items-center justify-center gap-1 w-fit mx-auto border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setRejectingId(reg.id);
                              setRejectReasonInput('');
                            }}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border-none bg-transparent"
                            title="Tolak Pengajuan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleConfirmClick(reg.id)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition shadow-md shadow-emerald-900/10 cursor-pointer flex items-center gap-1.5 border-none"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Konfirmasi NIS
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="max-w-xs mx-auto space-y-2">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                          <Info className="w-5 h-5" />
                        </div>
                        <p className="text-gray-400 font-bold text-sm">Tidak ada pengajuan buka akun baru.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* TAB 2: SETORAN MANDIRI (TRANSFER) */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-amber-50/40 text-slate-900 font-black border-b border-amber-100 uppercase tracking-wider text-[10px]">
                  <th className="p-4">Tanggal Transfer</th>
                  <th className="p-4 min-w-[200px]">Nama Santri</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Jenis Akun</th>
                  <th className="p-4 text-right">Nominal Setoran</th>
                  <th className="p-4">Catatan Wali</th>
                  <th className="p-4 text-center">Bukti</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50 font-bold text-gray-750">
                {filteredSetorDana.length > 0 ? (
                  filteredSetorDana.map((reg) => (
                    <tr key={reg.id} className="hover:bg-amber-50/10 transition-colors">
                      <td className="p-4 font-mono text-gray-500 text-[11px]">
                        {new Date(reg.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-4 font-black text-slate-900">{reg.name}</td>
                      <td className="p-4 text-emerald-850 font-extrabold">{reg.className || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                          reg.accountType === 'Tabungan' 
                            ? 'bg-teal-50 text-teal-800 border border-teal-100' 
                            : 'bg-emerald-50 text-emerald-850 border border-emerald-100'
                        }`}>
                          {reg.accountType || 'Tabungan'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-black text-emerald-800 text-sm">
                        {formatCurrency(reg.amount || 0)}
                      </td>
                      <td className="p-4 text-gray-600 font-medium max-w-[150px] truncate" title={reg.note}>
                        {reg.note || <span className="text-gray-300 italic">-</span>}
                      </td>
                      <td className="p-4 text-center">
                        {reg.transferReceiptUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptUrl(reg.transferReceiptUrl || null)}
                            className="p-1.5 bg-blue-55 hover:bg-blue-100 text-blue-700 rounded-lg transition border-none cursor-pointer inline-flex items-center justify-center gap-1 text-[10px] font-black uppercase"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Lihat
                          </button>
                        ) : (
                          <div className="flex items-center justify-center text-gray-300">
                            <Image className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-amber-55 text-amber-850 text-[9px] font-black uppercase flex items-center justify-center gap-1 w-fit mx-auto border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setRejectingId(reg.id);
                              setRejectReasonInput('');
                            }}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border-none bg-transparent"
                            title="Tolak Setoran"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onApproveDeposit && onApproveDeposit(reg)}
                            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition shadow-md shadow-teal-900/10 cursor-pointer flex items-center gap-1.5 border-none"
                          >
                            <ArrowRightCircle className="w-3.5 h-3.5" />
                            Proses Kasir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-12 text-center">
                      <div className="max-w-xs mx-auto space-y-2">
                        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-400 mx-auto">
                          <Info className="w-5 h-5" />
                        </div>
                        <p className="text-gray-400 font-bold text-sm">Tidak ada pengajuan setoran transfer mandiri.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRMATION / NIS ISSUANCE MODAL (TAB 1) */}
      {confirmingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/45 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-emerald-100 p-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-3 py-1 rounded-full uppercase tracking-wider">Buka Akun Baru</span>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-2">Daftar Akun Baru</h3>
              <p className="text-xs text-gray-500 font-medium">Tetapkan NIS untuk {registrations.find(r => r.id === confirmingId)?.name}</p>
            </div>

            <form onSubmit={(e) => handleConfirmSubmit(e, false)} className="space-y-4">
              <div className="space-y-2">
                <label className="block font-black text-emerald-950 text-[10px] uppercase tracking-widest text-center">NOMOR INDUK SANTRI (NIS)</label>
                <input
                  type="text"
                  autoFocus
                  required
                  maxLength={8}
                  minLength={8}
                  pattern="\d*"
                  placeholder="Masukkan 8-Digit NIS"
                  value={nisInput}
                  onChange={(e) => setNisInput(e.target.value)}
                  className="w-full p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl text-lg font-black tracking-[0.3em] text-emerald-950 focus:outline-none focus:border-emerald-600 font-mono text-center transition-all"
                />
                <p className="text-[9px] text-gray-400 font-bold italic text-center">NIS akan digunakan santri untuk login portal.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingId(null)}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-2xl text-xs uppercase tracking-widest transition border-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/10 transition border-none cursor-pointer"
                >
                  Simpan Saja
                </button>
              </div>
              <button
                type="button"
                onClick={(e) => handleConfirmSubmit(e, true)}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/10 transition cursor-pointer border-none"
              >
                <MessageCircle className="w-4 h-4" />
                Konfirmasi WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingId && (
        <div className="fixed inset-0 bg-emerald-950/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] w-full max-w-md p-6 border border-emerald-100 shadow-2xl space-y-4 transform animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-1">
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2 animate-pulse">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tolak Pengajuan</h3>
              <p className="text-xs text-gray-500 font-bold">
                Berikan alasan penolakan untuk pengajuan dari: <br />
                <strong className="text-red-600">{registrations.find(r => r.id === rejectingId)?.name}</strong>
              </p>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-500 font-black mb-1.5 uppercase tracking-wider text-[9px]">Alasan Penolakan (Catatan)</label>
                <textarea
                  required
                  placeholder="Contoh: Nominal transfer tidak sesuai dengan bukti, Bukti transfer tidak jelas / palsu, dst."
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs font-bold text-gray-800 h-24"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingId(null);
                    setRejectReasonInput('');
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
                >
                  Tolak Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX RECEIPT PREVIEW MODAL */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] overflow-hidden max-w-lg w-full shadow-2xl relative">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center font-black text-xs uppercase tracking-wider">
              <span className="flex items-center gap-2 text-amber-400">
                <Image className="w-4 h-4" />
                Bukti Transfer Setoran Mandiri
              </span>
              <button 
                onClick={() => setPreviewReceiptUrl(null)} 
                className="text-white hover:text-gray-300 cursor-pointer bg-transparent border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex items-center justify-center bg-gray-100 max-h-[70vh] overflow-auto">
              <img src={previewReceiptUrl} alt="Bukti Transfer" className="max-h-[60vh] rounded-2xl object-contain shadow-lg border border-gray-200" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
