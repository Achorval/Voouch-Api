// // src/services/admin/user.service.ts
// import { and, eq, like, or, desc, asc, sql, type SQL, type AnyColumn, between } from 'drizzle-orm';
// import { db } from '../../config/database';
// import { users, kycs, tokens, statusChangeLogs, security, auditLogs } from '../../db/schema';
// import { ErrorResponse } from '../../utilities/error';
// import { AuthUtils } from '../../utilities/auth';
// import type {
//   User,
//   CreateUserDTO,
//   UpdateUserDTO,
//   UpdateUserStatusDTO,
//   UserListOptions,
//   UserListResponse,
//   UserRole,
//   UserStatus,
//   UserTier,
//   UserStats,
//   DeleteType,
//   DeleteUserDTO,
//   AdminActionInput,
//   UserSecurityReset
// } from '../../types/admin/user.types';
// import { EmailService } from '../shared/emails.service';

// export class UserService {
//   private static sanitizeUser(dbUser: any): User {
//     // First remove sensitive data
//     const {
//       password,
//       passwordSalt,
//       transactionPin,
//       pinSalt,
//       ...userWithoutSensitiveData
//     } = dbUser;

//     // Convert types and return clean user object
//     return {
//       ...userWithoutSensitiveData,
//       // Convert string numbers to actual numbers
//       totalReferralEarnings: userWithoutSensitiveData.totalReferralEarnings ?
//         Number(userWithoutSensitiveData.totalReferralEarnings) : 0,
//       referralCount: Number(userWithoutSensitiveData.referralCount || 0),
//       kycLevel: Number(userWithoutSensitiveData.kycLevel || 0),
//       failedLoginAttempts: Number(userWithoutSensitiveData.failedLoginAttempts || 0),
//       maxLoginAttempts: Number(userWithoutSensitiveData.maxLoginAttempts || 3),
//       currentLoginAttempts: Number(userWithoutSensitiveData.currentLoginAttempts || 0),
//       lockoutDuration: Number(userWithoutSensitiveData.lockoutDuration || 30),

//       // Convert dates
//       dateOfBirth: userWithoutSensitiveData.dateOfBirth ?
//         new Date(userWithoutSensitiveData.dateOfBirth) : null,
//       lastLogin: userWithoutSensitiveData.lastLogin ?
//         new Date(userWithoutSensitiveData.lastLogin) : null,
//       lastFailedLogin: userWithoutSensitiveData.lastFailedLogin ?
//         new Date(userWithoutSensitiveData.lastFailedLogin) : null,
//       lockoutUntil: userWithoutSensitiveData.lockoutUntil ?
//         new Date(userWithoutSensitiveData.lockoutUntil) : null,
//       lastPasswordChange: userWithoutSensitiveData.lastPasswordChange ?
//         new Date(userWithoutSensitiveData.lastPasswordChange) : null,
//       lastPinChange: userWithoutSensitiveData.lastPinChange ?
//         new Date(userWithoutSensitiveData.lastPinChange) : null,
//       statusChangedAt: userWithoutSensitiveData.statusChangedAt ?
//         new Date(userWithoutSensitiveData.statusChangedAt) : null,
//       suspensionEndAt: userWithoutSensitiveData.suspensionEndAt ?
//         new Date(userWithoutSensitiveData.suspensionEndAt) : null,
//       lastActiveAt: userWithoutSensitiveData.lastActiveAt ?
//         new Date(userWithoutSensitiveData.lastActiveAt) : null,
//       deactivatedAt: userWithoutSensitiveData.deactivatedAt ?
//         new Date(userWithoutSensitiveData.deactivatedAt) : null,
//       createdAt: new Date(userWithoutSensitiveData.createdAt),
//       updatedAt: new Date(userWithoutSensitiveData.updatedAt),
//       deletedAt: userWithoutSensitiveData.deletedAt ?
//         new Date(userWithoutSensitiveData.deletedAt) : null,

//       // Convert booleans (if they might be coming as 0/1 from database)
//       isActive: Boolean(userWithoutSensitiveData.isActive),
//       isEmailVerified: Boolean(userWithoutSensitiveData.isEmailVerified),
//       isPhoneVerified: Boolean(userWithoutSensitiveData.isPhoneVerified),
//       isPinSet: Boolean(userWithoutSensitiveData.isPinSet),
//       canViewBalance: Boolean(userWithoutSensitiveData.canViewBalance),
//       twoFactorEnabled: Boolean(userWithoutSensitiveData.twoFactorEnabled),
//     } as User;
//   }

//   static async createUser(data: CreateUserDTO): Promise<User> {
//     // Check if user exists
//     const existingUser = await db
//     .select()
//     .from(users)
//     .where(
//       or(
//         eq(users.email, data.email.toLowerCase()),
//         eq(users.username, data.username),
//         eq(users.phoneNumber, data.phoneNumber)
//       )
//     )
//     .limit(1);

//     if (existingUser.length > 0) {
//       throw ErrorResponse.conflict('User with this email or username already exists');
//     }

//     try {
//        // Hash password
//        const { hash: passwordHash, salt: passwordSalted } = await AuthUtils.hashPassword(data.password);

