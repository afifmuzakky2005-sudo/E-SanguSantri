import fs from 'fs';
const content = fs.readFileSync('src/components/QrGeneratifView.tsx', 'utf8');

const targetRegex = /const handleDownloadAllQr = async \(\) => \{[\s\S]*?setIsDownloadingAll\(false\);\n  \};/;

const replacement = `const handleConfirmDownload = async () => {
    setShowQrOptionsModal(false);
    if (downloadTarget === 'single') {
      const student = students.find(s => s.id === selectedQrStudentId);
      if (student) await downloadSinglePlainQr(student, qrOptions);
    } else {
      const list = students; // Download all students from data santri
      if (list.length === 0) {
        alert("Tidak ada data santri.");
        return;
      }
      
      setIsDownloadingAll(true);
      setDownloadProgress({ current: 0, total: list.length });

      for (let i = 0; i < list.length; i++) {
        const student = list[i];
        setDownloadProgress({ current: i + 1, total: list.length });
        await downloadSinglePlainQr(student, qrOptions);
        // stagger to avoid browser downloads blocking
        await new Promise(r => setTimeout(r, 450));
      }

      setIsDownloadingAll(false);
    }
  };`;

const newContent = content.replace(targetRegex, replacement);
fs.writeFileSync('src/components/QrGeneratifView.tsx', newContent);
