const fs = require('fs');
let code = fs.readFileSync('src/components/StudentManagement.tsx', 'utf8');

// I notice `const confirmAddStudent = () => {` was injected inside `handleAddSubmit` which was probably wrong or scoped badly.
// Let's find handleAddSubmit.
code = code.replace(
  `  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis.trim() || !name.trim() || !className.trim() || !dorm.trim() || !guardianPhone.trim()) {
      setFormError('Semua field harus diisi!');
      return;
    }

    if (students.some(s => s.nis === nis)) {
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
      setShowAddModal(false);
    }
  };`,
  `  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis.trim() || !name.trim() || !className.trim() || !dorm.trim() || !guardianPhone.trim()) {
      setFormError('Semua field harus diisi!');
      return;
    }

    if (students.some(s => s.nis === nis)) {
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
      setNis('');
      setName('');
      setClassName('');
      setDorm('');
      setGuardianPhone('');
      setFormError('');
      setPendingStudent(null);
      setShowAgreement(false);
      setShowAddModal(false);
    }
  };`
);

// The problem is `handleAddSubmit` was not scoped properly? Wait, let's look at the original code in previous version. Wait, `setFormMode('view')` does not exist, it's `setShowAddModal(false)`.
// Let's grep handleAddSubmit
