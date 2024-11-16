// src/routes/admin/product.routes.ts
import { Router } from 'express';
import { ProductController } from '../../controllers/admin';
import { validate } from '../../middleware/validate.middleware';
// import { authenticate, authorize } from '../../middleware/auth.middleware';
import {
  createProductSchema,
  updateProductSchema,
  maintenanceModeSchema
} from '../../schemas/admin/product.schema';

const router = Router();

// Apply auth middleware to all routes
// router.use(authenticate);
// router.use(authorize('admin', 'super_admin'));

// Product routes
router.get(
  '/',
  ProductController.listProducts
);

router.post(
  '/',
  validate(createProductSchema),
  ProductController.createProduct
);

router.get(
  '/:id',
  ProductController.getProduct
);

router.patch(
  '/:id',
  validate(updateProductSchema),
  ProductController.updateProduct
);

// Toggle category status
router.post(
  '/:id/toggle',
  ProductController.toggleStatus
);

router.post(
  '/:id/maintenance',
  validate(maintenanceModeSchema),
  ProductController.toggleMaintenance
);

export default router;
