// schemas/user/wallet.schema.ts
import { z } from 'zod';

export const transferSchema = z.object({
  params: z.object({
    walletId: z.string().min(1, 'Wallet ID is required')
  }),
  body: z.object({
    recipientId: z.string().min(1, 'Recipient ID is required'),
    amount: z.number()
      .positive('Amount must be greater than 0')
      .multipleOf(0.01, 'Amount cannot have more than 2 decimal places'),
    description: z.string().max(255).optional(),
    pin: z.string()
      .length(6, 'PIN must be 6 digits')
      .regex(/^\d+$/, 'PIN must contain only numbers')
  })
});

export const moneyRequestSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    amount: z.number()
      .positive('Amount must be greater than 0')
      .multipleOf(0.01, 'Amount cannot have more than 2 decimal places'),
    description: z.string().max(255).optional(),
    expiresAt: z.string()
      .datetime()
      .optional()
      .transform(val => val ? new Date(val) : undefined)
  })
});

export const processMoneyRequestSchema = z.object({
  params: z.object({
    transactionId: z.string().min(1, 'Transaction ID is required')
  }),
  body: z.object({
    action: z.enum(['accept', 'reject']),
    pin: z.string()
      .length(6, 'PIN must be 6 digits')
      .regex(/^\d+$/, 'PIN must contain only numbers')
      .optional()
      .transform(val => val || undefined)
  })
});

export const statementSchema = z.object({
  params: z.object({
    walletId: z.string().min(1, 'Wallet ID is required')
  }),
  query: z.object({
    startDate: z.string()
      .datetime()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    endDate: z.string()
      .datetime()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    type: z.enum(['credit', 'debit']).optional(),
    status: z.string().optional(),
    minAmount: z.string()
      .optional()
      .transform(val => val ? parseFloat(val) : undefined),
    maxAmount: z.string()
      .optional()
      .transform(val => val ? parseFloat(val) : undefined)
  }).refine(
    data => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"]
    }
  )
});