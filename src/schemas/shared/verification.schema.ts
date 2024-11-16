// src/schemas/verification.schema.ts
import { z } from 'zod';

export const emailVerificationSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token is required')
  })
});

export const phoneVerificationSchema = z.object({
  body: z.object({
    code: z.string()
      .length(6, 'Verification code must be 6 digits')
      .regex(/^\d+$/, 'Verification code must contain only numbers')
  })
});