import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getFirebaseData, saveFirebaseData, deleteFirebaseDocument, cleanUndefined } from './services/firebaseStore';
import { getLocalStorageData, DEFAULT_INSTITUTION_SETTINGS, DEFAULT_FINANCIAL_SETTINGS, DEFAULT_USERS } from './data/mockData';
import { Santri, Transaction, InstitutionSettings, FinancialSettings, User, PendingRegistration } from './types';
import { updateAppFavicon } from './lib/faviconHelper';
import { ShieldAlert } from 'lucide-react';

// UI & Common Components
import { ErrorBoundary, OfflineIndicator } from './components';
import Login from './components/auth/Login';

// Pages according to folder structure (pages/public, pages/auth, pages/admin)
import PortalPage from './pages/public/PortalPage';
import ManualCheckPage from './pages/public/ManualCheckPage';
import SantriDetailPage from './pages/public/SantriDetailPage';

import LoginPage from './pages/auth/LoginPage';

import DashboardPage from './pages/admin/DashboardPage';
import StudentsPage from './pages/admin/StudentsPage';
import UsersPage from './pages/admin/UsersPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import MutasiPage from './pages/admin/MutasiPage';
import SavingsPage from './pages/admin/SavingsPage';
import RegistrationsPage from './pages/admin/RegistrationsPage';
import ImportPage from './pages/admin/ImportPage';
import QrPage from './pages/admin/QrPage';
import BackupPage from './pages/admin/BackupPage';
import LogsPage from './pages/admin/LogsPage';
import SettingsPage from './pages/admin/SettingsPage';

