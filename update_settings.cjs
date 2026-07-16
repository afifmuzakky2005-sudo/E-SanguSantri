const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const stateStart = `  const [finFeePenAmt, setFinFeePenAmt] = useState(financial.adminFeePenitipanAmount);`;
const stateEnd = `  const [finSavingsBookFee, setFinSavingsBookFee] = useState(financial.savingsBookFeeAmount || 5000);
  const [finMaxDepositAmt, setFinMaxDepositAmt] = useState(financial.maxDepositAmount || 500000);`;
code = code.replace(stateStart, stateStart + '\n' + stateEnd);

const saveStart = `      adminFeePenitipanEnabled: finFeePenEnabled,
      adminFeePenitipanAmount: finFeePenAmt`;
const saveEnd = `      adminFeePenitipanEnabled: finFeePenEnabled,
      adminFeePenitipanAmount: finFeePenAmt,
      savingsBookFeeAmount: finSavingsBookFee,
      maxDepositAmount: finMaxDepositAmt`;
code = code.replace(saveStart, saveEnd);

const uiStart = `            {/* Rules for Tabungan */}`;
const uiEnd = `            {/* General Fees */}
            <div className="bg-blue-50/50 border border-blue-100/70 p-3.5 rounded-lg space-y-3 mb-4">
              <span className="font-bold text-blue-950 block text-[11px] uppercase tracking-wider">Aturan Umum</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Biaya Buku Tabungan (Awal)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-gray-400 font-bold">Rp</span>
                    <input
                      type="number"
                      value={finSavingsBookFee}
                      onChange={(e) => setFinSavingsBookFee(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Nominal Maksimal Penitipan</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-gray-400 font-bold">Rp</span>
                    <input
                      type="number"
                      value={finMaxDepositAmt}
                      onChange={(e) => setFinMaxDepositAmt(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rules for Tabungan */}`;
code = code.replace(uiStart, uiEnd);

fs.writeFileSync('src/components/Settings.tsx', code, 'utf8');
console.log('Success');
