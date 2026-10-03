import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Memulai Inisialisasi Database MySQL Laragon Otomatis...');

const schemaPath = path.resolve(process.cwd(), 'schema.sql');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ File schema.sql tidak ditemukan!');
  process.exit(1);
}

try {
  // Execute mysql command to import schema.sql into Laragon MySQL
  execSync(`mysql -u root -e "SOURCE ${schemaPath.replace(/\\/g, '/')};"`, { stdio: 'inherit' });
  console.log('✅ BERHASIL! Database `esangu_santri` beserta seluruh tabel & data default awal berhasil dibuat secara otomatis!');
} catch (error) {
  console.log('⚠️ Mencoba perintah alternatif MySQL Laragon...');
  try {
    execSync(`mysql -u root < "${schemaPath}"`, { stdio: 'inherit' });
    console.log('✅ BERHASIL! Database `esangu_santri` berhasil diimpor otomatis!');
  } catch (e) {
    console.error('\n❌ Gagal mengeksekusi perintah mysql CLI secara otomatis.');
    console.log('\n💡 PETUNJUK MANUAL MENGGUNAKAN PHPMYADMIN (2 KLIK):');
    console.log('1. Buka http://localhost/phpmyadmin di browser.');
    console.log('2. Klik tab "Import" -> Pilih file `schema.sql` di folder project ini.');
    console.log('3. Klik tombol "Kirim" / "Go" di bagian bawah.');
  }
}
