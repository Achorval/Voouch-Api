// src/routes/admin/system.routes.ts
import { Router } from "express";
import { SystemController } from "../../controllers/admin/system.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import {
  tierLimitSchema,
  updateTierLimitSchema,
  feeConfigSchema,
  auditLogQuerySchema,
  securitySettingsSchema,
} from "../../schemas/admin/system.schema";

const router = Router();

// Apply auth middleware to all routes
// router.use(authenticate);
// router.use(authorize("super_admin")); // Only super admins can access system settings

// Tier Limits routes
router.get("/tier-limits", SystemController.listTierLimits);

router.post(
  "/tier-limits",
  validate(tierLimitSchema),
  SystemController.createTierLimit
);

router.patch(
  "/tier-limits/:id",
  validate(updateTierLimitSchema),
  SystemController.updateTierLimit
);

// Fee Configuration routes
router.post(
  "/products/:productId/providers/:providerId/fees",
  validate(feeConfigSchema),
  SystemController.configureFee
);

// Audit Logs routes
router.get(
  "/audit-logs",
  validate(auditLogQuerySchema),
  SystemController.listAuditLogs
);

// Security Settings routes
router.patch(
  "/users/:userId/security",
  validate(securitySettingsSchema),
  SystemController.updateSecuritySettings
);

export default router;
