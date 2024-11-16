// src/schemas/user/profile.schema.ts
import { z } from 'zod';
import { FILE_TYPES, FILE_SIZE_LIMITS } from '../../utilities/upload';

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(255, 'First name cannot exceed 255 characters')
      .optional(),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(255, 'Last name cannot exceed 255 characters')
      .optional(),
    phoneNumber: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional(),
    gender: z
      .enum(['male', 'female', 'other'])
      .optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
      .optional()
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        'Password must contain uppercase, lowercase, number and special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
});

export const updateSecuritySchema = z.object({
  body: z.object({
    twoFactorEnabled: z.boolean().optional(),
    twoFactorMethod: z.enum(['email', 'sms']).optional(),
    canViewBalance: z.boolean().optional(),
  })
});

export const setTransactionPinSchema = z.object({
  body: z.object({
    pin: z
      .string()
      .length(6, 'PIN must be 6 digits')
      .regex(/^\d+$/, 'PIN must contain only numbers'),
    confirmPin: z.string()
  }).refine((data) => data.pin === data.confirmPin, {
    message: "PINs don't match",
    path: ["confirmPin"]
  })
});

export const changeTransactionPinSchema = z.object({
  body: z.object({
    currentPin: z.string().length(6, 'Current PIN must be 6 digits'),
    newPin: z
      .string()
      .length(6, 'PIN must be 6 digits')
      .regex(/^\d+$/, 'PIN must contain only numbers'),
    confirmPin: z.string()
  }).refine((data) => data.newPin === data.confirmPin, {
    message: "PINs don't match",
    path: ["confirmPin"]
  })
});