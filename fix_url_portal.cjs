const fs = require('fs');

let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');
code = code.replace(
  '<code className="text-emerald-700 font-bold font-mono">{"{URL_PORTAL}"}</code>, ',
  '<code className="text-emerald-700 font-bold font-mono">{"{NAMA WEBSITE}"}</code>, '
);
fs.writeFileSync('src/components/Settings.tsx', code, 'utf8');

let savingsCode = fs.readFileSync('src/components/SavingsManagement.tsx', 'utf8');
savingsCode = savingsCode.replace(
  ".replace(/{URL_PORTAL}/g, window.location.origin)",
  ".replace(/{NAMA WEBSITE}/g, window.location.origin)"
);
fs.writeFileSync('src/components/SavingsManagement.tsx', savingsCode, 'utf8');
console.log('Success URL_PORTAL fix');
