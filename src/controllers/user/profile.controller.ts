// src/controllers/user/profile.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../../services/user';
import { SuccessResponse } from '../../utilities/success';
// import { uploadUserAvatar } from '../../middleware';
import { ErrorResponse } from '../../utilities/error';

export class ProfileController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const profile = await ProfileService.getProfile(req.user.id);
      
      SuccessResponse.ok(res, {
        message: 'Profile retrieved successfully',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const profile = await ProfileService.updateProfile(req.user.id, req.body);
      
      SuccessResponse.ok(res, {
        message: 'Profile updated successfully',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      // const uploadResult = await uploadUserAvatar(req);
      // const avatarUrl = await ProfileService.updateAvatar(req.user.id, uploadResult);
      
      SuccessResponse.ok(res, {
        message: 'Avatar updated successfully',
        // data: { avatarUrl }
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      await ProfileService.changePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      
      SuccessResponse.ok(res, {
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSecurity(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const profile = await ProfileService.updateSecurity(req.user.id, req.body);
      
      SuccessResponse.ok(res, {
        message: 'Security settings updated successfully',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  static async setTransactionPin(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      await ProfileService.setTransactionPin(req.user.id, req.body.pin);
      
      SuccessResponse.ok(res, {
        message: 'Transaction PIN set successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async changeTransactionPin(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      await ProfileService.changeTransactionPin(
        req.user.id,
        req.body.currentPin,
        req.body.newPin
      );
      
      SuccessResponse.ok(res, {
        message: 'Transaction PIN changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}