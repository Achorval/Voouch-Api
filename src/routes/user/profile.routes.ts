// src/routes/user/profile.routes.ts
import { Router } from "express";
import { ProfileController } from "../../controllers/user";
import { validate } from "../../middleware/validate.middleware";
import {
  updateProfileSchema,
  changePasswordSchema,
  updateSecuritySchema,
  setTransactionPinSchema,
  changeTransactionPinSchema,
} from "../../schemas/user/profile.schema";

const router = Router();

// Profile management
router.get("/me", ProfileController.getProfile);

router.patch(
  "/update-profile",
  validate(updateProfileSchema),
  ProfileController.updateProfile
);
router.post("/avatar", ProfileController.updateAvatar);

// Password management
router.post(
  "/change-password",
  validate(changePasswordSchema),
  ProfileController.changePassword
);

// Security settings
router.patch(
  "/security",
  validate(updateSecuritySchema),
  ProfileController.updateSecurity
);

// Transaction PIN
router.post(
  "/transaction-pin",
  validate(setTransactionPinSchema),
  ProfileController.setTransactionPin
);

router.post(
  "/change-transaction-pin",
  validate(changeTransactionPinSchema),
  ProfileController.changeTransactionPin
);

export default router;
