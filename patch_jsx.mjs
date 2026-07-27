import fs from 'fs';
const content = fs.readFileSync('src/components/QrGeneratifView.tsx', 'utf8');

let newContent = content.replace(
  /<select[\s\S]*?<\/select>/,
  `<div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Ketik nama atau NIS..."
                  value={qrSearchQuery}
                  onChange={(e) => {
                    setQrSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-xs"
                />
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                    {students
                      .filter(s => s.name.toLowerCase().includes(qrSearchQuery.toLowerCase()) || s.nis.includes(qrSearchQuery))
                      .map((student) => (
                        <button
                          key={student.id}
                          onClick={() => {
                            setSelectedQrStudentId(student.id);
                            setQrSearchQuery(\`[\${student.nis}] - \${student.name.toUpperCase()} (\${student.className})\`);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer"
                        >
                          [{student.nis}] - {student.name.toUpperCase()} ({student.className})
                        </button>
                      ))}
                    {students.filter(s => s.name.toLowerCase().includes(qrSearchQuery.toLowerCase()) || s.nis.includes(qrSearchQuery)).length === 0 && (
                      <div className="px-4 py-4 text-center text-xs text-slate-400 font-bold">
                        Santri tidak ditemukan.
                      </div>
                    )}
                  </div>
                )}
                {/* Invisible backdrop to close dropdown */}
                {isDropdownOpen && (
                  <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                )}
              </div>`
);

// Replace "Unduh Semua QR Polos" button
newContent = newContent.replace(
  /onClick=\{handleDownloadAllQr\}\n\s*className="[^"]*"\n\s*>\n\s*<Download className="[^"]*" \/>\n\s*Unduh Semua QR Polos/,
  `onClick={() => { setDownloadTarget('all'); setShowQrOptionsModal(true); }}\n                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer border-none shadow-md shadow-emerald-600/15 shrink-0"\n              >\n                <Download className="w-4 h-4" />\n                Unduh Semua QR`
);

// Replace "Mengunduh QR Polos" 
newContent = newContent.replace(
  /Mengunduh QR Polos\.\.\./g,
  `Mengunduh QR...`
);

// Replace "Unduh QR Polos" single button
newContent = newContent.replace(
  /onClick=\{[^}]*downloadSinglePlainQr[^}]*\}\n\s*className="[^"]*"\n\s*>\n\s*<Download className="[^"]*" \/>\n\s*Unduh QR Polos/,
  `onClick={() => { setDownloadTarget('single'); setShowQrOptionsModal(true); }}\n                      className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer border-none shadow-md shadow-slate-600/10"\n                    >\n                      <Download className="w-3.5 h-3.5" />\n                      Unduh QR`
);

fs.writeFileSync('src/components/QrGeneratifView.tsx', newContent);
