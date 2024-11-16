// src/routes/admin/financial.routes.ts
import { Router } from 'express';
import { FinancialController } from '../../controllers/admin/financial.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import {
  financialQuerySchema,
  referralQuerySchema,
  productProviderFeeSchema,
} from '../../schemas/admin/financial.schema';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);
router.use(authorize('admin', 'super_admin'));

// Revenue tracking routes
router.get(
  '/transactions/stats',
  validate(financialQuerySchema),
  FinancialController.getTransactionStats
);

router.get(
  '/products/revenue',
  validate(financialQuerySchema),
  FinancialController.getProductRevenue
);

router.get(
  '/providers/revenue',
  validate(financialQuerySchema),
  FinancialController.getProviderRevenue
);

// Fee configuration routes
router.get(
  '/products/:productId/providers/:providerId/fee',
  validate(productProviderFeeSchema),
  FinancialController.getProductProviderFee
);

// Referral routes
router.get(
  '/referrals/stats',
  validate(referralQuerySchema),
  FinancialController.getReferralStats
);

export default router;