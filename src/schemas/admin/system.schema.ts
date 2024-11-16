// src/schemas/admin/system.schema.ts
import { z } from 'zod';

export const tierLimitSchema = z.object({
  body: z.object({
    level: z.number().min(0, 'Level must be 0 or greater'),
    dailyLimit: z.number().min(0, 'Daily limit must be 0 or greater'),
    maximumBalance: z.number().min(0, 'Maximum balance must be 0 or greater'),
    requirements: z.record(z.any()).optional()
  })
});

export const updateTierLimitSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Tier limit ID is required')
  }),
  body: z.object({
    dailyLimit: z.number().min(0).optional(),
    maximumBalance: z.number().min(0).optional(),
    requirements: z.record(z.any()).optional()
  })
});

export const feeConfigSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    providerId: z.string().min(1, 'Provider ID is required')
  }),
  body: z.object({
    feeType: z.enum(['flat', 'percentage']),
    feeValue: z.number().min(0, 'Fee value must be 0 or greater'),
    minFee: z.number().min(0).optional(),
    maxFee: z.number().min(0).optional(),
    priority: z.number().min(1),
    isEnabled: z.boolean().optional(),
    isDefault: z.boolean().optional()
  }).refine(data => {
    if (data.minFee && data.maxFee) {
      return data.maxFee >= data.minFee;
    }
    return true;
  }, {
    message: "Maximum fee must be greater than minimum fee",
    path: ["maxFee"]
  })
});

export const auditLogQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    userId: z.string().optional(),
    type: z.string().optional(),
    source: z.string().optional(),
    startDate: z.string()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    endDate: z.string()
      .optional()
      .transform(val => val ? new Date(val) : undefined),
    search: z.string().optional()
  })
});

export const securitySettingsSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required')
  }),
  body: z.object({
    maxLoginAttempts: z.number().min(1).optional(),
    lockoutDuration: z.number().min(1).optional(),
    twoFactorEnabled: z.boolean().optional(),
    twoFactorMethod: z.enum(['email', 'sms']).optional()
  })
});

