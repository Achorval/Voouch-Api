// // src/types/admin/user.types.ts

import { Gender } from "../../db/schema/users";

// export type UserRole = 'user' | 'admin' | 'super_admin';
// export type UserStatus = 'active' | 'blocked' | 'locked' | 'deactivated' | 'suspended' | 'deleted' | 'restricted';
// export type TwoFactorMethod = 'email' | 'authenticator' | 'sms';
// export type Gender = 'male' | 'female' | 'other';
// export type UserTier = 'basic' | 'intermediate' | 'premium' | 'vip';

// export interface User {
//   id: string;
//   username: string;
//   email: string;
//   password: string;
//   passwordSalt: string;
//   transactionPin: string | null;
//   transactionPinSalt: string | null;
//   firstName: string;
//   lastName: string;
//   phoneNumber: string;
//   gender: Gender | null;
//   dateOfBirth: Date | null;
//   avatar: string | null;
//   address: string | null;
//   city: string | null;
//   lga: string | null;
//   state: string | null;
//   country: string | null;
//   role: UserRole;
//   tier: UserTier;
//   canViewBalance: boolean;
//   twoFactorSecret: string | null;
//   twoFactorEnabled: boolean;
//   twoFactorMethod: TwoFactorMethod;
//   isEmailVerified: boolean;
//   isPhoneVerified: boolean;
//   isPinSet: boolean;
//   kycLevel: number;
//   failedLoginAttempts: number;
//   lastFailedLogin: Date | null;
//   lockoutUntil: Date | null;
//   lastLogin: Date | null;
//   lastPasswordChange: Date | null;
//   lastPinChange: Date | null;
//   referralCode: string | null;
//   referredBy: string | null;
//   referralCount: number;
//   totalReferralEarnings: number;
//   status: UserStatus;
//   statusReason: string | null;
//   statusNote: string | null;
//   statusChangedAt: Date | null;
//   statusChangedBy: string | null;
//   suspensionEndAt: Date | null;
//   lastActiveAt: Date | null;
//   deactivatedAt: Date | null;
//   isActive: boolean;
//   maxLoginAttempts: number;
//   currentLoginAttempts: number;
//   lockoutDuration: number;
//   metadata: Record<string, any> | null;
//   createdAt: Date;
//   updatedAt: Date;
//   deletedAt: Date | null;
// }

// export interface UserListOptions {
//   page: number;
//   limit: number;
//   status?: UserStatus;
//   role?: UserRole;
//   tier?: UserTier;
//   kycLevel?: number;
//   search?: string;
//   sortBy?: string;
//   sortOrder?: 'asc' | 'desc';
//   startDate?: Date;
//   endDate?: Date;
//   isActive?: boolean;
// }

// export interface UserListResponse {
//   users: User[];
//   meta: {
//     total: number;
//     pages: number;
//     currentPage: number;
//   };
// }

// export interface UserActionLog {
//   id: string;
//   userId: string;
//   adminId: string;
//   action: 'block' | 'unblock' | 'suspend' | 'reset_password' | 'reset_pin' | 'reset_2fa' | 'change_role' | 'change_tier';
//   reason: string;
//   metadata?: Record<string, any>;
//   ipAddress?: string;
//   createdAt: Date;
// }

// export interface UserSecurityReset {
//   pin?: boolean;
//   password?: boolean;
//   twoFactor?: boolean;
//   deviceSessions?: boolean;
// }

// export interface KycVerificationRequest {
//   id: string;
//   userId: string;
//   level: number;
//   status: 'pending' | 'approved' | 'rejected';
//   documents: UserDocument[];
//   submittedAt: Date;
//   reviewedAt?: Date;
//   reviewedBy?: string;
//   rejectionReason?: string;
// }

// export interface UserDocument {
//   id: string;
//   type: 'id_front' | 'id_back' | 'utility_bill' | 'passport' | 'drivers_license';
//   url: string;
//   status: 'pending' | 'approved' | 'rejected';
//   uploadedAt: Date;
//   verifiedAt?: Date;
// }

// export interface UserStats {
//   totalUsers: number;
//   activeUsers: number;
//   blockedUsers: number;
//   suspendedUsers: number;
//   kycStats: {
//     level0: number;
//     level1: number;
//     level2: number;
//     level3: number;
//   };
//   tierStats: {
//     [key in UserTier]: number;
//   };
//   recentSignups: number;
//   recentKycRequests: number;
// }

// export interface AdminActionInput {
//   action: 'block' | 'unblock' | 'suspend';
//   reason: string;
//   duration?: number; // in hours, for suspension
//   metadata?: Record<string, any>;
// }

// export interface KycReviewInput {
//   status: 'approved' | 'rejected';
//   reason?: string;
//   documentApprovals?: {
//     [documentId: string]: boolean;
//   };
// }







// src/types/admin/user.types.ts

// Basic Enums and Types
export type UserStatus = 'active' | 'blocked' | 'locked' | 'deactivated' | 'suspended' | 'deleted' | 'restricted';
export type UserRole = 'user' | 'admin' | 'super_admin';
export type KycLevel = 0 | 1 | 2 | 3;
export type KycStatus = 'pending' | 'approved' | 'rejected';
export type UserTier = 'basic' | 'silver' | 'gold' | 'platinum'

