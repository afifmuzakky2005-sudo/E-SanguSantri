const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  "            institution={institution}\n            financial={financial}\n            onAddStudent={onAddStudent}",
  "            institution={institution}\n            onAddStudent={onAddStudent}"
);

fs.writeFileSync('src/components/AdminPanel.tsx', code, 'utf8');
console.log('Success revert AdminPanel');
