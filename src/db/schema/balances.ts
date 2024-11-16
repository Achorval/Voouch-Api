// src/db/schema/balances.ts
import {
  mysqlTable,
  varchar,
  timestamp,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";
import { wallets, currencies } from ".";
import { createId } from "@paralleldrive/cuid2";

const balances = mysqlTable("balances", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  walletId: varchar("walletId", { length: 128 })
    .notNull()
    .references(() => wallets.id, { onDelete: "restrict" }),
  currencyId: varchar("currencyId", { length: 128 })
    .notNull()
    .references(() => currencies.id, { onDelete: "restrict" }),
  amount: decimal("amount", { precision: 19, scale: 4 }).notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export default balances;