import React, { useState } from 'react';
import { Database, Download, Upload, ShieldCheck, Zap, RefreshCw, AlertTriangle, FileJson, FileSpreadsheet, FileText, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Santri, Transaction, InstitutionSettings, FinancialSettings, User } from '../types';
import { calculateBalances } from '../data/mockData';

interface DatabaseBackupProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  financial: FinancialSettings;
  onRestoreData: (restoredState: any) => void;
  onSaveFactoryDefault?: () => Promise<boolean>;
  onRestoreFactoryDefault?: () => Promise<boolean>;
  users?: User[];
}

export default function DatabaseBackup({
  students,
  transactions,
  institution,
  financial,
  onRestoreData,
  onSaveFactoryDefault,
  onRestoreFactoryDefault,
  users = []
}: DatabaseBackupProps) {
  const [password, setPassword] = useState('');
  const [factoryAction, setFactoryAction] = useState<'save' | 'restore' | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Export checklist state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelections, setExportSelections] = useState({
    santri: true,
    transactions: true,
    institution: true,
    financial: true,
    users: true
  });

  // Import checklist state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSelections, setImportSelections] = useState({
    santri: true,
    transactions: true,
    institution: true,
    financial: true,
    users: true
  });
  const [uploadedJsonData, setUploadedJsonData] = useState<any>(null);
  const [availableImportKeys, setAvailableImportKeys] = useState({
    santri: false,
    transactions: false,
    institution: false,
    financial: false,
    users: false
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processJsonFile(file);
    }
  };

  const processJsonFile = (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert('File harus berformat JSON!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Scan what sections are present in this JSON file
        const hasSantri = !!parsed.esangu_santri;
        const hasTransactions = !!parsed.esangu_transactions;
        const hasInstitution = !!parsed.esangu_institution;
        const hasFinancial = !!parsed.esangu_financial;
        const hasUsers = !!parsed.esangu_users;

        if (!hasSantri && !hasTransactions && !hasInstitution && !hasFinancial && !hasUsers) {
          throw new Error('Berkas JSON tidak valid atau kosong.');
        }

        setUploadedJsonData(parsed);
        setAvailableImportKeys({
          santri: hasSantri,
          transactions: hasTransactions,
          institution: hasInstitution,
          financial: hasFinancial,
          users: hasUsers
        });
        setImportSelections({
          santri: hasSantri,
          transactions: hasTransactions,
          institution: hasInstitution,
          financial: hasFinancial,
          users: hasUsers
        });
        setShowImportModal(true);
      } catch (err: any) {
        alert('Gagal membaca file backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processJsonFile(file);
    e.target.value = '';
  };

  const executeImport = async () => {
    if (!uploadedJsonData) return;

    try {
      const parsed = uploadedJsonData;
      const firebaseStateToSave: any = {};

      if (importSelections.santri && parsed.esangu_santri) {
        localStorage.setItem('esangu_santri', parsed.esangu_santri);
        try {
          firebaseStateToSave.santri = JSON.parse(parsed.esangu_santri);
        } catch (e) {}
      }
      if (importSelections.transactions && parsed.esangu_transactions) {
        localStorage.setItem('esangu_transactions', parsed.esangu_transactions);
        try {
          firebaseStateToSave.transactions = JSON.parse(parsed.esangu_transactions);
        } catch (e) {}
      }
      if (importSelections.institution && parsed.esangu_institution) {
        localStorage.setItem('esangu_institution', parsed.esangu_institution);
        try {
          firebaseStateToSave.institution = JSON.parse(parsed.esangu_institution);
        } catch (e) {}
      }
      if (importSelections.financial && parsed.esangu_financial) {
        localStorage.setItem('esangu_financial', parsed.esangu_financial);
        try {
          firebaseStateToSave.financial = JSON.parse(parsed.esangu_financial);
        } catch (e) {}
      }
      if (importSelections.users && parsed.esangu_users) {
        localStorage.setItem('esangu_users', parsed.esangu_users);
        try {
          firebaseStateToSave.users = JSON.parse(parsed.esangu_users);
        } catch (e) {}
      }

      // Save to Firebase securely and refresh
      const { saveFirebaseData } = await import('../lib/firebaseStore');
      await saveFirebaseData(firebaseStateToSave);

      onRestoreData(parsed);
      alert('PEMULIHAN BERHASIL! Data terpilih telah dipulihkan ke local storage dan cloud database.');
      setShowImportModal(false);
      setUploadedJsonData(null);
    } catch (err: any) {
      alert('Gagal memproses pemulihan data: ' + err.message);
    }
  };

  // Download Backup Manual
  const handleDownloadBackup = () => {
    setExportSelections({
      santri: true,
      transactions: true,
      institution: true,
      financial: true,
      users: true
    });
    setShowExportModal(true);
  };

  const executeExport = () => {
    const fullState: any = {
      backupDate: new Date().toISOString()
    };

    if (exportSelections.santri) {
      fullState.esangu_santri = localStorage.getItem('esangu_santri') || JSON.stringify(students);
    }
    if (exportSelections.transactions) {
      fullState.esangu_transactions = localStorage.getItem('esangu_transactions') || JSON.stringify(transactions);
    }
    if (exportSelections.institution) {
      fullState.esangu_institution = localStorage.getItem('esangu_institution') || JSON.stringify(institution);
    }
    if (exportSelections.financial) {
      fullState.esangu_financial = localStorage.getItem('esangu_financial') || JSON.stringify(financial);
    }
    if (exportSelections.users) {
      fullState.esangu_users = localStorage.getItem('esangu_users') || JSON.stringify(users);
    }

    const blob = new Blob([JSON.stringify(fullState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_database_esangu_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowExportModal(false);
  };

  const handleDownloadExcel = () => {
    try {
      // 1. Sheet Data Santri
      const studentData = students.map(s => {
        const bal = calculateBalances(s.id, transactions);
        return {
          'NIS': s.nis,
          'Nama Lengkap': s.name,
          'Kelas': s.className,
          'Asrama': s.dorm || '-',
          'No. WhatsApp Wali': s.guardianPhone || '-',
          'Status Santri': s.status,
          'Status Tabungan': s.hasSavings ? 'Aktif' : 'Tutup',
          'Saldo Tabungan': bal.tabungan,
          'Saldo Penitipan': bal.penitipan,
          'Total Saldo': bal.total
        };
      });

      // 2. Sheet Riwayat Transaksi
      const transactionData = transactions.map(tx => {
        const s = students.find(st => st.id === tx.santriId);
        const nis = s ? s.nis : '';
        return {
          'ID Transaksi': tx.id,
          'Waktu': new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          'Tanggal': tx.date,
          'NIS': nis,
          'Nama Santri': tx.santriName,
          'Kelas': tx.santriClass,
          'Akun': tx.accountType,
          'Jenis Transaksi': tx.type,
          'Jumlah': tx.amount,
          'Biaya Admin': tx.adminFee || 0,
          'Net Jumlah': tx.netAmount,
          'Catatan': tx.note || '-',
          'Kasir': tx.cashierName || '-'
        };
      });

      // 3. Sheet Ringkasan Laporan
      const totalSavings = students.reduce((sum, s) => sum + (s.hasSavings ? calculateBalances(s.id, transactions).tabungan : 0), 0);
      const totalPenitipan = students.reduce((sum, s) => sum + (s.hasSavings ? calculateBalances(s.id, transactions).penitipan : 0), 0);
      const summaryData = [
        { 'Kategori': 'Nama Lembaga', 'Nilai': institution.name },
        { 'Kategori': 'Total Santri Terdaftar', 'Nilai': students.length },
        { 'Kategori': 'Akun Tabungan Aktif', 'Nilai': students.filter(s => s.hasSavings).length },
        { 'Kategori': 'Total Saldo Tabungan', 'Nilai': totalSavings },
        { 'Kategori': 'Total Saldo Penitipan', 'Nilai': totalPenitipan },
        { 'Kategori': 'Total Seluruh Saldo Sangu', 'Nilai': totalSavings + totalPenitipan },
        { 'Kategori': 'Batas Maksimum Tarikan Per Tahun', 'Nilai': financial.maxWithdrawalsPerYear || 0 }
      ];

      const wb = XLSX.utils.book_new();

      const wsStudents = XLSX.utils.json_to_sheet(studentData);
      XLSX.utils.book_append_sheet(wb, wsStudents, 'Data Santri & Tabungan');

      const wsTransactions = XLSX.utils.json_to_sheet(transactionData);
      XLSX.utils.book_append_sheet(wb, wsTransactions, 'Riwayat Transaksi');

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Laporan');

      XLSX.writeFile(wb, `ekspor_database_esangu_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err: any) {
      alert('Gagal mengekspor ke Excel: ' + err.message);
    }
  };

  const handleDownloadPDF = () => {
    try {
      const totalSavings = students.reduce((sum, s) => sum + (s.hasSavings ? calculateBalances(s.id, transactions).tabungan : 0), 0);
      const totalPenitipan = students.reduce((sum, s) => sum + (s.hasSavings ? calculateBalances(s.id, transactions).penitipan : 0), 0);
      const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
      };

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Gagal membuka jendela cetak. Pastikan popup block dinonaktifkan!');
        return;
      }

      const studentsHtml = students.map(s => {
        const bal = calculateBalances(s.id, transactions);
        return `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 8px;">${s.nis}</td>
            <td style="padding: 8px;"><b>${s.name}</b></td>
            <td style="padding: 8px;">${s.className}</td>
            <td style="padding: 8px;">${s.dorm || '-'}</td>
            <td style="padding: 8px; text-align: right;">${formatCurrency(bal.tabungan)}</td>
            <td style="padding: 8px; text-align: right;">${formatCurrency(bal.penitipan)}</td>
            <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(bal.total)}</td>
          </tr>
        `;
      }).join('');

      const transactionsHtml = transactions.slice(0, 100).map(tx => {
        return `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px;">
            <td style="padding: 6px;">${tx.date}</td>
            <td style="padding: 6px;">${tx.id.substring(0, 8)}</td>
            <td style="padding: 6px;">${tx.santriName}</td>
            <td style="padding: 6px;">${tx.accountType}</td>
            <td style="padding: 6px; text-align: center;">${tx.type === 'Setor' ? '<span style="color: green;">Setor</span>' : '<span style="color: red;">Tarik</span>'}</td>
            <td style="padding: 6px; text-align: right;">${formatCurrency(tx.amount)}</td>
            <td style="padding: 6px; text-align: right;">${formatCurrency(tx.adminFee || 0)}</td>
            <td style="padding: 6px; text-align: right; font-weight: bold;">${formatCurrency(tx.netAmount)}</td>
          </tr>
        `;
      }).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Laporan Database Lengkap - E-Sangu Santri</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; line-height: 1.4; }
              h1, h2, h3 { text-transform: uppercase; margin-top: 0; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th { background-color: #f1f5f9; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
              .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 30px; }
              .grid { display: grid; grid-template-cols: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
              .card { border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; background-color: #f8fafc; }
              .card h3 { font-size: 12px; color: #64748b; margin-bottom: 10px; }
              .card p { font-size: 18px; font-weight: bold; margin: 0; color: #0f172a; }
              @media print {
                .no-print { display: none; }
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="margin-bottom: 20px; text-align: right;">
              <button onclick="window.print()" style="padding: 12px 24px; background-color: #047857; color: white; border: none; font-weight: bold; border-radius: 6px; cursor: pointer;">Cetak Laporan / Simpan PDF</button>
            </div>
            
            <div class="header">
              <h1 style="margin-bottom: 5px; color: #065f46;">\${institution.name}</h1>
              <p style="margin: 0; font-size: 12px; color: #64748b; letter-spacing: 1px;">SISTEM KEUANGAN E-SANGU SANTRI • LAPORAN DATABASE UTUH</p>
              <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: bold;">Tanggal Unduh: \${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <div class="grid">
              <div class="card">
                <h3>TOTAL SALDO TABUNGAN SANTRI</h3>
                <p>\${formatCurrency(totalSavings)}</p>
              </div>
              <div class="card">
                <h3>TOTAL SALDO PENITIPAN SANTRI</h3>
                <p>\${formatCurrency(totalPenitipan)}</p>
              </div>
              <div class="card">
                <h3>TOTAL SANTRI TERDAFTAR</h3>
                <p>\${students.length} Santri</p>
              </div>
              <div class="card">
                <h3>TABUNGAN AKTIF</h3>
                <p>\${students.filter(s => s.hasSavings).length} Akun</p>
              </div>
            </div>

            <h2 style="font-size: 14px; border-bottom: 2px solid #065f46; padding-bottom: 5px; margin-bottom: 15px; color: #065f46;">1. DATA SANTRI & SALDO TABUNGAN</h2>
            <table>
              <thead>
                <tr>
                  <th>NIS</th>
                  <th>Nama Lengkap</th>
                  <th>Kelas</th>
                  <th>Asrama</th>
                  <th style="text-align: right;">Saldo Tabungan</th>
                  <th style="text-align: right;">Saldo Penitipan</th>
                  <th style="text-align: right;">Total Saldo</th>
                </tr>
              </thead>
              <tbody>
                \${studentsHtml}
              </tbody>
            </table>

            <div style="page-break-before: always;"></div>

            <h2 style="font-size: 14px; border-bottom: 2px solid #065f46; padding-bottom: 5px; margin-bottom: 15px; color: #065f46;">2. RIWAYAT TRANSAKSI TERAKHIR (BATASAN 100 TX)</h2>
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>ID Transaksi</th>
                  <th>Nama Santri</th>
                  <th>Akun</th>
                  <th style="text-align: center;">Jenis</th>
                  <th style="text-align: right;">Jumlah</th>
                  <th style="text-align: right;">Biaya Admin</th>
                  <th style="text-align: right;">Net Jumlah</th>
                </tr>
              </thead>
              <tbody>
                \${transactionsHtml}
              </tbody>
            </table>

            <div style="margin-top: 50px; text-align: right; font-size: 12px;">
              <p>Mengetahui,</p>
              <br/><br/><br/>
              <p><b>\${institution.director}</b></p>
              <p style="color: #64748b; font-size: 10px;">Kepala Pengurus Pondok Pesantren</p>
            </div>
            
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err: any) {
      alert('Gagal mengekspor ke PDF: ' + err.message);
    }
  };



  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-xl font-black text-emerald-950 tracking-tight uppercase flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-600" />
            MANAJEMEN CADANGAN & PEMULIHAN BASIS DATA
          </h2>
          <p className="text-xs text-gray-500 mt-1">Amankan data transaksi, saldo santri, dan pengaturan keuangan. Anda dapat mengunduh salinan database penuh atau memulihkannya kembali dari file cadangan lama.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Backup Column */}
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
          <span className="font-bold text-gray-800 block text-[11px] uppercase tracking-wider border-b border-gray-100 pb-2">1. Cadangkan Data (Backup)</span>

          <div className="space-y-4">
            <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-lg space-y-2">
              <h4 className="font-bold text-gray-700">Backup Manual Instan</h4>
              <p className="text-[11px] text-gray-500">Unduh data santri, setoran, penarikan, dan setelan identitas dalam satu paket berkas JSON terkompresi.</p>
              <button
                onClick={handleDownloadBackup}
                className="w-full mt-1.5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-900/10 border-none"
              >
                <Download className="w-4 h-4" />
                Unduh Database Sekarang (.json)
              </button>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={handleDownloadExcel}
                  className="py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm border-none"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Ekspor Excel
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm border-none"
                >
                  <FileText className="w-4 h-4" />
                  Ekspor PDF
                </button>
              </div>
            </div>

            {/* Backup Manual Instan only */}
          </div>
        </div>

        {/* Restore & Maintenance Column */}
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
          <span className="font-bold text-gray-800 block text-[11px] uppercase tracking-wider border-b border-gray-100 pb-2">2. Pemulihan & Pemeliharaan (Restore & Clean)</span>

          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                Otoritas Pemulihan
              </div>
              <p className="text-[10px] text-emerald-700">Unggah file backup `.json` untuk mengganti data sistem saat ini secara instan.</p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-emerald-600 bg-emerald-50/50 scale-[0.99]'
                  : 'border-emerald-200 hover:border-emerald-500 bg-slate-50 hover:bg-white'
              }`}
              onClick={() => document.getElementById('json-upload-input')?.click()}
            >
              <input
                id="json-upload-input"
                type="file"
                accept=".json"
                onChange={handleFileRestore}
                className="hidden"
              />
              <FileJson className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-emerald-950 text-xs">
                Klik untuk memilih file atau seret file JSON ke sini
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Format file harus .json (Backup database E-Sangu)
              </p>
            </div>

            {/* FACTORY RESET FEATURES */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="font-bold text-emerald-900 text-sm uppercase tracking-tight">Pengaturan Pabrik</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setFactoryAction('save')}
                  className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-xl text-[10px] uppercase tracking-widest transition cursor-pointer border-none flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Jadikan Acuan Pabrik
                </button>
                <button
                  onClick={() => setFactoryAction('restore')}
                  className="py-3 px-4 bg-red-100 hover:bg-red-200 text-red-700 font-black rounded-xl text-[10px] uppercase tracking-widest transition cursor-pointer border-none flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Kembalikan ke Pabrik
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FACTORY PASSWORD MODAL */}
      {factoryAction && (
        <div className="fixed inset-0 bg-emerald-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Konfirmasi Otoritas Master</h3>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                {factoryAction === 'save' 
                  ? 'Anda akan menyimpan data saat ini sebagai acuan pabrik. Masukkan password Master untuk melanjutkan.'
                  : 'Anda akan menimpa seluruh data saat ini dengan data acuan pabrik. Masukkan password Master untuk melanjutkan.'}
              </p>
            </div>
            <input
              type="password"
              placeholder="Password Master"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-emerald-100 bg-emerald-50 rounded-xl focus:outline-none focus:border-emerald-500 text-center text-sm font-bold tracking-widest"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setFactoryAction(null);
                  setPassword('');
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  let valid = false;
                  
                  // Use passed 'users' prop if available
                  const masterPasswords = users
                    .filter(u => u.role === 'Master' && u.isActive !== false)
                    .map(u => u.password)
                    .filter(Boolean) as string[];

                  if (masterPasswords.length > 0) {
                    valid = masterPasswords.includes(password) || password === 'master123';
                  } else {
                    // Fallback to checking localStorage 'esangu_users'
                    const usersStr = localStorage.getItem('esangu_users');
                    if (usersStr) {
                      try {
                        const parsedUsers = JSON.parse(usersStr) as User[];
                        const masterPws = parsedUsers
                          .filter(u => u.role === 'Master' && u.isActive !== false)
                          .map(u => u.password)
                          .filter(Boolean) as string[];
                        valid = masterPws.includes(password) || password === 'master123';
                      } catch (e) {
                        valid = password === 'master123';
                      }
                    } else {
                      valid = password === 'master123';
                    }
                  }

                  if (!valid) {
                    alert('Password salah atau Anda bukan Master!');
                    return;
                  }

                  if (factoryAction === 'save') {
                    if (onSaveFactoryDefault) {
                      onSaveFactoryDefault().then(success => {
                        if (success) {
                          alert('Data saat ini berhasil disimpan sebagai acuan pengaturan pabrik!');
                        } else {
                          alert('Gagal menyimpan acuan pengaturan pabrik.');
                        }
                      });
                    } else {
                      const fullState = {
                        esangu_santri: localStorage.getItem('esangu_santri'),
                        esangu_transactions: localStorage.getItem('esangu_transactions'),
                        esangu_institution: localStorage.getItem('esangu_institution'),
                        esangu_financial: localStorage.getItem('esangu_financial'),
                        esangu_users: localStorage.getItem('esangu_users'),
                      };
                      localStorage.setItem('esangu_factory_default', JSON.stringify(fullState));
                      alert('Data saat ini berhasil disimpan sebagai pengaturan pabrik!');
                    }
                  } else if (factoryAction === 'restore') {
                    if (onRestoreFactoryDefault) {
                      alert('Sedang memproses pemulihan ke setelan pabrik... Mohon tunggu sebentar.');
                      onRestoreFactoryDefault().then(success => {
                        if (success) {
                          alert('Sistem berhasil dikembalikan ke pengaturan pabrik! Semua data, riwayat, log, dan settingan telah disetel ulang.');
                        } else {
                          alert('Gagal melakukan pemulihan setelan pabrik.');
                        }
                      });
                    } else {
                      const factoryStr = localStorage.getItem('esangu_factory_default');
                      if (factoryStr) {
                        try {
                          const parsed = JSON.parse(factoryStr);
                          localStorage.setItem('esangu_santri', parsed.esangu_santri || '[]');
                          localStorage.setItem('esangu_transactions', parsed.esangu_transactions || '[]');
                          if (parsed.esangu_institution) localStorage.setItem('esangu_institution', parsed.esangu_institution);
                          if (parsed.esangu_financial) localStorage.setItem('esangu_financial', parsed.esangu_financial);
                          if (parsed.esangu_users) localStorage.setItem('esangu_users', parsed.esangu_users);
                          onRestoreData(parsed);
                          alert('Sistem berhasil dikembalikan ke pengaturan pabrik!');
                        } catch (e) {
                          alert('Gagal memulihkan pengaturan pabrik.');
                        }
                      } else {
                        alert('Belum ada data acuan pabrik yang disimpan!');
                      }
                    }
                  }
                  
                  setFactoryAction(null);
                  setPassword('');
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-red-900/10 cursor-pointer border-none"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT CHECKLIST MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-emerald-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Pilih Data yang Ingin Diekspor</h3>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                Pilih bagian data mana saja yang ingin Anda sertakan di dalam file cadangan JSON ini.
              </p>
            </div>

            <div className="space-y-3 text-left bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
              <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={exportSelections.santri}
                  onChange={(e) => setExportSelections(prev => ({ ...prev, santri: e.target.checked }))}
                  className="w-4.5 h-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <div className="text-xs font-bold text-emerald-950">
                  Data Santri & Rekening Tabungan
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={exportSelections.transactions}
                  onChange={(e) => setExportSelections(prev => ({ ...prev, transactions: e.target.checked }))}
                  className="w-4.5 h-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <div className="text-xs font-bold text-emerald-950">
                  Riwayat Mutasi & Laporan Transaksi
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={exportSelections.institution}
                  onChange={(e) => setExportSelections(prev => ({ ...prev, institution: e.target.checked }))}
                  className="w-4.5 h-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <div className="text-xs font-bold text-emerald-950">
                  Pengaturan Identitas Lembaga
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={exportSelections.financial}
                  onChange={(e) => setExportSelections(prev => ({ ...prev, financial: e.target.checked }))}
                  className="w-4.5 h-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <div className="text-xs font-bold text-emerald-950">
                  Kebijakan & Aturan Keuangan
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={exportSelections.users}
                  onChange={(e) => setExportSelections(prev => ({ ...prev, users: e.target.checked }))}
                  className="w-4.5 h-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <div className="text-xs font-bold text-emerald-950">
                  Daftar Akun Pengguna / Operator
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeExport}
                disabled={!Object.values(exportSelections).some(Boolean)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-emerald-900/10 cursor-pointer border-none"
              >
                Unduh File JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT CHECKLIST MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-emerald-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Pilih Data yang Ingin Diimpor</h3>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                Pilih bagian data mana saja dari berkas cadangan Anda yang ingin dimasukkan ke dalam sistem saat ini.
              </p>
            </div>

            <div className="space-y-3 text-left bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
              {availableImportKeys.santri ? (
                <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={importSelections.santri}
                    onChange={(e) => setImportSelections(prev => ({ ...prev, santri: e.target.checked }))}
                    className="w-4.5 h-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <div className="text-xs font-bold text-emerald-950">
                    Data Santri & Rekening Tabungan <span className="text-[10px] text-emerald-600">(Tersedia)</span>
                  </div>
                </label>
              ) : (
                <div className="flex items-center gap-3 p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 opacity-60">
                  <div className="w-4.5 h-4.5 border-gray-300 rounded bg-gray-100" />
                  <div className="text-xs font-bold text-gray-400">
                    Data Santri & Rekening Tabungan <span className="text-[10px] text-gray-400">(Tidak ada di file)</span>
                  </div>
                </div>
              )}

              {availableImportKeys.transactions ? (
                <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={importSelections.transactions}
                    onChange={(e) => setImportSelections(prev => ({ ...prev, transactions: e.target.checked }))}
                    className="w-4.5 h-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <div className="text-xs font-bold text-emerald-950">
                    Riwayat Mutasi & Laporan Transaksi <span className="text-[10px] text-emerald-600">(Tersedia)</span>
                  </div>
                </label>
              ) : (
                <div className="flex items-center gap-3 p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 opacity-60">
                  <div className="w-4.5 h-4.5 border-gray-300 rounded bg-gray-100" />
                  <div className="text-xs font-bold text-gray-400">
                    Riwayat Mutasi & Laporan Transaksi <span className="text-[10px] text-gray-400">(Tidak ada di file)</span>
                  </div>
                </div>
              )}

              {availableImportKeys.institution ? (
                <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={importSelections.institution}
                    onChange={(e) => setImportSelections(prev => ({ ...prev, institution: e.target.checked }))}
                    className="w-4.5 h-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <div className="text-xs font-bold text-emerald-950">
                    Pengaturan Identitas Lembaga <span className="text-[10px] text-emerald-600">(Tersedia)</span>
                  </div>
                </label>
              ) : (
                <div className="flex items-center gap-3 p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 opacity-60">
                  <div className="w-4.5 h-4.5 border-gray-300 rounded bg-gray-100" />
                  <div className="text-xs font-bold text-gray-400">
                    Pengaturan Identitas Lembaga <span className="text-[10px] text-gray-400">(Tidak ada di file)</span>
                  </div>
                </div>
              )}

              {availableImportKeys.financial ? (
                <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={importSelections.financial}
                    onChange={(e) => setImportSelections(prev => ({ ...prev, financial: e.target.checked }))}
                    className="w-4.5 h-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <div className="text-xs font-bold text-emerald-950">
                    Kebijakan & Aturan Keuangan <span className="text-[10px] text-emerald-600">(Tersedia)</span>
                  </div>
                </label>
              ) : (
                <div className="flex items-center gap-3 p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 opacity-60">
                  <div className="w-4.5 h-4.5 border-gray-300 rounded bg-gray-100" />
                  <div className="text-xs font-bold text-gray-400">
                    Kebijakan & Aturan Keuangan <span className="text-[10px] text-gray-400">(Tidak ada di file)</span>
                  </div>
                </div>
              )}

              {availableImportKeys.users ? (
                <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={importSelections.users}
                    onChange={(e) => setImportSelections(prev => ({ ...prev, users: e.target.checked }))}
                    className="w-4.5 h-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <div className="text-xs font-bold text-emerald-950">
                    Daftar Akun Pengguna / Operator <span className="text-[10px] text-emerald-600">(Tersedia)</span>
                  </div>
                </label>
              ) : (
                <div className="flex items-center gap-3 p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 opacity-60">
                  <div className="w-4.5 h-4.5 border-gray-300 rounded bg-gray-100" />
                  <div className="text-xs font-bold text-gray-400">
                    Daftar Akun Pengguna / Operator <span className="text-[10px] text-gray-400">(Tidak ada di file)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setUploadedJsonData(null);
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeImport}
                disabled={!Object.values(importSelections).some(Boolean)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-blue-900/10 cursor-pointer border-none"
              >
                Mulai Impor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
