// // src/services/admin/transaction.service.ts

// import { and, eq, gte, lte, sql } from 'drizzle-orm';
// import { db } from '../../config/database';
// import { transactions, users, categories } from '../../db/schema';
// import { ErrorResponse } from '../../utilities/error';
// import type {
//   Transaction,
//   TransactionWithUser,
//   TransactionListOptions,
//   TransactionListResponse,
//   TransactionStatus
// } from '../../types/admin/transaction.types';

// class TransactionService {
//   static async getTransactionById(id: string): Promise<TransactionWithUser> {
//     const result = await db
//       .select({
//         transaction: transactions,
//         user: {
//           id: users.id,
//           email: users.email,
//           firstName: users.firstName,
//           lastName: users.lastName,
//           phoneNumber: users.phoneNumber
//         },
//         category: {
//           id: categories.id,
//           name: categories.name,
//           code: categories.code
//         }
//       })
//       .from(transactions)
//       .leftJoin(users, eq(transactions.userId, users.id))
//       .leftJoin(categories, eq(transactions.categoryId, categories.id))
//       .where(eq(transactions.id, id))
//       .limit(1);

//     if (!result[0]) {
//       throw ErrorResponse.notFound('Transaction not found');
//     }

//     return {
//       ...result[0].transaction,
//       user: result[0].user,
//       category: result[0].category
//     } as TransactionWithUser;
//   }

//   static async listTransactions(options: TransactionListOptions): Promise<TransactionListResponse> {
//     const {
//       page = 1,
//       limit = 10,
//       status,
//       startDate,
//       endDate,
//       userId,
//       categoryId,
//       paymentMethod,
//       minAmount,
//       maxAmount,
//       reference
//     } = options;

//     const offset = (page - 1) * limit;

//     // Build where conditions
//     const conditions = [];

//     if (status) conditions.push(eq(transactions.status, status));
//     if (startDate) conditions.push(gte(transactions.createdAt, startDate));
//     if (endDate) conditions.push(lte(transactions.createdAt, endDate));
//     if (userId) conditions.push(eq(transactions.userId, userId));
//     if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
//     if (paymentMethod) conditions.push(eq(transactions.paymentMethod, paymentMethod));
//     if (minAmount) conditions.push(gte(sql`CAST(${transactions.amount} AS DECIMAL(19,4))`, minAmount));
//     if (maxAmount) conditions.push(lte(sql`CAST(${transactions.amount} AS DECIMAL(19,4))`, maxAmount));
//     if (reference) conditions.push(eq(transactions.reference, reference));

//     const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

//     // Get total counts and sums
//     const aggregates = await db
//       .select({
//         count: sql<number>`count(*)`,
//         totalAmount: sql<string>`CAST(SUM(${transactions.amount}) AS CHAR)`,
//         totalFees: sql<string>`CAST(SUM(${transactions.fee}) AS CHAR)`
//       })
//       .from(transactions)
//       .where(whereClause);

//     // Get paginated results with user and category info
//     const results = await db
//       .select({
//         transaction: transactions,
//         user: {
//           id: users.id,
//           email: users.email,
//           firstName: users.firstName,
//           lastName: users.lastName,
//           phoneNumber: users.phoneNumber
//         },
//         category: {
//           id: categories.id,
//           name: categories.name,
//           code: categories.code
//         }
//       })
//       .from(transactions)
//       .leftJoin(users, eq(transactions.userId, users.id))
//       .leftJoin(categories, eq(transactions.categoryId, categories.id))
//       .where(whereClause)
//       .limit(limit)
//       .offset(offset)
//       .orderBy(sql`${transactions.createdAt} DESC`);

//     const total = aggregates[0].count;

//     return {
//       transactions: results.map(r => ({
//         ...r.transaction,
//         user: r.user,
//         category: r.category
//       })) as TransactionWithUser[],
//       meta: {
//         total,
//         pages: Math.ceil(total / limit),
//         totalAmount: aggregates[0].totalAmount || '0',
//         totalFees: aggregates[0].totalFees || '0'
//       }
//     };
//   }

//   static async updateTransactionStatus(
//     id: string,
//     status: TransactionStatus,
//     note?: string
//   ): Promise<TransactionWithUser> {
//     const [transaction] = await db
//       .select()
//       .from(transactions)
//       .where(eq(transactions.id, id))
//       .limit(1);

//     if (!transaction) {
//       throw ErrorResponse.notFound('Transaction not found');
//     }

//     // Validate status transition
//     if (!this.isValidStatusTransition(transaction.status, status)) {
//       throw ErrorResponse.badRequest(`Invalid status transition from ${transaction.status} to ${status}`);
//     }

//     const updateData: Partial<Transaction> = {
//       status,
//       updatedAt: new Date(),
//       metadata: {
//         ...transaction.metadata,
//         statusUpdateNote: note,
//         lastStatus: transaction.status
//       }
//     };