//       // Start a transaction
//       const result = await db.transaction(async (trx) => {
//         // Insert user
//         await trx
//         .insert(users)
//         .values({
//           username: data.username,
//           email: data.email,
//           password: passwordHash,
//           passwordSalt: passwordSalted,
//           firstName: data.firstName,
//           lastName: data.lastName,
//           phoneNumber: data.phoneNumber,
//           role: data.role || 'user',
//           tier: data.tier || 'basic'
//         });

//         // Retrieve the new user based on unique fields (email or username)
//         const [newUser] = await trx
//           .select()
//           .from(users)
//           .where(
//             or(
//               eq(users.email, data.email),
//               eq(users.username, data.username)
//             )
//           )
//           .limit(1);

//         if (!newUser) {
//           throw ErrorResponse.internal('User not found after insertion');
//         }

//         return newUser;
//       })

//       // Sanitize and return the user
//       return this.sanitizeUser(result);
//     } catch (error) {
//       console.error('Create user error:', error);
//       throw ErrorResponse.internal('Failed to create user');
//     }
//   }



//   static async updateUserStatus(
//     id: string,
//     data: UpdateUserStatusDTO,
//     adminId: string
//   ): Promise<User> {
//     // Check if user exists
//     const [existingUser] = await db
//       .select()
//       .from(users)
//       .where(eq(users.id, id))
//       .limit(1);

//     if (!existingUser) {
//       throw ErrorResponse.notFound('User not found');
//     }

//     try {
//       // Begin transaction
//       const result = await db.transaction(async (tx) => {
//         // Update user status
//         await tx
//           .update(users)
//           .set({
//             status: data.status,
//             statusReason: data.reason || null,
//             statusNote: data.note || null,
//             statusChangedAt: new Date(),
//             statusChangedBy: adminId,
//             suspensionEndAt: data.suspensionEndAt || null,
//             updatedAt: new Date()
//           })
//           .where(eq(users.id, id));

//         // Create status changelog
//         await tx
//           .insert(statusChangeLogs)
//           .values({
//             userId: id,
//             status: data.status,
//             previousStatus: existingUser.status,
//             reason: data.reason || null,
//             note: data.note || null,
//             changedBy: adminId,
//             expiresAt: data.suspensionEndAt || null,
//             createdAt: new Date()
//           });

//         // Fetch updated user
//         const [updatedUserStatus] = await db
//           .select()
//           .from(users)
//           .where(eq(users.id, id))
//           .limit(1);

//         if (!updatedUserStatus) {
//           throw new Error('Failed to retrieve updated  user status');
//         }

//         return updatedUserStatus;
//       });

//       // Sanitize and return the user
//       return this.sanitizeUser(result);

//     } catch (error) {
//       throw ErrorResponse.internal('Failed to update user status');
//     }
//   }

//   // Define valid sort columns
//   private static readonly validSortColumns = {
//     createdAt: users.createdAt,
//     updatedAt: users.updatedAt,
//     username: users.username,
//     email: users.email,
//     firstName: users.firstName,
//     lastName: users.lastName,
//     status: users.status,
//     role: users.role,
//     tierLevel: users.tierLevel,
//     kycLevel: users.kycLevel
//   } as const;

//   private static getOrderByExpression(sortBy: string, sortOrder: 'asc' | 'desc'): SQL {
//     const column = this.validSortColumns[sortBy as keyof typeof this.validSortColumns];
//     if (!column) {
//       throw ErrorResponse.badRequest(`Invalid sort field: ${sortBy}`);
//     }
//     return sortOrder === 'desc' ? desc(column) : asc(column);
//   }

//   static async listUsers(options: UserListOptions): Promise<UserListResponse> {
//     const {
//       page = 1,
//       limit = 10,
//       status,
//       role,
//       tier,
//       kycLevel,
//       search,
//       sortBy = 'createdAt',
//       sortOrder = 'desc',
//       startDate,
//       endDate,
//       isActive
//     } = options;

//     const offset = (page - 1) * limit;
//     const conditions = [];

//     // Build filter conditions
//     if (status) conditions.push(eq(users.status, status));
//     if (role) conditions.push(eq(users.role, role));
//     if (tier) conditions.push(eq(users.tierLevel, tier));
//     if (kycLevel !== undefined) conditions.push(eq(users.kycLevel, kycLevel));
//     if (isActive !== undefined) conditions.push(eq(users.isActive, isActive));
//     if (startDate && endDate) {
//       conditions.push(between(users.createdAt, startDate, endDate));
//     }

//     // Search condition
//     if (search) {
//       conditions.push(
//         or(
//           like(users.email, `%${search}%`),
//           like(users.username, `%${search}%`),
//           like(users.firstName, `%${search}%`),
//           like(users.lastName, `%${search}%`),
//           like(users.phoneNumber, `%${search}%`)
//         )
//       );
//     }

//     const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
//     const orderBy = this.getOrderByClause(sortBy, sortOrder);

//     // Get total count
//     const [countResult] = await db
//       .select({
//         count: sql<number>`count(*)`
//       })
//       .from(users)
//       .where(whereClause);

