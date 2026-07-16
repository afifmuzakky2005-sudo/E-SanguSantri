const fs = require('fs');
let content = fs.readFileSync('src/components/SavingsManagement.tsx', 'utf8');

const targetStr = `{/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-6 rounded-[24px] border border-emerald-100 shadow-sm items-end">
        <div className="md:col-span-5 space-y-1.5">
          <label className="text-[10px] font-black text-emerald-900 tracking-widest ml-1 uppercase">PENCARIAN CEPAT</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            <input
              type="text"
              placeholder="Cari Nama atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-emerald-100 bg-emerald-50/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
        
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-emerald-900 tracking-widest ml-1 uppercase">FILTER KELAS</label>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full px-3 py-2.5 text-xs font-bold border border-emerald-100 bg-emerald-50/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="Semua">Semua Kelas</option>
            {classesList.map((cls, idx) => (
              <option key={idx} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-emerald-900 tracking-widest ml-1 uppercase">FILTER ASRAMA</label>
          <select
            value={filterDorm}
            onChange={(e) => setFilterDorm(e.target.value)}
            className="w-full px-3 py-2.5 text-xs font-bold border border-emerald-100 bg-emerald-50/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="Semua">Semua Asrama</option>
            {dormsList.map((drm, idx) => (
              <option key={idx} value={drm}>{drm}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-emerald-900 tracking-widest ml-1 uppercase">STATUS</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2.5 text-xs font-bold border border-emerald-100 bg-emerald-50/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>

        <div className="md:col-span-1">
          <button 
            onClick={() => { setSearchQuery(''); setFilterClass('Semua'); setFilterStatus('Semua'); setFilterDorm('Semua'); }}
            className="w-full p-2.5 flex items-center justify-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition border-none cursor-pointer"
            title="Reset Filter"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>`;

const replacementStr = `{/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm flex flex-row items-center gap-2 overflow-x-auto">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Nama atau NIS..."
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

        <div className="w-32 shrink-0 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-200 focus:border-emerald-500 appearance-none cursor-pointer transition-all text-slate-700"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>

        <div className="w-8 shrink-0">
          <button 
            onClick={() => { setSearchQuery(''); setFilterClass('Semua'); setFilterStatus('Semua'); setFilterDorm('Semua'); }}
            className="w-full py-1.5 flex items-center justify-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all border-none cursor-pointer"
            title="Reset Filter"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/SavingsManagement.tsx', content);
console.log('Savings done');
