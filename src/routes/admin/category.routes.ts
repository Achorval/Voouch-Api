// src/routes/admin/category.routes.ts

import { Router } from "express";
import { CategoryController } from "../../controllers/admin/category.controller";
import { validate } from "../../middleware/validate.middleware";
import {
  createCategorySchema,
  listCategoriesSchema,
  listCategoryProductsSchema,
  updateCategorySchema,
  updateDisplayOrderSchema,
} from "../../schemas/admin/category.schema";

const router = Router();

// Category listing and details
router.get(
  '/',
  validate(listCategoriesSchema),
  CategoryController.listCategories
);

// Get single category
router.get(
  '/:id',
  CategoryController.getCategory
);

// Get category products
router.get(
  '/:id/products',
  validate(listCategoryProductsSchema),
  CategoryController.listCategoryProducts
);

// Category management
// Create category
router.post(
  '/',
  validate(createCategorySchema),
  CategoryController.createCategory
);

// Update category
router.patch(
  '/:id',
  validate(updateCategorySchema),
  CategoryController.updateCategory
);

// Delete category
router.delete("/:id", 
  CategoryController.deleteCategory
);

// Toggle category status
router.post(
  '/:id/toggle',
  CategoryController.toggleStatus
);

router.patch(
  '/:id/display-order',
  validate(updateDisplayOrderSchema),
  CategoryController.updateDisplayOrder
);

export default router;
