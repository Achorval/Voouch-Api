// src/schemas/admin/service.schema.ts
import { z } from 'zod';

export const createProviderSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    description: z.string().optional(),
    baseUrl: z.string().url('Base URL must be a valid URL').optional(),
    testBaseUrl: z.string().url('Test Base URL must be a valid URL').optional(),
    apiKey: z.string().optional(),
    secretKey: z.string().optional(),
    webhookSecret: z.string().optional(),
    isLive: z.boolean().optional(),
    isEnabled: z.boolean().optional()
  })
  // body: z.object({
  //   name: z.string({
  //     required_error: "Name is required",
  //     invalid_type_error: "Name must be a string"
  //   }).min(2, 'Name must be at least 2 characters'),
    
  //   code: z.string({
  //     required_error: "Code is required",
  //     invalid_type_error: "Code must be a string"
  //   })
  //     .min(2, 'Code must be at least 2 characters')
  //     .max(50, 'Code cannot exceed 50 characters')
  //     .regex(/^[A-Z0-9_]+$/, 'Code must contain only uppercase letters, numbers and underscores'),
    
  //   description: z.string({
  //     invalid_type_error: "Description must be a string"
  //   }).optional(),
    
  //   baseUrl: z.string({
  //     required_error: "Base URL is required",
  //     invalid_type_error: "Base URL must be a string"
  //   }).url('Base URL must be a valid URL'),
    
  //   testBaseUrl: z.string({
  //     invalid_type_error: "Test Base URL must be a string"
  //   }).url('Test Base URL must be a valid URL').optional(),
    
  //   apiKey: z.string({
  //     invalid_type_error: "API Key must be a string"
  //   }).optional(),
    
  //   secretKey: z.string({
  //     invalid_type_error: "Secret Key must be a string"
  //   }).optional(),
    
  //   webhookSecret: z.string({
  //     invalid_type_error: "Webhook Secret must be a string"
  //   }).optional(),
    
  //   isLive: z.boolean({
  //     required_error: "Live status is required",
  //     invalid_type_error: "Live status must be a boolean"
  //   })
  // })
});

export const updateProviderSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Provider ID is required')
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    description: z.string().optional(),
    baseUrl: z.string().url('Base URL must be a valid URL').optional(),
    testBaseUrl: z.string().url('Test Base URL must be a valid URL').optional(),
    apiKey: z.string().optional(),
    secretKey: z.string().optional(),
    webhookSecret: z.string().optional(),
    isLive: z.boolean().optional(),
    isEnabled: z.boolean().optional()
  })
});

export const configureProviderSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product ID is required'),
    providerId: z.string().min(1, 'Provider ID is required')
  }),
  body: z.object({
    providerProductCode: z.string().min(1, 'Provider product code is required'),
    priority: z.number().min(1),
    isDefault: z.boolean(),
    feeType: z.enum(['flat', 'percentage']),
    feeValue: z.number().min(0),
    minFee: z.number().min(0).optional(),
    maxFee: z.number().min(0).optional(),
    endpoints: z.record(z.any()).optional()
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