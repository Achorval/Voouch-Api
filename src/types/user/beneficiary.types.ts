// src/types/user/beneficiary.types.ts
export interface BankBeneficiary {
  id: string;
  userId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isFrequent: boolean;
  lastUsedAt?: Date;
}
