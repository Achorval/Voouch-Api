// src/routes/admin/dashboard.routes.ts
import { Router } from "express";
import { DashboardController } from "../../controllers/admin/dashboard.controller";
import {
  analyticsQuerySchema,
  performanceQuerySchema,
} from "../../schemas/admin/dashboard.schema";
import { validate } from "../../middleware/validate.middleware";

const router = Router();

// Dashboard metrics route
router.get(
  "/dashboard",
  validate(analyticsQuerySchema),
  DashboardController.getDashboardMetrics
);

// Service performance route
router.get(
  "/performance",
  validate(performanceQuerySchema),
  DashboardController.getServicePerformance
);

// User analytics route
router.get(
  "/users",
  validate(analyticsQuerySchema),
  DashboardController.getUserAnalytics
);

router.get("/stats", DashboardController.getDashboardStats);
router.get("/recent-transactions", DashboardController.getRecentTransactions);
router.get("/top-categories", DashboardController.getTopCategories);
router.get(
  "/top-service-providers",
  DashboardController.getTopServiceProviders
);

export default router;
