// src/routes/user/index.ts

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import profileRoutes from './profile.routes';

const router = Router();

// All user routes require authentication and user authorization
router.use(authenticate);
router.use(authorize('user'));
    
// All admin routes require authentication and admin authorization
// router.use(authenticate);
// router.use(authorize('admin', 'super_admin'));

// Mount all user routes
router.use('/profile', profileRoutes);

export default router;