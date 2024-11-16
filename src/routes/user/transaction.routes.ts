// src/routes/user/transaction.routes.ts
import { Router } from "express";
import { TransactionController } from "../../controllers/user/transaction.controller";
import { validate } from "../../middleware/validate.middleware";
import {
  transactionHistorySchema,
  transactionDetailsSchema,
  financialSummarySchema,
  spendingAnalyticsSchema,
  generateStatementSchema,
} from "../../schemas/user/transaction.schema";

const router = Router();

// Transaction history and details
router.get(
  "/history",
  validate(transactionHistorySchema),
  TransactionController.getTransactionHistory
);

router.get(
  "/:transactionId",
  validate(transactionDetailsSchema),
  TransactionController.getTransactionDetails
);

// Financial reports
router.get(
  "/summary",
  validate(financialSummarySchema),
  TransactionController.getFinancialSummary
);

router.get(
  "/analytics/spending",
  validate(spendingAnalyticsSchema),
  TransactionController.getSpendingAnalytics
);

// Statement generation
router.get(
  "/statement",
  validate(generateStatementSchema),
  TransactionController.generateStatement
);

export default router;
