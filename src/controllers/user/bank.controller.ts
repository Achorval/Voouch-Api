// src/controllers/user/bank.controller.ts
import { Request, Response, NextFunction } from 'express';
import { BankService } from '../../services/user/bank.service';
import { SuccessResponse } from '../../utilities/success';
import { ErrorResponse } from '../../utilities/error';
import type { BankTransferInput } from '../../types/user/wallet.types';

export class BankController {
  /**
   * Process bank transfer
   */
  static async processBankTransfer(
    req: Request<{ walletId: string }, {}, BankTransferInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const result = await BankService.processBankTransfer(
        req.params.walletId,
        req.body
      );
      
      SuccessResponse.created(res, {
        message: 'Bank transfer initiated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List bank beneficiaries
   */
  static async listBeneficiaries(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const beneficiaries = await BankService.listBeneficiaries(req.user.id);
      
      SuccessResponse.ok(res, {
        data: beneficiaries
      });
    } catch (error) {
      next(error);
    }
  }
}