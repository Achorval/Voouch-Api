// src/schemas/admin/financial.schema.ts
import { z } from 'zod';

export const financialQuerySchema = z.object({
  query: z.object({
    startDate: z.string()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    endDate: z.string()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    categoryId: z.string().optional(),
    productId: z.string().optional(),
    providerId: z.string().optional(),
    type: z.enum(['credit', 'debit']).optional(),
    status: z.enum([
      'pending',
      'processing',
      'completed',
      'failed',
      'reversed'
    ]).optional(),
    paymentMethod: z.enum([
      'card',
      'bank_transfer',
      'wallet',
      'ussd'
    ]).optional()
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

export const referralQuerySchema = z.object({
  query: z.object({
    page: z.string()
      .optional()
      .transform(val => val ? parseInt(val) : 1),
    limit: z.string()
      .optional()
      .transform(val => val ? parseInt(val) : 10),
    startDate: z.string()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    endDate: z.string()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    minAmount: z.string()
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

export const productProviderFeeSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    providerId: z.string().min(1, 'Provider ID is required')
  })
});
