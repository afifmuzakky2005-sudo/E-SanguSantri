import fs from 'fs';
let content = fs.readFileSync('src/components/SavingsManagement.tsx', 'utf8');

content = content.replace(
  /onBulkDeactivateSavings\?: \(ids: string\[\]\) => void;/,
  'onBulkDeactivateSavings?: (ids: string[]) => void;\n  onBulkActivateSavings?: (ids: string[]) => void;'
);

content = content.replace(
  /onDeactivateSavings,\n\s*onBulkDeactivateSavings,/,
  'onDeactivateSavings,\n  onBulkDeactivateSavings,\n  onBulkActivateSavings,'
);

const oldButtonHandler = `onClick={() => {
                    addSavingsSelectedIds.forEach(id => onActivateSavings(id));
                    setShowAddSavingsModal(false);
                    setAddSavingsSearch('');
                    setAddSavingsSelectedIds([]);
                  }}`;
                  
const newButtonHandler = `onClick={() => {
                    if (onBulkActivateSavings) {
                      onBulkActivateSavings(addSavingsSelectedIds);
                    } else {
                      addSavingsSelectedIds.forEach(id => onActivateSavings(id));
                    }
                    setShowAddSavingsModal(false);
                    setAddSavingsSearch('');
                    setAddSavingsSelectedIds([]);
                  }}`;
                  
content = content.replace(oldButtonHandler, newButtonHandler);
fs.writeFileSync('src/components/SavingsManagement.tsx', content);
