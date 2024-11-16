// src/services/admin/supportTicket.service.ts
import { eq, and } from "drizzle-orm";
import { db } from "../../config/database";
import { supportTickets } from "../../db/schema";
import { ErrorResponse } from "../../utilities/error";
import {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketUpdateDTO,
  SupportTicketListOptions,
  SupportTicketListResponse,
} from "../../types/admin/supportTicket.types";

export class SupportTicketService {
  static async createTicket(
    data: Omit<SupportTicket, "id" | "createdAt" | "updatedAt" | "ticketNumber">
  ): Promise<SupportTicket> {
    // Generate a new ticket number
    const ticketNumbere = "TKT-" + Math.random().toString(36).substring(2, 7);

    // Create the new ticket object
    const newTicket: SupportTicket = {
      id: "new-ticket-id",
      ticketNumber: ticketNumbere, // Use the generated ticketNumber
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data, // Spread the rest of the data (without ticketNumber)
    };

    // // Insert the new ticket into the database
    await db.insert(supportTickets).values(newTicket);
    return newTicket;
  }

  static async updateTicket(
    id: string,
    data: SupportTicketUpdateDTO
  ): Promise<SupportTicket> {
    await db
      .update(supportTickets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, id));

    const [updatedTicket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id))
      .limit(1);

    if (!updatedTicket) {
      throw ErrorResponse.notFound("Ticket not found");
    }

    return updatedTicket as SupportTicket;
  }

  static async closeTicket(id: string): Promise<void> {
    await db
      .update(supportTickets)
      .set({
        status: "closed" as SupportTicketStatus,
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, id));
  }

  static async assignTicket(
    id: string,
    assignedTo: string
  ): Promise<SupportTicket> {
    await db
      .update(supportTickets)
      .set({
        assignedTo,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, id));

    const [updatedTicket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id))
      .limit(1);

    if (!updatedTicket) {
      throw ErrorResponse.notFound("Ticket not found");
    }

    return updatedTicket as SupportTicket;
  }

  static async getTicket(id: string): Promise<SupportTicket> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id))
      .limit(1);

    if (!ticket) {
      throw ErrorResponse.notFound("Ticket not found");
    }

    return ticket as SupportTicket;
  }

  static async listTickets(
    options: SupportTicketListOptions
  ): Promise<SupportTicketListResponse> {
    const { page, limit, status, priority } = options;
    const offset = (page - 1) * limit;

    // Build where condition
    const whereConditions = [
      status ? eq(supportTickets.status, status) : undefined,
      priority ? eq(supportTickets.priority, priority) : undefined,
    ].filter(Boolean);

    // Get total count with where condition
    const totalResults = await db
      .select()
      .from(supportTickets)
      .where(and(...whereConditions));

    // Get paginated results with same where condition
    const results = await db
      .select()
      .from(supportTickets)
      .where(and(...whereConditions))
      .limit(limit)
      .offset(offset);

    return {
      tickets: results as SupportTicket[],
      meta: {
        total: totalResults.length,
        pages: Math.ceil(totalResults.length / limit),
      },
    };
  }
}
