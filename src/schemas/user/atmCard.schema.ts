// schemas/user/atmCard.schema.ts
import { z } from 'zod';

export const addCardSchema = z.object({
  body: z.object({
    cardNumber: z
      .string()
      .regex(/^\d{16}$/, 'Invalid card number format'),
    cardHolderName: z
      .string()
      .min(3, 'Card holder name must be at least 3 characters')
      .max(255, 'Card holder name is too long'),
    expiryMonth: z
      .string()
      .regex(/^(0[1-9]|1[0-2])$/, 'Invalid expiry month'),
    expiryYear: z
      .string()
      .regex(/^20[2-9]\d$/, 'Invalid expiry year'),
    cvv: z
      .string()
      .regex(/^\d{3,4}$/, 'Invalid CVV format'),
    setAsDefault: z.boolean().optional()
  }).refine((data) => {
    const today = new Date();
    const expiry = new Date(
      parseInt(data.expiryYear),
      parseInt(data.expiryMonth) - 1
    );
    return expiry > today;
  }, {
    message: 'Card has expired',
    path: ['expiryYear']
  })
});

export const updateCardSettingsSchema = z.object({
  params: z.object({
    cardId: z.string().min(1, 'Card ID is required')
  }),
  body: z.object({
    enableOnline: z.boolean().optional(),
    enableAtm: z.boolean().optional(),
    enablePos: z.boolean().optional(),
    dailyLimit: z.number()
      .positive('Daily limit must be greater than 0')
      .optional(),
    monthlyLimit: z.number()
      .positive('Monthly limit must be greater than 0')
      .optional(),
    allowInternational: z.boolean().optional()
  })
});

export const tokenizeCardSchema = z.object({
  body: z.object({
    cardId: z.string().min(1, 'Card ID is required'),
    pin: z.string()
      .length(6, 'PIN must be 6 digits')
      .regex(/^\d+$/, 'PIN must contain only numbers')
  })
});