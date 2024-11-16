// // src/routes/index.ts

import { Router } from 'express';
import publicRoutes from './auth';
// import userRoutes from './user';
import adminRoutes from './admin';

const router = Router();

// Public routes
router.use('/auth', publicRoutes);

// Protected user routes
// router.use('/users', userRoutes);

// Admin routes
router.use('/admin', adminRoutes);

export default router;