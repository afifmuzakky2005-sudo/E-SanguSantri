const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const oldHeader = `<div className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-xl uppercase tracking-widest self-start sm:self-center shadow-sm border border-emerald-200">\n                  {currentDateTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {currentDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}\n                </div>`;

const newHeader = `<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start sm:self-center">
                  <div className="text-[10px] font-bold text-amber-700 bg-amber-100 px-3 py-2 rounded-xl uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Lokal
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-xl uppercase tracking-widest shadow-sm border border-emerald-200">
                    {currentDateTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {currentDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>`;

code = code.replace(oldHeader, newHeader);
fs.writeFileSync('src/components/AdminPanel.tsx', code, 'utf8');
console.log('Done fix_admin_header');
