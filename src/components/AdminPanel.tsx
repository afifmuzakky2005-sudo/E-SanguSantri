import React, { useState, useEffect } from 'react';
import { Santri, Transaction, InstitutionSettings, FinancialSettings, User, PendingRegistration } from '../types';
import { calculateBalances } from '../data/mockData';
import { TransactionTrendChart, AllocationPieChart } from './VisualCharts';
import StudentManagement from './StudentManagement';
import SavingsManagement from './SavingsManagement';
import MutasiKas from './MutasiKas';
import Transactions from './Transactions';
import DatabaseBackup from './DatabaseBackup';
import Settings from './Settings';
import UserManagement from './UserManagement';
import RegistrationManagement from './RegistrationManagement';
import StudentImport from './StudentImport';
import ActivityLogView from './ActivityLogView';
import { QrGeneratifView } from './QrGeneratifView';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, FileText,
  LayoutDashboard,
  Users,
  CircleDollarSign,
  TrendingUp,
  Database,
  Sliders,
  LogOut,
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Printer,
  Coins,
  DollarSign,
  UserCheck,
  UserPlus,
  Info,
  MessageSquare,
  Menu,
  X,
  Activity,
  QrCode
} from 'lucide-react';

interface AdminPanelProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  financial: FinancialSettings;
  users: User[];
  registrations: PendingRegistration[];
  activityLogs: any[];
  currentUser: User;
  onLogout: () => void;
  // State update handlers
  onAddStudent: (s: Omit<Santri, 'id'>) => void;
  onEditStudent: (s: Santri) => void;
  onDeleteStudent: (id: string) => void;
  onBulkDeleteStudents?: (ids: string[]) => void;
  onAddTransaction: (t: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string }) => Transaction;
  onSaveInstitution: (inst: InstitutionSettings) => void;
  onSaveFinancial: (fin: FinancialSettings) => void;
  onAddUser: (u: Omit<User, 'id'>) => void;
  onEditUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  onRestoreData: (state: any) => void;
  onSaveFactoryDefault?: () => Promise<boolean>;
  onRestoreFactoryDefault?: () => Promise<boolean>;
  onConfirmRegistration: (regId: string, nis: string, sendWa: boolean) => void;
  onRejectRegistration: (regId: string, reason?: string) => void;
  onConfirmDeposit: (regId: string) => void;
  onDeleteRegistration?: (regId: string) => void;
  onActivateSavings: (id: string) => void;
  onDeactivateSavings: (id: string) => void;
  onBulkDeactivateSavings?: (ids: string[]) => void;
}

