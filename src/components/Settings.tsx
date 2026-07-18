import React, { useState } from 'react';
import { InstitutionSettings, FinancialSettings, User } from '../types';
import { Save, CheckCircle, Shield, Settings2, HelpCircle, UserPlus, Trash2, BookOpen, Plus, Home, MessageSquare, RefreshCw, AlertTriangle } from 'lucide-react';

interface SettingsProps {
  institution: InstitutionSettings;
  financial: FinancialSettings;
  onSaveInstitution: (settings: InstitutionSettings) => void;
  onSaveFinancial: (settings: FinancialSettings) => void;
  users?: User[];
  onRestoreFactoryDefault?: () => Promise<boolean>;
}

export default function Settings({
  institution,
  financial,
  onSaveInstitution,
  onSaveFinancial,
  users = [],
  onRestoreFactoryDefault
}: SettingsProps) {
  const [instName, setInstName] = useState(institution.name);
  const [instAddress, setInstAddress] = useState(institution.address);
  const [instPhone, setInstPhone] = useState(institution.phone);
  const [instEmail, setInstEmail] = useState(institution.email);
  const [instWebsite, setInstWebsite] = useState(institution.website);
  const [instTreasurer, setInstTreasurer] = useState(institution.treasurerName);
  const [instLogo, setInstLogo] = useState(institution.logoUrl || '');
  const [instDepositBank, setInstDepositBank] = useState(institution.depositBankName || 'BANK BRI');
  const [instDepositAccount, setInstDepositAccount] = useState(institution.depositBankAccountNumber || '632201038845535');
  const [instDepositHolder, setInstDepositHolder] = useState(institution.depositBankAccountHolder || 'Ust. Muhammad Afif Syaiful Muzakky');
  const [instDepositCustomText, setInstDepositCustomText] = useState(
    institution.depositBankCustomText || 
    `${institution.depositBankName || 'BANK BRI'}\nNo. Rekening: ${institution.depositBankAccountNumber || '632201038845535'}\nAtas Nama: ${institution.depositBankAccountHolder || 'Ust. Muhammad Afif Syaiful Muzakky'}`
  );
  const [dormsList, setDormsList] = useState(institution.dorms || []);
  const [newDorm, setNewDorm] = useState('');

  const [finMaxWith, setFinMaxWith] = useState(financial.maxWithdrawalsPerYear);
  const [finWindowOpen, setFinWindowOpen] = useState(financial.windowOpen);
  const [finWindowStart, setFinWindowStart] = useState(financial.windowStartDate);
  const [finWindowEnd, setFinWindowEnd] = useState(financial.windowEndDate);
  const [finFeeTabEnabled, setFinFeeTabEnabled] = useState(financial.adminFeeTabunganEnabled);
  const [finFeeTabAmt, setFinFeeTabAmt] = useState(financial.adminFeeTabunganAmount);
  const [finFeePenEnabled, setFinFeePenEnabled] = useState(financial.adminFeePenitipanEnabled);
  const [finFeePenAmt, setFinFeePenAmt] = useState(financial.adminFeePenitipanAmount);
  const [finSavingsBookFee, setFinSavingsBookFee] = useState(financial.savingsBookFeeAmount || 5000);
  const [finMaxDepositAmt, setFinMaxDepositAmt] = useState(financial.maxDepositAmount || 500000);
  const [finQrBalanceCheckEnabled, setFinQrBalanceCheckEnabled] = useState(financial.qrBalanceCheckEnabled ?? true);
  const [finAllowDeleteWithBalance, setFinAllowDeleteWithBalance] = useState(financial.allowDeleteWithBalance ?? false);

  // Class settings state
  const [classesList, setClassesList] = useState<string[]>(institution.classes || []);
  const [newClassName, setNewClassName] = useState('');

  const [saveSuccess, setSaveSuccess] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFactorySaveConfirm, setShowFactorySaveConfirm] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');

  const handleSaveAsFactoryDefault = () => {
    // Snapshot current localStorage data
    const snapshot = {
      esangu_santri: localStorage.getItem('esangu_santri'),
      esangu_transactions: localStorage.getItem('esangu_transactions'),
      esangu_institution: localStorage.getItem('esangu_institution'),
      esangu_financial: localStorage.getItem('esangu_financial'),
      esangu_users: localStorage.getItem('esangu_users'),
      esangu_registrations: localStorage.getItem('esangu_registrations'),
      esangu_activityLogs: localStorage.getItem('esangu_activityLogs')
    };
    localStorage.setItem('esangu_factory_backup', JSON.stringify(snapshot));
    localStorage.setItem('esangu_custom_factory_saved', 'true');
    triggerSuccess('Berhasil! Seluruh data saat ini telah disimpan sebagai setelan pabrik kustom.');
    setShowFactorySaveConfirm(false);
  };

  const handleResetToFactoryDefault = () => {
    const backupStr = localStorage.getItem('esangu_factory_backup');
    if (backupStr) {
      // Restore from backup
      try {
        const backup = JSON.parse(backupStr);
        Object.keys(backup).forEach(key => {
          if (backup[key] !== null) {
            localStorage.setItem(key, backup[key]);
          } else {
            localStorage.removeItem(key);
          }
        });
        // Keep the factory backup itself
        localStorage.setItem('esangu_custom_factory_saved', 'true');
      } catch (err) {
        // Fallback clear if backup is corrupted
        localStorage.clear();
      }
    } else {
      // Complete clear - original mock data will load on reload
      localStorage.clear();
    }
    
    alert('Sistem berhasil dikembalikan ke setelan pabrik. Aplikasi akan dimuat ulang.');
    window.location.reload();
  };

  const handleResetConfirmClick = async () => {
    const masterPasswords = users
      .filter(u => u.role === 'Master' && u.isActive !== false)
      .map(u => u.password)
      .filter(Boolean) as string[];

    const isValid = masterPasswords.includes(resetPasswordInput) || resetPasswordInput === 'master123';
    if (!isValid) {
      setResetPasswordError('Kata sandi Master salah! Pembersihan ditolak.');
      return;
    }
    setResetPasswordError('');
    setShowResetConfirm(false);
    
    if (onRestoreFactoryDefault) {
      alert('Sedang memproses pemulihan ke setelan pabrik... Mohon tunggu sebentar.');
      const success = await onRestoreFactoryDefault();
      if (success) {
        alert('Sistem berhasil dikembalikan ke setelan pabrik. Aplikasi akan dimuat ulang.');
        window.location.reload();
      } else {
        alert('Gagal melakukan pemulihan setelan pabrik.');
      }
    } else {
      handleResetToFactoryDefault();
    }
  };

  const [instWaTemplate, setInstWaTemplate] = useState(institution.waTemplateRegistration || '');
  const [instWaTemplateTx, setInstWaTemplateTx] = useState(institution.waTemplateTransaction || '');
  const [instWaTemplateAccountData, setInstWaTemplateAccountData] = useState(institution.waTemplateAccountData || '');
  const [instWaTemplateBalanceSummary, setInstWaTemplateBalanceSummary] = useState(institution.waTemplateBalanceSummary || '');

  const [deleteClassConfirm, setDeleteClassConfirm] = useState<string | null>(null);
  const [deleteDormConfirm, setDeleteDormConfirm] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Fill background with white for transparent images like PNG
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress as JPEG to save space
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setInstLogo(dataUrl);
            // Auto-save the logo to institution
            onSaveInstitution({
              ...institution,
              logoUrl: dataUrl
            });
            triggerSuccess('Logo berhasil diunggah dan disimpan!');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const saveInstitutionConfig = (overrides: Partial<InstitutionSettings> = {}) => {
    onSaveInstitution({
      name: instName,
      address: instAddress,
      phone: instPhone,
      email: instEmail,
      website: instWebsite,
      leaderName: '',
      leaderNip: '',
      treasurerName: instTreasurer,
      classes: classesList,
      dorms: dormsList,
      logoUrl: instLogo,
      waTemplateRegistration: instWaTemplate,
      waTemplateTransaction: instWaTemplateTx,
      waTemplateAccountData: instWaTemplate,
      waTemplateBalanceSummary: instWaTemplateBalanceSummary,
      depositBankName: instDepositBank,
      depositBankAccountNumber: instDepositAccount,
      depositBankAccountHolder: instDepositHolder,
      depositBankCustomText: instDepositCustomText,
      ...overrides
    });
  };

  const handleSaveInst = (e: React.FormEvent) => {
    e.preventDefault();
    saveInstitutionConfig();
    triggerSuccess('Profil lembaga berhasil diperbarui!');
  };

  const handleSaveFin = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFinancial({
      maxWithdrawalsPerYear: finMaxWith,
      windowOpen: finWindowOpen,
      windowStartDate: finWindowStart,
      windowEndDate: finWindowEnd,
      adminFeeTabunganEnabled: finFeeTabEnabled,
      adminFeeTabunganAmount: finFeeTabAmt,
      adminFeePenitipanEnabled: finFeePenEnabled,
      adminFeePenitipanAmount: finFeePenAmt,
      savingsBookFeeAmount: finSavingsBookFee,
      maxDepositAmount: finMaxDepositAmt,
      qrBalanceCheckEnabled: finQrBalanceCheckEnabled,
      allowDeleteWithBalance: finAllowDeleteWithBalance
    });
    triggerSuccess('Aturan kebijakan keuangan pesantren berhasil disimpan!');
  };

  const handleAddClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newClassName.trim();
    if (!trimmed) {
      alert('Nama kelas tidak boleh kosong!');
      return;
    }
    if (classesList.includes(trimmed)) {
      alert('Kelas ini sudah terdaftar!');
      return;
    }
    const updated = [...classesList, trimmed];
    setClassesList(updated);
    setNewClassName('');
    saveInstitutionConfig({ classes: updated });
    triggerSuccess(`Kelas "${trimmed}" berhasil ditambahkan!`);
  };

  const handleDeleteClass = (cls: string) => {
    setDeleteClassConfirm(cls);
  };

  const handleAddDormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDorm.trim();
    if (!trimmed) {
      alert('Nama asrama tidak boleh kosong!');
      return;
    }
    if (dormsList.includes(trimmed)) {
      alert('Asrama ini sudah terdaftar!');
      return;
    }
    const updated = [...dormsList, trimmed];
    setDormsList(updated);
    setNewDorm('');
    saveInstitutionConfig({ dorms: updated });
    triggerSuccess(`Asrama "${trimmed}" berhasil ditambahkan!`);
  };

  const handleDeleteDorm = (dorm: string) => {
    setDeleteDormConfirm(dorm);
  };

  const triggerSuccess = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => {
      setSaveSuccess('');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-xl font-black text-emerald-950 tracking-tight uppercase flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-emerald-600" />
            PENGATURAN SISTEM
          </h2>
          <p className="text-xs text-gray-500 mt-1">Konfigurasi preferensi, profil lembaga, dan pengaturan tingkat lanjut sistem.</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-3 rounded-lg flex items-center gap-2 text-xs font-semibold shadow-sm animate-bounce">
          <CheckCircle className="w-4 h-4" />
          {saveSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tab 1: Institution Profile Settings */}
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Settings2 className="w-4.5 h-4.5 text-emerald-700" />
            <h3 className="font-bold text-gray-800 text-sm">Profil & Identitas Lembaga</h3>
          </div>

          <form onSubmit={handleSaveInst} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Nama Pondok Pesantren / Yayasan</label>
              <input
                type="text"
                required
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Alamat Lengkap</label>
              <textarea
                required
                rows={2}
                value={instAddress}
                onChange={(e) => setInstAddress(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Nomor Telepon</label>
                <input
                  type="text"
                  required
                  value={instPhone}
                  onChange={(e) => setInstPhone(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Website</label>
                <input
                  type="text"
                  required
                  value={instWebsite}
                  onChange={(e) => setInstWebsite(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">LOGO PONDOK / APLIKASI (Upload)</label>
              <div className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                <div className="w-12 h-12 rounded-lg bg-white border border-emerald-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {instLogo ? (
                    <img src={instLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-emerald-300 font-bold">LOGO</span>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-[10px] text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-black file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer transition-all"
                  />
                  <p className="text-[9px] text-gray-400 italic font-medium">* Format: JPG, PNG, atau SVG. Maksimal 1MB recommended.</p>
                </div>
              </div>
            </div>

             <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl space-y-3 mt-4 animate-in fade-in duration-200">
              <span className="font-extrabold text-blue-950 block text-[10px] uppercase tracking-wider">Rekening Tujuan Penyetoran Santri</span>
              <div>
                <label className="block text-gray-400 font-bold mb-1 text-[9px] uppercase tracking-wider">Detail Informasi Rekening (Kustom format teks)</label>
                <textarea
                  rows={4}
                  required
                  value={instDepositCustomText}
                  onChange={(e) => setInstDepositCustomText(e.target.value)}
                  placeholder="BANK BRI&#10;No. Rekening: 632201038845535&#10;Atas Nama: Ust. Muhammad Afif Syaiful Muzakky"
                  className="w-full p-2.5 border border-blue-100 rounded-xl bg-white text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500 font-sans"
                />
                <p className="text-[9px] text-gray-400 italic font-medium mt-1">
                  * Anda dapat menulis baris baru secara bebas untuk mengatur letak nama bank, nomor rekening, nama pemilik, atau instruksi transfer secara leluasa.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold rounded-xl shadow-md shadow-emerald-900/10 transition flex items-center gap-1 cursor-pointer border-none"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Identitas
              </button>
            </div>
          </form>
        </div>

        {/* Tab 2: Financial Policy Settings */}
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Shield className="w-4.5 h-4.5 text-emerald-700" />
            <h3 className="font-bold text-gray-800 text-sm">Kebijakan Keuangan & Aturan Penarikan</h3>
          </div>

          <form onSubmit={handleSaveFin} className="space-y-4 text-xs">
            {/* General Fees */}
            <div className="bg-blue-50/50 border border-blue-100/70 p-3.5 rounded-lg space-y-3 mb-4">
              <span className="font-bold text-blue-950 block text-[11px] uppercase tracking-wider">Aturan Umum</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Biaya Buku Tabungan (Awal)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-gray-400 font-bold">Rp</span>
                    <input
                      type="number"
                      value={finSavingsBookFee}
                      onChange={(e) => setFinSavingsBookFee(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Nominal Maksimal Penitipan</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-gray-400 font-bold">Rp</span>
                    <input
                      type="number"
                      value={finMaxDepositAmt}
                      onChange={(e) => setFinMaxDepositAmt(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rules for Tabungan */}
            <div className="bg-emerald-50/50 border border-emerald-100/70 p-3.5 rounded-lg space-y-3">
              <span className="font-bold text-emerald-950 block text-[11px] uppercase tracking-wider">Aturan Tabungan</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Batas Tarik / Tahun (Default 3)</label>
                  <input
                    type="number"
                    required
                    value={finMaxWith}
                    onChange={(e) => setFinMaxWith(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Jendela Penarikan (Status)</label>
                  <select
                    value={String(finWindowOpen)}
                    onChange={(e) => setFinWindowOpen(e.target.value === 'true')}
                    className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-emerald-600 font-semibold"
                  >
                    <option value="false">🔒 Terkunci (Perlu Bypass)</option>
                    <option value="true">🔓 Terbuka (Kapan Saja)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Awal Tanggal Jendela</label>
                  <input
                    type="date"
                    value={finWindowStart}
                    onChange={(e) => setFinWindowStart(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Akhir Tanggal Jendela</label>
                  <input
                    type="date"
                    value={finWindowEnd}
                    onChange={(e) => setFinWindowEnd(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Rules for Admin Fees */}
            <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-lg space-y-3">
              <span className="font-bold text-gray-800 block text-[11px] uppercase tracking-wider">Skema Biaya Admin Opsional</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fee_tab_en"
                      checked={finFeeTabEnabled}
                      onChange={(e) => setFinFeeTabEnabled(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <label htmlFor="fee_tab_en" className="font-black text-gray-700 cursor-pointer uppercase tracking-widest text-[10px]">Admin Tarik Tabungan</label>
                  </div>
                  {finFeeTabEnabled && (
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-gray-400 font-bold">Rp</span>
                      <input
                        type="number"
                        placeholder="2000"
                        value={finFeeTabAmt || ''}
                        onChange={(e) => setFinFeeTabAmt(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-8 pr-2 py-1 border border-gray-200 rounded font-semibold focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fee_pen_en"
                      checked={finFeePenEnabled}
                      onChange={(e) => setFinFeePenEnabled(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <label htmlFor="fee_pen_en" className="font-black text-gray-700 cursor-pointer uppercase tracking-widest text-[10px]">Admin Tarik Penitipan</label>
                  </div>
                  {finFeePenEnabled && (
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-gray-400 font-bold">Rp</span>
                      <input
                        type="number"
                        placeholder="1000"
                        value={finFeePenAmt || ''}
                        onChange={(e) => setFinFeePenAmt(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-8 pr-2 py-1 border border-gray-200 rounded font-semibold focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* QR Passbook Feature Toggle */}
            <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="qr_balance_chk_en"
                  checked={finQrBalanceCheckEnabled}
                  onChange={(e) => setFinQrBalanceCheckEnabled(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="qr_balance_chk_en" className="font-black text-emerald-700 cursor-pointer uppercase tracking-widest text-[10px]">Aktifkan Scan QR Cek Saldo & QR Generatif</label>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Jika diaktifkan, menu "QR Generatif" akan muncul di panel tabungan santri, yang mendukung fitur scan/test QR, pembuatan QR baru berdasarkan NIS santri terdaftar, dan download QR (PNG/PDF).
              </p>
            </div>

            {/* Allow Delete Santri With Balance Toggle */}
            <div className="bg-rose-50/50 border border-rose-100 p-3.5 rounded-lg space-y-3">
              <span className="font-bold text-rose-950 block text-[11px] uppercase tracking-wider">Izin Hapus Santri Ber-Saldo</span>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allow_delete_with_balance"
                  checked={finAllowDeleteWithBalance}
                  onChange={(e) => setFinAllowDeleteWithBalance(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="allow_delete_with_balance" className="font-black text-rose-800 cursor-pointer uppercase tracking-widest text-[10px]">Izinkan Hapus Santri Meskipun Masih Memiliki Saldo</label>
              </div>
              <p className="text-[10px] text-rose-700/80 leading-relaxed">
                Jika saklar ini diaktifkan, data santri yang masih memiliki saldo tabungan aktif dapat dihapus langsung dari database. Saldo yang bersangkutan akan dianggap hangus. Jika dinonaktifkan (default), sistem akan memblokir penghapusan santri yang saldonya tidak nol demi keamanan data keuangan.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold rounded-xl shadow-md shadow-emerald-900/10 transition flex items-center gap-1 cursor-pointer border-none"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Aturan Keuangan
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SECTION 4: DAFTAR KELAS & ASRAMA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Class Settings */}
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <BookOpen className="w-4.5 h-4.5 text-emerald-700" />
            <h3 className="font-bold text-gray-800 text-sm">Settingan Kelas Pondok</h3>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleAddClassSubmit} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Tambah kelas..."
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="flex-1 p-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-emerald-600"
              />
              <button type="submit" className="p-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl cursor-pointer border-none">
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {classesList.map((cls) => (
                <div key={cls} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-100 text-[10px] font-bold">
                  {cls}
                  <button onClick={() => handleDeleteClass(cls)} className="text-emerald-400 hover:text-red-600 cursor-pointer">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dorm Settings */}
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Home className="w-4.5 h-4.5 text-amber-600" />
            <h3 className="font-bold text-gray-800 text-sm">Settingan Daftar Asrama</h3>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleAddDormSubmit} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Tambah asrama..."
                value={newDorm}
                onChange={(e) => setNewDorm(e.target.value)}
                className="flex-1 p-2 border border-gray-200 rounded text-xs focus:outline-none focus:border-emerald-600"
              />
              <button type="submit" className="p-2 bg-amber-600 text-white rounded hover:bg-amber-700 cursor-pointer">
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {dormsList.map((dorm) => (
                <div key={dorm} className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-2 py-1 rounded-lg border border-amber-100 text-[10px] font-bold">
                  {dorm}
                  <button onClick={() => handleDeleteDorm(dorm)} className="text-amber-400 hover:text-red-600 cursor-pointer">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WA Template Setting Pendaftaran & Akun Santri */}
      <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4.5 h-4.5 text-green-500" />
            <h3 className="font-bold text-gray-800 text-sm">Pengaturan Template WhatsApp Pendaftaran & Akun Santri</h3>
          </div>
          <button
            onClick={() => {
              saveInstitutionConfig();
              triggerSuccess('Template WhatsApp Pendaftaran & Akun Santri berhasil disimpan!');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-black transition shadow-md shadow-emerald-900/10 cursor-pointer border-none"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Template
          </button>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] text-gray-500 font-medium">
            Template ini digunakan saat melakukan konfirmasi pendaftaran baru dan saat mengirim data akun santri ke orang tua agar orang tua bisa mengecek saldo Ananda secara mandiri.<br/>
            Gunakan variabel berikut (harus persis) agar diisi otomatis oleh sistem: <br/>
            <code className="text-emerald-700 font-bold font-mono">{"{NAMA PONDOK}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{NIS}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{NAMA}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{KELAS}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{ASRAMA}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{NAMA WEBSITE}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{NO_WALI}"}</code>
          </p>
          <textarea
            value={instWaTemplate}
            onChange={(e) => setInstWaTemplate(e.target.value)}
            rows={10}
            className="w-full p-3 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 focus:outline-none focus:border-emerald-600 bg-gray-50"
            placeholder="Tulis format template WhatsApp pendaftaran dan akun santri di sini..."
          />
        </div>
      </div>

      {/* WA Template Setting Transaksi */}
      <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4.5 h-4.5 text-blue-500" />
            <h3 className="font-bold text-gray-800 text-sm">Pengaturan Template WhatsApp Transaksi (Setor/Tarik)</h3>
          </div>
          <button
            onClick={() => {
              saveInstitutionConfig();
              triggerSuccess('Template WhatsApp Transaksi berhasil disimpan!');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-black transition shadow-md shadow-emerald-900/10 cursor-pointer border-none"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Template
          </button>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] text-gray-500 font-medium">
            Gunakan variabel berikut (harus persis) agar diisi otomatis oleh sistem: <br/>
            <code className="text-emerald-700 font-bold font-mono">{"{NAMA PONDOK}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{NIS}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{NAMA}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{KELAS}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{BUKTI}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{ID_TRANSAKSI}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{TANGGAL & WAKTU}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{AKUN DANA}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{KETERANGAN}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{NOMINAL}"}</code>
          </p>
          <textarea
            value={instWaTemplateTx}
            onChange={(e) => setInstWaTemplateTx(e.target.value)}
            rows={10}
            className="w-full p-3 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 focus:outline-none focus:border-emerald-600 bg-gray-50"
            placeholder="Tulis format template WhatsApp bukti transaksi di sini..."
          />
        </div>
      </div>

      {/* WA Template Setting Ringkasan Saldo */}
      <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4.5 h-4.5 text-orange-500" />
            <h3 className="font-bold text-gray-800 text-sm">Pengaturan Template WhatsApp Ringkasan Saldo</h3>
          </div>
          <button
            onClick={() => {
              saveInstitutionConfig();
              triggerSuccess('Template WhatsApp Ringkasan Saldo berhasil disimpan!');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-black transition shadow-md shadow-emerald-900/10 cursor-pointer border-none"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Template
          </button>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] text-gray-500 font-medium">
            Gunakan variabel berikut (harus persis) agar diisi otomatis oleh sistem: <br/>
            <code className="text-emerald-700 font-bold font-mono">{"{NAMA PONDOK}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{NIS}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{NAMA}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{KELAS}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{ASRAMA}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{Saldo Tabungan}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{Saldo Penitipan}"}</code>, 
            <code className="text-emerald-700 font-bold font-mono">{"{TOTAL SALDO}"}</code>
          </p>
          <textarea
            value={instWaTemplateBalanceSummary}
            onChange={(e) => setInstWaTemplateBalanceSummary(e.target.value)}
            rows={10}
            className="w-full p-3 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 focus:outline-none focus:border-emerald-600 bg-gray-50"
            placeholder="Tulis format template WhatsApp ringkasan saldo di sini..."
          />
        </div>
      </div>

      {/* SECTION: SETELAN PABRIK */}
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl space-y-4 shadow-sm animate-in fade-in duration-300">
        <div className="flex items-center gap-2 pb-2 border-b border-rose-200/50">
          <RefreshCw className="w-5 h-5 text-rose-600 animate-spin" style={{ animationDuration: '6s' }} />
          <h3 className="font-extrabold text-rose-950 text-sm uppercase tracking-tight flex items-center gap-2">
            SETELAN PABRIK & PEMBERSIHAN DATA SISTEM
          </h3>
        </div>
        
        <div className="space-y-2 text-xs text-rose-900/80">
          <p className="font-bold">
            Gunakan fitur ini untuk mengatur titik awal kustom (Baseline Default) atau membersihkan seluruh data sistem untuk memulai tahun ajaran baru secara steril.
          </p>
          <ul className="list-disc pl-4 space-y-1 font-medium text-[11px] leading-relaxed">
            <li><strong>Buat Sebagai Setelan Pabrik:</strong> Menyimpan kondisi santri, saldo, riwayat transaksi, dan settingan saat ini sebagai template default baru.</li>
            <li><strong>Kembali Ke Setelan Pabrik:</strong> Menghapus seluruh data berjalan, mutasi, log, asrama, kelas, dan settingan. Mengembalikannya ke template default kustom (atau default bawaan sistem jika belum ada kustomisasi).</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowFactorySaveConfirm(true)}
            className="px-4 py-2.5 bg-rose-200 hover:bg-rose-300 active:bg-rose-400 text-rose-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer border-none flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-rose-800" />
            Buat Ini Sebagai Setelan Pabrik
          </button>
          <button
            type="button"
            onClick={() => {
              setResetPasswordInput('');
              setResetPasswordError('');
              setShowResetConfirm(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition shadow-md shadow-red-900/10 cursor-pointer border-none flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4 text-white" />
            Kembali ke Setelan Pabrik
          </button>
        </div>
      </div>

      {/* CONFIRM SAVE FACTORY MODAL */}
      {showFactorySaveConfirm && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-emerald-950 uppercase tracking-tight">Buat Setelan Pabrik Kustom</h3>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                Apakah Anda yakin ingin menetapkan seluruh data santri, rules keuangan, asrama, kelas, dan akun saat ini sebagai setelan pabrik default kustom pesantren Anda?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowFactorySaveConfirm(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAsFactoryDefault}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-emerald-900/10 cursor-pointer border-none"
              >
                Ya, Tetapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET SYSTEM MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-red-950/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-red-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-red-950 uppercase tracking-tight">Konfirmasi Pembersihan WIPE</h3>
              <p className="text-xs text-red-600 font-bold leading-relaxed">
                PERINGATAN KERAS! Tindakan ini bersifat IRREVERSIBLE (tidak bisa dibatalkan). Semua data, riwayat mutasi tabungan, log keuangan, asrama, kelas, dan settingan akan terhapus total!
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">
                Konfirmasi Password Master
              </label>
              <input
                type="password"
                value={resetPasswordInput}
                onChange={(e) => {
                  setResetPasswordInput(e.target.value);
                  setResetPasswordError('');
                }}
                placeholder="Masukkan kata sandi Master..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-red-500 outline-none transition"
              />
              {resetPasswordError && (
                <p className="text-[10px] text-red-600 font-bold mt-1 animate-pulse">
                  {resetPasswordError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetConfirmClick}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-red-900/10 cursor-pointer border-none"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CLASS CONFIRM MODAL */}
      {deleteClassConfirm && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Hapus Kelas</h3>
              <p className="text-xs text-gray-500 font-bold">
                Apakah Anda yakin ingin menghapus kelas "{deleteClassConfirm}"? 
                <span className="block mt-1 text-[10px] text-red-500 italic">Santri yang berada di kelas ini tidak akan terhapus, tetapi kelas ini tidak akan muncul lagi di daftar pilihan.</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteClassConfirm(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const cls = deleteClassConfirm;
                  const updated = classesList.filter(c => c !== cls);
                  setClassesList(updated);
                  onSaveInstitution({
                    name: instName,
                    address: instAddress,
                    phone: instPhone,
                    email: instEmail,
                    website: instWebsite,
                    leaderName: '',
                    leaderNip: '',
                    treasurerName: instTreasurer,
                    classes: updated,
                    dorms: dormsList,
                    logoUrl: instLogo,
                    waTemplateRegistration: instWaTemplate,
                    waTemplateTransaction: instWaTemplateTx
                  });
                  triggerSuccess(`Kelas "${cls}" berhasil dihapus!`);
                  setDeleteClassConfirm(null);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE DORM CONFIRM MODAL */}
      {deleteDormConfirm && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Hapus Asrama</h3>
              <p className="text-xs text-gray-500 font-bold">
                Apakah Anda yakin ingin menghapus asrama "{deleteDormConfirm}"?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteDormConfirm(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const dorm = deleteDormConfirm;
                  const updated = dormsList.filter(d => d !== dorm);
                  setDormsList(updated);
                  onSaveInstitution({
                    name: instName,
                    address: instAddress,
                    phone: instPhone,
                    email: instEmail,
                    website: instWebsite,
                    leaderName: '',
                    leaderNip: '',
                    treasurerName: instTreasurer,
                    classes: classesList,
                    dorms: updated,
                    logoUrl: instLogo,
                    waTemplateRegistration: instWaTemplate,
                    waTemplateTransaction: instWaTemplateTx
                  });
                  triggerSuccess(`Asrama "${dorm}" berhasil dihapus!`);
                  setDeleteDormConfirm(null);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
