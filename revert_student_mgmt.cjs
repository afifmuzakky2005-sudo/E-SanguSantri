const fs = require('fs');
let code = fs.readFileSync('src/components/StudentManagement.tsx', 'utf8');

// remove financial from imports
code = code.replace(
  "import { Santri, Transaction, InstitutionSettings, FinancialSettings } from '../types';",
  "import { Santri, Transaction, InstitutionSettings } from '../types';"
);

const propsOld = `interface StudentManagementProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  financial: FinancialSettings;
  onAddStudent: (student: Omit<Santri, 'id'>) => void;`;
const propsNew = `interface StudentManagementProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  onAddStudent: (student: Omit<Santri, 'id'>) => void;`;
code = code.replace(propsOld, propsNew);

const sigOld = `export default function StudentManagement({
  students,
  transactions,
  institution,
  financial,
  onAddStudent,`;
const sigNew = `export default function StudentManagement({
  students,
  transactions,
  institution,
  onAddStudent,`;
code = code.replace(sigOld, sigNew);

const stateOld = `  const [formError, setFormError] = useState('');
  const [showAgreement, setShowAgreement] = useState(false);
  const [pendingStudent, setPendingStudent] = useState<Omit<Santri, 'id'> | null>(null);`;
const stateNew = `  const [formError, setFormError] = useState('');`;
code = code.replace(stateOld, stateNew);

const submitOld = `    if (students.some(s => s.nis === nis)) {
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
      status,
      hasSavings: false,
      savingsActive: false
    });
    setShowAgreement(true);
  };

  const confirmAddStudent = () => {
    if (pendingStudent) {
      onAddStudent(pendingStudent);
      setPendingStudent(null);
      setShowAgreement(false);
      setShowAddModal(false);
    }
  };`;
const submitNew = `    if (students.some(s => s.nis === nis)) {
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
      status,
      hasSavings: false,
      savingsActive: false
    });
    setShowAddModal(false);
  };`;
code = code.replace(submitOld, submitNew);

// Need to remove the modal UI. Let's use a regex or string replacement.
// It starts at `{/* Agreement Modal */}` and ends before final `    </div>\n  );\n}\n`
code = code.replace(/\{\/\* Agreement Modal \*\/\}[\s\S]*?Setuju & Daftarkan\n\s*<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\)}/, "");

fs.writeFileSync('src/components/StudentManagement.tsx', code, 'utf8');
console.log('Success revert StudentManagement');
