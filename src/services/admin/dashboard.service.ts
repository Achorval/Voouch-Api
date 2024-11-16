// src/services/admin/dashboard.service.ts
import { eq, desc, sum, count, between, and, sql } from "drizzle-orm";
import { db } from "../../config/database";
import {
  users,
  transactions,
  categories,
  products,
  kycs,
  providers,
  referrals,
} from "../../db/schema";
import {
  AnalyticsQueryParams,
  DashboardMetrics,
  DashboardStats,
  PerformanceQueryParams,
  RecentTransaction,
  ServicePerformance,
  TopCategory,
  TopServiceProvider,
  UserAnalytics,
} from "../../types/admin/dasboard.types";

export class DashboardService {
  /**
   * Get dashboard metrics
   */
  static async getDashboardMetrics(params: AnalyticsQueryParams): Promise<DashboardMetrics> {
    const conditions = [];
    
    if (params.startDate && params.endDate) {
      conditions.push(between(transactions.createdAt, params.startDate, params.endDate));
    }
    if (params.providerId) {
      conditions.push(eq(transactions.providerId, params.providerId));
    }
    if (params.categoryId) {
      conditions.push(eq(transactions.categoryId, params.categoryId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get transaction metrics
    const [transactionMetrics] = await db
      .select({
        total: sql<number>`count(*)`,
        totalAmount: sql<string>`cast(sum(${transactions.amount}) as char)`,
        totalFees: sql<string>`cast(sum(${transactions.fee}) as char)`,
        completedCount: sql<number>`sum(case when ${transactions.status} = 'completed' then 1 else 0 end)`,
        failedCount: sql<number>`sum(case when ${transactions.status} = 'failed' then 1 else 0 end)`,
        pendingCount: sql<number>`sum(case when ${transactions.status} = 'pending' then 1 else 0 end)`,
        todayCount: sql<number>`sum(case when date(${transactions.createdAt}) = current_date then 1 else 0 end)`,
        todayAmount: sql<string>`cast(sum(case when date(${transactions.createdAt}) = current_date then ${transactions.amount} else 0 end) as char)`
      })
      .from(transactions)
      .where(whereClause);

    // Get user metrics
    const [userMetrics] = await db
      .select({
        total: sql<number>`count(*)`,
        activeUsers: sql<number>`sum(case when ${users.isActive} = 1 then 1 else 0 end)`,
        newUsers: sql<number>`sum(case when date(${users.createdAt}) >= date_sub(current_date, interval 7 day) then 1 else 0 end)`,
        kycVerified: sql<number>`sum(case when ${users.kycLevel} > 0 then 1 else 0 end)`,
        kycPending: sql<number>`sum(case when exists (
          select 1 from ${kycs} where ${kycs.userId} = ${users.id} and ${kycs.status} = 'pending'
        ) then 1 else 0 end)`
      })
      .from(users);

    // Get provider metrics
    const [providerMetrics] = await db
      .select({
        total: sql<number>`count(distinct ${providers.id})`,
        activeProviders: sql<number>`sum(case when ${providers.isEnabled} = 1 then 1 else 0 end)`,
        totalTransactions: sql<number>`count(${transactions.id})`,
        successRate: sql<number>`sum(case when ${transactions.status} = 'completed' then 1 else 0 end) * 100.0 / count(*)`
      })
      .from(providers)
      .leftJoin(transactions, eq(transactions.providerId, providers.id));

    // Get category metrics
    const [categoryMetrics] = await db
      .select({
        total: sql<number>`count(distinct ${categories.id})`,
        activeCategories: sql<number>`sum(case when ${categories.isEnabled} = 1 then 1 else 0 end)`
      })
      .from(categories);

    // Get top categories
    const topCategories = await db
      .select({
        categoryId: categories.id,
        name: categories.name,
        transactionCount: sql<number>`count(${transactions.id})`,
        totalAmount: sql<string>`cast(sum(${transactions.amount}) as char)`
      })
      .from(categories)
      .leftJoin(transactions, eq(transactions.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    return {
      transactions: {
        total: transactionMetrics?.total || 0,
        totalAmount: transactionMetrics?.totalAmount || '0',
        totalFees: transactionMetrics?.totalFees || '0',
        completedCount: transactionMetrics?.completedCount || 0,
        failedCount: transactionMetrics?.failedCount || 0,
        pendingCount: transactionMetrics?.pendingCount || 0,
        todayCount: transactionMetrics?.todayCount || 0,
        todayAmount: transactionMetrics?.todayAmount || '0'
      },
      users: {
        total: userMetrics?.total || 0,
        activeUsers: userMetrics?.activeUsers || 0,
        newUsers: userMetrics?.newUsers || 0,
        kycVerified: userMetrics?.kycVerified || 0,
        kycPending: userMetrics?.kycPending || 0
      },
      providers: {
        total: providerMetrics?.total || 0,
        activeProviders: providerMetrics?.activeProviders || 0,
        totalTransactions: providerMetrics?.totalTransactions || 0,
        successRate: Number(providerMetrics?.successRate?.toFixed(2)) || 0
      },
      categories: {
        total: categoryMetrics?.total || 0,
        activeCategories: categoryMetrics?.activeCategories || 0,
        topCategories: topCategories || []
      }
    };
  }

  /**
   * Get service performance analytics
   */
  static async getServicePerformance1(
    params: PerformanceQueryParams
  ): Promise<ServicePerformance[]> {
    const conditions = [];
    
    if (params.startDate && params.endDate) {
      conditions.push(between(transactions.createdAt, params.startDate, params.endDate));
    }
    if (params.minSuccessRate) {
      conditions.push(sql`
        sum(case when ${transactions.status} = 'completed' then 1 else 0 end) * 100.0 / count(*) >= ${params.minSuccessRate}
      `);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const categoryProviders = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        totalTransactions: sql<number>`count(${transactions.id})`,
        successfulTransactions: sql<number>`sum(case when ${transactions.status} = 'completed' then 1 else 0 end)`,
        failedTransactions: sql<number>`sum(case when ${transactions.status} = 'failed' then 1 else 0 end)`,
        totalAmount: sql<string>`cast(sum(${transactions.amount}) as char)`,
        successRate: sql<number>`sum(case when ${transactions.status} = 'completed' then 1 else 0 end) * 100.0 / count(*)`,
        averageProcessingTime: sql<number>`avg(
          unix_timestamp(${transactions.completedAt}) - unix_timestamp(${transactions.createdAt})
        )`
      })
      .from(categories)
      .leftJoin(transactions, eq(transactions.categoryId, categories.id))
      .where(whereClause)
      .groupBy(categories.id)
      .orderBy(desc(sql`count(*)`))
      .limit(params.limit || 10)
      .offset((params.page || 0) * (params.limit || 10));

    return categoryProviders as ServicePerformance[];
  }

  // src/services/admin/analytics.service.ts
  static async getServicePerformance(
    params: PerformanceQueryParams
  ): Promise<ServicePerformance[]> {
    const conditions = [];
    
    if (params.startDate && params.endDate) {
      conditions.push(between(transactions.createdAt, params.startDate, params.endDate));
    }
    if (params.minSuccessRate) {
      conditions.push(sql`
        sum(case when ${transactions.status} = 'completed' then 1 else 0 end) * 100.0 / count(*) >= ${params.minSuccessRate}
      `);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get category performance
    const categoryPerformance = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        totalTransactions: sql<number>`count(${transactions.id})`,
        successfulTransactions: sql<number>`sum(case when ${transactions.status} = 'completed' then 1 else 0 end)`,
        failedTransactions: sql<number>`sum(case when ${transactions.status} = 'failed' then 1 else 0 end)`,
        totalAmount: sql<string>`cast(sum(${transactions.amount}) as char)`,
        successRate: sql<number>`sum(case when ${transactions.status} = 'completed' then 1 else 0 end) * 100.0 / count(*)`,
        averageProcessingTime: sql<number>`avg(
          unix_timestamp(${transactions.completedAt}) - unix_timestamp(${transactions.createdAt})
        )`
      })
      .from(categories)
      .leftJoin(transactions, eq(transactions.categoryId, categories.id))
      .where(whereClause)
      .groupBy(categories.id)
      .orderBy(desc(sql`count(*)`))
      .limit(params.limit || 10)
      .offset((params.page || 0) * (params.limit || 10));

    // Get provider performance for each category
    const categoryProviders = await Promise.all(
      categoryPerformance.map(async (category) => {
        const providerData = await db
          .select({
            providerId: providers.id,
            providerName: providers.name,
            transactionCount: sql<number>`count(${transactions.id})`,
            successRate: sql<number>`sum(case when ${transactions.status} = 'completed' then 1 else 0 end) * 100.0 / 
              nullif(count(*), 0)`,
            totalAmount: sql<string>`cast(sum(${transactions.amount}) as char)`
          })
          .from(transactions)
          .leftJoin(providers, eq(transactions.providerId, providers.id))
          .where(
            and(
              eq(transactions.categoryId, category.categoryId),
              ...(whereClause ? [whereClause] : [])
            )
          )
          .groupBy(providers.id)
          .orderBy(desc(sql`count(*)`));

        return {
          ...category,
          providers: providerData.map(p => ({
            ...p,
            successRate: Number(p.successRate?.toFixed(2)) || 0,
            transactionCount: p.transactionCount || 0,
            totalAmount: p.totalAmount || '0'
          }))
        };
      })
    );

    return categoryProviders as ServicePerformance[];
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(params: AnalyticsQueryParams): Promise<UserAnalytics> {
    // Get registration trend
    const registrationTrend = await db
      .select({
        date: sql<string>`date(${users.createdAt})`,
        count: sql<number>`count(*)`
      })
      .from(users)
      .where(
        params.startDate && params.endDate
          ? between(users.createdAt, params.startDate, params.endDate)
          : undefined
      )
      .groupBy(sql`date(${users.createdAt})`)
      .orderBy(sql`date(${users.createdAt})`);

    // Get KYC stats
    const kycStats = await db
      .select({
        level: users.kycLevel,
        count: sql<number>`count(*)`
      })
      .from(users)
      .groupBy(users.kycLevel);

    // Calculate total users for percentage
    const [{ total }] = await db
      .select({
        total: sql<number>`count(*)`
      })
      .from(users);

    // Get top users by transaction volume
    const topUsers = await db
      .select({
        userId: users.id,
        transactionCount: sql<number>`count(${transactions.id})`,
        totalAmount: sql<string>`cast(sum(${transactions.amount}) as char)`
      })
      .from(users)
      .leftJoin(transactions, eq(transactions.userId, users.id))
      .groupBy(users.id)
      .orderBy(desc(sql`sum(${transactions.amount})`))
      .limit(10);

    // Get referral stats
    const [referralMetrics] = await db
      .select({
        totalReferrals: sql<number>`sum(${referrals.referralCount})`,
        activeReferrers: sql<number>`count(distinct ${referrals.userId})`,
        totalEarnings: sql<string>`cast(sum(${referrals.totalReferralEarnings}) as char)`
      })
      .from(referrals);

    return {
      registrationTrend,
      kycStats: kycStats.map(stat => ({
        level: stat.level,
        count: stat.count,
        percentage: Number(((stat.count / total) * 100).toFixed(2))
      })),
      transactionStats: {
        activeUsers: topUsers.length,
        averageTransactionSize: 
          topUsers.length > 0 
            ? (
                topUsers.reduce((sum, user) => sum + Number(user.totalAmount), 0) / 
                topUsers.reduce((sum, user) => sum + user.transactionCount, 0)
              ).toFixed(2)
            : '0',
        topUsers
      },
      referralStats: {
        totalReferrals: referralMetrics?.totalReferrals || 0,
        activeReferrers: referralMetrics?.activeReferrers || 0,
        totalEarnings: referralMetrics?.totalEarnings || '0'
      }
    };
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    const [stats] = await db
      .select({
        totalTransactionAmount: sum(transactions.amount).as<number>(),
        totalTransactions: count(transactions.id).as<number>(),
        totalUsers: count(transactions.userId).as("totalUsers"),
        totalWallets: count(transactions.walletId).as("totalWallets"),
      })
      .from(transactions)
      .limit(1);

    return stats as DashboardStats;
  }

  static async getRecentTransactions(
    limit: number
  ): Promise<RecentTransaction[]> {
    const result = await db
      .select({
        id: transactions.id,
        reference: transactions.reference,
        amount: transactions.amount,
        createdAt: transactions.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return result as RecentTransaction[];
  }

  static async getTopCategories(limit: number): Promise<TopCategory[]> {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        code: categories.code,
        transactionCount: count(transactions.id).as<number>(),
        totalAmount: sum(transactions.amount).as<number>(),
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(desc(count(transactions.id)))
      .limit(limit);

    return result as TopCategory[];
  }

  static async getTopServiceProviders(
    limit: number
  ): Promise<TopServiceProvider[]> {
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        code: products.code,
        transactionCount: count(transactions.id).as<number>(),
        totalAmount: sum(transactions.amount).as<number>(),
      })
      .from(transactions)
      .leftJoin(
        products,
        eq(transactions.categoryId, products.categoryId)
      )
      .groupBy(products.id)
      .orderBy(desc(count(transactions.id)))
      .limit(limit);

    return result as TopServiceProvider[];
  }
}
