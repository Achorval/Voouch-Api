// src/db/schema/wallets.ts
import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";
import { users, currencies } from ".";

export const walletStatus = [
  "active",
  "inactive",
  "frozen",
  "suspended",
] as const;
export type WalletStatus = (typeof walletStatus)[number];

const wallets = mysqlTable("wallets", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("userId", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),
  currencyId: varchar("currencyId", { length: 128 })
    .notNull()
    .references(() => currencies.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  isDefault: boolean("isDefault").default(false).notNull(),
  status: varchar("status", { length: 20, enum: walletStatus })
    .$type<WalletStatus>()
    .default("active")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow(),
});

export default wallets;