export type KycDocumentType = 'passport' | 'drivers_license' | 'national_id' | 'utility_bill';
export type KycDocumentStatus = 'pending' | 'approved' | 'rejected';

// User Overview Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: UserStatus;
  role: UserRole;
  kycLevel: KycLevel;
  tierLevel: UserTier;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

export interface UserListQueryParams {
  page?: number;
  limit?: number;
  status?: UserStatus;
  role?: UserRole;
  kycLevel?: KycLevel;
  tierLevel?: UserTier;
  search?: string;
  isActive?: boolean;
  sortBy?: keyof User;
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
}

export interface UserListResponse {
  users: User[];
  meta: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export interface UserDetails extends User {
  kyc: KycVerificationRequest;
  security: SecurityDetails;
  activity: ActivityLog[];
  stats: UserStats;
}


export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role?: UserRole;
  tierLevel?: UserTier;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  gender?: Gender | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  city?: string | null;
  lga?: string | null;
  state?: string | null;
  country?: string | null;
  role?: UserRole;
  tierLevel?: UserTier;
  kycLevel?: number;
  maxLoginAttempts?: number;
  lockoutDuration?: number;
  metadata?: Record<string, any> | null;
}

export interface UpdateUserStatusDTO1 {
  status: UserStatus;
  reason?: string;
  note?: string;
  suspensionEndAt?: Date;
}

// Action DTOs
export interface UpdateUserStatusDTO {
  status: UserStatus;
  reason: string;
  duration?: number; // For suspension, in hours
  notifyUser?: boolean;
}

// KYC Management Types
export interface KycVerificationRequest {
  id: string;
  userId: string;
  level: number;
  status: KycStatus;
  bvn?: string | null; 
  bvnVerified: boolean;
  idType?: string | null;
  idNumber?: string | null;
  idExpiryDate?: string | null; 
  address?: string | null;
  city?: string | null;
  lga?: string | null;
  state?: string | null;
  country?: string | null;
  verifiedBy?: string | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date | null;
}

export interface KycDocument {
  id: string;
  kycId: string;
  type: KycDocumentType;
  fileUrl: string;
  status: KycDocumentStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface KycListQueryParams {
  page?: number;
  limit?: number;
  status?: KycStatus;
  level?: number;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface KycReviewAction {
  status: 'approved' | 'rejected';
  reason?: string;
  documents?: {
    [documentId: string]: {
      status: KycDocumentStatus;
      reason?: string;
    }
  };
}

export interface KycListResponse {
  verifications: KycVerificationRequest[];
  meta: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

// export interface KycDetails {
//   currentLevel: KycLevel;
//   status: KycStatus;
//   verificationHistory: KycVerification[];
//   documents: KycDocument[];
//   bvnVerified: boolean;
//   addressVerified: boolean;
//   lastUpdated: Date;
// }

// export interface KycVerification {
//   id: string;
//   level: KycLevel;
//   status: KycStatus;
//   submittedAt: Date;
//   reviewedAt?: Date;
//   reviewedBy?: string;
//   rejectionReason?: string;
//   documents: KycDocument[];
// }

// export interface KycDocument {
//   id: string;
//   type: 'id_front' | 'id_back' | 'utility_bill' | 'passport' | 'drivers_license';
//   fileUrl: string;
//   status: 'pending' | 'approved' | 'rejected';
//   rejectionReason?: string;
//   reviewedBy?: string;
//   reviewedAt?: Date;
//   uploadedAt: Date;
// }

// export interface DocumentReviewInput {
//   documentId: string;
//   status: 'approved' | 'rejected';
//   reason?: string;
// }

// Account Actions Types
export interface SecurityDetails {
  passwordLastChanged: Date;
  pinLastChanged?: Date;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'email' | 'sms';
  failedLoginAttempts: number;
  lastFailedLogin?: Date;
  deviceSessions: DeviceSession[];
}

export interface DeviceSession {
  id: string;
  deviceId: string;
  deviceInfo: string;
  ipAddress: string;
  lastActive: Date;
  isCurrentSession: boolean;
}

export interface ActivityLog {
  id: string;
  type: 'login' | 'security_change' | 'kyc_update' | 'status_change';
  action: string;
  ipAddress?: string;
  deviceInfo?: string;
  location?: string;
  timestamp: Date;
}

export interface UserStats {
  totalTransactions: number;
  lastTransactionDate?: Date;
  loginCount: number;
  failedLoginCount: number;
  kycAttempts: number;
  documentSubmissions: number;
}

export interface SecurityResetOptions {
  password?: boolean;
  pin?: boolean;
  twoFactor?: boolean;
  sessions?: boolean;
  reason: string;
  notifyUser?: boolean;
}

export interface UpdateUserPermissionsDto {
  role?: UserRole;
  permissions?: string[];
  reason: string;
}

// Response Types
export interface AdminActionResponse {
  success: boolean;
  message: string;
  timestamp: Date;
}

export type DeleteType = 'soft' | 'hard';

export interface DeleteUserDTO {
  deleteType: DeleteType;
  reason?: string;
}