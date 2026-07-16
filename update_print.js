const fs = require('fs');
let content = fs.readFileSync('src/lib/printHelper.ts', 'utf8');

// Replace CSS
content = content.replace(
  /max-width: 1000px;/g,
  `max-width: 1200px;`
);

content = content.replace(
  /<\/style>/,
  `
          @media print {
            body { padding: 0; background: white; }
            .passbook-container { max-width: 100%; box-shadow: none; border: none; border-radius: 0; }
            .pb-header { padding: 30px; }
            .pb-content { padding: 0 30px 30px; }
            .pb-details-card { box-shadow: inset 0 0 0 1px #e2e8f0; margin: -15px 30px 25px; }
            th, td { padding: 12px 10px; }
            .admin-col { width: 150px; }
          }
        </style>`
);

content = content.replace(
  /<th class="text-center">Admin \/ Petugas<\/th>/g,
  `<th class="text-center admin-col">Admin / Petugas</th>`
);

fs.writeFileSync('src/lib/printHelper.ts', content);
console.log('Done!');
