const fs = require('fs');
let code = fs.readFileSync('src/components/SavingsManagement.tsx', 'utf8');

const oldTemplate = "const template = institution.waTemplateBalanceSummary || `*Ringkasan Informasi Saldo*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\nBerikut adalah ringkasan informasi saldo Ananda:\\n\\nNama : {NAMA}\\nKelas : {KELAS}\\nAsrama : {ASRAMA}\\nNIS : {NIS}\\n\\n- Saldo Tabungan : {SALDO_TABUNGAN}\\n- Saldo Penitipan : {SALDO_PENITIPAN}\\n- Total Saldo : {TOTAL_SALDO}\\n\\nTerima kasih.`;";

const newTemplate = "const template = institution.waTemplateBalanceSummary || `*E-SANGU SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\n*RINGKASAN INFROMASI SALDO*\\n\\n*NIS :* {NIS}\\n*Nama :* {NAMA}\\n*Kelas :* {KELAS}\\n\\n*Saldo Tabungan :* {Saldo Tabungan}\\n*Saldo Penitipan :* {Saldo Penitipan}\\n\\n*TOTAL SALDO* : {TOTAL SALDO}\\n______________________\\n> Dibuat otomatis oleh Sistem E-Sangu Santri`;";

code = code.replace(oldTemplate, newTemplate);

code = code.replace(".replace(/{SALDO_TABUNGAN}/g,", ".replace(/{Saldo Tabungan}/g,");
code = code.replace(".replace(/{SALDO_PENITIPAN}/g,", ".replace(/{Saldo Penitipan}/g,");
code = code.replace(".replace(/{TOTAL_SALDO}/g,", ".replace(/{TOTAL SALDO}/g,");

fs.writeFileSync('src/components/SavingsManagement.tsx', code, 'utf8');

let settingsCode = fs.readFileSync('src/components/Settings.tsx', 'utf8');
settingsCode = settingsCode.replace(
  '<code className="text-emerald-700 font-bold font-mono">{"{SALDO_TABUNGAN}"}</code>, ',
  '<code className="text-emerald-700 font-bold font-mono">{"{Saldo Tabungan}"}</code>, '
);
settingsCode = settingsCode.replace(
  '<code className="text-emerald-700 font-bold font-mono">{"{SALDO_PENITIPAN}"}</code>, ',
  '<code className="text-emerald-700 font-bold font-mono">{"{Saldo Penitipan}"}</code>, '
);
settingsCode = settingsCode.replace(
  '<code className="text-emerald-700 font-bold font-mono">{"{TOTAL_SALDO}"}</code>',
  '<code className="text-emerald-700 font-bold font-mono">{"{TOTAL SALDO}"}</code>'
);

settingsCode = settingsCode.replace(
  '<code className="text-emerald-700 font-bold font-mono">{"{WAKTU}"}</code>, ',
  '<code className="text-emerald-700 font-bold font-mono">{"{TANGGAL & WAKTU}"}</code>, '
);
settingsCode = settingsCode.replace(
  '<code className="text-emerald-700 font-bold font-mono">{"{POS_DANA}"}</code>, ',
  '<code className="text-emerald-700 font-bold font-mono">{"{AKUN DANA}"}</code>, '
);

settingsCode = settingsCode.replace(
  '<code className="text-emerald-700 font-bold font-mono">{"{WEBSITE}"}</code>, ',
  '<code className="text-emerald-700 font-bold font-mono">{"{NAMA WEBSITE}"}</code>, '
);

fs.writeFileSync('src/components/Settings.tsx', settingsCode, 'utf8');
console.log('Success settings and savings');
