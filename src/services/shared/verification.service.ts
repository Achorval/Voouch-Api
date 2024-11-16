// src/services/shared/verification.service.ts
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../config/database';
import { users, tokens, currencies, categories } from '../../db/schema';
import { AppError, ErrorResponse } from '../../utilities/error';
import { EmailService } from './email.service';
// import { MessageService } from '../../services/shared/message.service'; 

export class VerificationService {
  
  static async sendEmailVerification(userId: string, email: string): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store verification token
    await db.insert(tokens).values({
      id: crypto.randomUUID(),
      userId,
      type: 'emailVerification',
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email
    await EmailService.sendVerificationEmail(email, token);
  }

  static async verifyEmail(token: string): Promise<void> {
    // Find token record
    const [tokenRecord] = await db
      .select()
      .from(tokens)
      .where(
        and(
          eq(tokens.token, token),
          eq(tokens.type, 'emailVerification'),
          eq(tokens.isUsed, false),
          eq(tokens.isRevoked, false)
        )
      )
      .limit(1);

    if (!tokenRecord) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new AppError('Verification token has expired', 400);
    }

    // Update user email verification status
    await db
      .update(users)
      .set({ 
        isEmailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, tokenRecord.userId));

    // Mark token as used
    await db
      .update(tokens)
      .set({ 
        isUsed: true,
        lastUsedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tokens.id, tokenRecord.id));
  }

  static async sendPhoneVerification(userId: string, phoneNumber: string): Promise<void> {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP token
    await db.insert(tokens).values({
      id: crypto.randomUUID(),
      userId,
      type: 'phoneVerification',
      token: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP via SMS
    // await MessageService.sendSMS(
    //   phoneNumber,
    //   `Your verification code is: ${otp}. Valid for 10 minutes.`
    // );
  }

  static async verifyPhone(userId: string, code: string): Promise<void> {
    // Find token record
    const [tokenRecord] = await db
      .select()
      .from(tokens)
      .where(
        and(
          eq(tokens.userId, userId),
          eq(tokens.token, code),
          eq(tokens.type, 'phoneVerification'),
          eq(tokens.isUsed, false),
          eq(tokens.isRevoked, false)
        )
      )
      .limit(1);

    if (!tokenRecord) {
      throw new AppError('Invalid verification code', 400);
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new AppError('Verification code has expired', 400);
    }

    // Update user phone verification status
    await db
      .update(users)
      .set({ 
        isPhoneVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Mark token as used
    await db
      .update(tokens)
      .set({ 
        isUsed: true,
        lastUsedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tokens.id, tokenRecord.id));
  }

  static async resendVerification(userId: string, type: 'email' | 'phone'): Promise<void> {
    // Get user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if already verified
    if (type === 'email' && user.isEmailVerified) {
      throw new AppError('Email is already verified', 400);
    }
    if (type === 'phone' && user.isPhoneVerified) {
      throw new AppError('Phone number is already verified', 400);
    }

    // Check for recent verification attempts
    const [recentToken] = await db
      .select()
      .from(tokens)
      .where(
        and(
          eq(tokens.userId, userId),
          eq(tokens.type, `${type}Verification`),
          eq(tokens.isUsed, false),
          eq(tokens.isRevoked, false)
        )
      )
      .limit(1);

    if (recentToken && recentToken.createdAt > new Date(Date.now() - 2 * 60 * 1000)) {
      throw new AppError('Please wait 2 minutes before requesting another verification', 429);
    }

    // Revoke any existing unused tokens
    if (recentToken) {
      await db
        .update(tokens)
        .set({ isRevoked: true })
        .where(eq(tokens.id, recentToken.id));
    }

    // Send new verification
    if (type === 'email') {
      await this.sendEmailVerification(userId, user.email);
    } else {
      await this.sendPhoneVerification(userId, user.phoneNumber);
    }
  }

  static async validateSystemConfiguration(): Promise<void> {
    const errors: string[] = [];
  
    // Check active currencies
    const [currencyCount] = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(currencies)
      .where(eq(currencies.isActive, true));
  
    if (!currencyCount?.count || currencyCount.count === 0) {
      errors.push('No active currencies configured');
    }
  
    // Check required categories
    const [categoryCount] = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(categories)
      .where(eq(categories.isEnabled, true));
  
    if (!categoryCount?.count || categoryCount.count === 0) {
      errors.push('No active categories configured');
    }
  
    // Add more configuration checks as needed
  
    if (errors.length > 0) {
      throw ErrorResponse.internal(`System configuration errors: ${errors.join(', ')}`);
    }
  }
}