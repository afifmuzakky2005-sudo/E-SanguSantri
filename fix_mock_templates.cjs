const fs = require('fs');
let code = fs.readFileSync('src/data/mockData.ts', 'utf8');

const oldTemplates = `  waTemplateRegistration: "*E-SANGU SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\n*DATA AKUN SANTRI*\\n\\n*NIS :* {NIS}\\n*Nama :* {NAMA}\\n*Kelas :* {KELAS}\\n*Asrama :* {ASRAMA}\\n*No Wali :* {NO_WALI}\\n\\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {WEBSITE}",
  waTemplateTransaction: "*E-SANGU SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\n*{BUKTI}*\\n\\n*NIS :* {NIS}\\n*Nama :* {NAMA}\\n*Kelas :* {KELAS}\\n\\n*ID Transaksi :* {ID_TRANSAKSI}\\n*Tanggal & Waktu :* {WAKTU}\\n*Akun Dana* : {POS_DANA}\\n*Keterangan* : {KETERANGAN}\\n\\n*Nominal : {NOMINAL}*\\n______________________\\n> Dibuat otomatis oleh Sistem E-Sangu Santri",
  waTemplateAccountData: "*E-SANGU SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\n*DATA AKUN SANTRI*\\n\\n*NIS :* {NIS}\\n*Nama :* {NAMA}\\n*Kelas :* {KELAS}\\n*Asrama :* {ASRAMA}\\n*No Wali :* {NO_WALI}\\n\\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {WEBSITE}",
  waTemplateBalanceSummary: "*E-SANGU SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\n*RINGKASAN INFROMASI SALDO*\\n\\n*NIS :* {NIS}\\n*Nama :* {NAMA}\\n*Kelas :* {KELAS}\\n\\n*Saldo Tabungan :* {SALDO_TABUNGAN}\\n*Saldo Penitipan :* {SALDO_PENITIPAN}\\n\\n*TOTAL SALDO* : {TOTAL_SALDO}\\n______________________\\n> Dibuat otomatis oleh Sistem E-Sangu Santri",`;

const newTemplates = `  waTemplateRegistration: "*E-SANGU SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\n*DATA AKUN SANTRI*\\n\\n*NIS :* {NIS}\\n*Nama :* {NAMA}\\n*Kelas :* {KELAS}\\n*Asrama :* {ASRAMA}\\n*No Wali :* {NO_WALI}\\n\\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {NAMA WEBSITE}",
  waTemplateTransaction: "*E-SANGU SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\n*{BUKTI}*\\n\\n*NIS :* {NIS}\\n*Nama :* {NAMA}\\n*Kelas :* {KELAS}\\n\\n*ID Transaksi :* {ID_TRANSAKSI}\\n*Tanggal & Waktu :* {TANGGAL & WAKTU}\\n*Akun Dana* : {AKUN DANA}\\n*Keterangan* : {KETERANGAN}\\n\\n*Nominal : {NOMINAL}*\\n______________________\\n> Dibuat otomatis oleh Sistem E-Sangu Santri",
  waTemplateAccountData: "*E-SANGU SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\n*DATA AKUN SANTRI*\\n\\n*NIS :* {NIS}\\n*Nama :* {NAMA}\\n*Kelas :* {KELAS}\\n*Asrama :* {ASRAMA}\\n*No Wali :* {NO_WALI}\\n\\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {NAMA WEBSITE}",
  waTemplateBalanceSummary: "*E-SANGU SANTRI*\\nSistem Tabungan dan Penitipan Uang Santri\\n{NAMA PONDOK}\\n\\n*RINGKASAN INFROMASI SALDO*\\n\\n*NIS :* {NIS}\\n*Nama :* {NAMA}\\n*Kelas :* {KELAS}\\n\\n*Saldo Tabungan :* {Saldo Tabungan}\\n*Saldo Penitipan :* {Saldo Penitipan}\\n\\n*TOTAL SALDO* : {TOTAL SALDO}\\n______________________\\n> Dibuat otomatis oleh Sistem E-Sangu Santri",`;

code = code.replace(oldTemplates, newTemplates);
fs.writeFileSync('src/data/mockData.ts', code, 'utf8');
console.log('Success mockData');
