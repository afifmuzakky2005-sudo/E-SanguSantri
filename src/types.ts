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

export type AccountType = 'Tabungan' | 'Penitipan';
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
  
  // Fields for 'Setor Dana'
  santriId?: string;
  accountType?: AccountType;
  amount?: number;
  transferReceiptUrl?: string;
  rejectionReason?: string;
  note?: string;
}

export interface InstitutionSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string;
  leaderName: string;
  leaderNip: string;
  treasurerName: string;
  classes?: string[];
  waTemplateRegistration?: string;
  waTemplateTransaction?: string;
  waTemplateAccountData?: string;
  waTemplateBalanceSummary?: string;
  dorms?: string[];
  depositBankName?: string;
  depositBankAccountNumber?: string;
  depositBankAccountHolder?: string;
  depositBankCustomText?: string;
}

export interface FinancialSettings {
  maxWithdrawalsPerYear: number;
  windowOpen: boolean;
  windowStartDate: string;
  windowEndDate: string;
  adminFeeTabunganEnabled: boolean;
  adminFeeTabunganAmount: number;
  adminFeePenitipanEnabled: boolean;
  adminFeePenitipanAmount: number;
  savingsBookFeeAmount?: number;
  maxDepositAmount?: number;
  qrBalanceCheckEnabled?: boolean;
  allowDeleteWithBalance?: boolean;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'Master' | 'Bendahara' | 'Admin';
  password?: string;
  isActive?: boolean;
}
