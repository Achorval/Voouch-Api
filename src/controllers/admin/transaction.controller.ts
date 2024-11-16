// // src/controllers/admin/transaction.controller.ts

// import { Request, Response, NextFunction } from "express";
// import TransactionService from "../../services/admin/transaction.service";
// import { SuccessResponse } from "../../utilities/success";
// import type { TransactionStatus } from "../../types/admin/transaction.types";

// export class TransactionController {
//   static async getTransaction(
//     req: Request<{ id: string }>,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       const transaction = await TransactionService.getTransactionById(
//         req.params.id
//       );

//       SuccessResponse.ok(res, {
//         data: transaction,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async listTransactions(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       const {
//         page,
//         limit,
//         status,
//         startDate,
//         endDate,
//         userId,
//         categoryId,
//         paymentMethod,
//         minAmount,
//         maxAmount,
//         reference,
//       } = req.query;

//       const result = await TransactionService.listTransactions({
//         page: page ? parseInt(page as string) : undefined,
//         limit: limit ? parseInt(limit as string) : undefined,
//         status: status as TransactionStatus,
//         startDate: startDate ? new Date(startDate as string) : undefined,
//         endDate: endDate ? new Date(endDate as string) : undefined,
//         userId: userId as string,
//         categoryId: categoryId as string,
//         paymentMethod: paymentMethod as any,
//         minAmount: minAmount ? parseInt(minAmount as string) : undefined,
//         maxAmount: maxAmount ? parseInt(maxAmount as string) : undefined,
//         reference: reference as string,
//       });

//       SuccessResponse.ok(res, {
//         data: result.transactions,
//         meta: result.meta,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async updateTransactionStatus(
//     req: Request<
//       { id: string },
//       {},
//       { status: TransactionStatus; note?: string }
//     >,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       const transaction = await TransactionService.updateTransactionStatus(
//         req.params.id,
//         req.body.status,
//         req.body.note
//       );

//       SuccessResponse.ok(res, {
//         message: "Transaction status updated successfully",
//         data: transaction,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async getTransactionStats(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       const { startDate, endDate } = req.query;

//       const stats = await TransactionService.getTransactionStats(
//         startDate ? new Date(startDate as string) : undefined,
//         endDate ? new Date(endDate as string) : undefined
//       );

//       SuccessResponse.ok(res, {
//         data: stats,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// }

// src/controllers/admin/transaction.controller.ts
import { Request, Response, NextFunction } from "express";
import { TransactionService } from "../../services/admin";
import { SuccessResponse } from "../../utilities/success";
import { ErrorResponse } from "../../utilities/error";
import type {
  TransactionListQueryParams,
  TransactionActionDto,
} from "../../types/admin/transaction.types";

export class TransactionController {
  /**
   * List transactions with filtering
   */
  static async listTransactions(
    req: Request<{}, {}, {}, TransactionListQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await TransactionService.listTransactions(req.query);

      SuccessResponse.ok(res, {
        data: result.transactions,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction details
   */
  static async getTransactionDetails(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const transaction = await TransactionService.getTransactionDetails(
        req.params.id
      );

      SuccessResponse.ok(res, {
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Perform transaction action (approve/decline/reverse)
   */
  static async performTransactionAction(
    req: Request<{ id: string }, {}, TransactionActionDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized("Admin ID is required");
      }

      await TransactionService.performTransactionAction(
        req.params.id,
        req.user.id,
        req.body
      );

      SuccessResponse.ok(res, {
        message: `Transaction ${req.body.action}ed successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction statistics
   */
  static async getTransactionStats(
    req: Request<{}, {}, {}, { startDate?: string; endDate?: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { startDate, endDate } = req.query;
      const stats = await TransactionService.getTransactionStats(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      SuccessResponse.ok(res, {
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export transactions report
   */
  static async exportTransactions(
    req: Request<{}, {}, {}, TransactionListQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const report = await TransactionService.generateReport(req.query);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=transactions.xlsx"
      );

      res.send(report);
    } catch (error) {
      next(error);
    }
  }
}
