// src/types/user/bank.types.ts
export interface BankAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface BankTransferInput {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description?: string;
  pin: string;
  saveAsBeneficiary?: boolean;
}

export interface BankTransferResponse {
  reference: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: string;
  fee: string;
  total: string;
  recipientAccount: Partial<BankAccount>;
}

export interface TransferQuote {
  fee: number;
  vat: number;
  total: number;
  settlementTime: string;
}

export interface BankTransferRequest {
  reference: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  narration?: string;
  currency: string;
}

export interface InitiateTransferResponse {
  sessionId: string;
  reference: string;
  status: string;
}