//     if (status === 'completed' && !transaction.completedAt) {
//       updateData.completedAt = new Date();
//     }

//     await db
//       .update(transactions)
//       .set(updateData)
//       .where(eq(transactions.id, id));

//     return this.getTransactionById(id);
//   }

//   private static isValidStatusTransition(
//     currentStatus: TransactionStatus,
//     newStatus: TransactionStatus
//   ): boolean {
//     const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
//       pending: ['processing', 'failed'],
//       processing: ['completed', 'failed'],
//       completed: ['reversed'],
//       failed: ['pending'],
//       reversed: [],
//       cancelled: [],
//       refunded: []
//     };

//     return validTransitions[currentStatus].includes(newStatus);
//   }

//   static async getTransactionStats(startDate?: Date, endDate?: Date) {
//     const conditions = [];
//     if (startDate) conditions.push(gte(transactions.createdAt, startDate));
//     if (endDate) conditions.push(lte(transactions.createdAt, endDate));

//     const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

//     const stats = await db
//       .select({
//         totalTransactions: sql<number>`count(*)`,
//         totalAmount: sql<number>`sum(${transactions.amount})`,
//         totalFees: sql<number>`sum(${transactions.fee})`,
//         successfulTransactions: sql<number>`count(case when ${transactions.status} = 'completed' then 1 end)`,
//         failedTransactions: sql<number>`count(case when ${transactions.status} = 'failed' then 1 end)`,
//         avgTransactionValue: sql<number>`avg(${transactions.amount})`
//       })
//       .from(transactions)
//       .where(whereClause);

//     return stats[0];
//   }
// }

// export default TransactionService;

// src/services/admin/transaction.service.ts
import { and, eq, between, or, gte, lte, like, desc, sql } from "drizzle-orm";
import { transactions, users, categories, auditLogs } from "../../db/schema";
import { ErrorResponse } from "../../utilities/error";
import { EmailService } from "../shared/email.service";
import { db } from "../../config/database";
import type {
  TransactionListQueryParams,
  TransactionListResponse,
  TransactionActionDto,
  TransactionStats,
  TransactionWithUser,
} from "../../types/admin/transaction.types";
import { TransactionStatus } from "../../db/schema/transactions";

export class TransactionService {
  /**
   * List transactions with filtering and search
   */
  static async listTransactions(
    params: TransactionListQueryParams
  ): Promise<TransactionListResponse> {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      paymentMethod,
      categoryId,
      reference,
      search,
      userId,
    } = params;

    const offset = (page - 1) * limit;
    const conditions = [];

    // Build filter conditions
    if (status) conditions.push(eq(transactions.status, status));
    if (type) conditions.push(eq(transactions.type, type));
    if (paymentMethod)
      conditions.push(eq(transactions.paymentMethod, paymentMethod));
    if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
    if (reference) conditions.push(eq(transactions.reference, reference));
    if (userId) conditions.push(eq(transactions.userId, userId));

    if (startDate && endDate) {
      conditions.push(between(transactions.createdAt, startDate, endDate));
    }

    if (minAmount !== undefined) {
      conditions.push(
        gte(sql`CAST(${transactions.amount} AS DECIMAL(19,4))`, minAmount)
      );
    }
    if (maxAmount !== undefined) {
      conditions.push(
        lte(sql`CAST(${transactions.amount} AS DECIMAL(19,4))`, maxAmount)
      );
    }

    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(transactions.reference, `%${search}%`),
          like(transactions.externalReference, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get aggregates
    const [aggregates] = await db
      .select({
        count: sql<number>`cast(count(*) as unsigned)`,
        totalAmount: sql<string>`cast(sum(${transactions.amount}) as char)`,
        totalFees: sql<string>`cast(sum(${transactions.fee}) as char)`,
      })
      .from(transactions)
      .where(whereClause);

    // Get transactions with related data
    const results = await db
      .select({
        // Transaction fields
        transaction: transactions,
        // User fields
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phoneNumber: users.phoneNumber,
        },
        // Category fields
        category: {
          id: categories.id,
          name: categories.name,
          code: categories.code,
        },
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      transactions: results.map((r) => ({
        ...r.transaction,
        user: r.user,
        category: r.category,
      })) as TransactionWithUser[],
      meta: {
        total: Number(aggregates?.count || 0),
        pages: Math.ceil(Number(aggregates?.count || 0) / limit),
        page,
        limit,
        totalAmount: aggregates?.totalAmount || "0",
        totalFees: aggregates?.totalFees || "0",
      },
    };
  }

  /**
   * Get transaction details
   */
  static async getTransactionDetails(id: string): Promise<TransactionWithUser> {
    const [transaction] = await db
      .select({
        transaction: transactions,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phoneNumber: users.phoneNumber,
        },
        category: {
          id: categories.id,
          name: categories.name,
          code: categories.code,
        },
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.id, id))
      .limit(1);

