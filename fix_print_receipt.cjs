const fs = require('fs');
let content = fs.readFileSync('src/lib/printHelper.ts', 'utf8');

const targetStr = `
          @media print {
            body { padding: 0; background: white; }
            .passbook-container { max-width: 100%; box-shadow: none; border: none; border-radius: 0; }
            .pb-header { padding: 30px; }
            .pb-content { padding: 0 30px 30px; }
            .pb-details-card { box-shadow: inset 0 0 0 1px #e2e8f0; margin: -15px 30px 25px; }
            th, td { padding: 12px 10px; font-size: 14px; }
            th { font-size: 12px; }
            .admin-col { width: 180px; }
          }
        </style>`;

const replacementStr = `
          @media print {
            body { padding: 0; background: white; }
            .receipt-container { max-width: 100%; box-shadow: none; border: none; }
          }
        </style>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/lib/printHelper.ts', content);
console.log('Fixed receipt print css');
