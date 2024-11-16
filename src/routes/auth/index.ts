// src/routes/public/auth.routes.ts
import { Router } from "express";
import { authenticate } from "../../middleware";
import { AuthController } from "../../controllers/shared";
import { validate } from "../../middleware/validate.middleware";
// import { VerificationController } from '../../controllers/shared';
import {
  registerSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  resetPasswordSchema,
} from "../../schemas/shared";
// import { 
//   emailVerificationSchema, 
//   phoneVerificationSchema 
// } from '../../schemas/shared';

const router = Router();

// Public routes
router.post("/register", validate(registerSchema), AuthController.register);

router.post("/login", validate(loginSchema), AuthController.login);

// Protected routes (require authentication)
// router.use(authenticate);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

// Token management
router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  AuthController.refreshToken
);

router.post(
  "/logout",
  authenticate,
  validate(logoutSchema),
  AuthController.logout
);

// Public routes
// router.post(
//   '/verify-email',
//   validate(emailVerificationSchema),
//   VerificationController.verifyEmail
// );

router.post(
  '/me',
  AuthController.getCurrentUser
);

// Protected routes
// router.post(
//   '/verify-phone',
//   authenticate,
//   validate(phoneVerificationSchema),
//   VerificationController.verifyPhone
// );

// router.post(
//   '/resend-email-verification',
//   authenticate,
//   VerificationController.resendEmailVerification
// );

// router.post(
//   '/resend-phone-verification',
//   authenticate,
//   VerificationController.resendPhoneVerification
// );

export default router;
