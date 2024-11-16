// src/routes/auth/verification.routes.ts
import { Router } from 'express';
import { VerificationController } from '../../controllers/shared/verification.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { 
  emailVerificationSchema, 
  phoneVerificationSchema 
} from '../../schemas/shared/verification.schema';

const router = Router();



export default router;