//     // Get users with basic details
//     const results = await db
//       .select({
//         id: users.id,
//         username: users.username,
//         email: users.email,
//         firstName: users.firstName,
//         lastName: users.lastName,
//         phoneNumber: users.phoneNumber,
//         status: users.status,
//         role: users.role,
//         tierLevel: users.tierLevel,
//         kycLevel: users.kycLevel,
//         isEmailVerified: users.isEmailVerified,
//         isPhoneVerified: users.isPhoneVerified,
//         lastLogin: loginAttempts.lastLogin,
//         createdAt: users.createdAt
//       })
//       .from(users)
//       .leftJoin(loginAttempts, eq(users.id, loginAttempts.userId))
//       .where(whereClause)
//       .orderBy(orderBy)
//       .limit(limit)
//       .offset(offset);

//     const total = Number(countResult?.count || 0);

//     return {
//       users: results,
//       meta: {
//         total,
//         pages: Math.ceil(total / limit),
//         currentPage: page
//       }
//     };
//   }

//   static async getUserDetails(userId: string) {
//     // Get user with all related information
//     const [user] = await db
//       .select()
//       .from(users)
//       .where(eq(users.id, userId))
//       .limit(1);

//     if (!user) {
//       throw ErrorResponse.notFound('User not found');
//     }

//     // Get KYC information
//     const kycInfo = await db
//       .select()
//       .from(kycs)
//       .where(eq(kycs.userId, userId))
//       .orderBy(desc(kycs.createdAt))
//       .limit(1);

//     // Get recent actions
//     const recentActions = await db
//       .select()
//       .from(auditLogs)
//       .where(eq(auditLogs.userId, userId))
//       .orderBy(desc(auditLogs.createdAt))
//       .limit(10);

//     // Get security settings
//     const [securitySettings] = await db
//       .select()
//       .from(security)
//       .where(eq(security.userId, userId))
//       .limit(1);

//     return {
//       ...user,
//       kyc: kycInfo[0] || null,
//       recentActions,
//       security: securitySettings
//     };
//   }



//   static async getUserStats(): Promise<UserStats> {
//     // Get basic user counts
//     const [userCounts] = await db
//       .select({
//         totalUsers: sql<number>`count(*)`,
//         activeUsers: sql<number>`sum(case when status = 'active' then 1 else 0 end)`,
//         inactiveUsers: sql<number>`sum(case when status = 'inactive' then 1 else 0 end)`,
//         suspendedUsers: sql<number>`sum(case when status = 'suspended' then 1 else 0 end)`,
//         blockedUsers: sql<number>`sum(case when status = 'blocked' then 1 else 0 end)`,
//         verifiedUsers: sql<number>`sum(case when "isEmailVerified" = true then 1 else 0 end)`,
//         unverifiedUsers: sql<number>`sum(case when "isEmailVerified" = false then 1 else 0 end)`
//       })
//       .from(users);

//     // Get KYC level distribution
//     const kycLevels = await db
//       .select({
//         level: users.kycLevel,
//         count: sql<number>`count(*)`
//       })
//       .from(users)
//       .groupBy(users.kycLevel);

//     // Get recent signups (last 7 days)
//     const [recentSignups] = await db
//       .select({
//         count: sql<number>`count(*)`
//       })
//       .from(users)
//       .where(
//         sql`"createdAt" >= NOW() - INTERVAL '7 days'`
//       );

//     // Get recent logins (last 24 hours)
//     const [recentLogins] = await db
//       .select({
//         count: sql<number>`count(*)`
//       })
//       .from(users)
//       .where(
//         sql`"lastLogin" >= NOW() - INTERVAL '24 hours'`
//       );

//     return {
//       ...userCounts,
//       kycLevels: kycLevels.map(({ level, count }) => ({ level, count })),
//       recentSignups: recentSignups.count,
//       recentLogins: recentLogins.count
//     };
//   }





//   static async performUserAction(
//     userId: string,
//     adminId: string,
//     input: AdminActionInput
//   ) {
//     const [user] = await db
//       .select()
//       .from(users)
//       .where(eq(users.id, userId))
//       .limit(1);

//     if (!user) {
//       throw ErrorResponse.notFound('User not found');
//     }

//     await db.transaction(async (trx) => {
//       // Update user status
//       await trx
//         .update(users)
//         .set({
//           status: this.getStatusForAction(input.action),
//           updatedAt: new Date()
//         })
//         .where(eq(users.id, userId));

//       // Log action
//       await trx
//         .insert(auditLogs)
//         .values({
//           id: crypto.randomUUID(),
//           userId,
//           adminId,
//           action: input.action,
//           reason: input.reason,
//           metadata: input.metadata || {},
//           createdAt: new Date()
//         });

//       // Handle suspension duration
//       if (input.action === 'suspend' && input.duration) {
//         const suspensionEnd = new Date();
//         suspensionEnd.setHours(suspensionEnd.getHours() + input.duration);

//         await trx
//           .update(users)
//           .set({
//             suspensionEndAt: suspensionEnd
//           })
//           .where(eq(users.id, userId));
//       }
//     });

//     // Send notification to user
//     await this.sendUserActionNotification(user.email, input);
//   }

//   static async resetUserSecurity(
//     userId: string,
//     adminId: string,
//     options: UserSecurityReset
//   ) {
//     const [user] = await db
//       .select()
//       .from(users)
//       .where(eq(users.id, userId))
//       .limit(1);

//     if (!user) {
//       throw ErrorResponse.notFound('User not found');
//     }

//     await db.transaction(async (trx) => {
//       if (options.password) {
//         const tempPassword = AuthUtils.generateTempPassword();
//         const { hash, salt } = await AuthUtils.hashPassword(tempPassword);

