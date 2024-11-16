// src/routes/admin/index.ts

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import providerRoutes from './provider.routes';
import transactionRoutes from './transaction.routes';
import financialRoutes from './financial.routes';
import supportTicketRoutes from './supportTicket.routes';
import userRoutes from './user.routes';
import dashboardRoutes from './dashboard.routes';
import systemRoutes from './system.routes';

const router = Router();

// All admin routes require authentication and admin authorization
router.use(authenticate);
// router.use(authorize('admin', 'super_admin'));

// Mount all admin routes
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/providers', providerRoutes);
router.use('/transactions', transactionRoutes);
router.use('/financial', financialRoutes);
router.use('/support-tickets', supportTicketRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/system', systemRoutes);

export default router;