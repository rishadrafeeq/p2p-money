export interface ClientTransaction {
  id: string;
  type: string;
  sellMethod: string | null;
  walletId: string | null;
  bankAccountId: string | null;
  usdtAmount: number | null;
  inrAmount: number | null;
  withdrawnAmount: number | null;
  balanceAmount: number | null;
  screenshot: string | null;
  note: string | null;
  status: string;
  depositNetwork: string | null;
  depositAddressText: string | null;
  depositQr: string | null;
  orderApprovedAt: string | null;
  paymentExpiresAt: string | null;
  paymentSubmittedAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export interface SellRates {
  upiSellRate: number;
  impsSellRate: number;
}

export interface WalletLimitInfo {
  walletId: string;
  type: string;
  upiId: string | null;
  bankLabel: string | null;
  limit: number;
  used: number;
  remaining: number;
}

export interface BankLimitInfo {
  bankAccountId: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  bankName: string | null;
  limit: number;
  used: number;
  remaining: number;
}

export interface DailySellLimits {
  upiLimitPerWallet: number;
  impsLimitPerBank: number;
  upiWallets: WalletLimitInfo[];
  impsBanks: BankLimitInfo[];
  resetsAt: string;
}

export interface ClientBankAccount {
  id: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  bankName: string | null;
  createdAt: string;
}

export interface ClientWallet {
  id: string;
  type: string;
  upiId: string | null;
  bankLabel: string | null;
  status: string;
  canDeposit: boolean;
  canWithdraw: boolean;
  createdAt: string;
}

export interface PendingWalletAdd {
  id: string;
  type: string;
  upiId: string;
  status: string;
  adminMessage: string | null;
}

export interface ClientData {
  id: string;
  mobile: string;
  inviteCode: string | null;
  usdtBalance: number;
  inrBalance: number;
  accountInrBalance: number;
  availableBalance: number;
  totalWithdrawn: number;
  estValue: number;
  usdtSent: number;
  usdtReceived: number;
  quotaInr: number;
  todayEarning: number;
  sellRates: SellRates;
  dailySellLimits: DailySellLimits;
  hasPaymentPin: boolean;
  createdAt: string;
  paymentDetails: {
    bankName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    accountHolder: string | null;
    upiMobikwik: string | null;
    upiPhonepe: string | null;
    upiPaytm: string | null;
  } | null;
  bankAccounts: ClientBankAccount[];
  transactions: ClientTransaction[];
  wallets: ClientWallet[];
  pendingWalletAdd: PendingWalletAdd | null;
}