    if (!transaction) {
      throw ErrorResponse.notFound("Transaction not found");
    }

    return {
      ...transaction.transaction,
      user: transaction.user,
      category: transaction.category,
    } as TransactionWithUser;
  }

  /**
   * Perform transaction action (approve/decline/reverse)
   */
  static async performTransactionAction(
    id: string,
    adminId: string,
    action: TransactionActionDto
  ): Promise<void> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    if (!transaction) {
      throw ErrorResponse.notFound("Transaction not found");
    }

    // Validate action based on current status
    this.validateTransactionAction(transaction.status, action.action);

    await db.transaction(async (tx) => {
      // Update transaction status
      await tx
        .update(transactions)
        .set({
          status: this.getStatusForAction(action.action) as TransactionStatus,
          metadata: {
            ...transaction.metadata,
            adminAction: {
              action: action.action,
              reason: action.reason,
              timestamp: new Date(),
              adminId,
            },
          },
          completedAt: ["approve", "decline"].includes(action.action)
            ? new Date()
            : null,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, id));

      // Log action in audit logs
      await tx.insert(auditLogs).values({
        userId: transaction.userId,
        type: "transactionAction",
        description: `Transaction ${action.action}ed by admin`,
        metadata: {
          transactionId: id,
          action: action.action,
          reason: action.reason,
        },
        source: "adminPortal",
        createdAt: new Date(),
      });
    });

    // Send notification to user
    await this.sendTransactionNotification(
      transaction.userId,
      action.action,
      transaction
    );
  }

  /**
   * Get transaction statistics
   */
  static async getTransactionStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<TransactionStats> {
    const dateCondition =
      startDate && endDate
        ? between(transactions.createdAt, startDate, endDate)
        : undefined;

    const [stats] = await db
      .select({
        totalTransactions: sql<number>`count(*)`,
        totalAmount: sql<string>`cast(sum(${transactions.amount}) as char)`,
        totalFees: sql<string>`cast(sum(${transactions.fee}) as char)`,
        successfulTransactions: sql<number>`
          sum(case when status = 'completed' then 1 else 0 end)
        `,
        failedTransactions: sql<number>`
          sum(case when status = 'failed' then 1 else 0 end)
        `,
        pendingTransactions: sql<number>`
          sum(case when status = 'pending' then 1 else 0 end)
        `,
        reversedTransactions: sql<number>`
          sum(case when status = 'reversed' then 1 else 0 end)
        `,
      })
      .from(transactions)
      .where(dateCondition);

    // Get today's stats
    const [todayStats] = await db
      .select({
        count: sql<number>`count(*)`,
        amount: sql<string>`cast(sum(${transactions.amount}) as char)`,
        fees: sql<string>`cast(sum(${transactions.fee}) as char)`,
      })
      .from(transactions)
      .where(and(sql`date(${transactions.createdAt}) = current_date`));

    // Get recent activity
    const recentActivity = await db
      .select({
        timestamp: auditLogs.createdAt,
        action: auditLogs.type,
        details: auditLogs.description,
      })
      .from(auditLogs)
      .where(eq(auditLogs.type, "transactionAction"))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);

    return {
      ...stats,
      todayStats: {
        count: todayStats?.count || 0,
        amount: todayStats?.amount || "0",
        fees: todayStats?.fees || "0",
      },
      recentActivity,
    };
  }

  /**
   * Generate transaction report
   */
  static async generateReport(
    params: TransactionListQueryParams
  ): Promise<Buffer> {
    // Implement report generation
    // This could use a library like exceljs or json2csv
    throw new Error("Not implemented");
  }

  private static validateTransactionAction(
    currentStatus: string,
    action: string
  ): void {
    const allowedActions = {
      pending: ["approve", "decline"],
      completed: ["reverse"],
      processing: ["approve", "decline"],
    };

    const allowed =
      allowedActions[currentStatus as keyof typeof allowedActions];
    if (!allowed?.includes(action)) {
      throw ErrorResponse.badRequest(
        `Cannot perform ${action} on transaction with status ${currentStatus}`
      );
    }
  }

  private static getStatusForAction(action: string): string {
    const statusMap = {
      pending: "pending",
      processing: "processing",
      completed: "completed",
      failed: "failed",
      reverse: "reversed",
      cancelled: "cancelled",
      refunded: "refunded",
    };
    return statusMap[action as keyof typeof statusMap];
  }

  private static async sendTransactionNotification(
    userId: string,
    action: string,
    transaction: any
  ): Promise<void> {
    const [user] = await db
      .select({
        email: users.email,
        firstName: users.firstName,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return;

    await EmailService.sendTransactionNotification(
      user.email,
      action,
      transaction
    );
  }
}
