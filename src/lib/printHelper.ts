import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Transaction, Santri, InstitutionSettings } from '../types';

export function formatTxId(txId: string, transactionsList: Transaction[] = []): string {
  if (!txId) return '';
  // Sort transactions chronologically (oldest first) to assign sequence numbers
  const sorted = [...transactionsList].sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
  const index = sorted.findIndex(t => t.id === txId);
  if (index !== -1) {
    return `TX-${(index + 1).toString().padStart(7, '0')}`;
  }
  
  // Fallback: use digits of timestamp
  const digits = txId.replace(/\D/g, '');
  if (digits.length >= 7) {
    return `TX-${digits.slice(-7)}`;
  }
  return `TX-${digits.padStart(7, '0')}`;
}

export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  // Remove all non-numeric characters except maybe leading plus if preserved, but let's re-build cleanly
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with '0', replace with '62'
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  
  // If it starts with '8', add '62'
  if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  
  return '+' + cleaned;
}

export function getWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = formatWhatsAppNumber(phone);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
}

export function parseWaTransactionTemplate(
  template: string,
  transaction: Transaction,
  santri: Santri,
  institution: InstitutionSettings,
  transactionsList: Transaction[] = []
): string {
  const formattedId = formatTxId(transaction.id, transactionsList);
  const formattedWaktu = new Date(transaction.timestamp).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  const formattedNominal = 'Rp ' + transaction.netAmount.toLocaleString('id-ID');
  const buktiText = transaction.type === 'Setor' ? 'BUKTI SETOR DANA' : 'BUKTI PENARIKAN DANA';

  const baseTemplate = template || `*E-SANGU SANTRI*\nSistem Tabungan dan Penitipan Uang Santri\n{NAMA PONDOK}\n\n*{BUKTI}*\n\n*NIS :* {NIS}\n*Nama :* {NAMA}\n*Kelas :* {KELAS}\n\n*ID Transaksi :* {ID_TRANSAKSI}\n*Tanggal & Waktu :* {TANGGAL & WAKTU}\n*Akun Dana* : {AKUN DANA}\n*Keterangan :* {KETERANGAN}\n\n*Nominal : {NOMINAL}*\n______________________\n> Dibuat otomatis oleh Sistem E-Sangu Santri`;

  return baseTemplate
    .replace(/{NAMA PONDOK}/g, institution.name || '')
    .replace(/{NIS}/g, santri.nis || '')
    .replace(/{NAMA}/g, santri.name || '')
    .replace(/{KELAS}/g, santri.className || '')
    .replace(/{BUKTI}/g, buktiText)
    .replace(/{ID_TRANSAKSI}/g, formattedId)
    .replace(/{TANGGAL & WAKTU}/g, formattedWaktu)
    .replace(/{AKUN DANA}/g, transaction.accountType)
    .replace(/{KETERANGAN}/g, transaction.note || '-')
    .replace(/{NOMINAL}/g, formattedNominal);
}

