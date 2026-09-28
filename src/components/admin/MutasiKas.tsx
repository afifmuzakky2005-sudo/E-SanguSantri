import React, { useState, useMemo, useRef } from 'react';
import { Santri, Transaction, InstitutionSettings } from '../../types';
import { Search, Printer, Filter, Download, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown, Eye, X, Image, Trash2, Edit2, AlertTriangle, CheckCircle2, Upload, FileSpreadsheet, Save } from 'lucide-react';
import { printReceipt, formatTxId, parseWaTransactionTemplate, getWhatsAppLink } from '../../lib/printHelper';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY, parseExcelDateToYYYYMMDD } from '../../lib/dateUtils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface MutasiKasProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  cashierName: string;
  currentUserRole?: string;
  onDeleteTransaction?: (txId: string) => void;
  onUpdateTransaction?: (tx: Transaction) => void;
  onAddTransactions?: (txs: (Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string })[]) => void;
}

export default function MutasiKas({
  students = [],
  transactions = [],
  institution,
  cashierName,
  currentUserRole,
  onDeleteTransaction,
  onUpdateTransaction,
  onAddTransactions
}: MutasiKasProps) {
  const [histSearch, setHistSearch] = useState('');
  const [histType, setHistType] = useState<string>('Semua');
  const [histStartDate, setHistStartDate] = useState('');
  const [histEndDate, setHistEndDate] = useState('');
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit form state
  const [editType, setEditType] = useState<'Setor' | 'Tarik'>('Setor');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editAdminFee, setEditAdminFee] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('12:00');
  const [editNote, setEditNote] = useState<string>('');
  const [editCashier, setEditCashier] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'Tunai' | 'Transfer'>('Tunai');
  const [editBankName, setEditBankName] = useState<string>('');

  const isMaster = (currentUserRole || '').trim().toLowerCase() === 'master';

  // States for Excel Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ [key: number]: string[] }>({});
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeTransactions = useMemo(() => {
    return Array.isArray(transactions) ? transactions.filter(t => Boolean(t && t.id)) : [];
  }, [transactions]);

  const safeStudents = useMemo(() => {
    return Array.isArray(students) ? students.filter(Boolean) : [];
  }, [students]);

  const handleDownloadTemplate = () => {
    const wsData = [
      ['NIS', 'Aliran', 'Nominal', 'Biaya Admin', 'Tanggal', 'Catatan', 'Kasir'],
      ['24001234', 'Setor', 100000, 0, '05/09/2026', 'Setoran awal tabungan', cashierName || 'Kasir'],
      ['24005678', 'Tarik', 50000, 5000, '05/09/2026', 'Penarikan tabungan', cashierName || 'Kasir']
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Impor Mutasi');
    
    ws['!cols'] = [
      { wch: 15 }, // NIS
      { wch: 12 }, // Aliran (Setor/Tarik)
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
            const normKey = key.trim().toLowerCase();
            normalizedRow[normKey] = row[key];
          });

          const rowNis = String(normalizedRow['nis'] || '').trim();
          const rowAliran = String(normalizedRow['aliran'] || normalizedRow['jenis'] || normalizedRow['type'] || '').trim();
          const rowNominal = String(normalizedRow['nominal'] || normalizedRow['jumlah'] || normalizedRow['amount'] || '').trim();
          const rowAdminFee = String(normalizedRow['biaya admin'] || normalizedRow['admin fee'] || normalizedRow['fee'] || '0').trim();
          const rowTanggal = normalizedRow['tanggal'] ?? normalizedRow['date'] ?? normalizedRow['tgl'] ?? '';
          const rowCatatan = String(normalizedRow['catatan'] || normalizedRow['keterangan'] || normalizedRow['note'] || '').trim();
          const rowKasir = String(normalizedRow['kasir'] || normalizedRow['cashier'] || cashierName).trim();

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

          // 3. Validasi Nominal
          const amountNum = parseFloat(rowNominal);
          if (!rowNominal) {
            rowErrors.push('Nominal wajib diisi');
          } else if (isNaN(amountNum) || amountNum <= 0) {
            rowErrors.push(`Nominal "${rowNominal}" tidak valid (harus angka positif)`);
          }

          // 4. Validasi Biaya Admin
          const adminFeeNum = parseFloat(rowAdminFee) || 0;
          if (isNaN(adminFeeNum) || adminFeeNum < 0) {
            rowErrors.push(`Biaya admin "${rowAdminFee}" tidak valid (harus angka positif atau 0)`);
          }

          // 5. Validasi Tanggal
          let finalDate = '';
          const dateResult = parseExcelDateToYYYYMMDD(rowTanggal);
          if (!dateResult.isValid) {
            rowErrors.push(dateResult.error || `Tanggal "${rowTanggal}" tidak valid (gunakan format DD/MM/YYYY)`);
          } else {
            finalDate = dateResult.dateStr;
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
            accountType: 'Tabungan' as const,
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
      alert('Tidak ada data valid yang dapat diimpor!');
      return;
    }

    if (onAddTransactions) {
      const formattedForAdd = validTxs.map(v => ({
        santriId: v.studentId,
        santriName: v.santriName,
        santriClass: v.santriClass,
        date: v.date,
        type: v.type,
        accountType: 'Tabungan' as const,
        amount: v.amount,
        adminFee: v.adminFee,
        netAmount: v.netAmount,
        note: v.note,
        cashierName: v.cashierName,
        timestamp: `${v.date}T12:00:00.000Z`,
        paymentMethod: 'Tunai' as const
      }));

      onAddTransactions(formattedForAdd);
      setShowImportModal(false);
      setImportFile(null);
      setImportedData([]);
      setValidationErrors({});
      setImportSuccessCount(0);
      setNotificationMsg({
        type: 'success',
        text: `Berhasil mengimpor ${validTxs.length} transaksi mutasi tabungan.`
      });
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Open Edit Modal and fill form with transaction data
  const handleOpenEditModal = (tx: Transaction) => {
    setTxToEdit(tx);
    setEditType(tx.type || 'Setor');
    setEditAmount(tx.amount || 0);
    setEditAdminFee(tx.adminFee || 0);
    
    // Extract date & time
    const txDate = tx.date || (tx.timestamp ? tx.timestamp.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditDate(txDate);
    
    let timeStr = '12:00';
    if (tx.timestamp && tx.timestamp.includes('T')) {
      const timePart = tx.timestamp.split('T')[1];
      if (timePart) {
        timeStr = timePart.substring(0, 5);
      }
    }
    setEditTime(timeStr);
    
    setEditNote(tx.note === '-' ? '' : (tx.note || ''));
    setEditCashier(tx.cashierName || cashierName || 'Kasir');
    setEditPaymentMethod(tx.paymentMethod || 'Tunai');
    setEditBankName(tx.bankName || '');
  };

  // Submit Edited Transaction
  const handleSaveEditTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txToEdit || !onUpdateTransaction) return;

    if (!editAmount || editAmount <= 0) {
      alert('Nominal transaksi harus lebih besar dari 0!');
      return;
    }

    if (!editDate) {
      alert('Tanggal transaksi wajib diisi!');
      return;
    }

    const calculatedNet = editType === 'Setor' ? editAmount : Math.max(0, editAmount - editAdminFee);
    const constructedTimestamp = `${editDate}T${editTime || '12:00'}:00.000Z`;

    const updatedTx: Transaction = {
      ...txToEdit,
      type: editType,
      accountType: 'Tabungan',
      amount: editAmount,
      adminFee: editAdminFee,
      netAmount: calculatedNet,
      date: editDate,
      timestamp: constructedTimestamp,
      note: editNote.trim() || '-',
      cashierName: editCashier.trim() || cashierName || 'Kasir',
      paymentMethod: editPaymentMethod,
      bankName: editPaymentMethod === 'Transfer' ? (editBankName.trim() || undefined) : undefined
    };

    onUpdateTransaction(updatedTx);
    setTxToEdit(null);
    setNotificationMsg({
      type: 'success',
      text: `Mutasi transaksi ${updatedTx.santriName} (Ref: ${formatTxId(updatedTx.id, safeTransactions)}) berhasil diperbarui.`
    });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Sorting state
  const [sortField, setSortField] = useState<'timestamp' | 'id' | 'santriName' | 'type' | 'amount' | 'adminFee' | 'netAmount' | 'note'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

      return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
    });
  }, [safeTransactions, safeStudents, histSearch, histType, histStartDate, histEndDate]);

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
      return formatDateTimeDDMMYYYY(timestamp);
    }
    return formatDateDDMMYYYY(fallbackDate);
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
        'Tanggal': formatDateDDMMYYYY(tx.date || tx.timestamp),
        'NIS': nis,
        'Nama Santri': tx.santriName || '',
        'Kelas': tx.santriClass || '',
        'Akun': 'Tabungan',
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
      guardianPhone: '',
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
    const message = parseWaTransactionTemplate(templateText, tx, s, institution, safeTransactions);
    const waUrl = getWhatsAppLink(s.guardianPhone, message);
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-lg text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-300 ${
          notificationMsg.type === 'success' ? 'bg-emerald-900 text-white' : 'bg-rose-900 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{notificationMsg.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setNotificationMsg(null)}
            className="p-1 text-white/80 hover:text-white bg-transparent border-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-emerald-950 tracking-tight uppercase flex items-center gap-2">
            <ArrowUpDown className="w-6 h-6 text-emerald-600" />
            BUKU MUTASI KAS HARIAN
          </h2>
          <p className="text-xs text-gray-500 mt-1">Audit seluruh mutasi aliran dana tabungan santri secara transparan dan terpadu.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {onAddTransactions && (
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-4 py-2.5 rounded-xl font-black text-xs transition shadow-md shadow-emerald-900/10 cursor-pointer border-none"
            >
              <Upload className="w-4 h-4 text-emerald-200" />
              Impor Excel
            </button>
          )}

          {sortedHistory.length > 0 && (
            <button
              type="button"
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
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

          {(histSearch || histType !== 'Semua' || histStartDate || histEndDate) && (
            <button
              type="button"
              onClick={() => {
                setHistSearch('');
                setHistType('Semua');
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
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-emerald-100 bg-emerald-50/50">
                <th className="p-5">{renderSortHeader('ID Transaksi', 'id')}</th>
                <th className="p-5">{renderSortHeader('Waktu', 'timestamp')}</th>
                <th className="p-5">{renderSortHeader('Nama & Kelas', 'santriName')}</th>
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
                      <div className="font-bold text-emerald-950 font-mono">{formatDateDDMMYYYY(tx.date || tx.timestamp)}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {formatTime(tx.timestamp)} WIB
                      </div>
                    </td>

                    {/* 3. NAMA & KELAS */}
                    <td className="p-5">
                      <div className="font-black text-gray-900 uppercase tracking-tight">{tx.santriName || 'Santri'}</div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{tx.santriClass || '-'}</div>
                    </td>

                    {/* 4. AKSI ALIRAN */}
                    <td className="p-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        tx.type === 'Setor' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {tx.type === 'Setor' ? 'Setor (+)' : 'Tarik (-)'}
                      </span>
                    </td>

                    {/* 5. DEBIT / KREDIT */}
                    <td className="p-5 text-right font-black text-gray-600">
                      {formatCurrency(tx.amount)}
                    </td>

                    {/* 6. BIAYA ADMIN */}
                    <td className="p-5 text-right font-bold text-amber-800/80">
                      {tx.adminFee && tx.adminFee > 0 ? formatCurrency(tx.adminFee) : 'Rp0'}
                    </td>

                    {/* 7. NET JUMLAH */}
                    <td className={`p-5 text-right font-black ${tx.type === 'Setor' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {formatCurrency(tx.netAmount)}
                    </td>

                    {/* 8. KETERANGAN */}
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

                    {/* 9. AKSI (Edit, Cetak, Kirim Pesan, Hapus) */}
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

                        {/* EDIT MUTASI TRANSAKSI (KHUSUS MASTER) */}
                        {isMaster && onUpdateTransaction && (
                          <button 
                            type="button"
                            onClick={() => handleOpenEditModal(tx)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition cursor-pointer border-none bg-transparent"
                            title="Edit Transaksi / Mutasi (Khusus Master)"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* HAPUS TRANSAKSI (KHUSUS MASTER) */}
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
                  <td colSpan={9} className="p-20 text-center">
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

      {/* MODAL EDIT TRANSAKSI / MUTASI (KHUSUS MASTER) */}
      {txToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden border border-blue-100 shadow-2xl relative flex flex-col transform animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-blue-100 flex items-center justify-between bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-800/80 rounded-xl text-blue-200 shadow-inner">
                  <Edit2 className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Edit Data Mutasi Transaksi</h3>
                  <p className="text-[10px] text-blue-200 font-bold">Otoritas Master • Ref ID: {formatTxId(txToEdit.id, safeTransactions)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTxToEdit(null)}
                className="p-1.5 hover:bg-blue-800 rounded-full transition border-none bg-transparent cursor-pointer text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditTransaction} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Santri Info Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">Santri Terkait</span>
                  <span className="font-black text-slate-900 uppercase">{txToEdit.santriName || 'Santri'}</span>
                  <span className="text-gray-500 font-bold text-[10px] ml-1.5">({txToEdit.santriClass || '-'})</span>
                </div>
                <span className="px-2.5 py-1 bg-teal-100 text-teal-900 rounded-lg text-[9px] font-black uppercase tracking-widest border border-teal-200">
                  Tabungan
                </span>
              </div>

              {/* Tipe Transaksi */}
              <div>
                <label className="block text-gray-600 font-black uppercase tracking-wider text-[10px] mb-1.5">Jenis Aliran Dana</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditType('Setor')}
                    className={`py-2.5 px-3 rounded-xl border-2 text-center text-xs font-black transition cursor-pointer ${
                      editType === 'Setor'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    📥 Setor (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('Tarik')}
                    className={`py-2.5 px-3 rounded-xl border-2 text-center text-xs font-black transition cursor-pointer ${
                      editType === 'Tarik'
                        ? 'border-rose-600 bg-rose-50 text-rose-950 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    📤 Tarik (-)
                  </button>
                </div>
              </div>

              {/* Nominal & Biaya Admin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-black uppercase tracking-wider text-[10px] mb-1">Nominal Transaksi (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-xs">Rp</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editAmount || ''}
                      onChange={(e) => setEditAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl font-mono text-sm font-black text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 font-black uppercase tracking-wider text-[10px] mb-1">Biaya Admin (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-xs">Rp</span>
                    <input
                      type="number"
                      min={0}
                      value={editAdminFee || 0}
                      onChange={(e) => setEditAdminFee(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl font-mono text-sm font-black text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Tanggal & Jam */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-black uppercase tracking-wider text-[10px] mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-black uppercase tracking-wider text-[10px] mb-1">Waktu / Jam (WIB)</label>
                  <input
                    type="time"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Keterangan / Catatan */}
              <div>
                <label className="block text-gray-600 font-black uppercase tracking-wider text-[10px] mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Contoh: Setoran uang jajan / Pembelian seragam"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Petugas / Kasir & Metode Pembayaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-black uppercase tracking-wider text-[10px] mb-1">Kasir / Petugas</label>
                  <input
                    type="text"
                    required
                    value={editCashier}
                    onChange={(e) => setEditCashier(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-black uppercase tracking-wider text-[10px] mb-1">Metode Pembayaran</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer">Transfer Bank</option>
                  </select>
                </div>
              </div>

              {editPaymentMethod === 'Transfer' && (
                <div>
                  <label className="block text-gray-600 font-black uppercase tracking-wider text-[10px] mb-1">Nama Bank Transfer</label>
                  <input
                    type="text"
                    value={editBankName}
                    onChange={(e) => setEditBankName(e.target.value)}
                    placeholder="Contoh: BRI / BCA / Mandiri / BSI"
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              {/* Net preview */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex justify-between items-center text-xs">
                <span className="text-blue-900 font-black uppercase text-[10px] tracking-wider">Perkiraan Saldo Net Transaksi:</span>
                <span className="font-mono font-black text-sm text-blue-950">
                  {formatCurrency(editType === 'Setor' ? editAmount : Math.max(0, editAmount - editAdminFee))}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTxToEdit(null)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition shadow-md shadow-blue-900/20 cursor-pointer border-none flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                   <div className="text-gray-400 uppercase text-[9px] tracking-wider mb-0.5">Nominal Setor</div>
                   <div className="text-emerald-700 font-black font-mono text-xs">{formatCurrency(selectedReceiptTx.amount)}</div>
                 </div>
                 <div>
                   <div className="text-gray-400 uppercase text-[9px] tracking-wider mb-0.5">Bank Tujuan / Pengirim</div>
                   <div className="text-slate-700 font-extrabold">{selectedReceiptTx.bankName || 'Bank Transfer'}</div>
                 </div>
                 <div>
                   <div className="text-gray-400 uppercase text-[9px] tracking-wider mb-0.5">Waktu Transaksi</div>
                   <div className="text-slate-700 font-mono text-[10px]">{formatDateTime(selectedReceiptTx.timestamp, selectedReceiptTx.date)}</div>
                 </div>
              </div>

              {/* Image Preview */}
              <div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-2">Foto / Berkas Struk Transfer:</span>
                {selectedReceiptTx.transferReceiptUrl ? (
                  <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center p-2 group relative">
                    <img 
                      src={selectedReceiptTx.transferReceiptUrl} 
                      alt="Bukti Transfer" 
                      className="max-h-[350px] w-auto max-w-full object-contain rounded-lg shadow-md"
                    />
                    <a 
                      href={selectedReceiptTx.transferReceiptUrl} 
                      download={`Bukti_Transfer_${selectedReceiptTx.id}.jpg`}
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-slate-900 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition opacity-0 group-hover:opacity-100"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh Berkas
                    </a>
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-gray-400 font-bold text-xs">
                    Tidak ada lampiran berkas foto untuk transaksi ini.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReceiptTx(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer border-none"
              >
                Tutup
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
                  <span className="text-gray-500 font-medium">Jenis Aliran:</span>
                  <span className="font-black text-rose-900">Tabungan • {txToDelete.type}</span>
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
                    setNotificationMsg({
                      type: 'success',
                      text: `Transaksi ${deletedSantri} senilai ${formatCurrency(deletedAmount)} berhasil dihapus.`
                    });
                    setTimeout(() => setNotificationMsg(null), 4000);
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

      {/* MODAL IMPOR MASSAL EXCEL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-4xl overflow-hidden border border-emerald-100 shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-emerald-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-teal-950 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-800/80 rounded-xl text-emerald-200 shadow-inner">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Impor Mutasi Kas Massal (Excel)</h3>
                  <p className="text-[11px] text-emerald-200 font-bold">Masukkan transaksi Setor/Tarik tabungan santri via excel.</p>
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
                className="p-1.5 hover:bg-emerald-800 rounded-full transition border-none bg-transparent cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Step 1: Download Template */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-emerald-950 block">1. Unduh Template Excel Resmi</span>
                  <p className="text-[11px] text-emerald-800/80 font-medium">Gunakan template resmi untuk format NIS, Aliran (Setor/Tarik), Nominal, Biaya Admin, dan Tanggal.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer border-none shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Unduh Template (.xlsx)
                </button>
              </div>

              {/* Step 2: Upload Dropzone */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-900 block">2. Unggah File Excel yang Telah Diisi</span>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processImportFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer ${
                    isDragging 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : importFile 
                        ? 'border-teal-500 bg-teal-50/30' 
                        : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  {importFile ? (
                    <div>
                      <p className="text-xs font-black text-slate-800">{importFile.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{(importFile.size / 1024).toFixed(1)} KB • Klik untuk mengganti berkas</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-700">Tarik berkas excel ke sini, atau <span className="text-emerald-700 font-black">telusuri file</span></p>
                      <p className="text-[10px] text-slate-400 mt-1">Format didukung: .xlsx atau .xls</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Preview Data & Validations */}
              {importedData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      3. Pratinjau & Validasi Data ({importedData.length} Baris)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {importSuccessCount} Valid
                      </span>
                      {importedData.length - importSuccessCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          {importedData.length - importSuccessCount} Perlu Perbaikan
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[250px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 font-black text-[10px] uppercase tracking-wider text-slate-600">
                        <tr>
                          <th className="p-3">No</th>
                          <th className="p-3">NIS</th>
                          <th className="p-3">Nama Santri</th>
                          <th className="p-3">Aliran</th>
                          <th className="p-3 text-right">Nominal</th>
                          <th className="p-3 text-right">Biaya Admin</th>
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">Status Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {importedData.map((item, idx) => (
                          <tr key={idx} className={item.errors.length > 0 ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                            <td className="p-3 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-slate-700">{item.nis || '-'}</td>
                            <td className="p-3 font-bold text-slate-900">{item.santriName || <span className="text-rose-500 italic">Tidak Ditemukan</span>}</td>
                            <td className="p-3">
                              {item.type ? (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                  item.type === 'Setor' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {item.type}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-3 text-right font-black font-mono">{formatCurrency(item.amount)}</td>
                            <td className="p-3 text-right font-mono text-slate-500">{formatCurrency(item.adminFee)}</td>
                            <td className="p-3 font-mono text-[10px] text-slate-600">{item.date ? formatDateDDMMYYYY(item.date) : '-'}</td>
                            <td className="p-3">
                              {item.errors.length === 0 ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Siap Impor
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  {item.errors.map((err: string, eIdx: number) => (
                                    <span key={eIdx} className="inline-flex items-center gap-1 text-rose-600 font-bold text-[10px] block">
                                      <AlertTriangle className="w-3 h-3 shrink-0" />
                                      {err}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 font-medium">
                {importSuccessCount > 0 ? `${importSuccessCount} transaksi valid siap dimasukkan ke riwayat mutasi.` : 'Unggah berkas untuk memulai validasi.'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportedData([]);
                    setValidationErrors({});
                    setImportSuccessCount(0);
                  }}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={importSuccessCount === 0}
                  onClick={handleConfirmImport}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition border-none shadow-md ${
                    importSuccessCount > 0
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white cursor-pointer shadow-emerald-900/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Konfirmasi & Impor {importSuccessCount > 0 ? `(${importSuccessCount})` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
