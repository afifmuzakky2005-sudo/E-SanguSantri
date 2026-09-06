import React, { useState, useMemo, useRef } from 'react';
import { Santri, Transaction, InstitutionSettings } from '../types';
import { Search, Printer, Filter, Download, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown, Eye, X, Image, Trash2, AlertTriangle, CheckCircle2, Upload, FileSpreadsheet } from 'lucide-react';
import { printReceipt, formatTxId, parseWaTransactionTemplate, getWhatsAppLink } from '../lib/printHelper';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface MutasiKasProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  cashierName: string;
  currentUserRole?: string;
  onDeleteTransaction?: (txId: string) => void;
  onAddTransactions?: (txs: (Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string })[]) => void;
}

export default function MutasiKas({
  students = [],
  transactions = [],
  institution,
  cashierName,
  currentUserRole,
  onDeleteTransaction,
  onAddTransactions
}: MutasiKasProps) {
  const [histSearch, setHistSearch] = useState('');
  const [histType, setHistType] = useState<string>('Semua');
  const [histAccount, setHistAccount] = useState<string>('Semua');
  const [histStartDate, setHistStartDate] = useState('');
  const [histEndDate, setHistEndDate] = useState('');
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  const isMaster = (currentUserRole || '').trim().toLowerCase() === 'master';

  // States for Excel Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ [key: number]: string[] }>({});
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const wsData = [
      ['NIS', 'Aliran', 'Akun', 'Nominal', 'Biaya Admin', 'Tanggal', 'Catatan', 'Kasir'],
      ['24001234', 'Setor', 'Tabungan', 100000, 0, '2026-09-05', 'Setoran awal tabungan', cashierName || 'Kasir'],
      ['24005678', 'Tarik', 'Penitipan', 50000, 1000, '2026-09-05', 'Jajan mingguan', cashierName || 'Kasir']
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Impor Mutasi');
    
    ws['!cols'] = [
      { wch: 15 }, // NIS
      { wch: 12 }, // Aliran (Setor/Tarik)
      { wch: 15 }, // Akun (Tabungan/Penitipan)
      { wch: 15 }, // Nominal
      { wch: 15 }, // Biaya Admin
      { wch: 15 }, // Tanggal
      { wch: 25 }, // Catatan
      { wch: 15 }  // Kasir
    ];

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'template_impor_mutasi_kas.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImportFile(file);
  };

  const processImportFile = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Format berkas tidak didukung! Pastikan Anda mengunggah file Excel (.xlsx atau .xls).');
      return;
    }
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];

        const parsed: any[] = [];
        const errors: { [key: number]: string[] } = {};
        let successCount = 0;

        rawData.forEach((row: any, index: number) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toLowerCase()] = String(row[key]).trim();
          });

          const rowNis = normalizedRow['nis'] || '';
          const rowAliran = normalizedRow['aliran'] || normalizedRow['jenis'] || normalizedRow['type'] || '';
          const rowAkun = normalizedRow['akun'] || normalizedRow['pos'] || normalizedRow['accounttype'] || '';
          const rowNominal = normalizedRow['nominal'] || normalizedRow['jumlah'] || normalizedRow['amount'] || '';
          const rowAdminFee = normalizedRow['biaya admin'] || normalizedRow['admin fee'] || normalizedRow['fee'] || '0';
          const rowTanggal = normalizedRow['tanggal'] || normalizedRow['date'] || '';
          const rowCatatan = normalizedRow['catatan'] || normalizedRow['keterangan'] || normalizedRow['note'] || '';
          const rowKasir = normalizedRow['kasir'] || normalizedRow['cashier'] || cashierName;

          const rowErrors: string[] = [];

          // 1. Validasi Student by NIS
          let matchedStudent: Santri | undefined;
          if (!rowNis) {
            rowErrors.push('NIS wajib diisi');
          } else {
            matchedStudent = safeStudents.find(s => s.nis === rowNis);
            if (!matchedStudent) {
              rowErrors.push(`Santri dengan NIS "${rowNis}" tidak ditemukan`);
            }
          }

          // 2. Validasi Aliran (Setor/Tarik)
          let finalType: 'Setor' | 'Tarik' | undefined;
          if (!rowAliran) {
            rowErrors.push('Aliran wajib diisi ("Setor" atau "Tarik")');
          } else {
            const normalizedAliran = rowAliran.toLowerCase();
            if (normalizedAliran === 'setor' || normalizedAliran === 'masuk') {
              finalType = 'Setor';
            } else if (normalizedAliran === 'tarik' || normalizedAliran === 'keluar') {
              finalType = 'Tarik';
            } else {
              rowErrors.push(`Aliran "${rowAliran}" tidak valid (harus "Setor" atau "Tarik")`);
            }
          }

          // 3. Validasi Akun (Tabungan/Penitipan)
          let finalAccount: 'Tabungan' | 'Penitipan' | undefined;
          if (!rowAkun) {
            rowErrors.push('Akun/Pos wajib diisi ("Tabungan" atau "Penitipan")');
          } else {
            const normalizedAkun = rowAkun.toLowerCase();
            if (normalizedAkun === 'tabungan') {
              finalAccount = 'Tabungan';
            } else if (normalizedAkun === 'penitipan' || normalizedAkun === 'uang jajan' || normalizedAkun === 'uang_jajan' || normalizedAkun === 'titip') {
              finalAccount = 'Penitipan';
            } else {
              rowErrors.push(`Akun "${rowAkun}" tidak valid (harus "Tabungan" atau "Penitipan")`);
            }
          }

          // 4. Validasi Nominal
          const amountNum = parseFloat(rowNominal);
          if (!rowNominal) {
            rowErrors.push('Nominal wajib diisi');
          } else if (isNaN(amountNum) || amountNum <= 0) {
            rowErrors.push(`Nominal "${rowNominal}" tidak valid (harus angka positif)`);
          }

          // 5. Validasi Biaya Admin
          const adminFeeNum = parseFloat(rowAdminFee) || 0;
          if (isNaN(adminFeeNum) || adminFeeNum < 0) {
            rowErrors.push(`Biaya admin "${rowAdminFee}" tidak valid (harus angka positif atau 0)`);
          }

          // 6. Validasi Tanggal
          let finalDate = rowTanggal;
          if (rowTanggal) {
            const dateObj = new Date(rowTanggal);
            if (isNaN(dateObj.getTime())) {
              rowErrors.push(`Tanggal "${rowTanggal}" tidak valid (format harus YYYY-MM-DD)`);
            } else {
              finalDate = dateObj.toISOString().split('T')[0];
            }
          } else {
            finalDate = new Date().toISOString().split('T')[0];
          }

          if (rowErrors.length === 0) {
            successCount++;
          } else {
            errors[index] = rowErrors;
          }

          parsed.push({
            index,
            nis: rowNis,
            studentId: matchedStudent?.id || '',
            santriName: matchedStudent?.name || '',
            santriClass: matchedStudent?.className || '',
            type: finalType,
            accountType: finalAccount,
            amount: amountNum,
            adminFee: adminFeeNum,
            netAmount: finalType === 'Setor' ? amountNum : amountNum - adminFeeNum,
            date: finalDate,
            note: rowCatatan || '-',
            cashierName: rowKasir,
            errors: rowErrors
          });
        });

        setImportedData(parsed);
        setValidationErrors(errors);
        setImportSuccessCount(successCount);
      } catch (err) {
        alert('Gagal membaca file Excel. Pastikan format file sesuai.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    const validTxs = importedData.filter(d => d.errors.length === 0);
    if (validTxs.length === 0) {
      alert('Tidak ada transaksi valid untuk diimpor!');
      return;
    }

    if (onAddTransactions) {
      onAddTransactions(validTxs.map(t => ({
        santriId: t.studentId,
        santriName: t.santriName,
        santriClass: t.santriClass,
        type: t.type,
        accountType: t.accountType,
        amount: t.amount,
        adminFee: t.adminFee,
        netAmount: t.netAmount,
        date: t.date,
        note: t.note,
        cashierName: t.cashierName,
        timestamp: new Date(t.date + 'T12:00:00').toISOString()
      })));
      alert(`Berhasil mengimpor ${validTxs.length} transaksi mutasi kas dari Excel!`);
    } else {
      alert('Fitur impor massal tidak tersedia pada sistem ini.');
    }

    setShowImportModal(false);
    setImportFile(null);
    setImportedData([]);
    setValidationErrors({});
    setImportSuccessCount(0);
  };

  // Sorting state
  const [sortField, setSortField] = useState<'timestamp' | 'id' | 'santriName' | 'accountType' | 'type' | 'amount' | 'adminFee' | 'netAmount' | 'note'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const safeTransactions = useMemo(() => {
    return Array.isArray(transactions) ? transactions.filter(t => Boolean(t && t.id)) : [];
  }, [transactions]);

  const safeStudents = useMemo(() => {
    return Array.isArray(students) ? students.filter(Boolean) : [];
  }, [students]);

  const filteredHistory = useMemo(() => {
    return safeTransactions.filter(tx => {
      if (!tx) return false;

      const sName = (tx.santriName || '').toLowerCase();
      const studentObj = safeStudents.find(st => st && st.id === tx.santriId);
      const sNis = (studentObj?.nis || '').toLowerCase();
      const sNote = (tx.note || '').toLowerCase();
      const query = (histSearch || '').trim().toLowerCase();

      const matchesSearch = !query || sName.includes(query) || sNis.includes(query) || sNote.includes(query);

      const matchesType = histType === 'Semua' || tx.type === histType;
      const matchesAccount = histAccount === 'Semua' || tx.accountType === histAccount;

      // Safe date comparison
      let matchesStartDate = true;
      let matchesEndDate = true;

      const txDateStr = tx.date || (tx.timestamp ? tx.timestamp.split('T')[0] : '');
      if (histStartDate || histEndDate) {
        const txDate = new Date(txDateStr || tx.timestamp || 0);
        const isValidDate = !isNaN(txDate.getTime());

        if (histStartDate) {
          const startDate = new Date(histStartDate);
          matchesStartDate = isValidDate && txDate >= startDate;
        }

        if (histEndDate) {
          const endDate = new Date(histEndDate + 'T23:59:59');
          matchesEndDate = isValidDate && txDate <= endDate;
        }
      }

      return matchesSearch && matchesType && matchesAccount && matchesStartDate && matchesEndDate;
    });
  }, [safeTransactions, safeStudents, histSearch, histType, histAccount, histStartDate, histEndDate]);

  // Apply sorting safely
  const sortedHistory = useMemo(() => {
    return [...filteredHistory].sort((a, b) => {
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;

      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'timestamp') {
        valA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        valB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        if (isNaN(valA)) valA = 0;
        if (isNaN(valB)) valB = 0;
      } else if (sortField === 'id') {
        valA = String(a.id || '');
        valB = String(b.id || '');
      } else if (sortField === 'santriName') {
        valA = (a.santriName || '').toLowerCase();
        valB = (b.santriName || '').toLowerCase();
      } else if (sortField === 'accountType') {
        valA = (a.accountType || '').toLowerCase();
        valB = (b.accountType || '').toLowerCase();
      } else if (sortField === 'type') {
        valA = (a.type || '').toLowerCase();
        valB = (b.type || '').toLowerCase();
      } else if (sortField === 'amount') {
        valA = Number(a.amount) || 0;
        valB = Number(b.amount) || 0;
      } else if (sortField === 'adminFee') {
        valA = Number(a.adminFee) || 0;
        valB = Number(b.adminFee) || 0;
      } else if (sortField === 'netAmount') {
        valA = Number(a.netAmount) || 0;
        valB = Number(b.netAmount) || 0;
      } else if (sortField === 'note') {
        valA = (a.note || '').toLowerCase();
        valB = (b.note || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredHistory, sortField, sortOrder]);

  const formatCurrency = (val: number | undefined | null) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val) || 0);
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '-';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (timestamp?: string, fallbackDate?: string) => {
    if (!timestamp && !fallbackDate) return '-';
    if (timestamp) {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
      }
    }
    return fallbackDate || '-';
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortHeader = (label: string, field: typeof sortField, align: 'left' | 'center' | 'right' = 'left') => {
    const isActive = sortField === field;
    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className={`flex items-center gap-1.5 hover:text-emerald-900 transition font-black uppercase text-[10px] tracking-widest border-none bg-transparent cursor-pointer ${
          align === 'right' ? 'ml-auto justify-end' : align === 'center' ? 'mx-auto justify-center' : ''
        }`}
      >
        {label}
        {isActive && (
          sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-700" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
        )}
      </button>
    );
  };

  const exportToExcel = () => {
    const dataToExport = sortedHistory.map(tx => {
      const s = safeStudents.find(st => st.id === tx.santriId);
      const nis = s ? s.nis : '';
      return {
        'ID Transaksi': formatTxId(tx.id, safeTransactions),
        'Waktu': formatTime(tx.timestamp),
        'Tanggal': tx.date || '',
        'NIS': nis,
        'Nama Santri': tx.santriName || '',
        'Kelas': tx.santriClass || '',
        'Akun': tx.accountType || '',
        'Jenis Transaksi': tx.type || '',
        'Jumlah': Number(tx.amount) || 0,
        'Biaya Admin': Number(tx.adminFee) || 0,
        'Net Jumlah': Number(tx.netAmount) || 0,
        'Catatan': tx.note || '',
        'Kasir': tx.cashierName || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mutasi Kas');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `Mutasi_Kas_E_Sangu_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = (tx: Transaction) => {
    const s = safeStudents.find(st => st.id === tx.santriId) || {
      id: tx.santriId || '',
      nis: '-',
      name: tx.santriName || 'Santri',
      className: tx.santriClass || '-',
      dorm: '-',
      parentName: '-',
      guardianPhone: '',
      savingsAccountActive: true,
      status: 'Aktif' as const
    };
    printReceipt(tx, s, institution, safeTransactions);
  };

  const handleSendWA = (tx: Transaction) => {
    const s = safeStudents.find(st => st.id === tx.santriId);
    if (!s) {
      alert('Data santri tidak ditemukan.');
      return;
    }
    if (!s.guardianPhone || s.guardianPhone === '-' || s.guardianPhone.trim() === '') {
      alert('Nomor HP Wali Santri tidak valid atau belum diinput.');
      return;
    }
    const templateText = institution?.waTemplateTransaction || '';
    const parsedMsg = parseWaTransactionTemplate(
      templateText,
      tx,
      s,
      institution,
      safeTransactions
    );
    const waUrl = getWhatsAppLink(s.guardianPhone, parsedMsg);
    window.open(waUrl, '_blank');
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-xl font-black text-emerald-950 tracking-tight uppercase flex items-center gap-2">
            <ArrowUpDown className="w-6 h-6 text-emerald-600" />
            BUKU MUTASI KAS HARIAN
          </h2>
          <p className="text-xs text-gray-500 mt-1">Menampilkan seluruh aliran dana masuk dan keluar pesantren.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {isMaster && (
            <>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-2xl text-xs font-black transition shadow-md shadow-amber-950/10 cursor-pointer border-none"
              >
                <Upload className="w-4 h-4" />
                Impor Excel
              </button>
              <button
                type="button"
                onClick={exportToExcel}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl text-xs font-black transition shadow-md shadow-emerald-950/10 cursor-pointer border-none"
              >
                <Download className="w-4 h-4" />
                Ekspor Excel
              </button>
            </>
          )}
          {!isMaster && (
            <button
              type="button"
              onClick={exportToExcel}
              className="flex items-center justify-center gap-1.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl text-xs font-black transition shadow-md shadow-emerald-900/10 cursor-pointer border-none"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </button>
          )}

          <div className="bg-emerald-950 text-white px-5 py-3 rounded-2xl shadow-xl flex flex-col justify-center">
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Total Transaksi</p>
            <p className="text-lg font-black">{sortedHistory.length}</p>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm flex flex-row items-center gap-2 overflow-x-auto">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari Nama/NIS/Catatan..."
              value={histSearch}
              onChange={(e) => setHistSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-nowrap">
            <Filter className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <select
              value={histType}
              onChange={(e) => setHistType(e.target.value)}
              className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-200"
            >
              <option value="Semua">Semua Aliran</option>
              <option value="Setor">Setor (+)</option>
              <option value="Tarik">Tarik (-)</option>
            </select>

            <select
              value={histAccount}
              onChange={(e) => setHistAccount(e.target.value)}
              className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-200"
            >
              <option value="Semua">Semua Pos</option>
              <option value="Tabungan">Tabungan</option>
              <option value="Penitipan">Uang Jajan</option>
            </select>

            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold">
              <input
                type="date"
                value={histStartDate}
                onChange={(e) => setHistStartDate(e.target.value)}
                className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                title="Mulai Tanggal"
              />
              <span className="text-slate-400 font-normal">-</span>
              <input
                type="date"
                value={histEndDate}
                onChange={(e) => setHistEndDate(e.target.value)}
                className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                title="Sampai Tanggal"
              />
            </div>

            {(histSearch || histType !== 'Semua' || histAccount !== 'Semua' || histStartDate || histEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setHistSearch('');
                  setHistType('Semua');
                  setHistAccount('Semua');
                  setHistStartDate('');
                  setHistEndDate('');
                }}
                className="py-1.5 px-2.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition border border-rose-100 shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Tabel Mutasi */}
        <div className="bg-white rounded-[24px] border border-emerald-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-emerald-100 bg-emerald-50/50">
                  <th className="p-5">{renderSortHeader('ID Transaksi', 'id')}</th>
                  <th className="p-5">{renderSortHeader('Waktu', 'timestamp')}</th>
                  <th className="p-5">{renderSortHeader('Nama & Kelas', 'santriName')}</th>
                  <th className="p-5 text-center">{renderSortHeader('Pos Akun', 'accountType', 'center')}</th>
                  <th className="p-5 text-center">{renderSortHeader('Aksi Aliran', 'type', 'center')}</th>
                  <th className="p-5 text-right">{renderSortHeader('Debit/Kredit', 'amount', 'right')}</th>
                  <th className="p-5 text-right">{renderSortHeader('Biaya Admin', 'adminFee', 'right')}</th>
                  <th className="p-5 text-right">{renderSortHeader('Net Jumlah', 'netAmount', 'right')}</th>
                  <th className="p-5">{renderSortHeader('Keterangan', 'note')}</th>
                  <th className="p-5 text-center font-black uppercase text-[10px] tracking-widest text-emerald-900">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {sortedHistory.length > 0 ? (
                  sortedHistory.map(tx => (
                    <tr key={tx.id} className="hover:bg-emerald-50/30 transition text-xs font-bold text-gray-700">
                      {/* 1. ID TRANSAKSI */}
                      <td className="p-5">
                        <span className="font-mono font-black text-emerald-900 tracking-wider bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          {formatTxId(tx.id, safeTransactions)}
                        </span>
                      </td>

                      {/* 2. TANGGAL & WAKTU */}
                      <td className="p-5">
                        <div className="font-bold text-emerald-950 font-mono">{tx.date || (tx.timestamp ? tx.timestamp.split('T')[0] : '-')}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {formatTime(tx.timestamp)} WIB
                        </div>
                      </td>

                      {/* 3. NAMA & KELAS */}
                      <td className="p-5">
                        <div className="font-black text-gray-900 uppercase tracking-tight">{tx.santriName || 'Santri'}</div>
                        <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{tx.santriClass || '-'}</div>
                      </td>

                      {/* 4. JENIS AKUN */}
                      <td className="p-5 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          tx.accountType === 'Tabungan' ? 'bg-teal-50 text-teal-800 border-teal-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                        }`}>
                          {tx.accountType || 'Tabungan'}
                        </span>
                      </td>

                      {/* 5. AKSI ALIRAN */}
                      <td className="p-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          tx.type === 'Setor' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {tx.type === 'Setor' ? 'Setor (+)' : 'Tarik (-)'}
                        </span>
                      </td>

                      {/* 6. DEBIT / KREDIT */}
                      <td className="p-5 text-right font-black text-gray-600">
                        {formatCurrency(tx.amount)}
                      </td>

                      {/* 7. BIAYA ADMIN */}
                      <td className="p-5 text-right font-bold text-amber-800/80">
                        {tx.adminFee && tx.adminFee > 0 ? formatCurrency(tx.adminFee) : 'Rp0'}
                      </td>

                      {/* 8. NET JUMLAH */}
                      <td className={`p-5 text-right font-black ${tx.type === 'Setor' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatCurrency(tx.netAmount)}
                      </td>

                      {/* 9. KETERANGAN */}
                      <td className="p-5">
                        <div className="font-bold text-gray-600">{tx.note || '-'}</div>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                            tx.paymentMethod === 'Transfer'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {tx.paymentMethod || 'Tunai'}
                          </span>
                          {tx.paymentMethod === 'Transfer' && tx.bankName && (
                            <span className="text-[9px] font-extrabold text-gray-400 uppercase font-mono bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                              Bank {tx.bankName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 10. AKSI (Cetak, Kirim Pesan) */}
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {tx.paymentMethod === 'Transfer' && (
                            <button 
                              type="button"
                              onClick={() => setSelectedReceiptTx(tx)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition cursor-pointer border-none bg-transparent"
                              title="Lihat Bukti Transfer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          <button 
                            type="button"
                            onClick={() => handlePrint(tx)}
                            className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition cursor-pointer border-none bg-transparent"
                            title="Cetak Nota"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => handleSendWA(tx)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-xl transition cursor-pointer border-none bg-transparent"
                            title="Konfirmasi WA"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {isMaster && onDeleteTransaction && (
                            <button 
                              type="button"
                              onClick={() => setTxToDelete(tx)}
                              className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl transition cursor-pointer border-none bg-transparent animate-in fade-in zoom-in"
                              title="Hapus Transaksi (Khusus Master)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-20 text-center">
                      <div className="max-w-xs mx-auto space-y-3">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300 mx-auto">
                          <Search className="w-8 h-8" />
                        </div>
                        <p className="text-gray-400 font-bold text-sm tracking-tight">Tidak ada riwayat transaksi yang ditemukan.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* MODAL LIHAT BUKTI TRANSFER */}
      {selectedReceiptTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden border border-slate-100 shadow-2xl relative flex flex-col transform animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-blue-950 text-white">
               <div className="flex items-center gap-2.5">
                 <div className="p-2 bg-blue-900 rounded-lg text-blue-400">
                   <Image className="w-5 h-5" />
                 </div>
                 <div>
                   <h3 className="text-xs font-black uppercase tracking-wider">Bukti Transfer Bank</h3>
                   <p className="text-[10px] text-blue-300 font-bold">Ref ID: {formatTxId(selectedReceiptTx.id, safeTransactions)}</p>
                 </div>
               </div>
               <button
                 type="button"
                 onClick={() => setSelectedReceiptTx(null)}
                 className="p-1.5 hover:bg-blue-900 rounded-full transition border-none bg-transparent cursor-pointer text-white"
               >
                 <X className="w-4 h-4" />
               </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {/* Quick Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[11px] font-bold">
                 <div>
                   <div className="text-gray-400 uppercase text-[9px] tracking-wider mb-0.5">Santri</div>
                   <div className="text-slate-800 uppercase font-black">{selectedReceiptTx.santriName || 'Santri'} ({selectedReceiptTx.santriClass || '-'})</div>
                 </div>
                 <div>
                   <div className="text-gray-400 uppercase text-[9px] tracking-wider mb-0.5">Jumlah Transfer</div>
                   <div className="text-emerald-700 font-black text-xs">
                     {formatCurrency(selectedReceiptTx.amount)}
                   </div>
                 </div>
                 <div>
                   <div className="text-gray-400 uppercase text-[9px] tracking-wider mb-0.5">Bank Tujuan</div>
                   <div className="text-slate-800 uppercase font-extrabold">{selectedReceiptTx.bankName || '-'}</div>
                 </div>
                 <div>
                   <div className="text-gray-400 uppercase text-[9px] tracking-wider mb-0.5">Info Rekening</div>
                   <div className="text-slate-800 font-extrabold">{selectedReceiptTx.accountInfo || '-'}</div>
                 </div>
                 <div>
                   <div className="text-gray-400 uppercase text-[9px] tracking-wider mb-0.5">Tanggal & Waktu</div>
                   <div className="text-slate-700 font-mono text-[10px]">{formatDateTime(selectedReceiptTx.timestamp, selectedReceiptTx.date)}</div>
                 </div>
                 <div>
                   <div className="text-gray-400 uppercase text-[9px] tracking-wider mb-0.5">Keterangan</div>
                   <div className="text-slate-700 italic">{selectedReceiptTx.note || '-'}</div>
                 </div>
              </div>

              {/* Receipt Image Display */}
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Foto / Gambar Bukti:</label>
                 {selectedReceiptTx.transferReceiptUrl ? (
                   <div className="w-full rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center relative p-2 min-h-[250px] max-h-[350px]">
                     <img
                       src={selectedReceiptTx.transferReceiptUrl}
                       alt="Bukti Transfer"
                       className="max-w-full max-h-[330px] object-contain rounded-xl shadow-sm"
                       referrerPolicy="no-referrer"
                     />
                   </div>
                 ) : (
                   <div className="w-full py-12 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center p-6 space-y-2">
                     <Image className="w-8 h-8 text-slate-300" />
                     <p className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Bukti Gambar Tidak Ditemukan</p>
                     <p className="text-[10px] text-slate-400 font-medium">Transaksi transfer ini diproses tanpa melampirkan berkas foto bukti.</p>
                   </div>
                 )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end">
               <button
                 type="button"
                 onClick={() => setSelectedReceiptTx(null)}
                 className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition cursor-pointer border-none"
               >
                 Tutup Bukti
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS TRANSAKSI (KHUSUS MASTER) */}
      {txToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden border border-rose-100 shadow-2xl relative flex flex-col transform animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-gradient-to-r from-rose-900 to-rose-950 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-800/80 rounded-xl text-rose-200 shadow-inner">
                  <AlertTriangle className="w-5 h-5 text-rose-300" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Konfirmasi Hapus Transaksi</h3>
                  <p className="text-[10px] text-rose-200 font-bold">Otoritas Master • Ref: {formatTxId(txToDelete.id, safeTransactions)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="p-1.5 hover:bg-rose-800 rounded-full transition border-none bg-transparent cursor-pointer text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500 font-medium">Santri:</span>
                  <span className="font-black text-rose-950 uppercase">{txToDelete.santriName || 'Santri'} ({txToDelete.santriClass || '-'})</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500 font-medium">Jenis Akun / Aliran:</span>
                  <span className="font-black text-rose-900">{txToDelete.accountType} • {txToDelete.type}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500 font-medium">Nominal:</span>
                  <span className="font-mono font-black text-rose-700 text-sm">{formatCurrency(txToDelete.amount)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500 font-medium">Waktu Transaksi:</span>
                  <span className="font-mono text-gray-700">{formatDateTime(txToDelete.timestamp, txToDelete.date)}</span>
                </div>
                {txToDelete.note && (
                  <div className="pt-2 border-t border-rose-100 text-[10px] text-gray-600 italic">
                    Catatan: &ldquo;{txToDelete.note}&rdquo;
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Perhatian:</strong> Menghapus transaksi ini akan membatalkan riwayat mutasi kas dan menyesuaikan kalkulasi saldo santri secara otomatis. Tindakan ini tidak dapat diurungkan.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (txToDelete && onDeleteTransaction) {
                    const deletedSantri = txToDelete.santriName || 'Santri';
                    const deletedAmount = txToDelete.amount || 0;
                    onDeleteTransaction(txToDelete.id);
                    setTxToDelete(null);
                    setDeleteSuccessMsg(`Transaksi ${deletedSantri} senilai ${formatCurrency(deletedAmount)} berhasil dihapus dari sistem.`);
                    setTimeout(() => {
                      setDeleteSuccessMsg(null);
                    }, 4000);
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition shadow-md shadow-rose-900/20 cursor-pointer border-none flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST PEMBERITAHUAN SUKSES HAPUS */}
      {deleteSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-emerald-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-800/80 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-1.5 bg-emerald-800 text-emerald-300 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-emerald-300">Transaksi Dihapus</p>
            <p className="text-[11px] text-gray-200 font-medium">{deleteSuccessMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteSuccessMsg(null)}
            className="ml-2 text-gray-400 hover:text-white transition border-none bg-transparent cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* EXCEL IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 text-left">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-600 text-white rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">
                    Impor Mutasi Kas Massal (Excel)
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    Masukkan transaksi Setor/Tarik tabungan dan penitipan santri via excel.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportedData([]);
                  setValidationErrors({});
                  setImportSuccessCount(0);
                }}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-gray-400 hover:text-gray-600 transition border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Template Download Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-slate-900">Belum memiliki Template Impor?</p>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    Silakan unduh template excel standar di bawah ini untuk menghindari kegagalan impor.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-800 hover:text-amber-900 rounded-xl text-[11px] font-black uppercase tracking-wider transition shadow-sm cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Template Excel
                </button>
              </div>

              {/* Drag and Drop Zone */}
              {!importFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processImportFile(file);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-all ${
                    isDragging
                      ? 'border-amber-500 bg-amber-50/50'
                      : 'border-slate-300 hover:border-amber-400 hover:bg-amber-50/10'
                  }`}
                >
                  <Upload className="w-10 h-10 text-amber-500" />
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      Tarik & Letakkan Berkas Excel di sini
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">
                      Mendukung format berkas .xlsx dan .xls
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400">Atau</div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-md shadow-amber-900/10 cursor-pointer border-none"
                  >
                    Pilih Berkas Manual
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  {/* File Info */}
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200/50">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                      <div className="text-[11px] font-bold text-slate-900">
                        {importFile.name} <span className="text-[9px] text-slate-400">({(importFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImportFile(null);
                        setImportedData([]);
                        setValidationErrors({});
                        setImportSuccessCount(0);
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-100 transition cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Baris</p>
                      <p className="text-base font-black text-slate-800">{importedData.length}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Data Valid</p>
                      <p className="text-base font-black text-emerald-700">{importSuccessCount}</p>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-center">
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-wider">Data Invalid</p>
                      <p className="text-base font-black text-rose-700">{importedData.length - importSuccessCount}</p>
                    </div>
                  </div>

                  {/* Data Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="max-h-[30vh] overflow-y-auto">
                      <table className="w-full text-[11px] text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 uppercase text-[9px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 text-center w-10">Baris</th>
                            <th className="px-3 py-2 w-20">NIS</th>
                            <th className="px-3 py-2">Nama Santri</th>
                            <th className="px-3 py-2 w-16 text-center">Aliran</th>
                            <th className="px-3 py-2 w-20 text-center">Akun</th>
                            <th className="px-3 py-2 text-right">Nominal</th>
                            <th className="px-3 py-2 text-right">Biaya Admin</th>
                            <th className="px-3 py-2 w-24">Tanggal</th>
                            <th className="px-3 py-2">Status / Kesalahan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {importedData.map((item, idx) => {
                            const hasErr = item.errors.length > 0;
                            return (
                              <tr key={idx} className={hasErr ? 'bg-rose-50/50' : 'hover:bg-slate-50/50'}>
                                <td className="px-3 py-2 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                                <td className="px-3 py-2 font-mono font-bold text-slate-800">{item.nis || '-'}</td>
                                <td className="px-3 py-2 font-bold text-slate-700">{item.santriName || <span className="text-rose-400">N/A</span>}</td>
                                <td className="px-3 py-2 text-center">
                                  {item.type ? (
                                    <span className={`px-1.5 py-0.5 rounded-md font-extrabold text-[9px] uppercase ${
                                      item.type === 'Setor' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {item.type}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {item.accountType ? (
                                    <span className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] uppercase ${
                                      item.accountType === 'Tabungan' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {item.accountType === 'Tabungan' ? 'TABUNGAN' : 'UANG JAJAN'}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">
                                  {isNaN(item.amount) ? '-' : `Rp${item.amount.toLocaleString('id-ID')}`}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-semibold text-slate-500">
                                  {isNaN(item.adminFee) ? '-' : `Rp${item.adminFee.toLocaleString('id-ID')}`}
                                </td>
                                <td className="px-3 py-2 font-mono text-slate-600">{item.date || '-'}</td>
                                <td className="px-3 py-2">
                                  {hasErr ? (
                                    <div className="text-[10px] text-rose-600 font-semibold space-y-0.5">
                                      {item.errors.map((errStr: string, eIdx: number) => (
                                        <div key={eIdx} className="flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                                          {errStr}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                      Siap diimpor
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportedData([]);
                  setValidationErrors({});
                  setImportSuccessCount(0);
                }}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!importFile || importSuccessCount === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 disabled:from-gray-400 disabled:to-gray-500 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition shadow-md shadow-amber-950/20 cursor-pointer border-none flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simpan {importSuccessCount} Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
