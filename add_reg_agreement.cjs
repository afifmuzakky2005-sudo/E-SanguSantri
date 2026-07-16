const fs = require('fs');
let code = fs.readFileSync('src/components/GuardianPortal.tsx', 'utf8');

// Add state
const stateOld = `  const [regDorm, setRegDorm] = useState('');
  const [regGuardianPhone, setRegGuardianPhone] = useState('');
  const [showRegStatusModal, setShowRegStatusModal] = useState(false);`;
const stateNew = `  const [regDorm, setRegDorm] = useState('');
  const [regGuardianPhone, setRegGuardianPhone] = useState('');
  const [showRegStatusModal, setShowRegStatusModal] = useState(false);
  const [showRegAgreement, setShowRegAgreement] = useState(false);`;
code = code.replace(stateOld, stateNew);

// Update handleRegisterSubmit and add confirmRegistration
const submitOld = `  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRegister) {
      onRegister({
        name: regName,
        className: regClass,
        dorm: regDorm,
        guardianPhone: regGuardianPhone
      });
      alert(\`Permintaan pendaftaran tabungan untuk "\${regName}" (Kelas: \${regClass}) telah dikirim. \\n\\nSilakan hubungi pengurus/bendahara untuk verifikasi NIS.\`);
      setRegName('');
      setRegClass('');
      setRegDorm('');
      setRegGuardianPhone('');
      setView('portal');
    } else {
      alert(\`Permintaan pendaftaran tabungan untuk "\${regName}" (Kelas: \${regClass}) telah dikirim. \\n\\nSilakan hubungi pengurus/bendahara untuk verifikasi NIS.\`);
      setRegName('');
      setView('portal');
    }
  };`;

const submitNew = `  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowRegAgreement(true);
  };

  const confirmRegistration = () => {
    setShowRegAgreement(false);
    if (onRegister) {
      onRegister({
        name: regName,
        className: regClass,
        dorm: regDorm,
        guardianPhone: regGuardianPhone
      });
      alert(\`Permintaan pendaftaran tabungan untuk "\${regName}" (Kelas: \${regClass}) telah dikirim. \\n\\nSilakan hubungi pengurus/bendahara untuk verifikasi NIS.\`);
      setRegName('');
      setRegClass('');
      setRegDorm('');
      setRegGuardianPhone('');
      setView('portal');
    } else {
      alert(\`Permintaan pendaftaran tabungan untuk "\${regName}" (Kelas: \${regClass}) telah dikirim. \\n\\nSilakan hubungi pengurus/bendahara untuk verifikasi NIS.\`);
      setRegName('');
      setRegClass('');
      setRegDorm('');
      setRegGuardianPhone('');
      setView('portal');
    }
  };`;

code = code.replace(submitOld, submitNew);

// Import CheckCircle & Shield
// Already checking for imported lucide icons
code = code.replace(
  "import { LogIn, KeyRound, Phone, CheckCircle2, Lock, Unlock, ArrowDownCircle, ArrowUpCircle, Printer, Calendar, Search, Info, UserPlus, MessageSquare, X } from 'lucide-react';",
  "import { LogIn, KeyRound, Phone, CheckCircle2, Lock, Unlock, ArrowDownCircle, ArrowUpCircle, Printer, Calendar, Search, Info, UserPlus, MessageSquare, X, CheckCircle, Shield } from 'lucide-react';"
);

const modalHtml = `
      {/* Registration Agreement Modal */}
      {showRegAgreement && (
        <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh]">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center shrink-0">
              <h3 className="font-black text-emerald-950 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Persetujuan Aturan Keuangan
              </h3>
              <button onClick={() => setShowRegAgreement(false)} className="text-emerald-400 hover:text-emerald-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700 font-medium leading-relaxed">
              <p>Sebelum mendaftarkan santri, harap setujui aturan dan kebijakan tabungan berikut:</p>
              
              <ul className="space-y-3 bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Ketika awal membuka tabungan akan dikenakan biaya untuk Buku Tabungan sebesar <strong className="text-emerald-700">Rp{(financial.savingsBookFeeAmount || 5000).toLocaleString('id-ID')}</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Uang tabungan bisa diambil sebelum liburan, (maksimal 1 tahun <strong className="text-emerald-700">{financial.maxWithdrawalsPerYear}x</strong>).</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Biaya admin dan layanan aplikasi setiap penarikan uang tabungan sebesar <strong className="text-emerald-700">Rp{(financial.adminFeeTabunganAmount || 5000).toLocaleString('id-ID')}</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Penitipan uang <strong>free</strong> (tidak ada biaya admin & batas masa penarikan), namun maksimal sebesar <strong className="text-blue-600">Rp{(financial.maxDepositAmount || 500000).toLocaleString('id-ID')}</strong>. Jika lebih, disarankan digabung ke Tabungan.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowRegAgreement(false)}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmRegistration}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black rounded-xl shadow-md transition flex justify-center items-center gap-2 cursor-pointer border-none"
              >
                <CheckCircle className="w-4 h-4" />
                Setuju & Kirim
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace('    </div>\n  );\n}\n', modalHtml + '    </div>\n  );\n}\n');

fs.writeFileSync('src/components/GuardianPortal.tsx', code, 'utf8');
console.log('Success add Reg Agreement');
