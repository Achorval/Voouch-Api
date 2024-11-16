// // routes/user/wallet.routes.ts
// import { Router } from 'express';
// import { WalletController } from '../../controllers/user/wallet.controller';
// import { validate } from '../../middleware/validate.middleware';
// import { authenticate } from '../../middleware/auth.middleware';
// import { checkPin } from '../../middleware/transaction.middleware';
// import {
//     TransferSchema,
//     WalletCreationSchema,
//     TransactionHistorySchema
// } from '../../schemas/user/wallet.schema';

// const router = Router();
// const walletController = new WalletController();

// // Wallet Management
// router.post(
//     '/create',
//     authenticate,
//     validate(WalletCreationSchema),
//     walletController.createWallet
// );

// router.get(
//     '/:walletId/balance',
//     authenticate,
//     walletController.getBalance
// );

// // Transfers
// router.post(
//     '/:fromWalletId/transfer',
//     authenticate,
//     checkPin,
//     validate(TransferSchema),
//     walletController.transferFunds
// );

// // Transactions
// router.get(
//     '/transactions',
//     authenticate,
//     validate(TransactionHistorySchema, 'query'),
//     walletController.getTransactionHistory
// );

// // Statements
// router.post(
//     '/statement',
//     authenticate,
//     validate(TransactionHistorySchema),
//     walletController.generateStatement
// );

// // Additional Wallet Operations
// router.post(
//     '/:walletId/set-default',
//     authenticate,
//     walletController.setDefaultWallet
// );

// router.post(
//     '/:walletId/freeze',
//     authenticate,
//     checkPin,
//     walletController.freezeWallet
// );

// router.post(
//     '/:walletId/unfreeze',
//     authenticate,
//     checkPin,
//     walletController.unfreezeWallet
// );

// export default router;

import { Router } from "express";
import { WalletController } from "../../controllers/user/wallet.controller";
import { validate } from "../../middleware/validate.middleware";
import {
  transferSchema,
  moneyRequestSchema,
  processMoneyRequestSchema,
  statementSchema,
} from "../../schemas/user/wallet.schema";

const router = Router();

// Wallet routes
router.get("/", WalletController.listWallets);
router.get("/:walletId/balance", WalletController.getBalance);
router.post(
  "/:walletId/transfer",
  validate(transferSchema),
  WalletController.transfer
);
router.post(
  "/request-money",
  validate(moneyRequestSchema),
  WalletController.requestMoney
);
router.post(
  "/money-requests/:requestId",
  validate(processMoneyRequestSchema),
  WalletController.processMoneyRequest
);
router.get(
  "/:walletId/statement",
  validate(statementSchema),
  WalletController.generateStatement
);
router.post("/:walletId/set-default", WalletController.setDefaultWallet);

export default router;
