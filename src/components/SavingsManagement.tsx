import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Santri, Transaction, InstitutionSettings, FinancialSettings, PendingRegistration } from '../types';
import { calculateBalances } from '../data/mockData';
import { Search, MessageCircle, FileDown, Trash2, Printer, X, Filter, BookOpen, AlertCircle, Sparkles, UserPlus, ChevronRight, UserCheck, Edit2, Power, Plus, QrCode, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { printPassbook, formatTxId } from '../lib/printHelper';

interface SavingsManagementProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  financial?: FinancialSettings;
  onEditStudent: (s: Santri) => void;
  onActivateSavings: (id: string) => void;
  onDeactivateSavings: (id: string) => void;
  onBulkDeactivateSavings?: (ids: string[]) => void;
  institutionClasses?: string[];
  registrations?: PendingRegistration[];
  onDeleteRegistration?: (regId: string) => void;
}

export default function SavingsManagement({
  students,
  transactions,
  institution,
  financial,
  onEditStudent,
  onActivateSavings,
  onDeactivateSavings,
  onBulkDeactivateSavings,
  institutionClasses = [],
  registrations = [],
  onDeleteRegistration
}: SavingsManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterDorm, setFilterDorm] = useState('Semua');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Print popup states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTab, setPrintTab] = useState<'Tabungan' | 'Penitipan' | 'Pengajuan'>('Tabungan');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmWithBalanceId, setDeleteConfirmWithBalanceId] = useState<string | null>(null);
  const [isBulkDeleteConfirm, setIsBulkDeleteConfirm] = useState(false);
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Edit Student/Tabungan States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [nis, setNis] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [dorm, setDorm] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [savingsStatus, setSavingsStatus] = useState<boolean>(true);
  const [formError, setFormError] = useState('');

  // QR Code States & Effects
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

  useEffect(() => {
    const studentsWithSavings = students.filter(s => s.hasSavings && s.savingsActive !== false);
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
      setTestQrResult({
        success: false,
        message: `Nomor Induk Santri (NIS) "${inputNis}" tidak ditemukan dalam database atau belum terdaftar.`
      });
      return;
    }
    if (!student.hasSavings) {
      setTestQrResult({
        success: false,
        message: `Santri "${student.name}" ditemukan, tetapi belum memiliki atau belum mengaktifkan fasilitas tabungan.`
      });
      return;
    }

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

  const handleOpenEdit = (student: Santri) => {
    setEditStudentId(student.id);
    setNis(student.nis);
    setName(student.name);
    setClassName(student.className);
    setDorm(student.dorm || '');
    setGuardianPhone(student.guardianPhone || '');
    setSavingsStatus(student.savingsActive ?? true);
    setFormError('');
    setShowEditModal(true);
  };

  const handleOpenCreateSavings = (student: Santri) => {
    setEditStudentId(student.id);
    setNis(student.nis);
    setName(student.name);
    setClassName(student.className);
    setDorm(student.dorm || '');
    setGuardianPhone(student.guardianPhone || '');
    setSavingsStatus(true);
    setFormError('');
    setShowEditModal(true);
  };

  const handleDeleteSavingsClick = (studentId: string) => {
    const bal = calculateBalances(studentId, transactions);
    if (bal.total > 0) {
      setDeleteConfirmWithBalanceId(studentId);
    } else {
      setDeleteConfirmId(studentId);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!editStudentId || !nis || !name || !className || !dorm) {
      setFormError('Mohon lengkapi seluruh field wajib!');
      return;
    }
    if (nis.length !== 8 || !/^\d{8}$/.test(nis)) {
      setFormError('NIS wajib berisi 8 digit angka!');
      return;
    }

    // Find original student to preserve their status
    const orig = students.find(s => s.id === editStudentId);
    onEditStudent({
      id: editStudentId,
      nis,
      name,
      className,
      dorm,
      guardianPhone,
      status: orig ? orig.status : 'Aktif',
      hasSavings: true, // we are saving, so tabungan is created/active
      savingsActive: savingsStatus
    });
    setShowEditModal(false);
  };

  // Filter logic
  const classesList = institutionClasses.length > 0 ? institutionClasses : Array.from(new Set(students.map(s => s.className)));
  const dormsList = Array.from(new Set(students.map(s => s.dorm).filter(Boolean)));

  const filteredStudents = students.filter(student => {
    const matchesSavings = true; // Show all students to allow activation/deactivation of savings on the savings page
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nis.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesClass = filterClass === 'Semua' || student.className === filterClass;
    const matchesStatus = filterStatus === 'Semua' || student.status === filterStatus;
    const matchesDorm = filterDorm === 'Semua' || student.dorm === filterDorm;
    
    return matchesSavings && matchesSearch && matchesClass && matchesStatus && matchesDorm;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const [showAddSavingsModal, setShowAddSavingsModal] = useState(false);

  // Sorting
  if (sortConfig) {
    filteredStudents.sort((a, b) => {
      const balA = calculateBalances(a.id, transactions);
      const balB = calculateBalances(b.id, transactions);
      
      let valA: any = a[sortConfig.key as keyof Santri];
      let valB: any = b[sortConfig.key as keyof Santri];
      
      if (sortConfig.key === 'tabungan') {
        valA = balA.tabungan;
        valB = balB.tabungan;
      } else if (sortConfig.key === 'penitipan') {
        valA = balA.penitipan;
        valB = balB.penitipan;
      } else if (sortConfig.key === 'total') {
        valA = balA.total;
        valB = balB.total;
      }
      
      if (valA === undefined) return 1;
      if (valB === undefined) return -1;
      
      if (typeof valA === 'string') {
        return sortConfig.direction === 'asc' 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortConfig.direction === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      }
    });
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredStudents.map(s => {
      const bal = calculateBalances(s.id, transactions);
      return {
        'NIS': s.nis,
        'Nama Lengkap': s.name,
        'Kelas': s.className,
        'Asrama': s.dorm || '-',
        'Saldo Tabungan': bal.tabungan,
        'Saldo Penitipan': bal.penitipan,
        'Total Saldo': bal.total,
        'Status': s.status
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Tabungan Santri');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `Data_Tabungan_Santri_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSendWaMessage = (student: Santri) => {
    const bal = calculateBalances(student.id, transactions);
    const template = institution.waTemplateBalanceSummary || `*E-SANGU SANTRI*\nSistem Tabungan dan Penitipan Uang Santri\n{NAMA PONDOK}\n\n*RINGKASAN INFROMASI SALDO*\n\n*NIS :* {NIS}\n*Nama :* {NAMA}\n*Kelas :* {KELAS}\n\n*Saldo Tabungan :* {Saldo Tabungan}\n*Saldo Penitipan :* {Saldo Penitipan}\n\n*TOTAL SALDO* : {TOTAL SALDO}\n______________________\n> Dibuat otomatis oleh Sistem E-Sangu Santri`;
    
    const text = template
      .replace(/{NAMA PONDOK}/g, institution.name)
      .replace(/{NAMA}/g, student.name)
      .replace(/{KELAS}/g, student.className)
      .replace(/{ASRAMA}/g, student.dorm || '-')
      .replace(/{NIS}/g, student.nis)
      .replace(/{Saldo Tabungan}/g, formatCurrency(bal.tabungan))
      .replace(/{Saldo Penitipan}/g, formatCurrency(bal.penitipan))
      .replace(/{WEBSITE}/g, window.location.origin)
      .replace(/{NAMA WEBSITE}/g, window.location.origin)
      .replace(/{TOTAL SALDO}/g, formatCurrency(bal.total));
    
    const cleanPhone = student.guardianPhone.replace(/\D/g, '');
    let waNumber = cleanPhone;
    if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.slice(1);
    } else if (waNumber.startsWith('8')) {
      waNumber = '62' + waNumber;
    }
    
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    window.open(waLink, '_blank');
  };

  const handleOpenPrintModal = (studentId: string) => {
    setSelectedStudentId(studentId);
    setPrintTab('Tabungan');
    setShowPrintModal(true);
  };

  const activePrintStudent = students.find(s => s.id === selectedStudentId);
  const activePrintBalances = selectedStudentId ? calculateBalances(selectedStudentId, transactions) : { tabungan: 0, penitipan: 0, total: 0 };

  const nonSavingsStudents = students.filter(s => !s.hasSavings);

  const getMutasiTxs = (accountId: string, accType: string) => {
    const txs = transactions.filter(t => t.santriId === accountId && t.accountType === accType)
      .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let balance = 0;
    return txs.map(tx => {
      if (tx.type === 'Setor') balance += tx.amount;
      else balance -= tx.amount;
      return { ...tx, currentBalance: balance };
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-xl font-black text-emerald-950 tracking-tight uppercase flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            DATA TABUNGAN
          </h2>
          <p className="text-xs text-gray-500 mt-1">Pantau dan kelola saldo tabungan/penitipan serta cetak buku tabungan fisik santri.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Ekspor Excel
          </button>
          <button
            onClick={() => setShowAddSavingsModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-xl transition shadow-lg shadow-emerald-950/20 border-none cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Buka Tabungan Baru
          </button>
        </div>
      </div>

      {/* Bulk Actions Header */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-950 text-white p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-lg tracking-widest">{selectedIds.length} Terpilih</span>
            <p className="text-xs font-bold opacity-80 hidden sm:block">Aksi untuk tabungan yang Anda pilih:</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsBulkDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition border-none cursor-pointer text-white"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Massal
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition border-none cursor-pointer text-white"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Bulk Deactivation Confirmation */}
      {isBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-emerald-100 shadow-2xl space-y-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Hapus Tabungan Massal</h3>
              <p className="text-xs text-gray-500 font-bold">
                Apakah Anda yakin ingin menghapus {selectedIds.length} akun tabungan yang dipilih? Data saldo tetap aman namun tidak akan muncul di daftar ini.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsBulkDeleteConfirm(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition border-none cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (onBulkDeactivateSavings) {
                    onBulkDeactivateSavings(selectedIds);
                  } else {
                    selectedIds.forEach(id => onDeactivateSavings(id));
                  }
                  setSelectedIds([]);
                  setIsBulkDeleteConfirm(false);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-red-900/10 border-none cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm flex flex-row items-center gap-2 overflow-x-auto">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Nama atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
          />
        </div>
        
        <div className="w-32 shrink-0 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-200 focus:border-emerald-500 appearance-none cursor-pointer transition-all text-slate-700"
          >
            <option value="Semua">Semua Kelas</option>
            {classesList.map((cls, idx) => (
              <option key={idx} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div className="w-32 shrink-0 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={filterDorm}
            onChange={(e) => setFilterDorm(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-200 focus:border-emerald-500 appearance-none cursor-pointer transition-all text-slate-700"
          >
            <option value="Semua">Semua Asrama</option>
            {dormsList.map((drm, idx) => (
              <option key={idx} value={drm}>{drm}</option>
            ))}
          </select>
        </div>

        <div className="w-32 shrink-0 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-200 focus:border-emerald-500 appearance-none cursor-pointer transition-all text-slate-700"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>

        <div className="w-8 shrink-0">
          <button 
            onClick={() => { setSearchQuery(''); setFilterClass('Semua'); setFilterStatus('Semua'); setFilterDorm('Semua'); }}
            className="w-full py-1.5 flex items-center justify-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all border-none cursor-pointer"
            title="Reset Filter"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Panel */}
      <div className="bg-white rounded-[24px] border border-emerald-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50 text-[10px] font-black text-emerald-900 uppercase tracking-widest border-b border-emerald-100">
                <th className="px-5 py-4 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-5 py-4 cursor-pointer hover:bg-emerald-100 transition" onClick={() => setSortConfig({ key: 'nis', direction: sortConfig?.key === 'nis' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center gap-1">NIS {sortConfig?.key === 'nis' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="px-5 py-4 min-w-[180px] w-48 cursor-pointer hover:bg-emerald-100 transition" onClick={() => setSortConfig({ key: 'name', direction: sortConfig?.key === 'name' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center gap-1">NAMA {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:bg-emerald-100 transition" onClick={() => setSortConfig({ key: 'className', direction: sortConfig?.key === 'className' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center gap-1">KELAS {sortConfig?.key === 'className' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:bg-emerald-100 transition" onClick={() => setSortConfig({ key: 'hasSavings', direction: sortConfig?.key === 'hasSavings' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center gap-1">STATUS TABUNGAN {sortConfig?.key === 'hasSavings' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="px-5 py-4 text-right cursor-pointer hover:bg-emerald-100 transition" onClick={() => setSortConfig({ key: 'tabungan', direction: sortConfig?.key === 'tabungan' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center justify-end gap-1">SALDO TABUNGAN {sortConfig?.key === 'tabungan' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="px-5 py-4 text-right cursor-pointer hover:bg-emerald-100 transition" onClick={() => setSortConfig({ key: 'penitipan', direction: sortConfig?.key === 'penitipan' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center justify-end gap-1">SALDO PENITIPAN {sortConfig?.key === 'penitipan' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="px-5 py-4 text-right cursor-pointer hover:bg-emerald-100 transition" onClick={() => setSortConfig({ key: 'total', direction: sortConfig?.key === 'total' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center justify-end gap-1">TOTAL SALDO {sortConfig?.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="px-5 py-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-xs animate-in fade-in slide-in-from-bottom-2 duration-500">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const bal = calculateBalances(student.id, transactions);
                  const isSelected = selectedIds.includes(student.id);
                  return (
                    <tr key={student.id} className={`transition-colors ${isSelected ? 'bg-emerald-50/80' : 'hover:bg-emerald-50/20'}`}>
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleSelectOne(student.id)}
                        />
                      </td>
                      <td className="px-5 py-4 font-black font-mono text-emerald-950">{student.nis}</td>
                      <td className="px-5 py-4 font-black text-gray-900 text-sm">{student.name}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[9px] uppercase tracking-wider inline-block">
                          {student.className}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider inline-block text-center ${
                          !student.hasSavings ? 'bg-gray-100 text-gray-500' : 
                          student.savingsActive !== false ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {!student.hasSavings ? 'Belum Dibuat' : (student.savingsActive !== false ? 'Aktif' : 'Tidak Aktif')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-black text-teal-800 font-mono">{formatCurrency(bal.tabungan)}</td>
                      <td className="px-5 py-4 text-right font-black text-emerald-700 font-mono">{formatCurrency(bal.penitipan)}</td>
                      <td className="px-5 py-4 text-right font-black text-emerald-950 font-mono bg-emerald-50/40">{formatCurrency(bal.total)}</td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!student.hasSavings ? (
                            <button
                              onClick={() => onActivateSavings(student.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition border-none cursor-pointer"
                            >
                              Buat Tabungan
                            </button>
                          ) : (
                            <>
                              {student.guardianPhone && student.guardianPhone !== '-' && (
                                <button
                                  onClick={() => handleSendWaMessage(student)}
                                  title="Kirim Pesan Informasi Saldo"
                                  className="p-2 text-green-600 hover:bg-green-100 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenPrintModal(student.id)}
                                title="Lihat Buku Tabungan"
                                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                              >
                                <BookOpen className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(student)}
                                title="Edit Tabungan"
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSavingsClick(student.id)}
                                title="Hapus Tabungan"
                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer border-none bg-transparent flex items-center gap-1.5"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-gray-400">
                    Tidak ditemukan data santri dengan filter pencarian tersebut.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Generatif section removed - now a standalone menu item */}

      {/* DETAILED PRINT MODAL WITH SLIDER / SWITCHER PANEL */}
      {showPrintModal && activePrintStudent && (
        <div className="fixed inset-0 bg-emerald-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-5xl p-6 border border-emerald-100 shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase tracking-widest inline-block">Cetak Buku Santri</span>
                <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">{activePrintStudent.name}</h3>
                <p className="text-[10px] text-gray-500 font-bold font-mono">NIS: {activePrintStudent.nis} • Kelas: {activePrintStudent.className}</p>
              </div>
              <button 
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 rounded-full transition cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Selector (Sliding Tab Layout) */}
            <div className="bg-gray-100 p-1 rounded-xl flex relative gap-1">
              <button
                onClick={() => setPrintTab('Tabungan')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${
                  printTab === 'Tabungan' 
                    ? 'bg-white text-emerald-950 shadow-sm font-black' 
                    : 'text-gray-500 hover:text-gray-900 font-bold'
                }`}
              >
                Buku Tabungan
              </button>
              <button
                onClick={() => setPrintTab('Penitipan')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${
                  printTab === 'Penitipan' 
                    ? 'bg-white text-emerald-950 shadow-sm font-black' 
                    : 'text-gray-500 hover:text-gray-900 font-bold'
                }`}
              >
                Buku Penitipan
              </button>
            </div>

            {/* Slider Content Panel */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-emerald-100/40 relative overflow-hidden flex flex-col justify-between">
              {printTab === 'Tabungan' ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest">Akun Tabungan</span>
                    <span className="text-xs font-black text-teal-900 font-mono bg-teal-100/50 px-2.5 py-1 rounded-lg">{formatCurrency(activePrintBalances.tabungan)}</span>
                  </div>
                  
                  <div className="overflow-y-auto max-h-[250px] bg-white rounded-xl border border-teal-100/50 shadow-sm">
                    <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                      <thead className="sticky top-0 bg-teal-50 shadow-sm z-10">
                        <tr className="text-[9px] font-black text-teal-900 uppercase tracking-widest">
                          <th className="px-4 py-2">ID Transaksi</th>
                          <th className="px-4 py-2">Tanggal & Waktu</th>
                          <th className="px-4 py-2 text-right">Kredit</th>
                          <th className="px-4 py-2 text-right">Debit</th>
                          <th className="px-4 py-2 text-right">Saldo</th>
                          <th className="px-4 py-2">Admin / Petugas</th>
                          <th className="px-4 py-2">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-50 font-bold">
                        {getMutasiTxs(activePrintStudent.id, 'Tabungan').length > 0 ? (
                          getMutasiTxs(activePrintStudent.id, 'Tabungan').map((tx) => (
                            <tr key={tx.id} className="hover:bg-teal-50/20">
                              <td className="px-4 py-2 text-[10px] font-mono text-teal-900">{formatTxId(tx.id, transactions)}</td>
                              <td className="px-4 py-2 text-[9px] font-mono text-gray-500">{new Date(tx.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                              <td className="px-4 py-2 text-right text-emerald-600 font-mono">{tx.type === 'Setor' ? formatCurrency(tx.amount) : '-'}</td>
                              <td className="px-4 py-2 text-right text-rose-600 font-mono">{tx.type === 'Tarik' ? formatCurrency(tx.amount) : '-'}</td>
                              <td className="px-4 py-2 text-right text-teal-950 font-mono">{formatCurrency(tx.currentBalance)}</td>
                              <td className="px-4 py-2 text-[10px] text-gray-600">{tx.cashierName}</td>
                              <td className="px-4 py-2 text-[10px] text-gray-600">
                                <div className="font-bold text-teal-950">{tx.note || '-'}</div>
                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                    tx.paymentMethod === 'Transfer'
                                      ? 'bg-blue-50 text-blue-700 border-blue-150'
                                      : 'bg-amber-50 text-amber-700 border-amber-150'
                                  }`}>
                                    {tx.paymentMethod || 'Tunai'}
                                  </span>
                                  {tx.paymentMethod === 'Transfer' && tx.bankName && (
                                    <span className="text-[8px] font-extrabold text-teal-700/70 uppercase font-mono bg-teal-50/50 border border-teal-100 px-1 py-0.5 rounded">
                                      {tx.bankName}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 font-bold italic text-[10px]">Belum ada riwayat mutasi tabungan</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={() => printPassbook(activePrintStudent, transactions, institution, 'Tabungan')}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-md shadow-teal-900/10 flex items-center justify-center gap-2 cursor-pointer border-none"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak Buku Tabungan
                  </button>

                  {/* Riwayat Pengajuan Setor Tabungan */}
                  <div className="mt-5 space-y-3 pt-4 border-t border-teal-100/40 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest font-sans">Riwayat Pengajuan Setor Tabungan</span>
                    </div>

                    <div className="overflow-x-auto border border-teal-100/40 rounded-2xl bg-white shadow-inner max-h-[160px]">
                      <table className="w-full border-collapse text-left text-xs text-gray-500">
                        <thead className="bg-teal-50 text-teal-950 font-bold text-[9px] uppercase tracking-wider sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2 border-b border-teal-100">Tanggal Pengajuan</th>
                            <th className="px-3 py-2 border-b border-teal-100 text-right">Nominal</th>
                            <th className="px-3 py-2 border-b border-teal-100">Bukti</th>
                            <th className="px-3 py-2 border-b border-teal-100">Status</th>
                            <th className="px-3 py-2 border-b border-teal-100">Keterangan</th>
                            <th className="px-3 py-2 border-b border-teal-100 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-semibold">
                          {(() => {
                            const studentRegs = registrations.filter(r => r.santriId === activePrintStudent.id && (r.accountType === 'Tabungan' || !r.accountType));
                            if (studentRegs.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="px-3 py-5 text-center text-gray-400 font-bold italic text-[9px]">
                                    Belum ada riwayat pengajuan setor tabungan
                                  </td>
                                </tr>
                              );
                            }
                            return studentRegs.map((reg) => (
                              <tr key={reg.id} className="hover:bg-gray-50 transition">
                                <td className="px-3 py-2 font-bold text-teal-950 text-[10px]">
                                  {new Date(reg.timestamp).toLocaleString('id-ID', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })}
                                </td>
                                <td className="px-3 py-2 font-bold text-teal-950 text-right font-mono text-[10px]">
                                  {formatCurrency(reg.amount || 0)}
                                </td>
                                <td className="px-3 py-2">
                                  {reg.transferReceiptUrl ? (
                                    <a 
                                      href={reg.transferReceiptUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-[9px] font-black uppercase text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded transition border border-teal-150 inline-block"
                                    >
                                      Lihat Bukti
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 italic">Tidak ada</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                    reg.status === 'Confirmed'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                                      : reg.status === 'Rejected'
                                      ? 'bg-red-50 text-red-700 border-red-150'
                                      : 'bg-amber-50 text-amber-700 border-amber-150 animate-pulse'
                                  }`}>
                                    {reg.status === 'Confirmed' ? 'Disetujui' : reg.status === 'Rejected' ? 'Ditolak' : 'Menunggu'}
                                  </span>
                                  {reg.status === 'Rejected' && reg.rejectionReason && (
                                    <p className="text-[9px] text-red-500 font-semibold mt-1 font-sans">Alasan: {reg.rejectionReason}</p>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-[10px] font-semibold text-gray-600 max-w-[120px] truncate" title={reg.note}>
                                  {reg.note || '-'}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Apakah Anda yakin ingin menghapus riwayat pengajuan ini secara permanen?')) {
                                        if (onDeleteRegistration) {
                                          onDeleteRegistration(reg.id);
                                        }
                                      }
                                    }}
                                    className="p-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition border border-red-100 cursor-pointer inline-flex items-center justify-center"
                                    title="Hapus Riwayat"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">AKUN PENITIPAN</span>
                    <span className="text-xs font-black text-emerald-900 font-mono bg-emerald-100/60 px-2.5 py-1 rounded-lg">{formatCurrency(activePrintBalances.penitipan)}</span>
                  </div>

                  <div className="overflow-y-auto max-h-[250px] bg-white rounded-xl border border-emerald-100/50 shadow-sm">
                    <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                      <thead className="sticky top-0 bg-emerald-50 shadow-sm z-10">
                        <tr className="text-[9px] font-black text-emerald-900 uppercase tracking-widest">
                          <th className="px-4 py-2">ID Transaksi</th>
                          <th className="px-4 py-2">Tanggal & Waktu</th>
                          <th className="px-4 py-2 text-right">Kredit</th>
                          <th className="px-4 py-2 text-right">Debit</th>
                          <th className="px-4 py-2 text-right">Saldo</th>
                          <th className="px-4 py-2">Admin / Petugas</th>
                          <th className="px-4 py-2">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50 font-bold">
                        {getMutasiTxs(activePrintStudent.id, 'Penitipan').length > 0 ? (
                          getMutasiTxs(activePrintStudent.id, 'Penitipan').map((tx) => (
                            <tr key={tx.id} className="hover:bg-emerald-50/20">
                              <td className="px-4 py-2 text-[10px] font-mono text-emerald-900">{formatTxId(tx.id, transactions)}</td>
                              <td className="px-4 py-2 text-[9px] font-mono text-gray-500">{new Date(tx.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                              <td className="px-4 py-2 text-right text-emerald-600 font-mono">{tx.type === 'Setor' ? formatCurrency(tx.amount) : '-'}</td>
                              <td className="px-4 py-2 text-right text-rose-600 font-mono">{tx.type === 'Tarik' ? formatCurrency(tx.amount) : '-'}</td>
                              <td className="px-4 py-2 text-right text-emerald-950 font-mono">{formatCurrency(tx.currentBalance)}</td>
                              <td className="px-4 py-2 text-[10px] text-gray-600">{tx.cashierName}</td>
                              <td className="px-4 py-2 text-[10px] text-gray-600">
                                <div className="font-bold text-emerald-950">{tx.note || '-'}</div>
                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                    tx.paymentMethod === 'Transfer'
                                      ? 'bg-blue-50 text-blue-700 border-blue-150'
                                      : 'bg-amber-50 text-amber-700 border-amber-150'
                                  }`}>
                                    {tx.paymentMethod || 'Tunai'}
                                  </span>
                                  {tx.paymentMethod === 'Transfer' && tx.bankName && (
                                    <span className="text-[8px] font-extrabold text-emerald-700/70 uppercase font-mono bg-emerald-50/50 border border-emerald-100 px-1 py-0.5 rounded">
                                      {tx.bankName}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 font-bold italic text-[10px]">Belum ada riwayat mutasi penitipan</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={() => printPassbook(activePrintStudent, transactions, institution, 'Penitipan')}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 cursor-pointer border-none"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak Buku Penitipan
                  </button>

                  {/* Riwayat Pengajuan Setor Penitipan */}
                  <div className="mt-5 space-y-3 pt-4 border-t border-emerald-100/40 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest font-sans">Riwayat Pengajuan Setor Penitipan</span>
                    </div>

                    <div className="overflow-x-auto border border-emerald-100/40 rounded-2xl bg-white shadow-inner max-h-[160px]">
                      <table className="w-full border-collapse text-left text-xs text-gray-500">
                        <thead className="bg-emerald-50 text-emerald-950 font-bold text-[9px] uppercase tracking-wider sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2 border-b border-emerald-100">Tanggal Pengajuan</th>
                            <th className="px-3 py-2 border-b border-emerald-100 text-right">Nominal</th>
                            <th className="px-3 py-2 border-b border-emerald-100">Bukti</th>
                            <th className="px-3 py-2 border-b border-emerald-100">Status</th>
                            <th className="px-3 py-2 border-b border-emerald-100">Keterangan</th>
                            <th className="px-3 py-2 border-b border-emerald-100 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-semibold">
                          {(() => {
                            const studentRegs = registrations.filter(r => r.santriId === activePrintStudent.id && r.accountType === 'Penitipan');
                            if (studentRegs.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="px-3 py-5 text-center text-gray-400 font-bold italic text-[9px]">
                                    Belum ada riwayat pengajuan setor penitipan
                                  </td>
                                </tr>
                              );
                            }
                            return studentRegs.map((reg) => (
                              <tr key={reg.id} className="hover:bg-gray-50 transition">
                                <td className="px-3 py-2 font-bold text-emerald-950 text-[10px]">
                                  {new Date(reg.timestamp).toLocaleString('id-ID', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })}
                                </td>
                                <td className="px-3 py-2 font-bold text-emerald-950 text-right font-mono text-[10px]">
                                  {formatCurrency(reg.amount || 0)}
                                </td>
                                <td className="px-3 py-2">
                                  {reg.transferReceiptUrl ? (
                                    <a 
                                      href={reg.transferReceiptUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-[9px] font-black uppercase text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded transition border border-teal-150 inline-block"
                                    >
                                      Lihat Bukti
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 italic">Tidak ada</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                    reg.status === 'Confirmed'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                                      : reg.status === 'Rejected'
                                      ? 'bg-red-50 text-red-700 border-red-150'
                                      : 'bg-amber-50 text-amber-700 border-amber-150 animate-pulse'
                                  }`}>
                                    {reg.status === 'Confirmed' ? 'Disetujui' : reg.status === 'Rejected' ? 'Ditolak' : 'Menunggu'}
                                  </span>
                                  {reg.status === 'Rejected' && reg.rejectionReason && (
                                    <p className="text-[9px] text-red-500 font-semibold mt-1 font-sans">Alasan: {reg.rejectionReason}</p>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-[10px] font-semibold text-gray-600 max-w-[120px] truncate" title={reg.note}>
                                  {reg.note || '-'}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Apakah Anda yakin ingin menghapus riwayat pengajuan ini secara permanen?')) {
                                        if (onDeleteRegistration) {
                                          onDeleteRegistration(reg.id);
                                        }
                                      }
                                    }}
                                    className="p-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition border border-red-100 cursor-pointer inline-flex items-center justify-center"
                                    title="Hapus Riwayat"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-[10px] text-gray-400 font-medium text-center italic">
              *Pastikan printer slip/passbook Anda menyala dan terhubung ke sistem.
            </p>
          </div>
        </div>
      )}

      {/* ADD SAVINGS MODAL */}
      {showAddSavingsModal && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden border border-emerald-100 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-emerald-800 p-6 text-white flex justify-between items-center">
              <h3 className="font-black text-lg tracking-tight uppercase">Buka Tabungan Baru</h3>
              <button onClick={() => setShowAddSavingsModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition border-none cursor-pointer">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-gray-500 font-bold leading-relaxed mb-4">
                Pilih santri yang belum memiliki akun tabungan untuk mengaktifkan fasilitas E-Sangu.
              </p>
              
              {nonSavingsStudents.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300 mx-auto">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-400">Semua santri sudah memiliki tabungan.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {nonSavingsStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => {
                        onActivateSavings(student.id);
                        setShowAddSavingsModal(false);
                      }}
                      className="w-full p-4 flex items-center justify-between bg-emerald-50/50 hover:bg-emerald-100/50 border border-emerald-100 rounded-2xl transition group text-left cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-black text-emerald-950 uppercase tracking-tight group-hover:text-emerald-700">{student.name}</p>
                        <p className="text-[10px] font-bold text-emerald-600/70">{student.nis} • {student.className}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setShowAddSavingsModal(false)}
                className="w-full py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition cursor-pointer border-none bg-transparent"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL (NO BALANCE) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Hapus Akun Tabungan</h3>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                Apakah Anda yakin ingin menghapus akun tabungan santri ini? Data profil santri tetap ada, namun akses tabungan akan dihapus.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmId) {
                    onDeactivateSavings(deleteConfirmId);
                  }
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-red-900/10 cursor-pointer border-none"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL (WITH BALANCE) */}
      {deleteConfirmWithBalanceId && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Hapus Tabungan Gagal</h3>
              <p className="text-xs text-gray-600 font-bold leading-relaxed">
                Santri ini masih memiliki sisa saldo. Mohon tarik semua saldo santri sebelum menghapus data tabungan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeleteConfirmWithBalanceId(null)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
            >
              Kembali
            </button>
          </div>
        </div>
      )}

      {/* Modal: EDIT STUDENT/SAVINGS (MODERNIZED) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl border border-emerald-100 max-w-lg w-full overflow-hidden">
            <div className="bg-emerald-800 text-white p-6 flex justify-between items-center border-b border-emerald-700">
              <h3 className="font-black text-lg tracking-tight uppercase">DATA AKUN & TABUNGAN SANTRI</h3>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition border-none cursor-pointer">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-8 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {formError}
                </div>
              )}
              {/* Row 1: NIS (1 kolom) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">NIS*</label>
                  <input
                    type="text" required value={nis} onChange={(e) => setNis(e.target.value)}
                    className="w-full px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 transition"
                  />
                </div>
                <div className="space-y-1.5" />
              </div>

              {/* Row 2: NAMA (1 kolom panjang) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Nama Lengkap Santri*</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 transition"
                />
              </div>

              {/* Row 3: KELAS, ASRAMA (2 kolom dropdown) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Pilih Kelas*</label>
                  <select
                    value={className} onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    {classesList.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Asrama*</label>
                  <select
                    value={dorm} onChange={(e) => setDorm(e.target.value)}
                    className="w-full px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    {['Yunusiyah', 'Ar Ridho 1', 'Ar Ridho 2', 'Ar Ridho 3', 'Al Badriyah'].map((drm) => (
                      <option key={drm} value={drm}>{drm}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: NO WHATSAPP WALI (1 kolom panjang) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">No. Kontak WhatsApp Wali (Opsional)</label>
                <input
                  type="text" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 transition"
                />
              </div>

              {/* Row 5: STATUS TABUNGAN */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1 mb-2">STATUS TABUNGAN</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSavingsStatus(!savingsStatus)}
                    className={`relative w-12 h-6.5 rounded-full transition-colors duration-300 ease-in-out focus:outline-none border-none cursor-pointer ${savingsStatus ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute left-0.5 top-0.5 w-5.5 h-5.5 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${savingsStatus ? 'translate-x-5.5' : 'translate-x-0'}`} />
                  </button>
                  <span className={`text-xs font-black uppercase tracking-wider ${savingsStatus ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {savingsStatus ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-2xl transition border-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-2xl shadow-xl shadow-emerald-900/20 transition active:scale-95 border-none cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
