// // src/routes/admin/transaction.routes.ts

// import { Router } from 'express';
// import { TransactionController } from '../../controllers/admin/transaction.controller';
// import { validate } from '../../middleware/validate.middleware';
// import { transactionFilterSchema } from '../../schemas/admin/transaction.schema';
// import { z } from 'zod';

// const router = Router();

// // Get transaction stats
// router.get('/stats', TransactionController.getTransactionStats);

// // List transactions with filters
// router.get(
//   '/',
//   validate(transactionFilterSchema),
//   TransactionController.listTransactions
// );

// // Get single transaction
// router.get(
//   '/:id',
//   validate(z.object({
//     params: z.object({
//       id: z.string().uuid('Invalid transaction ID')
//     })
//   })),
//   TransactionController.getTransaction
// );

// // Update transaction status
// router.patch(
//   '/:id/status',
//   validate(z.object({
//     params: z.object({
//       id: z.string().uuid('Invalid transaction ID')
//     }),
//     body: z.object({
//       status: z.enum(['pending', 'processing', 'completed', 'failed', 'reversed']),
//       note: z.string().optional()
//     })
//   })),
//   TransactionController.updateTransactionStatus
// );

// export default router;

// src/routes/admin/transaction.routes.ts
import { Router } from "express";
import { TransactionController } from "../../controllers/admin/transaction.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import {
  listTransactionsSchema,
  transactionActionSchema,
  transactionStatsSchema,
} from "../../schemas/admin/transaction.schema";

const router = Router();

// Apply auth middleware to all routes
// router.use(authenticate);
// router.use(authorize("admin", "super_admin"));

// Transaction listing and details
router.get(
  "/",
  validate(listTransactionsSchema),
  TransactionController.listTransactions
);

router.get(
  "/export",
  validate(listTransactionsSchema),
  TransactionController.exportTransactions
);

router.get(
  "/stats",
  validate(transactionStatsSchema),
  TransactionController.getTransactionStats
);

router.get("/:id", TransactionController.getTransactionDetails);

// Transaction actions
router.post(
  "/:id/action",
  validate(transactionActionSchema),
  TransactionController.performTransactionAction
);

export default router;
