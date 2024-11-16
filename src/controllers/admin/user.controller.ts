// src/controllers/admin/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../services/admin/user.service';
import { SuccessResponse } from '../../utilities/success';
import { ErrorResponse } from '../../utilities/error';
import type {
  CreateUserDTO,
  KycListQueryParams,
  KycReviewAction,
  SecurityResetOptions,
  UpdateUserDTO,
  UpdateUserStatusDTO,
  UserListQueryParams
} from '../../types/admin/user.types';

export class UserController {
  static async createUser(
    req: Request<{}, {}, CreateUserDTO>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = await UserService.createUser(req.body);
      
      SuccessResponse.created(res, {
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(
    req: Request<{ id: string }, {}, UpdateUserDTO>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = await UserService.updateUser(req.params.id, req.body);
      
      SuccessResponse.ok(res, {
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(
    req: Request<{ id: string }, {}, UpdateUserStatusDTO>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('Admin ID is required');
      }

      const user = await UserService.updateUserStatus(
        req.params.id,
        req.user.id,
        req.body
      );
      
      SuccessResponse.ok(res, {
        message: `User status updated to ${req.body.status}`,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List users with filtering and pagination
   */
  static async listUsers(
    req: Request<{}, {}, {}, UserListQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await UserService.listUsers(req.query);
      
      SuccessResponse.ok(res, {
        data: result.users,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserDetails(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = await UserService.getUserDetails(req.params.id);
      
      SuccessResponse.ok(res, {
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
        await UserService.deleteUser(req.params.id, req.body);
      
      const message = req.body.deleteType === 'hard' 
        ? 'User permanently deleted' 
        : 'User deleted';
      
      SuccessResponse.ok(res, { message });

    } catch (error) {
      next(error);
    }
  }

  static async resetUserPassword(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('Admin ID is required');
      }

      await UserService.resetUserPassword(req.params.id, req.user.id);
      
      SuccessResponse.ok(res, {
        message: 'User password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserKYC(
    req: Request<{ id: string }, {}, { kycLevel: number }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('Admin ID is required');
      }

      const user = await UserService.updateUserKYC(
        req.params.id,
        req.body.kycLevel,
        req.user.id
      );
      
      SuccessResponse.ok(res, {
        message: 'User KYC level updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset user security settings
   */
  static async resetSecurity(
    req: Request<{ id: string }, {}, SecurityResetOptions>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('Admin ID is required');
      }

      const result = await UserService.resetSecurity(
        req.params.id,
        req.user.id,
        req.body
      );
      
      SuccessResponse.ok(res, {
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const stats = await UserService.getUserStats(req.params.id);
      
      SuccessResponse.ok(res, {
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export users
   */
  static async exportUsers(
    req: Request<{}, {}, {}, UserListQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Set unlimited limit for export
      const params = { ...req.query, limit: 1000 };
      const result = await UserService.listUsers(params);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');

      // Convert to CSV format
      const csvHeader = 'ID,Username,Email,Name,Phone,Status,Role,KYC Level,Created At\n';
      const csvRows = result.users.map(user => 
        `${user.id},${user.username},${user.email},${user.firstName} ${user.lastName},` +
        `${user.phoneNumber},${user.status},${user.role},${user.kycLevel},${user.createdAt}`
      ).join('\n');

      res.send(csvHeader + csvRows);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List KYC verification requests
   */
  static async listVerifications(
    req: Request<{}, {}, {}, KycListQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await UserService.listVerificationRequests(req.query);
      
      SuccessResponse.ok(res, {
        data: result.verifications,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get verification details
   */
  static async getVerificationDetails(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const details = await UserService.getVerificationDetails(req.params.id);
      
      SuccessResponse.ok(res, {
        data: details
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Review KYC verification
   */
  static async reviewVerification(
    req: Request<{ id: string }, {}, KycReviewAction>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('Admin ID is required');
      }

      await UserService.reviewVerification(
        req.params.id,
        req.user.id,
        req.body
      );
      
      SuccessResponse.ok(res, {
        message: `KYC verification ${req.body.status}`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get KYC statistics
   */
  static async getKycStats(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const stats = await UserService.getKycStats();
      
      SuccessResponse.ok(res, {
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

}