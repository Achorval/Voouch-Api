// src/controllers/admin/financial.controller.ts
import { Request, Response, NextFunction } from 'express';
import { FinancialService } from '../../services/admin';
import { SuccessResponse } from '../../utilities/success';
import type { 
  FinancialQueryParams,
  ReferralQueryParams 
} from '../../types/admin/financial.types';

export class FinancialController {
  /**
   * Get transaction statistics
   */
  static async getTransactionStats(
    req: Request<{}, {}, {}, FinancialQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const stats = await FinancialService.getTransactionStats(req.query);
      
      SuccessResponse.ok(res, {
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product revenue breakdown
   */
  static async getProductRevenue(
    req: Request<{}, {}, {}, FinancialQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const revenue = await FinancialService.getProductRevenue(req.query);
      
      SuccessResponse.ok(res, {
        data: revenue
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get provider revenue breakdown
   */
  static async getProviderRevenue(
    req: Request<{}, {}, {}, FinancialQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const revenue = await FinancialService.getProviderRevenue(req.query);
      
      SuccessResponse.ok(res, {
        data: revenue
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get fee configuration for a product provider
   */
  static async getProductProviderFee(
    req: Request<{ productId: string; providerId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const fee = await FinancialService.getProductProviderFee(
        req.params.productId,
        req.params.providerId
      );
      
      SuccessResponse.ok(res, {
        data: fee
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get referral statistics
   */
  static async getReferralStats(
    req: Request<{}, {}, {}, ReferralQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const stats = await FinancialService.getReferralStats(req.query);
      
      SuccessResponse.ok(res, {
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}