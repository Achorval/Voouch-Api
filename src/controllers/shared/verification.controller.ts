// src/controllers/auth/verification.controller.ts
import { Request, Response, NextFunction } from 'express';
import { VerificationService } from '../../services/shared/verification.service';
import { SuccessResponse } from '../../utilities/success';
import { ErrorResponse } from '../../utilities/error';

export class VerificationController {
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      await VerificationService.verifyEmail(token);
      
      SuccessResponse.ok(res, {
        message: 'Email verified successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyPhone(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const { code } = req.body;
      await VerificationService.verifyPhone(req.user.id, code);
      
      SuccessResponse.ok(res, {
        message: 'Phone number verified successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async resendEmailVerification(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      await VerificationService.resendVerification(req.user.id, 'email');
      
      SuccessResponse.ok(res, {
        message: 'Verification email sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async resendPhoneVerification(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      await VerificationService.resendVerification(req.user.id, 'phone');
      
      SuccessResponse.ok(res, {
        message: 'Verification code sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}