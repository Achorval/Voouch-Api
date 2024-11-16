// // src/types/common/auth.types.ts

export interface TokenPayload {
  id: string;
  role: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// export interface LoginCredentials {
//   identifier: string;
//   password: string;
// }

// export interface RegisterData {
//   email: string;
//   password: string;
//   username: string;
//   firstName: string;
//   lastName: string;
//   phoneNumber: string;
//   referralCode?: string;
// }

// export interface AuthUser {
//   id: string;
//   email: string;
//   username: string;
//   firstName: string;
//   lastName: string;
//   role: string;
//   status: string;
//   isEmailVerified: boolean;
//   createdAt: Date;
// }

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

// export interface PasswordResetData {
//   token: string;
//   newPassword: string;
// }

// export interface EmailVerificationData {
//   token: string;
// }



// src/types/common/auth.types.ts
// import { Request } from 'express';

// Previously defined interfaces...
// export interface TokenPayload {
//   userId: string;
//   iat?: number;
//   exp?: number;
// }


export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// src/types/common/auth.types.ts
export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  // gender?: string;
  // dateOfBirth?: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
  deviceInfo?: {
    deviceId?: string;
    clientId?: string;
    clientVersion?: string;
  };
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    gender: string | null;
    dateOfBirth: Date | null;
    avatar: string | null;
    role: string;
    status: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    kycLevel: number;
    tierLevel: string;
  };
  accessToken: string;
}
