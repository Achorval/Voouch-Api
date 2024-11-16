// src/services/shared/transaction.service.ts
import { and, eq, like, or, desc, between, sql } from 'drizzle-orm';
import { db } from '../../config/database';
import { ErrorResponse } from '../../utilities/error';
import { 
  transactions,
  users,
  categories,
  products,
  providers,
  wallets,
  balances
} from '../../db/schema';
import { formatAmount } from '../../utilities/helper';
import type { 
  TransactionStatus,
  TransactionType,
  PaymentMethod 
} from '../../db/schema/transactions';
import { CreateTransactionInput } from '../../types/user/transaction.types';
import { Transaction } from '../../types/admin/transaction.types';

export class TransactionService {
  /**
   * Create new transaction
   */
  static async createTransaction(
    data: CreateTransactionInput,
    trx?: any
  ): Promise<Transaction> {
    const dbTrx = trx || db;
    const timestamp = new Date();
    const reference = data.reference || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const totalAmount = data.amount + (data.fee || 0);

    await dbTrx
      .insert(transactions)
      .values({
        userId: data.userId,
        walletId: data.walletId,
        categoryId: data.categoryId,
        productId: data.productId,
        providerId: data.providerId,
        type: data.type,
        status: data.status || 'pending',
        amount: data.amount.toString(),
        fee: (data.fee || 0).toString(),
        total: totalAmount.toString(),
        paymentMethod: data.paymentMethod,
        reference,
        description: data.description,
        serviceData: data.serviceData,
        metadata: data.metadata,
        createdAt: timestamp,
        updatedAt: timestamp
      });

    const [transaction] = await dbTrx
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.reference, reference),
          eq(transactions.userId, data.userId)
        )
      )
      .limit(1);

    return transaction;
  }

  /**
   * Update transaction
   */
  static async updateTransaction(
    id: string, 
    data: {
      status?: TransactionStatus;
      providerReference?: string;
      providerData?: Record<string, any>;
      metadata?: Record<string, any>;
    },
    trx?: any
  ): Promise<void> {
    const dbTrx = trx || db;
    
    await dbTrx
      .update(transactions)
      .set({
        ...data,
        updatedAt: new Date(),
        ...(data.status === 'completed' && { completedAt: new Date() })
      })
      .where(eq(transactions.id, id));
  }

  /**
   * Get transaction history with filters
   */
  static async getTransactionHistory(userId: string, params: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    type?: TransactionType;
    status?: TransactionStatus;
    categoryId?: string;
    search?: string;
    walletId?: string;
  }) {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      type,
      status,
      categoryId,
      search,
      walletId
    } = params;

    const offset = (page - 1) * limit;
    const conditions = [eq(transactions.userId, userId)];

    if (startDate && endDate) {
      conditions.push(between(transactions.createdAt, startDate, endDate));
    }
    if (type) {
      conditions.push(eq(transactions.type, type));
    }
    if (status) {
      conditions.push(eq(transactions.status, status));
    }
    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId));
    }
    if (walletId) {
      conditions.push(eq(transactions.walletId, walletId));
    }
    if (search) {
      conditions.push(
        or(
          like(transactions.reference, `%${search}%`),
          like(transactions.description, `%${search}%`)
        )
      );
    }

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await db
      .select({
        count: sql<number>`cast(count(*) as unsigned)`
      })
      .from(transactions)
      .where(whereClause);

    // Get transactions with related data
    const results = await db
      .select({
        transaction: transactions,
        category: {
          id: categories.id,
          name: categories.name,
          code: categories.code
        },
        product: products.name,
        provider: providers.name
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(products, eq(transactions.productId, products.id))
      .leftJoin(providers, eq(transactions.providerId, providers.id))
      .where(whereClause)
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get summary statistics
    const [summary] = await db
      .select({
        totalAmount: sql<string>`cast(sum(case when type = 'debit' then amount else 0 end) as char)`,
        totalIncoming: sql<string>`cast(sum(case when type = 'credit' then amount else 0 end) as char)`,
        totalOutgoing: sql<string>`cast(sum(case when type = 'debit' then amount else 0 end) as char)`,
        totalFees: sql<string>`cast(sum(fee) as char)`
      })
      .from(transactions)
      .where(whereClause);

    return {
      transactions: results,
      summary: {
        totalIncoming: summary?.totalIncoming || '0',
        totalOutgoing: summary?.totalOutgoing || '0',
        totalFees: summary?.totalFees || '0'
      },
      meta: {
        total: Number(countResult?.count || 0),
        pages: Math.ceil(Number(countResult?.count || 0) / limit),
        page,
        limit
      }
    };
  }

  /**
   * Get transaction details
   */
  static async getTransactionDetails(userId: string, transactionId: string) {
    const [transaction] = await db
      .select({
        transaction: transactions,
        category: {
          id: categories.id,
          name: categories.name,
          code: categories.code
        },
        product: {
          id: products.id,
          name: products.name,
          code: products.code
        },
        provider: {
          id: providers.id,
          name: providers.name,
          code: providers.code
        },
        wallet: wallets
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(products, eq(transactions.productId, products.id))
      .leftJoin(providers, eq(transactions.providerId, providers.id))
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.userId, userId)
        )
      )
      .limit(1);

    if (!transaction) {
      throw ErrorResponse.notFound('Transaction not found');
    }

    return transaction;
  }

  /**
   * Get financial summary for dashboard
   */
  static async getFinancialSummary(userId: string, params: {
    startDate?: Date;
    endDate?: Date;
    walletId?: string;
  }) {
    const { startDate, endDate, walletId } = params;
    const conditions = [eq(transactions.userId, userId)];

    if (startDate && endDate) {
      conditions.push(between(transactions.createdAt, startDate, endDate));
    }
    if (walletId) {
      conditions.push(eq(transactions.walletId, walletId));
    }

    const [summary] = await db
      .select({
        totalTransactions: sql<number>`count(*)`,
        totalVolume: sql<string>`cast(sum(amount) as char)`,
        incomingVolume: sql<string>`cast(sum(case when type = 'credit' then amount else 0 end) as char)`,
        outgoingVolume: sql<string>`cast(sum(case when type = 'debit' then amount else 0 end) as char)`,
        successfulTransactions: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
        failedTransactions: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
        pendingTransactions: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
        totalFees: sql<string>`cast(sum(fee) as char)`
      })
      .from(transactions)
      .where(and(...conditions));

    // Get category breakdown
    const categoryBreakdown = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        count: sql<number>`count(*)`,
        totalAmount: sql<string>`cast(sum(amount) as char)`
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(transactions.categoryId, categories.name)
      .orderBy(desc(sql`count(*)`));

    // Get recent transactions
    const recentTransactions = await db
      .select({
        transaction: transactions,
        category: categories
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt))
      .limit(5);

    return {
      summary: {
        ...summary,
        successRate: summary && summary.totalTransactions > 0 
          ? ((summary.successfulTransactions / summary.totalTransactions) * 100).toFixed(2)
          : '0'
      },
      categoryBreakdown,
      recentTransactions
    };
  }

  /**
   * Get spending analytics
   */
  static async getSpendingAnalytics(userId: string, params: {
    startDate: Date;
    endDate: Date;
    walletId?: string;
  }) {
    const { startDate, endDate, walletId } = params;
    const conditions = [
      eq(transactions.userId, userId),
      eq(transactions.type, 'debit'),
      between(transactions.createdAt, startDate, endDate)
    ];

    if (walletId) {
      conditions.push(eq(transactions.walletId, walletId));
    }

    // Daily spending trend
    const dailyTrend = await db
      .select({
        date: sql<string>`DATE(${transactions.createdAt})`,
        totalAmount: sql<string>`cast(sum(amount) as char)`,
        count: sql<number>`count(*)`
      })
      .from(transactions)
      .where(and(...conditions))
      .groupBy(sql`DATE(${transactions.createdAt})`)
      .orderBy(sql`DATE(${transactions.createdAt})`);

    // Category-wise spending
    const categorySpending = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        totalAmount: sql<string>`cast(sum(amount) as char)`,
        count: sql<number>`count(*)`
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(transactions.categoryId, categories.name)
      .orderBy(desc(sql`sum(amount)`));

    return {
      dailyTrend,
      categorySpending
    };
  }

  /**
   * Generate transaction statement
   */
  static async generateStatement(userId: string, params: {
    startDate: Date;
    endDate: Date;
    walletId?: string;
    format?: 'csv' | 'pdf';
  }) {
    const { startDate, endDate, walletId, format = 'csv' } = params;
    const conditions = [
      eq(transactions.userId, userId),
      between(transactions.createdAt, startDate, endDate)
    ];

    if (walletId) {
      conditions.push(eq(transactions.walletId, walletId));
    }

    // Get transactions
    const records = await db
      .select({
        date: sql<string>`DATE_FORMAT(${transactions.createdAt}, '%Y-%m-%d %H:%i:%s')`,
        reference: transactions.reference,
        description: transactions.description,
        type: transactions.type,
        amount: transactions.amount,
        fee: transactions.fee,
        status: transactions.status,
        category: categories.name
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt));

    // Get summary
    const [summary] = await db
      .select({
        totalTransactions: sql<number>`count(*)`,
        totalAmount: sql<string>`cast(sum(amount) as char)`,
        totalFees: sql<string>`cast(sum(fee) as char)`,
        creditAmount: sql<string>`cast(sum(case when type = 'credit' then amount else 0 end) as char)`,
        debitAmount: sql<string>`cast(sum(case when type = 'debit' then amount else 0 end) as char)`
      })
      .from(transactions)
      .where(and(...conditions));

    // Format based on requested type
    if (format === 'csv') {
      // Return CSV formatted data
      const csvRows = records.map(record => [
        record.date,
        record.reference,
        record.description,
        record.type,
        formatAmount(Number(record.amount)),
        formatAmount(Number(record.fee)),
        record.status,
        record.category
      ].join(','));

      return {
        content: [
          'Date,Reference,Description,Type,Amount,Fee,Status,Category',
          ...csvRows
        ].join('\n'),
        filename: `transaction_statement_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`
      };
    }

    // For PDF format, return structured data to be formatted by PDF generation service
    return {
      transactions: records,
      summary,
      period: {
        startDate,
        endDate
      }
    };
  }
}