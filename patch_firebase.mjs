import fs from 'fs';
const content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

if (!content.includes("setLogLevel")) {
  let newContent = content.replace(
    /import \{ initializeFirestore/,
    'import { setLogLevel, initializeFirestore'
  );
  newContent += '\nsetLogLevel("silent");\n';
  fs.writeFileSync('src/lib/firebase.ts', newContent);
}
