const fs = require('fs');
let code = fs.readFileSync('src/components/GuardianPortal.tsx', 'utf8');

code = code.replace(
  "  const [regGuardianPhone, setRegGuardianPhone] = useState('');",
  "  const [regGuardianPhone, setRegGuardianPhone] = useState('');\n  const [showRegAgreement, setShowRegAgreement] = useState(false);"
);

fs.writeFileSync('src/components/GuardianPortal.tsx', code, 'utf8');
console.log('Success state fix');
