// src/controllers/admin/supportTicket.controller.ts
import { Request, Response, NextFunction } from "express";
import { SupportTicketService } from "../../services/admin";
import { SuccessResponse } from "../../utilities/success";
import {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketUpdateDTO,
} from "../../types/admin/supportTicket.types";

export class SupportTicketController {
  static async createTicket(
    req: Request<{}, {}, Omit<SupportTicket, "id" | "createdAt" | "updatedAt">>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ticket = await SupportTicketService.createTicket(req.body);
      SuccessResponse.created(res, {
        message: "Ticket created successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTicket(
    req: Request<{ id: string }, {}, SupportTicketUpdateDTO>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ticket = await SupportTicketService.updateTicket(
        req.params.id,
        req.body
      );
      SuccessResponse.ok(res, {
        message: "Ticket updated successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  static async closeTicket(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      await SupportTicketService.closeTicket(req.params.id);
      SuccessResponse.ok(res, {
        message: "Ticket closed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignTicket(
    req: Request<{ id: string }, {}, { assignedTo: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ticket = await SupportTicketService.assignTicket(
        req.params.id,
        req.body.assignedTo
      );
      SuccessResponse.ok(res, {
        message: "Ticket assigned successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTicket(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ticket = await SupportTicketService.getTicket(req.params.id);
      SuccessResponse.ok(res, {
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listTickets(
    req: Request<
      {},
      {},
      {},
      {
        page?: string;
        limit?: string;
        status?: SupportTicketStatus;
        priority?: SupportTicketPriority;
      }
    >,
    res: Response,
    next: NextFunction
  ) {
    try {
      const page = parseInt(req.query.page || "1");
      const limit = parseInt(req.query.limit || "10");
      const { status, priority } = req.query;

      const result = await SupportTicketService.listTickets({
        page,
        limit,
        status,
        priority,
      });

      SuccessResponse.ok(res, {
        data: result.tickets,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }
}
