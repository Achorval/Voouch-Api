import { Request, Response, NextFunction } from "express";
import { CardService } from "../../services/user/atmCard.service";
import { SuccessResponse } from "../../utilities/success";
import { ErrorResponse } from "../../utilities/error";
import type { AddCardInput } from "../../types/user/atmCard.types";

export class AtmCardController {
  /**
   * Add new card
   */
  static async addCard(
    req: Request<{}, {}, AddCardInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized("User ID is required");
      }

      const card = await CardService.addCard(req.user.id, req.body);

      SuccessResponse.created(res, {
        message: "Card added successfully",
        data: card,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List cards
   */
  static async listCards(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized("User ID is required");
      }

      const cards = await CardService.listCards(req.user.id);

      SuccessResponse.ok(res, {
        data: cards,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set default card
   */
  static async setDefaultCard(
    req: Request<{ cardId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized("User ID is required");
      }

      await CardService.setDefaultCard(req.user.id, req.params.cardId);

      SuccessResponse.ok(res, {
        message: "Default card updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove card
   */
  static async removeCard(
    req: Request<{ cardId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized("User ID is required");
      }

      await CardService.removeCard(req.user.id, req.params.cardId);

      SuccessResponse.ok(res, {
        message: "Card removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
