// src/schemas/user/transaction.schema.ts
import { z } from 'zod';

export const transactionHistorySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
    startDate: z.string()
      .datetime()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    endDate: z.string()
      .datetime()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    type: z.enum(['credit', 'debit']).optional(),
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'reversed']).optional(),
    categoryId: z.string().optional(),
    search: z.string().optional(),
    walletId: z.string().optional()
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

export const transactionDetailsSchema = z.object({
  params: z.object({
    transactionId: z.string().min(1, 'Transaction ID is required')
  })
});

export const financialSummarySchema = z.object({
  query: z.object({
    startDate: z.string()
      .datetime()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    endDate: z.string()
      .datetime()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    walletId: z.string().optional()
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

export const spendingAnalyticsSchema = z.object({
  query: z.object({
    startDate: z.string()
      .datetime()
      .transform(val => new Date(val)),
    endDate: z.string()
      .datetime()
      .transform(val => new Date(val)),
    walletId: z.string().optional()
  }).refine(
    (data) => {
      return data.startDate <= data.endDate;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"]
    }
  )
});

export const generateStatementSchema = z.object({
  query: z.object({
    startDate: z.string()
      .datetime()
      .transform(val => new Date(val)),
    endDate: z.string()
      .datetime()
      .transform(val => new Date(val)),
    walletId: z.string().optional(),
    format: z.enum(['csv', 'pdf']).optional().default('csv')
  }).refine(
    (data) => {
      return data.startDate <= data.endDate;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"]
    }
  )
});