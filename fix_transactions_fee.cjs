const fs = require('fs');
let code = fs.readFileSync('src/components/Transactions.tsx', 'utf8');

// find where note is constructed
const submitOld = `      adminFee: finalFee,
      netAmount: tarikAmount - finalFee,
      note: tarikNote,
      cashierName: cashierName,`;

const submitNew = `      adminFee: finalFee,
      netAmount: tarikAmount - finalFee,
      note: finalFee > 0 ? \`\${tarikNote} (dipotong biaya admin dan layanan aplikasi Rp\${finalFee})\` : tarikNote,
      cashierName: cashierName,`;

code = code.replace(submitOld, submitNew);
fs.writeFileSync('src/components/Transactions.tsx', code, 'utf8');
console.log('Success final 3');
