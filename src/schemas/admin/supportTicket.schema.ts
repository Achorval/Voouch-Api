// src/schemas/admin/supportTicket.schema.ts
import { z } from 'zod';
// import { SupportTicketStatus, SupportTicketPriority } from '../../types/admin/supportTicket.types';

const SupportTicketStatus = ['open', 'closed', 'resolved'] as const;
const SupportTicketPriority = ['low', 'medium', 'high'] as const;

export const createSupportTicketSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    categoryId: z.string().uuid('Invalid category ID'),
    ticketNumber: z.string().min(3, 'Ticket number must be at least 3 characters').max(50),
    subject: z.string().min(3, 'Subject must be at least 3 characters').max(255),
    description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
    transactionId: z.string().uuid('Invalid transaction ID'),
    attachments: z.string().nullable(),
    metadata: z.string().nullable()
  })
});

export const updateSupportTicketSchema = z.object({
  params: z.object({
    ticketNumber: z.string().min(3, 'Ticket number must be at least 3 characters').max(50)
  }),
  body: z.object({
    status: z.enum(SupportTicketStatus).optional(),
    priority: z.enum(SupportTicketPriority).optional(),
    assignedTo: z.string().uuid('Invalid user ID').optional()
  })
});