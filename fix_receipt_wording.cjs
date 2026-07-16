const fs = require('fs');
let code = fs.readFileSync('src/lib/printHelper.ts', 'utf8');

code = code.replace(
  '<span class="amount-label-detail">Biaya Admin & Aplikasi</span>',
  '<span class="amount-label-detail">Biaya Admin dan Layanan Aplikasi</span>'
);

code = code.replace(
  '<span class="amount-label-detail">Dana yang Ditarik</span>',
  '<span class="amount-label-detail">Dana yang ditarik</span>'
);

fs.writeFileSync('src/lib/printHelper.ts', code, 'utf8');
console.log('Success wording fix');
