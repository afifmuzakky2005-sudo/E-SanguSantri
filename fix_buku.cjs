const fs = require('fs');
let code = fs.readFileSync('src/components/StudentManagement.tsx', 'utf8');

code = code.replace(
  `        'No. Buku': s.bookNumber || '-',\n`,
  ''
);
code = code.replace(
  `placeholder="Cari Nama, NIS, No. Buku..."`,
  `placeholder="Cari Nama, NIS..."`
);
fs.writeFileSync('src/components/StudentManagement.tsx', code, 'utf8');
console.log('Done fix_buku');
