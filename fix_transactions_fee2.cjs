const fs = require('fs');
let code = fs.readFileSync('src/components/Transactions.tsx', 'utf8');

const submitOld = `      note: finalFee > 0 ? \\\`\\\${\\tarikNote} (dipotong biaya admin dan layanan aplikasi Rp\\\${\\finalFee})\\\` : tarikNote,`;

const submitNew = `      note: finalFee > 0 ? (tarikNote ? \\\`\\\${\\tarikNote} (biaya admin dan layanan aplikasi)\\\` : 'biaya admin dan layanan aplikasi') : tarikNote,`;

code = code.replace("note: finalFee > 0 ? `${tarikNote} (dipotong biaya admin dan layanan aplikasi Rp${finalFee})` : tarikNote,", "note: finalFee > 0 ? (tarikNote ? `${tarikNote} (biaya admin dan layanan aplikasi)` : 'biaya admin dan layanan aplikasi') : tarikNote,");
fs.writeFileSync('src/components/Transactions.tsx', code, 'utf8');
console.log('Success final 4');
