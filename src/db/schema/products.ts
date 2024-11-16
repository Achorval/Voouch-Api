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
import categories from "./categories";

// Specific services under each category
const products = mysqlTable("products", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  categoryId: varchar("categoryId", { length: 128 })
    .notNull()
    .references(() => categories.id),
  name: varchar("name", { length: 100 }).notNull(), // MTN, Airtel, DSTV, etc.
  code: varchar("code", { length: 50 }).unique().notNull(), // MTN_NG, AIRTEL_NG
  description: varchar("description", { length: 255 }),
  icon: varchar("icon", { length: 255 }),

  // Status flags
  isEnabled: boolean("isEnabled").default(true).notNull(),
  maintenanceMode: boolean("maintenanceMode").default(false).notNull(),
  maintenanceMessage: varchar("maintenanceMessage", { length: 255 }),
  maintenanceStartTime: timestamp("maintenanceStartTime"),
  maintenanceEndTime: timestamp("maintenanceEndTime"),

  // Transaction limits
  minimumAmount: decimal("minimumAmount", { precision: 19, scale: 2 }).notNull(),
  maximumAmount: decimal("maximumAmount", { precision: 19, scale: 2 }).notNull(),
  
  displayOrder: int("displayOrder").default(0).notNull(),
  
  metadata: json("metadata").$type<Record<string, any>>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export default products;