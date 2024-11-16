// src/services/user/profile.service.ts
import { eq } from "drizzle-orm";
import { db } from "../../config/database";
import { users, security } from "../../db/schema";
import { AppError } from "../../utilities/error";
// import { AuthUtils } from "../../utilities/auth";
// import {
//   FILE_SIZE_LIMITS,
//   FILE_TYPES,
//   formatBytes,
//   generateFileName,
//   validateMimeType,
// } from "../../utilities/upload";
// import { EmailService } from "../shared/email.service";
// import { UpdateProfileInput } from "../../types/user/profile.types";

export class ProfileService {
  static async getProfile(userId: string) {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,
        gender: users.gender,
        dateOfBirth: users.dateOfBirth,
        avatar: users.avatar,
        isEmailVerified: users.isEmailVerified,
        isPhoneVerified: users.isPhoneVerified,
        kycLevel: users.kycLevel,
        tierLevel: users.tierLevel,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const [securitySettings] = await db
      .select({
        twoFactorEnabled: security.twoFactorEnabled,
        twoFactorMethod: security.twoFactorMethod,
        canViewBalance: security.canViewBalance,
        isPinSet: security.isPinSet,
      })
      .from(security)
      .where(eq(security.userId, userId))
      .limit(1);

    return {
      ...user,
      security: securitySettings,
    };
  }

  // static async updateProfile(userId: string, data: UpdateProfileInput) {
  //   // Check if phone number is being changed
  //   if (data.phoneNumber) {
  //     const [existingUser] = await db
  //       .select()
  //       .from(users)
  //       .where(eq(users.phoneNumber, data.phoneNumber))
  //       .limit(1);

  //     if (existingUser && existingUser.id !== userId) {
  //       throw new AppError("Phone number is already in use", 400);
  //     }
  //   }

  //   const updateData = {
  //     ...(data.firstName && { firstName: data.firstName }),
  //     ...(data.lastName && { lastName: data.lastName }),
  //     ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
  //     ...(data.gender && {
  //       gender: data.gender as "male" | "female" | "other",
  //     }),
  //     ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
  //     updatedAt: new Date(),
  //   };

  //   // If phone number is changed, update verification status in a separate update
  //   if (data.phoneNumber) {
  //     await db
  //       .update(users)
  //       .set({ isPhoneVerified: false })
  //       .where(eq(users.id, userId));
  //   }

  //   // Update other user data
  //   await db.update(users).set(updateData).where(eq(users.id, userId));

  //   return this.getProfile(userId);
  // }

  // static async updateAvatar(
  //   userId: string,
  //   file: Express.Multer.File
  // ): Promise<string> {
  //   // Validate file type
  //   if (!validateMimeType(file.mimetype, FILE_TYPES.IMAGES)) {
  //     throw new AppError(
  //       `Invalid file type. Allowed types: ${FILE_TYPES.IMAGES.join(", ")}`,
  //       400
  //     );
  //   }

  //   // Validate file size
  //   if (file.size > FILE_SIZE_LIMITS.SMALL) {
  //     throw new AppError(
  //       `File too large. Maximum size allowed is ${formatBytes(FILE_SIZE_LIMITS.SMALL)}`,
  //       400
  //     );
  //   }

  //   // Generate unique filename
  //   const fileName = generateFileName(file.originalname, "avatar");

  //   // Create path for avatar
  //   const avatarPath = `/avatars/${fileName}`;

  //   // Update user's avatar path in database
  //   await db
  //     .update(users)
  //     .set({
  //       avatar: avatarPath,
  //       updatedAt: new Date(),
  //     })
  //     .where(eq(users.id, userId));

  //   return avatarPath;
  // }

  // static async changePassword(
  //   userId: string,
  //   currentPassword: string,
  //   newPassword: string
  // ) {
  //   const [user] = await db
  //     .select()
  //     .from(users)
  //     .where(eq(users.id, userId))
  //     .limit(1);

  //   if (!user) {
  //     throw new AppError("User not found", 404);
  //   }

