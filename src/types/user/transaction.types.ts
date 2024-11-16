// src/types/user/transaction.types.ts
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from "@/db/schema/transactions";

// Type for inserting a new transaction
export type TransactionInsert = {
  userId: string;
  walletId: string;
  categoryId: string;
  type: TransactionType;
  amount: string;
  fee: string;
  total: string;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  reference: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
};

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  categoryId: string;
  productId?: string;
  providerId?: string;
  status: TransactionStatus;
  type: TransactionType;
  amount: string;
  fee: string;
  total: string;
  paymentMethod: PaymentMethod;
  reference: string;
  externalReference?: string;
  description?: string;
  providerData?: Record<string, any>;
  serviceData?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface CreateTransactionInput {
  userId: string;
  walletId: string;
  categoryId: string;
  productId?: string;
  providerId?: string;
  type: TransactionType;
  amount: number;
  fee?: number;
  status?: TransactionStatus;
  paymentMethod: PaymentMethod;
  description?: string;
  reference?: string;
  serviceData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface TransactionHistoryFilters {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  type?: TransactionType;
  status?: TransactionStatus;
  categoryId?: string;
  search?: string;
  walletId?: string;
}

export interface TransactionSummary {
  totalAmount: string;
  totalIncoming: string;
  totalOutgoing: string;
  totalFees: string;
}

export interface TransactionResponse {
  transactions: TransactionWithDetails[];
  summary: TransactionSummary;
  meta: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export interface TransactionWithDetails extends Transaction {
  category: {
    id: string;
    name: string;
    code: string;
  };
  product?: {
    id: string;
    name: string;
    code: string;
  };
  provider?: {
    id: string;
    name: string;
    code: string;
  };
}