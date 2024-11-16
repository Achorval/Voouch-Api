// src/controllers/admin/category.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../../services/admin';
import { SuccessResponse } from '../../utilities/success';
import { handleUploadIcon } from '../../middleware';
import type { 
  CategoryListQueryParams, 
  CreateCategoryDto,
  UpdateCategoryDto 
} from '../../types/admin/category.types';
import { UploadService } from '../../services/shared';

export class CategoryController {
  /**
   * List categories with product counts
   */
  static async listCategories(
    req: Request<{}, {}, {}, CategoryListQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await CategoryService.listCategories(req.query);
      
      SuccessResponse.ok(res, {
        message: "Categories retrieved successfully!",
        data: result.categories,
        meta: result.meta
      });
    } catch (error) {
      console.log(error)
      next(error);
    }
  }

  /**
   * Create new category
   */
  static async createCategory(
    req: Request<{}, {}, CreateCategoryDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      console.log(req.body)
      const category = await CategoryService.createCategory(req.body);
      
      SuccessResponse.created(res, {
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update category
   */
  static async updateCategory(
    req: Request<{ id: string }, {}, UpdateCategoryDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Get existing category to check if icon needs to be deleted
      const existingProvider = await CategoryService.getCategory(req.params.id);
      let iconUrl: string | undefined;

      try {
        // Handle file upload
        const uploadResult = await handleUploadIcon(req);
        
        // If file was uploaded
        if (uploadResult.buffer) {
          // Delete old icon if exists
          if (existingProvider.icon) {
            await UploadService.deleteFromCloud(existingProvider.icon)
              .catch(error => {
                console.warn('Failed to delete old icon:', error);
              });
          }

          // Upload new icon
          iconUrl = await UploadService.uploadToCloud(
            uploadResult, 
            'categories'
          );
        }
      } catch (error: any) {
        if (error.message !== 'No file uploaded') {
          throw error;
        }
      }

      const category = await CategoryService.updateCategory(req.params.id,
        {
          ...req.body,
          ...(iconUrl !== undefined && { icon: iconUrl })
        }
      );
      
      SuccessResponse.ok(res, {
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle category status
   */
  static async toggleStatus(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const category = await CategoryService.toggleStatus(req.params.id);
      
      SuccessResponse.ok(res, {
        message: `Category ${category.isEnabled ? 'enabled' : 'disabled'} successfully`,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update category display order
   */
  static async updateDisplayOrder(
    req: Request<{ id: string }, {}, { displayOrder: number }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const category = await CategoryService.updateDisplayOrder(
        req.params.id,
        req.body.displayOrder
      );
      
      SuccessResponse.ok(res, {
        message: 'Category display order updated successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category details
   */
  static async getCategory(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const category = await CategoryService.getCategory(req.params.id);
      
      SuccessResponse.ok(res, {
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List category products
   */
  static async listCategoryProducts(
    req: Request<{ id: string }, {}, {}, { page?: string; limit?: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { page, limit } = req.query;
      const result = await CategoryService.listCategoryProducts(
        req.params.id,
        page ? parseInt(page) : undefined,
        limit ? parseInt(limit) : undefined
      );
      
      SuccessResponse.ok(res, {
        data: result.products,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  }

  // Also handle deletion in the delete category method
  static async deleteCategory(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const category = await CategoryService.getCategory(req.params.id);
      
      // Delete icon from Cloudinary if it exists
      if (category.icon) {
        await UploadService.deleteFromCloud(category.icon)
          .catch(error => {
            console.warn('Failed to delete category icon:', error);
          });
      }

      await CategoryService.deleteCategory(req.params.id);
      
      SuccessResponse.ok(res, {
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}