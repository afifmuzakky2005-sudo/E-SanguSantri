import React, { useState, useMemo } from 'react';
import { ActivityLog } from '../types';
import { Search, Download, Filter, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ActivityLogViewProps {
  activityLogs: ActivityLog[];
}

export default function ActivityLogView({ activityLogs }: ActivityLogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [userFilter, setUserFilter] = useState('Semua');
  const [actionFilter, setActionFilter] = useState('Semua');

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchSearch = 
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchRole = roleFilter === 'Semua' || log.role === roleFilter;
      const matchUser = userFilter === 'Semua' || log.user === userFilter;
      const matchAction = actionFilter === 'Semua' || log.action === actionFilter;

      return matchSearch && matchRole && matchUser && matchAction;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activityLogs, searchQuery, roleFilter, userFilter, actionFilter]);

  const uniqueRoles = ['Semua', ...Array.from(new Set(activityLogs.map(log => log.role)))];
  const uniqueUsers = ['Semua', ...Array.from(new Set(activityLogs.map(log => log.user)))];
  const uniqueActions = ['Semua', ...Array.from(new Set(activityLogs.map(log => log.action)))];

  const handleDownloadExcel = () => {
    const dataToExport = filteredLogs.map((log) => ({
      'TANGGAL & WAKTU': new Date(log.timestamp).toLocaleString('id-ID'),
      'NAMA PENGGUNA': log.user,
      'ROLE': log.role,
      'AKTIFITAS': log.action,
      'KETERANGAN': log.details
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Log Aktifitas');

    // Kolom width
    const wscols = [
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 30 },
      { wch: 50 },
    ];
    worksheet['!cols'] = wscols;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `Log_Aktifitas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Title & Download Button Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-emerald-950 tracking-tight uppercase flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            LOG AKTIFITAS
          </h2>
          <p className="text-xs text-gray-500 mt-1">Riwayat seluruh aktifitas pengguna dalam sistem.</p>
        </div>
        
        <button
          onClick={handleDownloadExcel}
          className="px-4 py-2.5 bg-emerald-800 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition hover:bg-emerald-900 shadow-md border-none cursor-pointer text-[11px] uppercase tracking-wider"
        >
          <Download className="w-4 h-4 text-emerald-200" />
          Download Excel
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm flex flex-row items-center gap-2 overflow-x-auto">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kata kunci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition font-medium text-[11px]"
          />
        </div>
        
        <div className="w-32 shrink-0 relative flex items-center">
          <Filter className="w-3.5 h-3.5 absolute left-3 text-gray-400 pointer-events-none" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition font-bold text-[11px] text-slate-700"
          >
            {uniqueRoles.map(r => (
              <option key={r} value={r}>Role: {r}</option>
            ))}
          </select>
        </div>
        
        <div className="w-36 shrink-0 relative flex items-center">
          <Filter className="w-3.5 h-3.5 absolute left-3 text-gray-400 pointer-events-none" />
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition font-bold text-[11px] text-slate-700"
          >
            {uniqueUsers.map(u => (
              <option key={u} value={u}>User: {u}</option>
            ))}
          </select>
        </div>
        
        <div className="w-40 shrink-0 relative flex items-center">
          <Filter className="w-3.5 h-3.5 absolute left-3 text-gray-400 pointer-events-none" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition font-bold text-[11px] text-slate-700"
          >
            {uniqueActions.map(a => (
              <option key={a} value={a}>Aksi: {a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-100">
                <th className="px-6 py-4 font-black text-emerald-900 uppercase tracking-widest text-[10px]">Tanggal & Waktu</th>
                <th className="px-6 py-4 font-black text-emerald-900 uppercase tracking-widest text-[10px]">Nama Pengguna</th>
                <th className="px-6 py-4 font-black text-emerald-900 uppercase tracking-widest text-[10px]">Role</th>
                <th className="px-6 py-4 font-black text-emerald-900 uppercase tracking-widest text-[10px]">Aktifitas</th>
                <th className="px-6 py-4 font-black text-emerald-900 uppercase tracking-widest text-[10px]">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Calendar className="w-12 h-12 mb-3 opacity-20" />
                      <p className="font-bold text-base">Tidak ada log aktifitas ditemukan</p>
                      <p className="text-sm mt-1">Coba ubah kata kunci pencarian atau filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-emerald-50/30 transition group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700 text-xs">
                        {new Date(log.timestamp).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-900">{log.user}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                        {log.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-700 text-xs">{log.action}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
