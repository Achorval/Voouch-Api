// src/schemas/admin/service.schema.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    categoryId: z
      .string({
        required_error: 'Category is required',
        invalid_type_error: 'Category must be a string'
      })
      .min(1, 'Category ID is required'),
    name: z
      .string({
        required_error: 'Name is required',
        invalid_type_error: 'Name must be a string'
      })
      .min(2, 'Name must be at least 2 characters'),
    code: z
      .string({
        required_error: 'Code is required',
        invalid_type_error: 'Code must be a string'
      })
      .min(2, 'Code must be at least 2 characters')
      .max(50, 'Code cannot exceed 50 characters')
      .regex(/^[A-Z0-9_]+$/, 'Code must contain only uppercase letters, numbers and underscores'),
    description: z.string().optional(),
    minimumAmount: z.number().min(0).optional(),
    maximumAmount: z.number().min(0).optional(),
    displayOrder: z.number().min(0).optional(),
    metadata: z.record(z.any()).optional()
  }).refine(data => {
    if (data.minimumAmount && data.maximumAmount) {
      return data.maximumAmount >= data.minimumAmount;
    }
    return true;
  }, {
    message: "Maximum amount must be greater than minimum amount",
    path: ["maximumAmount"]
  })
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product ID is required')
  }),
  body: z.object({
    name: z
      .string({
        required_error: 'Name is required',
        invalid_type_error: 'Name must be a string'
      }).min(2, 'Name must be at least 2 characters').optional(),
    description: z.string().optional(),
    minimumAmount: z.number().min(0).optional(),
    maximumAmount: z.number().min(0).optional(),
    displayOrder: z.number().min(0).optional(),
    isEnabled: z.boolean().optional(),
    maintenanceMode: z.boolean().optional(),
    maintenanceMessage: z.string().optional(),
    maintenanceStartTime: z.string().datetime().optional(),
    maintenanceEndTime: z.string().datetime().optional(),
    metadata: z.record(z.any()).optional()
  }).refine(data => {
    if (data.minimumAmount && data.maximumAmount) {
      return data.maximumAmount >= data.minimumAmount;
    }
    return true;
  }, {
    message: "Maximum amount must be greater than minimum amount",
    path: ["maximumAmount"]
  })
});

export const maintenanceModeSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product ID is required')
  }),
  body: z.object({
    enabled: z.boolean(),
    message: z.string().optional(),
    endTime: z.string().datetime().optional()
  })
});