// src/controllers/admin/dashboard.controller.ts
import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../../services/admin";
import { SuccessResponse } from "../../utilities/success";
import {
  AnalyticsQueryParams,
  PerformanceQueryParams,
} from "../../types/admin/dasboard.types";

export class DashboardController {
  /**
   * Get dashboard metrics
   */
  static async getDashboardMetrics(
    req: Request<{}, {}, {}, AnalyticsQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const metrics = await DashboardService.getDashboardMetrics(req.query);

      SuccessResponse.ok(res, {
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get service performance analytics
   */
  static async getServicePerformance(
    req: Request<{}, {}, {}, PerformanceQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const performance = await DashboardService.getServicePerformance(
        req.query
      );

      SuccessResponse.ok(res, {
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(
    req: Request<{}, {}, {}, AnalyticsQueryParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const analytics = await DashboardService.getUserAnalytics(req.query);

      SuccessResponse.ok(res, {
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  private static convertToCSV(data: any, type: string): string {
    // Implement CSV conversion based on report type
    // This would format the data based on the type of report
    return "";
  }

  static async getDashboardStats(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const stats = await DashboardService.getDashboardStats();
      SuccessResponse.ok(res, { data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getRecentTransactions(
    req: Request<{}, {}, {}, { limit?: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const transactions = await DashboardService.getRecentTransactions(limit);
      SuccessResponse.ok(res, { data: transactions });
    } catch (error) {
      next(error);
    }
  }

  static async getTopCategories(
    req: Request<{}, {}, {}, { limit?: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 5;
      const categories = await DashboardService.getTopCategories(limit);
      SuccessResponse.ok(res, { data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async getTopServiceProviders(
    req: Request<{}, {}, {}, { limit?: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 5;
      const serviceProviders =
        await DashboardService.getTopServiceProviders(limit);
      SuccessResponse.ok(res, { data: serviceProviders });
    } catch (error) {
      next(error);
    }
  }
}
