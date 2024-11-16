// src/types/user/wallet.types.ts
// export interface WalletTransferParams {
//   fromWalletId: string;
//   toWalletId: string;
//   amount: number;
//   description?: string;
// }

// export interface TransactionHistoryParams {
//   walletId?: string;
//   type?: 'credit' | 'debit';
//   status?: string;
//   startDate?: Date;
//   endDate?: Date;
//   page?: number;
//   limit?: number;
// }

// export interface TransactionMetadata {
//   transferType?: string;
//   senderWalletId?: string;
//   recipientWalletId?: string;
//   [key: string]: any;
// }


import { WalletStatus } from "@/db/schema/wallets";
import { TransactionStatus, TransactionType } from "../../db/schema/transactions";
import { PaymentMethod } from "../../db/schema/transactions";

export interface WalletBalance {
  id: string;
  amount: string;
  currencyId: string;
  currency: {
    code: string;
    symbol: string;
  };
}

export interface TransferInput {
  recipientId: string;
  amount: number;
  description?: string;
  pin: string;
}

export interface BankTransferInput {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description?: string;
  pin: string;
}

export interface MoneyRequestInput {
  userId: string;
  amount: number;
  description?: string;
  expiresAt?: Date;
}

export interface WalletTransactionInput {
  amount: number;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
}

export interface WalletStatementFilters {
  startDate?: Date;
  endDate?: Date;
  type?: TransactionType;
  status?: TransactionStatus;
  minAmount?: number;
  maxAmount?: number;
}

export interface CardInput {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export interface CardSettings {
  isDefault?: boolean;
  enableOnline?: boolean;
  enableAtm?: boolean;
  spendingLimit?: number;
}

export interface WalletResponse {
  id: string;
  userId: string;
  currencyId: string;
  isDefault: boolean;
  status: WalletStatus;
  balance?: WalletBalance;
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
}

export interface WalletTransactionResponse {
  id: string;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  description?: string | null;
  reference: string;
  createdAt: Date;
  metadata?: Record<string, any> | null;
}

export interface WalletStatementResponse {
  transactions: WalletTransactionResponse[];
  summary: {
    totalCredit: string;
    totalDebit: string;
    openingBalance: string;
    closingBalance: string;
  };
  meta: {
    startDate: Date;
    endDate: Date;
    generatedAt: Date;
  };
}

// export interface MoneyRequestResponse {
//   id: string;
//   requesterId: string;
//   amount: string;
//   description?: string;
//   status: 'pending' | 'accepted' | 'rejected' | 'expired';
//   expiresAt?: Date;
//   createdAt: Date;
// }

export interface CardResponse {
  id: string;
  cardNumber: string;
  cardHolderName: string;
  last4Digits: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: string;
  isDefault: boolean;
  isActive: boolean;
  settings?: CardSettings;
}
