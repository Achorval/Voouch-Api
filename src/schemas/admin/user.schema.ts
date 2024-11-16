// src/schemas/admin/user.schema.ts
import { z } from 'zod';

const userRoles = ['user', 'admin', 'support'] as const;
const userTiers = ['basic', 'standard', 'premium'] as const;
const userStatuses = ['active', 'inactive', 'suspended', 'blocked'] as const;

export const createUserSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username is too long')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
    email: z
      .string()
      .email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name is too long'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name is too long'),
    phoneNumber: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    role: z
      .enum(userRoles)
      .optional(),
    tier: z
      .enum(userTiers)
      .optional()
  })
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required')
  }),
  body: z.object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name is too long')
      .optional(),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name is too long')
      .optional(),
    phoneNumber: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional(),
    gender: z
      .string()
      .nullable()
      .optional(),
    dateOfBirth: z
      .string()
      .datetime()
      .nullable()
      .optional(),
    address: z
      .string()
      .nullable()
      .optional(),
    city: z
      .string()
      .nullable()
      .optional(),
    lga: z
      .string()
      .nullable()
      .optional(),
    state: z
      .string()
      .nullable()
      .optional(),
    country: z
      .string()
      .nullable()
      .optional(),
    role: z
      .enum(userRoles)
      .optional(),
    tier: z
      .enum(userTiers)
      .optional(),
    canViewBalance: z
      .boolean()
      .optional(),
    kycLevel: z
      .number()
      .min(0)
      .max(3)
      .optional(),
    maxLoginAttempts: z
      .number()
      .min(1)
      .max(10)
      .optional(),
    lockoutDuration: z
      .number()
      .min(1)
      .max(1440) // max 24 hours in minutes
      .optional(),
    metadata: z
      .record(z.any())
      .nullable()
      .optional()
  })
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required')
  }),
  body: z.object({
    deleteType: z.enum(['soft', 'hard']).default('soft'),
    reason: z.string().optional()
  })
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    status: z.enum(['active', 'blocked', 'suspended', 'inactive'] as const).optional(),
    role: z.enum(['user', 'admin', 'super_admin'] as const).optional(),
    kycLevel: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    tierLevel: z.enum(['basic', 'silver', 'gold', 'platinum'] as const).optional(),
    search: z.string().optional(),
    isActive: z.string().optional().transform(val => val === 'true'),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc'] as const).optional(),
    startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    endDate: z.string().optional().transform(val => val ? new Date(val) : undefined)
  })
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required')
  }),
  body: z.object({
    status: z.enum(['active', 'blocked', 'suspended', 'inactive'] as const),
    reason: z.string().min(1, 'Reason is required'),
    duration: z.number().optional(),
    notifyUser: z.boolean().optional()
  })
});

export const resetSecuritySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required')
  }),
  body: z.object({
    password: z.boolean().optional(),
    pin: z.boolean().optional(),
    twoFactor: z.boolean().optional(),
    sessions: z.boolean().optional(),
    reason: z.string().min(1, 'Reason is required'),
    notifyUser: z.boolean().optional()
  }).refine(data => 
    data.password || data.pin || data.twoFactor || data.sessions,
    {
      message: 'At least one security option must be selected'
    }
  )
});

export const listKycSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    level: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    search: z.string().optional(),
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

export const reviewKycSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'KYC ID is required')
  }),
  body: z.object({
    status: z.enum(['approved', 'rejected'] as const),
    reason: z.string().optional()
      .transform(val => val || undefined)
      .pipe(
        z.string()
          .min(1, 'Reason is required for rejection')
          .optional()
      ),
    documents: z.record(z.object({
      status: z.enum(['approved', 'rejected'] as const),
      reason: z.string().optional()
    })).optional()
  }).refine(
    (data) => {
      if (data.status === 'rejected' && !data.reason) {
        return false;
      }
      return true;
    },
    {
      message: "Reason is required when rejecting KYC",
      path: ["reason"]
    }
  )
});

export const getDocumentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'KYC ID is required'),
    docId: z.string().min(1, 'Document ID is required')
  })
});