export interface Santri {
  id: string;
  nis: string;
  name: string;
  className: string;
  dorm: string;
  guardianPhone: string;
  status: 'Aktif' | 'Nonaktif';
  hasSavings?: boolean;
  savingsActive?: boolean;
}

export type AccountType = 'Tabungan';
export type TransactionType = 'Setor' | 'Tarik';

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}

export interface Transaction {
  id: string;
  santriId: string;
  santriName: string; // denormalized for search convenience
  santriClass: string; // denormalized for search convenience
  date: string; // YYYY-MM-DD
  type: TransactionType;
  accountType: AccountType;
  amount: number;
  adminFee: number;
  netAmount: number; // amount - fee or amount + fee depending on context
  note: string;
  cashierName: string;
  signatureName?: string; // name of withdrawer/signer
  timestamp: string; // ISO string
  paymentMethod?: 'Tunai' | 'Transfer';
  bankName?: string;
  accountInfo?: string; // name / account number
  transferReceiptUrl?: string; // base64 string or url of uploaded receipt
}

export interface PendingRegistration {
  id: string;
  type?: 'Buka Akun' | 'Setor Dana';
  name: string;
  className: string;
  dorm: string;
  guardianPhone?: string;
  timestamp: string;
  status: 'Pending' | 'Confirmed' | 'Rejected';
  rejectionReason?: string;
  note?: string;
  
  // Fields for 'Setor Dana'
  santriId?: string;
  accountType?: AccountType;
  amount?: number;
  transferReceiptUrl?: string;
  paymentMethod?: 'Tunai' | 'Transfer';
  bankName?: string;
  accountInfo?: string;
}

export interface InstitutionSettings {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  headerTitle?: string;
  headName?: string; // Head of Islamic Boarding School / Bendahara
  leaderName?: string;
  leaderNip?: string;
  treasurerName?: string;
  masterPassword?: string; // Secret password for override actions (deleting santri, etc.)
  operationalSchedule?: string; // e.g., "Setiap Hari Jumat, 08.00 - 16.00 WIB"
  institutionClasses?: string[];
  classes?: string[];
  dorms?: string[];
  waTemplateRegistration?: string;
  waTemplateAccountData?: string;
  waTemplateTransaction?: string;
  waTemplateBalanceSummary?: string;
  depositBankName?: string;
  depositBankAccountNumber?: string;
  depositBankAccountHolder?: string;
  depositBankCustomText?: string;
}

export interface FinancialSettings {
  adminFeeSetor?: number;
  adminFeeTarik?: number;
  allowNegativeBalance?: boolean;
  allowDeleteWithBalance?: boolean; // Default false
  monthlySavingsLimit?: number; // Maximum withdrawal limit
  maxWithdrawalsPerYear?: number; // Maximum times a student can withdraw per year
  scheduleRules?: string; // Rules description for guardian portal
  balanceCheckMethod?: 'all' | 'manual' | 'camera' | 'scanner' | 'qr' | 'both';
  qrBalanceCheckEnabled?: boolean;
  windowOpen?: boolean;
  windowStartDate?: string;
  windowEndDate?: string;
  savingsBookFeeAmount?: number;
  adminFeeTabunganAmount?: number;
  adminFeeTabunganEnabled?: boolean;
}

export type UserRole = 'Super Admin' | 'Kasir' | 'Master' | 'Admin' | 'Bendahara' | string;

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  status?: 'Aktif' | 'Nonaktif';
  isActive?: boolean;
}
