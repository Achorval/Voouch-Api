// src/types/user/profile.types.ts
export interface ProfileResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  gender?: string;
  dateOfBirth?: Date;
  avatar?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  kycLevel: number;
  tierLevel: string;
  security: {
    twoFactorEnabled: boolean;
    twoFactorMethod?: 'email' | 'sms';
    canViewBalance: boolean;
    isPinSet: boolean;
  };
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
}

export interface SecuritySettingsInput {
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'email' | 'sms';
  canViewBalance?: boolean;
}

export interface TransactionPinInput {
  pin: string;
  confirmPin: string;
}

export interface ChangeTransactionPinInput {
  currentPin: string;
  newPin: string;
  confirmPin: string;
}