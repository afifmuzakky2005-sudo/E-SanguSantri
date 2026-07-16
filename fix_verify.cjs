const fs = require('fs');
let code = fs.readFileSync('src/components/GuardianPortal.tsx', 'utf8');

code = code.replace(
  /if \(student\.nis\.trim\(\) === nisInput\.trim\(\)\) {\n\s*setLoggedInStudent\(student\);\n\s*}/g,
  `if (student.nis.trim() === nisInput.trim()) {\n      alert('Data ditemukan. Mengalihkan ke halaman data santri...');\n      setLoggedInStudent(student);\n    }`
);

fs.writeFileSync('src/components/GuardianPortal.tsx', code, 'utf8');
console.log('Done fix_verify');
