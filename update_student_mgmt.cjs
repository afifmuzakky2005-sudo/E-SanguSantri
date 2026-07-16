const fs = require('fs');
let code = fs.readFileSync('src/components/StudentManagement.tsx', 'utf8');

// 1. Update imports to include FinancialSettings
code = code.replace(
  "import { Santri, Transaction, InstitutionSettings } from '../types';",
  "import { Santri, Transaction, InstitutionSettings, FinancialSettings } from '../types';"
);

// 2. Update props interface
const propsOld = `interface StudentManagementProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  onAddStudent: (student: Omit<Santri, 'id'>) => void;`;
const propsNew = `interface StudentManagementProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  financial: FinancialSettings;
  onAddStudent: (student: Omit<Santri, 'id'>) => void;`;
code = code.replace(propsOld, propsNew);

// 3. Update component signature
const sigOld = `export default function StudentManagement({
  students,
  transactions,
  institution,
  onAddStudent,`;
const sigNew = `export default function StudentManagement({
  students,
  transactions,
  institution,
  financial,
  onAddStudent,`;
code = code.replace(sigOld, sigNew);

// 4. Add state for agreement modal
const stateOld = `  const [formError, setFormError] = useState('');`;
const stateNew = `  const [formError, setFormError] = useState('');
  const [showAgreement, setShowAgreement] = useState(false);
  const [pendingStudent, setPendingStudent] = useState<Omit<Santri, 'id'> | null>(null);`;
code = code.replace(stateOld, stateNew);

// 5. Intercept handleAddSubmit
const submitOld = `    if (students.some(s => s.nis === nis)) {
      setFormError('NIS sudah terdaftar!');
      return;
    }

    onAddStudent({
      nis,
      bookNumber: '',
      name,
      className,
      dorm,
      guardianPhone,
      status: 'Aktif',
      hasSavings: false
    });

    setFormMode('view');
    setNis('');
    setName('');
    setClassName('');
    setDorm('');
    setGuardianPhone('');
    setFormError('');
  };`;
const submitNew = `    if (students.some(s => s.nis === nis)) {
      setFormError('NIS sudah terdaftar!');
      return;
    }

    setPendingStudent({
      nis,
      bookNumber: '',
      name,
      className,
      dorm,
      guardianPhone,
      status: 'Aktif',
      hasSavings: false
    });
    setShowAgreement(true);
  };

  const confirmAddStudent = () => {
    if (pendingStudent) {
      onAddStudent(pendingStudent);
      setFormMode('view');
      setNis('');
      setName('');
      setClassName('');
      setDorm('');
      setGuardianPhone('');
      setFormError('');
      setPendingStudent(null);
      setShowAgreement(false);
    }
  };`;
code = code.replace(submitOld, submitNew);

// 6. Append modal at the end before final </div>
const modalUI = `
      {/* Agreement Modal */}
      {showAgreement && (
        <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh]">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center shrink-0">
              <h3 className="font-black text-emerald-950 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Persetujuan Aturan Keuangan
              </h3>
              <button onClick={() => setShowAgreement(false)} className="text-emerald-400 hover:text-emerald-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700 font-medium">
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
                onClick={() => setShowAgreement(false)}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmAddStudent}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black rounded-xl shadow-md transition flex justify-center items-center gap-2 cursor-pointer border-none"
              >
                <CheckCircle className="w-4 h-4" />
                Setuju & Daftarkan
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace('    </div>\n  );\n}\n', modalUI + '    </div>\n  );\n}\n');

fs.writeFileSync('src/components/StudentManagement.tsx', code, 'utf8');
console.log('Success');
