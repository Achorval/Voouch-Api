// src/controllers/admin/product.controller.ts
import { Request, Response, NextFunction } from "express";
import { ProductService } from "../../services/admin";
import { SuccessResponse } from "../../utilities/success";
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductListQueryParams,
} from "../../types/admin/service.types";
import { handleUploadIcon } from "../../middleware/upload.middleware";
import { UploadService } from "../../services/shared/upload.service";

export class ProductController {
  static async listProducts(
    req: Request<{}, {}, {}, ProductListQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await ProductService.listProducts(req.query);

      SuccessResponse.ok(res, {
        message: "Products retrieved successfully!",
        data: result.products,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(
    req: Request<{}, {}, CreateProductDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const product = await ProductService.createProduct(req.body);

      SuccessResponse.created(res, {
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(
    req: Request<{ id: string }, {}, UpdateProductDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Get existing product to check if icon needs to be deleted
      const existingProduct = await ProductService.getProduct(req.params.id);
      let iconUrl: string | undefined;

      try {
        // Handle file upload
        const uploadResult = await handleUploadIcon(req);

        // If file was uploaded
        if (uploadResult.buffer) {
          // Delete old icon if exists
          if (existingProduct.icon) {
            console.log("Deleting old icon:", existingProduct.icon);
            await UploadService.deleteFromCloud(existingProduct.icon).catch(
              (error) => {
                console.warn("Failed to delete old icon:", error);
              }
            );
          }

          // Upload new icon
          iconUrl = await UploadService.uploadToCloud(
            uploadResult,
            "categories"
          );
        }
      } catch (error: any) {
        // If error is not "no file uploaded", rethrow it
        if (!error.message.includes("No file uploaded")) {
          throw error;
        }
      }

      // Update product
      const product = await ProductService.updateProduct(req.params.id, {
        ...req.body,
        ...(iconUrl && { icon: iconUrl }),
      });

      SuccessResponse.ok(res, {
        message: "Product updated successfully",
        data: product,
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
      const category = await ProductService.toggleStatus(req.params.id);
      
      SuccessResponse.ok(res, {
        message: `Product ${category.isEnabled ? 'enabled' : 'disabled'} successfully`,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async configureProvider(
    req: Request<
      { id: string; providerId: string },
      {},
      {
        providerProductCode: string;
        priority: number;
        isDefault: boolean;
        feeType: "flat" | "percentage";
        feeValue: string;
        minFee?: string;
        maxFee?: string;
        endpoints?: Record<string, any>;
      }
    >,
    res: Response,
    next: NextFunction
  ) {
    try {
      const config = await ProductService.configureProvider(
        req.params.id,
        req.params.providerId,
        req.body
      );

      SuccessResponse.ok(res, {
        message: "Provider configuration updated successfully",
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleMaintenance(
    req: Request<
      { id: string },
      {},
      {
        enabled: boolean;
        message?: string;
        endTime?: string;
      }
    >,
    res: Response,
    next: NextFunction
  ) {
    try {
      const product = await ProductService.toggleMaintenance(req.params.id, {
        enabled: req.body.enabled,
        message: req.body.message,
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      });

      SuccessResponse.ok(res, {
        message: `Product maintenance mode ${product.maintenanceMode ? "enabled" : "disabled"} successfully`,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProduct(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const product = await ProductService.getProduct(req.params.id);

      SuccessResponse.ok(res, {
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
}
