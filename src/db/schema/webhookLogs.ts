// src/db/schema/webhookLogs.ts
import {
  mysqlTable,
  varchar,
  timestamp,
  json,
  int,
  text,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { transactions } from ".";
import { providers } from ".";

export const webhookLogStatus = [
  "pending",
  "processed",
  "failed",
  "retrying",
] as const;

const webhookLogs = mysqlTable("webhook_logs", {
  id: varchar("id", { length: 128 }).primaryKey(),

  // Foreign keys
  transactionId: varchar("transactionId", { length: 128 })
    .notNull()
    .references(() => transactions.id),
  providerId: varchar("providerId", { length: 128 })
    .notNull()
    .references(() => providers.id),

  // Event info
  event: varchar("event", { length: 100 }).notNull(),

  // Request details
  method: varchar("method", { length: 10 }).notNull(),
  url: varchar("url", { length: 255 }).notNull(),
  requestHeaders: json("requestHeaders").$type<Record<string, string>>(),
  requestBody: json("requestBody").$type<Record<string, any>>(),

  // Response details
  responseStatus: int("responseStatus"),
  responseBody: json("responseBody").$type<Record<string, any>>(),
  processingTime: int("processingTime"),

  // Processing info
  status: mysqlEnum("status", webhookLogStatus).notNull(),
  errorMessage: text("errorMessage"),

  // Security & tracking
  ipAddress: varchar("ipAddress", { length: 45 }),
  signature: varchar("signature", { length: 255 }),
  retryCount: int("retryCount").default(0),
  lastRetryAt: timestamp("lastRetryAt"),

  // Service-specific data
  providerReference: varchar("providerReference", { length: 255 }),
  metadata: json("metadata").$type<Record<string, any>>(),

  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow(),
});

export default webhookLogs;