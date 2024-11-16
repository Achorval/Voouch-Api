// src/types/admin/system.types.ts
import { FeeTypes } from "../../db/schema/productProviders";
import { RequirementsType } from "../../db/schema/tierLimits";

export interface TierLimit {
  id: string;
  level: number;
  dailyLimit: string;
  maximumBalance: string;
  requirements?: RequirementsType | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeConfiguration {
  id: string;
  productId: string;
  providerId: string;
  feeType: FeeTypes;
  feeValue: string;
  minFee?: string;
  maxFee?: string;
  priority: number;
  isEnabled: boolean;
  isDefault: boolean;
  metadata?: Record<string, any> | null;
}

export interface SystemAuditLog {
  id: string;
  userId: string;
  type: string;
  description: string | null;
  source: string;
  clientId?: string | null;
  clientVersion?: string | null;
  deviceId?: string | null;
  deviceInfo?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  location?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
}

export interface SecuritySettings {
  maxLoginAttempts: number;
  lockoutDuration: number;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'email' | 'sms';
}

export interface TierLimitInput {
  level: number;
  dailyLimit: string;
  maximumBalance: string;
  requirements?: RequirementsType | null;
}

export interface FeeConfigInput {
  providerProductCode: string;
  feeType: FeeTypes;
  feeValue: string;
  maxFee?: string;
  minFee?: string;
  priority: number;
  isEnabled?: boolean;
  isDefault?: boolean;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  type?: string;
  source?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface SecuritySettingsInput {
  maxLoginAttempts?: number;
  lockoutDuration?: number;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'email' | 'sms';
}

export interface AuditLogListResponse {
  logs: SystemAuditLog[];
  meta: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}