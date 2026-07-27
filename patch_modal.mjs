import fs from 'fs';
const content = fs.readFileSync('src/components/QrGeneratifView.tsx', 'utf8');

const modalCode = `
      {/* QR Options Modal */}
      {showQrOptionsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden border border-slate-100 shadow-2xl flex flex-col">
            <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
              <h3 className="font-black text-base tracking-tight uppercase">Opsi Unduh QR</h3>
              <button onClick={() => setShowQrOptionsModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition border-none cursor-pointer">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <p className="text-xs text-slate-500 font-bold">Pilih data yang ingin ditampilkan pada hasil unduhan QR Code:</p>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-not-allowed opacity-80">
                  <input type="checkbox" checked disabled className="w-4 h-4 accent-emerald-600 rounded" />
                  <span className="text-xs font-black text-slate-700">QR POLOS</span>
                </label>
                
                <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 cursor-pointer transition">
                  <input 
                    type="checkbox" 
                    checked={qrOptions.includeNis} 
                    onChange={(e) => setQrOptions({...qrOptions, includeNis: e.target.checked})}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer" 
                  />
                  <span className="text-xs font-black text-slate-700">NIS</span>
                </label>
                
                <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 cursor-pointer transition">
                  <input 
                    type="checkbox" 
                    checked={qrOptions.includeName} 
                    onChange={(e) => setQrOptions({...qrOptions, includeName: e.target.checked})}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer" 
                  />
                  <span className="text-xs font-black text-slate-700">NAMA</span>
                </label>

                <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 cursor-pointer transition">
                  <input 
                    type="checkbox" 
                    checked={qrOptions.includeClass} 
                    onChange={(e) => setQrOptions({...qrOptions, includeClass: e.target.checked})}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer" 
                  />
                  <span className="text-xs font-black text-slate-700">KELAS</span>
                </label>

                <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 cursor-pointer transition">
                  <input 
                    type="checkbox" 
                    checked={qrOptions.includeDorm} 
                    onChange={(e) => setQrOptions({...qrOptions, includeDorm: e.target.checked})}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer" 
                  />
                  <span className="text-xs font-black text-slate-700">ASRAMA</span>
                </label>
              </div>
            </div>
            
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowQrOptionsModal(false)}
                className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 rounded-xl transition cursor-pointer border-none bg-transparent"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDownload}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition shadow-md shadow-emerald-600/20 border-none cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Unduh Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
`;

const newContent = content.replace('{/* Camera scanner modal wrapper */}', modalCode + '\n      {/* Camera scanner modal wrapper */}');
fs.writeFileSync('src/components/QrGeneratifView.tsx', newContent);
