import React, { useState } from 'react';
import { Santri, Transaction, InstitutionSettings, FinancialSettings, PendingRegistration } from '../types';
import { calculateBalances } from '../data/mockData';
import { printPassbook, formatTxId } from '../lib/printHelper';
import { playSuccessSound, playErrorSound } from '../lib/soundHelper';
import { LogIn, KeyRound, Phone, CheckCircle2, Lock, Unlock, ArrowDownCircle, ArrowUpCircle, Printer, Calendar, Search, Info, UserPlus, MessageSquare, X, CheckCircle, Shield, BookOpen, Activity, TrendingUp, Sparkles, LogOut, User, Camera, QrCode, AlertCircle, PlusCircle, Upload, Image as ImageIcon, Clock, ChevronRight, Eye } from 'lucide-react';
import { AllocationPieChart } from './VisualCharts';
import { QrScannerModal } from './QrScannerModal';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface GuardianPortalProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  financial: FinancialSettings;
  onAdminLoginClick: () => void; // Callback to trigger admin login view in parent
  onRegister?: (reg: Omit<PendingRegistration, 'id' | 'timestamp' | 'status'>) => void;
  registrations?: PendingRegistration[];
}

export default function GuardianPortal({
  students,
  transactions,
  institution,
  financial,
  onAdminLoginClick,
  onRegister,
  registrations = []
}: GuardianPortalProps) {
  // View state: 'portal' (default), 'register', or 'logged_in' (handled by loggedInStudent)
  const [view, setView] = useState<'portal' | 'register'>('portal');

  // Modal states for registration tracking
  const [showRegStatusModal, setShowRegStatusModal] = useState(false);
  const [regSearchQuery, setRegSearchQuery] = useState('');

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regClass, setRegClass] = useState('');
  const [regDorm, setRegDorm] = useState('');
  const [regGuardianPhone, setRegGuardianPhone] = useState('');
  const [showRegAgreement, setShowRegAgreement] = useState(false);

  // Search and selection states
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [nisInput, setNisInput] = useState('');
  const [loggedInStudent, setLoggedInStudent] = useState<Santri | null>(null);
  const [transitioningStudent, setTransitioningStudent] = useState<Santri | null>(null);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  // Filter states
  const [filterType, setFilterType] = useState<'Semua' | 'Setor' | 'Tarik'>('Semua');
  const [filterPos, setFilterPos] = useState<'Semua' | 'Tabungan' | 'Penitipan'>('Semua');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // Passbook modal state
  const [showPassbookModal, setShowPassbookModal] = useState(false);
  const [passbookTab, setPassbookTab] = useState<'Tabungan' | 'Penitipan'>('Tabungan');

  // Deposit Application states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAccountType, setDepositAccountType] = useState<'Tabungan' | 'Penitipan'>('Tabungan');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositReceipt, setDepositReceipt] = useState<string>('');
  const [depositNote, setDepositNote] = useState<string>('');

  // Status check modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatusReceiptUrl, setSelectedStatusReceiptUrl] = useState<string>('');

  // Available classes derived from settings or student list
  const classesList = institution.classes && institution.classes.length > 0
    ? institution.classes
    : Array.from(new Set(students.map(s => s.className)));

  // Auto-initialize dropdowns
  React.useEffect(() => {
    if (classesList.length > 0) {
      if (!selectedClass) setSelectedClass(classesList[0]);
      if (!regClass) setRegClass(classesList[0]);
    }
  }, [classesList]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value);
    setSelectedStudentId('');
  };

  const classStudents = students.filter(s => s.className === selectedClass);

  const handleVerifyAndCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) {
      alert('Silakan pilih kelas terlebih dahulu!');
      return;
    }
    if (!selectedStudentId) {
      alert('Silakan pilih nama santri!');
      return;
    }
    if (!nisInput) {
      alert('Silakan masukkan Nomor Induk Santri (NIS)!');
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      setErrorModal({
        isOpen: true,
        title: 'Data Tidak Ditemukan',
        message: 'Data santri yang Anda pilih tidak ditemukan di sistem.'
      });
      return;
    }

    if (student.nis.trim() === nisInput.trim()) {
      setTransitioningStudent(student);
      setTimeout(() => {
        setLoggedInStudent(student);
        setTransitioningStudent(null);
      }, 1500);
    } else {
      setErrorModal({
        isOpen: true,
        title: 'Nomor Induk Salah',
        message: `Nomor Induk Santri (NIS) "${nisInput}" yang Anda masukkan tidak sesuai dengan santri bernama "${student.name.toUpperCase()}". Silakan periksa kembali kartu tabungan Anda.`
      });
    }
  };

  const handleQrScanSuccess = (scannedNis: string) => {
    setIsQrScannerOpen(false);
    if (!scannedNis) return;
    
    const student = students.find(s => s.nis.trim() === scannedNis.trim());
    if (!student) {
      playErrorSound();
      setErrorModal({
        isOpen: true,
        title: 'QR Code Tidak Dikenal',
        message: `Nomor Induk Santri (NIS) "${scannedNis}" dari scan QR Code tidak ditemukan dalam database atau belum terdaftar.`
      });
      return;
    }
    
    playSuccessSound();
    setTransitioningStudent(student);
    setTimeout(() => {
      setLoggedInStudent(student);
      setTransitioningStudent(null);
    }, 1500);
  };

  const handlePrintPassbook = (type: 'Tabungan' | 'Penitipan') => {
    if (!loggedInStudent) return;
    printPassbook(loggedInStudent, transactions, institution, type);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowRegAgreement(true);
  };

  const confirmRegistration = () => {
    setShowRegAgreement(false);
    if (onRegister) {
      onRegister({
        name: regName,
        className: regClass,
        dorm: regDorm,
        guardianPhone: regGuardianPhone
      });
      alert("Pendaftaran Anda telah dikirim. Silakan hubungi pengurus/bendahara untuk konfirmasi pembukaan rekening tabungan.");
      setRegName('');
      setRegClass('');
      setRegDorm('');
      setRegGuardianPhone('');
      setView('portal');
    } else {
      alert("Pendaftaran Anda telah dikirim. Silakan hubungi pengurus/bendahara untuk konfirmasi pembukaan rekening tabungan.");
      setRegName('');
      setRegClass('');
      setRegDorm('');
      setRegGuardianPhone('');
      setView('portal');
    }
  };

  const handleDepositFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Ukuran gambar terlalu besar! Maksimal adalah 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
            setDepositReceipt(compressedDataUrl);
          } else {
            setDepositReceipt(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInStudent) return;
    if (loggedInStudent.status === 'Nonaktif' || loggedInStudent.savingsActive === false) {
      alert("Gagal: Pengajuan penyetoran dana tidak dapat dikirim karena status akun tabungan Anda tidak aktif.");
      return;
    }
    if (depositAmount <= 0) {
      alert("Masukkan nominal penyetoran yang valid!");
      return;
    }
    if (!depositReceipt) {
      alert("Silakan unggah foto bukti transfer terlebih dahulu!");
      return;
    }

    if (onRegister) {
      onRegister({
        type: 'Setor Dana',
        name: loggedInStudent.name,
        className: loggedInStudent.className,
        dorm: loggedInStudent.dorm,
        guardianPhone: loggedInStudent.guardianPhone || '-',
        santriId: loggedInStudent.id,
        accountType: depositAccountType,
        amount: depositAmount,
        transferReceiptUrl: depositReceipt,
        note: depositNote,
      });

      playSuccessSound();
      alert("Pengajuan penyetoran dana berhasil dikirim! Silakan tunggu konfirmasi bendahara.");
      
      // Reset states
      setShowDepositModal(false);
      setDepositAmount(0);
      setDepositReceipt('');
      setDepositNote('');
    }
  };

  const handleLogout = () => {
    setLoggedInStudent(null);
    setNisInput('');
    setSelectedStudentId('');
    setView('portal');
  };

  // Compute student specific transactions & balances
  const studentTransactions = loggedInStudent 
    ? transactions.filter(t => t.santriId === loggedInStudent.id)
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  const studentBalances = loggedInStudent 
    ? calculateBalances(loggedInStudent.id, transactions)
    : { tabungan: 0, penitipan: 0, total: 0 };

  // Filtered transactions for the view table
  const filteredTransactions = studentTransactions.filter(tx => {
    const matchesType = filterType === 'Semua' || tx.type === filterType;
    const matchesPos = filterPos === 'Semua' || tx.accountType === filterPos;
    return matchesType && matchesPos;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

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
    <div className="w-full flex-1 flex flex-col justify-between font-sans bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 z-10 relative">
      
      {/* Top Banner Header */}
      <header className="bg-white/40 backdrop-blur-xl border-b border-emerald-100 shadow-sm text-emerald-950 relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white text-emerald-900 font-black flex items-center justify-center shadow-lg text-xl overflow-hidden shrink-0">
              {institution.logoUrl ? (
                <img src={institution.logoUrl} alt="Logo" className="w-full h-full object-cover bg-white" />
              ) : (
                'S'
              )}
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tighter uppercase leading-none">
                <span className="text-gray-900">E</span><span className="text-emerald-500 font-black">-</span><span className="text-gray-900">SANGU</span> <span className="text-emerald-500">SANTRI</span>
              </h1>
              <p className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-widest mt-0.5">{institution.name || 'PONDOK PESANTREN'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!loggedInStudent && (
              <button
                onClick={onAdminLoginClick}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-emerald-900/20 cursor-pointer flex items-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5 text-yellow-400" />
                Login Admin
              </button>
            )}
            {loggedInStudent && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/70 hover:bg-red-50 hover:text-red-700 text-red-600 font-bold text-xs rounded-xl transition border border-red-200 cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar Portal
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        
        {transitioningStudent ? (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50 animate-bounce">
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>
            <div className="space-y-3 text-center">
              <h2 className="text-4xl font-black text-emerald-950 text-center animate-pulse tracking-tight">
                Data Ditemukan!
              </h2>
              <p className="text-emerald-800 font-extrabold uppercase tracking-widest text-sm text-center">
                Mengalihkan ke Dashboard...
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur border border-emerald-100 px-8 py-4 rounded-2xl shadow-lg">
              <p className="font-black text-emerald-950 text-xl">{transitioningStudent.name}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mt-1">NIS: {transitioningStudent.nis}</p>
            </div>
          </div>
        ) : !loggedInStudent ? (
          view === 'portal' ? (
            <div className="space-y-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header branding & intro */}
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-emerald-950">Portal Cek Keuangan Santri</h2>
                <p className="text-xs text-emerald-900/70 font-black leading-relaxed max-w-lg mx-auto uppercase tracking-[0.1em]">
                  LAYANAN SISTEM TABUNGAN DAN PENITIPAN UANG SANTRI.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start max-w-4xl mx-auto">
                {/* Left Column: Unified Dropdown and NIS Checker Form */}
                <div className="md:col-span-7 bg-white/45 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-white/60 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-emerald-950/10">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold shadow-md">
                      <Search className="w-5 h-5 text-emerald-900" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-emerald-950 text-sm uppercase tracking-wide">Cek Keuangan Santri</h3>
                      <p className="text-[10px] text-emerald-900/60 font-bold">Verifikasi data santri secara akurat</p>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyAndCheck} className="space-y-5">
                    {/* Dropdown 1: Pilih Kelas */}
                    <div className="space-y-1.5">
                      <label className="block font-black text-emerald-950 text-[10px] uppercase tracking-widest">
                        PILIH KELAS
                      </label>
                      <div className="relative">
                        <select
                          value={selectedClass}
                          onChange={handleClassChange}
                          required
                          className="w-full p-4 bg-white/80 border-2 border-emerald-100 rounded-2xl text-xs font-black text-emerald-950 focus:outline-none focus:border-emerald-600 focus:bg-white appearance-none cursor-pointer transition-all"
                        >
                          <option value="" disabled>-- Pilih Kelas / Tingkatan --</option>
                          {classesList.map((cls) => (
                            <option key={cls} value={cls}>
                              {cls}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-5 top-5 pointer-events-none text-emerald-850">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Dropdown 2: Pilih Nama Santri */}
                    <div className="space-y-1.5">
                      <label className="block font-black text-emerald-950 text-[10px] uppercase tracking-widest">
                        PILIH NAMA SANTRI
                      </label>
                      <div className="relative">
                        <select
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                          required
                          disabled={!selectedClass}
                          className="w-full p-4 bg-white/80 border-2 border-emerald-100 rounded-2xl text-xs font-black text-emerald-950 focus:outline-none focus:border-emerald-600 focus:bg-white disabled:opacity-60 appearance-none cursor-pointer transition-all"
                        >
                          <option value="">
                            {selectedClass ? '-- Pilih Nama Santri --' : 'Silakan pilih kelas terlebih dahulu'}
                          </option>
                          {classStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-5 top-5 pointer-events-none text-emerald-850">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Input 3: NIS */}
                    <div className="space-y-1.5">
                      <label className="block font-black text-emerald-950 text-[10px] uppercase tracking-widest">
                        NIS (NOMOR INDUK SANTRI)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={8}
                        minLength={8}
                        pattern="\d*"
                        placeholder="8-Digit NIS"
                        value={nisInput}
                        onChange={(e) => setNisInput(e.target.value)}
                        className="w-full p-4 bg-white/80 border-2 border-emerald-100 rounded-2xl text-sm font-black tracking-[0.2em] text-emerald-950 focus:outline-none focus:border-emerald-600 focus:bg-white font-mono text-center transition-all"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black rounded-2xl text-sm shadow-xl hover:shadow-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer mt-4 uppercase tracking-widest border-none"
                    >
                      <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                      Cek Saldo
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsQrScannerOpen(true)}
                      className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black rounded-2xl text-sm shadow-xl hover:shadow-teal-900/30 transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer mt-3 uppercase tracking-widest border-none"
                    >
                      <QrCode className="w-5 h-5 text-emerald-300" />
                      Cek dengan QR Tabungan
                    </button>
                  </form>
                </div>

                {/* Right Column: Informative Board / Registration CTA */}
                <div className="md:col-span-5 space-y-6">
                  <div className="bg-white/45 backdrop-blur-xl rounded-[32px] p-6 border border-white/60 space-y-5 shadow-xl">
                    <div className="flex items-center gap-2 pb-3 border-b border-emerald-900/5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-emerald-950 text-xs">Informasi Pendaftaran</h3>
                        <p className="text-[10px] text-emerald-900/60 font-semibold">Bagi Santri Baru</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs text-emerald-950/80 leading-relaxed font-medium">
                        Jika santri tidak terdata, maka silahkan Daftar terlebih dahulu agar santri bisa mengakses tabungan.
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setView('register');
                            if (institution.classes && institution.classes.length > 0) setRegClass(institution.classes[0]);
                            if (institution.dorms && institution.dorms.length > 0) setRegDorm(institution.dorms[0]);
                          }}
                          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-black rounded-2xl text-xs hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider shadow-lg shadow-emerald-900/20 border-none"
                        >
                          <UserPlus className="w-4 h-4" />
                          Daftar Buka Tabungan
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRegStatusModal(true)}
                          className="w-full py-3 bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-200 font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider shadow-sm"
                        >
                          Cek Pendaftaran
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {institution.phone && (
                      <a 
                        href={`https://wa.me/${institution.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 bg-white text-emerald-900 font-black rounded-2xl text-[10px] uppercase tracking-wider hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-emerald-200"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Hubungi Admin
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW: REGISTRATION FORM */
            <div className="max-w-xl mx-auto space-y-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-900">Sudah Daftar? Silahkan Cek data Pendaftaran!</p>
                <button 
                  onClick={() => setShowRegStatusModal(true)}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-black rounded-xl text-[10px] uppercase tracking-wider hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-900/10"
                >
                  Cek Pendaftaran
                </button>
              </div>

              <div className="bg-white/45 backdrop-blur-xl rounded-[32px] p-10 shadow-2xl border border-white/60 space-y-8">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-800 text-white mx-auto flex items-center justify-center text-3xl shadow-lg mb-4">
                    📝
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-emerald-950 uppercase">Pendaftaran Tabungan</h2>
                  <p className="text-[11px] text-emerald-900/60 font-bold uppercase tracking-widest">Lengkapi formulir untuk membuka rekening saku</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block font-black text-emerald-950 text-[10px] uppercase tracking-widest">NAMA SANTRI</label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama lengkap santri..."
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full p-4 bg-white border-2 border-emerald-100 rounded-2xl text-sm font-bold text-emerald-950 focus:outline-none focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-black text-emerald-950 text-[10px] uppercase tracking-widest">NOMOR WHATSAPP WALI</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 081234567890"
                      value={regGuardianPhone}
                      onChange={(e) => setRegGuardianPhone(e.target.value)}
                      className="w-full p-4 bg-white border-2 border-emerald-100 rounded-2xl text-sm font-bold text-emerald-950 focus:outline-none focus:border-emerald-600 transition-all"
                    />
                    <p className="text-[9px] font-bold text-gray-400 mt-1">Digunakan untuk konfirmasi pembukaan rekening.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-black text-emerald-950 text-[10px] uppercase tracking-widest">PILIH KELAS</label>
                    <div className="relative">
                      <select
                        value={regClass}
                        onChange={(e) => setRegClass(e.target.value)}
                        required
                        className="w-full p-4 bg-white border-2 border-emerald-100 rounded-2xl text-xs font-black text-emerald-950 focus:outline-none focus:border-emerald-600 appearance-none cursor-pointer transition-all"
                      >
                        <option value="" disabled>-- Pilih Kelas --</option>
                        {classesList.map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-5 pointer-events-none text-emerald-850">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-black text-emerald-950 text-[10px] uppercase tracking-widest">PILIH ASRAMA</label>
                    <div className="relative">
                      <select
                        value={regDorm}
                        onChange={(e) => setRegDorm(e.target.value)}
                        required
                        className="w-full p-4 bg-white border-2 border-emerald-100 rounded-2xl text-xs font-black text-emerald-950 focus:outline-none focus:border-emerald-600 appearance-none cursor-pointer transition-all"
                      >
                        <option value="" disabled>-- Pilih Asrama --</option>
                        {institution.dorms?.map((dorm) => (
                          <option key={dorm} value={dorm}>{dorm}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-5 pointer-events-none text-emerald-850">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-800 hover:to-emerald-950 text-white font-black rounded-2xl text-sm shadow-xl hover:shadow-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer mt-4 uppercase tracking-widest border-none"
                  >
                    Daftar Buka Tabungan
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('portal')}
                    className="w-full py-4 bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-200 font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest shadow-sm"
                  >
                    Kembali
                  </button>
                </form>
              </div>
            </div>
          )
        ) : (
          /* VIEW B: LOGGED IN PORTAL (READ-ONLY MONITORING) */
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Santri Profile, Compact Balances, and Read-Only Warning */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Compact Profile Card */}
                <div className="bg-white/60 backdrop-blur-xl p-5 rounded-[24px] border border-white/80 shadow-xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-emerald-100 to-teal-100 text-emerald-800 rounded-xl flex items-center justify-center text-lg shadow-inner shrink-0">
                      👦
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-black text-emerald-950 truncate uppercase leading-tight">{loggedInStudent.name}</h2>
                      <p className="text-[10px] font-mono font-bold text-gray-500">NIS: {loggedInStudent.nis}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 ${loggedInStudent.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {loggedInStudent.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-emerald-900/80 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/30">
                    <div>
                      <span className="text-gray-400 block font-bold text-[8px] uppercase tracking-wider">Kelas</span>
                      <span className="truncate block font-extrabold">{loggedInStudent.className}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold text-[8px] uppercase tracking-wider">Asrama</span>
                      <span className="truncate block font-extrabold">{loggedInStudent.dorm}</span>
                    </div>
                  </div>
                </div>

                {/* Unified Premium Balances Card */}
                <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-emerald-950 text-white p-5 rounded-[24px] border border-emerald-800/20 shadow-2xl space-y-4">
                  <div className="space-y-1">
                    <span className="text-[8px] text-emerald-300 font-black uppercase tracking-widest block">Total Dana Gabungan</span>
                    <span className="text-2xl font-black text-amber-300 block font-mono">{formatCurrency(studentBalances.total)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                    <div className="space-y-1 bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-emerald-200 font-bold uppercase tracking-wider">Tabungan</span>
                        <span className="shrink-0">
                          {financial.windowOpen ? <Unlock className="w-2.5 h-2.5 text-emerald-300" /> : <Lock className="w-2.5 h-2.5 text-amber-300" />}
                        </span>
                      </div>
                      <span className="text-xs font-black block font-mono text-emerald-100">{formatCurrency(studentBalances.tabungan)}</span>
                      <span className="text-[8px] text-emerald-300/80 block font-medium">
                        {financial.windowOpen ? 'Dapat ditarik' : 'Terkunci'}
                      </span>
                    </div>

                    <div className="space-y-1 bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[8px] text-emerald-200 font-bold uppercase tracking-wider block">Penitipan</span>
                      <span className="text-xs font-black block font-mono text-emerald-100">{formatCurrency(studentBalances.penitipan)}</span>
                      <span className="text-[8px] text-emerald-300/80 block font-medium">Bebas ditarik</span>
                    </div>
                  </div>

                  {/* Horizontal Allocation Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-emerald-200">
                      <span>Tabungan ({studentBalances.total > 0 ? Math.round((studentBalances.tabungan / studentBalances.total) * 100) : 0}%)</span>
                      <span>Penitipan ({studentBalances.total > 0 ? Math.round((studentBalances.penitipan / studentBalances.total) * 100) : 0}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-teal-400 h-full transition-all duration-500" 
                        style={{ width: `${studentBalances.total > 0 ? (studentBalances.tabungan / studentBalances.total) * 100 : 0}%` }}
                      />
                      <div 
                        className="bg-amber-400 h-full transition-all duration-500 flex-1" 
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPassbookTab('Tabungan');
                      setShowPassbookModal(true);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none"
                  >
                    <BookOpen className="w-4 h-4 text-yellow-300" />
                    Lihat Buku Tabungan
                  </button>
                </div>

                {/* Layanan Penyetoran Mandiri (Transfer) Card with its own chart */}
                <div className="bg-white/60 backdrop-blur-xl p-5 rounded-[24px] border border-white/80 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-extrabold text-gray-800 text-[10px] uppercase tracking-wider">Penyetoran Mandiri (Transfer)</h3>
                  </div>

                  {/* Chart and statistics wrapper */}
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <span className="text-[8px] text-gray-400 font-black uppercase tracking-wider block">Statistik Pengajuan</span>
                      <div className="space-y-1 font-bold text-[10px]">
                        <div className="flex justify-between items-center text-amber-600">
                          <span>Menunggu (Pending)</span>
                          <span>{(registrations || []).filter(r => r.santriId === loggedInStudent?.id && r.type === 'Setor Dana' && r.status === 'Pending').length}x</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-600">
                          <span>Disetujui (Sukses)</span>
                          <span>{(registrations || []).filter(r => r.santriId === loggedInStudent?.id && r.type === 'Setor Dana' && r.status === 'Confirmed').length}x</span>
                        </div>
                        <div className="flex justify-between items-center text-red-500">
                          <span>Ditolak (Batal)</span>
                          <span>{(registrations || []).filter(r => r.santriId === loggedInStudent?.id && r.type === 'Setor Dana' && r.status === 'Rejected').length}x</span>
                        </div>
                      </div>
                    </div>

                    {/* Donut Chart */}
                    <div className="w-16 h-16 shrink-0 flex items-center justify-center relative">
                      {(() => {
                        const sDeps = (registrations || []).filter(r => r.santriId === loggedInStudent?.id && r.type === 'Setor Dana');
                        const pCount = sDeps.filter(r => r.status === 'Pending').length;
                        const cCount = sDeps.filter(r => r.status === 'Confirmed').length;
                        const rCount = sDeps.filter(r => r.status === 'Rejected').length;
                        
                        const chartData = [
                          { name: 'Menunggu', value: pCount, color: '#f59e0b' },
                          { name: 'Disetujui', value: cCount, color: '#10b981' },
                          { name: 'Ditolak', value: rCount, color: '#ef4444' }
                        ].filter(d => d.value > 0);

                        return sDeps.length > 0 ? (
                          <div className="w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={chartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={18}
                                  outerRadius={28}
                                  paddingAngle={2}
                                  dataKey="value"
                                >
                                  {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-[10px] font-black text-gray-700 font-mono">{sDeps.length}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-[8px] text-gray-400 font-black uppercase text-center leading-tight">
                            Kosong
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => {
                        if (loggedInStudent.status === 'Nonaktif' || loggedInStudent.savingsActive === false) {
                          alert('Maaf, pengajuan setor dana tidak dapat dilakukan karena status akun tabungan Anda tidak aktif.');
                          return;
                        }
                        setDepositAmount(0);
                        setDepositReceipt('');
                        setDepositNote('');
                        setDepositAccountType('Tabungan');
                        setShowDepositModal(true);
                      }}
                      className={`w-full py-2.5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-none ${
                        (loggedInStudent.status === 'Nonaktif' || loggedInStudent.savingsActive === false)
                          ? 'bg-slate-500 hover:bg-slate-600 cursor-not-allowed opacity-75'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-200" />
                      Ajukan Penyetoran Dana
                    </button>
                    
                    <button
                      onClick={() => setShowStatusModal(true)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border-none"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      Cek Status Penyetoran
                    </button>
                  </div>
                </div>

                {/* Compact Read-Only Alert */}
                <div className="bg-amber-50/60 backdrop-blur-sm border border-amber-200/60 text-amber-900 p-4 rounded-2xl space-y-1.5 text-[10px] leading-relaxed">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-extrabold uppercase tracking-wider">Akses Wali Santri (BACA-SAJA)</span>
                  </div>
                  <p className="font-medium text-amber-900/80">
                    Sistem dirancang as media monitoring real-time. Wali santri tidak dapat melakukan transaksi mandiri. Hubungi pengasuh/ustadz bendahara untuk setor/tarik.
                  </p>
                </div>

              </div>

              {/* Right Column: Complete Mutation Logs (Data/Riwayat Mutasi Tetap Lengkap) */}
              <div className="lg:col-span-8 bg-white/60 backdrop-blur-xl p-6 rounded-[24px] border border-white/70 shadow-xl space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-emerald-900/5">
                  <div>
                    <h3 className="font-bold text-emerald-950 text-sm uppercase tracking-tight flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      Arus Mutasi Rekening
                    </h3>
                    <p className="text-[10px] text-gray-500 font-bold">Semua aktivitas mutasi dana tabungan & penitipan</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="p-2 bg-white/80 border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-950 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="Semua">Semua Aliran</option>
                      <option value="Setor">Setoran (+)</option>
                      <option value="Tarik">Penarikan (-)</option>
                    </select>

                    <select
                      value={filterPos}
                      onChange={(e) => setFilterPos(e.target.value as any)}
                      className="p-2 bg-white/80 border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-950 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="Semua">Semua Jenis Akun</option>
                      <option value="Tabungan">Tabungan</option>
                      <option value="Penitipan">Penitipan</option>
                    </select>
                  </div>
                </div>

                <div className="border border-emerald-900/5 rounded-2xl overflow-hidden bg-white/40 backdrop-blur-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-emerald-50/50 border-b border-emerald-900/5 text-emerald-950 font-bold text-[10px] uppercase tracking-wider">
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">Jenis Akun</th>
                          <th className="p-3">Jenis Aliran</th>
                          <th className="p-3 text-right">Nominal</th>
                          <th className="p-3">Catatan</th>
                          <th className="p-3">Kasir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-900/5 font-bold">
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-white/30 transition-colors">
                              <td className="p-3 font-mono text-emerald-900/60 text-[10px]">{tx.date}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${
                                  tx.accountType === 'Tabungan' ? 'bg-teal-50/80 text-teal-850 border-teal-200/50' : 'bg-emerald-50/80 text-emerald-800 border-emerald-200/50'
                                }`}>
                                  {tx.accountType}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center gap-1 text-[11px] ${tx.type === 'Setor' ? 'text-emerald-700' : 'text-rose-600'}`}>
                                  {tx.type === 'Setor' ? 'Setor (+)' : 'Tarik (-)'}
                                </span>
                              </td>
                              <td className="p-3 text-right font-black font-mono text-emerald-950">{formatCurrency(tx.amount)}</td>
                              <td className="p-3 text-emerald-900/70 font-medium max-w-xs truncate">"{tx.note || '-'}"</td>
                              <td className="p-3 text-emerald-900/60 font-semibold">{tx.cashierName}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-emerald-900/40 italic font-bold">
                              Belum ada riwayat aliran dana untuk kriteria ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>

            {/* Passbook Modal (Sama dengan menu Data Tabungan Back-Office) */}
            {showPassbookModal && loggedInStudent && (
              <div className="fixed inset-0 bg-emerald-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-[24px] w-full max-w-5xl p-6 border border-emerald-100 shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-300">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase tracking-widest inline-block">Cetak Buku Santri</span>
                      <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">{loggedInStudent.name}</h3>
                      <p className="text-[10px] text-gray-500 font-bold font-mono">NIS: {loggedInStudent.nis} • Kelas: {loggedInStudent.className}</p>
                    </div>
                    <button 
                      onClick={() => setShowPassbookModal(false)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 rounded-full transition cursor-pointer border-none"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Panel Selector (Sliding Tab Layout) */}
                  <div className="bg-gray-100 p-1 rounded-xl flex relative">
                    <button
                      onClick={() => setPassbookTab('Tabungan')}
                      className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${
                        passbookTab === 'Tabungan' 
                          ? 'bg-white text-emerald-950 shadow-sm font-black' 
                          : 'text-gray-500 hover:text-gray-900 font-bold'
                      }`}
                    >
                      Buku Tabungan
                    </button>
                    <button
                      onClick={() => setPassbookTab('Penitipan')}
                      className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${
                        passbookTab === 'Penitipan' 
                          ? 'bg-white text-emerald-950 shadow-sm font-black' 
                          : 'text-gray-500 hover:text-gray-900 font-bold'
                      }`}
                    >
                      Buku Penitipan
                    </button>
                  </div>

                  {/* Slider Content Panel */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-emerald-100/40 relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest">Akun {passbookTab}</span>
                        <span className="text-xs font-black text-teal-950 font-mono bg-teal-100/50 px-2.5 py-1 rounded-lg">
                          {formatCurrency(passbookTab === 'Tabungan' ? studentBalances.tabungan : studentBalances.penitipan)}
                        </span>
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
                            {getMutasiTxs(loggedInStudent.id, passbookTab).length > 0 ? (
                              getMutasiTxs(loggedInStudent.id, passbookTab).map((tx) => (
                                <tr key={tx.id} className="hover:bg-teal-50/20">
                                  <td className="px-4 py-2 text-[10px] font-mono text-teal-900">{formatTxId(tx.id, transactions)}</td>
                                  <td className="px-4 py-2 text-[9px] font-mono text-gray-500">{new Date(tx.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                  <td className="px-4 py-2 text-right text-emerald-600 font-mono">{tx.type === 'Setor' ? formatCurrency(tx.amount) : '-'}</td>
                                  <td className="px-4 py-2 text-right text-rose-600 font-mono">{tx.type === 'Tarik' ? formatCurrency(tx.amount) : '-'}</td>
                                  <td className="px-4 py-2 text-right text-teal-950 font-mono">{formatCurrency(tx.currentBalance)}</td>
                                  <td className="px-4 py-2 text-[10px] text-gray-600">{tx.cashierName}</td>
                                  <td className="px-4 py-2 text-[10px] text-gray-600">{tx.note || '-'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 font-bold italic text-[10px]">
                                  Belum ada riwayat mutasi {passbookTab.toLowerCase()}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={() => printPassbook(loggedInStudent, transactions, institution, passbookTab)}
                        className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 cursor-pointer border-none"
                      >
                        <Printer className="w-4 h-4" />
                        Cetak Buku {passbookTab}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-gray-400 font-medium text-center italic">
                    Dokumen ini sinkron dengan data bank mini pondok pesantren. Laporkan jika ada perbedaan.
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="bg-white/20 backdrop-blur-md border-t border-white/30 text-emerald-950 text-xs py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center justify-center text-center gap-2">
          <div className="text-center">
            <span className="font-extrabold uppercase tracking-widest block text-[10px]">
              <span className="text-gray-900">E</span><span className="text-emerald-500 font-black">-</span><span className="text-gray-900">SANGU</span> <span className="text-emerald-500">SANTRI</span>
            </span>
            <span className="text-[10px] text-emerald-900/80 block mt-1">© 2026 {institution.name}. Hak Cipta Dilindungi.</span>
          </div>
        </div>
      </footer>

      {/* Registration Status Tracking Popup Modal */}
      {showRegStatusModal && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-2xl p-6 border border-emerald-100 shadow-2xl space-y-4 transform animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-emerald-950 uppercase tracking-tight">
                  Status Pendaftaran Tabungan Santri
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowRegStatusModal(false);
                  setRegSearchQuery('');
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama santri, asrama, atau nomor WhatsApp..."
                value={regSearchQuery}
                onChange={(e) => setRegSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 text-xs"
              />
            </div>

            {/* Scrollable list/table of registrations */}
            <div className="overflow-y-auto flex-1 border border-gray-100 rounded-xl">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                    <th className="p-3">Nama Santri</th>
                    <th className="p-3">Kelas / Asrama</th>
                    <th className="p-3">No. Wali</th>
                    <th className="p-3">Waktu Daftar</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {registrations.filter(reg => {
                    const q = regSearchQuery.toLowerCase();
                    return reg.name.toLowerCase().includes(q) || 
                           (reg.guardianPhone && reg.guardianPhone.includes(q)) ||
                           reg.className.toLowerCase().includes(q) ||
                           (reg.dorm && reg.dorm.toLowerCase().includes(q));
                  }).length > 0 ? (
                    registrations.filter(reg => {
                      const q = regSearchQuery.toLowerCase();
                      return reg.name.toLowerCase().includes(q) || 
                             (reg.guardianPhone && reg.guardianPhone.includes(q)) ||
                             reg.className.toLowerCase().includes(q) ||
                             (reg.dorm && reg.dorm.toLowerCase().includes(q));
                    }).map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-gray-950">{reg.name}</td>
                        <td className="p-3 text-gray-600">
                          <div>{reg.className}</div>
                          <div className="text-[9px] text-gray-400 font-medium">{reg.dorm || '-'}</div>
                        </td>
                        <td className="p-3 font-mono text-gray-600">{reg.guardianPhone || '-'}</td>
                        <td className="p-3 text-gray-500 font-medium">
                          {new Date(reg.timestamp).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold ${
                            reg.status === 'Pending' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : reg.status === 'Confirmed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {reg.status === 'Pending' && '⏳ Pending'}
                            {reg.status === 'Confirmed' && '✅ Disetujui'}
                            {reg.status === 'Rejected' && '❌ Ditolak'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400 font-bold">
                        {regSearchQuery ? 'Tidak ditemukan data pendaftaran yang cocok.' : 'Belum ada data pendaftaran.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowRegStatusModal(false);
                  setRegSearchQuery('');
                }}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-950 text-white font-black rounded-xl transition cursor-pointer border-none text-[10px] uppercase tracking-wider shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Registration Agreement Modal */}
      {showRegAgreement && (
        <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh]">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center shrink-0">
              <h3 className="font-black text-emerald-950 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Persetujuan Aturan Keuangan
              </h3>
              <button onClick={() => setShowRegAgreement(false)} className="text-emerald-400 hover:text-emerald-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700 font-medium leading-relaxed">
              <p>Sebelum mendaftarkan santri, harap setujui aturan dan kebijakan tabungan berikut:</p>
              
              <ul className="space-y-3 bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Ketika awal membuka tabungan akan dikenakan biaya untuk Buku Tabungan sebesar <strong className="text-emerald-700">Rp{(financial.savingsBookFeeAmount || 5000).toLocaleString('id-ID')}</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Uang tabungan bisa diambil sebelum liburan, (maksimal 1 tahun <strong className="text-emerald-700">{financial.maxWithdrawalsPerYear}x</strong>).</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Biaya admin dan layanan aplikasi setiap penarikan uang tabungan sebesar <strong className="text-emerald-700">Rp{(financial.adminFeeTabunganAmount || 5000).toLocaleString('id-ID')}</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Penitipan uang <strong>free</strong> (tidak ada biaya admin & batas masa penarikan), namun maksimal sebesar <strong className="text-blue-600">Rp{(financial.maxDepositAmount || 500000).toLocaleString('id-ID')}</strong>. Jika lebih, disarankan digabung ke Tabungan.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowRegAgreement(false)}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmRegistration}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black rounded-xl shadow-md transition flex justify-center items-center gap-2 cursor-pointer border-none"
              >
                <CheckCircle className="w-4 h-4" />
                Setuju & Kirim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ajukan Penyetoran Dana Modal */}
      {showDepositModal && loggedInStudent && (
        <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl border border-emerald-100 flex flex-col my-8">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex justify-between items-center shrink-0">
              <h3 className="font-black flex items-center gap-2 text-sm uppercase tracking-wider">
                <PlusCircle className="w-5 h-5 text-emerald-300" />
                Ajukan Setoran Mandiri
              </h3>
              <button 
                onClick={() => setShowDepositModal(false)} 
                className="text-white/80 hover:text-white cursor-pointer bg-transparent border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeposit} className="p-6 space-y-4 text-xs font-bold">
              {/* Account type selection */}
              <div>
                <label className="block text-gray-500 font-black mb-1.5 uppercase tracking-wider text-[10px]">Pilih Jenis Akun</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDepositAccountType('Tabungan')}
                    className={`p-3 rounded-xl border-2 text-center transition font-black ${
                      depositAccountType === 'Tabungan'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900'
                        : 'border-gray-100 hover:bg-gray-50 text-gray-500'
                    }`}
                  >
                    💰 Tabungan
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositAccountType('Penitipan')}
                    className={`p-3 rounded-xl border-2 text-center transition font-black ${
                      depositAccountType === 'Penitipan'
                        ? 'border-teal-600 bg-teal-50/50 text-teal-900'
                        : 'border-gray-100 hover:bg-gray-50 text-gray-500'
                    }`}
                  >
                    💼 Penitipan
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-gray-500 font-black mb-1 uppercase tracking-wider text-[10px]">Nominal Penyetoran (Rp)</label>
                <input
                  type="text"
                  required
                  value={depositAmount || ''}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, '');
                    setDepositAmount(cleanVal ? parseInt(cleanVal) : 0);
                  }}
                  placeholder="Contoh: 100000"
                  className="w-full p-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-emerald-600 font-mono text-sm font-black text-gray-800"
                />
              </div>

              {/* Bank account details instruction box */}
              <div className="bg-amber-50/70 border border-amber-200/50 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200">
                <span className="text-amber-950 font-extrabold text-[10px] uppercase tracking-wider block">Silahkan Transfer ke Rekening Berikut:</span>
                
                {institution.depositBankCustomText ? (
                  <div className="text-gray-900 text-xs font-black whitespace-pre-wrap leading-relaxed font-sans bg-white/60 p-3 rounded-xl border border-amber-100 shadow-sm">
                    {institution.depositBankCustomText}
                  </div>
                ) : (
                  <div className="font-mono text-gray-700 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="font-bold">BANK:</span>
                      <span className="font-black text-gray-900 uppercase">{institution.depositBankName || 'BANK BRI'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-bold">NO. REK:</span>
                      <span className="font-black text-blue-800 text-xs bg-white px-2 py-0.5 rounded border border-blue-100">{institution.depositBankAccountNumber || '632201038845535'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">A.N:</span>
                      <span className="font-black text-gray-900 uppercase">{institution.depositBankAccountHolder || 'Ust. Muhammad Afif Syaiful Muzakky'}</span>
                    </div>
                  </div>
                )}
                
                <p className="text-[9px] text-amber-900/85 font-medium italic mt-1 leading-tight">
                  * Harap transfer sesuai nominal yang diajukan agar memudahkan pencocokan oleh kasir.
                </p>
              </div>

              {/* Receipt upload */}
              <div>
                <label className="block text-gray-500 font-black mb-1 uppercase tracking-wider text-[10px]">Unggah Bukti Transfer</label>
                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200/60">
                  <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {depositReceipt ? (
                      <img src={depositReceipt} alt="Kuitansi" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onClick={(e) => ((e.target as HTMLInputElement).value = '')}
                      onChange={handleDepositFileChange}
                      required
                      className="block w-full text-[10px] text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-black file:bg-slate-700 file:text-white hover:file:bg-slate-800 cursor-pointer transition-all"
                    />
                    <p className="text-[9px] text-gray-400 italic font-medium">Format: JPG, PNG. Maksimal 10MB.</p>
                  </div>
                </div>
              </div>

              {/* Catatan untuk Admin */}
              <div>
                <label className="block text-gray-500 font-black mb-1 uppercase tracking-wider text-[10px]">Catatan untuk Admin (Opsional)</label>
                <textarea
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="Contoh: Transfer dari Rek BRI an. Ahmad, Tolong segera diproses, dst."
                  className="w-full p-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-emerald-600 text-xs text-gray-800 h-20 resize-none font-bold"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-xl transition cursor-pointer text-[10px] uppercase tracking-wider"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black rounded-xl shadow-md transition flex justify-center items-center gap-1.5 cursor-pointer border-none text-[10px] uppercase tracking-wider"
                >
                  <CheckCircle className="w-4 h-4" />
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cek Status Penyetoran Modal */}
      {showStatusModal && loggedInStudent && (
        <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl border border-emerald-100 flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center shrink-0">
              <h3 className="font-black flex items-center gap-2 text-sm uppercase tracking-wider">
                <Clock className="w-5 h-5 text-amber-400" />
                Status Pengajuan Setoran Dana
              </h3>
              <button 
                onClick={() => setShowStatusModal(false)} 
                className="text-white/80 hover:text-white cursor-pointer bg-transparent border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Santri: <strong className="text-emerald-950">{loggedInStudent.name}</strong></span>
                <span>NIS: <strong className="text-gray-500 font-mono">{loggedInStudent.nis}</strong></span>
              </div>

              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-100 border-b border-gray-200 text-slate-800 font-black text-[10px] uppercase tracking-wider">
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Jenis Akun</th>
                        <th className="p-3 text-right">Nominal</th>
                        <th className="p-3 text-center">Bukti</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Catatan / Alasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                      {(() => {
                        const sDeps = (registrations || []).filter(r => r.santriId === loggedInStudent.id && r.type === 'Setor Dana');
                        if (sDeps.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-400 font-black">
                                Belum ada riwayat pengajuan penyetoran dana.
                              </td>
                            </tr>
                          );
                        }
                        return sDeps.map((dep) => (
                          <tr key={dep.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-[10px] text-gray-500">
                              {new Date(dep.timestamp).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                dep.accountType === 'Tabungan' ? 'bg-teal-50 text-teal-800 border border-teal-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                              }`}>
                                {dep.accountType}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-black text-gray-950">
                              {formatCurrency(dep.amount || 0)}
                            </td>
                            <td className="p-3 text-center">
                              {dep.transferReceiptUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedStatusReceiptUrl(dep.transferReceiptUrl || '')}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition border-none cursor-pointer flex items-center justify-center mx-auto"
                                  title="Lihat Bukti Transfer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-gray-400 font-normal">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black border ${
                                dep.status === 'Pending' 
                                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                  : dep.status === 'Confirmed'
                                    ? 'bg-emerald-50 text-emerald-850 border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}>
                                {dep.status === 'Pending' && '⏳ Diproses'}
                                {dep.status === 'Confirmed' && '✅ Disetujui'}
                                {dep.status === 'Rejected' && '❌ Ditolak'}
                              </span>
                            </td>
                            <td className="p-3 text-[10px] max-w-xs truncate font-medium text-gray-500" title={dep.rejectionReason}>
                              {dep.status === 'Rejected' && dep.rejectionReason ? (
                                <span className="text-red-500 font-black">"{dep.rejectionReason}"</span>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl transition cursor-pointer text-[10px] uppercase tracking-wider"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: View Receipt from Status list */}
      {selectedStatusReceiptUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative">
            <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center font-bold text-xs uppercase tracking-wider">
              <span>Pratinjau Bukti Transfer</span>
              <button 
                onClick={() => setSelectedStatusReceiptUrl('')} 
                className="text-white hover:text-gray-300 cursor-pointer bg-transparent border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-150 max-h-[70vh] overflow-auto">
              <img src={selectedStatusReceiptUrl} alt="Bukti Transfer" className="max-h-[60vh] rounded-xl object-contain shadow-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Camera QR code scanner overlay */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />

      {/* Red Alert Error Modal */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 animate-in zoom-in-95 duration-200">
            {/* Header Red Gradient */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white flex flex-col items-center text-center relative">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 animate-bounce">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-extrabold uppercase tracking-wider">{errorModal.title}</h3>
            </div>
            
            {/* Content */}
            <div className="p-6 text-center space-y-4">
              <p className="text-gray-600 font-medium text-sm leading-relaxed">
                {errorModal.message}
              </p>
              
              <button
                type="button"
                onClick={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-98 uppercase tracking-widest text-xs cursor-pointer border-none"
              >
                Tutup & Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
