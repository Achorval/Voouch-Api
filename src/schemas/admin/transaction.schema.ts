// // Validation schema for filtering transactions
// import { z } from 'zod';

// export const transactionFilterSchema = z.object({
//   query: z.object({
//     page: z.string().regex(/^\d+$/).optional().transform(Number),
//     limit: z.string().regex(/^\d+$/).optional().transform(Number),
//     status: z.enum(['pending', 'processing', 'completed', 'failed', 'reversed']).optional(),
//     startDate: z.string().datetime().optional(),
//     endDate: z.string().datetime().optional(),
//     userId: z.string().uuid().optional(),
//     categoryId: z.string().uuid().optional(),
//     paymentMethod: z.enum(['wallet', 'card', 'bank_transfer']).optional(),
//     minAmount: z.string().regex(/^\d+$/).optional().transform(Number),
//     maxAmount: z.string().regex(/^\d+$/).optional().transform(Number),
//     reference: z.string().optional(),
//   })
// });


// src/schemas/admin/transaction.schema.ts
import { z } from 'zod';

export const listTransactionsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'reversed', 'declined']).optional(),
    type: z.enum(['credit', 'debit']).optional(),
    startDate: z.string()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    endDate: z.string()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    minAmount: z.string()
      .optional()
      .transform(val => val ? parseFloat(val) : undefined),
    maxAmount: z.string()
      .optional()
      .transform(val => val ? parseFloat(val) : undefined),
    paymentMethod: z.enum(['card', 'bank_transfer', 'wallet', 'ussd']).optional(),
    categoryId: z.string().optional(),
    reference: z.string().optional(),
    search: z.string().optional(),
    userId: z.string().optional()
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"]
    }
  ).refine(
    (data) => {
      if (data.minAmount && data.maxAmount) {
        return data.minAmount <= data.maxAmount;
      }
      return true;
    },
    {
      message: "Maximum amount must be greater than minimum amount",
      path: ["maxAmount"]
    }
  ),
});

export const transactionActionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transaction ID is required')
  }),
  body: z.object({
    action: z.enum(['approve', 'decline', 'reverse']),
    reason: z.string().min(1, 'Reason is required'),
    metadata: z.record(z.any()).optional()
  })
});

export const transactionStatsSchema = z.object({
  query: z.object({
    startDate: z.string()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    endDate: z.string()
      .optional()
      .transform(val => val ? new Date(val) : undefined)
  }).refine(
    (data) => {
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