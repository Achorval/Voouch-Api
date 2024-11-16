// src/db/schema/supportTickets.ts
import { mysqlTable, varchar, timestamp, json } from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";
import { users, categories, transactions } from ".";

export const ticketPriorities = ["low", "medium", "high", "critical"] as const;
export type TicketPriority = (typeof ticketPriorities)[number];

export const ticketStatus = [
  "open",
  "pending",
  "inProgress",
  "awaitingUserReply",
  "resolved",
  "closed",
] as const;
export type TicketStatus = (typeof ticketStatus)[number];

const supportTickets = mysqlTable("supportTickets", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  ticketNumber: varchar("ticketNumber", { length: 50 }).notNull().unique(),
  userId: varchar("userId", { length: 128 })
    .notNull()
    .references(() => users.id),
  assignedTo: varchar("assignedTo", { length: 128 }).references(() => users.id),

  categoryId: varchar("categoryId", { length: 128 })
    .notNull()
    .references(() => categories.id),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }).notNull(),

  status: varchar("status", { length: 20, enum: ticketStatus })
    .$type<TicketStatus>()
    .default("open")
    .notNull(),
  priority: varchar("priority", { length: 20, enum: ticketPriorities })
    .$type<TicketPriority>()
    .default("medium"),

  transactionId: varchar("transactionId", { length: 128 })
    .notNull()
    .references(() => transactions.id),
  attachments: json("attachments").$type<
    {
      name: string;
      url: string;
      type: string;
    }[]
  >(),
  metadata: json("metadata").$type<Record<string, any>>(),

  lastRepliedAt: timestamp("lastRepliedAt"),
  resolvedAt: timestamp("resolvedAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow(),
});

export default supportTickets;
