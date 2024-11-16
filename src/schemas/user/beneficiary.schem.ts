// schemas/user/beneficiary.schema.ts
import { z } from 'zod';
import { beneficiaryTypes } from '../../db/schema/beneficiaries';

export const addBeneficiarySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(beneficiaryTypes),
    identifier: z.string().min(1, 'Identifier is required'),
    details: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional()
  })
});

export const updateBeneficiarySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Beneficiary ID is required')
  }),
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    details: z.record(z.any()).optional(),
    isFrequent: z.boolean().optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.any()).optional()
  })
});