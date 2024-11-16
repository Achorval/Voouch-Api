// src/utilities/auth.ts

import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import {
  TokenPayload,
  RefreshTokenPayload,
  AuthTokens,
} from "../types/common/auth.types";
import { ErrorResponse } from "./error";

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    // Generate salt and hash in one step
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    // bcrypt.compare will extract the salt from the hash
    return bcrypt.compare(password, hashedPassword);
  }

  static async hashPin(pin: string): Promise<{ hash: string; salt: string }> {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pin, salt);
    return { hash, salt };
  }

  static async verifyPin(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
  }
  
  static generateAuthTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(
      { userId: payload.id, tokenVersion: Date.now() },
      env.REFRESH_TOKEN_SECRET,
      { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  static async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      throw ErrorResponse.unauthorized("Invalid or expired access token");
    }
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
    } catch (error) {
      throw ErrorResponse.unauthorized("Invalid or expired refresh token");
    }
  }

  static extractTokenFromHeader(header?: string): string {
    if (!header) {
      throw ErrorResponse.unauthorized("Authorization header is missing");
    }
    
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      throw ErrorResponse.unauthorized("Invalid authorization header format");
    }

    return token;
  }

  static generateEmailVerificationToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "24h" });
  }

  static generatePasswordResetToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "1h" });
  }

  /**
   * Generate a secure temporary password
   * Format: Xxxx0000# (Uppercase, lowercase, numbers, special char)
   */
  static generateTempPassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';

    // Get random characters
    const firstChar = uppercase[Math.floor(Math.random() * uppercase.length)];
    const secondChar = lowercase[Math.floor(Math.random() * lowercase.length)];
    const thirdChar = lowercase[Math.floor(Math.random() * lowercase.length)];
    const fourthChar = lowercase[Math.floor(Math.random() * lowercase.length)];
    
    // Get 4 random numbers
    const numericPart = Array.from(
      { length: 4 }, 
      () => numbers[Math.floor(Math.random() * numbers.length)]
    ).join('');

    // Get random special character
    const specialChar = special[Math.floor(Math.random() * special.length)];

    // Combine all parts
    const tempPassword = `${firstChar}${secondChar}${thirdChar}${fourthChar}${numericPart}${specialChar}`;

    return tempPassword;
  }
  
}
