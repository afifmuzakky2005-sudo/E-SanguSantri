import fs from 'fs';
const content = fs.readFileSync('src/lib/firebaseStore.ts', 'utf8');

const target = `    await batch.commit();
  } catch (e) {
    console.error("Error deleting doc:", e);
  }`;
  
const replacement = `    await batch.commit();
  } catch (e: any) {
    console.error("Error deleting doc:", e);
    if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota')) {
      alert("Maaf, kuota database Firebase harian Anda telah habis. Perubahan hanya tersimpan sementara.");
    }
  }`;
  
fs.writeFileSync('src/lib/firebaseStore.ts', content.replace(target, replacement));
