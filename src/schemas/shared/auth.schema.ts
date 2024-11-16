// // src/schemas/shared/auth.schema.ts
// import { z } from 'zod';

// export const loginSchema = z.object({
//   body: z.object({
//     identifier: z
//       .string(),
//     password: z
//       .string()
//       .min(6, 'Password must be at least 6 characters')
//       .max(100, 'Password is too long'),
//   }),
//   query: z.object({}).optional(),
//   params: z.object({}).optional(),
// });

// export const registerSchema = z.object({
//   body: z.object({
//     email: z
//       .string()
//       .email('Invalid email address')
//       .min(1, 'Email is required'),
//     password: z
//       .string()
//       .min(6, 'Password must be at least 6 characters')
//       .max(100, 'Password is too long'),
//     firstName: z
//       .string()
//       .min(2, 'First name must be at least 2 characters')
//       .max(50, 'First name is too long'),
//     lastName: z
//       .string()
//       .min(2, 'Last name must be at least 2 characters')
//       .max(50, 'Last name is too long'),
//     phoneNumber: z
//       .string()
//       .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
//   }),
//   query: z.object({}).optional(),
//   params: z.object({}).optional(),
// });

// export const resetPasswordSchema = z.object({
//   body: z.object({
//     token: z.string().min(1, 'Token is required'),
//     password: z
//       .string()
//       .min(6, 'Password must be at least 6 characters')
//       .max(100, 'Password is too long'),
//     confirmPassword: z
//       .string()
//       .min(6, 'Password confirmation is required'),
//   })
//     .refine((data) => data.password === data.confirmPassword, {
//       message: "Passwords don't match",
//       path: ["confirmPassword"],
//     }),
//   query: z.object({}).optional(),
//   params: z.object({}).optional(),
// });

// export type LoginInput = z.infer<typeof loginSchema>['body'];
// export type RegisterInput = z.infer<typeof registerSchema>['body'];
// export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];


// src/schemas/auth.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    username: z
      .string({
        required_error: 'Username is required',
        invalid_type_error: 'Username must be a string'
      })
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username cannot exceed 50 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
    email: z
      .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string'
      })
      .email('Invalid email address')
      .max(255, 'Email cannot exceed 255 characters'),
    firstName: z
      .string({
        required_error: 'First name is required',
        invalid_type_error: 'First name must be a string'
      })
      .min(2, 'First name must be at least 2 characters')
      .max(255, 'First name cannot exceed 255 characters'),
    lastName: z
      .string({
        required_error: 'Last name is required',
        invalid_type_error: 'Last name must be a string'
      })
      .min(2, 'Last name must be at least 2 characters')
      .max(255, 'Last name cannot exceed 255 characters'),
    phoneNumber: z
      .string({
        required_error: 'Phone number is required',
        invalid_type_error: 'Phone number must be a string'
      })
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    password: z
      .string({
        required_error: 'Password is required',
        invalid_type_error: 'Password must be a string'
      })
      .min(8, 'Password must be at least 8 characters')
      .max(50, 'Password cannot exceed 50 characters')
      .refine(
        (value) => /[A-Z]/.test(value),
        'Password must contain at least one uppercase letter'
      )
      .refine(
        (value) => /[a-z]/.test(value),
        'Password must contain at least one lowercase letter'
      )
      .refine(
        (value) => /[0-9]/.test(value),
        'Password must contain at least one number'
      )
      .refine(
        (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
        'Password must contain at least one special character'
      ),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string({
        required_error: 'Username, email or phone number is required',
        invalid_type_error: 'Identifier must be a string'
      })
      .min(1, 'Username, email or phone number is required')
      .trim(),
    password: z
      .string({
        required_error: 'Password is required',
        invalid_type_error: 'Password must be a string'
      })
      .min(1, 'Password is required'),
    deviceInfo: z
      .object({
        deviceId: z.string().optional(),
        clientId: z.string().optional(),
        clientVersion: z.string().optional(),
      })
      .optional()
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string(),
  }),
});

export const verifyPhoneSchema = z.object({
  body: z.object({
    token: z.string(),
    phoneNumber: z.string(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
    allDevices: z.boolean().optional()
  })
});