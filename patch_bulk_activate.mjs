import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const handleBulkDeactivateSavings = (ids: string[]) => {
    const toUpdate = students.filter(s => ids.includes(s.id)).map(s => ({ ...s, hasSavings: false, savingsActive: false }));
    const updated = students.map(s => ids.includes(s.id) ? toUpdate.find(u => u.id === s.id)! : s);
    
    setStudents(updated);
    saveFirebaseData({ santri: toUpdate });
    
    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Hapus Tabungan Massal', \`Menghapus data tabungan \${ids.length} santri\`);
  };`;
  
const replacement = `  const handleBulkActivateSavings = (ids: string[]) => {
    const toUpdate = students.filter(s => ids.includes(s.id)).map(s => ({ ...s, hasSavings: true, savingsActive: true }));
    const updated = students.map(s => ids.includes(s.id) ? toUpdate.find(u => u.id === s.id)! : s);
    
    setStudents(updated);
    saveFirebaseData({ santri: toUpdate });
    
    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Aktifkan Tabungan Massal', \`Mengaktifkan tabungan \${ids.length} santri\`);
  };

  const handleBulkDeactivateSavings = (ids: string[]) => {
    const toUpdate = students.filter(s => ids.includes(s.id)).map(s => ({ ...s, hasSavings: false, savingsActive: false }));
    const updated = students.map(s => ids.includes(s.id) ? toUpdate.find(u => u.id === s.id)! : s);
    
    setStudents(updated);
    saveFirebaseData({ santri: toUpdate });
    
    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Hapus Tabungan Massal', \`Menghapus data tabungan \${ids.length} santri\`);
  };`;

const newContent = content.replace(target, replacement);

const targetProps = `onActivateSavings={handleActivateSavings}
              onDeactivateSavings={handleDeactivateSavings}
              onBulkDeactivateSavings={handleBulkDeactivateSavings}`;
              
const propsReplacement = `onActivateSavings={handleActivateSavings}
              onDeactivateSavings={handleDeactivateSavings}
              onBulkDeactivateSavings={handleBulkDeactivateSavings}
              onBulkActivateSavings={handleBulkActivateSavings}`;

fs.writeFileSync('src/App.tsx', newContent.replace(targetProps, propsReplacement));
