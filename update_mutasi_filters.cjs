const fs = require('fs');
let content = fs.readFileSync('src/components/MutasiKas.tsx', 'utf8');

const targetStr = `{/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest ml-1">PENCARIAN</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              <input
                type="text" placeholder="Cari Nama/NIS/Catatan..." value={histSearch} onChange={(e) => setHistSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-xs font-bold border border-emerald-100 bg-emerald-50/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest ml-1">JENIS</label>
            <select
              value={histType} onChange={(e) => setHistType(e.target.value)}
              className="w-full px-3 py-3 text-xs font-bold border border-emerald-100 bg-emerald-50/30 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Jenis</option>
              <option value="Setor">Setoran (+)</option>
              <option value="Tarik">Penarikan (-)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest ml-1">AKUN</label>
            <select
              value={histAccount} onChange={(e) => setHistAccount(e.target.value)}
              className="w-full px-3 py-3 text-xs font-bold border border-emerald-100 bg-emerald-50/30 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Akun</option>
              <option value="Tabungan">Tabungan</option>
              <option value="Penitipan">Penitipan</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest ml-1">RENTANG TANGGAL</label>
            <div className="flex gap-2">
              <input
                type="date" value={histStartDate} onChange={(e) => setHistStartDate(e.target.value)}
                className="flex-1 px-3 py-3 text-[10px] font-bold border border-emerald-100 bg-emerald-50/30 rounded-xl focus:outline-none"
              />
              <input
                type="date" value={histEndDate} onChange={(e) => setHistEndDate(e.target.value)}
                className="flex-1 px-3 py-3 text-[10px] font-bold border border-emerald-100 bg-emerald-50/30 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>`;

const replacementStr = `{/* Filters */}
        <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm flex flex-row items-center gap-2 overflow-x-auto">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text" placeholder="Cari Nama/NIS/Catatan..." value={histSearch} onChange={(e) => setHistSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="w-32 shrink-0 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={histType} onChange={(e) => setHistType(e.target.value)}
              className="w-full pl-8 pr-6 py-1.5 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-200 focus:border-emerald-500 appearance-none cursor-pointer transition-all text-slate-700"
            >
              <option value="Semua">Semua Jenis</option>
              <option value="Setor">Setoran (+)</option>
              <option value="Tarik">Penarikan (-)</option>
            </select>
          </div>

          <div className="w-32 shrink-0 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={histAccount} onChange={(e) => setHistAccount(e.target.value)}
              className="w-full pl-8 pr-6 py-1.5 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-200 focus:border-emerald-500 appearance-none cursor-pointer transition-all text-slate-700"
            >
              <option value="Semua">Semua Akun</option>
              <option value="Tabungan">Tabungan</option>
              <option value="Penitipan">Penitipan</option>
            </select>
          </div>

          <div className="w-64 shrink-0 flex items-center gap-1">
            <input
              type="date" value={histStartDate} onChange={(e) => setHistStartDate(e.target.value)}
              className="flex-1 px-3 py-1.5 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-200 focus:border-emerald-500 transition-all text-slate-700"
            />
            <span className="text-gray-400 text-[10px] font-bold">-</span>
            <input
              type="date" value={histEndDate} onChange={(e) => setHistEndDate(e.target.value)}
              className="flex-1 px-3 py-1.5 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-200 focus:border-emerald-500 transition-all text-slate-700"
            />
          </div>
        </div>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/MutasiKas.tsx', content);
console.log('Mutasi done');
