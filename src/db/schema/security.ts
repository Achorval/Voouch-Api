// src/db/schema/users/index.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  json,
  int,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";
import users from "./users";
// Shared enums
export const twoFactorMethods = ["email", "authenticator", "sms"] as const;
export type TwoFactorMethod = (typeof twoFactorMethods)[number];

// Security settings
export const security = mysqlTable("security", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("userId", { length: 128 })
    .notNull()
    .references(() => users.id),
  transactionPin: varchar("transactionPin", { length: 255 }),
  twoFactorSecret: varchar("twoFactorSecret", { length: 255 }),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false).notNull(),
  twoFactorMethod: varchar("twoFactorMethod", { length: 20, enum: twoFactorMethods })
    .$type<TwoFactorMethod>()
    .default("email"),
  backupCodes: json("backupCodes").$type<string[]>(),
  canViewBalance: boolean("canViewBalance").default(true).notNull(),
  isPinSet: boolean("isPinSet").default(false).notNull(),
  lastPasswordChange: timestamp("lastPasswordChange"),
  lastPinChange: timestamp("lastPinChange"),
  maxLoginAttempts: int("maxLoginAttempts").default(3).notNull(),
  lockoutDuration: int("lockoutDuration").default(30).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow(),
});

export default security;