export default function AdminPanel({
  students,
  transactions,
  institution,
  financial,
  users,
  registrations,
  activityLogs,
  currentUser,
  onLogout,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onBulkDeleteStudents,
  onAddTransaction,
  onSaveInstitution,
  onSaveFinancial,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onRestoreData,
  onSaveFactoryDefault,
  onRestoreFactoryDefault,
  onConfirmRegistration,
  onRejectRegistration,
  onConfirmDeposit,
  onDeleteRegistration,
  onActivateSavings,
  onDeactivateSavings,
  onBulkDeactivateSavings
}: AdminPanelProps) {
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'datamaster' | 'datatabungan' | 'pendaftaran' | 'pengajuan' | 'transaksi' | 'riwayat' | 'laporan' | 'impor_santri' | 'backup' | 'log_aktifitas' | 'pengaturan' | 'akun_pengguna'>('dashboard');
  const [prefilledTransaction, setPrefilledTransaction] = useState<{
    santriId: string;
    accountType: 'Tabungan' | 'Penitipan';
    amount: number;
    type: 'Setor' | 'Tarik';
    paymentMethod: 'Tunai' | 'Transfer';
    transferReceiptUrl: string;
    registrationId: string;
  } | null>(null);
  const [subReportTab, setSubReportTab] = useState<'tabungan' | 'penitipan' | 'admin'>('tabungan');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const handleApproveDepositRequest = (reg: PendingRegistration) => {
    setPrefilledTransaction({
      santriId: reg.santriId || '',
      accountType: reg.accountType || 'Tabungan',
      amount: reg.amount || 0,
      type: 'Setor',
      paymentMethod: 'Transfer',
      transferReceiptUrl: reg.transferReceiptUrl || '',
      registrationId: reg.id
    });
    setActiveMenu('transaksi');
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser.role === 'Bendahara' && activeMenu !== 'transaksi' && activeMenu !== 'riwayat') {
      setActiveMenu('transaksi');
    } else if (currentUser.role === 'Admin' && (activeMenu === 'laporan' || activeMenu === 'backup' || activeMenu === 'log_aktifitas' || activeMenu === 'akun_pengguna' || activeMenu === 'pengaturan')) {
      setActiveMenu('dashboard');
    }
  }, [currentUser.role, activeMenu]);

  const exportReportExcel = (type: 'tabungan' | 'penitipan' | 'admin') => {
    let wsData: any[] = [];
    let filename = '';

    if (type === 'tabungan') {
      filename = 'Laporan_Akumulasi_Tabungan';
      wsData.push(['LAPORAN AKUMULASI TABUNGAN SANTRI']);
      wsData.push([institution.name]);
      wsData.push([`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}`]);
      wsData.push([]);
      wsData.push(['No', 'NIS', 'Nama Santri', 'Kelas', 'Kamar / Asrama', 'Saldo Tabungan', 'Status Rekening']);
      
      students.forEach((s, idx) => {
        const bal = calculateBalances(s.id, transactions);
        wsData.push([
          idx + 1,
          s.nis,
          s.name,
          s.className,
          s.dorm,
          bal.tabungan,
          'Tabungan Aktif'
        ]);
      });
    } else if (type === 'penitipan') {
      filename = 'Laporan_Akumulasi_Penitipan';
      wsData.push(['LAPORAN AKUMULASI PENITIPAN OPERASIONAL']);
      wsData.push([institution.name]);
      wsData.push([`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}`]);
      wsData.push([]);
      wsData.push(['No', 'NIS', 'Nama Santri', 'Kelas', 'Kamar / Asrama', 'Saldo Titipan', 'Status Rekening']);
      
      students.forEach((s, idx) => {
        const bal = calculateBalances(s.id, transactions);
        wsData.push([
          idx + 1,
          s.nis,
          s.name,
          s.className,
          s.dorm,
          bal.penitipan,
          'Operasional Aktif'
        ]);
      });
    } else if (type === 'admin') {
      filename = 'Rekap_Pendapatan_Admin_Fee';
      wsData.push(['REKAP LAPORAN PENDAPATAN BIAYA ADMINISTRASI']);
      wsData.push([institution.name]);
      wsData.push([`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}`]);
      wsData.push([]);
      wsData.push(['ID Transaksi', 'Tanggal', 'Nama Santri', 'Kelas', 'Jenis Akun', 'Biaya Admin', 'Kasir / Petugas']);
      
      const adminTx = transactions.filter(t => (t.adminFee || 0) > 0);
      adminTx.forEach((t, idx) => {
        wsData.push([
          `TX${String(idx + 1).padStart(7, '0')}`,
          t.date,
          t.santriName,
          t.santriClass,
          t.accountType,
          t.adminFee || 0,
          t.cashierName
        ]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `${filename}.xlsx`);
  };

  const exportReportPDF = (type: 'tabungan' | 'penitipan' | 'admin') => {
    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      let title = '';
      let filename = '';
      let head: string[][] = [];
      let body: any[][] = [];

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      
      if (type === 'tabungan') {
        title = 'LAPORAN AKUMULASI TABUNGAN SANTRI';
        filename = 'Laporan_Tabungan_Santri.pdf';
        head = [['No', 'NIS', 'Nama Santri', 'Kelas', 'Asrama', 'Saldo Tabungan']];
        body = students.map((s, idx) => {
          const bal = calculateBalances(s.id, transactions);
          return [idx + 1, s.nis, s.name, s.className, s.dorm, formatCurrency(bal.tabungan)];
        });

        doc.text(title, pageWidth / 2, 40, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(institution.name, pageWidth / 2, 55, { align: 'center' });
        
        doc.text(`Total Tabungan: ${formatCurrency(totalTabungan)}`, 40, 80);
        doc.text(`Rata-rata: ${formatCurrency(activeStudentsCount > 0 ? (totalTabungan / activeStudentsCount) : 0)}`, 40, 95);
        
        autoTable(doc, {
          startY: 110,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: { fillColor: [6, 95, 70] },
          styles: { fontSize: 8, cellPadding: 4 },
          columnStyles: {
            5: { halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] }
          }
        });
      } else if (type === 'penitipan') {
        title = 'LAPORAN AKUMULASI PENITIPAN OPERASIONAL';
        filename = 'Laporan_Penitipan_Operasional.pdf';
        head = [['No', 'NIS', 'Nama Santri', 'Kelas', 'Asrama', 'Saldo Penitipan']];
        body = students.map((s, idx) => {
          const bal = calculateBalances(s.id, transactions);
          return [idx + 1, s.nis, s.name, s.className, s.dorm, formatCurrency(bal.penitipan)];
        });

        doc.text(title, pageWidth / 2, 40, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(institution.name, pageWidth / 2, 55, { align: 'center' });
        
        doc.text(`Total Penitipan: ${formatCurrency(totalPenitipan)}`, 40, 80);
        doc.text(`Rata-rata: ${formatCurrency(activeStudentsCount > 0 ? (totalPenitipan / activeStudentsCount) : 0)}`, 40, 95);
        
        autoTable(doc, {
          startY: 110,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: { fillColor: [6, 95, 70] },
          styles: { fontSize: 8, cellPadding: 4 },
          columnStyles: {
            5: { halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] }
          }
        });
      } else if (type === 'admin') {
        title = 'REKAP LAPORAN PENDAPATAN BIAYA ADMINISTRASI';
        filename = 'Rekap_Pendapatan_Admin_Fee.pdf';
        head = [['ID Transaksi', 'Tanggal', 'Santri (Kelas)', 'Jenis Akun', 'Biaya Admin', 'Kasir']];
        const adminTx = transactions.filter(t => (t.adminFee || 0) > 0);
        body = adminTx.map((t, idx) => {
          return [`TX${String(idx + 1).padStart(7, '0')}`, t.date, `${t.santriName} (${t.santriClass})`, t.accountType, formatCurrency(t.adminFee), t.cashierName];
        });

        doc.text(title, pageWidth / 2, 40, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(institution.name, pageWidth / 2, 55, { align: 'center' });
        
        doc.text(`Total Pendapatan Admin Fee: ${formatCurrency(totalAdminRevenue)}`, 40, 80);
        
        autoTable(doc, {
          startY: 95,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: { fillColor: [6, 95, 70] },
          styles: { fontSize: 8, cellPadding: 4 },
          columnStyles: {
            4: { halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] }
          }
        });
      }

      doc.save(filename);
    } catch (err: any) {
      alert('Gagal mengekspor PDF: ' + err.message);
    }
  };

  // --- STATS COMPUTATION FOR DASHBOARD ---
  // Total Active Students
  const activeStudentsCount = students.filter(s => s.status === 'Aktif').length;

  // Calculators
  let totalTabungan = 0;
  let totalPenitipan = 0;
  let totalSetorToday = 0;
  let totalTarikToday = 0;

  students.forEach(s => {
    const bal = calculateBalances(s.id, transactions);
    totalTabungan += bal.tabungan;
    totalPenitipan += bal.penitipan;
  });

  const grandTotal = totalTabungan + totalPenitipan;

  // Transactions Today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.date === todayStr);
  const todayCount = todayTransactions.length;
  
  todayTransactions.forEach(t => {
    if (t.type === 'Setor') totalSetorToday += t.amount;
    else totalTarikToday += t.amount;
  });

  // Recent 10 Transactions for Dashboard
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  // Administrative revenue (accumulated admin fees)
  const totalAdminRevenue = transactions.reduce((sum, t) => sum + (t.adminFee || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans relative overflow-hidden">
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`
        fixed md:relative z-50 md:z-auto
        w-64 bg-emerald-900 text-white shrink-0 shadow-xl flex flex-col justify-between
        h-screen transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand Panel */}
          <div className="p-5 bg-emerald-900 flex items-center justify-between border-b border-emerald-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white flex items-center justify-center font-black text-emerald-900 text-xl shadow-sm border border-emerald-700 overflow-hidden shrink-0 rounded-lg">
                {institution.logoUrl ? <img src={institution.logoUrl} className="w-full h-full object-cover bg-white" /> : 'S'}
              </div>
              <div>
                <h1 className="font-black text-lg tracking-tighter uppercase leading-none">
                  <span className="text-white">E</span><span className="text-yellow-400 font-black">-</span><span className="text-white">SANGU</span> <span className="text-yellow-400">SANTRI</span>
                </h1>
                <p className="text-[10px] text-emerald-300 font-extrabold tracking-wider mt-0.5" title={institution.name}>{institution.name}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 hover:bg-emerald-800 rounded-lg transition text-emerald-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            {(currentUser.role === 'Admin' || currentUser.role === 'Master') && (
              <>
                <button
                  onClick={() => { setActiveMenu('dashboard'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                    activeMenu === 'dashboard' 
                      ? 'bg-emerald-700 text-white shadow-md' 
                      : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => { setActiveMenu('pengajuan'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                    activeMenu === 'pengajuan' || activeMenu === 'pendaftaran'
                      ? 'bg-emerald-700 text-white shadow-md' 
                      : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserPlus className="w-4 h-4 shrink-0" />
                    <span>Pengajuan</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {registrations.filter(r => r.status === 'Pending').length > 0 && (
                      <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                        {registrations.filter(r => r.status === 'Pending').length}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </div>
                </button>

                <button
                  onClick={() => { setActiveMenu('datamaster'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                    activeMenu === 'datamaster' 
                      ? 'bg-emerald-700 text-white shadow-md' 
                      : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Data Santri</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => { setActiveMenu('datatabungan'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                    activeMenu === 'datatabungan' 
                      ? 'bg-emerald-700 text-white shadow-md' 
                      : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Coins className="w-4 h-4 shrink-0" />
                    <span>Data Tabungan</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                {financial?.qrBalanceCheckEnabled && (
                  <button
                    onClick={() => { setActiveMenu('qrgeneratif'); setIsMobileMenuOpen(false); }}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                      activeMenu === 'qrgeneratif' 
                        ? 'bg-emerald-700 text-white shadow-md' 
                        : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <QrCode className="w-4 h-4 shrink-0" />
                      <span>QR Generatif</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                )}
              </>
            )}

            <div className="pt-2 pb-1 px-3">
              <span className="text-[9px] font-black text-emerald-500 tracking-widest opacity-50">LOKET KASIR</span>
            </div>

            <button
              onClick={() => { setActiveMenu('transaksi'); setIsMobileMenuOpen(false); }}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                activeMenu === 'transaksi' 
                  ? 'bg-emerald-700 text-white shadow-md' 
                  : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CircleDollarSign className="w-4 h-4 shrink-0" />
                <span>Setor / Tarik Dana</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => { setActiveMenu('riwayat'); setIsMobileMenuOpen(false); }}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                activeMenu === 'riwayat' 
                  ? 'bg-emerald-700 text-white shadow-md' 
                  : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span>Riwayat / Mutasi</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            {currentUser.role === 'Master' && (
              <>
                <div className="pt-2 pb-1 px-3">
                  <span className="text-[9px] font-black text-emerald-500 tracking-widest opacity-50">LAPORAN & SISTEM</span>
                </div>

                <button
                  onClick={() => { setActiveMenu('laporan'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                    activeMenu === 'laporan' 
                      ? 'bg-emerald-700 text-white shadow-md' 
                      : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span>Laporan Keuangan</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => { setActiveMenu('backup'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                    activeMenu === 'backup' 
                      ? 'bg-emerald-700 text-white shadow-md' 
                      : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 shrink-0" />
                    <span>Backup Database</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => { setActiveMenu('log_aktifitas'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                    activeMenu === 'log_aktifitas' 
                      ? 'bg-emerald-700 text-white shadow-md' 
                      : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 shrink-0" />
                    <span>Log Aktifitas</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => { setActiveMenu('akun_pengguna'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                    activeMenu === 'akun_pengguna' 
                      ? 'bg-emerald-700 text-white shadow-md' 
                      : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>Akun Pengguna</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => { setActiveMenu('pengaturan'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                    activeMenu === 'pengaturan' 
                      ? 'bg-emerald-700 text-white shadow-md' 
                      : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 shrink-0" />
                    <span>Pengaturan</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </>
            )}
          </nav>
        </div>

        {/* User Info Section (Moved from top) */}
        <div className="px-5 py-4 bg-emerald-800/20 border-t border-emerald-800/30">
          <div className="text-[10px] text-emerald-400 font-semibold tracking-wider">Petugas Aktif</div>
          <div className="text-xs font-bold text-white mt-0.5">{currentUser.name}</div>
          <div className="inline-flex items-center gap-1 mt-1 bg-yellow-400/20 text-yellow-300 font-bold px-1.5 py-0.5 rounded text-[9px]">
            <UserCheck className="w-2.5 h-2.5" />
            {currentUser.role}
          </div>
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-emerald-800/40 bg-emerald-950/40">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-2 px-3 bg-emerald-950 hover:bg-red-950 text-emerald-200 hover:text-red-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 border border-emerald-800/20 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* MOBILE TOP BAR */}
        <header className="md:hidden flex items-center justify-start gap-3 p-4 bg-emerald-900 text-white shadow-md z-30">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-emerald-800 rounded-lg transition border-none cursor-pointer text-white bg-transparent"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-black text-emerald-900 text-sm border border-emerald-700 shrink-0 overflow-hidden">
              {institution.logoUrl ? <img src={institution.logoUrl} className="w-full h-full object-cover bg-white" /> : 'S'}
            </div>
            <span className="font-black text-sm tracking-tight uppercase">
              <span className="text-white md:text-gray-900">E</span>
              <span className="text-emerald-500">-</span>
              <span className="text-emerald-400 md:text-gray-900">SANGU</span>{' '}
              <span className="text-white md:text-emerald-500">SANTRI</span>
            </span>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto bg-slate-50">
          
          {/* --- MENU VIEW ROUTER --- */}

          {/* VIEW 1: DASHBOARD */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-10">
                <h2 className="text-xl font-black text-emerald-950 tracking-tight uppercase flex items-center gap-2">
                  <LayoutDashboard className="w-6 h-6 text-emerald-600" />
                  DASHBOARD
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start sm:self-center">
                  <div className="text-[10px] font-bold text-sky-700 bg-sky-100 px-3 py-2 rounded-xl uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-sky-200">
                    <Database className="w-3.5 h-3.5" />
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                    Firebase Cloud
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-xl uppercase tracking-widest shadow-sm border border-emerald-200">
                    {currentDateTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {currentDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </div>

            {/* Metrik Utama Row - Improved */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 rounded-[24px] shadow-xl shadow-emerald-900/20 text-white relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                <span className="text-[10px] text-emerald-300 font-black tracking-tighter block opacity-80">Total Saldo</span>
                <div className="text-2xl font-black mt-2 tracking-tighter">{formatCurrency(grandTotal)}</div>
                <div className="flex items-center gap-2 mt-4">
                  <div className="px-2 py-0.5 bg-emerald-400/20 rounded text-[9px] font-bold text-emerald-300 border border-emerald-400/20">GLOBAL BALANCE</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[24px] border border-emerald-100 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-black tracking-tighter block">Tabungan</span>
                  <div className="text-xl font-black text-teal-900 mt-2">{formatCurrency(totalTabungan)}</div>
                </div>
                <div className="w-full h-1 bg-teal-100 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-teal-500" style={{ width: '65%' }}></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[24px] border border-emerald-100 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-black tracking-tighter block">Penitipan</span>
                  <div className="text-xl font-black text-emerald-700 mt-2">{formatCurrency(totalPenitipan)}</div>
                </div>
                <div className="w-full h-1 bg-emerald-100 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[24px] border border-emerald-100 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-black tracking-tighter block">Santri Terdaftar</span>
                  <div className="text-xl font-black text-amber-900 mt-2">{students.length} Santri</div>
                </div>
                <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold text-emerald-600">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  {activeStudentsCount} Aktif
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white p-6 rounded-[24px] border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ArrowDownCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-emerald-950 tracking-tighter">Setoran Hari Ini</h3>
                    <p className="text-lg font-black text-emerald-600">{formatCurrency(totalSetorToday)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[24px] border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                    <ArrowUpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-emerald-950 tracking-tighter">Penarikan Hari Ini</h3>
                    <p className="text-lg font-black text-red-600">{formatCurrency(totalTarikToday)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Trend Chart (Bar Chart) */}
              <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-emerald-100 shadow-sm space-y-4">
                <span className="font-black text-emerald-950 text-sm tracking-tight block">Grafik Arus Kas Bulanan</span>
                <TransactionTrendChart transactions={transactions} />
              </div>

              {/* Pie Allocation Chart */}
              <div className="bg-white p-6 rounded-[24px] border border-emerald-100 shadow-sm space-y-4">
                <span className="font-black text-emerald-950 text-sm tracking-tight block">Alokasi Simpanan</span>
                <AllocationPieChart tabunganTotal={totalTabungan} penitipanTotal={totalPenitipan} />
              </div>

            </div>

            {/* Recent activities ledger */}
            <div className="bg-white p-6 rounded-[24px] border border-emerald-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="font-black text-emerald-950 text-sm tracking-tight">10 Transaksi Terakhir</span>
                <button 
                  onClick={() => setActiveMenu('riwayat')} 
                  className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black uppercase tracking-widest hover:bg-emerald-200 transition"
                >
                  Lihat Mutasi Lengkap
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-50 text-emerald-900 border-b border-emerald-100 font-black text-[10px] uppercase tracking-widest">
                      <th className="p-4">Waktu</th>
                      <th className="p-4">Santri</th>
                      <th className="p-4">Jenis Akun</th>
                      <th className="p-4">Tipe</th>
                      <th className="p-4 text-right">Nominal</th>
                      <th className="p-4">Kasir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors text-xs font-bold">
                        <td className="p-4 font-mono text-gray-400">{new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="p-4 text-emerald-950">{tx.santriName}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            tx.accountType === 'Tabungan' ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {tx.accountType}
                          </span>
                          <span className={`block text-[8px] font-extrabold uppercase mt-1 tracking-wider ${
                            tx.paymentMethod === 'Transfer' ? 'text-blue-600' : 'text-amber-600'
                          }`}>
                            {tx.paymentMethod || 'TUNAI'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`font-black ${tx.type === 'Setor' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {tx.type === 'Setor' ? 'SETOR' : 'TARIK'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-emerald-950">{formatCurrency(tx.amount)}</td>
                        <td className="p-4 text-gray-500 italic font-medium">{tx.cashierName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: DATA MASTER */}
        {activeMenu === 'datamaster' && (
          <StudentManagement
            students={students}
            transactions={transactions}
            institution={institution}
            onAddStudent={onAddStudent}
            onEditStudent={onEditStudent}
            onDeleteStudent={onDeleteStudent}
            onBulkDeleteStudents={onBulkDeleteStudents}
            onActivateSavings={onActivateSavings}
            onDeactivateSavings={onDeactivateSavings}
            institutionClasses={institution.classes}
            allowDeleteWithBalance={financial.allowDeleteWithBalance}
            users={users}
          />
        )}

        {/* VIEW 2.5: DATA TABUNGAN */}
        {activeMenu === 'datatabungan' && (
          <SavingsManagement
            students={students}
            transactions={transactions}
            institution={institution}
            financial={financial}
            onEditStudent={onEditStudent}
            onActivateSavings={onActivateSavings}
            onDeactivateSavings={onDeactivateSavings}
            onBulkDeactivateSavings={onBulkDeactivateSavings}
            institutionClasses={institution.classes}
            registrations={registrations}
            onDeleteRegistration={onDeleteRegistration}
          />
        )}

        {/* VIEW 2.6: QR GENERATIF */}
        {activeMenu === 'qrgeneratif' && (
          <QrGeneratifView
            students={students}
            transactions={transactions}
            institution={institution}
            financial={financial}
          />
        )}

        {/* VIEW: PENDAFTARAN / PENGAJUAN */}
        {(activeMenu === 'pendaftaran' || activeMenu === 'pengajuan') && (
          <RegistrationManagement 
            registrations={registrations}
            onConfirm={onConfirmRegistration}
            onReject={onRejectRegistration}
            onApproveDeposit={handleApproveDepositRequest}
          />
        )}

        {/* VIEW 3: TRANSAKSI (Setor/Tarik) */}
        {activeMenu === 'transaksi' && (
          <Transactions
            students={students}
            transactions={transactions}
            institution={institution}
            financialSettings={financial}
            cashierName={currentUser.name}
            onAddTransaction={onAddTransaction}
            prefilled={prefilledTransaction}
            onClearPrefilled={() => setPrefilledTransaction(null)}
            onConfirmDeposit={onConfirmDeposit}
          />
        )}

        {/* VIEW: RIWAYAT / MUTASI */}
        {activeMenu === 'riwayat' && (
          <MutasiKas
            students={students}
            transactions={transactions}
            institution={institution}
            cashierName={currentUser.name}
          />
        )}

        {/* VIEW 4: LAPORAN & PEMBUKUAN */}
        {activeMenu === 'laporan' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <div>
                <h2 className="text-xl font-black text-emerald-950 tracking-tight uppercase flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  LAPORAN & PEMBUKUAN
                </h2>
                <p className="text-xs text-gray-500 mt-1">Cetak rekapitulasi data tabungan atau penitipan santri.</p>
              </div>
            </div>
            <div className="flex border-b border-gray-200 bg-white p-1.5 rounded-2xl border border-emerald-100 shadow-sm">
              <button
                onClick={() => setSubReportTab('tabungan')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition ${
                  subReportTab === 'tabungan' ? 'bg-emerald-800 text-white shadow-lg' : 'text-gray-500 hover:text-emerald-700'
                }`}
              >
                Tabungan
              </button>
              <button
                onClick={() => setSubReportTab('penitipan')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition ${
                  subReportTab === 'penitipan' ? 'bg-emerald-800 text-white shadow-lg' : 'text-gray-500 hover:text-emerald-700'
                }`}
              >
                Penitipan
              </button>
              <button
                onClick={() => setSubReportTab('admin')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition ${
                  subReportTab === 'admin' ? 'bg-emerald-800 text-white shadow-lg' : 'text-gray-500 hover:text-emerald-700'
                }`}
              >
                Rekap Admin Fee
              </button>
            </div>

            {/* TAB 1: LAPORAN TABUNGAN */}
            {subReportTab === 'tabungan' && (
              <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 pb-3 gap-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">Laporan Akumulasi Tabungan</h3>
                    <p className="text-[10px] text-gray-400">Total dana simpanan wajib santri berdasarkan kelas.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportReportExcel('tabungan')}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileDown className="w-4 h-4" />
                      Excel
                    </button>
                    <button
                      onClick={() => exportReportPDF('tabungan')}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Cetak / PDF
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                    <span className="text-gray-500 block">Total Tabungan Santri</span>
                    <span className="text-lg font-bold text-teal-950 block mt-1">{formatCurrency(totalTabungan)}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block">Rata-rata Tabungan Per Santri</span>
                    <span className="text-lg font-bold text-gray-800 block mt-1">{formatCurrency(activeStudentsCount > 0 ? (totalTabungan / activeStudentsCount) : 0)}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block">Status Penarikan Tabungan</span>
                    <span className={`text-xs font-bold px-2 py-1 inline-block rounded mt-2 ${financial.windowOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {financial.windowOpen ? 'TERBUKA / AMBIL BEBAS' : 'TERKUNCI / TERENCANA'}
                    </span>
                  </div>
                </div>

                {/* Ledger overview per student */}
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold">
                        <th className="p-3">Nama Santri (NIS)</th>
                        <th className="p-3">Kelas</th>
                        <th className="p-3">Kamar / Asrama</th>
                        <th className="p-3 text-right">Saldo Tabungan</th>
                        <th className="p-3 text-center">Status Rekening</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map(s => {
                        const bal = calculateBalances(s.id, transactions);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-gray-800">{s.name} <span className="text-[10px] block font-mono font-normal text-gray-400">NIS: {s.nis}</span></td>
                            <td className="p-3 text-gray-600">{s.className}</td>
                            <td className="p-3 text-gray-500">{s.dorm}</td>
                            <td className="p-3 text-right font-bold text-teal-800">{formatCurrency(bal.tabungan)}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                                Tabungan Aktif
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: LAPORAN PENITIPAN */}
            {subReportTab === 'penitipan' && (
              <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 pb-3 gap-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">Laporan Akumulasi Penitipan</h3>
                    <p className="text-[10px] text-gray-400">Arus sisa saldo operasional harian yang dapat diambil sewaktu-waktu.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportReportExcel('penitipan')}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileDown className="w-4 h-4" />
                      Excel
                    </button>
                    <button
                      onClick={() => exportReportPDF('penitipan')}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Cetak / PDF
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-gray-500 block">Total Penitipan</span>
                    <span className="text-lg font-bold text-emerald-950 block mt-1">{formatCurrency(totalPenitipan)}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block">Rata-rata Uang Saku Per Anak</span>
                    <span className="text-lg font-bold text-gray-800 block mt-1">{formatCurrency(activeStudentsCount > 0 ? (totalPenitipan / activeStudentsCount) : 0)}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block">Aturan Tarik Harian</span>
                    <span className="text-xs font-bold block text-emerald-700 mt-2">
                      BEBAS / KAPAN SAJA (KASIR BUKA)
                    </span>
                  </div>
                </div>

                {/* Ledger overview per student */}
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold">
                        <th className="p-3">Nama Santri (NIS)</th>
                        <th className="p-3">Kelas</th>
                        <th className="p-3">Kamar / Asrama</th>
                        <th className="p-3 text-right">Saldo Titipan Operasional</th>
                        <th className="p-3 text-center">Status Rekening</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map(s => {
                        const bal = calculateBalances(s.id, transactions);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-gray-800">{s.name} <span className="text-[10px] block font-mono font-normal text-gray-400">NIS: {s.nis}</span></td>
                            <td className="p-3 text-gray-600">{s.className}</td>
                            <td className="p-3 text-gray-500">{s.dorm}</td>
                            <td className="p-3 text-right font-bold text-emerald-800">{formatCurrency(bal.penitipan)}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Operasional Aktif
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: REKAP PENDAPATAN ADMIN */}
            {subReportTab === 'admin' && (
              <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 pb-3 gap-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">Rekap Laporan Pendapatan Biaya Administrasi</h3>
                    <p className="text-[10px] text-gray-400">Akumulasi pendapatan operasional lembaga dari biaya admin penarikan.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportReportExcel('admin')}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileDown className="w-4 h-4" />
                      Excel
                    </button>
                    <button
                      onClick={() => exportReportPDF('admin')}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Cetak / PDF
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <span className="text-gray-600 block font-semibold uppercase tracking-wider text-[10px]">Total Akumulasi Pendapatan Admin</span>
                    <span className="text-2xl font-black text-amber-950 block mt-1.5">{formatCurrency(totalAdminRevenue)}</span>
                    <span className="text-[9px] text-amber-700 block mt-1">Dialokasikan untuk kas operasional kasir / ustadz</span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col justify-center">
                    <span className="text-gray-500 block">Tarif Admin Tabungan</span>
                    <span className="text-base font-bold text-gray-800 block mt-1">
                      {financial.adminFeeTabunganEnabled ? `${formatCurrency(financial.adminFeeTabunganAmount)} / Penarikan` : 'Tidak Aktif (Gratis)'}
                    </span>
                    <span className="text-gray-500 block mt-2">Tarif Admin Penitipan</span>
                    <span className="text-base font-bold text-gray-800 block mt-1">
                      {financial.adminFeePenitipanEnabled ? `${formatCurrency(financial.adminFeePenitipanAmount)} / Penarikan` : 'Tidak Aktif (Gratis)'}
                    </span>
                  </div>
                </div>

                {/* Listing of fee transactions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700">Rincian Transaksi Yang Memotong Biaya Admin</h4>
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold">
                          <th className="p-2.5">ID Transaksi</th>
                          <th className="p-2.5">Tanggal</th>
                          <th className="p-2.5">Santri (Kelas)</th>
                          <th className="p-2.5">Jenis Akun</th>
                          <th className="p-2.5 text-right font-bold">Biaya Admin</th>
                          <th className="p-2.5">Kasir / Petugas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transactions.filter(t => (t.adminFee || 0) > 0).length > 0 ? (
                          transactions.filter(t => (t.adminFee || 0) > 0).map((t, idx) => {
                            const formattedId = `TX${String(idx + 1).padStart(7, '0')}`;
                            return (
                              <tr key={t.id} className="hover:bg-slate-50/50">
                                <td className="p-2.5 font-mono text-gray-500">{formattedId}</td>
                                <td className="p-2.5">{t.date}</td>
                                <td className="p-2.5 font-medium">{t.santriName} <span className="text-[10px] text-gray-400 block">{t.santriClass}</span></td>
                                <td className="p-2.5">{t.accountType}</td>
                                <td className="p-2.5 text-right font-bold text-amber-800">{formatCurrency(t.adminFee)}</td>
                                <td className="p-2.5 text-gray-600 italic">{t.cashierName}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-5 text-center text-gray-400">
                              Belum ada penarikan yang dikenakan biaya administrasi.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* VIEW 5.5: IMPOR DATA SANTRI */}
        {activeMenu === 'impor_santri' && (
          <StudentImport
            students={students}
            institution={institution}
            onAddStudent={onAddStudent}
            institutionClasses={institution.classes}
          />
        )}

        {/* VIEW 6: BACKUP & DATABASE OPERATIONS */}
        {activeMenu === 'backup' && (
          <DatabaseBackup
            students={students}
            transactions={transactions}
            institution={institution}
            financial={financial}
            onRestoreData={onRestoreData}
            onSaveFactoryDefault={onSaveFactoryDefault}
            onRestoreFactoryDefault={onRestoreFactoryDefault}
            users={users}
          />
        )}

        {/* VIEW 6.5: LOG AKTIFITAS */}
        {activeMenu === 'log_aktifitas' && (
          <ActivityLogView activityLogs={activityLogs} />
        )}

        {/* VIEW 6: APP SETTINGS */}
        {activeMenu === 'pengaturan' && (
          <Settings
            institution={institution}
            financial={financial}
            onSaveInstitution={onSaveInstitution}
            onSaveFinancial={onSaveFinancial}
            users={users}
            onRestoreFactoryDefault={onRestoreFactoryDefault}
          />
        )}

        {/* VIEW 7: USER MANAGEMENT */}
        {activeMenu === 'akun_pengguna' && (
          <UserManagement
            users={users}
            onAddUser={onAddUser}
            onEditUser={onEditUser}
            onDeleteUser={onDeleteUser}
            currentUser={currentUser}
          />
        )}

      </div>
        {showLogoutConfirm && (<div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"><div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-300"><div className="mx-auto w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center"><LogOut className="w-6 h-6" /></div><div className="space-y-2"><h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Konfirmasi Keluar</h3><p className="text-xs text-gray-500 font-bold">Apakah Anda yakin ingin keluar dari sesi admin?</p></div><div className="flex gap-3"><button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold rounded-xl text-xs transition-colors border-none cursor-pointer uppercase tracking-wider">Batal</button><button onClick={() => { setShowLogoutConfirm(false); onLogout(); }} className="flex-1 py-3 text-white bg-red-600 hover:bg-red-700 font-bold rounded-xl text-xs transition-colors shadow-md shadow-red-200 border-none cursor-pointer uppercase tracking-wider">Ya, Keluar</button></div></div></div>)}
      </main>

    </div>
  );
}
