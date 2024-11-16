// // src/services/shared/auth.service.ts

// import { createId } from '@paralleldrive/cuid2';
// import bcrypt from 'bcryptjs';
// import { eq, and, or } from 'drizzle-orm';
// import { db } from '../../config/database';
// import { AppError } from '../../utilities/error';
// import { ErrorResponse } from '../../utilities/error';
// import { users, tokens } from '../../db/schema';
// import type { LoginCredentials, RegisterData, AuthTokens } from '../../types/common/auth.types';
// import { AuthUtils } from '../../utilities/auth';

// class AuthService {
//   static async register(data: RegisterData): Promise<{ user: any; tokens: AuthTokens }> {
//     // Check if user exists
//     const existingUser = await db
//       .select()
//       .from(users)
//       .where(
//         or(
//           eq(users.email, data.email),
//           eq(users.username, data.username)
//         )
//       )
//       .limit(1);

//     if (existingUser.length > 0) {
//       throw ErrorResponse.badRequest('Email or username already exists');
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const passwordHash = await bcrypt.hash(data.password, salt);

//     // Generate referral code
//     const referralCode = createId().slice(0, 8).toUpperCase();

//     // Create user
//     const userId = createId();
//     const newUser = {
//       id: userId,
//       email: data.email,
//       username: data.username,
//       password: passwordHash,
//       passwordSalt: salt,
//       firstName: data.firstName,
//       lastName: data.lastName,
//       phoneNumber: data.phoneNumber,
//       referralCode,
//       role: 'user' as const,
//       status: 'active' as const,
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };

//     await db.insert(users).values(newUser);

//     // Generate verification token
//     const verificationToken = AuthUtils.generateEmailVerificationToken(userId);
//     await db.insert(tokens).values({
//       id: createId(),
//       userId,
//       type: 'emailVerification',
//       token: verificationToken,
//       expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
//       createdAt: new Date(),
//       updatedAt: new Date()
//     });

//     // Generate auth tokens
//     const authTokens = AuthUtils.generateAuthTokens({
//       id: userId,
//       role: 'user',
//       email: data.email
//     });

//     // Return user data (excluding sensitive fields)
//     const { password: _, passwordSalt: __, ...userWithoutSensitiveData } = newUser;

//     return {
//       user: userWithoutSensitiveData,
//       tokens: authTokens
//     };
//   }

// static async login(credentials: LoginCredentials): Promise<AuthTokens> {
//   // Find user by email, username, or phone number
//   const [user] = await db
//     .select()
//     .from(users)
//     .where(
//       or(
//         eq(users.email, credentials.identifier),
//         eq(users.username, credentials.identifier),
//         eq(users.phoneNumber, credentials.identifier)
//       )
//     )
//     .limit(1);

//   if (!user) {
//     throw ErrorResponse.unauthorized('Invalid credentials');
//   }

//   // Check account status
//   if (user.status !== 'active') {
//     throw ErrorResponse.forbidden('Account is not active');
//   }

//   // Check lockout status
//   if (user.failedLoginAttempts >= user.maxLoginAttempts) {
//     const lockoutUntil = user.lockoutUntil ? new Date(user.lockoutUntil) : null;
//     if (lockoutUntil && lockoutUntil > new Date()) {
//       throw ErrorResponse.tooMany(
//         `Account is locked. Try again after ${lockoutUntil.toLocaleString()}`
//       );
//     }
//   }

//   // Verify password
//   const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

//   if (!isPasswordValid) {
//     // Increment failed attempts
//     const updatedAttempts = user.failedLoginAttempts + 1;
//     const shouldLockout = updatedAttempts >= user.maxLoginAttempts;

//     await db
//       .update(users)
//       .set({
//         failedLoginAttempts: updatedAttempts,
//         lockoutUntil: shouldLockout
//           ? new Date(Date.now() + user.lockoutDuration * 60 * 1000)
//           : user.lockoutUntil,
//         updatedAt: new Date()
//       })
//       .where(eq(users.id, user.id));

//     throw ErrorResponse.unauthorized('Invalid credentials');
//   }

//   // Reset failed attempts and update last login
//   await db
//     .update(users)
//     .set({
//       failedLoginAttempts: 0,
//       lastLogin: new Date(),
//       updatedAt: new Date()
//     })
//     .where(eq(users.id, user.id));

