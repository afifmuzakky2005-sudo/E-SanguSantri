import React, { useState, useMemo } from 'react';
import { Santri, Transaction, InstitutionSettings } from '../types';
import { Search, Printer, Filter, Download, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown, Eye, X, Image } from 'lucide-react';
import { printReceipt, formatTxId, parseWaTransactionTemplate, getWhatsAppLink } from '../lib/printHelper';

interface MutasiKasProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  cashierName: string;
}

export default function MutasiKas({
  students = [],
  transactions = [],
  institution,
  cashierName
}: MutasiKasProps) {
  const [histSearch, setHistSearch] = useState('');
  const [histType, setHistType] = useState<string>('Semua');
  const [histAccount, setHistAccount] = useState<string>('Semua');
  const [histStartDate, setHistStartDate] = useState('');
  const [histEndDate, setHistEndDate] = useState('');
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

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
    const headers = [
      'ID Transaksi',
      'Waktu',
      'Tanggal',
      'NIS',
      'Nama Santri',
      'Kelas',
      'Akun',
      'Jenis Transaksi',
      'Jumlah',
      'Biaya Admin',
      'Net Jumlah',
      'Catatan',
      'Kasir'
    ];

    const rows = sortedHistory.map(tx => {
      const s = safeStudents.find(st => st.id === tx.santriId);
      const nis = s ? s.nis : '';
      const formattedId = formatTxId(tx.id, safeTransactions);
      const time = formatTime(tx.timestamp);
      return [
        formattedId,
        time,
        tx.date || '',
        `"${nis}"`,
        `"${tx.santriName || ''}"`,
        `"${tx.santriClass || ''}"`,
        tx.accountType || '',
        tx.type || '',
        Number(tx.amount) || 0,
        Number(tx.adminFee) || 0,
        Number(tx.netAmount) || 0,
        `"${(tx.note || '').replace(/"/g, '""')}"`,
        `"${(tx.cashierName || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(e => e.join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Mutasi_Kas_E_Sangu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <button
            type="button"
            onClick={exportToExcel}
            className="flex items-center justify-center gap-1.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl text-xs font-black transition shadow-md shadow-emerald-900/10 cursor-pointer border-none"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </button>

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

    </div>
  );
}
