// src/db/schema/transactions.ts
import {
  mysqlTable,
  varchar,
  timestamp,
  decimal,
  json,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";
import { users, wallets, atmCards, categories, products } from ".";
import providers from "./providers";

export const transactionStatus = [
  "pending",
  "processing",
  "completed",
  "failed",
  "reversed",
  "cancelled",
  "refunded",
] as const;
export type TransactionStatus = (typeof transactionStatus)[number];

export const transactionTypes = ["credit", "debit"] as const;
export type TransactionType = (typeof transactionTypes)[number];

export const paymentMethods = ["wallet", "card", "bank_transfer", "ussd"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("userId", { length: 128 })
    .notNull()
    .references(() => users.id),
  walletId: varchar("walletId", { length: 128 }).references(() => wallets.id),

  // Service related references
  categoryId: varchar("categoryId", { length: 128 })
    .notNull()
    .references(() => categories.id),
  productId: varchar("productId", { length: 128 })
    .references(() => products.id),
  providerId: varchar("providerId", { length: 128 })
    .references(() => providers.id),

  // Transaction status
  status: varchar("status", { length: 20, enum: transactionStatus })
    .$type<TransactionStatus>()
    .default("pending")
    .notNull(),
  type: varchar("type", { length: 10, enum: transactionTypes })
    .$type<TransactionType>()
    .notNull(),

  // Financial details
  amount: decimal("amount", { precision: 19, scale: 4 }).notNull(),
  fee: decimal("fee", { precision: 19, scale: 4 }).default("0").notNull(),
  total: decimal("total", { precision: 19, scale: 4 }).notNull(),
  
  // Payment details
  paymentMethod: varchar("paymentMethod", { length: 20, enum: paymentMethods })
    .$type<PaymentMethod>()
    .notNull(),
  cardId: varchar("cardId", { length: 128 }).references(() => atmCards.id),

  // References
  reference: varchar("reference", { length: 255 }).notNull().unique(),
  externalReference: varchar("externalReference", { length: 255 }),
  description: varchar("description", { length: 255 }),

  // Provider specific details
  providerData: json("providerData").$type<{
    productCode?: string;        // Provider's product code
    requestPayload?: any;        // What we sent to provider
    responsePayload?: any;       // What provider returned
    responseCode?: string;       // Provider's response code
    responseMessage?: string;    // Provider's response message
    retryCount?: number;        // Number of retry attempts
    lastError?: string;         // Last error message
    [key: string]: any;
  }>(),

  // Service specific data
  serviceData: json("serviceData").$type<{
    phone?: string;              // For airtime/data
    smartCardNumber?: string;    // For cable TV
    meterNumber?: string;        // For electricity
    customerName?: string;       // Beneficiary name
    customerAddress?: string;    // Customer address
    units?: string;             // For electricity units
    package?: {                 // Package details
      name: string;
      price: number;
      validity?: string;
      allowance?: string;
    };
    [key: string]: any;
  }>(),

  // Dynamic category data
  metadata: json("metadata").$type<Record<string, any>>(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow(),
  completedAt: timestamp("completedAt"),
});

export default transactions;
