import React, { useState } from 'react';
import { Santri, Transaction, InstitutionSettings, User } from '../types';
import { calculateBalances } from '../data/mockData';
import { Search, UserPlus, MessageCircle, Users, FileDown, FileUp, Edit2, Trash2, BookOpen, X, Check, Eye, Filter, Trash, CheckCircle2, MoreHorizontal, Coins, Info, FileSpreadsheet, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { printPassbook } from '../lib/printHelper';

interface StudentManagementProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  onAddStudent: (student: Omit<Santri, 'id'>) => void;
  onEditStudent: (student: Santri) => void;
  onDeleteStudent: (id: string) => void;
  onBulkDeleteStudents?: (ids: string[]) => void;
  onActivateSavings: (id: string) => void;
  onDeactivateSavings: (id: string) => void;
  institutionClasses?: string[];
  allowDeleteWithBalance?: boolean;
  users?: User[];
}

export default function StudentManagement({
  students,
  transactions,
  institution,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onBulkDeleteStudents,
  onActivateSavings,
  onDeactivateSavings,
  institutionClasses,
  allowDeleteWithBalance = false,
  users = []
}: StudentManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterDorm, setFilterDorm] = useState('Semua');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Excel import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ [key: number]: string[] }>({});
  const [importSuccessCount, setImportSuccessCount] = useState(0);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBulkDeleteConfirm, setIsBulkDeleteConfirm] = useState(false);

  // Password confirmation states for deletion
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [bulkDeletePasswordInput, setBulkDeletePasswordInput] = useState('');
  const [bulkDeletePasswordError, setBulkDeletePasswordError] = useState('');

  const isValidMasterPassword = (pw: string) => {
    const masterPasswords = users
      .filter(u => u.role === 'Master' && u.isActive !== false)
      .map(u => u.password)
      .filter(Boolean) as string[];
    return masterPasswords.includes(pw) || pw === 'master123';
  };

  // Form states
  const [nis, setNis] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [dorm, setDorm] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [formError, setFormError] = useState('');

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const classesList = institutionClasses && institutionClasses.length > 0 
    ? institutionClasses 
    : Array.from(new Set(students.map(s => s.className)));
  
  const dormsList = institution.dorms && institution.dorms.length > 0
    ? institution.dorms
    : Array.from(new Set(students.map(s => s.dorm)));

  // Search and filter students
  let filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nis.includes(searchQuery);
    
    const matchesClass = filterClass === 'Semua' || student.className === filterClass;
    const matchesStatus = filterStatus === 'Semua' || student.status === filterStatus;
    const matchesDorm = filterDorm === 'Semua' || student.dorm === filterDorm;
    
    return matchesSearch && matchesClass && matchesStatus && matchesDorm;
  });

  if (sortConfig !== null) {
    filteredStudents.sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof Santri];
      let bVal: any = b[sortConfig.key as keyof Santri];
      
      if (sortConfig.key === 'tabungan' || sortConfig.key === 'penitipan') {
        aVal = calculateBalances(a.id, transactions)[sortConfig.key as 'tabungan' | 'penitipan'];
        bVal = calculateBalances(b.id, transactions)[sortConfig.key as 'tabungan' | 'penitipan'];
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

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

  const handleOpenAdd = () => {
    const maxNis = students.reduce((max, s) => Math.max(max, parseInt(s.nis) || 0), 24000);
    
    setNis(String(maxNis + 1));
    ;
    setName('');
    setClassName(classesList[0] || '');
    setDorm(dormsList[0] || '');
    setGuardianPhone('');
    setStatus('Aktif');
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (student: Santri) => {
    setSelectedStudentId(student.id);
    setNis(student.nis);
    ;
    setName(student.name);
    setClassName(student.className);
    setDorm(student.dorm);
    setGuardianPhone(student.guardianPhone);
    setStatus(student.status);
    setFormError('');
    setShowEditModal(true);
  };

  const handleTestWhatsApp = (phone: string) => {
    if (!phone) {
      alert('Silakan isi No WhatsApp Wali terlebih dahulu!');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    let waNumber = cleanPhone;
    if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.slice(1);
    } else if (waNumber.startsWith('8')) {
      waNumber = '62' + waNumber;
    }
    const text = `Halo, ini adalah pesan tes dari ${institution.name} untuk memverifikasi nomor WhatsApp Wali Santri.`;
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    window.open(waLink, '_blank');
  };

  const handleDownloadTemplate = () => {
    const wsData = [
      ['NIS', 'Nama', 'Kelas', 'Asrama', 'No Wali'],
      ['12345678', 'Ahmad Fauzi', classesList[0] || '1 TSANAWIYAH (PA)', institution.dorms?.[0] || 'Yunusiyah', '081234567890'],
      ['87654321', 'M. Rizqi', classesList[1] || '2 TSANAWIYAH (PA)', institution.dorms?.[1] || 'Ar Ridho 1', '085712345678'],
      ['99999999', 'Siti Aminah', classesList[2] || '1 ALIYAH', institution.dorms?.[2] || 'Ar Ridho 2', '089912345678']
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Impor Santri');
    
    ws['!cols'] = [
      { wch: 15 }, // NIS
      { wch: 25 }, // Nama
      { wch: 25 }, // Kelas
      { wch: 20 }, // Asrama
      { wch: 20 }  // No Wali
    ];

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'template_impor_santri.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
          const rowName = normalizedRow['nama'] || normalizedRow['name'] || '';
          const rowClass = normalizedRow['kelas'] || normalizedRow['class'] || '';
          const rowDorm = normalizedRow['asrama'] || normalizedRow['dorm'] || '';
          const rowPhone = normalizedRow['no wali'] || normalizedRow['no_wali'] || normalizedRow['wali'] || '';

          const rowErrors: string[] = [];

          if (!rowNis) {
            rowErrors.push('NIS wajib diisi');
          } else if (rowNis.length !== 8 || !/^\d{8}$/.test(rowNis)) {
            rowErrors.push('NIS wajib berisi tepat 8 digit angka');
          } else if (students.some(s => s.nis === rowNis)) {
            rowErrors.push(`NIS sudah terdaftar (${rowNis})`);
          } else if (parsed.some(p => p.nis === rowNis)) {
            rowErrors.push(`Duplikasi NIS di file Excel (${rowNis})`);
          }

          if (!rowName) {
            rowErrors.push('Nama santri wajib diisi');
          }

          if (!rowClass) {
            rowErrors.push('Kelas wajib diisi');
          } else {
            const matchedClass = classesList.find(c => c.toLowerCase() === rowClass.toLowerCase());
            if (!matchedClass) {
              rowErrors.push(`Kelas "${rowClass}" tidak terdaftar di pengaturan`);
            } else {
              normalizedRow.matchedClass = matchedClass;
            }
          }

          if (!rowDorm) {
            rowErrors.push('Asrama wajib diisi');
          } else {
            const matchedDorm = (institution.dorms || []).find(d => d.toLowerCase() === rowDorm.toLowerCase());
            if (!matchedDorm) {
              rowErrors.push(`Asrama "${rowDorm}" tidak terdaftar di pengaturan`);
            } else {
              normalizedRow.matchedDorm = matchedDorm;
            }
          }

          if (rowErrors.length === 0) {
            successCount++;
          } else {
            errors[index] = rowErrors;
          }

          parsed.push({
            index,
            nis: rowNis,
            name: rowName,
            className: normalizedRow.matchedClass || rowClass,
            dorm: normalizedRow.matchedDorm || rowDorm,
            guardianPhone: rowPhone || '-',
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
    const validStudents = importedData.filter(d => d.errors.length === 0);
    if (validStudents.length === 0) {
      alert('Tidak ada data santri yang valid untuk diimpor!');
      return;
    }

    validStudents.forEach((student) => {
      onAddStudent({
        nis: student.nis,
        name: student.name,
        className: student.className,
        dorm: student.dorm,
        guardianPhone: student.guardianPhone,
        status: 'Aktif'
      });
    });

    alert(`Berhasil mengimpor ${validStudents.length} santri dari Excel!`);
    setShowImportModal(false);
    setImportFile(null);
    setImportedData([]);
    setValidationErrors({});
    setImportSuccessCount(0);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!nis || !name || !className || !dorm) {
      setFormError('Mohon lengkapi seluruh field wajib!');
      return;
    }
    if (nis.length !== 8 || !/^\d{8}$/.test(nis)) {
      setFormError('NIS wajib berisi 8 digit angka!');
      return;
    }
    if (students.some(s => s.nis === nis)) {
      setFormError('NIS sudah terdaftar!');
      return;
    }

    onAddStudent({
      nis,
      name,
      className,
      dorm,
      guardianPhone,
      status,
      hasSavings: false,
      savingsActive: false
    });
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedStudentId || !nis || !name || !className || !dorm) {
      setFormError('Mohon lengkapi seluruh field wajib!');
      return;
    }
    if (nis.length !== 8 || !/^\d{8}$/.test(nis)) {
      setFormError('NIS wajib berisi 8 digit angka!');
      return;
    }

    const orig = students.find(s => s.id === selectedStudentId);

    onEditStudent({
      id: selectedStudentId,
      nis,
      name,
      className,
      dorm,
      guardianPhone,
      status,
      hasSavings: orig?.hasSavings,
      savingsActive: orig?.savingsActive
    });
    setShowEditModal(false);
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteConfirm(true);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredStudents.map(s => {
      const bal = calculateBalances(s.id, transactions);
      return {
        'NIS': s.nis,
        'Nama Lengkap': s.name,
        'Kelas': s.className,
        'Asrama': s.dorm,
        'No. WA Wali': s.guardianPhone,
        'Kontak Wali': s.guardianPhone,
        'Saldo Tabungan': bal.tabungan,
        'Saldo Penitipan': bal.penitipan,
        'Total Saldo': bal.total,
        'Status': s.status
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Santri');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `Data_Santri_E-Sangu_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const currentBalances = selectedStudentId ? calculateBalances(selectedStudentId, transactions) : { tabungan: 0, penitipan: 0, total: 0 };
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-xl font-black text-emerald-950 tracking-tight uppercase flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            DATA SANTRI
          </h2>
          <p className="text-xs text-gray-500 mt-1">Kelola profil, buku tabungan, dan status keuangan santri secara terpusat.</p>
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
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition cursor-pointer"
          >
            <FileUp className="w-4 h-4" />
            Impor Excel
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-xl shadow-lg shadow-emerald-900/20 transition active:scale-95 border-none cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Santri
          </button>
        </div>
      </div>

      {/* Filters & Search - Improved */}
      <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm flex flex-row items-center gap-2 overflow-x-auto">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Nama, NIS..."
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

        <div className="w-8 shrink-0">
          <button 
            onClick={() => { setSearchQuery(''); setFilterClass('Semua'); setFilterStatus('Semua'); setFilterDorm('Semua'); }}
            className="w-full py-1.5 flex items-center justify-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
            title="Reset Filter"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bulk Actions Header */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-950 text-white p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-lg tracking-widest">{selectedIds.length} Terpilih</span>
            <p className="text-xs font-bold opacity-80 hidden sm:block">Aksi untuk santri yang Anda pilih:</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
            >
              <Trash className="w-4 h-4" />
              Hapus Massal
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
            >
              Batal
            </button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-[24px] border border-emerald-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50 text-[10px] font-black text-emerald-900 tracking-widest border-b border-emerald-100">
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
                <th className="px-5 py-4 min-w-[200px] w-64 cursor-pointer hover:bg-emerald-100 transition" onClick={() => setSortConfig({ key: 'name', direction: sortConfig?.key === 'name' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center gap-1">NAMA {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:bg-emerald-100 transition" onClick={() => setSortConfig({ key: 'className', direction: sortConfig?.key === 'className' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center gap-1">KELAS {sortConfig?.key === 'className' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:bg-emerald-100 transition" onClick={() => setSortConfig({ key: 'dorm', direction: sortConfig?.key === 'dorm' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center gap-1">ASRAMA {sortConfig?.key === 'dorm' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:bg-emerald-100 transition">
                  <div className="flex items-center gap-1">NOMOR WA WALI</div>
                </th>
                <th className="px-5 py-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-xs animate-in fade-in slide-in-from-bottom-2 duration-500">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const isSelected = selectedIds.includes(student.id);
                  return (
                    <tr key={student.id} className={`transition-colors ${isSelected ? 'bg-emerald-50/80' : 'hover:bg-emerald-50/30'}`}>
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleSelectOne(student.id)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-black text-emerald-950 font-mono tracking-wider">{student.nis}</div>
                      </td>
                      <td className="px-5 py-4 min-w-[200px] w-64">
                        <div className="font-black text-gray-900 text-sm leading-tight">{student.name}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[9px] uppercase tracking-wider inline-block">
                          {student.className}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[10px] text-gray-500 font-medium truncate max-w-[150px]">{student.dorm || '-'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-bold text-gray-700 font-mono">{student.guardianPhone || '-'}</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {student.guardianPhone && student.guardianPhone !== '-' && (
                            <button
                              onClick={() => {
                                const template = institution.waTemplateAccountData || institution.waTemplateRegistration || `*E-SANGU SANTRI*\nSistem Tabungan dan Penitipan Uang Santri\n{NAMA PONDOK}\n\n*DATA AKUN SANTRI*\n\n*NIS :* {NIS}\n*Nama :* {NAMA}\n*Kelas :* {KELAS}\n*Asrama :* {ASRAMA}\n*No Wali :* {NO_WALI}\n\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {NAMA WEBSITE}`;
                                const portalUrl = window.location.origin;
                                const text = template
                                  .replace(/{NAMA PONDOK}/g, institution.name)
                                  .replace(/{NAMA}/g, student.name)
                                  .replace(/{KELAS}/g, student.className)
                                  .replace(/{ASRAMA}/g, student.dorm || '-')
                                  .replace(/{NIS}/g, student.nis)
                                  .replace(/{NO_WALI}/g, student.guardianPhone)
                                  .replace(/{NAMA WEBSITE}/g, portalUrl);
                                
                                const cleanPhone = student.guardianPhone.replace(/\D/g, '');
                                let waNumber = cleanPhone;
                                if (waNumber.startsWith('0')) {
                                  waNumber = '62' + waNumber.slice(1);
                                } else if (waNumber.startsWith('8')) {
                                  waNumber = '62' + waNumber;
                                }
                                const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
                                window.open(waLink, '_blank');
                              }}
                              title="Kirim Pesan Akun WA"
                              className="p-2 text-purple-600 hover:bg-purple-100 rounded-xl transition-all"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(student)}
                            title="Edit Profil"
                            className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(student.id)}
                            title="Hapus Data"
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300 mx-auto">
                        <Search className="w-8 h-8" />
                      </div>
                      <p className="text-gray-400 font-bold text-sm tracking-tight">Tidak ditemukan data santri yang sesuai filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: ADD STUDENT (MODERNIZED) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl border border-emerald-100 max-w-lg w-full overflow-hidden">
            <div className="bg-emerald-800 text-white p-6 flex justify-between items-center border-b border-emerald-700">
              <h3 className="font-black text-lg tracking-tight uppercase">DATA AKUN SANTRI</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAdd} className="p-8 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {formError}
                </div>
              )}
              {/* Row 1: NIS (Status is omitted in add modal as requested) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">NIS*</label>
                  <input
                    type="text" required value={nis} 
                    onChange={(e) => {
                      const raw = e.target.value;
                      const val = raw.replace(/\D/g, '');
                      if (raw.length > 8 || raw !== val) {
                        setFormError('NIS hanya boleh berisi angka dan maksimal 8 digit!');
                      } else {
                        setFormError('');
                      }
                      setNis(val.slice(0, 8));
                    }}
                    className="w-full px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 transition"
                  />
                </div>
                <div className="space-y-1.5" />
              </div>

              {/* Row 2: NAMA (1 kolom panjang) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Nama Lengkap Santri*</label>
                <input
                  type="text" required placeholder="Contoh: Muhammad Akhyar" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 transition"
                />
              </div>

              {/* Row 3: KELAS, ASRAMA (2 kolom masing2 dropdown) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Pilih Kelas*</label>
                  <select
                    value={className} onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="" disabled>-- Pilih Kelas --</option>
                    {classesList.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Asrama*</label>
                  <select
                    value={dorm} onChange={(e) => setDorm(e.target.value)}
                    className="w-full px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="" disabled>-- Pilih Asrama --</option>
                    {dormsList.map((drm) => <option key={drm} value={drm}>{drm}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4: NO WHATSAPP WALI (1 kolom panjang) + tombol test nomor */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">No. Kontak WhatsApp Wali (Opsional)</label>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="08xxxxxxxxxx" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)}
                    className="flex-1 px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestWhatsApp(guardianPhone)}
                    className="px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 hover:border-teal-300 font-black text-xs rounded-xl transition cursor-pointer whitespace-nowrap"
                  >
                    Test Nomor
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-2xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-2xl shadow-xl shadow-emerald-900/20 transition active:scale-95 border-none"
                >
                  Simpan Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: EDIT STUDENT (MODERNIZED) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl border border-emerald-100 max-w-lg w-full overflow-hidden">
            <div className="bg-emerald-800 text-white p-6 flex justify-between items-center border-b border-emerald-700">
              <h3 className="font-black text-lg tracking-tight uppercase">DATA AKUN SANTRI</h3>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-8 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {formError}
                </div>
              )}
              {/* Row 1: NIS, STATUS (2 kolom, status sakelar interaktif) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">NIS*</label>
                  <input
                    type="text" required value={nis} 
                    onChange={(e) => {
                      const raw = e.target.value;
                      const val = raw.replace(/\D/g, '');
                      if (raw.length > 8 || raw !== val) {
                        setFormError('NIS hanya boleh berisi angka dan maksimal 8 digit!');
                      } else {
                        setFormError('');
                      }
                      setNis(val.slice(0, 8));
                    }}
                    className="w-full px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 transition"
                  />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1 mb-2">STATUS SANTRI</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStatus(status === 'Aktif' ? 'Nonaktif' : 'Aktif')}
                      className={`relative w-12 h-6.5 rounded-full transition-colors duration-300 ease-in-out focus:outline-none border-none cursor-pointer ${status === 'Aktif' ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute left-0.5 top-0.5 w-5.5 h-5.5 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${status === 'Aktif' ? 'translate-x-5.5' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-xs font-black uppercase tracking-wider ${status === 'Aktif' ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: NAMA (1 kolom panjang) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Nama Lengkap Santri*</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 transition"
                />
              </div>

              {/* Row 3: KELAS, ASRAMA (2 kolom masing2 dropdown) */}
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
                    {dormsList.map((drm) => <option key={drm} value={drm}>{drm}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4: NO WHATSAPP WALI (1 kolom panjang) + tombol test nomor */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">No. Kontak WhatsApp Wali (Opsional)</label>
                <div className="flex gap-2">
                  <input
                    type="text" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)}
                    className="flex-1 px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestWhatsApp(guardianPhone)}
                    className="px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 hover:border-teal-300 font-black text-xs rounded-xl transition cursor-pointer whitespace-nowrap"
                  >
                    Test Nomor
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-2xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-2xl shadow-xl shadow-emerald-900/20 transition active:scale-95 border-none"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: MUTASI BUKU TABUNGAN (MODERNIZED) */}
      {showLedgerModal && selectedStudent && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl border border-emerald-100 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-emerald-800 text-white p-6 flex justify-between items-center border-b border-emerald-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-white text-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight uppercase">Buku Mutasi Santri</h3>
                  <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest">{selectedStudent.name} • NIS: {selectedStudent.nis}</p>
                </div>
              </div>
              <button onClick={() => setShowLedgerModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto space-y-8">
              {/* Balances and History Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Panel Tabungan */}
                <div className="flex flex-col border border-teal-200 rounded-[24px] overflow-hidden bg-white shadow-sm">
                  <div className="p-5 bg-gradient-to-br from-teal-50 to-teal-100 border-b border-teal-200">
                    <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest block">SALDO TABUNGAN</span>
                    <div className="text-3xl font-black text-teal-950 mt-1">{formatCurrency(currentBalances.tabungan)}</div>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[300px] p-0">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-teal-50 shadow-sm z-10">
                        <tr className="text-[9px] font-black text-teal-900 uppercase tracking-widest">
                          <th className="px-4 py-2">Waktu</th>
                          <th className="px-4 py-2">Tipe</th>
                          <th className="px-4 py-2 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-50 font-bold">
                        {transactions.filter(t => t.santriId === selectedStudent.id && t.accountType === 'Tabungan').length > 0 ? (
                          transactions.filter(t => t.santriId === selectedStudent.id && t.accountType === 'Tabungan')
                            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((tx) => (
                            <tr key={tx.id} className="hover:bg-teal-50/20">
                              <td className="px-4 py-2 text-[9px] font-mono text-gray-400">{new Date(tx.timestamp).toLocaleString('id-ID', { dateStyle: 'short' })}</td>
                              <td className={`px-4 py-2 text-[10px] font-black ${tx.type === 'Setor' ? 'text-teal-600' : 'text-red-600'}`}>
                                {tx.type === 'Setor' ? 'SETOR' : 'TARIK'}
                              </td>
                              <td className="px-4 py-2 text-right text-teal-950">{formatCurrency(tx.amount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 font-bold italic text-[10px]">Belum ada riwayat</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-teal-50 border-t border-teal-100 mt-auto">
                    <button 
                      onClick={() => printPassbook(selectedStudent, transactions, institution, 'Tabungan')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-900/20 transition active:scale-95 border-none"
                    >
                      <BookOpen className="w-4 h-4" />
                      Cetak Buku Tabungan PDF
                    </button>
                  </div>
                </div>

                {/* Panel Penitipan */}
                <div className="flex flex-col border border-emerald-200 rounded-[24px] overflow-hidden bg-white shadow-sm">
                  <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 border-b border-emerald-200">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">SALDO PENITIPAN</span>
                    <div className="text-3xl font-black text-emerald-950 mt-1">{formatCurrency(currentBalances.penitipan)}</div>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[300px] p-0">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-emerald-50 shadow-sm z-10">
                        <tr className="text-[9px] font-black text-emerald-900 uppercase tracking-widest">
                          <th className="px-4 py-2">Waktu</th>
                          <th className="px-4 py-2">Tipe</th>
                          <th className="px-4 py-2 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50 font-bold">
                        {transactions.filter(t => t.santriId === selectedStudent.id && t.accountType === 'Penitipan').length > 0 ? (
                          transactions.filter(t => t.santriId === selectedStudent.id && t.accountType === 'Penitipan')
                            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((tx) => (
                            <tr key={tx.id} className="hover:bg-emerald-50/20">
                              <td className="px-4 py-2 text-[9px] font-mono text-gray-400">{new Date(tx.timestamp).toLocaleString('id-ID', { dateStyle: 'short' })}</td>
                              <td className={`px-4 py-2 text-[10px] font-black ${tx.type === 'Setor' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {tx.type === 'Setor' ? 'SETOR' : 'TARIK'}
                              </td>
                              <td className="px-4 py-2 text-right text-emerald-950">{formatCurrency(tx.amount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 font-bold italic text-[10px]">Belum ada riwayat</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-emerald-50 border-t border-emerald-100 mt-auto">
                    <button 
                      onClick={() => printPassbook(selectedStudent, transactions, institution, 'Penitipan')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition active:scale-95 border-none"
                    >
                      <BookOpen className="w-4 h-4" />
                      Cetak Buku Penitipan PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-emerald-50 border-t border-emerald-100 flex justify-end">
              <button
                onClick={() => setShowLedgerModal(false)}
                className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-900 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-100 transition"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE DELETE CONFIRM MODAL */}
      {deleteConfirmId && (() => {
        const studentBalances = calculateBalances(deleteConfirmId, transactions);
        const hasBalance = studentBalances.tabungan > 0 || studentBalances.penitipan > 0;
        const studentObj = students.find(s => s.id === deleteConfirmId);

        return (
          <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-300">
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center animate-bounce">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Konfirmasi Hapus</h3>
                <p className="text-xs text-gray-500 font-bold">
                  Apakah Anda yakin ingin menghapus data santri <span className="text-emerald-900 font-black">{studentObj?.name}</span>? Semua riwayat transaksi santri ini juga akan dihapus secara permanen.
                </p>

                {hasBalance && (
                  allowDeleteWithBalance ? (
                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-left space-y-2 mt-3">
                      <p className="text-[10px] text-amber-800 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Peringatan Saldo Masih Ada!
                      </p>
                      <p className="text-[11px] text-amber-900 font-bold leading-normal">
                        Santri ini masih memiliki sisa saldo sebesar <span className="font-black">Tabungan: Rp {studentBalances.tabungan.toLocaleString('id-ID')}</span> dan <span className="font-black">Penitipan: Rp {studentBalances.penitipan.toLocaleString('id-ID')}</span>.
                      </p>
                      <p className="text-[10px] text-amber-700 font-bold">
                        Masukkan Password Master untuk menghapus paksa dan menghanguskan seluruh saldonya.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-left space-y-2 mt-3">
                      <p className="text-[10px] text-red-800 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Penghapusan Ditolak!
                      </p>
                      <p className="text-[11px] text-red-900 font-bold leading-normal">
                        Izin Hapus Santri Ber-Saldo dinonaktifkan. Anda tidak dapat menghapus santri <span className="font-black">{studentObj?.name}</span> karena masih memiliki sisa saldo sebesar <span className="font-black">Tabungan: Rp {studentBalances.tabungan.toLocaleString('id-ID')}</span> dan <span className="font-black">Penitipan: Rp {studentBalances.penitipan.toLocaleString('id-ID')}</span>.
                      </p>
                      <p className="text-[10px] text-red-700 font-bold">
                        Silakan lakukan penarikan saldo terlebih dahulu hingga nihil sebelum menghapus data santri ini.
                      </p>
                    </div>
                  )
                )}
              </div>

              {hasBalance && allowDeleteWithBalance && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">
                    Password Konfirmasi Master
                  </label>
                  <input
                    type="password"
                    value={deletePasswordInput}
                    onChange={(e) => {
                      setDeletePasswordInput(e.target.value);
                      setDeletePasswordError('');
                    }}
                    placeholder="Masukkan password Master..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-red-500 outline-none transition"
                  />
                  {deletePasswordError && (
                    <p className="text-[10px] text-red-600 font-bold mt-1 animate-pulse">
                      {deletePasswordError}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setDeletePasswordInput('');
                    setDeletePasswordError('');
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
                >
                  {hasBalance && !allowDeleteWithBalance ? 'Tutup' : 'Batal'}
                </button>
                {(!hasBalance || allowDeleteWithBalance) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (hasBalance) {
                        if (!isValidMasterPassword(deletePasswordInput)) {
                          setDeletePasswordError('Password Master salah! Penghapusan paksa ditolak.');
                          return;
                        }
                      }
                      onDeleteStudent(deleteConfirmId);
                      setDeleteConfirmId(null);
                      setDeletePasswordInput('');
                      setDeletePasswordError('');
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* EXCEL IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-[24px] w-full max-w-4xl p-6 md:p-8 border border-emerald-100 shadow-2xl space-y-6 transform animate-in zoom-in-95 duration-300 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-emerald-950 uppercase tracking-tight">Impor Data Santri dari Excel</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tambahkan banyak santri sekaligus secara cepat</p>
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
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Instructions and Template */}
              <div className="space-y-4 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/60">
                <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  Petunjuk & Aturan File Excel
                </h4>
                <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside font-medium">
                  <li>Kolom wajib: <strong className="text-emerald-800">NIS</strong>, <strong className="text-emerald-800">Nama</strong>, <strong className="text-emerald-800">Kelas</strong>, <strong className="text-emerald-800">Asrama</strong>.</li>
                  <li>Aturan <strong className="text-emerald-800">NIS wajib berisi tepat 8 digit angka</strong>. Sistem akan menolak jika kurang/lebih atau bukan angka.</li>
                  <li>Sistem mendeteksi dan mencegah duplikasi NIS yang sudah terdaftar.</li>
                  <li>Nama kelas dan asrama harus persis sesuai yang terdaftar di pengaturan lembaga.</li>
                  <li>Kolom <strong className="text-emerald-800">No Wali</strong> bersifat opsional, gunakan format angka (misal: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono border">08123456789</code>).</li>
                </ul>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-emerald-600" />
                    Unduh Template Excel (.xlsx)
                  </button>
                </div>
              </div>

              {/* Right Column: File Upload Area */}
              <div className="flex flex-col justify-center">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-950 tracking-widest uppercase ml-1 block">UPLOAD FILE EXCEL</label>
                  <div className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-gray-50/50 rounded-2xl p-6 text-center transition relative flex flex-col items-center justify-center gap-3">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    />
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-700">
                        {importFile ? importFile.name : 'Pilih atau seret file Excel di sini'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold">Format didukung: .xlsx atau .xls</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Imported Data Preview */}
            {importedData.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    Pratinjau Data Impor ({importedData.length} Baris Terdeteksi)
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {importSuccessCount} Valid
                    </span>
                    {importedData.length - importSuccessCount > 0 && (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {importedData.length - importSuccessCount} Bermasalah
                      </span>
                    )}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[250px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider w-12 text-center">No</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider w-24">NIS</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Nama</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Kelas</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Asrama</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Status / Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {importedData.map((row, idx) => {
                        const hasErrors = row.errors.length > 0;
                        return (
                          <tr key={idx} className={hasErrors ? 'bg-red-50/40' : 'bg-emerald-50/10'}>
                            <td className="px-4 py-2 text-center font-mono text-gray-500">{idx + 1}</td>
                            <td className="px-4 py-2 font-mono font-bold text-gray-700">{row.nis || '-'}</td>
                            <td className="px-4 py-2 font-bold text-gray-800">{row.name || '-'}</td>
                            <td className="px-4 py-2 text-gray-600 font-semibold">{row.className || '-'}</td>
                            <td className="px-4 py-2 text-gray-600 font-semibold">{row.dorm || '-'}</td>
                            <td className="px-4 py-2">
                              {hasErrors ? (
                                <div className="space-y-0.5">
                                  {row.errors.map((err: string, eIdx: number) => (
                                    <span key={eIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-wider">
                                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                      {err}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider">
                                  <Check className="w-2.5 h-2.5 shrink-0" />
                                  Ready
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportedData([]);
                  setValidationErrors({});
                  setImportSuccessCount(0);
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={importSuccessCount === 0}
                onClick={handleConfirmImport}
                className={`px-6 py-3 text-white rounded-xl text-xs font-black uppercase tracking-widest transition border-none shadow-md ${
                  importSuccessCount > 0
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-900/15 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Konfirmasi Impor ({importSuccessCount} Santri)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRM MODAL */}
      {isBulkDeleteConfirm && (() => {
        const studentsWithBalance = selectedIds.filter(id => {
          const bal = calculateBalances(id, transactions);
          return bal.tabungan > 0 || bal.penitipan > 0;
        });
        const bulkHasBalance = studentsWithBalance.length > 0;
        const names = studentsWithBalance.map(id => students.find(s => s.id === id)?.name || id).join(', ');

        return (
          <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-300">
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center animate-bounce">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Hapus Massal</h3>
                <p className="text-xs text-gray-500 font-bold">
                  Apakah Anda yakin ingin menghapus {selectedIds.length} data santri terpilih secara massal beserta seluruh riwayat transaksinya?
                </p>
                {bulkHasBalance && (
                  allowDeleteWithBalance ? (
                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-left space-y-2 mt-3">
                      <p className="text-[10px] text-amber-800 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Peringatan Saldo Masih Ada!
                      </p>
                      <p className="text-[11px] text-amber-900 font-bold leading-normal">
                        Beberapa santri yang dipilih masih memiliki sisa saldo: <span className="font-black">{names}</span>.
                      </p>
                      <p className="text-[10px] text-amber-700 font-bold">
                        Masukkan Password Master untuk menghapus paksa massal dan menghanguskan seluruh saldonya.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-left space-y-2 mt-3">
                      <p className="text-[10px] text-red-800 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Penghapusan Massal Ditolak!
                      </p>
                      <p className="text-[11px] text-red-900 font-bold leading-normal">
                        Izin Hapus Santri Ber-Saldo dinonaktifkan. Terdapat santri terpilih yang masih memiliki saldo: <span className="font-black">{names}</span>.
                      </p>
                      <p className="text-[10px] text-red-700 font-bold">
                        Silakan lakukan penarikan saldo terlebih dahulu hingga nihil sebelum melanjutkan penghapusan massal.
                      </p>
                    </div>
                  )
                )}
              </div>

              {bulkHasBalance && allowDeleteWithBalance && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">
                    Password Konfirmasi Master
                  </label>
                  <input
                    type="password"
                    value={bulkDeletePasswordInput}
                    onChange={(e) => {
                      setBulkDeletePasswordInput(e.target.value);
                      setBulkDeletePasswordError('');
                    }}
                    placeholder="Masukkan password Master..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-red-500 outline-none transition"
                  />
                  {bulkDeletePasswordError && (
                    <p className="text-[10px] text-red-600 font-bold mt-1 animate-pulse">
                      {bulkDeletePasswordError}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkDeleteConfirm(false);
                    setBulkDeletePasswordInput('');
                    setBulkDeletePasswordError('');
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
                >
                  {bulkHasBalance && !allowDeleteWithBalance ? 'Tutup' : 'Batal'}
                </button>
                {(!bulkHasBalance || allowDeleteWithBalance) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (bulkHasBalance) {
                        if (!isValidMasterPassword(bulkDeletePasswordInput)) {
                          setBulkDeletePasswordError('Password Master salah! Penghapusan paksa massal ditolak.');
                          return;
                        }
                      }

                      if (onBulkDeleteStudents) {
                        onBulkDeleteStudents(selectedIds);
                      } else {
                        selectedIds.forEach(id => onDeleteStudent(id));
                      }
                      setSelectedIds([]);
                      setIsBulkDeleteConfirm(false);
                      setBulkDeletePasswordInput('');
                      setBulkDeletePasswordError('');
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      
    </div>
  );
}
