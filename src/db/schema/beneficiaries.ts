// src/db/schema/atmCards.ts
import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  mysqlEnum,
  json,
} from "drizzle-orm/mysql-core";
import { users } from ".";

export const beneficiaryTypes = [
  "bank_account",
  "wallet",
  "card",
  "airtime",
  "data",
  "utility",
  "merchant",
] as const;

export type BeneficiaryType = (typeof beneficiaryTypes)[number];

const beneficiaries = mysqlTable("beneficiaries", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: varchar("userId", { length: 128 })
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", beneficiaryTypes).notNull(),
  identifier: varchar("identifier", { length: 255 }).notNull(), // Account number, wallet ID, etc.
  details: json("details"), // Additional details specific to beneficiary type
  isFrequent: boolean("isFrequent").default(false),
  lastUsedAt: timestamp("lastUsedAt"),
  isActive: boolean("isActive").default(true),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export default beneficiaries;
