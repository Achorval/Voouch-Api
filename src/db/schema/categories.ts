// src/db/schema/services/index.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  decimal,
  int,
  json,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";

// Available category codes
export const categoryCodes = [
  "airtime",
  "data",
  "electricity",
  "cable_tv",
  "betting",
  "wallet_transfer",
  "card_services",
  "wallet_to_wallet",
  "money_request",
  "BANK_TRANSFER"
] as const;
export type CategoryCodes = (typeof categoryCodes)[number];

// Main categories of services
const categories = mysqlTable("categories", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar("name", { length: 100 }).notNull(), // Airtime, Data, etc.
  code: varchar("code", { length: 50, enum: categoryCodes })
    .$type<CategoryCodes>()
    .unique()
    .notNull(),
  description: varchar("description", { length: 255 }),
  icon: varchar("icon", { length: 255 }),
  
  isEnabled: boolean("isEnabled").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export default categories;