  //   // Verify current password
  //   const isValid = await AuthUtils.verifyPassword(
  //     currentPassword,
  //     user.password
  //   );
  //   if (!isValid) {
  //     throw new AppError("Current password is incorrect", 400);
  //   }

  //   // Hash new password
  //   const { hash, salt } = await AuthUtils.hashPassword(newPassword);

  //   // Update password
  //   await db
  //     .update(users)
  //     .set({
  //       password: hash,
  //       passwordSalt: salt,
  //       updatedAt: new Date(),
  //     })
  //     .where(eq(users.id, userId));

  //   // Send password change notification
  //   await EmailService.sendPasswordChangeNotification(user.email);
  // }

  // static async updateSecurity(
  //   userId: string,
  //   data: {
  //     twoFactorEnabled?: boolean;
  //     twoFactorMethod?: "email" | "sms";
  //     canViewBalance?: boolean;
  //   }
  // ) {
  //   const [securitySettings] = await db
  //     .select()
  //     .from(security)
  //     .where(eq(security.userId, userId))
  //     .limit(1);

  //   if (!securitySettings) {
  //     throw new AppError("Security settings not found", 404);
  //   }

  //   // If enabling 2FA, verify the selected method
  //   if (data.twoFactorEnabled && data.twoFactorMethod) {
  //     const [user] = await db
  //       .select()
  //       .from(users)
  //       .where(eq(users.id, userId))
  //       .limit(1);

  //     if (!user) {
  //       throw new AppError("User not found", 404);
  //     }

  //     if (data.twoFactorMethod === "email" && !user.isEmailVerified) {
  //       throw new AppError("Email must be verified to use email 2FA", 400);
  //     }

  //     if (data.twoFactorMethod === "sms" && !user.isPhoneVerified) {
  //       throw new AppError("Phone number must be verified to use SMS 2FA", 400);
  //     }
  //   }

  //   // Update security settings
  //   await db
  //     .update(security)
  //     .set({
  //       ...data,
  //       updatedAt: new Date(),
  //     })
  //     .where(eq(security.userId, userId));

  //   return this.getProfile(userId);
  // }

  // static async setTransactionPin(userId: string, pin: string) {
  //   const [securitySettings] = await db
  //     .select()
  //     .from(security)
  //     .where(eq(security.userId, userId))
  //     .limit(1);

  //   if (!securitySettings) {
  //     throw new AppError("Security settings not found", 404);
  //   }

  //   if (securitySettings.isPinSet) {
  //     throw new AppError("Transaction PIN is already set", 400);
  //   }

  //   // Hash PIN
  //   const { hash: pinHash, salt: pinSalt } = await AuthUtils.hashPin(pin);

  //   // Update security settings
  //   await db
  //     .update(security)
  //     .set({
  //       transactionPin: pinHash,
  //       transactionPinSalt: pinSalt,
  //       isPinSet: true,
  //       lastPinChange: new Date(),
  //       updatedAt: new Date(),
  //     })
  //     .where(eq(security.userId, userId));
  // }

  // static async changeTransactionPin(
  //   userId: string,
  //   currentPin: string,
  //   newPin: string
  // ) {
  //   const [securitySettings] = await db
  //     .select()
  //     .from(security)
  //     .where(eq(security.userId, userId))
  //     .limit(1);

  //   if (!securitySettings) {
  //     throw new AppError("Security settings not found", 404);
  //   }

  //   if (!securitySettings.isPinSet) {
  //     throw new AppError("Transaction PIN is not set", 400);
  //   }

  //   // Verify current PIN
  //   const isValid = await AuthUtils.verifyPin(
  //     currentPin,
  //     securitySettings.transactionPin!
  //   );
  //   if (!isValid) {
  //     throw new AppError("Current PIN is incorrect", 400);
  //   }

  //   // Hash new PIN
  //   const { hash: pinHash, salt: pinSalt } = await AuthUtils.hashPin(newPin);

  //   // Update security settings
  //   await db
  //     .update(security)
  //     .set({
  //       transactionPin: pinHash,
  //       transactionPinSalt: pinSalt,
  //       lastPinChange: new Date(),
  //       updatedAt: new Date(),
  //     })
  //     .where(eq(security.userId, userId));
  // }
}
