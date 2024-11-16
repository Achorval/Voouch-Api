// src/services/admin/system.service.ts
import { and, eq, like, or, between, desc, sql } from "drizzle-orm";
import { db } from "../../config/database";
import {
  tierLimits,
  productProviders,
  auditLogs,
  security,
} from "../../db/schema";
import { ErrorResponse } from "../../utilities/error";
import type {
  TierLimit,
  TierLimitInput,
  FeeConfiguration,
  FeeConfigInput,
  AuditLogQueryParams,
  AuditLogListResponse,
  SecuritySettings,
  SecuritySettingsInput,
} from "../../types/admin/system.types";
import { RequirementsType } from "../../db/schema/tierLimits";
import { ActivityType, ClientSource } from "../../db/schema/auditLogs";

export class SystemService {
  /**
   * Tier Limits Management
   */
  static async createTierLimit(data: TierLimitInput): Promise<TierLimit> {
    // Check if tier level already exists
    const [existingTier] = await db
      .select()
      .from(tierLimits)
      .where(eq(tierLimits.level, data.level))
      .limit(1);

    if (existingTier) {
      throw ErrorResponse.conflict(`Tier level ${data.level} already exists`);
    }

    await db.insert(tierLimits).values({
      level: data.level,
      dailyLimit: data.dailyLimit,
      maximumBalance: data.maximumBalance,
      requirements: data.requirements as RequirementsType,
    });

    const [tierLimit] = await db
      .select()
      .from(tierLimits)
      .where(eq(tierLimits.level, data.level))
      .limit(1);

    if (!tierLimit) {
      throw ErrorResponse.internal("Failed to create tier limit");
    }

    return tierLimit as TierLimit;
  }

  static async updateTierLimit(
    id: string,
    data: Partial<TierLimitInput>
  ): Promise<TierLimit> {
    const [existingTier] = await db
      .select()
      .from(tierLimits)
      .where(eq(tierLimits.id, id))
      .limit(1);

    if (!existingTier) {
      throw ErrorResponse.notFound("Tier limit not found");
    }

    await db
      .update(tierLimits)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tierLimits.id, id));

    const [updatedTier] = await db
      .select()
      .from(tierLimits)
      .where(eq(tierLimits.id, id))
      .limit(1);

    return updatedTier as TierLimit;
  }

  static async listTierLimits(): Promise<TierLimit[]> {
    const tiers = await db.select().from(tierLimits).orderBy(tierLimits.level);
    return tiers;
  }

  /**
   * Fee Configuration Management
   */
  static async configureFee(
    productId: string,
    providerId: string,
    data: FeeConfigInput
  ): Promise<FeeConfiguration> {
    const [existingConfig] = await db
      .select()
      .from(productProviders)
      .where(
        and(
          eq(productProviders.productId, productId),
          eq(productProviders.providerId, providerId)
        )
      )
      .limit(1);

    // Update or insert fee configuration
    if (existingConfig) {
      await db
        .update(productProviders)
        .set({
          feeType: data.feeType,
          feeValue: data.feeValue,
          minFee: data.minFee,
          maxFee: data.maxFee,
          providerProductCode: data.providerProductCode,
          priority: data.priority,
          isEnabled: data.isEnabled ?? true,
          isDefault: data.isDefault ?? false,
          updatedAt: new Date(),
        })
        .where(eq(productProviders.id, existingConfig.id));
    } else {
      await db.insert(productProviders).values({
        productId,
        providerId,
        feeType: data.feeType,
        feeValue: data.feeValue,
        minFee: data.minFee,
        maxFee: data.maxFee,
        providerProductCode: data.providerProductCode,
        priority: data.priority,
        isEnabled: data.isEnabled ?? true,
        isDefault: data.isDefault ?? false,
      });
    }

    const [feeConfig] = await db
      .select()
      .from(productProviders)
      .where(
        and(
          eq(productProviders.productId, productId),
          eq(productProviders.providerId, providerId)
        )
      )
      .limit(1);

    return feeConfig as FeeConfiguration;
  }

  /**
   * Audit Log Management
   */
  static async listAuditLogs(
    params: AuditLogQueryParams
  ): Promise<AuditLogListResponse> {
    const {
      page = 1,
      limit = 10,
      userId,
      type,
      source,
      startDate,
      endDate,
      search,
    } = params;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (type) conditions.push(eq(auditLogs.type, type as ActivityType));
    if (source) conditions.push(eq(auditLogs.source, source as ClientSource));
    if (startDate && endDate) {
      conditions.push(between(auditLogs.createdAt, startDate, endDate));
    }
    if (search) {
      conditions.push(
        or(
          like(auditLogs.description, `%${search}%`),
          like(auditLogs.type, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({
        count: sql<number>`cast(count(*) as unsigned)`,
      })
      .from(auditLogs)
      .where(whereClause);

    // Get audit logs
    const logs = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      logs,
      meta: {
        total: Number(countResult?.count || 0),
        pages: Math.ceil(Number(countResult?.count || 0) / limit),
        page,
        limit,
      },
    };
  }

  /**
   * Security Settings Management
   */
  static async updateSecuritySettings(
    userId: string,
    settings: SecuritySettingsInput
  ): Promise<SecuritySettings> {
    const [existingSettings] = await db
      .select()
      .from(security)
      .where(eq(security.userId, userId))
      .limit(1);

    if (!existingSettings) {
      throw ErrorResponse.notFound("Security settings not found");
    }

    await db
      .update(security)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(security.userId, userId));

    const [updatedSettings] = await db
      .select({
        maxLoginAttempts: security.maxLoginAttempts,
        lockoutDuration: security.lockoutDuration,
        twoFactorEnabled: security.twoFactorEnabled,
        twoFactorMethod: security.twoFactorMethod,
      })
      .from(security)
      .where(eq(security.userId, userId))
      .limit(1);

    return updatedSettings as SecuritySettings;
  }
}
