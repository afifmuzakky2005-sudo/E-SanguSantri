import fs from 'fs';
const content = fs.readFileSync('src/components/SavingsManagement.tsx', 'utf8');

const targetRegex = /<div className="mb-4 space-y-3">[\s\S]*?Tutup\n\s*<\/button>\n\s*<\/div>/;

const newModal = `<div className="mb-4 space-y-3">
                <p className="text-xs text-gray-500 font-bold leading-relaxed">
                  Pilih santri yang belum memiliki akun tabungan untuk mengaktifkan fasilitas E-Sangu.
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nama atau NIS..."
                    value={addSavingsSearch}
                    onChange={(e) => setAddSavingsSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium"
                  />
                </div>
              </div>
              
              {nonSavingsStudents.length === 0 ? (
                <div className="py-10 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300 mx-auto">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-400">Semua santri sudah memiliki tabungan.</p>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex items-center p-2 mb-2 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-3 w-full cursor-pointer">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer ml-2"
                        checked={addSavingsSelectedIds.length === nonSavingsStudents.filter(s => s.name.toLowerCase().includes(addSavingsSearch.toLowerCase()) || s.nis.includes(addSavingsSearch)).length && nonSavingsStudents.filter(s => s.name.toLowerCase().includes(addSavingsSearch.toLowerCase()) || s.nis.includes(addSavingsSearch)).length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAddSavingsSelectedIds(nonSavingsStudents.filter(s => s.name.toLowerCase().includes(addSavingsSearch.toLowerCase()) || s.nis.includes(addSavingsSearch)).map(s => s.id));
                          } else {
                            setAddSavingsSelectedIds([]);
                          }
                        }}
                      />
                      <span className="text-xs font-black text-slate-700">PILIH SEMUA</span>
                    </label>
                  </div>
                  {nonSavingsStudents
                    .filter(s => s.name.toLowerCase().includes(addSavingsSearch.toLowerCase()) || s.nis.includes(addSavingsSearch))
                    .map(student => (
                    <label
                      key={student.id}
                      className="w-full p-4 flex items-center justify-between bg-emerald-50/50 hover:bg-emerald-100/50 border border-emerald-100 rounded-2xl transition group text-left cursor-pointer shrink-0"
                    >
                      <div className="flex items-center gap-4">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                          checked={addSavingsSelectedIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAddSavingsSelectedIds([...addSavingsSelectedIds, student.id]);
                            } else {
                              setAddSavingsSelectedIds(addSavingsSelectedIds.filter(id => id !== student.id));
                            }
                          }}
                        />
                        <div>
                          <p className="text-xs font-black text-emerald-950 uppercase tracking-tight group-hover:text-emerald-700">{student.name}</p>
                          <p className="text-[10px] font-bold text-emerald-600/70">{student.nis} • {student.className}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                  
                  {nonSavingsStudents.filter(s => s.name.toLowerCase().includes(addSavingsSearch.toLowerCase()) || s.nis.includes(addSavingsSearch)).length === 0 && addSavingsSearch !== '' && (
                    <div className="py-8 text-center text-xs text-gray-400 font-bold">
                      Pencarian "{addSavingsSearch}" tidak ditemukan.
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
              {addSavingsSelectedIds.length > 0 && (
                <button
                  onClick={() => {
                    addSavingsSelectedIds.forEach(id => onActivateSavings(id));
                    setShowAddSavingsModal(false);
                    setAddSavingsSearch('');
                    setAddSavingsSelectedIds([]);
                  }}
                  className="w-full py-3 text-xs font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer border-none shadow-md"
                >
                  Buka Tabungan Terpilih ({addSavingsSelectedIds.length})
                </button>
              )}
              <button
                onClick={() => {
                  setShowAddSavingsModal(false);
                  setAddSavingsSearch('');
                  setAddSavingsSelectedIds([]);
                }}
                className="w-full py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition cursor-pointer border-none bg-transparent"
              >
                Tutup
              </button>
            </div>`;

const newContent = content.replace(targetRegex, newModal);
fs.writeFileSync('src/components/SavingsManagement.tsx', newContent);
