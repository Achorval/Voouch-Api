// src/services/admin/financial.service.ts
import { and, eq, between, desc, sql } from 'drizzle-orm';
import { db } from '../../config/database';
import { 
  transactions, 
  productProviders, 
  referrals 
} from '../../db/schema';
import type { 
  TransactionStats, 
  ReferralStats,
  ProductRevenue,
  ProviderRevenue,
  FinancialQueryParams,
  ReferralQueryParams, 
  TransactionFee
} from '../../types/admin/financial.types';
import { PaymentMethod } from '../../db/schema/transactions';

export class FinancialService {
  /**
   * Get transaction statistics
   */
  static async getTransactionStats(params: FinancialQueryParams): Promise<TransactionStats> {
    const conditions = [];

    if (params.startDate && params.endDate) {
      conditions.push(between(transactions.createdAt, params.startDate, params.endDate));
    }
    if (params.categoryId) {
      conditions.push(eq(transactions.categoryId, params.categoryId));
    }
    if (params.productId) {
      conditions.push(eq(transactions.productId, params.productId));
    }
    if (params.providerId) {
      conditions.push(eq(transactions.providerId, params.providerId));
    }
    if (params.type) {
      conditions.push(eq(transactions.type, params.type));
    }
    if (params.status) {
      conditions.push(eq(transactions.status, params.status));
    }
    if (params.paymentMethod) {
      conditions.push(eq(transactions.paymentMethod, params.paymentMethod as PaymentMethod));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [stats] = await db
      .select({
        totalAmount: sql<string>`cast(sum(${transactions.amount}) as char)`,
        totalFee: sql<string>`cast(sum(${transactions.fee}) as char)`,
        totalTransactions: sql<number>`count(*)`,
        completedTransactions: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
        failedTransactions: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`
      })
      .from(transactions)
      .where(whereClause);

    return {
      totalAmount: stats?.totalAmount || '0',
      totalFee: stats?.totalFee || '0',
      totalTransactions: stats?.totalTransactions || 0,
      completedTransactions: stats?.completedTransactions || 0,
      failedTransactions: stats?.failedTransactions || 0
    };
  }

  /**
   * Get product revenue breakdown
   */
  static async getProductRevenue(params: FinancialQueryParams): Promise<ProductRevenue[]> {
    const conditions = [];

    if (params.startDate && params.endDate) {
      conditions.push(between(transactions.createdAt, params.startDate, params.endDate));
    }
    if (params.status) {
      conditions.push(eq(transactions.status, params.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        productId: transactions.productId,
        categoryId: transactions.categoryId,
        totalAmount: sql<string>`cast(sum(${transactions.amount}) as char)`,
        totalFee: sql<string>`cast(sum(${transactions.fee}) as char)`,
        transactionCount: sql<number>`count(*)`
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(transactions.productId, transactions.categoryId)
      .orderBy(desc(sql`totalAmount`));

    return results as ProductRevenue[];
  }

  /**
   * Get provider revenue breakdown
   */
  static async getProviderRevenue(params: FinancialQueryParams): Promise<ProviderRevenue[]> {
    const conditions = [];

    if (params.startDate && params.endDate) {
      conditions.push(between(transactions.createdAt, params.startDate, params.endDate));
    }
    if (params.status) {
      conditions.push(eq(transactions.status, params.status));
    }
    if (params.categoryId) {
      conditions.push(eq(transactions.categoryId, params.categoryId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        providerId: transactions.providerId,
        totalAmount: sql<string>`cast(sum(${transactions.amount}) as char)`,
        totalFee: sql<string>`cast(sum(${transactions.fee}) as char)`,
        transactionCount: sql<number>`count(*)`
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(transactions.providerId)
      .orderBy(desc(sql`totalAmount`));

    return results as ProviderRevenue[];
  }

  /**
   * Get fee configuration for a product provider
   */
  static async getProductProviderFee(
    productId: string,
    providerId: string
  ): Promise<TransactionFee | null> {
    const [feeConfig] = await db
      .select({
        feeType: productProviders.feeType,
        feeValue: productProviders.feeValue,
        minFee: productProviders.minFee,
        maxFee: productProviders.maxFee
      })
      .from(productProviders)
      .where(
        and(
          eq(productProviders.productId, productId),
          eq(productProviders.providerId, providerId)
        )
      )
      .limit(1);

    return feeConfig || null;
  }

  /**
   * Get referral statistics
   */
  static async getReferralStats(params: ReferralQueryParams): Promise<ReferralStats> {
    const conditions = [];

    if (params.startDate && params.endDate) {
      conditions.push(between(referrals.createdAt, params.startDate, params.endDate));
    }
    if (params.minAmount) {
      conditions.push(sql`${referrals.totalReferralEarnings} >= ${params.minAmount}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [stats] = await db
      .select({
        totalReferrals: sql<number>`sum(${referrals.referralCount})`,
        totalEarnings: sql<string>`cast(sum(${referrals.totalReferralEarnings}) as char)`
      })
      .from(referrals)
      .where(whereClause);

    return {
      totalReferrals: stats?.totalReferrals || 0,
      totalEarnings: stats?.totalEarnings || '0'
    };
  }
}