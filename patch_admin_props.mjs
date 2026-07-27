import fs from 'fs';
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

let newContent = content.replace(
  /onBulkDeactivateSavings\?: \(ids: string\[\]\) => void;/,
  'onBulkDeactivateSavings?: (ids: string[]) => void;\n  onBulkActivateSavings?: (ids: string[]) => void;'
);

newContent = newContent.replace(
  /onDeactivateSavings,\n  onBulkDeactivateSavings/,
  'onDeactivateSavings,\n  onBulkDeactivateSavings,\n  onBulkActivateSavings'
);

newContent = newContent.replace(
  /onDeactivateSavings=\{onDeactivateSavings\}\n            onBulkDeactivateSavings=\{onBulkDeactivateSavings\}/,
  'onDeactivateSavings={onDeactivateSavings}\n            onBulkDeactivateSavings={onBulkDeactivateSavings}\n            onBulkActivateSavings={onBulkActivateSavings}'
);

fs.writeFileSync('src/components/AdminPanel.tsx', newContent);
