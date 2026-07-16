const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// App.tsx
code = code.replace(
  ".replace(/{URL_PORTAL}/g, portalUrl);",
  ".replace(/{NAMA WEBSITE}/g, portalUrl);"
);
code = code.replace(
  "const template = institution.waTemplateAccountData || institution.waTemplateRegistration || `*DATA AKUN & INFORMASI SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\nBerikut adalah data akun Ananda untuk login ke Portal Wali Santri:\\n\\nNama : {NAMA}\\nKelas : {KELAS}\\nAsrama : {ASRAMA}\\nNIS : {NIS}\\n\\nSilakan gunakan data diatas untuk memantau tabungan dan penitipan uang saku Ananda secara mandiri di:\\n{URL_PORTAL}\\n\\nTerima kasih.`;",
  "const template = institution.waTemplateAccountData || institution.waTemplateRegistration || `*E-SANGU SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\n*DATA AKUN SANTRI*\\n\\n*NIS :* {NIS}\\n*Nama :* {NAMA}\\n*Kelas :* {KELAS}\\n*Asrama :* {ASRAMA}\\n*No Wali :* {NO_WALI}\\n\\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {NAMA WEBSITE}`;"
);

fs.writeFileSync('src/App.tsx', code, 'utf8');

// StudentManagement.tsx
code = fs.readFileSync('src/components/StudentManagement.tsx', 'utf8');
code = code.replace(
  ".replace(/{URL_PORTAL}/g, portalUrl);",
  ".replace(/{NAMA WEBSITE}/g, portalUrl);"
);
code = code.replace(
  "const template = institution.waTemplateAccountData || institution.waTemplateRegistration || `*DATA AKUN & INFORMASI SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\nBerikut adalah data akun Ananda untuk login ke Portal Wali Santri:\\n\\nNama : {NAMA}\\nKelas : {KELAS}\\nAsrama : {ASRAMA}\\nNIS : {NIS}\\n\\nSilakan gunakan data diatas untuk memantau tabungan dan penitipan uang saku Ananda secara mandiri di:\\n{URL_PORTAL}\\n\\nTerima kasih.`;",
  "const template = institution.waTemplateAccountData || institution.waTemplateRegistration || `*E-SANGU SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\n*DATA AKUN SANTRI*\\n\\n*NIS :* {NIS}\\n*Nama :* {NAMA}\\n*Kelas :* {KELAS}\\n*Asrama :* {ASRAMA}\\n*No Wali :* {NO_WALI}\\n\\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {NAMA WEBSITE}`;"
);

// We need to add NO_WALI replacement to StudentManagement.tsx if it doesn't exist
// .replace(/{NIS}/g, student.nis) -> .replace(/{NIS}/g, student.nis)\n                                  .replace(/{NO_WALI}/g, student.guardianPhone)
code = code.replace(
  ".replace(/{NIS}/g, student.nis)",
  ".replace(/{NIS}/g, student.nis)\n                                  .replace(/{NO_WALI}/g, student.guardianPhone)"
);

fs.writeFileSync('src/components/StudentManagement.tsx', code, 'utf8');

// printHelper.ts
code = fs.readFileSync('src/lib/printHelper.ts', 'utf8');
code = code.replace(
  "const baseTemplate = template || `*{BUKTI}*\\n{NAMA PONDOK}\\n\\nBerikut rincian transaksi Ananda:\\nNama : {NAMA}\\nKelas : {KELAS}\\nID : {ID_TRANSAKSI}\\nWaktu : {WAKTU}\\nJenis : {POS_DANA}\\nNominal : {NOMINAL}\\nKeterangan : {KETERANGAN}\\n\\nTerima kasih.`;",
  "const baseTemplate = template || `*E-SANGU SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\n*{BUKTI}*\\n\\n*NIS :* {NIS}\\n*Nama :* {NAMA}\\n*Kelas :* {KELAS}\\n\\n*ID Transaksi :* {ID_TRANSAKSI}\\n*Tanggal & Waktu :* {TANGGAL & WAKTU}\\n*Akun Dana* : {AKUN DANA}\\n*Keterangan :* {KETERANGAN}\\n\\n*Nominal : {NOMINAL}*\\n______________________\\n> Dibuat otomatis oleh Sistem E-Sangu Santri`;"
);
code = code.replace(".replace(/{WAKTU}/g, formattedWaktu)", ".replace(/{TANGGAL & WAKTU}/g, formattedWaktu)");
code = code.replace(".replace(/{POS_DANA}/g, transaction.accountType)", ".replace(/{AKUN DANA}/g, transaction.accountType)");

fs.writeFileSync('src/lib/printHelper.ts', code, 'utf8');
console.log('Success replacements');
