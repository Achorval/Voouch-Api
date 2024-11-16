// src/schemas/admin/analytics.schema.ts
import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  query: z.object({
    startDate: z.string()
      .datetime()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    endDate: z.string()
      .datetime()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    providerId: z.string().optional(),
    categoryId: z.string().optional()
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

export const performanceQuerySchema = z.object({
  query: z.object({
    ...analyticsQuerySchema.shape,
    page: z.string()
      .optional()
      .transform(val => val ? parseInt(val) : 1),
    limit: z.string()
      .optional()
      .transform(val => val ? parseInt(val) : 10),
    minSuccessRate: z.string()
      .optional()
      .transform(val => val ? parseFloat(val) : undefined),
    sortBy: z.enum(['transactions', 'amount', 'successRate']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

export const exportReportSchema = z.object({
  query: z.object({
    ...analyticsQuerySchema.shape,
    type: z.enum(['dashboard', 'performance', 'users'])
  })
});