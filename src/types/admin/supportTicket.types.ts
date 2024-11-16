// src/types/admin/supportTicket.types.ts
export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  assignedTo: string | null;
  categoryId: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  transactionId: string;
  attachments: SupportTicketAttachment[] | null;
  metadata: Record<string, any> | null;
  lastRepliedAt: Date;
  resolvedAt: Date;
  closedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

type SupportTicketAttachment = {
  name: string;
  url: string;
  type: string;
};

export type SupportTicketStatus = 'open' | 'closed' | 'resolved';
export type SupportTicketPriority = 'low' | 'medium' | 'high';

export interface SupportTicketUpdateDTO {
  id: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  assignedTo?: string;
}

export interface SupportTicketListOptions {
  page: number;
  limit: number;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
}

export interface SupportTicketListResponse {
  tickets: SupportTicket[];
  meta: {
    total: number;
    pages: number;
  };
}
