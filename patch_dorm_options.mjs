import fs from 'fs';
const content = fs.readFileSync('src/components/StudentManagement.tsx', 'utf8');

let newContent = content.replace(
  /<option value="" disabled>-- Pilih Asrama --<\/option>/g,
  '<option value="">-- Pilih Asrama (Opsional) --</option>'
);

// Second form might not have the empty option at all, let's insert it if missing.
newContent = newContent.replace(
  /className="w-full px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer"\n\s*>\n\s*\{dormsList\.map/g,
  'className="w-full px-4 py-3 text-xs font-bold bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer"\n                  >\n                    <option value="">-- Pilih Asrama (Opsional) --</option>\n                    {dormsList.map'
);

fs.writeFileSync('src/components/StudentManagement.tsx', newContent);
