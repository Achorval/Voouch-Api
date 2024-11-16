// src/controllers/admin/system.controller.ts
import { Request, Response, NextFunction } from 'express';
import { SystemService } from '../../services/admin';
import { SuccessResponse } from '../../utilities/success';
import type { 
  TierLimitInput,
  FeeConfigInput,
  AuditLogQueryParams,
  SecuritySettingsInput 
} from '../../types/admin/system.types';

export class SystemController {
  /**
   * Tier Limits
   */
  static async createTierLimit(
    req: Request<{}, {}, TierLimitInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const tierLimit = await SystemService.createTierLimit(req.body);
      
      SuccessResponse.created(res, {
        message: 'Tier limit created successfully',
        data: tierLimit
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTierLimit(
    req: Request<{ id: string }, {}, Partial<TierLimitInput>>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const tierLimit = await SystemService.updateTierLimit(
        req.params.id,
        req.body
      );
      
      SuccessResponse.ok(res, {
        message: 'Tier limit updated successfully',
        data: tierLimit
      });
    } catch (error) {
      next(error);
    }
  }

  static async listTierLimits(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const tierLimits = await SystemService.listTierLimits();
      
      SuccessResponse.ok(res, {
        data: tierLimits
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fee Configuration
   */
  static async configureFee(
    req: Request<
      { productId: string; providerId: string },
      {},
      FeeConfigInput
    >,
    res: Response,
    next: NextFunction
  ) {
    try {
      const feeConfig = await SystemService.configureFee(
        req.params.productId,
        req.params.providerId,
        req.body
      );
      
      SuccessResponse.ok(res, {
        message: 'Fee configuration updated successfully',
        data: feeConfig
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Audit Logs
   */
  static async listAuditLogs(
    req: Request<{}, {}, {}, AuditLogQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await SystemService.listAuditLogs(req.query);
      
      SuccessResponse.ok(res, {
        data: result.logs,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Security Settings
   */
  static async updateSecuritySettings(
    req: Request<{ userId: string }, {}, SecuritySettingsInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const settings = await SystemService.updateSecuritySettings(
        req.params.userId,
        req.body
      );
      
      SuccessResponse.ok(res, {
        message: 'Security settings updated successfully',
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }
}