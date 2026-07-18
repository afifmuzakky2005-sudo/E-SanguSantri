import React, { useState, useRef, useEffect } from 'react';
import { Santri, Transaction, FinancialSettings, AccountType, InstitutionSettings } from '../types';
import { calculateBalances } from '../data/mockData';
import { Search, CircleDollarSign, ArrowDownCircle, ArrowUpCircle, Printer, Calendar, ShieldAlert, CheckCircle, FileText, X, ChevronRight, History, Receipt, ArrowRight, MessageSquare, Camera } from 'lucide-react';
import { printReceipt, parseWaTransactionTemplate, getWhatsAppLink, formatTxId } from '../lib/printHelper';
import { playSuccessSound, playErrorSound } from '../lib/soundHelper';
import { QrScannerModal } from './QrScannerModal';

interface TransactionsProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  financialSettings: FinancialSettings;
  cashierName: string;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string }) => Transaction;
  initialView?: 'setor' | 'tarik';
  prefilled?: {
    santriId: string;
    accountType: 'Tabungan' | 'Penitipan';
    amount: number;
    type: 'Setor' | 'Tarik';
    paymentMethod: 'Tunai' | 'Transfer';
    transferReceiptUrl: string;
    registrationId: string;
  } | null;
  onClearPrefilled?: () => void;
  onConfirmDeposit?: (regId: string) => void;
}