//         await trx
//           .update(users)
//           .set({
//             password: hash,
//             passwordSalt: salt,
//             updatedAt: new Date()
//           })
//           .where(eq(users.id, userId));

//         // Send temporary password to user
//         await EmailService.sendPasswordResetEmail(user.email, tempPassword);
//       }

//       if (options.pin) {
//         await trx
//           .update(security)
//           .set({
//             transactionPin: null,
//             transactionPinSalt: null,
//             isPinSet: false,
//             updatedAt: new Date()
//           })
//           .where(eq(security.userId, userId));
//       }

//       if (options.twoFactor) {
//         await trx
//           .update(security)
//           .set({
//             twoFactorEnabled: false,
//             twoFactorSecret: null,
//             updatedAt: new Date()
//           })
//           .where(eq(security.userId, userId));
//       }

//       if (options.deviceSessions) {
//         // Revoke all refresh tokens
//         await trx
//           .update(tokens)
//           .set({
//             isRevoked: true,
//             updatedAt: new Date()
//           })
//           .where(
//             and(
//               eq('userId', userId),
//               eq('type', 'refresh_token')
//             )
//           );
//       }

//       // Log action
//       await trx
//         .insert(auditLogs)
//         .values({
//           id: crypto.randomUUID(),
//           userId,
//           adminId,
//           action: 'securityReset',
//           reason: 'Admin initiated security reset',
//           metadata: options,
//           createdAt: new Date()
//         });
//     });
//   }

//   private static getOrderByClause(sortBy: string, sortOrder: 'asc' | 'desc') {
//     const column = this.getColumnForSort(sortBy);
//     return sortOrder === 'desc' ? desc(column) : asc(column);
//   }

//   private static getColumnForSort(sortBy: string) {
//     const columns: Record<string, any> = {
//       createdAt: users.createdAt,
//       username: users.username,
//       email: users.email,
//       status: users.status,
//       kycLevel: users.kycLevel
//     };
//     return columns[sortBy] || users.createdAt;
//   }

//   private static getStatusForAction(action: string): UserStatus {
//     switch (action) {
//       case 'block': return 'blocked';
//       case 'unblock': return 'active';
//       case 'suspend': return 'suspended';
//       default: throw new Error('Invalid action');
//     }
//   }






// src/services/admin/user.service.ts
import { and, eq, like, or, desc, asc, sql, count, between, SQL } from "drizzle-orm";
import { db } from "../../config/database";
import {
  users,
  kycs,
  security,
  loginAttempts,
  auditLogs,
  statusHistory,
  transactions,
  supportTickets,
  atmCards,
  tokens,
} from "../..//db/schema";
import { ErrorResponse } from "../../utilities/error";
import { EmailService } from "../shared/email.service";
import type {
  UserListQueryParams,
  UserListResponse,
  UpdateUserStatusDTO,
  SecurityResetOptions,
  UpdateUserPermissionsDto,
  AdminActionResponse,
  KycLevel,
  User,
  CreateUserDTO,
  UserStatus,
  DeleteUserDTO,
  UpdateUserDTO,
  KycReviewAction,
  KycVerificationRequest,
  KycListQueryParams,
  KycListResponse,
} from "../../types/admin/user.types";
import { AuthUtils } from "../../utilities/auth";

export class UserService {
  private static sanitizeUser(dbUser: any): User {
    // First remove sensitive data
    const {
      password,
      passwordSalt,
      transactionPin,
      pinSalt,
      ...userWithoutSensitiveData
    } = dbUser;

    // Convert types and return clean user object
    return {
      ...userWithoutSensitiveData,
      // Convert string numbers to actual numbers
      totalReferralEarnings: userWithoutSensitiveData.totalReferralEarnings ?
        Number(userWithoutSensitiveData.totalReferralEarnings) : 0,
      referralCount: Number(userWithoutSensitiveData.referralCount || 0),
      kycLevel: Number(userWithoutSensitiveData.kycLevel || 0),
      failedLoginAttempts: Number(userWithoutSensitiveData.failedLoginAttempts || 0),
      maxLoginAttempts: Number(userWithoutSensitiveData.maxLoginAttempts || 3),
      currentLoginAttempts: Number(userWithoutSensitiveData.currentLoginAttempts || 0),
      lockoutDuration: Number(userWithoutSensitiveData.lockoutDuration || 30),

      // Convert dates
      dateOfBirth: userWithoutSensitiveData.dateOfBirth ?
        new Date(userWithoutSensitiveData.dateOfBirth) : null,
      lastLogin: userWithoutSensitiveData.lastLogin ?
        new Date(userWithoutSensitiveData.lastLogin) : null,
      lastFailedLogin: userWithoutSensitiveData.lastFailedLogin ?
        new Date(userWithoutSensitiveData.lastFailedLogin) : null,
      lockoutUntil: userWithoutSensitiveData.lockoutUntil ?
        new Date(userWithoutSensitiveData.lockoutUntil) : null,
      lastPasswordChange: userWithoutSensitiveData.lastPasswordChange ?
        new Date(userWithoutSensitiveData.lastPasswordChange) : null,
      lastPinChange: userWithoutSensitiveData.lastPinChange ?
        new Date(userWithoutSensitiveData.lastPinChange) : null,
      statusChangedAt: userWithoutSensitiveData.statusChangedAt ?
        new Date(userWithoutSensitiveData.statusChangedAt) : null,
      suspensionEndAt: userWithoutSensitiveData.suspensionEndAt ?
        new Date(userWithoutSensitiveData.suspensionEndAt) : null,
      lastActiveAt: userWithoutSensitiveData.lastActiveAt ?
        new Date(userWithoutSensitiveData.lastActiveAt) : null,
      deactivatedAt: userWithoutSensitiveData.deactivatedAt ?
        new Date(userWithoutSensitiveData.deactivatedAt) : null,
      createdAt: new Date(userWithoutSensitiveData.createdAt),
      updatedAt: new Date(userWithoutSensitiveData.updatedAt),
      deletedAt: userWithoutSensitiveData.deletedAt ?
        new Date(userWithoutSensitiveData.deletedAt) : null,

      // Convert booleans (if they might be coming as 0/1 from database)
      isActive: Boolean(userWithoutSensitiveData.isActive),
      isEmailVerified: Boolean(userWithoutSensitiveData.isEmailVerified),
      isPhoneVerified: Boolean(userWithoutSensitiveData.isPhoneVerified),
      isPinSet: Boolean(userWithoutSensitiveData.isPinSet),
      canViewBalance: Boolean(userWithoutSensitiveData.canViewBalance),
      twoFactorEnabled: Boolean(userWithoutSensitiveData.twoFactorEnabled),
    } as User;
  }

