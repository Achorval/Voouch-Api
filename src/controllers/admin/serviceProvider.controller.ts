// src/controllers/admin/service-provider.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ServiceProviderService } from '../../services/admin/serviceProvider.service';
import { UploadService } from '../../services/shared/upload.service';
import { SuccessResponse } from '../../utilities/success';
import { uploadServiceProviderLogo } from '../../middleware/upload.middleware';
import { ErrorResponse } from '../../utilities/error';
import type {
  CreateServiceProviderDTO,
  UpdateServiceProviderDTO,
  ServiceProviderListOptions
} from '../../types/admin/serviceProvider.types';

export class ServiceProviderController {
  static async createServiceProvider(
    req: Request<{}, {}, CreateServiceProviderDTO>,
    res: Response,
    next: NextFunction
  ) {
    try {
      let logoUrl: string | undefined;

      try {
        // Handle logo upload
        const uploadResult = await uploadServiceProviderLogo(req);
        if (uploadResult.buffer) {
          logoUrl = await UploadService.uploadToCloud(uploadResult, 'providers');
        }
      } catch (error: any) {
        // Throw error if logo upload is required
        if (error.message !== 'No file uploaded') {
          throw error;
        }
      }

      const provider = await ServiceProviderService.createServiceProvider({
        ...req.body,
        logo: logoUrl || null
      });

      SuccessResponse.created(res, {
        message: 'Service provider created successfully',
        data: provider
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateServiceProvider(
    req: Request<{ id: string }, {}, UpdateServiceProviderDTO>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const existingProvider = await ServiceProviderService.getServiceProvider(req.params.id);
      let logoUrl: string | undefined;

      try {
        const uploadResult = await uploadServiceProviderLogo(req);
        
        if (uploadResult.buffer) {
          // Delete old logo if exists
          if (existingProvider.logo) {
            await UploadService.deleteFromCloud(existingProvider.logo)
              .catch(error => {
                console.warn('Failed to delete old logo:', error);
              });
          }

          // Upload new logo
          logoUrl = await UploadService.uploadToCloud(uploadResult, 'providers');
        }
      } catch (error: any) {
        if (error.message !== 'No file uploaded') {
          throw error;
        }
      }

      const provider = await ServiceProviderService.updateServiceProvider(
        req.params.id,
        {
          ...req.body,
          ...(logoUrl !== undefined && { logo: logoUrl })
        }
      );

      SuccessResponse.ok(res, {
        message: 'Service provider updated successfully',
        data: provider
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteServiceProvider(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const provider = await ServiceProviderService.getServiceProvider(req.params.id);
      
      // Delete logo from Cloudinary if exists
      if (provider.logo) {
        await UploadService.deleteFromCloud(provider.logo)
          .catch(error => {
            console.warn('Failed to delete provider logo:', error);
          });
      }

      await ServiceProviderService.deleteServiceProvider(req.params.id);
      
      SuccessResponse.ok(res, {
        message: 'Service provider deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getServiceProvider(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const provider = await ServiceProviderService.getServiceProvider(req.params.id);
      
      SuccessResponse.ok(res, {
        data: provider
      });
    } catch (error) {
      next(error);
    }
  }

  static async listServiceProviders(
    req: Request<{}, {}, {}, ServiceProviderListOptions>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const options = {
        page: parseInt(req.query.page?.toString() || '1'),
        limit: parseInt(req.query.limit?.toString() || '10'),
        categoryId: req.query.categoryId,
        isEnabled: req.query.isEnabled
      };

      const result = await ServiceProviderService.listServiceProviders(options);

      SuccessResponse.ok(res, {
        data: result.serviceProviders,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleServiceProviderStatus(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const provider = await ServiceProviderService.toggleServiceProvider(req.params.id);
      
      SuccessResponse.ok(res, {
        message: `Service provider ${provider.isEnabled ? 'enabled' : 'disabled'} successfully`,
        data: provider
      });
    } catch (error) {
      next(error);
    }
  }
}