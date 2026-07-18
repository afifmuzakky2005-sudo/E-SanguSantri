import React, { useState, useEffect } from 'react';
import { getFirebaseData, saveFirebaseData, deleteFirebaseDocument, cleanUndefined } from './lib/firebaseStore';
import { getLocalStorageData, DEFAULT_INSTITUTION_SETTINGS, DEFAULT_FINANCIAL_SETTINGS, DEFAULT_USERS } from './data/mockData';
import { Santri, Transaction, InstitutionSettings, FinancialSettings, User, PendingRegistration } from './types';
import GuardianPortal from './components/GuardianPortal';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import { ShieldAlert, X, Eye, EyeOff } from 'lucide-react';

export default function App() {
  // Core application states
  const [students, setStudents] = useState<Santri[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [institution, setInstitution] = useState<InstitutionSettings | null>(null);
  const [financial, setFinancial] = useState<FinancialSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation states
  // 'portal' = Wali Santri Portal homepage (Cek Keuangan Santri)
  // 'admin' = Full Admin/Cashier Back-office
  const [currentView, setCurrentView] = useState<'portal' | 'admin'>('portal');
  const [globalAlert, setGlobalAlert] = useState<string | null>(null);

  // Override native browser alert globally
  useEffect(() => {
    window.alert = (message: any) => {
      setGlobalAlert(String(message));
    };
  }, []);
  
  // Admin authentication modal/screen state
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loggedInAdmin, setLoggedInAdmin] = useState<User | null>(null);

  // Load database on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Force clear any old local storage mock data if present
        if (typeof window !== 'undefined') {
          const lsS = localStorage.getItem('esangu_santri');
          if (lsS && (lsS.includes('"s1"') || lsS.includes('"s2"') || lsS.includes('"s3"'))) {
            localStorage.setItem('esangu_santri', JSON.stringify([]));
            localStorage.setItem('esangu_transactions', JSON.stringify([]));
            localStorage.setItem('esangu_registrations', JSON.stringify([]));
            localStorage.setItem('esangu_activityLogs', JSON.stringify([]));
          }
        }

        const db = await getFirebaseData();
        
        // Filter out any mock IDs just in case they persist in local browser state
        const cleanSantri = (db.santri || []).filter(s => s && s.id && !['s1', 's2', 's3', 's4', 's5'].includes(s.id));
        const cleanTxs = (db.transactions || []).filter(t => t && t.id && !['tx1', 'tx2', 'tx3', 'tx4', 'tx5', 'tx6', 'tx7', 'tx8', 'tx9', 'tx10', 'tx11', 'tx12', 'tx13', 'tx14', 'tx15', 'tx16', 'tx17', 'tx18'].includes(t.id));

        setStudents(cleanSantri);
        setTransactions(cleanTxs);
        setInstitution(db.institution);
        setFinancial(db.financial);
        
        let loadedUsers = db.users || [];
        let updatedUsers = [...loadedUsers];
        let needsSave = false;
        
        const masterIdx = updatedUsers.findIndex(u => u.username === 'master');
        if (masterIdx === -1) {
          updatedUsers.unshift({ id: 'u0', username: 'master', name: 'Master', role: 'Master', password: 'master123', isActive: true });
          needsSave = true;
        } else {
          const u = updatedUsers[masterIdx];
          if (u.role !== 'Master' || u.password !== 'master123' || u.isActive !== true) {
            updatedUsers[masterIdx] = { ...u, role: 'Master', password: 'master123', isActive: true };
            needsSave = true;
          }
        }

        const afifIdx = updatedUsers.findIndex(u => u.username === 'afif');
        if (afifIdx === -1) {
          updatedUsers.unshift({ id: 'u_afif', username: 'afif', name: 'Afif', role: 'Master', password: 'master123', isActive: true });
          needsSave = true;
        } else {
          const u = updatedUsers[afifIdx];
          if (u.role !== 'Master' || u.password !== 'master123' || u.isActive !== true) {
            updatedUsers[afifIdx] = { ...u, role: 'Master', password: 'master123', isActive: true };
            needsSave = true;
          }
        }

        if (needsSave) {
          saveFirebaseData({ users: updatedUsers });
        }
        setUsers(updatedUsers);
        
        setRegistrations((db.registrations || []).filter(r => r && r.id));
        setActivityLogs(db.activityLogs || []);
      } catch (e) {
        console.error("Firebase load failed, falling back to local storage:", e);
        const db = getLocalStorageData();
        
        const cleanSantri = (db.santri || []).filter(s => s && s.id && !['s1', 's2', 's3', 's4', 's5'].includes(s.id));
        const cleanTxs = (db.transactions || []).filter(t => t && t.id && !['tx1', 'tx2', 'tx3', 'tx4', 'tx5', 'tx6', 'tx7', 'tx8', 'tx9', 'tx10', 'tx11', 'tx12', 'tx13', 'tx14', 'tx15', 'tx16', 'tx17', 'tx18'].includes(t.id));

        setStudents(cleanSantri);
        setTransactions(cleanTxs);
        setInstitution(db.institution);
        setFinancial(db.financial);
        setUsers(db.users);
        setRegistrations(db.registrations || []);
        setActivityLogs(db.activityLogs || []);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const addLog = (user: string, role: string, action: string, details: string) => {
    const newLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user,
      role,
      action,
      details
    };
    const updated = [newLog, ...activityLogs];
    setActivityLogs(updated);
    saveFirebaseData({ activityLogs: updated });
  };

  // Sync state helpers to Firebase
  const handleAddStudent = (newS: Omit<Santri, 'id'>) => {
    const nextStudent: Santri = {
      ...newS,
      id: 's_' + Date.now().toString(),
      hasSavings: false,
      savingsActive: false
    };
    const updated = [...students, nextStudent];
    setStudents(updated);
    saveFirebaseData({ santri: [nextStudent] });
    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Tambah Santri', `Menambahkan santri baru: ${nextStudent.name} (${nextStudent.nis})`);
  };

  // Update Favicon and Title dynamically
  useEffect(() => {
    if (institution) {
      document.title = institution.name || 'E-Sangu Santri';
      
      // Favicon update
      if (institution.logoUrl) {
        const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = institution.logoUrl;
        document.getElementsByTagName('head')[0].appendChild(link);
      }
    }
  }, [institution]);

  const handleDeactivateSavings = (id: string) => {
    const updatedStudent = students.find(s => s.id === id);
    if (!updatedStudent) return;
    
    const nextS = { ...updatedStudent, hasSavings: false, savingsActive: false };
    const updated = students.map(s => s.id === id ? nextS : s);
    setStudents(updated);
    saveFirebaseData({ santri: [nextS] });
    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Hapus Tabungan', `Menghapus data tabungan santri: ${nextS.name}`);
  };

  const handleActivateSavings = (id: string) => {
    const updatedStudent = students.find(s => s.id === id);
    if (!updatedStudent) return;

    const nextS = { ...updatedStudent, hasSavings: true, savingsActive: true };
    const updated = students.map(s => s.id === id ? nextS : s);
    setStudents(updated);
    saveFirebaseData({ santri: [nextS] });
    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Aktifkan Tabungan', `Mengaktifkan akun tabungan santri: ${nextS.name}`);
  };

  const handleEditStudent = (editedS: Santri) => {
    const updated = students.map(s => s.id === editedS.id ? editedS : s);
    setStudents(updated);
    saveFirebaseData({ santri: [editedS] });

    // Sync any existing transactions with edited student details (name and class)
    const updatedTxs = transactions.map(t => {
      if (t.santriId === editedS.id) {
        return {
          ...t,
          santriName: editedS.name,
          santriClass: editedS.className
        };
      }
      return t;
    });
    setTransactions(updatedTxs);

    // Save updated transactions to Firebase
    const changedTxs = updatedTxs.filter(t => t.santriId === editedS.id);
    if (changedTxs.length > 0) {
      saveFirebaseData({ transactions: changedTxs });
    }

    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Edit Santri', `Mengubah data santri: ${editedS.name} (${editedS.nis})`);
  };

  const handleDeleteStudent = (id: string) => {
    const deletedS = students.find(s => s.id === id);
    const updatedS = students.filter(s => s.id !== id);
    
    // delete related transactions
    const txsToDelete = transactions.filter(t => t.santriId === id);
    const updatedT = transactions.filter(t => t.santriId !== id);
    
    setStudents(updatedS);
    setTransactions(updatedT);
    
    deleteFirebaseDocument('santri', id);
    txsToDelete.forEach(t => deleteFirebaseDocument('transactions', t.id));

    if (loggedInAdmin && deletedS) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Hapus Santri', `Menghapus santri: ${deletedS.name}`);
  };

  const handleBulkDeleteStudents = (ids: string[]) => {
    const updatedS = students.filter(s => !ids.includes(s.id));
    
    const txsToDelete = transactions.filter(t => ids.includes(t.santriId));
    const updatedT = transactions.filter(t => !ids.includes(t.santriId));
    
    setStudents(updatedS);
    setTransactions(updatedT);
    
    ids.forEach(id => deleteFirebaseDocument('santri', id));
    txsToDelete.forEach(t => deleteFirebaseDocument('transactions', t.id));

    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Hapus Massal Santri', `Menghapus ${ids.length} santri`);
  };

  const handleBulkDeactivateSavings = (ids: string[]) => {
    const toUpdate = students.filter(s => ids.includes(s.id)).map(s => ({ ...s, hasSavings: false, savingsActive: false }));
    const updated = students.map(s => ids.includes(s.id) ? toUpdate.find(u => u.id === s.id)! : s);
    
    setStudents(updated);
    saveFirebaseData({ santri: toUpdate });
    
    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Hapus Tabungan Massal', `Menghapus data tabungan ${ids.length} santri`);
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string }): Transaction => {
    const nextTx: Transaction = {
      ...newTx,
      note: newTx.note ? (newTx.note.trim() || '-') : '-',
      id: 'tx_' + Date.now().toString(),
      timestamp: newTx.timestamp || new Date().toISOString()
    };
    const updated = [nextTx, ...transactions];
    setTransactions(updated);
    saveFirebaseData({ transactions: [nextTx] });

    // Sync student status: ensure student is marked as having active savings upon transaction addition
    const student = students.find(s => s.id === newTx.santriId);
    if (student && (!student.hasSavings || !student.savingsActive)) {
      const updatedStudent = { ...student, hasSavings: true, savingsActive: true };
      const updatedStudents = students.map(s => s.id === student.id ? updatedStudent : s);
      setStudents(updatedStudents);
      saveFirebaseData({ santri: [updatedStudent] });
    }

    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Transaksi', `Melakukan ${nextTx.type} ${nextTx.accountType} sebesar Rp${nextTx.amount} untuk santri ${nextTx.santriName}`);
    return nextTx;
  };

  const handleSaveInstitution = (updatedInst: InstitutionSettings) => {
    setInstitution(updatedInst);
    saveFirebaseData({ institution: updatedInst });
  };

  const handleSaveFinancial = (updatedFin: FinancialSettings) => {
    setFinancial(updatedFin);
    saveFirebaseData({ financial: updatedFin });
  };

  const handleAddUser = (newU: Omit<User, 'id'>) => {
    const nextUser: User = {
      ...newU,
      id: 'u_' + Date.now().toString()
    };
    const updated = [...users, nextUser];
    setUsers(updated);
    saveFirebaseData({ users: [nextUser] });
  };

  const handleEditUser = (editedU: User) => {
    const updated = users.map(u => u.id === editedU.id ? editedU : u);
    setUsers(updated);
    saveFirebaseData({ users: [editedU] });
  };

  const handleAddRegistration = (newReg: Omit<PendingRegistration, 'id' | 'timestamp' | 'status'>) => {
    const nextReg: PendingRegistration = {
      ...newReg,
      id: 'reg_' + Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'Pending'
    };
    const updated = [...registrations, nextReg];
    setRegistrations(updated);
    saveFirebaseData({ registrations: [nextReg] });
  };

  const handleConfirmRegistration = (regId: string, nis: string, sendWa: boolean) => {
    const reg = registrations.find(r => r.id === regId);
    if (!reg) return;

    // Create new santri
    const newS: Santri = {
      id: 's_' + Date.now().toString(),
      nis: nis,
      name: reg.name,
      className: reg.className,
      dorm: reg.dorm,
      guardianPhone: reg.guardianPhone || '-',
      status: 'Aktif'
    };

    const updatedStudents = [...students, newS];
    const updatedRegs = registrations.map(r => r.id === regId ? { ...r, status: 'Confirmed' as const } : r);
    
    setStudents(updatedStudents);
    setRegistrations(updatedRegs);
    saveFirebaseData({ santri: [newS], registrations: updatedRegs.filter(r => r.id === regId) });
    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Konfirmasi Pendaftaran', `Menerima santri baru: ${newS.name} (${newS.nis})`);

    // WhatsApp logic
    if (sendWa && reg.guardianPhone && reg.guardianPhone !== '-') {
      let text = '';
      const portalUrl = window.location.origin;
      const template = institution.waTemplateAccountData || institution.waTemplateRegistration || `*E-SANGU SANTRI*\nSistem Tabungan dan Penitipan Uang Santri\n{NAMA PONDOK}\n\n*DATA AKUN SANTRI*\n\n*NIS :* {NIS}\n*Nama :* {NAMA}\n*Kelas :* {KELAS}\n*Asrama :* {ASRAMA}\n*No Wali :* {NO_WALI}\n\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {NAMA WEBSITE}`;
      
      text = template
        .replace(/{NAMA PONDOK}/g, institution.name)
        .replace(/{NIS}/g, nis)
        .replace(/{NAMA}/g, reg.name)
        .replace(/{KELAS}/g, reg.className)
        .replace(/{ASRAMA}/g, reg.dorm || '-')
        .replace(/{NO_WALI}/g, reg.guardianPhone)
        .replace(/{NAMA WEBSITE}/g, portalUrl);
      
      const cleanPhone = reg.guardianPhone.replace(/\D/g, '');
      let waNumber = cleanPhone;
      if (waNumber.startsWith('0')) {
        waNumber = '62' + waNumber.slice(1);
      } else if (waNumber.startsWith('8')) {
        waNumber = '62' + waNumber;
      }
      
      const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
      window.open(waLink, '_blank');
    }
  };

  const handleRejectRegistration = (regId: string, reason?: string) => {
    const reg = registrations.find(r => r.id === regId);
    if (!reg) return;
    const updatedRegs = registrations.map(r => r.id === regId ? { ...r, status: 'Rejected' as const, rejectionReason: reason } : r);
    setRegistrations(updatedRegs);
    saveFirebaseData({ registrations: updatedRegs });
    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Tolak Pengajuan', `Menolak pengajuan ${reg.type || 'Buka Akun'} santri: ${reg.name}. Alasan: ${reason || '-'}`);
  };

  const handleConfirmDeposit = (regId: string) => {
    const reg = registrations.find(r => r.id === regId);
    if (!reg) return;
    const updatedRegs = registrations.map(r => r.id === regId ? { ...r, status: 'Confirmed' as const } : r);
    setRegistrations(updatedRegs);
    saveFirebaseData({ registrations: updatedRegs });
    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Konfirmasi Setoran', `Menyetujui pengajuan setoran dana santri: ${reg.name}`);
  };

  const handleDeleteRegistration = (regId: string) => {
    const updatedRegs = registrations.filter(r => r.id !== regId);
    setRegistrations(updatedRegs);
    deleteFirebaseDocument('registrations', regId);
    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Hapus Pengajuan', `Menghapus riwayat pengajuan id: ${regId}`);
  };

  const handleDeleteUser = (id: string) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    deleteFirebaseDocument('users', id);
  };

  const handleRestoreData = async (restoredState: any) => {
    // Reload components states
    const db = await getFirebaseData();
    setStudents(db.santri);
    setTransactions(db.transactions);
    setInstitution(db.institution);
    setFinancial(db.financial);
    setUsers(db.users);
    setRegistrations(db.registrations || []);
    setActivityLogs(db.activityLogs || []);
  };

  const handleSaveFactoryDefault = async () => {
    try {
      const fullState = {
        esangu_santri: JSON.stringify(students),
        esangu_transactions: JSON.stringify(transactions),
        esangu_institution: JSON.stringify(institution),
        esangu_financial: JSON.stringify(financial),
        esangu_users: JSON.stringify(users),
        esangu_registrations: JSON.stringify(registrations),
        esangu_activityLogs: JSON.stringify(activityLogs),
      };
      localStorage.setItem('esangu_factory_default', JSON.stringify(fullState));
      
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('./lib/firebase');
      await setDoc(doc(db, 'settings', 'factory_template'), cleanUndefined({
        santri: students,
        transactions: transactions,
        institution: institution,
        financial: financial,
        users: users,
        registrations: registrations,
        activityLogs: activityLogs,
        savedAt: new Date().toISOString()
      }));
      return true;
    } catch (e) {
      console.error("Save factory default failed:", e);
      return false;
    }
  };

  const handleRestoreFactoryDefault = async () => {
    try {
      // 1. Delete all current records in Firestore to avoid orphaned records
      for (const s of students) {
        await deleteFirebaseDocument('santri', s.id);
      }
      for (const t of transactions) {
        await deleteFirebaseDocument('transactions', t.id);
      }
      for (const r of registrations) {
        await deleteFirebaseDocument('registrations', r.id);
      }
      for (const l of activityLogs) {
        await deleteFirebaseDocument('activityLogs', l.id);
      }
      for (const u of users) {
        await deleteFirebaseDocument('users', u.id);
      }

      // Also clean up settings/factory_template from Firestore if it exists
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('./lib/firebase');
      try {
        await deleteDoc(doc(db, 'settings', 'factory_template'));
      } catch (err) {
        console.warn("Could not delete factory_template doc:", err);
      }

      // Clean default sterile baseline
      const targetSantri: Santri[] = [];
      const targetTransactions: Transaction[] = [];
      const targetInstitution = DEFAULT_INSTITUTION_SETTINGS;
      const targetFinancial = DEFAULT_FINANCIAL_SETTINGS;
      const targetUsers = DEFAULT_USERS; // contains exactly manajer, admin, bendahara
      const targetRegistrations: PendingRegistration[] = [];
      const targetActivityLogs: any[] = [];

      // 2. Write the selected target data back to Firebase
      await saveFirebaseData({
        institution: targetInstitution,
        financial: targetFinancial,
        users: targetUsers,
        santri: targetSantri,
        transactions: targetTransactions,
        registrations: targetRegistrations,
        activityLogs: targetActivityLogs
      });

      // 3. Save to LocalStorage
      localStorage.setItem('esangu_santri', JSON.stringify(targetSantri));
      localStorage.setItem('esangu_transactions', JSON.stringify(targetTransactions));
      localStorage.setItem('esangu_institution', JSON.stringify(targetInstitution));
      localStorage.setItem('esangu_financial', JSON.stringify(targetFinancial));
      localStorage.setItem('esangu_users', JSON.stringify(targetUsers));
      localStorage.setItem('esangu_registrations', JSON.stringify(targetRegistrations));
      localStorage.setItem('esangu_activityLogs', JSON.stringify(targetActivityLogs));
      localStorage.removeItem('esangu_factory_default');
      localStorage.removeItem('esangu_factory_backup');
      localStorage.removeItem('esangu_custom_factory_saved');

      // 4. Update React states
      setStudents(targetSantri);
      setTransactions(targetTransactions);
      setInstitution(targetInstitution);
      setFinancial(targetFinancial);
      setUsers(targetUsers);
      setRegistrations(targetRegistrations);
      setActivityLogs(targetActivityLogs);

      return true;
    } catch (e) {
      console.error("Factory reset failed:", e);
      return false;
    }
  };

  // Admin login handler
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) {
      alert('Mohon masukkan username dan password!');
      return;
    }

    const foundUser = users.find(u => u.username === adminUsername.toLowerCase());
    
    if (foundUser) {
      if (foundUser.isActive === false) {
        alert('Akun Anda dinonaktifkan. Silakan hubungi Master.');
        return;
      }
      
      const isPasswordCorrect = foundUser.password 
        ? adminPassword === foundUser.password 
        : (adminPassword === foundUser.username || adminPassword === 'admin123');

      if (isPasswordCorrect) {
        setLoggedInAdmin(foundUser);
        setShowAdminLoginModal(false);
        setCurrentView('admin');
        setAdminUsername('');
        setAdminPassword('');
      } else {
        alert('Password salah!');
      }
    } else {
      alert('Username tidak terdaftar!');
    }
  };

  const handleAdminLogout = () => {
    setLoggedInAdmin(null);
    setCurrentView('portal');
  };

  if (!institution || !financial) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans text-xs">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="text-gray-500 font-semibold block">Menyiapkan database aman E-Sangu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 relative overflow-hidden font-sans text-emerald-950">
      {/* Background Mesh Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-emerald-200/40 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 min-h-screen flex flex-col justify-between">
        {/* Route Switcher Panel */}
        {currentView === 'portal' ? (
          <GuardianPortal
            students={students}
            transactions={transactions}
            institution={institution}
            financial={financial}
            onAdminLoginClick={() => setShowAdminLoginModal(true)}
            onRegister={handleAddRegistration}
            registrations={registrations}
          />
        ) : (
          loggedInAdmin && (
            <AdminPanel
              students={students}
              transactions={transactions}
              institution={institution}
              financial={financial}
              users={users}
              registrations={registrations}
              activityLogs={activityLogs}
              currentUser={loggedInAdmin}
              onLogout={handleAdminLogout}
              onAddStudent={handleAddStudent}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onBulkDeleteStudents={handleBulkDeleteStudents}
              onAddTransaction={handleAddTransaction}
              onSaveInstitution={handleSaveInstitution}
              onSaveFinancial={handleSaveFinancial}
              onAddUser={handleAddUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onRestoreData={handleRestoreData}
              onSaveFactoryDefault={handleSaveFactoryDefault}
              onRestoreFactoryDefault={handleRestoreFactoryDefault}
              onConfirmRegistration={handleConfirmRegistration}
              onRejectRegistration={handleRejectRegistration}
              onConfirmDeposit={handleConfirmDeposit}
              onDeleteRegistration={handleDeleteRegistration}
              onActivateSavings={handleActivateSavings}
              onDeactivateSavings={handleDeactivateSavings}
              onBulkDeactivateSavings={handleBulkDeactivateSavings}
            />
          )
        )}
      </div>

      <Login 
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        logoUrl={institution.logoUrl}
        onLogin={(u, p) => {
          // Wrap login logic in a way that handles state
          setAdminUsername(u);
          setAdminPassword(p);
          // Trigger the form submit logic - we can just call the handler manually
          const foundUser = users.find(usr => usr.username === u.toLowerCase());
          if (foundUser && foundUser.isActive !== false) {
            const isPasswordCorrect = foundUser.password 
              ? p === foundUser.password 
              : (p === foundUser.username || p === 'admin123');

            if (isPasswordCorrect) {
              setLoggedInAdmin(foundUser);
              setShowAdminLoginModal(false);
              setCurrentView('admin');
              setAdminUsername('');
              setAdminPassword('');
              return true;
            }
          }
          return false;
        }}
      />

      {globalAlert && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-250">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-300 relative overflow-hidden">
            {/* Top decorative badge */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600" />
            
            {/* Warning/Notification Icon */}
            <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center border border-emerald-100/50">
              <ShieldAlert className="w-6 h-6" />
            </div>
            
            {/* Text content */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-emerald-950 uppercase tracking-widest">Pemberitahuan Sistem</h3>
              <p className="text-xs text-gray-600 font-bold leading-relaxed whitespace-pre-line text-left">
                {globalAlert}
              </p>
            </div>
            
            {/* Dismiss Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setGlobalAlert(null)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-emerald-900/10 cursor-pointer border-none"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
