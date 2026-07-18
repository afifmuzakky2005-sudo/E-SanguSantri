import React, { useState, useRef } from 'react';
import { Santri, InstitutionSettings } from '../types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FileDown, Upload, AlertTriangle, CheckCircle2, X, FileSpreadsheet, Download, RefreshCw } from 'lucide-react';

interface StudentImportProps {
  students: Santri[];
  institution: InstitutionSettings;
  onAddStudent: (student: Omit<Santri, 'id'>) => void;
  institutionClasses?: string[];
}

export default function StudentImport({
  students,
  institution,
  onAddStudent,
  institutionClasses
}: StudentImportProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ [key: number]: string[] }>({});
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const classesList = institutionClasses && institutionClasses.length > 0 
    ? institutionClasses 
    : ['1 TSANAWIYAH (PA)', '2 TSANAWIYAH (PA)', '3 TSANAWIYAH (PA)', '1 ALIYAH', '2 ALIYAH', '3 ALIYAH (A)', '3 ALIYAH (B)'];
  
  const dormsList = institution.dorms && institution.dorms.length > 0
    ? institution.dorms
    : ['Yunusiyah', 'Ar Ridho 1', 'Ar Ridho 2', 'Ar Ridho 3', 'Al Badriyah'];

  const handleDownloadTemplate = () => {
    const wsData = [
      ['NIS', 'Nama', 'Kelas', 'Asrama', 'No Wali'],
      ['12345678', 'Ahmad Fauzi', classesList[0] || '1 TSANAWIYAH (PA)', dormsList[0] || 'Yunusiyah', '081234567890'],
      ['87654321', 'M. Rizqi', classesList[1] || '2 TSANAWIYAH (PA)', dormsList[1] || 'Ar Ridho 1', '085712345678'],
      ['99999999', 'Siti Aminah', classesList[2] || '1 ALIYAH', dormsList[2] || 'Ar Ridho 2', '089912345678']
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

  const processFile = (file: File) => {
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
          const rowName = normalizedRow['nama'] || normalizedRow['name'] || '';
          const rowClass = normalizedRow['kelas'] || normalizedRow['class'] || '';
          const rowDorm = normalizedRow['asrama'] || normalizedRow['dorm'] || '';
          const rowPhone = normalizedRow['no wali'] || normalizedRow['no_wali'] || normalizedRow['wali'] || '';

          const rowErrors: string[] = [];

          // Rule validation: NIS wajib berisi tepat 8 digit angka
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
              rowErrors.push(`Kelas "${rowClass}" tidak terdaftar di sistem`);
            } else {
              normalizedRow.matchedClass = matchedClass;
            }
          }

          if (!rowDorm) {
            rowErrors.push('Asrama wajib diisi');
          } else {
            const matchedDorm = dormsList.find(d => d.toLowerCase() === rowDorm.toLowerCase());
            if (!matchedDorm) {
              rowErrors.push(`Asrama "${rowDorm}" tidak terdaftar di sistem`);
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
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
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
        status: 'Aktif',
        hasSavings: true // automatically enable savings as they are now active
      });
    });

    alert(`Berhasil mengimpor ${validStudents.length} santri dari Excel!`);
    resetImport();
  };

  const resetImport = () => {
    setImportFile(null);
    setImportedData([]);
    setValidationErrors({});
    setImportSuccessCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-xs">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-emerald-950 tracking-tight uppercase flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            IMPOR DATA SANTRI DARI EXCEL
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Unggah berkas spreadsheet untuk menambahkan banyak data santri sekaligus dengan pengenalan kelas dan asrama otomatis.
          </p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2.5 bg-emerald-800 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition hover:bg-emerald-900 shadow-md border-none cursor-pointer text-[11px] uppercase tracking-wider"
        >
          <Download className="w-4 h-4 text-emerald-200" />
          Unduh Template Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Control Card */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-4 lg:col-span-1">
          <span className="font-bold text-gray-800 block text-[11px] uppercase tracking-wider border-b border-gray-100 pb-2">
            Langkah Impor
          </span>

          <ol className="space-y-4 list-decimal list-inside text-gray-600">
            <li>
              <span className="font-semibold text-emerald-900">Unduh Template:</span> Gunakan template resmi kami agar struktur kolom sesuai.
            </li>
            <li>
              <span className="font-semibold text-emerald-900">Isi Data Santri:</span> Tulis NIS (wajib 8 digit angka), Nama, Kelas, Asrama, dan No Wali.
            </li>
            <li>
              <span className="font-semibold text-emerald-900">Unggah & Verifikasi:</span> Seret atau pilih berkas Excel di dropzone, tinjau error jika ada, lalu klik Impor.
            </li>
          </ol>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="font-bold text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Ketentuan Pengisian:</h4>
            <ul className="space-y-1.5 list-disc list-inside text-[11px] text-gray-500">
              <li><strong className="text-emerald-900">NIS:</strong> Wajib diisi tepat 8 digit angka (contoh: 12345678)</li>
              <li><strong className="text-emerald-900">Nama:</strong> Wajib diisi lengkap</li>
              <li><strong className="text-emerald-900">Kelas:</strong> Harus sesuai dengan pilihan kelas terdaftar</li>
              <li><strong className="text-emerald-900">Asrama:</strong> Harus sesuai dengan pilihan asrama terdaftar</li>
            </ul>
          </div>
        </div>

        {/* Right Action & Preview Area */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm lg:col-span-2 space-y-6">
          {!importFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-emerald-600 bg-emerald-50/50 scale-[0.99]'
                  : 'border-emerald-200 hover:border-emerald-500 bg-slate-50 hover:bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-12 h-12 text-emerald-600 mx-auto mb-3 animate-pulse" />
              <p className="font-black text-emerald-950 text-sm">
                Klik atau Seret Berkas Excel ke Sini
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Mendukung ekstensi berkas .xlsx dan .xls
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-black text-emerald-950">{importFile.name}</p>
                    <p className="text-[10px] text-gray-500">
                      Total: {importedData.length} baris | Valid: {importSuccessCount} baris
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={resetImport}
                    className="p-1.5 hover:bg-emerald-100 rounded text-gray-500 hover:text-red-600 transition border-none cursor-pointer"
                    title="Batal Unggah"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Warnings/Success Summary */}
              {importSuccessCount < importedData.length ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <h5 className="font-black text-amber-950 uppercase tracking-wide text-[10px]">Terdapat kesalahan baris!</h5>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      {importedData.length - importSuccessCount} data santri memiliki NIS tidak valid, duplikat, atau kelas/asrama tidak terdaftar. Hanya baris berstatus <span className="font-bold text-emerald-700">Ready</span> yang akan dimasukkan ke sistem.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex gap-2 text-teal-800">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-teal-600" />
                  <div>
                    <h5 className="font-black text-teal-950 uppercase tracking-wide text-[10px]">Seluruh data valid!</h5>
                    <p className="text-[11px] text-teal-700 mt-0.5">
                      Semua data santri di dalam berkas Excel telah berhasil divalidasi dan siap untuk diimpor.
                    </p>
                  </div>
                </div>
              )}

              {/* Data Preview Table */}
              <div className="border border-gray-100 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold uppercase tracking-wider text-[9px]">
                      <th className="p-3 w-28">NIS</th>
                      <th className="p-3">Nama Santri</th>
                      <th className="p-3 w-28">Kelas</th>
                      <th className="p-3 w-24">Asrama</th>
                      <th className="p-3 w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importedData.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-gray-700">{row.nis || '-'}</td>
                        <td className="p-3 font-bold text-emerald-950">{row.name || '-'}</td>
                        <td className="p-3 text-gray-600">{row.className || '-'}</td>
                        <td className="p-3 text-gray-600">{row.dorm || '-'}</td>
                        <td className="p-3">
                          {row.errors.length === 0 ? (
                            <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-black uppercase text-[9px]">
                              Ready
                            </span>
                          ) : (
                            <div className="text-[9px] text-red-600 font-bold space-y-0.5">
                              {row.errors.map((err: string, errIdx: number) => (
                                <div key={errIdx} className="flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  onClick={resetImport}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-xl transition border-none cursor-pointer uppercase tracking-wider text-[10px]"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importSuccessCount === 0}
                  className="px-5 py-2.5 bg-emerald-800 text-white font-extrabold rounded-xl flex items-center gap-2 transition hover:bg-emerald-900 shadow-md border-none cursor-pointer uppercase tracking-wider text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  Impor {importSuccessCount} Santri Valid
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