//   // Generate and return tokens
//   return AuthUtils.generateAuthTokens({
//     id: user.id,
//     role: user.role,
//     email: user.email
//   });
// }

//   static async verifyEmail(token: string): Promise<void> {
//     const [verificationRecord] = await db
//       .select()
//       .from(tokens)
//       .where(
//         and(
//           eq(tokens.token, token),
//           eq(tokens.type, 'emailVerification'),
//           eq(tokens.isUsed, false)
//         )
//       )
//       .limit(1);

//     if (!verificationRecord || new Date(verificationRecord.expiresAt) < new Date()) {
//       throw ErrorResponse.badRequest('Invalid or expired verification token');
//     }

//     // Update user and token in transaction
//     await db.transaction(async (tx) => {
//       await tx
//         .update(users)
//         .set({
//           isEmailVerified: true,
//           updatedAt: new Date()
//         })
//         .where(eq(users.id, verificationRecord.userId));

//       await tx
//         .update(tokens)
//         .set({
//           isUsed: true,
//           lastUsedAt: new Date(),
//           updatedAt: new Date()
//         })
//         .where(eq(tokens.id, verificationRecord.id));
//     });
//   }

//   static async requestPasswordReset(email: string): Promise<void> {
//     const [user] = await db
//       .select()
//       .from(users)
//       .where(eq(users.email, email))
//       .limit(1);

//     if (!user) {
//       // We still return 200 to prevent email enumeration
//       throw new AppError('If an account exists with this email, a password reset link will be sent', 200);
//     }

//     const resetToken = AuthUtils.generatePasswordResetToken(user.id);

//     await db
//       .insert(tokens)
//       .values({
//         id: createId(),
//         userId: user.id,
//         type: 'passwordReset',
//         token: resetToken,
//         expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
//         isUsed: false,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       });

//     // TODO: Send password reset email
//     // This would typically integrate with your email service
//   }

//   static async resetPassword(token: string, newPassword: string): Promise<void> {
//     const [resetRecord] = await db
//       .select()
//       .from(tokens)
//       .where(
//         and(
//           eq(tokens.token, token),
//           eq(tokens.type, 'passwordReset'),
//           eq(tokens.isUsed, false)
//         )
//       )
//       .limit(1);

//     if (!resetRecord || new Date(resetRecord.expiresAt) < new Date()) {
//       throw ErrorResponse.badRequest('Invalid or expired reset token');
//     }

//     const salt = await bcrypt.genSalt(10);
//     const passwordHash = await bcrypt.hash(newPassword, salt);

//     await db.transaction(async (tx) => {
//       // Update user's password
//       await tx
//         .update(users)
//         .set({
//           password: passwordHash,
//           passwordSalt: salt,
//           failedLoginAttempts: 0,
//           lastPasswordChange: new Date(),
//           updatedAt: new Date()
//         })
//         .where(eq(users.id, resetRecord.userId));

//       // Mark token as used
//       await tx
//         .update(tokens)
//         .set({
//           isUsed: true,
//           lastUsedAt: new Date(),
//           updatedAt: new Date()
//         })
//         .where(eq(tokens.id, resetRecord.id));
//     });
//   }

//   static async refreshToken(refreshToken: string): Promise<AuthTokens> {
//     const decoded = AuthUtils.verifyRefreshToken(refreshToken);

//     const [user] = await db
//       .select()
//       .from(users)
//       .where(
//         and(
//           eq(users.id, decoded.userId),
//           eq(users.status, 'active')
//         )
//       )
//       .limit(1);

//     if (!user) {
//       throw ErrorResponse.unauthorized('Invalid refresh token');
//     }

//     return AuthUtils.generateAuthTokens({
//       id: user.id,
//       role: user.role,
//       email: user.email
//     });
//   }

//   static async logout(userId: string): Promise<void> {
//     await db
//       .update(users)
//       .set({
//         lastActiveAt: new Date(),
//         updatedAt: new Date()
//       })
//       .where(eq(users.id, userId));
//   }

// }

// export default AuthService;

