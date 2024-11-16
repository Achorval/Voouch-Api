// src/routes/admin/user.routes.ts
import { Router } from "express";
import { UserController } from "../../controllers/admin/user.controller";
import { validate } from "../../middleware/validate.middleware";
import {
  createUserSchema,
  listKycSchema,
  listUsersSchema,
  resetSecuritySchema,
  reviewKycSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from "../../schemas/admin/user.schema";

const router = Router();

// Get user stats
router.get("/stats", UserController.getUserStats);

// List users
router.get("/", UserController.listUsers);

// Create user
router.post("/", validate(createUserSchema), UserController.createUser);

// Get single user
router.get("/:id", UserController.getUserDetails);

// Update user
router.patch("/:id", validate(updateUserSchema), UserController.updateUser);

// Update user status
router.patch(
  "/:id/status",
  validate(updateUserStatusSchema),
  UserController.updateUserStatus
);

// Reset user password
router.post("/:id/reset-password", UserController.resetUserPassword);

// Update user KYC level
router.patch("/:id/kyc", UserController.updateUserKYC);

// Delete user
router.delete("/:id", UserController.deleteUser);

router.get("/export", validate(listUsersSchema), UserController.exportUsers);

router.post(
  "/:id/security/reset",
  validate(resetSecuritySchema),
  UserController.resetSecurity
);

// KYC Overview
router.get(
  '/kyc',
  validate(listKycSchema),
  UserController.listVerifications
);

router.get(
  '/kyc/stats',
  UserController.getKycStats
);

// KYC Details and Review
router.get(
  '/kyc/:id',
  UserController.getVerificationDetails
);

router.post(
  '/kyc/:id/review',
  validate(reviewKycSchema),
  UserController.reviewVerification
);

export default router;
