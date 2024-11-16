// src/controllers/user/wallet.controller.ts
import { Request, Response, NextFunction } from 'express';
import { WalletService } from '../../services/user/wallet.service';
import { SuccessResponse } from '../../utilities/success';
import { ErrorResponse } from '../../utilities/error';
import type {
  TransferInput,
  MoneyRequestInput,
  WalletStatementFilters
} from '../../types/user/wallet.types';

export class WalletController {
  /**
   * Get user wallets
   */
  static async listWallets(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const wallets = await WalletService.listWallets(req.user.id);
      
      SuccessResponse.ok(res, {
        data: wallets
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet balance
   */
  static async getBalance(
    req: Request<{ walletId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const balance = await WalletService.getBalance(req.params.walletId);
      
      SuccessResponse.ok(res, {
        data: { balance }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transfer money
   */
  static async transfer(
    req: Request<{ walletId: string }, {}, TransferInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      await WalletService.transfer(req.params.walletId, req.body);
      
      SuccessResponse.ok(res, {
        message: 'Transfer completed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request money
   */
  static async requestMoney(
    req: Request<{}, {}, MoneyRequestInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      await WalletService.requestMoney(req.user.id, req.body);
      
      SuccessResponse.ok(res, {
        message: 'Money request sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List money requests
   */
  static async listMoneyRequests(
    req: Request<{}, {}, {}, { type?: 'sent' | 'received' }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const requests = await WalletService.listMoneyRequests(
        req.user.id,
        req.query.type
      );
      
      SuccessResponse.ok(res, {
        data: requests
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process money request
   */
  static async processMoneyRequest(
    req: Request<{ transactionId: string }, {}, { action: 'accept' | 'reject'; pin?: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      await WalletService.processMoneyRequest(
        req.params.transactionId,
        req.user.id,
        req.body.action,
        req.body.pin
      );
      
      SuccessResponse.ok(res, {
        message: `Money request ${req.body.action}ed successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate statement
   */
  static async generateStatement(
    req: Request<{ walletId: string }, {}, {}, WalletStatementFilters>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const statement = await WalletService.generateStatement(
        req.params.walletId,
        req.query
      );
      
      SuccessResponse.ok(res, {
        data: statement
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set default wallet
   */
  static async setDefaultWallet(
    req: Request<{ walletId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      await WalletService.setDefaultWallet(req.user.id, req.params.walletId);
      
      SuccessResponse.ok(res, {
        message: 'Default wallet updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}