// src/services/shared/auth.service.ts
import crypto from "crypto";
import { and, eq, or } from "drizzle-orm";
import { db } from "../../config/database";
import { users, tokens, loginAttempts, security } from "../../db/schema";
import {
  RegisterInput,
  LoginInput,
  AuthResponse,
} from "../../types/common/auth.types";
import { AppError, ErrorResponse } from "../../utilities/error";
import { EmailService } from "./email.service";
import { AuthUtils } from "../../utilities/auth";
import { WalletService } from "../user/wallet.service";
import { VerificationService } from "./verification.service";
// import { sendVerificationEmail } from './email.service';

export class AuthService {
  private static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Check if username exists
   */
  private static async isUsernameExists(username: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return !!user;
  }

  /**
   * Check if email exists
   */
  private static async isEmailExists(email: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    return !!user;
  }

  /**
   * Check if phone number exists
   */
  private static async isPhoneNumberExists(phoneNumber: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber))
      .limit(1);

    return !!user;
  }

  // Alternative approach using a single validation function
  private static async validateUserFields(data: {
    username: string;
    email: string;
    phoneNumber: string;
  }): Promise<void> {
    const [usernameExists, emailExists, phoneExists] = await Promise.all([
      this.isUsernameExists(data.username),
      this.isEmailExists(data.email),
      this.isPhoneNumberExists(data.phoneNumber)
    ]);

    if (usernameExists) {
      throw ErrorResponse.conflict('Username is already taken');
    }

    if (emailExists) {
      throw ErrorResponse.conflict('Email address is already registered');
    }

    if (phoneExists) {
      throw ErrorResponse.conflict('Phone number is already registered');
    }
  }

  static async register(input: RegisterInput): Promise<AuthResponse> {
    // First validate if system is properly configured
    // await VerificationService.validateSystemConfiguration();

    // Validate user fields
    await this.validateUserFields({
      username: input.username,
      email: input.email,
      phoneNumber: input.phoneNumber
    });

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(input.password);

    // Create user
    await db.insert(users).values({
      username: input.username,
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      role: "user",
      status: "active",
      kycLevel: 0,
      tierLevel: "basic",
    });

    // Get created user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email));

    if (!user) {
      throw new AppError("Error creating user", 500);
    }

    // Create wallets for all active currencies
    try {
      await WalletService.createUserWallets(user.id);
    } catch (error) {
      // If wallet creation fails, rollback the entire transaction
      throw ErrorResponse.internal("Failed to setup user wallets");
    }

    // Initialize security settings
    await db.insert(security).values({
      userId: user.id,
      maxLoginAttempts: 3,
      lockoutDuration: 30,
    });

    // Generate verification token
    const verificationToken = this.generateVerificationToken();
    await db.insert(tokens).values({
      userId: user.id,
      type: "emailVerification",
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email
    // await sendVerificationEmail(user.email, verificationToken);

    // Generate auth token
    const { accessToken } = AuthUtils.generateAuthTokens({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        isEmailVerified: Boolean(user.isEmailVerified),
        isPhoneVerified: Boolean(user.isPhoneVerified),
        kycLevel: user.kycLevel,
        tierLevel: user.tierLevel,
      },
      accessToken,
    };
  }

  static async login(input: LoginInput): Promise<AuthResponse> {
    // Find user by email, username, or phone number
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, input.identifier),
          eq(users.username, input.identifier),
          eq(users.phoneNumber, input.identifier)
        )
      )
      .limit(1);

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // Check if account is locked
    const [loginAttempt] = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.userId, user.id))
      .limit(1);

    if (loginAttempt?.lockoutUntil && loginAttempt.lockoutUntil > new Date()) {
      throw new AppError("Account is locked. Please try again later", 403);
    }

    // Verify password
    const isValid = await AuthUtils.verifyPassword(
      input.password,
      user.password
    );

    if (!isValid) {
      // Update failed login attempts
      await this.handleFailedLogin(user.id);
      throw new AppError("Invalid credentials", 401);
    }

    // Reset login attempts on successful login
    if (loginAttempt) {
      await db
        .update(loginAttempts)
        .set({
          failedLoginAttempts: 0,
          lastLogin: new Date(),
          lastActiveAt: new Date(),
        })
        .where(eq(loginAttempts.userId, user.id));
    } else {
      await db.insert(loginAttempts).values({
        userId: user.id,
        lastLogin: new Date(),
        lastActiveAt: new Date(),
      });
    }

    // Generate auth token
    const { accessToken } = AuthUtils.generateAuthTokens({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        isEmailVerified: Boolean(user.isEmailVerified),
        isPhoneVerified: Boolean(user.isPhoneVerified),
        kycLevel: user.kycLevel,
        tierLevel: user.tierLevel,
      },
      accessToken,
    };
  }

  private static async handleFailedLogin(userId: string): Promise<void> {
    const [securitySettings] = await db
      .select()
      .from(security)
      .where(eq(security.userId, userId))
      .limit(1);

    const [loginAttempt] = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.userId, userId))
      .limit(1);

    if (!loginAttempt) {
      await db.insert(loginAttempts).values({
        userId,
        failedLoginAttempts: 1,
        lastFailedLogin: new Date(),
      });
      return;
    }

    const attempts = loginAttempt.failedLoginAttempts + 1;
    if (attempts >= (securitySettings?.maxLoginAttempts || 3)) {
      await db
        .update(loginAttempts)
        .set({
          failedLoginAttempts: attempts,
          lastFailedLogin: new Date(),
          lockoutUntil: new Date(
            Date.now() + (securitySettings?.lockoutDuration || 30) * 60 * 1000
          ),
        })
        .where(eq(loginAttempts.userId, userId));
    } else {
      await db
        .update(loginAttempts)
        .set({
          failedLoginAttempts: attempts,
          lastFailedLogin: new Date(),
        })
        .where(eq(loginAttempts.userId, userId));
    }
  }

  static async forgotPassword(email: string): Promise<void> {
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Don't reveal whether email exists or not
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store reset token
    await db.insert(tokens).values({
      userId: user.id,
      type: "passwordReset",
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // Send reset email
    await EmailService.sendPasswordResetEmail(user.email, resetToken);
  }

  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<void> {
    // Find valid token
    const [tokenRecord] = await db
      .select()
      .from(tokens)
      .where(
        and(
          eq(tokens.token, token),
          eq(tokens.type, "passwordReset"),
          eq(tokens.isUsed, false),
          eq(tokens.isRevoked, false)
        )
      )
      .limit(1);

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenRecord.userId))
      .limit(1);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Hash new password
    const hashedPassword = await AuthUtils.hashPassword(newPassword);

    // Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Mark token as used
    await db
      .update(tokens)
      .set({
        isUsed: true,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tokens.id, tokenRecord.id));

    // Revoke all refresh tokens for security
    await db
      .update(tokens)
      .set({
        isRevoked: true,
        updatedAt: new Date(),
      })
      .where(and(eq(tokens.userId, user.id), eq(tokens.type, "refreshToken")));
  }

  static async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Find token record
    const [tokenRecord] = await db
      .select()
      .from(tokens)
      .where(
        and(
          eq(tokens.token, refreshToken),
          eq(tokens.type, "refreshToken"),
          eq(tokens.isUsed, false),
          eq(tokens.isRevoked, false)
        )
      )
      .limit(1);

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenRecord.userId))
      .limit(1);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Generate new tokens
    const newTokens = AuthUtils.generateAuthTokens({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    // Store new refresh token
    await db.insert(tokens).values({
      userId: user.id,
      type: "refreshToken",
      token: newTokens.refreshToken,
      device: tokenRecord.device,
      ipAddress: tokenRecord.ipAddress,
      userAgent: tokenRecord.userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Mark old token as used
    await db
      .update(tokens)
      .set({
        isUsed: true,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tokens.id, tokenRecord.id));

    return newTokens;
  }

  static async logout(
    userId: string,
    options: { refreshToken?: string; allDevices?: boolean } = {}
  ): Promise<void> {
    if (options.allDevices) {
      // Revoke all refresh tokens for user
      await db
        .update(tokens)
        .set({
          isRevoked: true,
          updatedAt: new Date(),
        })
        .where(and(eq(tokens.userId, userId), eq(tokens.type, "refreshToken")));
    } else if (options.refreshToken) {
      // Revoke specific refresh token
      await db
        .update(tokens)
        .set({
          isRevoked: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tokens.token, options.refreshToken),
            eq(tokens.type, "refreshToken")
          )
        );
    }
  }
}
