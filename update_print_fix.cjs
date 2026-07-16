const fs = require('fs');
let content = fs.readFileSync('src/lib/printHelper.ts', 'utf8');

// I need to properly rewrite printPassbook's HTML.
// So I will just split by export const printPassbook and fix it.
let parts = content.split("export const printPassbook =");
if (parts.length === 2) {
  let passbookPart = parts[1];
  
  passbookPart = passbookPart.replace(
    /max-width: 1000px;/g,
    `max-width: 1200px;`
  );
  
  passbookPart = passbookPart.replace(
    /<\/style>/,
    `
          @media print {
            body { padding: 0; background: white; margin: 0; display: block; }
            .passbook-container { width: 100%; max-width: none; box-shadow: none; border: none; border-radius: 0; margin: 0; }
            .pb-header { padding: 20px; background-color: #064e3b !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .pb-content { padding: 0 20px 20px; }
            .pb-details-card { box-shadow: inset 0 0 0 1px #e2e8f0; margin: -10px 20px 20px; padding: 15px; }
            th, td { padding: 10px 8px; font-size: 13px; }
            th { font-size: 11px; }
            .admin-col { width: 150px; }
            
            /* Hide URL printing */
            @page { margin: 0.5cm; }
          }
        </style>`
  );

  passbookPart = passbookPart.replace(
    /<th class="text-center">Admin \/ Petugas<\/th>/g,
    `<th class="text-center admin-col">Admin / Petugas</th>`
  );
  
  content = parts[0] + "export const printPassbook =" + passbookPart;
  fs.writeFileSync('src/lib/printHelper.ts', content);
  console.log('Fixed passbook');
} else {
  console.log('Could not split');
}
