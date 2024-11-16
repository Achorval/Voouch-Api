// src/db/schema/services/index.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  boolean
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";

// Third-party API providers
const providers = mysqlTable("providers", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar("name", { length: 100 }).notNull(), // Flutterwave, Termii, etc.
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
  logo: varchar("logo", { length: 255 }),

  isEnabled: boolean("isEnabled").default(true).notNull(),
  isLive: boolean("isLive").default(false).notNull(),

  // API credentials
  baseUrl: varchar("baseUrl", { length: 255 }).notNull(),
  testBaseUrl: varchar("testBaseUrl", { length: 255 }),
  apiKey: varchar("apiKey", { length: 255 }),
  secretKey: varchar("secretKey", { length: 255 }),
  webhookSecret: varchar("webhookSecret", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export default providers;