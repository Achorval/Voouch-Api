// src/controllers/user/transaction.controller.ts
import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../../services/user';
import { SuccessResponse } from '../../utilities/success';
import { ErrorResponse } from '../../utilities/error';

export class TransactionController {
  /**
   * Get transaction history
   */
  static async getTransactionHistory(
    req: Request<
      {},
      {},
      {},
      {
        page?: string;
        limit?: string;
        startDate?: string;
        endDate?: string;
        type?: string;
        status?: string;
        categoryId?: string;
        search?: string;
        walletId?: string;
      }
    >,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const result = await TransactionService.getTransactionHistory(req.user.id, {
        page: req.query.page ? parseInt(req.query.page) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        type: req.query.type as any,
        status: req.query.status as any,
        categoryId: req.query.categoryId,
        search: req.query.search,
        walletId: req.query.walletId
      });
      
      SuccessResponse.ok(res, {
        data: result.transactions,
        meta: {
          ...result.meta,
          summary: result.summary
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction details
   */
  static async getTransactionDetails(
    req: Request<{ transactionId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const transaction = await TransactionService.getTransactionDetails(
        req.user.id,
        req.params.transactionId
      );
      
      SuccessResponse.ok(res, {
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get financial summary
   */
  static async getFinancialSummary(
    req: Request<
      {},
      {},
      {},
      {
        startDate?: string;
        endDate?: string;
        walletId?: string;
      }
    >,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const summary = await TransactionService.getFinancialSummary(req.user.id, {
        startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        walletId: req.query.walletId
      });
      
      SuccessResponse.ok(res, {
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get spending analytics
   */
  static async getSpendingAnalytics(
    req: Request<
      {},
      {},
      {},
      {
        startDate: string;
        endDate: string;
        walletId?: string;
      }
    >,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const analytics = await TransactionService.getSpendingAnalytics(req.user.id, {
        startDate: new Date(req.query.startDate),
        endDate: new Date(req.query.endDate),
        walletId: req.query.walletId
      });
      
      SuccessResponse.ok(res, {
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate statement
   */
  static async generateStatement(
    req: Request<
      {},
      {},
      {},
      {
        startDate: string;
        endDate: string;
        walletId?: string;
        format?: 'csv' | 'pdf';
      }
    >,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const statement = await TransactionService.generateStatement(req.user.id, {
        startDate: new Date(req.query.startDate),
        endDate: new Date(req.query.endDate),
        walletId: req.query.walletId,
        format: req.query.format
      });

      if (req.query.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${statement.filename}`
        );
        res.send(statement.content);
      } else {
        // For PDF format
        SuccessResponse.ok(res, {
          data: statement
        });
      }
    } catch (error) {
      next(error);
    }
  }
}