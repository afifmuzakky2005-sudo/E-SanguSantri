const fs = require('fs');
let code = fs.readFileSync('src/components/StudentManagement.tsx', 'utf8');

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
      status,
      hasSavings: false,
      savingsActive: false
    });
    setShowAddModal(false);
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

code = code.replace(submitOld, submitNew);
fs.writeFileSync('src/components/StudentManagement.tsx', code, 'utf8');
console.log('Success final');
