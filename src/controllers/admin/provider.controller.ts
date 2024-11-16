// src/controllers/admin/provider.controller.ts
import { Request, Response, NextFunction } from "express";
import { ProviderService } from "../../services/admin";
import { SuccessResponse } from "../../utilities/success";
import type {
  CreateProviderDto,
  UpdateProviderDto,
  ProviderListQueryParams,
} from "../../types/admin/service.types";
import { uploadProviderLogo } from "../../middleware/upload.middleware";
import { UploadService } from "../../services/shared/upload.service";

export class ProviderController {
  static async listProviders(
    req: Request<{}, {}, {}, ProviderListQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await ProviderService.listProviders(req.query);

      SuccessResponse.ok(res, {
        data: result.providers,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createProvider(
    req: Request<{}, {}, CreateProviderDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      console.log(req.body)
      const provider = await ProviderService.createProvider(req.body);

      SuccessResponse.created(res, {
        message: "Provider created successfully",
        data: provider,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProvider(
    req: Request<{ id: string }, {}, UpdateProviderDto>,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Get existing provider to check if icon needs to be deleted
      const existingPoduct = await ProviderService.getProvider(req.params.id);
      let logoUrl: string | undefined;

      try {
        // Handle file upload
        const uploadResult = await uploadProviderLogo(req);

        // If file was uploaded
        if (uploadResult.buffer) {
          // Upload new provider
          logoUrl = await UploadService.uploadToCloud(
            uploadResult,
            "categories"
          );

          // Delete old provider if exists
          if (existingPoduct.logo) {
            console.log("Deleting old provider:", existingPoduct.logo);
            await UploadService.deleteFromCloud(existingPoduct.logo).catch(
              (error) => {
                console.warn("Failed to delete old provider:", error);
              }
            );
          }
        }
      } catch (error: any) {
        // If error is not "no file uploaded", rethrow it
        if (!error.message.includes("No file uploaded")) {
          throw error;
        }
      }

      // Update provider
      const provider = await ProviderService.updateProvider(req.params.id, {
        ...req.body,
        ...(logoUrl && { icon: logoUrl }),
      });

      SuccessResponse.ok(res, {
        message: "Provider updated successfully",
        data: provider,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProvider(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const provider = await ProviderService.getProvider(req.params.id);

      SuccessResponse.ok(res, {
        data: provider,
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleProvider(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const provider = await ProviderService.toggleProvider(req.params.id);

      SuccessResponse.ok(res, {
        message: `Provider ${provider.isEnabled ? "enabled" : "disabled"} successfully`,
        data: provider,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProvider(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      await ProviderService.deleteProvider(req.params.id);

      SuccessResponse.ok(res, {
        message: "Provider deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
