import fs from 'fs';
const content = fs.readFileSync('src/components/StudentManagement.tsx', 'utf8');

// Patch handleSaveAdd
let newContent = content.replace(
  /if \(!nis \|\| !name \|\| !className \|\| !dorm\) \{/g,
  'if (!nis || !name || !className) {'
);

newContent = newContent.replace(
  /if \(!selectedStudentId \|\| !nis \|\| !name \|\| !className \|\| !dorm\) \{/g,
  'if (!selectedStudentId || !nis || !name || !className) {'
);

// Patch import validation
const dormValidationOld = `          if (!rowDorm) {
            rowErrors.push('Asrama wajib diisi');
          } else {
            const matchedDorm = (institution.dorms || []).find(d => d.toLowerCase() === rowDorm.toLowerCase());
            if (!matchedDorm) {
              rowErrors.push(\`Asrama "\${rowDorm}" tidak terdaftar di pengaturan\`);
            } else {
              normalizedRow.matchedDorm = matchedDorm;
            }
          }`;
          
const dormValidationNew = `          if (rowDorm) {
            const matchedDorm = (institution.dorms || []).find(d => d.toLowerCase() === rowDorm.toLowerCase());
            if (!matchedDorm) {
              rowErrors.push(\`Asrama "\${rowDorm}" tidak terdaftar di pengaturan\`);
            } else {
              normalizedRow.matchedDorm = matchedDorm;
            }
          }`;
          
newContent = newContent.replace(dormValidationOld, dormValidationNew);

// Patch instructions
newContent = newContent.replace(
  /<li>Kolom wajib: <strong className="text-emerald-800">NIS<\/strong>, <strong className="text-emerald-800">Nama<\/strong>, <strong className="text-emerald-800">Kelas<\/strong>, <strong className="text-emerald-800">Asrama<\/strong>\.<\/li>/,
  '<li>Kolom wajib: <strong className="text-emerald-800">NIS</strong>, <strong className="text-emerald-800">Nama</strong>, <strong className="text-emerald-800">Kelas</strong>.</li>'
);

newContent = newContent.replace(
  /<li>Nama kelas dan asrama harus persis sesuai yang terdaftar di pengaturan lembaga\.<\/li>/,
  '<li>Nama kelas (wajib) dan asrama (opsional) harus persis sesuai yang terdaftar di pengaturan lembaga.</li>'
);

newContent = newContent.replace(
  /Kolom <strong className="text-emerald-800">No Wali<\/strong> bersifat opsional/,
  'Kolom <strong className="text-emerald-800">Asrama</strong> dan <strong className="text-emerald-800">No Wali</strong> bersifat opsional'
);

// Update UI "Wajib" indicator for dorm
newContent = newContent.replace(
  /<label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Asrama <span className="text-red-500">\*<\/span><\/label>/g,
  '<label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Asrama</label>'
);

fs.writeFileSync('src/components/StudentManagement.tsx', newContent);
