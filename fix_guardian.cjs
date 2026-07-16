const fs = require('fs');
let code = fs.readFileSync('src/components/GuardianPortal.tsx', 'utf8');

code = code.replace(
  /alert\(`Permintaan pendaftaran tabungan untuk "\$\{regName\}" \(Kelas: \$\{regClass\}\) telah dikirim\. \\n\\nSilakan hubungi pengurus\/bendahara untuk verifikasi NIS\.`\);/g,
  `alert("Pendaftaran Anda telah dikirim. Silakan hubungi pengurus/bendahara untuk konfirmasi pembukaan rekening tabungan.");`
);

code = code.replace(
  /<p className="text-\[9px\] font-bold text-gray-400 mt-1">Digunakan untuk konfirmasi buku tabungan\.<\/p>/g,
  `<p className="text-[9px] font-bold text-gray-400 mt-1">Digunakan untuk konfirmasi pembukaan rekening.</p>`
);

fs.writeFileSync('src/components/GuardianPortal.tsx', code, 'utf8');
console.log('Done fix_guardian');
