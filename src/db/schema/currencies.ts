// src/db/schema/currencies.ts
import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  json,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";

export const currencyTypes = ["fiat", "crypto"] as const;
export type CurrencyType = (typeof currencyTypes)[number];

const currencies = mysqlTable("currencies", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull(),
  type: varchar("type", { length: 10, enum: currencyTypes })
    .$type<CurrencyType>()
    .notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export default currencies;