export default function Transactions({
  students,
  transactions,
  institution,
  financialSettings,
  cashierName,
  onAddTransaction,
  initialView = 'setor',
  prefilled,
  onClearPrefilled,
  onConfirmDeposit
}: TransactionsProps) {
  const [activeTab, setActiveTab] = useState<'setor' | 'tarik'>(initialView);
  
  // Search state for picking student
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Santri | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Success modal state for transaction completion
  const [successModalData, setSuccessModalData] = useState<{
    tx: Transaction;
    student: Santri;
  } | null>(null);

  // Setor Form State
  const [setorAccount, setSetorAccount] = useState<AccountType>('Penitipan');
  const [setorAmount, setSetorAmount] = useState<number>(0);
  const [setorNote, setSetorNote] = useState('-');

  // Tarik Form State
  const [tarikAccount, setTarikAccount] = useState<AccountType>('Penitipan');
  const [tarikAmount, setTarikAmount] = useState<number>(0);
  const [tarikNote, setTarikNote] = useState('-');
  const [withdrawerName, setWithdrawerName] = useState('');
  const [isBypassed, setIsBypassed] = useState(false);
  const [adminFeeOption, setAdminFeeOption] = useState<'system' | 'free' | 'custom'>('system');
  const [customAdminFeeValue, setCustomAdminFeeValue] = useState<number>(0);

  // Payment Method States (Tunai / Transfer) - Optional
  const [setorPaymentMethod, setSetorPaymentMethod] = useState<'Tunai' | 'Transfer'>('Tunai');
  const [setorBankName, setSetorBankName] = useState('');
  const [setorAccountInfo, setSetorAccountInfo] = useState('');
  const [setorReceipt, setSetorReceipt] = useState('');

  const [tarikPaymentMethod, setTarikPaymentMethod] = useState<'Tunai' | 'Transfer'>('Tunai');
  const [tarikBankName, setTarikBankName] = useState('');
  const [tarikAccountInfo, setTarikAccountInfo] = useState('');
  const [tarikReceipt, setTarikReceipt] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setBase64: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
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
            setBase64(compressedDataUrl);
          } else {
            setBase64(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      setWithdrawerName(selectedStudent.name);
    } else {
      setWithdrawerName('');
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (prefilled) {
      const student = students.find(s => s.id === prefilled.santriId);
      if (student) {
        setSelectedStudent(student);
        setSearchQuery(student.name);
        setActiveTab(prefilled.type.toLowerCase() as 'setor' | 'tarik');
        
        if (prefilled.type === 'Setor') {
          setSetorAccount(prefilled.accountType);
          setSetorAmount(prefilled.amount);
          setSetorPaymentMethod(prefilled.paymentMethod);
          setSetorReceipt(prefilled.transferReceiptUrl);
          setSetorNote(`Setoran Mandiri via Portal (ID Pengajuan: ${prefilled.registrationId.slice(-6)})`);
        } else {
          setTarikAccount(prefilled.accountType);
          setTarikAmount(prefilled.amount);
          setTarikPaymentMethod(prefilled.paymentMethod);
          setTarikReceipt(prefilled.transferReceiptUrl);
          setTarikNote(`Penarikan Mandiri via Portal (ID Pengajuan: ${prefilled.registrationId.slice(-6)})`);
        }
      }
    }
  }, [prefilled, students]);

  const getLocalDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [transactionDateTime, setTransactionDateTime] = useState(getLocalDateTimeString());

  // Quick select santri
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.nis.includes(searchQuery)
  ).slice(0, 5);

  const handleScanSuccess = (decodedText: string) => {
    setIsCameraOpen(false);
    const textToSearch = decodedText.trim();
    const found = students.find(s => 
      s.nis === textToSearch || 
      s.id === textToSearch || 
      s.name.toLowerCase() === textToSearch.toLowerCase()
    );
    if (found) {
      playSuccessSound();
      setSelectedStudent(found);
      setSearchQuery(found.name);
    } else {
      playErrorSound();
      alert(`Santri dengan NIS/ID "${textToSearch}" tidak ditemukan.`);
    }
  };

  const selectedStudentBalances = selectedStudent ? calculateBalances(selectedStudent.id, transactions) : { tabungan: 0, penitipan: 0, total: 0 };

  // Counting student's tabungan withdrawals this year to check limits
  const getTabunganWithdrawalCountThisYear = (studentId: string) => {
    const currentYear = new Date().getFullYear();
    return transactions.filter(t => 
      t.santriId === studentId && 
      t.type === 'Tarik' && 
      t.accountType === 'Tabungan' &&
      new Date(t.date).getFullYear() === currentYear
    ).length;
  };

  const withdrawalCount = selectedStudent ? getTabunganWithdrawalCountThisYear(selectedStudent.id) : 0;

  // Auto calculate admin fee based on financial settings
  const getCalculatedAdminFee = (type: 'Setor' | 'Tarik', account: AccountType) => {
    if (type === 'Setor') return 0;
    if (account === 'Tabungan' && financialSettings.adminFeeTabunganEnabled) {
      return financialSettings.adminFeeTabunganAmount;
    }
    if (account === 'Penitipan' && financialSettings.adminFeePenitipanEnabled) {
      return financialSettings.adminFeePenitipanAmount;
    }
    return 0;
  };

  const calculatedFee = getCalculatedAdminFee('Tarik', tarikAccount);

  const handleSetorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Silakan pilih santri terlebih dahulu.');
      return;
    }
    if (selectedStudent.status === 'Nonaktif' || selectedStudent.savingsActive === false) {
      alert('Gagal: Akun tabungan santri ini tidak aktif. Transaksi ditolak.');
      return;
    }
    if (setorAmount <= 0) {
      alert('Nominal setoran harus lebih besar dari Rp 0.');
      return;
    }

    const txData = {
      santriId: selectedStudent.id,
      santriName: selectedStudent.name,
      santriClass: selectedStudent.className,
      date: transactionDateTime.split('T')[0],
      type: 'Setor' as const,
      accountType: setorAccount,
      amount: setorAmount,
      adminFee: 0,
      netAmount: setorAmount,
      note: setorNote.trim() || '-',
      cashierName: cashierName,
      signatureName: '',
      timestamp: new Date(transactionDateTime).toISOString(),
      paymentMethod: setorPaymentMethod,
      bankName: setorPaymentMethod === 'Transfer' ? setorBankName : undefined,
      accountInfo: setorPaymentMethod === 'Transfer' ? setorAccountInfo : undefined,
      transferReceiptUrl: setorPaymentMethod === 'Transfer' ? setorReceipt : undefined
    };

    const completedTx = onAddTransaction(txData);

    if (prefilled && prefilled.registrationId) {
      if (onConfirmDeposit) {
        onConfirmDeposit(prefilled.registrationId);
      }
      if (onClearPrefilled) {
        onClearPrefilled();
      }
    }

    // Set success modal data to trigger pop up
    setSuccessModalData({
      tx: completedTx,
      student: selectedStudent
    });

    // Reset Form
    setSetorAmount(0);
    setSetorNote('-');
    setSetorPaymentMethod('Tunai');
    setSetorBankName('');
    setSetorAccountInfo('');
    setSetorReceipt('');
    setSelectedStudent(null);
    setSearchQuery('');
  };

  const handleTarikSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Silakan pilih santri terlebih dahulu.');
      return;
    }
    if (selectedStudent.status === 'Nonaktif' || selectedStudent.savingsActive === false) {
      alert('Gagal: Akun tabungan santri ini tidak aktif. Transaksi ditolak.');
      return;
    }
    if (tarikAmount <= 0) {
      alert('Nominal penarikan harus lebih besar dari Rp 0.');
      return;
    }

    const getWithdrawalAdminFee = () => {
      if (adminFeeOption === 'free') return 0;
      if (adminFeeOption === 'custom') return customAdminFeeValue;
      return getCalculatedAdminFee('Tarik', tarikAccount);
    };
    const finalFee = getWithdrawalAdminFee();

    const maxAvailable = tarikAccount === 'Tabungan' ? selectedStudentBalances.tabungan : selectedStudentBalances.penitipan;
    const totalRequired = tarikAmount;

    if (totalRequired > maxAvailable) {
      alert(`Saldo tidak mencukupi! Saldo tersedia: Rp ${new Intl.NumberFormat('id-ID').format(maxAvailable)}.`);
      return;
    }

    if (finalFee >= tarikAmount) {
      alert('Nominal penarikan harus lebih besar dari biaya admin.');
      return;
    }

    // Business Rule Check: Tabungan Locking
    if (tarikAccount === 'Tabungan') {
      const isWindowOpen = financialSettings.windowOpen;
      if (!isWindowOpen && !isBypassed) {
        alert('PERINGATAN: Penarikan Tabungan terkunci di luar Jendela Penarikan! Anda membutuhkan Bypass Persetujuan Bendahara.');
        return;
      }

      if (withdrawalCount >= financialSettings.maxWithdrawalsPerYear && !isBypassed) {
        alert(`PERINGATAN: Santri telah melebihi batas penarikan tahunan (${financialSettings.maxWithdrawalsPerYear} kali)! Membutuhkan Bypass Persetujuan Bendahara.`);
        return;
      }
    }

    const txData = {
      santriId: selectedStudent.id,
      santriName: selectedStudent.name,
      santriClass: selectedStudent.className,
      date: transactionDateTime.split('T')[0],
      type: 'Tarik' as const,
      accountType: tarikAccount,
      amount: tarikAmount,
      adminFee: finalFee,
      netAmount: tarikAmount - finalFee,
      note: finalFee > 0
        ? ((tarikNote.trim() && tarikNote.trim() !== '-') ? `${tarikNote.trim()} (biaya admin dan layanan aplikasi)` : 'biaya admin dan layanan aplikasi')
        : (tarikNote.trim() || '-'),
      cashierName: cashierName,
      signatureName: withdrawerName || selectedStudent.name,
      timestamp: new Date(transactionDateTime).toISOString(),
      paymentMethod: tarikPaymentMethod,
      bankName: tarikPaymentMethod === 'Transfer' ? tarikBankName : undefined,
      accountInfo: tarikPaymentMethod === 'Transfer' ? tarikAccountInfo : undefined,
      transferReceiptUrl: tarikPaymentMethod === 'Transfer' ? tarikReceipt : undefined
    };

    const completedTx = onAddTransaction(txData);

    // Set success modal data to trigger pop up
    setSuccessModalData({
      tx: completedTx,
      student: selectedStudent
    });

    // Reset Form
    setTarikAmount(0);
    setTarikNote('-');
    setWithdrawerName('');
    setIsBypassed(false);
    setAdminFeeOption('system');
    setCustomAdminFeeValue(0);
    setTarikPaymentMethod('Tunai');
    setTarikBankName('');
    setTarikAccountInfo('');
    setTarikReceipt('');
    setSelectedStudent(null);
    setSearchQuery('');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-xl font-black text-emerald-950 tracking-tight uppercase flex items-center gap-2">
            <CircleDollarSign className="w-6 h-6 text-emerald-600" />
            SETOR & TARIK DANA
          </h2>
          <p className="text-xs text-gray-500 mt-1">Lakukan transaksi penyetoran dana atau penarikan saldo saku santri secara instan dan aman.</p>
        </div>
      </div>

      {/* Tab Selectors - Modernized */}
      <div className="flex border-b border-emerald-100 bg-white p-2 rounded-[24px] border shadow-sm">
        <button
          onClick={() => { setActiveTab('setor'); setSelectedStudent(null); setSearchQuery(''); }}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'setor'
              ? 'bg-emerald-700 text-white shadow-xl shadow-emerald-900/20'
              : 'text-emerald-900/60 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          Setor Dana (Debit)
        </button>
        <button
          onClick={() => { setActiveTab('tarik'); setSelectedStudent(null); setSearchQuery(''); }}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'tarik'
              ? 'bg-red-600 text-white shadow-xl shadow-red-900/20'
              : 'text-emerald-900/60 hover:text-red-700 hover:bg-red-50'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          Tarik Dana (Kredit)
        </button>
      </div>

      {prefilled && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[24px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200 font-bold text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm shadow-md shrink-0">
              ⏳
            </div>
            <div>
              <p className="text-amber-950 font-black uppercase tracking-wider text-[10px]">Memproses Pengajuan Transfer</p>
              <p className="text-gray-600 mt-0.5 font-medium">
                Sedang memproses setoran mandiri dari wali santri <strong className="text-gray-900">{students.find(s => s.id === prefilled.santriId)?.name || 'Santri'}</strong> sebesar <strong className="text-emerald-800">{formatCurrency(prefilled.amount)}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onClearPrefilled) onClearPrefilled();
              setSetorAmount(0);
              setSetorReceipt('');
              setSelectedStudent(null);
              setSearchQuery('');
            }}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition font-black text-[10px] uppercase border-none cursor-pointer tracking-wider shadow-sm"
          >
            Batal & Reset Form
          </button>
        </div>
      )}

      {/* SEARCH/PICK STUDENT CONTAINER (For Setor and Tarik) */}
      <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pick Student Column */}
            <div className="bg-white p-6 rounded-[24px] border border-emerald-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-white ${activeTab === 'setor' ? 'bg-emerald-600' : 'bg-red-600'}`}>1</div>
                <h3 className="font-black text-emerald-950 text-xs uppercase tracking-widest flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-600" />
                  Cari & Pilih Santri
                </h3>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                <input
                  type="text"
                  placeholder="Ketik Nama atau NIS..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedStudent) setSelectedStudent(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 text-xs font-bold border border-emerald-100 bg-emerald-50/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* QR Code Scanner Trigger Button */}
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="w-full py-3 bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm hover:shadow active:scale-98"
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                Buka Kamera untuk Scan QR
              </button>

              {/* Dropdown results */}
              {searchQuery && !selectedStudent && (
                <div className="border border-emerald-50 rounded-2xl divide-y divide-emerald-50 bg-emerald-50/20 overflow-hidden shadow-inner">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStudent(s);
                          setSearchQuery(s.name);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition flex justify-between items-center cursor-pointer"
                      >
                        <div>
                          <div className="font-black text-emerald-950 text-xs">{s.nis} - {s.name}</div>
                          <div className="text-[10px] text-emerald-600/60 font-bold uppercase tracking-wider">Kelas: {s.className}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-emerald-300" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Tidak ditemukan</p>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Student Card */}
              {selectedStudent && (
                <div className="p-5 rounded-[20px] bg-emerald-950 text-white space-y-4 shadow-lg shadow-emerald-900/30 animate-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-sm tracking-tight">{selectedStudent.nis} - {selectedStudent.name}</h4>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Kelas: {selectedStudent.className}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedStudent(null)} 
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-400 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(selectedStudent.status === 'Nonaktif' || selectedStudent.savingsActive === false) && (
                    <div className="bg-red-500/20 border-2 border-red-500/30 text-red-200 p-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-center">
                      ⚠️ Akun Tabungan Tidak Aktif
                    </div>
                  )}

                  <div className="h-px bg-white/10"></div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Tabungan</span>
                      <span className="font-black text-xs text-white">{formatCurrency(selectedStudentBalances.tabungan)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Penitipan</span>
                      <span className="font-black text-xs text-white">{formatCurrency(selectedStudentBalances.penitipan)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Total Saldo</span>
                      <span className="font-black text-sm text-amber-400">{formatCurrency(selectedStudentBalances.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Action Column */}
            <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-emerald-100 shadow-sm">
              {activeTab === 'setor' ? (
                <form onSubmit={handleSetorSubmit} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white">2</div>
                    <h3 className="font-black text-emerald-950 text-xs uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Detail Setoran Dana
                    </h3>
                  </div>

                  {/* Row 1: Tanggal & Waktu & Akun Tujuan (2 kolom) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">TANGGAL & WAKTU</label>
                      <input
                        type="datetime-local"
                        required
                        value={transactionDateTime}
                        onChange={(e) => setTransactionDateTime(e.target.value)}
                        className="w-full px-4 py-3 text-xs font-bold border border-gray-100 bg-white rounded-xl focus:outline-none focus:border-emerald-600 transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">AKUN TUJUAN*</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => { setSetorAccount('Penitipan'); setSetorNote('-'); }}
                          className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition cursor-pointer ${
                            setorAccount === 'Penitipan'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-500 font-extrabold'
                              : 'bg-white text-gray-400 border-gray-100 hover:border-emerald-200 font-bold'
                          }`}
                        >
                          Penitipan
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSetorAccount('Tabungan'); setSetorNote('-'); }}
                          className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition cursor-pointer ${
                            setorAccount === 'Tabungan'
                              ? 'bg-teal-50 text-teal-800 border-teal-500 font-extrabold'
                              : 'bg-white text-gray-400 border-gray-100 hover:border-teal-200 font-bold'
                          }`}
                        >
                          Tabungan
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Nominal Setoran (Long Column / Full Width) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">NOMINAL SETORAN*</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-500">Rp</span>
                      <input
                        type="number" required placeholder="0" value={setorAmount || ''}
                        onChange={(e) => setSetorAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-10 pr-4 py-3.5 text-sm font-black text-emerald-950 border border-emerald-100 bg-emerald-50/20 rounded-xl focus:outline-none focus:border-emerald-600 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">PINTASAN NOMINAL</label>
                    <div className="flex flex-wrap gap-2">
                      {[50000, 100000, 200000, 500000, 1000000].map(amt => (
                        <button
                          key={amt} type="button" onClick={() => setSetorAmount(amt)}
                          className="px-4 py-2 text-[10px] font-black bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition border border-emerald-100 cursor-pointer"
                        >
                          {new Intl.NumberFormat('id-ID').format(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">KETERANGAN*</label>
                    <input
                      type="text" required value={setorNote} onChange={(e) => setSetorNote(e.target.value)} placeholder="-"
                      className="w-full px-4 py-3 text-xs font-bold border border-emerald-100 bg-emerald-50/20 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Metode Transaksi (Optional) */}
                  <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/75 space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">METODE TRANSAKSI (OPSIONAL)</label>
                      <span className="text-[9px] text-gray-500 font-medium">Pilih tunai atau transfer bank</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSetorPaymentMethod('Tunai')}
                        className={`py-3 text-[11px] font-black uppercase tracking-widest rounded-xl border-2 transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                          setorPaymentMethod === 'Tunai'
                            ? 'bg-emerald-800 text-white border-emerald-900 font-black shadow-lg shadow-emerald-800/20 ring-2 ring-emerald-500/40 scale-[1.02]'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-emerald-300 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {setorPaymentMethod === 'Tunai' && <CheckCircle className="w-4 h-4 text-emerald-300" />}
                        Tunai
                      </button>
                      <button
                        type="button"
                        onClick={() => setSetorPaymentMethod('Transfer')}
                        className={`py-3 text-[11px] font-black uppercase tracking-widest rounded-xl border-2 transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                          setorPaymentMethod === 'Transfer'
                            ? 'bg-emerald-800 text-white border-emerald-900 font-black shadow-lg shadow-emerald-800/20 ring-2 ring-emerald-500/40 scale-[1.02]'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-emerald-300 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {setorPaymentMethod === 'Transfer' && <CheckCircle className="w-4 h-4 text-emerald-300" />}
                        Transfer Bank
                      </button>
                    </div>

                    {setorPaymentMethod === 'Transfer' && (
                      <div className="space-y-3 pt-2 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Nama Bank (Opsional)</label>
                            <input
                              type="text"
                              placeholder="Contoh: BRI, BCA, Mandiri"
                              value={setorBankName}
                              onChange={(e) => setSetorBankName(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-bold border border-emerald-100 bg-white rounded-lg focus:outline-none focus:border-emerald-650"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Nama / No. Rekening (Opsional)</label>
                            <input
                              type="text"
                              placeholder="Contoh: 123456789 a.n Ahmad"
                              value={setorAccountInfo}
                              onChange={(e) => setSetorAccountInfo(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-bold border border-emerald-100 bg-white rounded-lg focus:outline-none focus:border-emerald-650"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Upload Bukti Transfer (Opsional)</label>
                          <div className="flex items-center gap-3">
                            <label className="relative px-4 py-2 bg-white hover:bg-gray-50 border border-emerald-150 rounded-xl cursor-pointer text-[10px] font-bold text-emerald-800 flex items-center gap-1.5 transition overflow-hidden">
                              <span>Pilih File Gambar</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onClick={(e) => ((e.target as HTMLInputElement).value = '')}
                                onChange={(e) => handleFileChange(e, setSetorReceipt)}
                              />
                            </label>
                            {setorReceipt ? (
                              <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 py-1 px-2.5 rounded-lg text-[9px] font-bold">
                                <span className="truncate max-w-xs">File berhasil diunggah (Base64)</span>
                                <button
                                  type="button"
                                  onClick={() => setSetorReceipt('')}
                                  className="text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer text-xs font-black"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <span className="text-[9px] text-gray-400 italic">Belum ada file dipilih</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit" disabled={!selectedStudent}
                      className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-[20px] text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 transition active:scale-95 disabled:opacity-50 disabled:scale-100 border-none cursor-pointer"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Proses Setoran & Cetak Struk
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleTarikSubmit} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center font-black text-white">2</div>
                    <h3 className="font-black text-emerald-950 text-xs uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-600" />
                      Detail Penarikan Dana
                    </h3>
                  </div>

                  {/* Row 1: Tanggal & Waktu & Sumber Dana (2 kolom) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">TANGGAL & WAKTU</label>
                      <input
                        type="datetime-local"
                        required
                        value={transactionDateTime}
                        onChange={(e) => setTransactionDateTime(e.target.value)}
                        className="w-full px-4 py-3 text-xs font-bold border border-gray-100 bg-white rounded-xl focus:outline-none focus:border-emerald-600 transition"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">SUMBER DANA*</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => { setTarikAccount('Penitipan'); setTarikNote('-'); }}
                          className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition cursor-pointer ${
                            tarikAccount === 'Penitipan'
                              ? 'bg-red-50 text-red-800 border-red-500 font-extrabold'
                              : 'bg-white text-gray-400 border-gray-100 hover:border-red-200 font-bold'
                          }`}
                        >
                          Penitipan
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTarikAccount('Tabungan'); setTarikNote('-'); }}
                          className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition cursor-pointer ${
                            tarikAccount === 'Tabungan'
                              ? 'bg-orange-50 text-orange-800 border-orange-500 font-extrabold'
                              : 'bg-white text-gray-400 border-gray-100 hover:border-orange-200 font-bold'
                          }`}
                        >
                          Tabungan
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Nominal Tarik (Long Column / Full Width) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">NOMINAL TARIK*</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-red-500">Rp</span>
                      <input
                        type="number" required placeholder="0" value={tarikAmount || ''}
                        onChange={(e) => setTarikAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-10 pr-4 py-3.5 text-sm font-black text-emerald-950 border border-red-100 bg-red-50/10 rounded-xl focus:outline-none focus:border-red-600 transition"
                      />
                    </div>
                  </div>

                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Pintasan Nominal</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedStudent) {
                            alert('Silakan pilih santri terlebih dahulu.');
                            return;
                          }
                          const maxAvailable = tarikAccount === 'Tabungan' ? selectedStudentBalances.tabungan : selectedStudentBalances.penitipan;
                          setTarikAmount(maxAvailable);
                        }}
                        className="px-4 py-2 text-[10px] font-black bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition border border-amber-200 cursor-pointer"
                      >
                        Semua Saldo ({formatCurrency(tarikAccount === 'Tabungan' ? selectedStudentBalances.tabungan : selectedStudentBalances.penitipan)})
                      </button>
                      {[50000, 100000, 200000, 500000, 1000000].map(amt => (
                        <button
                          key={amt} type="button" onClick={() => setTarikAmount(amt)}
                          className="px-4 py-2 text-[10px] font-black bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition border border-red-100 cursor-pointer"
                        >
                          {new Intl.NumberFormat('id-ID').format(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Opsi Biaya Admin Panel */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">OPSI BIAYA ADMIN</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdminFeeOption('system')}
                        className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition cursor-pointer text-center ${
                          adminFeeOption === 'system'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-500 font-extrabold'
                            : 'bg-white text-gray-400 border-gray-100 hover:border-emerald-200 font-bold'
                        }`}
                      >
                        Sistem ({formatCurrency(getCalculatedAdminFee('Tarik', tarikAccount))})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminFeeOption('free')}
                        className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition cursor-pointer text-center ${
                          adminFeeOption === 'free'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-500 font-extrabold'
                            : 'bg-white text-gray-400 border-gray-100 hover:border-emerald-200'
                        }`}
                      >
                        Gratis (Rp0)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminFeeOption('custom')}
                        className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition cursor-pointer text-center ${
                          adminFeeOption === 'custom'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-500 font-extrabold'
                            : 'bg-white text-gray-400 border-gray-100 hover:border-emerald-200'
                        }`}
                      >
                        Kustom Manual
                      </button>
                    </div>
                    {adminFeeOption === 'custom' && (
                      <div className="relative mt-2 animate-in slide-in-from-top-2 duration-200">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-500">Rp</span>
                        <input
                          type="number"
                          placeholder="Masukkan Biaya Admin..."
                          value={customAdminFeeValue || ''}
                          onChange={(e) => setCustomAdminFeeValue(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full pl-10 pr-4 py-3 text-xs font-bold border border-emerald-100 bg-emerald-50/20 rounded-xl focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    )}
                  </div>

                  {/* Policy Warnings */}
                  {selectedStudent && tarikAccount === 'Tabungan' && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest block">KEBIJAKAN TABUNGAN</span>
                        <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-amber-800">
                          <p>Jendela: {financialSettings.windowOpen ? 'Terbuka' : 'Terkunci'}</p>
                          <p>Kuota: {withdrawalCount}/{financialSettings.maxWithdrawalsPerYear} Kali</p>
                        </div>
                        {(!financialSettings.windowOpen || withdrawalCount >= financialSettings.maxWithdrawalsPerYear) && (
                          <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                            <input
                              type="checkbox" id="bypass" checked={isBypassed} onChange={(e) => setIsBypassed(e.target.checked)}
                              className="w-4 h-4 accent-amber-600"
                            />
                            <label htmlFor="bypass" className="text-[9px] font-black uppercase text-amber-950">Bypass Persetujuan Bendahara</label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Receiver & Description Options (Pilihan pada Penerima) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">NAMA PENERIMA / PENGAMBIL*</label>
                    <input
                      type="text" required value={withdrawerName} onChange={(e) => setWithdrawerName(e.target.value)}
                      className="w-full px-4 py-3 text-xs font-bold border border-emerald-100 bg-emerald-50/20 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Keterangan*</label>
                    <input
                      type="text" required value={tarikNote} onChange={(e) => setTarikNote(e.target.value)} placeholder="-"
                      className="w-full px-4 py-3 text-xs font-bold border border-emerald-100 bg-emerald-50/20 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Metode Transaksi (Optional) */}
                  <div className="p-4 rounded-2xl bg-red-50/30 border border-red-100/50 space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">METODE TRANSAKSI (OPSIONAL)</label>
                      <span className="text-[9px] text-gray-500 font-medium">Pilih tunai atau transfer bank</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTarikPaymentMethod('Tunai')}
                        className={`py-3 text-[11px] font-black uppercase tracking-widest rounded-xl border-2 transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                          tarikPaymentMethod === 'Tunai'
                            ? 'bg-red-600 text-white border-red-700 font-black shadow-lg shadow-red-600/20 ring-2 ring-red-400/40 scale-[1.02]'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-red-300 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {tarikPaymentMethod === 'Tunai' && <CheckCircle className="w-4 h-4 text-red-200" />}
                        Tunai
                      </button>
                      <button
                        type="button"
                        onClick={() => setTarikPaymentMethod('Transfer')}
                        className={`py-3 text-[11px] font-black uppercase tracking-widest rounded-xl border-2 transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                          tarikPaymentMethod === 'Transfer'
                            ? 'bg-red-600 text-white border-red-700 font-black shadow-lg shadow-red-600/20 ring-2 ring-red-400/40 scale-[1.02]'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-red-300 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {tarikPaymentMethod === 'Transfer' && <CheckCircle className="w-4 h-4 text-red-200" />}
                        Transfer Bank
                      </button>
                    </div>

                    {tarikPaymentMethod === 'Transfer' && (
                      <div className="space-y-3 pt-2 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Nama Bank (Opsional)</label>
                            <input
                              type="text"
                              placeholder="Contoh: BRI, BCA, Mandiri"
                              value={tarikBankName}
                              onChange={(e) => setTarikBankName(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-bold border border-red-100 bg-white rounded-lg focus:outline-none focus:border-red-650"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Nama / No. Rekening (Opsional)</label>
                            <input
                              type="text"
                              placeholder="Contoh: 123456789 a.n Ahmad"
                              value={tarikAccountInfo}
                              onChange={(e) => setTarikAccountInfo(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-bold border border-red-100 bg-white rounded-lg focus:outline-none focus:border-red-650"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Upload Bukti Transfer (Opsional)</label>
                          <div className="flex items-center gap-3">
                            <label className="relative px-4 py-2 bg-white hover:bg-gray-50 border border-red-150 rounded-xl cursor-pointer text-[10px] font-bold text-red-800 flex items-center gap-1.5 transition overflow-hidden">
                              <span>Pilih File Gambar</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onClick={(e) => ((e.target as HTMLInputElement).value = '')}
                                onChange={(e) => handleFileChange(e, setTarikReceipt)}
                              />
                            </label>
                            {tarikReceipt ? (
                              <div className="flex items-center gap-1.5 bg-red-100 text-red-800 py-1 px-2.5 rounded-lg text-[9px] font-bold">
                                <span className="truncate max-w-xs">File berhasil diunggah (Base64)</span>
                                <button
                                  type="button"
                                  onClick={() => setTarikReceipt('')}
                                  className="text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer text-xs font-black"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <span className="text-[9px] text-gray-400 italic">Belum ada file dipilih</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit" disabled={!selectedStudent}
                      className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-[20px] text-xs font-black uppercase tracking-widest shadow-xl shadow-red-900/20 transition active:scale-95 disabled:opacity-50 disabled:scale-100 border-none"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Proses Penarikan & Cetak Struk
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* RECENT TRANSACTION HISTORY (Setor / Tarik) */}
        <div className="bg-white p-6 rounded-[24px] border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-50 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-700" />
              <h3 className="font-extrabold text-emerald-950 text-sm uppercase tracking-wide">
                Riwayat {activeTab === 'setor' ? 'Setor' : 'Tarik'} Dana Terakhir
              </h3>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">5 Transaksi Terakhir</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-emerald-50 text-[10px] font-black uppercase text-emerald-900 tracking-widest">
                  <th className="py-3 px-2">Waktu</th>
                  <th className="py-3 px-2">ID Transaksi</th>
                  <th className="py-3 px-2">Nama Santri</th>
                  <th className="py-3 px-2">Kelas</th>
                  <th className="py-3 px-2">Jenis Akun</th>
                  <th className="py-3 px-2 text-right">Jumlah</th>
                  <th className="py-3 px-2 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 text-xs animate-in fade-in slide-in-from-bottom-2 duration-500">
                {transactions
                  .filter(tx => tx.type === (activeTab === 'setor' ? 'Setor' : 'Tarik'))
                  .slice(0, 5)
                  .map(tx => {
                    const s = students.find(st => st.id === tx.santriId);
                    return (
                      <tr key={tx.id} className="hover:bg-emerald-50/20 transition">
                        <td className="py-3 px-2 font-mono font-bold text-gray-500">
                          {new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          <span className="block text-[8px] text-gray-400">{tx.date}</span>
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-emerald-850">
                          {formatTxId(tx.id, transactions)}
                        </td>
                        <td className="py-3 px-2 font-black text-emerald-950 uppercase">
                          {tx.santriName}
                        </td>
                        <td className="py-3 px-2 font-bold text-gray-600">
                          {tx.santriClass}
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-bold text-gray-600 block">{tx.accountType}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider inline-block mt-1 border ${
                            tx.paymentMethod === 'Transfer' 
                              ? 'bg-blue-50 text-blue-700 border-blue-150' 
                              : 'bg-amber-50 text-amber-700 border-amber-150'
                          }`}>
                            {tx.paymentMethod || 'Tunai'}
                          </span>
                        </td>
                        <td className={`py-3 px-2 text-right font-black ${tx.type === 'Setor' ? 'text-emerald-700' : 'text-red-700'}`}>
                          {formatCurrency(tx.netAmount)}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (s) printReceipt(tx, s, institution, transactions);
                              }}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition border-none bg-transparent cursor-pointer"
                              title="Cetak Nota"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!s) return;
                                if (!s.guardianPhone || s.guardianPhone === '-') {
                                  alert('Nomor HP Wali Santri tidak valid / belum diinput.');
                                  return;
                                }
                                const templateText = institution.waTemplateTransaction || '';
                                const parsedMsg = parseWaTransactionTemplate(
                                  templateText,
                                  tx,
                                  s,
                                  institution,
                                  transactions
                                );
                                const waUrl = getWhatsAppLink(s.guardianPhone, parsedMsg);
                                window.open(waUrl, '_blank');
                              }}
                              className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition border-none bg-transparent cursor-pointer"
                              title="Konfirmasi WA"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {transactions.filter(tx => tx.type === (activeTab === 'setor' ? 'Setor' : 'Tarik')).length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Belum ada transaksi {activeTab === 'setor' ? 'setoran' : 'penarikan'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {successModalData && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Transaksi Berhasil!</h3>
              <p className="text-xs text-gray-500 font-bold">
                {successModalData.tx.type === 'Setor' ? 'Setoran' : 'Penarikan'} sejumlah <span className="text-emerald-700">{formatCurrency(successModalData.tx.amount)}</span> untuk santri <span className="text-gray-900 font-extrabold">{successModalData.student.name}</span> telah sukses diproses.
              </p>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-50/50 text-left text-xs font-semibold space-y-2.5">
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">ID Transaksi</span>
                <span className="font-mono font-extrabold text-emerald-800">{formatTxId(successModalData.tx.id, transactions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Santri</span>
                <span className="text-gray-800 font-extrabold uppercase">{successModalData.student.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Wali Santri</span>
                <span className="text-gray-800 font-extrabold">{successModalData.student.guardianPhone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Jenis Akun</span>
                <span className="text-gray-800 font-extrabold">{successModalData.tx.accountType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Kasir</span>
                <span className="text-gray-800 font-extrabold">{successModalData.tx.cashierName}</span>
              </div>
              {successModalData.tx.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold">Metode Pembayaran</span>
                  <span className="text-gray-800 font-extrabold">{successModalData.tx.paymentMethod}</span>
                </div>
              )}
              {successModalData.tx.paymentMethod === 'Transfer' && (
                <>
                  {successModalData.tx.bankName && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">Bank</span>
                      <span className="text-gray-800 font-extrabold uppercase">{successModalData.tx.bankName}</span>
                    </div>
                  )}
                  {successModalData.tx.accountInfo && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">Rekening</span>
                      <span className="text-gray-800 font-extrabold">{successModalData.tx.accountInfo}</span>
                    </div>
                  )}
                  {successModalData.tx.transferReceiptUrl && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="text-gray-400 font-bold text-left block">Bukti Transfer:</span>
                      <div className="w-full h-32 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center relative">
                        <img
                          src={successModalData.tx.transferReceiptUrl}
                          alt="Bukti Transfer"
                          className="max-w-full max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  printReceipt(successModalData.tx, successModalData.student, institution, transactions);
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 active:scale-95 transition flex items-center justify-center gap-2 border-none cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Bukti
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (!successModalData.student.guardianPhone || successModalData.student.guardianPhone === '-') {
                    alert('Nomor HP Wali Santri tidak valid / belum diinput.');
                    return;
                  }
                  const templateText = institution.waTemplateTransaction || '';
                  const parsedMsg = parseWaTransactionTemplate(
                    templateText,
                    successModalData.tx,
                    successModalData.student,
                    institution,
                    transactions
                  );
                  const waUrl = getWhatsAppLink(successModalData.student.guardianPhone, parsedMsg);
                  window.open(waUrl, '_blank');
                }}
                className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-900/20 active:scale-95 transition flex items-center justify-center gap-2 border-none cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Konfirmasi WA
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSuccessModalData(null)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-extrabold uppercase tracking-widest active:scale-95 transition border-none cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {isCameraOpen && (
        <QrScannerModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}

    </div>
  );
}
