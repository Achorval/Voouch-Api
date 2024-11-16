// src/types/admin/financial.types.ts
export interface TransactionStats {
  totalAmount: string;
  totalFee: string;
  totalTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
}

export interface ReferralStats {
  totalReferrals: number;
  totalEarnings: string;
}

export interface ProductRevenue {
  productId: string;
  categoryId: string;
  totalAmount: string;
  totalFee: string;
  transactionCount: number;
}

export interface ProviderRevenue {
  providerId: string;
  totalAmount: string;
  totalFee: string;
  transactionCount: number;
}

export interface TransactionFee {
  feeType: string; //'flat' | 'percentage'
  feeValue: string;
  minFee?: string | null;
  maxFee?: string | null;
}

export interface FinancialQueryParams {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  productId?: string;
  providerId?: string;
  type?: 'credit' | 'debit';
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed';
  paymentMethod?: string;
}

export interface ReferralQueryParams {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
}