  static async createUser(data: CreateUserDTO): Promise<User> {
    // Check if user exists
    const existingUser = await db
    .select()
    .from(users)
    .where(
      or(
        eq(users.email, data.email.toLowerCase()),
        eq(users.username, data.username),
        eq(users.phoneNumber, data.phoneNumber)
      )
    )
    .limit(1);

    if (existingUser.length > 0) {
      throw ErrorResponse.conflict('User with this email or username already exists');
    }

    try {
       // Hash password
       const hashPassword = await AuthUtils.hashPassword(data.password);

      // Start a transaction
      const result = await db.transaction(async (trx) => {
        // Insert user
        await trx
        .insert(users)
        .values({
          username: data.username,
          email: data.email,
          password: hashPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          role: data.role || 'user',
          tierLevel: data.tierLevel || 'basic'

        });

        // Retrieve the new user based on unique fields (email or username)
        const [newUser] = await trx
          .select()
          .from(users)
          .where(
            or(
              eq(users.email, data.email),
              eq(users.username, data.username)
            )
          )
          .limit(1);

        if (!newUser) {
          throw ErrorResponse.internal('User not found after insertion');
        }

        return newUser;
      })

      // Sanitize and return the user
      return this.sanitizeUser(result);
    } catch (error) {
      console.error('Create user error:', error);
      throw ErrorResponse.internal('Failed to create user');
    }
  }

