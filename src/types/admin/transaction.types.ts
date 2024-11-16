// // src/types/admin/transaction.types.ts

// export type TransactionStatus =
//   | "pending"
//   | "processing"
//   | "completed"
//   | "failed"
//   | "reversed"
//   | "cancelled"
//   | "refunded";
// export type PaymentMethod = "wallet" | "card" | "bank_transfer";

// export interface Transaction {
//   id: string;
//   userId: string;
//   walletId?: string;
//   categoryId: string;
//   status: TransactionStatus;
//   amount: string;
//   fee: string;
//   total: string;
//   paymentMethod: PaymentMethod;
//   cardId?: string;
//   reference: string;
//   externalReference?: string;
//   description?: string;
//   metadata?: Record<string, any>;
//   createdAt: Date;
//   updatedAt: Date;
//   completedAt?: Date;
// }

// export interface TransactionWithUser extends Transaction {
//   user: {
//     id: string;
//     email: string;
//     firstName: string;
//     lastName: string;
//     phoneNumber: string;
//   };
//   category: {
//     id: string;
//     name: string;
//     code: string;
//   };
// }

// export interface TransactionListOptions {
//   page?: number;
//   limit?: number;
//   status?: TransactionStatus;
//   startDate?: Date;
//   endDate?: Date;
//   userId?: string;
//   categoryId?: string;
//   paymentMethod?: PaymentMethod;
//   minAmount?: number;
//   maxAmount?: number;
//   reference?: string;
// }

// export interface TransactionListResponse {
//   transactions: TransactionWithUser[];
//   meta: {
//     total: number;
//     pages: number;
//     totalAmount: string;
//     totalFees: string;
//   };
// }



// src/types/admin/transaction.types.ts
import { TransactionStatus } from "@/db/schema/transactions";
// export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'reversed' | 'cancelled' | 'refunded';
export type TransactionType = 'credit' | 'debit';
export type PaymentMethod = 'card' | 'bank_transfer' | 'wallet' | 'ussd';

export interface Transaction {
  id: string;
  userId: string;
  reference: string;
  externalReference?: string;
  amount: string;
  fee: string;
  total: string;
  type: TransactionType;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  categoryId: string;
  productId?: string;
  providerId?: string;
  cardId?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TransactionWithUser extends Transaction {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  category: {
    id: string;
    name: string;
    code: string;
  };
}

export interface TransactionListQueryParams {
  page?: number;
  limit?: number;
  status?: TransactionStatus;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: PaymentMethod;
  categoryId?: string;
  reference?: string;
  search?: string;
  userId?: string;
}

export interface TransactionListResponse {
  transactions: TransactionWithUser[];
  meta: {
    total: number;
    pages: number;
    page: number;
    limit: number;
    totalAmount: string;
    totalFees: string;
  };
}

export interface TransactionActionDto {
  action: 'approve' | 'decline' | 'reverse';
  reason: string;
  metadata?: Record<string, any>;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: string;
  totalFees: string;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  reversedTransactions: number;
  todayStats: {
    count: number;
    amount: string;
    fees: string;
  };
  recentActivity: {
    timestamp: Date;
    action: string;
    details: string | null;
  }[];
}