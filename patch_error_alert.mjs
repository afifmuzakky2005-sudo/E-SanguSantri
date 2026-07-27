import fs from 'fs';
const content = fs.readFileSync('src/lib/firebaseStore.ts', 'utf8');

const target = `    await batch.commit();
  } catch (error) {
    console.error("Error saving data to Firebase:", error);
  }`;
  
const replacement = `    await batch.commit();
  } catch (error: any) {
    console.error("Error saving data to Firebase:", error);
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota')) {
      alert("Maaf, kuota database Firebase harian Anda telah habis. Perubahan hanya tersimpan sementara di aplikasi dan akan hilang saat halaman dimuat ulang. Silakan coba lagi besok.");
    }
  }`;
  
fs.writeFileSync('src/lib/firebaseStore.ts', content.replace(target, replacement));
