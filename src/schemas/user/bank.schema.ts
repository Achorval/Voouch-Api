// schemas/user/wallet.schema.ts
import { z } from 'zod';

export const bankTransferSchema = z.object({
  params: z.object({
    walletId: z.string().min(1, 'Wallet ID is required')
  }),
  body: z.object({
    bankCode: z.string().min(1, 'Bank code is required'),
    accountNumber: z
      .string()
      .length(10, 'Account number must be 10 digits')
      .regex(/^\d+$/, 'Account number must contain only numbers'),
    accountName: z.string().min(1, 'Account name is required'),
    amount: z.number()
      .positive('Amount must be greater than 0')
      .multipleOf(0.01, 'Amount cannot have more than 2 decimal places'),
    description: z.string().max(255).optional(),
    pin: z.string()
      .length(6, 'PIN must be 6 digits')
      .regex(/^\d+$/, 'PIN must contain only numbers'),
    saveAsBeneficiary: z.boolean().optional()
  })
});

export const bankVerifyAccountSchema = z.object({
  body: z.object({
    bankCode: z.string().min(1, 'Bank code is required'),
    accountNumber: z
      .string()
      .length(10, 'Account number must be 10 digits')
      .regex(/^\d+$/, 'Account number must contain only numbers')
  })
});