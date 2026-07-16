const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const oldFunc = `  const exportReportPDF = (type: 'tabungan' | 'penitipan' | 'admin') => {
    try {
      const printWindow = window.open('', '_blank');`;

const endMarker = "  };\n\n  // --- STATS COMPUTATION FOR DASHBOARD ---";

const newFunc = `  const exportReportPDF = (type: 'tabungan' | 'penitipan' | 'admin') => {
    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      let title = '';
      let filename = '';
      let head: string[][] = [];
      let body: any[][] = [];

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      
      if (type === 'tabungan') {
        title = 'LAPORAN AKUMULASI TABUNGAN SANTRI';
        filename = 'Laporan_Tabungan_Santri.pdf';
        head = [['No', 'NIS', 'Nama Santri', 'Kelas', 'Asrama', 'Saldo Tabungan']];
        body = students.map((s, idx) => {
          const bal = calculateBalances(s.id, transactions);
          return [idx + 1, s.nis, s.name, s.className, s.dorm, formatCurrency(bal.tabungan)];
        });

        doc.text(title, pageWidth / 2, 40, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(institution.name, pageWidth / 2, 55, { align: 'center' });
        
        doc.text(\`Total Tabungan: \${formatCurrency(totalTabungan)}\`, 40, 80);
        doc.text(\`Rata-rata: \${formatCurrency(activeStudentsCount > 0 ? (totalTabungan / activeStudentsCount) : 0)}\`, 40, 95);
        
        (doc as any).autoTable({
          startY: 110,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: { fillColor: [6, 95, 70] },
          styles: { fontSize: 8, cellPadding: 4 },
          columnStyles: {
            5: { halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] }
          }
        });
      } else if (type === 'penitipan') {
        title = 'LAPORAN AKUMULASI PENITIPAN OPERASIONAL';
        filename = 'Laporan_Penitipan_Operasional.pdf';
        head = [['No', 'NIS', 'Nama Santri', 'Kelas', 'Asrama', 'Saldo Penitipan']];
        body = students.map((s, idx) => {
          const bal = calculateBalances(s.id, transactions);
          return [idx + 1, s.nis, s.name, s.className, s.dorm, formatCurrency(bal.penitipan)];
        });

        doc.text(title, pageWidth / 2, 40, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(institution.name, pageWidth / 2, 55, { align: 'center' });
        
        doc.text(\`Total Penitipan: \${formatCurrency(totalPenitipan)}\`, 40, 80);
        doc.text(\`Rata-rata: \${formatCurrency(activeStudentsCount > 0 ? (totalPenitipan / activeStudentsCount) : 0)}\`, 40, 95);
        
        (doc as any).autoTable({
          startY: 110,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: { fillColor: [6, 95, 70] },
          styles: { fontSize: 8, cellPadding: 4 },
          columnStyles: {
            5: { halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] }
          }
        });
      } else if (type === 'admin') {
        title = 'REKAP LAPORAN PENDAPATAN BIAYA ADMINISTRASI';
        filename = 'Rekap_Pendapatan_Admin_Fee.pdf';
        head = [['ID Transaksi', 'Tanggal', 'Santri (Kelas)', 'Jenis Akun', 'Biaya Admin', 'Kasir']];
        const adminTx = transactions.filter(t => (t.adminFee || 0) > 0);
        body = adminTx.map((t, idx) => {
          return [\`TX\${String(idx + 1).padStart(7, '0')}\`, t.date, \`\${t.santriName} (\${t.santriClass})\`, t.accountType, formatCurrency(t.adminFee), t.cashierName];
        });

        doc.text(title, pageWidth / 2, 40, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(institution.name, pageWidth / 2, 55, { align: 'center' });
        
        doc.text(\`Total Pendapatan Admin Fee: \${formatCurrency(totalAdminRevenue)}\`, 40, 80);
        
        (doc as any).autoTable({
          startY: 95,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: { fillColor: [6, 95, 70] },
          styles: { fontSize: 8, cellPadding: 4 },
          columnStyles: {
            4: { halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] }
          }
        });
      }

      doc.save(filename);
    } catch (err: any) {
      alert('Gagal mengekspor PDF: ' + err.message);
    }`;

const startIndex = code.indexOf(oldFunc);
if (startIndex !== -1) {
  const endIndex = code.indexOf(endMarker, startIndex);
  if (endIndex !== -1) {
    const finalCode = code.substring(0, startIndex) + newFunc + "\n" + code.substring(endIndex);
    fs.writeFileSync('src/components/AdminPanel.tsx', finalCode, 'utf8');
    console.log("Success");
  } else {
    console.log("End not found");
  }
} else {
  console.log("Start not found");
}