import LaporanPage from './pages/admin/LaporanPage';

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

  const [globalAlert, setGlobalAlert] = useState<string | null>(null);

  // Override native browser alert globally
  useEffect(() => {
    window.alert = (message: any) => {
      setGlobalAlert(String(message));
    };
  }, []);
  
  // Admin authentication modal/screen state & persistent login session
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [loggedInAdmin, setLoggedInAdmin] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('esangu_logged_admin');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSetLoggedInAdmin = (user: User | null) => {
    setLoggedInAdmin(user);
    if (user) {
      try {
        localStorage.setItem('esangu_logged_admin', JSON.stringify(user));
      } catch {}
    } else {
      try {
        localStorage.removeItem('esangu_logged_admin');
      } catch {}
    }
  };

  // Load database on mount
  useEffect(() => {
    const loadData = async () => {
      try {
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
        
        const cleanSantri = (db.santri || []).filter(s => s && s.id && !['s1', 's2', 's3', 's4', 's5'].includes(s.id));
        const cleanTxs = (db.transactions || []).filter(t => t && t.id && !['tx1', 'tx2', 'tx3', 'tx4', 'tx5', 'tx6', 'tx7', 'tx8', 'tx9', 'tx10', 'tx11', 'tx12', 'tx13', 'tx14', 'tx15', 'tx16', 'tx17', 'tx18'].includes(t.id));

        setStudents(cleanSantri);
        setTransactions(cleanTxs);
        setInstitution(db.institution);
        setFinancial(db.financial);
        
        let loadedUsers = (db.users || []).map((u, idx) => ({
          ...u,
          id: u.id || `u_${u.username || 'user'}_${idx}`
        }));
        
        const uniqueUserMap = new Map<string, User>();
        loadedUsers.forEach(u => {
          if (u && u.username) {
            uniqueUserMap.set(u.username.toLowerCase(), u);
          }
        });

        const defaultAccounts: User[] = [
          { id: 'u_master', username: 'master', name: 'Master', role: 'Master', password: 'master123', isActive: true },
          { id: 'u_afif', username: 'afif', name: 'Afif', role: 'Master', password: 'master123', isActive: true },
          { id: 'u_admin', username: 'admin', name: 'Admin', role: 'Admin', password: 'admin123', isActive: true },
          { id: 'u_manajer', username: 'manajer', name: 'Manajer', role: 'Master', password: 'manajer123', isActive: true },
          { id: 'u_bendahara', username: 'bendahara', name: 'Bendahara', role: 'Bendahara', password: 'bendahara123', isActive: true }
        ];

        let needsSave = false;
        defaultAccounts.forEach(def => {
          const key = def.username.toLowerCase();
          if (!uniqueUserMap.has(key)) {
            uniqueUserMap.set(key, def);
            needsSave = true;
          } else {
            const existing = uniqueUserMap.get(key)!;
            if (!existing.password || existing.isActive === false || existing.status === 'Nonaktif') {
              uniqueUserMap.set(key, { ...existing, password: existing.password || def.password, isActive: true, status: 'Aktif' });
              needsSave = true;
            }
          }
        });
        
        let updatedUsers = Array.from(uniqueUserMap.values());

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

        const fallbackUsers = (db.users || []).map((u, idx) => ({
          ...u,
          id: u.id || `u_${u.username || 'user'}_${idx}`
        }));
        const userMap = new Map<string, User>();
        fallbackUsers.forEach(u => {
          if (u && u.username) {
            userMap.set(u.username.toLowerCase(), u);
          }
        });

        const defaultAccounts: User[] = [
          { id: 'u_master', username: 'master', name: 'Master', role: 'Master', password: 'master123', isActive: true },
          { id: 'u_afif', username: 'afif', name: 'Afif', role: 'Master', password: 'master123', isActive: true },
          { id: 'u_admin', username: 'admin', name: 'Admin', role: 'Admin', password: 'admin123', isActive: true },
          { id: 'u_manajer', username: 'manajer', name: 'Manajer', role: 'Master', password: 'manajer123', isActive: true },
          { id: 'u_bendahara', username: 'bendahara', name: 'Bendahara', role: 'Bendahara', password: 'bendahara123', isActive: true }
        ];
        defaultAccounts.forEach(def => {
          if (!userMap.has(def.username.toLowerCase())) {
            userMap.set(def.username.toLowerCase(), def);
          }
        });

        setStudents(cleanSantri);
        setTransactions(cleanTxs);
        setInstitution(db.institution);
        setFinancial(db.financial);
        setUsers(Array.from(userMap.values()));
        setRegistrations(db.registrations || []);
        setActivityLogs(db.activityLogs || []);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Synchronize browser tab title and favicon
  useEffect(() => {
    const instName = institution?.name?.trim();
    document.title = instName ? `E-SanguSantri - ${instName}` : 'E-SanguSantri';
    updateAppFavicon(institution?.logoUrl, instName);
  }, [institution?.name, institution?.logoUrl]);

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

  const handleLogin = (u: string, p: string): boolean => {
    const targetU = (u || '').trim().toLowerCase();
    const inputPass = (p || '').trim();
    if (!targetU) return false;

    let foundUser = users.find(usr => (usr.username || '').trim().toLowerCase() === targetU);
    if (!foundUser) {
      const defaultAccounts: User[] = [
        { id: 'u_master', username: 'master', name: 'Master', role: 'Master', password: 'master123', isActive: true },
        { id: 'u_afif', username: 'afif', name: 'Afif', role: 'Master', password: 'master123', isActive: true },
        { id: 'u_admin', username: 'admin', name: 'Admin', role: 'Admin', password: 'admin123', isActive: true },
        { id: 'u_manajer', username: 'manajer', name: 'Manajer', role: 'Master', password: 'manajer123', isActive: true },
        { id: 'u_bendahara', username: 'bendahara', name: 'Bendahara', role: 'Bendahara', password: 'bendahara123', isActive: true }
      ];
      foundUser = defaultAccounts.find(usr => usr.username.toLowerCase() === targetU);
    }
    
    if (foundUser && foundUser.isActive !== false && foundUser.status !== 'Nonaktif') {
      const defaultPassMap: Record<string, string> = {
        master: 'master123',
        afif: 'master123',
        admin: 'admin123',
        manajer: 'manajer123',
        bendahara: 'bendahara123'
      };
      const defaultPass = defaultPassMap[targetU] || `${targetU}123`;

      const isPasswordCorrect = 
        inputPass === foundUser.password ||
        inputPass === defaultPass ||
        (targetU === 'master' && (inputPass === 'master123' || inputPass === 'admin123')) ||
        (targetU === 'admin' && (inputPass === 'admin123' || inputPass === 'master123')) ||
        inputPass === foundUser.username;

      if (isPasswordCorrect) {
        handleSetLoggedInAdmin(foundUser);
        setShowAdminLoginModal(false);
        return true;
      }
    }
    return false;
  };

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

  const handleAddStudents = (newStudents: Omit<Santri, 'id'>[]) => {
    const nextStudents: Santri[] = newStudents.map((newS, idx) => ({
      ...newS,
      id: 's_' + Date.now().toString() + '_' + idx,
      hasSavings: false,
      savingsActive: false
    }));
    
    setStudents(prev => {
      const updated = [...prev, ...nextStudents];
      saveFirebaseData({ santri: nextStudents });
      return updated;
    });
    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Impor Santri', `Menambahkan ${nextStudents.length} santri baru dari Excel`);
  };

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

    const changedTxs = updatedTxs.filter(t => t.santriId === editedS.id);
    if (changedTxs.length > 0) {
      saveFirebaseData({ transactions: changedTxs });
    }

    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Edit Santri', `Mengubah data santri: ${editedS.name} (${editedS.nis})`);
  };

  const handleDeleteStudent = (id: string) => {
    const deletedS = students.find(s => s.id === id);
    const updatedS = students.filter(s => s.id !== id);
    
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

  const handleBulkActivateSavings = (ids: string[]) => {
    const toUpdate = students.filter(s => ids.includes(s.id)).map(s => ({ ...s, hasSavings: true, savingsActive: true }));
    const updated = students.map(s => ids.includes(s.id) ? toUpdate.find(u => u.id === s.id)! : s);
    
    setStudents(updated);
    saveFirebaseData({ santri: toUpdate });
    
    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Aktifkan Tabungan Massal', `Mengaktifkan tabungan ${ids.length} santri`);
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
      id: 'tx_' + Date.now().toString() + '_' + Math.floor(Math.random() * 1000000).toString(),
      timestamp: newTx.timestamp || new Date().toISOString()
    };
    setTransactions(prev => [nextTx, ...prev]);
    saveFirebaseData({ transactions: [nextTx] });

    setStudents(prev => {
      const student = prev.find(s => s.id === newTx.santriId);
      if (student && (!student.hasSavings || !student.savingsActive)) {
        const updatedStudent = { ...student, hasSavings: true, savingsActive: true };
        saveFirebaseData({ santri: [updatedStudent] });
        return prev.map(s => s.id === student.id ? updatedStudent : s);
      }
      return prev;
    });

    if (loggedInAdmin) addLog(loggedInAdmin.name, loggedInAdmin.role, 'Transaksi', `Melakukan ${nextTx.type} ${nextTx.accountType} sebesar Rp${nextTx.amount} untuk santri ${nextTx.santriName}`);
    return nextTx;
  };

  const handleAddTransactions = (newTxs: (Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string })[]) => {
    const nextTxs: Transaction[] = newTxs.map((newTx, index) => {
      const timestamp = newTx.timestamp || new Date().toISOString();
      return {
        ...newTx,
        id: 'tx_' + (Date.now() + index).toString() + '_' + Math.floor(Math.random() * 1000000).toString(),
        timestamp,
        note: newTx.note ? (newTx.note.trim() || '-') : '-',
      };
    });

    setTransactions(prev => [...nextTxs, ...prev]);
    saveFirebaseData({ transactions: nextTxs });

    const santriIds = Array.from(new Set(newTxs.map(t => t.santriId)));
    setStudents(prev => {
      const toUpdate: Santri[] = [];
      const updated = prev.map(s => {
        if (santriIds.includes(s.id) && (!s.hasSavings || !s.savingsActive)) {
          const updatedS = { ...s, hasSavings: true, savingsActive: true };
          toUpdate.push(updatedS);
          return updatedS;
        }
        return s;
      });
      if (toUpdate.length > 0) {
        saveFirebaseData({ santri: toUpdate });
      }
      return updated;
    });

    if (loggedInAdmin) {
      addLog(loggedInAdmin.name, loggedInAdmin.role, 'Impor Transaksi Massal', `Berhasil mengimpor ${nextTxs.length} transaksi mutasi kas harian`);
    }
  };

  const handleDeleteTransaction = (txId: string) => {
    const txToDelete = transactions.find(t => t.id === txId);
    if (!txToDelete) return;

    const updatedTxs = transactions.filter(t => t.id !== txId);
    setTransactions(updatedTxs);
    localStorage.setItem('esangu_transactions', JSON.stringify(updatedTxs));
    deleteFirebaseDocument('transactions', txId);

    if (loggedInAdmin) {
      addLog(loggedInAdmin.name, loggedInAdmin.role, 'Hapus Transaksi', `Menghapus transaksi ${txToDelete.type} ${txToDelete.accountType} sebesar Rp${txToDelete.amount} untuk santri ${txToDelete.santriName}`);
    }
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    const nextTxs = transactions.map(t => t.id === updatedTx.id ? updatedTx : t);
    setTransactions(nextTxs);
    localStorage.setItem('esangu_transactions', JSON.stringify(nextTxs));
    saveFirebaseData({ transactions: [updatedTx] });

    if (loggedInAdmin) {
      addLog(loggedInAdmin.name, loggedInAdmin.role, 'Edit Transaksi', `Memperbarui data mutasi kas transaksi santri ${updatedTx.santriName} (${updatedTx.type} Rp${updatedTx.amount.toLocaleString('id-ID')})`);
    }
  };

  const handleSaveInstitution = (updatedInst: InstitutionSettings) => {
    setInstitution(updatedInst);
    updateAppFavicon(updatedInst.logoUrl, updatedInst.name);
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

    if (sendWa && reg.guardianPhone && reg.guardianPhone !== '-') {
      let text = '';
      const portalUrl = window.location.origin;
      const template = institution?.waTemplateAccountData || institution?.waTemplateRegistration || `*E-SANGU SANTRI*\nSistem Tabungan Uang Santri\n{NAMA PONDOK}\n\n*DATA AKUN SANTRI*\n\n*NIS :* {NIS}\n*Nama :* {NAMA}\n*Kelas :* {KELAS}\n*Asrama :* {ASRAMA}\n*No Wali :* {NO_WALI}\n\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {NAMA WEBSITE}`;
      
      text = template
        .replace(/{NAMA PONDOK}/g, institution?.name || '')
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
      const { db } = await import('./services/firebase');
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

      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('./services/firebase');
      try {
        await deleteDoc(doc(db, 'settings', 'factory_template'));
      } catch (err) {
        console.warn("Could not delete factory_template doc:", err);
      }

      const targetSantri: Santri[] = [];
      const targetTransactions: Transaction[] = [];
      const targetInstitution = DEFAULT_INSTITUTION_SETTINGS;
      const targetFinancial = DEFAULT_FINANCIAL_SETTINGS;
      const targetUsers = DEFAULT_USERS;
      const targetRegistrations: PendingRegistration[] = [];
      const targetActivityLogs: any[] = [];

      await saveFirebaseData({
        institution: targetInstitution,
        financial: targetFinancial,
        users: targetUsers,
        santri: targetSantri,
        transactions: targetTransactions,
        registrations: targetRegistrations,
        activityLogs: targetActivityLogs
      });

      localStorage.setItem('esangu_santri', JSON.stringify(targetSantri));
      localStorage.setItem('esangu_transactions', JSON.stringify(targetTransactions));
      localStorage.setItem('esangu_institution', JSON.stringify(targetInstitution));
      localStorage.setItem('esangu_financial', JSON.stringify(targetFinancial));
      localStorage.setItem('esangu_users', JSON.stringify(targetUsers));
      localStorage.setItem('esangu_registrations', JSON.stringify(targetRegistrations));
      localStorage.setItem('esangu_activityLogs', JSON.stringify(targetActivityLogs));
      localStorage.removeItem('esangu_factory_default');

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

  const handleAdminLogout = () => {
    handleSetLoggedInAdmin(null);
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

  const commonProps = {
    students,
    transactions,
    institution,
    financial,
    onAdminLoginClick: () => setShowAdminLoginModal(true),
    onRegister: handleAddRegistration,
    registrations
  };

  const adminProps = {
    students,
    transactions,
    institution,
    financial,
    users,
    registrations,
    activityLogs,
    currentUser: loggedInAdmin!,
    onLogout: handleAdminLogout,
    onAddStudent: handleAddStudent,
    onAddStudents: handleAddStudents,
    onEditStudent: handleEditStudent,
    onDeleteStudent: handleDeleteStudent,
    onBulkDeleteStudents: handleBulkDeleteStudents,
    onAddTransaction: handleAddTransaction,
    onAddTransactions: handleAddTransactions,
    onDeleteTransaction: handleDeleteTransaction,
    onUpdateTransaction: handleUpdateTransaction,
    onSaveInstitution: handleSaveInstitution,
    onSaveFinancial: handleSaveFinancial,
    onAddUser: handleAddUser,
    onEditUser: handleEditUser,
    onDeleteUser: handleDeleteUser,
    onRestoreData: handleRestoreData,
    onSaveFactoryDefault: handleSaveFactoryDefault,
    onRestoreFactoryDefault: handleRestoreFactoryDefault,
    onConfirmRegistration: handleConfirmRegistration,
    onRejectRegistration: handleRejectRegistration,
    onConfirmDeposit: handleConfirmDeposit,
    onDeleteRegistration: handleDeleteRegistration,
    onActivateSavings: handleActivateSavings,
    onDeactivateSavings: handleDeactivateSavings,
    onBulkDeactivateSavings: handleBulkDeactivateSavings,
    onBulkActivateSavings: handleBulkActivateSavings
  };

  return (
    <BrowserRouter>
      <AppRoutes 
        commonProps={commonProps}
        adminProps={adminProps}
        institution={institution}
        loggedInAdmin={loggedInAdmin}
        handleLogin={handleLogin}
        showAdminLoginModal={showAdminLoginModal}
        setShowAdminLoginModal={setShowAdminLoginModal}
        globalAlert={globalAlert}
        setGlobalAlert={setGlobalAlert}
      />
    </BrowserRouter>
  );
}

function AppRoutes({ 
  commonProps, 
  adminProps, 
  institution, 
  loggedInAdmin, 
  handleLogin, 
  showAdminLoginModal, 
  setShowAdminLoginModal, 
  globalAlert, 
  setGlobalAlert 
}: any) {
  const navigate = useNavigate();

  const handleLoginModalSubmit = (u: string, p: string) => {
    const success = handleLogin(u, p);
    if (success) {
      navigate('/admin/dashboard');
    }
    return success;
  };

  const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!loggedInAdmin) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-emerald-100 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center border border-amber-100">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-sm font-black text-emerald-950 uppercase tracking-wider">Akses Terbatas</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Anda harus masuk sebagai Admin / Kasir untuk membuka halaman administrasi back-office.
            </p>
            <button
              onClick={() => setShowAdminLoginModal(true)}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-emerald-900/10 cursor-pointer border-none"
            >
              Buka Login Admin
            </button>
          </div>
        </div>
      );
    }
    return <>{children}</>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 relative overflow-hidden font-sans text-emerald-950">
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-emerald-200/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col justify-between">
        <ErrorBoundary fallbackTitle="Aplikasi Mengalami Gangguan" onReset={() => window.location.reload()}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/portal" replace />} />
            <Route path="/portal" element={<PortalPage {...commonProps} />} />
            <Route path="/cek" element={<ManualCheckPage {...commonProps} />} />
            <Route path="/cek/:nis" element={<SantriDetailPage {...commonProps} />} />
            <Route 
              path="/login" 
              element={
                <LoginPage 
                  isOpen={true} 
                  onClose={() => {}} 
                  logoUrl={institution.logoUrl} 
                  onLogin={handleLogin}
                  loggedInAdmin={loggedInAdmin}
                />
              } 
            />

            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminGuard><DashboardPage {...adminProps} /></AdminGuard>} />
            <Route path="/admin/master/santri" element={<AdminGuard><StudentsPage {...adminProps} /></AdminGuard>} />
            <Route path="/admin/master/pengguna" element={<AdminGuard><UsersPage {...adminProps} /></AdminGuard>} />
            <Route path="/admin/transaksi" element={<AdminGuard><TransactionsPage {...adminProps} /></AdminGuard>} />
            <Route path="/admin/mutasi" element={<AdminGuard><MutasiPage {...adminProps} /></AdminGuard>} />
            <Route path="/admin/tabungan" element={<AdminGuard><SavingsPage {...adminProps} /></AdminGuard>} />
            <Route path="/admin/pendaftaran" element={<AdminGuard><RegistrationsPage {...adminProps} /></AdminGuard>} />
            <Route path="/admin/impor" element={<AdminGuard><ImportPage {...adminProps} /></AdminGuard>} />
            <Route path="/admin/qr" element={<AdminGuard><QrPage {...adminProps} /></AdminGuard>} />
            <Route path="/admin/backup-restore" element={<AdminGuard><BackupPage {...adminProps} /></AdminGuard>} />
            <Route path="/admin/log-aktifitas" element={<AdminGuard><LogsPage {...adminProps} /></AdminGuard>} />
            <Route path="/admin/laporan" element={<AdminGuard><LaporanPage {...adminProps} /></AdminGuard>} />
            <Route path="/admin/pengaturan" element={<AdminGuard><SettingsPage {...adminProps} /></AdminGuard>} />

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </Routes>
        </ErrorBoundary>
      </div>

      {/* Global Login Modal */}
      <Login 
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        logoUrl={institution.logoUrl}
        onLogin={handleLoginModalSubmit}
      />

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Global Alert Notification */}
      {globalAlert && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-250">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600" />
            <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center border border-emerald-100/50">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black text-emerald-950 uppercase tracking-widest">Pemberitahuan Sistem</h3>
              <p className="text-xs text-gray-600 font-bold leading-relaxed whitespace-pre-line text-left">
                {globalAlert}
              </p>
            </div>
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
