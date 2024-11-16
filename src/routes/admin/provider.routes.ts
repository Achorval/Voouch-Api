// src/routes/admin/service.routes.ts
import { Router } from 'express';
import { ProductController, ProviderController } from '../../controllers/admin';
import { validate } from '../../middleware/validate.middleware';
// import { authenticate, authorize } from '../../middleware/auth.middleware';
import {
  createProviderSchema,
  updateProviderSchema,
  configureProviderSchema,
} from '../../schemas/admin/provider.schema';

const router = Router();

// Apply auth middleware to all routes
// router.use(authenticate);
// router.use(authorize('admin', 'super_admin'));

// Service Provider routes
router.get(
  '/',
  ProviderController.listProviders
);

router.post(
  '/',
  validate(createProviderSchema),
  ProviderController.createProvider
);

router.get(
  '/:id',
  ProviderController.getProvider
);

router.patch(
  '/:id',
  validate(updateProviderSchema),
  ProviderController.updateProvider
);

router.post(
  '/:id/toggle',
  ProviderController.toggleProvider
);

router.delete(
  '/:id',
  ProviderController.deleteProvider
);

router.post(
  '/:id/providers/:providerId',
  validate(configureProviderSchema),
  ProductController.configureProvider
);

export default router;
