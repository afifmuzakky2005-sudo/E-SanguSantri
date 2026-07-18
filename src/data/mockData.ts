import { Santri, Transaction, InstitutionSettings, FinancialSettings, User, PendingRegistration } from '../types';

export const INITIAL_SANTRI: Santri[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const DEFAULT_INSTITUTION_SETTINGS: InstitutionSettings = {
  name: 'Pondok Pesantren Wahyu Hidayatul Islam',
  address: 'KLOPOSAWIT - CANDIPURO - LUMAJANG',
  phone: '0274-123456',
  email: 'info@wahyuhidayatulislam.or.id',
  website: 'www.wahyuhidayatulislam.or.id',
  logoUrl: '',
  leaderName: '',
  leaderNip: '',
  treasurerName: 'Ustadz H. Ahmad Junaedi, S.E.',
  classes: [
    '1 TSANAWIYAH (PA)',
    '2 TSANAWIYAH (PA)',
    '3 TSANAWIYAH (PA)',
    '1 ALIYAH',
    '2 ALIYAH',
    '3 ALIYAH (A)',
    '3 ALIYAH (B)'
  ],
  waTemplateRegistration: "*E-SANGU SANTRI*\nSistem Tabungan dan Penitipan Uang Santri\n{NAMA PONDOK}\n\n*DATA AKUN SANTRI*\n\n*NIS :* {NIS}\n*Nama :* {NAMA}\n*Kelas :* {KELAS}\n*Asrama :* {ASRAMA}\n*No Wali :* {NO_WALI}\n\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {NAMA WEBSITE}",
  waTemplateTransaction: "*E-SANGU SANTRI*\nSistem Tabungan dan Penitipan Uang Santri\n{NAMA PONDOK}\n\n*{BUKTI}*\n\n*NIS :* {NIS}\n*Nama :* {NAMA}\n*Kelas :* {KELAS}\n\n*ID Transaksi :* {ID_TRANSAKSI}\n*Tanggal & Waktu :* {TANGGAL & WAKTU}\n*Akun Dana* : {AKUN DANA}\n*Keterangan* : {KETERANGAN}\n\n*Nominal : {NOMINAL}*\n______________________\n> Dibuat otomatis oleh Sistem E-Sangu Santri",
  waTemplateAccountData: "*E-SANGU SANTRI*\nSistem Tabungan dan Penitipan Uang Santri\n{NAMA PONDOK}\n\n*DATA AKUN SANTRI*\n\n*NIS :* {NIS}\n*Nama :* {NAMA}\n*Kelas :* {KELAS}\n*Asrama :* {ASRAMA}\n*No Wali :* {NO_WALI}\n\nSimpan data diatas sebagai akses mengecek Saldo Keuangan santri di website {NAMA WEBSITE}",
  waTemplateBalanceSummary: "*E-SANGU SANTRI*\nSistem Tabungan dan Penitipan Uang Santri\n{NAMA PONDOK}\n\n*RINGKASAN INFROMASI SALDO*\n\n*NIS :* {NIS}\n*Nama :* {NAMA}\n*Kelas :* {KELAS}\n\n*Saldo Tabungan :* {Saldo Tabungan}\n*Saldo Penitipan :* {Saldo Penitipan}\n\n*TOTAL SALDO* : {TOTAL SALDO}\n______________________\n> Dibuat otomatis oleh Sistem E-Sangu Santri",
  dorms: [
    'Yunusiyah',
    'Ar Ridho 1',
    'Ar Ridho 2',
    'Ar Ridho 3',
    'Al Badriyah'
  ]
};

export const DEFAULT_FINANCIAL_SETTINGS: FinancialSettings = {
  maxWithdrawalsPerYear: 3,
  windowOpen: false, // Default locked according to PRD
  windowStartDate: '2026-12-15',
  windowEndDate: '2026-12-30',
  adminFeeTabunganEnabled: true,
  adminFeeTabunganAmount: 5000, // Rp5.000
  adminFeePenitipanEnabled: false,
  adminFeePenitipanAmount: 0,
  savingsBookFeeAmount: 5000, // Rp5.000
  maxDepositAmount: 500000, // Rp500.000
  qrBalanceCheckEnabled: true, // Active by default
  allowDeleteWithBalance: false
};

export const DEFAULT_USERS: User[] = [
  { id: 'u_manajer', username: 'manajer', name: 'Manajer', role: 'Master', password: 'manajer123', isActive: true },
  { id: 'u_admin', username: 'admin', name: 'Admin', role: 'Admin', password: 'admin123', isActive: true },
  { id: 'u_bendahara', username: 'bendahara', name: 'Bendahara', role: 'Bendahara', password: 'bendahara123', isActive: true }
];

// Helper to initialize and retrieve database
export function getLocalStorageData() {
  if (typeof window === 'undefined') {
    return {
      santri: [],
      transactions: [],
      institution: DEFAULT_INSTITUTION_SETTINGS,
      financial: DEFAULT_FINANCIAL_SETTINGS,
      users: DEFAULT_USERS
    };
  }

  // Initialize if not present
  if (!localStorage.getItem('esangu_santri')) {
    localStorage.setItem('esangu_santri', JSON.stringify([]));
  }
  if (!localStorage.getItem('esangu_transactions')) {
    localStorage.setItem('esangu_transactions', JSON.stringify([]));
  }
  if (!localStorage.getItem('esangu_institution')) {
    localStorage.setItem('esangu_institution', JSON.stringify(DEFAULT_INSTITUTION_SETTINGS));
  }
  if (!localStorage.getItem('esangu_financial')) {
    localStorage.setItem('esangu_financial', JSON.stringify(DEFAULT_FINANCIAL_SETTINGS));
  }
  if (!localStorage.getItem('esangu_users')) {
    localStorage.setItem('esangu_users', JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem('esangu_registrations')) {
    localStorage.setItem('esangu_registrations', JSON.stringify([]));
  }
  if (!localStorage.getItem('esangu_activityLogs')) {
    localStorage.setItem('esangu_activityLogs', JSON.stringify([]));
  }

  const loadedInst = JSON.parse(localStorage.getItem('esangu_institution') || '{}') as InstitutionSettings;
  
  // Force override institution name and address based on recent requirement
  loadedInst.name = 'Pondok Pesantren Wahyu Hidayatul Islam';
  loadedInst.address = 'KLOPOSAWIT - CANDIPURO - LUMAJANG';
  loadedInst.leaderName = ''; // Force remove leader name
  
  if (!loadedInst.classes || loadedInst.classes.length !== DEFAULT_INSTITUTION_SETTINGS.classes!.length || !loadedInst.classes.includes('1 TSANAWIYAH (PA)')) {
    loadedInst.classes = [...DEFAULT_INSTITUTION_SETTINGS.classes!];
  }
  if (!loadedInst.dorms || loadedInst.dorms.length !== DEFAULT_INSTITUTION_SETTINGS.dorms!.length || !loadedInst.dorms.includes('Ar Ridho 1')) {
    loadedInst.dorms = [...DEFAULT_INSTITUTION_SETTINGS.dorms!];
  }
  if (!loadedInst.waTemplateTransaction) {
    loadedInst.waTemplateTransaction = DEFAULT_INSTITUTION_SETTINGS.waTemplateTransaction;
  }
  localStorage.setItem('esangu_institution', JSON.stringify(loadedInst));

  const loadedFin = JSON.parse(localStorage.getItem('esangu_financial') || '{}') as FinancialSettings;
  if (loadedFin.savingsBookFeeAmount === undefined) loadedFin.savingsBookFeeAmount = 5000;
  if (loadedFin.maxDepositAmount === undefined) loadedFin.maxDepositAmount = 500000;
  if (loadedFin.qrBalanceCheckEnabled === undefined) loadedFin.qrBalanceCheckEnabled = true;
  if (loadedFin.allowDeleteWithBalance === undefined) loadedFin.allowDeleteWithBalance = false;
  localStorage.setItem('esangu_financial', JSON.stringify(loadedFin));

  const loadedUsers = JSON.parse(localStorage.getItem('esangu_users') || '[]') as User[];
  let usersChanged = false;
  
  const masterIdx = loadedUsers.findIndex(u => u.username === 'master');
  if (masterIdx === -1) {
    loadedUsers.unshift({ id: 'u0', username: 'master', name: 'Master', role: 'Master', password: 'master123', isActive: true });
    usersChanged = true;
  } else {
    const u = loadedUsers[masterIdx];
    if (u.role !== 'Master' || u.password !== 'master123' || u.isActive !== true) {
      loadedUsers[masterIdx] = { ...u, role: 'Master', password: 'master123', isActive: true };
      usersChanged = true;
    }
  }

  const afifIdx = loadedUsers.findIndex(u => u.username === 'afif');
  if (afifIdx === -1) {
    loadedUsers.unshift({ id: 'u_afif', username: 'afif', name: 'Afif', role: 'Master', password: 'master123', isActive: true });
    usersChanged = true;
  } else {
    const u = loadedUsers[afifIdx];
    if (u.role !== 'Master' || u.password !== 'master123' || u.isActive !== true) {
      loadedUsers[afifIdx] = { ...u, role: 'Master', password: 'master123', isActive: true };
      usersChanged = true;
    }
  }

  if (usersChanged) {
    localStorage.setItem('esangu_users', JSON.stringify(loadedUsers));
  }

  return {
    santri: JSON.parse(localStorage.getItem('esangu_santri') || '[]') as Santri[],
    transactions: JSON.parse(localStorage.getItem('esangu_transactions') || '[]') as Transaction[],
    institution: loadedInst,
    financial: loadedFin,
    users: loadedUsers,
    registrations: JSON.parse(localStorage.getItem('esangu_registrations') || '[]') as PendingRegistration[],
    activityLogs: JSON.parse(localStorage.getItem('esangu_activityLogs') || '[]') as any[]
  };
}

export function saveLocalStorageData(data: {
  santri?: Santri[];
  transactions?: Transaction[];
  institution?: InstitutionSettings;
  financial?: FinancialSettings;
  users?: User[];
  registrations?: PendingRegistration[];
  activityLogs?: any[];
}) {
  if (typeof window === 'undefined') return;

  if (data.santri) localStorage.setItem('esangu_santri', JSON.stringify(data.santri));
  if (data.transactions) localStorage.setItem('esangu_transactions', JSON.stringify(data.transactions));
  if (data.institution) localStorage.setItem('esangu_institution', JSON.stringify(data.institution));
  if (data.financial) localStorage.setItem('esangu_financial', JSON.stringify(data.financial));
  if (data.users) localStorage.setItem('esangu_users', JSON.stringify(data.users));
  if (data.registrations) localStorage.setItem('esangu_registrations', JSON.stringify(data.registrations));
  if (data.activityLogs) localStorage.setItem('esangu_activityLogs', JSON.stringify(data.activityLogs));
}

// Calculate total balances
export function calculateBalances(santriId: string, transactions: Transaction[]) {
  const sTxs = transactions.filter(t => t.santriId === santriId);
  
  let tabunganBalance = 0;
  let penitipanBalance = 0;

  sTxs.forEach(t => {
    if (t.accountType === 'Tabungan') {
      if (t.type === 'Setor') {
        tabunganBalance += t.amount;
      } else {
        tabunganBalance -= t.amount; // total decrease in account is exactly the requested amount
      }
    } else {
      if (t.type === 'Setor') {
        penitipanBalance += t.amount;
      } else {
        penitipanBalance -= t.amount;
      }
    }
  });

  return {
    tabungan: Math.max(0, tabunganBalance),
    penitipan: Math.max(0, penitipanBalance),
    total: Math.max(0, tabunganBalance) + Math.max(0, penitipanBalance)
  };
}