export const printReceipt = (transaction: Transaction, santri: Santri, institution: InstitutionSettings, allTransactions: Transaction[] = []) => {
  const printWindow = window.open('about:blank', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Kwitansi Transaksi - ${transaction.id}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page { size: auto; margin: 0; }
          body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            padding: 30px; 
            color: #1e293b; 
            background: #f8fafc;
            display: flex;
            justify-content: center;
          }
          .font-montserrat {
            font-family: 'Montserrat', sans-serif;
          }
          .receipt-container { 
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
            padding: 35px;
            width: 100%;
            max-width: 520px;
            border: 1px solid #e2e8f0;
          }
          .receipt-header-modern {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
            margin-bottom: 24px;
            gap: 16px;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 14px;
            text-align: left;
          }
          .app-logo {
            width: 52px;
            height: 52px;
            object-fit: contain;
            border-radius: 12px;
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            padding: 3px;
          }
          .app-logo-fallback {
            width: 52px;
            height: 52px;
            background: #ecfdf5;
            color: #059669;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            border-radius: 12px;
          }
          .app-info {
            display: flex;
            flex-direction: column;
          }
          .app-brand {
            font-size: 10px;
            font-weight: 800;
            color: #059669; /* Emerald 600 */
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .inst-name {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.2;
          }
          .inst-addr {
            font-size: 9px;
            color: #64748b;
            margin-top: 3px;
            font-weight: 500;
            line-height: 1.3;
          }
          .header-right {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .status-badge-modern {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            display: inline-block;
            margin-bottom: 4px;
          }
          .status-badge-modern.setor {
            background: #ecfdf5;
            color: #065f46;
            border: 1px solid #a7f3d0;
          }
          .status-badge-modern.tarik {
            background: #fff5f5;
            color: #991b1b;
            border: 1px solid #fecaca;
          }
          .receipt-no {
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            font-family: 'Montserrat', sans-serif;
            letter-spacing: 0.5px;
          }
          .section {
            background: #f8fafc;
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 16px;
            border: 1px solid #f1f5f9;
          }
          .row { 
            display: flex; 
            justify-content: space-between; 
            font-size: 12px; 
            margin-bottom: 10px; 
          }
          .row:last-child {
            margin-bottom: 0;
          }
          .label {
            color: #64748b;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .value {
            font-weight: 700;
            color: #0f172a;
            text-align: right;
          }
          .amount-section {
            background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); /* Emerald Gradient */
            color: white;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
            box-shadow: 0 4px 12px rgba(6, 78, 59, 0.15);
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .amount-row-detail {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            opacity: 0.85;
          }
          .amount-row-divider {
            height: 1px;
            background: rgba(255,255,255,0.15);
            margin: 10px 0;
          }
          .amount-label-detail {
            font-size: 10px;
            font-weight: 500;
            color: #a7f3d0;
          }
          .amount-value-detail {
            font-size: 13px;
            font-weight: 700;
            color: white;
          }
          .amount-label {
            font-size: 11px;
            font-weight: 700;
            color: #a7f3d0; /* Emerald 200 */
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .amount-value {
            font-size: 24px;
            font-weight: 900;
            color: white;
          }
          .footer { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 30px;
            gap: 16px;
          }
          .sig-box { 
            text-align: center;
            width: 48%;
          }
          .sig-title {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 45px;
          }
          .sig-name {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 4px;
            display: inline-block;
            min-width: 120px;
          }
          .watermark {
            text-align: center;
            margin-top: 30px;
            font-size: 9px;
            color: #94a3b8;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
        
          @media print {
            body { padding: 0; background: white; }
            .receipt-container { max-width: 100%; box-shadow: none; border: none; padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header-modern">
            <div class="header-left">
              ${institution.logoUrl ? `
                <img src="${institution.logoUrl}" class="app-logo" alt="Logo" />
              ` : `
                <div class="app-logo-fallback">🕌</div>
              `}
              <div class="app-info">
                <div class="app-brand">E-SANGU SANTRI</div>
                <div class="inst-name">${institution.name}</div>
                <div class="inst-addr">${institution.address} ${institution.phone ? '• Telp: ' + institution.phone : ''}</div>
              </div>
            </div>
            <div class="header-right">
              <span class="status-badge-modern ${transaction.type === 'Setor' ? 'setor' : 'tarik'}">
                ${transaction.type === 'Setor' ? 'SETORAN' : 'PENARIKAN'}
              </span>
              <div class="receipt-no">${formatTxId(transaction.id, allTransactions)}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="row">
              <span class="label">NIS</span>
              <span class="value font-montserrat">${santri.nis}</span>
            </div>
            <div class="row">
              <span class="label">Nama Santri</span>
              <span class="value" style="text-transform: uppercase;">${transaction.santriName}</span>
            </div>
            <div class="row">
              <span class="label">Kelas / Asrama</span>
              <span class="value">${santri.className} • ${santri.dorm || '-'}</span>
            </div>
          </div>

          <div class="section">
            <div class="row">
              <span class="label">Tanggal & Waktu</span>
              <span class="value">${new Date(transaction.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <div class="row">
              <span class="label">Akun Dana</span>
              <span class="value">${transaction.accountType}</span>
            </div>
            <div class="row">
              <span class="label">Keterangan</span>
              <span class="value">${transaction.note || '-'}</span>
            </div>
            <div class="row">
              <span class="label">Metode Transaksi</span>
              <span class="value">${transaction.paymentMethod || 'Tunai'}</span>
            </div>
            ${transaction.paymentMethod === 'Transfer' ? `
              <div class="row">
                <span class="label">Bank</span>
                <span class="value" style="text-transform: uppercase;">${transaction.bankName || '-'}</span>
              </div>
              <div class="row">
                <span class="label">Rekening</span>
                <span class="value">${transaction.accountInfo || '-'}</span>
              </div>
            ` : ''}
          </div>

          <div class="amount-section">
            ${transaction.type === 'Tarik' && transaction.adminFee && transaction.adminFee > 0 ? `
              <div class="amount-row-detail">
                <span class="amount-label-detail">Dana Bersih ditarik</span>
                <span class="amount-value-detail font-montserrat">Rp ${transaction.netAmount.toLocaleString('id-ID')}</span>
              </div>
              <div class="amount-row-detail">
                <span class="amount-label-detail">Biaya Admin & Layanan Aplikasi</span>
                <span class="amount-value-detail font-montserrat">Rp ${transaction.adminFee.toLocaleString('id-ID')}</span>
              </div>
              <div class="amount-row-divider"></div>
              <div class="amount-row">
                <span class="amount-label">Total Saldo Terpotong</span>
                <span class="amount-value font-montserrat">Rp ${transaction.amount.toLocaleString('id-ID')}</span>
              </div>
            ` : `
              <div class="amount-row">
                <span class="amount-label">Nominal Transaksi</span>
                <span class="amount-value font-montserrat font-bold">Rp ${transaction.netAmount.toLocaleString('id-ID')}</span>
              </div>
            `}
          </div>

          <div class="footer">
            <div class="sig-box">
              <div class="sig-title">Penyetor / Penerima</div>
              <div class="sig-name">${transaction.type === 'Tarik' && transaction.signatureName ? transaction.signatureName : santri.name}</div>
            </div>
            <div class="sig-box">
              <div class="sig-title">Petugas Kasir</div>
              <div class="sig-name">${transaction.cashierName}</div>
            </div>
          </div>
          
          <div class="watermark">
            Dokumen sah diterbitkan oleh sistem e-sangu santri
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

export const printPassbook = (santri: Santri, transactions: Transaction[], institution: InstitutionSettings, accountType: 'Tabungan' | 'Penitipan') => {
  const printWindow = window.open('about:blank', '_blank');
  if (!printWindow) return;

  const filteredTransactions = transactions
    .filter(tx => tx.santriId === santri.id && tx.accountType === accountType)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let balance = 0;
  const rows = filteredTransactions.map((tx, index) => {
    if (tx.type === 'Setor') {
      balance += tx.amount;
    } else {
      balance -= tx.amount;
    }
    return `
      <tr>
        <td class="font-mono text-gray-500" style="font-size: 11px;">${formatTxId(tx.id, transactions)}</td>
        <td class="font-mono text-gray-600">${new Date(tx.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
        <td class="text-right text-emerald-600 font-bold font-mono">${tx.type === 'Setor' ? tx.amount.toLocaleString('id-ID') : '-'}</td>
        <td class="text-right text-rose-600 font-bold font-mono">${tx.type === 'Tarik' ? tx.amount.toLocaleString('id-ID') : '-'}</td>
        <td class="text-right text-slate-800 font-black font-mono">${balance.toLocaleString('id-ID')}</td>
        <td class="text-center font-bold text-gray-500 text-xs admin-col">${tx.cashierName}</td>
        <td class="text-gray-500 text-xs">${tx.note || '-'}${tx.paymentMethod ? ` (${tx.paymentMethod}${tx.bankName ? ' - ' + tx.bankName : ''})` : ''}</td>
      </tr>
    `;
  });

  const html = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Buku Mutasi ${accountType} - ${santri.name}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page { size: portrait; margin: 0; }
          * { box-sizing: border-box; }
          body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            padding: 40px; 
            background: #f1f5f9;
            color: #0f172a;
            display: flex;
            justify-content: center;
          }
          .passbook-container {
            background: #ffffff;
            width: 100%;
            max-width: 1200px;
            border-radius: 20px;
            box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05), 0 10px 20px -15px rgba(0,0,0,0.05);
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          .pb-header-modern {
            background: #064e3b; /* Emerald 900 */
            padding: 30px 40px;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
          }
          .pb-header-modern::after {
            content: '';
            position: absolute;
            top: -50px;
            right: -50px;
            width: 250px;
            height: 250px;
            background: rgba(52, 211, 153, 0.08);
            border-radius: 50%;
            pointer-events: none;
          }
          .pb-header-left {
            display: flex;
            align-items: center;
            gap: 16px;
            text-align: left;
            position: relative;
            z-index: 10;
          }
          .pb-logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
            border-radius: 14px;
            background: #ffffff;
            padding: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          .pb-logo-fallback {
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.1);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            border-radius: 14px;
          }
          .pb-branding {
            display: flex;
            flex-direction: column;
          }
          .pb-app-title {
            font-size: 11px;
            font-weight: 800;
            color: #34d399; /* Emerald 400 */
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .pb-inst-title {
            font-family: 'Outfit', sans-serif;
            font-size: 20px;
            font-weight: 800;
            line-height: 1.2;
            color: #ffffff;
          }
          .pb-inst-subtitle {
            font-size: 11px;
            color: #a7f3d0;
            opacity: 0.9;
            margin-top: 4px;
          }
          .pb-header-right {
            text-align: right;
            position: relative;
            z-index: 10;
          }
          .pb-header-badge {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #34d399;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            padding: 8px 18px;
            border-radius: 12px;
            display: inline-block;
          }
          .pb-details-card {
            background: #ffffff;
            margin: -20px 40px 30px;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
            position: relative;
            z-index: 10;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            border: 1px solid #e2e8f0;
          }
          .pb-info-box {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .pb-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
          }
          .pb-val {
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }
          .pb-val.mono {
            font-family: 'Montserrat', sans-serif;
            letter-spacing: 0.5px;
          }
          .pb-content {
            padding: 0 40px 40px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .font-mono { font-family: 'Montserrat', sans-serif; }
          th, td {
            padding: 12px 14px;
            border-bottom: 1px solid #f1f5f9;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          th {
            text-align: left;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            background: #f8fafc;
          }
          th.text-right { text-align: right; }
          th.text-center { text-align: center; }
          td {
            font-size: 11px;
            color: #1e293b;
          }
          tr:hover td {
            background: #f8fafc;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .admin-col {
            width: 130px;
            min-width: 130px;
          }
          .footer-note {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        
          @media print {
            body { padding: 0; background: white; margin: 0; display: block; }
            .passbook-container { width: 100%; max-width: none; box-shadow: none; border: none; border-radius: 0; margin: 0; }
            .pb-header-modern { padding: 20px; background-color: #064e3b !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .pb-content { padding: 0 20px 20px; }
            .pb-details-card { box-shadow: inset 0 0 0 1px #e2e8f0; margin: -10px 20px 20px; padding: 15px; grid-template-columns: repeat(3, 1fr); }
            th, td { padding: 8px 6px; font-size: 10px; }
            th { font-size: 9px; }
            .admin-col { width: 130px !important; min-width: 130px !important; }
            
            /* Hide URL printing */
            @page { margin: 0.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="passbook-container">
          <div class="pb-header-modern">
            <div class="pb-header-left">
              ${institution.logoUrl ? `
                <img src="${institution.logoUrl}" class="pb-logo" alt="Logo" />
              ` : `
                <div class="pb-logo-fallback">🕌</div>
              `}
              <div class="pb-branding">
                <div class="pb-app-title">E-SANGU SANTRI</div>
                <div class="pb-inst-title">${institution.name}</div>
                <div class="pb-inst-subtitle">${institution.address} ${institution.phone ? '• Telp: ' + institution.phone : ''}</div>
              </div>
            </div>
            <div class="pb-header-right">
              <span class="pb-header-badge">BUKU MUTASI ${accountType}</span>
            </div>
          </div>
          
          <div class="pb-details-card">
            <div class="pb-info-box">
              <span class="pb-label">Nomor Induk Santri (NIS)</span>
              <span class="pb-val mono">${santri.nis}</span>
            </div>
            <div class="pb-info-box">
              <span class="pb-label">Nama Lengkap Santri</span>
              <span class="pb-val" style="text-transform: uppercase;">${santri.name}</span>
            </div>
            <div class="pb-info-box">
              <span class="pb-label">Kelas & Asrama</span>
              <span class="pb-val">${santri.className} • ${santri.dorm || '-'}</span>
            </div>
          </div>

          <div class="pb-content">
            <table>
              <thead>
                <tr>
                  <th style="width: 105px;">ID Transaksi</th>
                  <th style="width: 130px;">Tanggal & Waktu</th>
                  <th class="text-right" style="width: 105px;">Kredit (Setor)</th>
                  <th class="text-right" style="width: 105px;">Debit (Tarik)</th>
                  <th class="text-right" style="width: 110px;">Saldo Akhir</th>
                  <th class="text-center admin-col" style="width: 130px;">Kasir / Petugas</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                ${rows.length > 0 ? rows.join('') : '<tr><td colspan="7" class="text-center" style="padding: 40px; color: #94a3b8; font-style: italic;">Belum ada riwayat mutasi.</td></tr>'}
              </tbody>
            </table>
            <div class="footer-note">
              Dokumen dicetak secara otomatis oleh sistem e-sangu santri • ${new Date().toLocaleDateString('id-ID')}
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