  static async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      throw ErrorResponse.notFound('User not found');
    }

    // Prepare update data
    const updateData = {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.lga !== undefined && { lga: data.lga }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.role && { role: data.role }),
      ...(data.tierLevel && { tier: data.tierLevel }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
      updatedAt: new Date()
    };

    try {
      // Update user
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id));

      // Fetch updated user
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!updatedUser) {
        throw new Error('Failed to update user');
      }

      // Sanitize and return the user
      return this.sanitizeUser(updatedUser);

    } catch (error) {
      throw ErrorResponse.internal('Failed to update user');
    }
  }

  /**
   * List users with comprehensive filtering and sorting
   */
  static async listUsers(options: UserListQueryParams): Promise<UserListResponse> {
    const {
      page = 1,
      limit = 10,
      status,
      role,
      tierLevel,
      kycLevel,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      isActive
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];

    // Build filter conditions
    if (status) conditions.push(eq(users.status, status));
    if (role) conditions.push(eq(users.role, role));
    if (tierLevel) conditions.push(eq(users.tierLevel, tierLevel));
    if (kycLevel !== undefined) conditions.push(eq(users.kycLevel, kycLevel));
    if (isActive !== undefined) conditions.push(eq(users.isActive, isActive));
    if (startDate && endDate) {
      conditions.push(between(users.createdAt, startDate, endDate));
    }

    // Search condition
    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.username, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(users.phoneNumber, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const orderBy = this.getOrderByClause(sortBy, sortOrder);

    // Get total count
    const [countResult] = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(users)
      .where(whereClause);

    // Get users with basic details
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,
        status: users.status,
        role: users.role,
        tierLevel: users.tierLevel,
        kycLevel: sql<KycLevel>`cast(${users.kycLevel} as unsigned)`,
        isEmailVerified: users.isEmailVerified,
        isPhoneVerified: users.isPhoneVerified,
        isActive: users.isActive, // Added missing property
        updatedAt: users.updatedAt, // Added missing property
        lastLogin: sql<Date | null>`NULLIF(${loginAttempts.lastLogin}, '')`,
        createdAt: users.createdAt
      })
      .from(users)
      .leftJoin(loginAttempts, eq(users.id, loginAttempts.userId))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const total = Number(countResult?.count || 0);

    return {
      users: results,
      meta: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    };
  }
    
  /**
   * Get detailed user information including KYC, security, and activity
   */
  static async getUserDetails(userId: string) {
    // Get user with all related information
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw ErrorResponse.notFound('User not found');
    }

    // Get KYC information
    const kycInfo = await db
      .select()
      .from(kycs)
      .where(eq(kycs.userId, userId))
      .orderBy(desc(kycs.createdAt))
      .limit(1);

    // Get recent actions
    const activity = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);

    // Get security settings
    const [securitySettings] = await db
      .select()
      .from(security)
      .where(eq(security.userId, userId))
      .limit(1);

    return {
      ...user,
      kyc: kycInfo[0] || null,
      activity,
      security: securitySettings,
      stats: await this.getUserStats(userId)
    };
  }

  static async deleteUser(id: string, data: DeleteUserDTO): Promise<void> {
    try {
      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!existingUser) {
        throw ErrorResponse.notFound('User not found');
      }

      // If user is already deleted, throw error
      if (existingUser.deletedAt) {
        throw ErrorResponse.badRequest('User is already deleted');
      }

      await db.transaction(async (trx) => {
        if (data.deleteType === 'hard') {
          // Permanent deletion
          await trx
            .delete(users)
            .where(eq(users.id, id));
        } else {
          // Soft deletion
          await trx
            .update(users)
            .set({
              deletedAt: new Date(),
              isActive: false,
              status: 'deleted' as UserStatus,
              updatedAt: new Date()
            })
            .where(eq(users.id, id));
        }
      });
    } catch (error) {
      console.error('Delete user error:', error);
      if (error instanceof ErrorResponse) {
        throw error;
      }
      throw ErrorResponse.internal('Failed to delete user');
    }
  }

  /**
   * Update user status with full action tracking
   */
  static async updateUserStatus(
    userId: string,
    adminId: string,
    data: UpdateUserStatusDTO
  ): Promise<AdminActionResponse> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw ErrorResponse.notFound("User not found");
    }

    const timestamp = new Date();

    await db.transaction(async (tx) => {
      // Update user status
      await tx
        .update(users)
        .set({
          status: data.status,
          isActive: ["active", "pending"].includes(data.status),
          updatedAt: timestamp,
        })
        .where(eq(users.id, userId));

      // Record in status history
      await tx.insert(statusHistory).values({
        userId,
        status: data.status,
        statusReason: data.reason,
        statusChangedBy: adminId,
        suspensionEndAt: data.duration
          ? new Date(Date.now() + data.duration * 60 * 60 * 1000)
          : null,
        createdAt: timestamp,
      });

      // Log in audit logs
      await tx.insert(auditLogs).values({
        userId,
        type: "statusChange",
        description: `Status changed from ${user.status} to ${data.status}`,
        source: "adminPortal",
        metadata: {
          reason: data.reason,
          duration: data.duration,
          previousStatus: user.status,
          newStatus: data.status,
        },
        clientId: adminId,
        createdAt: timestamp,
      });
    });

    // Notify user if requested
    if (data.notifyUser) {
      await EmailService.sendStatusChangeNotification(
        user.email,
        data.status,
        data.reason
      );
    }

    return {
      success: true,
      message: `User status updated to ${data.status}`,
      timestamp,
    };
  }

  /**
   * Reset user security settings
   */
  static async resetSecurity(
    userId: string,
    adminId: string,
    options: SecurityResetOptions
  ): Promise<AdminActionResponse> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw ErrorResponse.notFound('User not found');
    }

    const timestamp = new Date();

    await db.transaction(async (tx) => {
      if (options.password) {
        const tempPassword = AuthUtils.generateTempPassword();
        const hashPassword = await AuthUtils.hashPassword(tempPassword);

        await tx
          .update(users)
          .set({
            password: hashPassword,
            updatedAt: timestamp
          })
          .where(eq(users.id, userId));

        if (options.notifyUser) {
          await EmailService.sendTemporaryPasswordEmail(
            user.email,
            tempPassword
          );
        }
      }

      if (options.pin) {
        await tx
          .update(security)
          .set({
            transactionPin: null,
            isPinSet: false,
            updatedAt: timestamp
          })
          .where(eq(security.userId, userId));
      }

      if (options.twoFactor) {
        await tx
          .update(security)
          .set({
            twoFactorEnabled: false,
            twoFactorSecret: null,
            updatedAt: timestamp
          })
          .where(eq(security.userId, userId));
      }

      if (options.sessions) {
        // Revoke all refresh tokens for this user
        await tx
          .update(tokens)
          .set({
            isRevoked: true,
            updatedAt: timestamp
          })
          .where(
            and(
              eq(tokens.userId, userId),
              eq(tokens.type, 'refreshToken'),
              eq(tokens.isRevoked, false)
            )
          );
      }

      // Log the action in audit logs
      await tx
        .insert(auditLogs)
        .values({
          userId,
          type: 'securityReset',
          description: 'Security settings reset by admin',
          source: 'adminPortal',
          metadata: {
            options,
            reason: options.reason
          },
          clientId: adminId,
          createdAt: timestamp
        });
    });

    return {
      success: true,
      message: 'Security settings reset successfully',
      timestamp
    };
  }

  /**
   * Update user permissions
   */
  static async updatePermissions(
    userId: string,
    adminId: string,
    data: UpdateUserPermissionsDto
  ): Promise<AdminActionResponse> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw ErrorResponse.notFound("User not found");
    }

    const actionId = crypto.randomUUID();
    const timestamp = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          role: data.role || user.role,
          // Additional permission fields as needed
          updatedAt: timestamp,
        })
        .where(eq(users.id, userId));

      // Log action
      await tx.insert(auditLogs).values({
        userId,
        type: "permissionChange",
        description: `Role changed from ${user.role} to ${data.role}`,
        source: 'adminPortal',
        metadata: {
          previousRole: user.role,
          newRole: data.role,
          reason: data.reason,
        },
        createdAt: timestamp,
      });
    });

    return {
      success: true,
      message: "User permissions updated successfully",
      timestamp,
    };
  }

  static async resetUserPassword(id: string, adminId: string): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw ErrorResponse.notFound('User not found');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashPassword = await AuthUtils.hashPassword(tempPassword);

    // Update user password
    await db
      .update(users)
      .set({
        password: hashPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));

    // TODO: Send email with temporary password
    console.log('Temporary password:', tempPassword);
  }

  /**
   * Get comprehensive user statistics
   */
  static async getUserStats(userId: string) {
    // Get transaction stats
    const [transactionStats] = await db
      .select({
        totalTransactions: count(transactions.id),
        totalAmount: sql<string>`CAST(SUM(${transactions.amount}) AS CHAR)`,
        successfulTransactions: count(
          sql`CASE WHEN ${transactions.status} = 'completed' THEN 1 END`
        ),
        failedTransactions: count(
          sql`CASE WHEN ${transactions.status} = 'failed' THEN 1 END`
        ),
      })
      .from(transactions)
      .where(eq(transactions.userId, userId));

    // Get login stats
    const [loginStats] = await db
      .select({
        failedLoginAttempts: sql<number>`COALESCE(${loginAttempts.failedLoginAttempts}, 0)`,
        currentLoginAttempts: sql<number>`COALESCE(${loginAttempts.currentLoginAttempts}, 0)`,
        lastLogin: loginAttempts.lastLogin,
        lastFailedLogin: loginAttempts.lastFailedLogin,
        lastActiveAt: loginAttempts.lastActiveAt,
      })
      .from(loginAttempts)
      .where(eq(loginAttempts.userId, userId));

    // Get KYC stats
    const [kycStats] = await db
      .select({
        totalAttempts: count(kycs.id),
        approvedAttempts: count(
          sql`CASE WHEN ${kycs.status} = 'approved' THEN 1 END`
        ),
        rejectedAttempts: count(
          sql`CASE WHEN ${kycs.status} = 'rejected' THEN 1 END`
        ),
        lastAttempt: sql<Date>`MAX(${kycs.createdAt})`,
      })
      .from(kycs)
      .where(eq(kycs.userId, userId));

    // Get support ticket stats
    const [ticketStats] = await db
      .select({
        totalTickets: count(supportTickets.id),
        openTickets: count(
          sql`CASE WHEN ${supportTickets.status} = 'open' THEN 1 END`
        ),
        resolvedTickets: count(
          sql`CASE WHEN ${supportTickets.status} = 'resolved' THEN 1 END`
        ),
      })
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId));

    // Get card stats
    const [cardStats] = await db
      .select({
        totalCards: count(atmCards.id),
        activeCards: count(sql`CASE WHEN ${atmCards.isActive} = 1 THEN 1 END`),
      })
      .from(atmCards)
      .where(eq(atmCards.userId, userId));

    // Get recent audit logs
    const recentAudits = await db
      .select({
        id: auditLogs.id,
        type: auditLogs.type,
        description: auditLogs.description,
        ipAddress: auditLogs.ipAddress,
        deviceInfo: auditLogs.deviceInfo,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(sql`${auditLogs.createdAt} DESC`)
      .limit(10);

    return {
      transactions: {
        total: Number(transactionStats?.totalTransactions || 0),
        successful: Number(transactionStats?.successfulTransactions || 0),
        failed: Number(transactionStats?.failedTransactions || 0),
        totalAmount: transactionStats?.totalAmount || "0",
      },
      login: {
        failedAttempts: loginStats?.failedLoginAttempts || 0,
        currentAttempts: loginStats?.currentLoginAttempts || 0,
        lastLogin: loginStats?.lastLogin,
        lastFailedLogin: loginStats?.lastFailedLogin,
        lastActive: loginStats?.lastActiveAt,
      },
      kyc: {
        totalAttempts: Number(kycStats?.totalAttempts || 0),
        approved: Number(kycStats?.approvedAttempts || 0),
        rejected: Number(kycStats?.rejectedAttempts || 0),
        lastAttempt: kycStats?.lastAttempt,
      },
      support: {
        totalTickets: Number(ticketStats?.totalTickets || 0),
        openTickets: Number(ticketStats?.openTickets || 0),
        resolvedTickets: Number(ticketStats?.resolvedTickets || 0),
      },
      cards: {
        total: Number(cardStats?.totalCards || 0),
        active: Number(cardStats?.activeCards || 0),
      },
      recentActivity: recentAudits,
    };
  }

  static async updateUserKYC(id: string, kycLevel: number, adminId: string): Promise<User> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw ErrorResponse.notFound('User not found');
    }

    // Update KYC level in transaction
    const result = await db.transaction(async (tx) => {
      // Update user KYC level
      await tx
        .update(users)
        .set({
          kycLevel,
          updatedAt: new Date()
        })
        .where(eq(users.id, id));

      // Update KYC record
      await tx
        .update(kycs)
        .set({
          level: kycLevel,
          verifiedBy: adminId,
          verifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(kycs.userId, id));

      // Get the newly update kyc within the same transaction
      const [updatedUser] = await tx
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!updatedUser) {
        throw ErrorResponse.internal("Failed to retieved updated user kyc level");
      }

      return updatedUser;
    });

    // Sanitize and return the user
    return this.sanitizeUser(result);
  }

  private static getOrderByClause(sortBy: string, sortOrder: 'asc' | 'desc') {
    const column = this.getColumnForSort(sortBy);
    return sortOrder === 'desc' ? desc(column) : asc(column);
  }

  private static getColumnForSort(sortBy: string) {
    const columns: Record<string, any> = {
      createdAt: users.createdAt,
      username: users.username,
      email: users.email,
      status: users.status,
      kycLevel: users.kycLevel
    };
    return columns[sortBy] || users.createdAt;
  }

  /**
   * List KYC verification requests
   */
  static async listVerificationRequests(
    params: KycListQueryParams
  ): Promise<KycListResponse> {
    const {
      page = 1,
      limit = 10,
      status,
      level,
      startDate,
      endDate,
      search
    } = params;

    const offset = (page - 1) * limit;
    const conditions = [];

    // Build filter conditions
    if (status) conditions.push(eq(kycs.status, status));
    if (level) conditions.push(eq(kycs.level, level));
    
    if (startDate && endDate) {
      conditions.push(between(kycs.createdAt, startDate, endDate));
    }

    // Add search across user fields
    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.username, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(users.phoneNumber, `%${search}%`),
          like(kycs.idNumber, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({
        count: sql<number>`cast(count(*) as unsigned)`
      })
      .from(kycs)
      .leftJoin(users, eq(kycs.userId, users.id))
      .where(whereClause);

    // Get KYC requests with user details
    const results = await db
      .select({
        // KYC fields
        id: kycs.id,
        userId: kycs.userId,
        level: kycs.level,
        status: kycs.status,
        bvn: kycs.bvn,
        bvnVerified: kycs.bvnVerified,
        idType: kycs.idType,
        idNumber: kycs.idNumber,
        idExpiryDate: kycs.idExpiryDate,
        address: kycs.address,
        city: kycs.city,
        state: kycs.state,
        country: kycs.country,
        verifiedBy: kycs.verifiedBy,
        verifiedAt: kycs.verifiedAt,
        createdAt: kycs.createdAt,
        updatedAt: kycs.updatedAt,
        // User fields
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phoneNumber: users.phoneNumber,
          currentKycLevel: users.kycLevel
        }
      })
      .from(kycs)
      .leftJoin(users, eq(kycs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(kycs.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      verifications: results,
      meta: {
        total: Number(countResult?.count || 0),
        pages: Math.ceil(Number(countResult?.count || 0) / limit),
        page,
        limit
      }
    };
  }

  /**
   * Review KYC verification request
   */
  static async reviewVerification(
    kycId: string,
    adminId: string,
    action: KycReviewAction
  ): Promise<void> {
    const [kyc] = await db
      .select()
      .from(kycs)
      .where(eq(kycs.id, kycId))
      .limit(1);

    if (!kyc) {
      throw ErrorResponse.notFound('KYC verification request not found');
    }

    if (kyc.status !== 'pending') {
      throw ErrorResponse.badRequest('KYC request is not in pending state');
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, kyc.userId))
      .limit(1);

    if (!user) {
      throw ErrorResponse.notFound('User not found');
    }

    await db.transaction(async (tx) => {
      // Update KYC status
      await tx
        .update(kycs)
        .set({
          status: action.status,
          rejectionReason: action.reason,
          verifiedBy: adminId,
          verifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(kycs.id, kycId));

      // If approved, update user's KYC level
      if (action.status === 'approved') {
        await tx
          .update(users)
          .set({
            kycLevel: kyc.level,
            updatedAt: new Date()
          })
          .where(eq(users.id, kyc.userId));
      }
    });

    // Send notification to user
    if (action.status === 'approved') {
      await EmailService.sendKycApprovalEmail(user.email, kyc.level);
    } else {
      await EmailService.sendKycRejectionEmail(user.email, action.reason || 'No reason provided');
    }
  }

  /**
   * Get KYC verification details
   */
  static async getVerificationDetails(kycId: string): Promise<KycVerificationRequest> {
    const [kyc] = await db
      .select()
      .from(kycs)
      .where(eq(kycs.id, kycId))
      .limit(1);

    if (!kyc) {
      throw ErrorResponse.notFound('KYC verification request not found');
    }

    return kyc;
  }

  /**
   * Get KYC statistics
   */
  static async getKycStats() {
    const [stats] = await db
      .select({
        totalRequests: sql<number>`count(*)`,
        pendingRequests: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
        approvedRequests: sql<number>`sum(case when status = 'approved' then 1 else 0 end)`,
        rejectedRequests: sql<number>`sum(case when status = 'rejected' then 1 else 0 end)`,
        todayRequests: sql<number>`sum(case when date(createdAt) = current_date then 1 else 0 end)`
      })
      .from(kycs);

    return stats;
  }
}
