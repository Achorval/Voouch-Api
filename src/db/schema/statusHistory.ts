// src/db/schema/users/index.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  decimal,
  json,
  date,
  int,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";
import users from "./users";

// Shared enums
export const accountStatus = [
  "active",
  "blocked",
  "locked",
  "deactivated",
  "suspended",
  "deleted",
  "restricted",
] as const;
export type AccountStatus = (typeof accountStatus)[number];

// Status history
export const statusHistory = mysqlTable("statusHistory", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("userId", { length: 128 })
    .notNull()
    .references(() => users.id),
  status: varchar("status", { length: 20, enum: accountStatus })
    .$type<AccountStatus>()
    .notNull(),
  statusReason: varchar("statusReason", { length: 255 }),
  statusNote: varchar("statusNote", { length: 500 }),
  statusChangedBy: varchar("statusChangedBy", { length: 128 })
    .references(() => users.id),
  suspensionEndAt: timestamp("suspensionEndAt"),
  deactivatedAt: timestamp("deactivatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export default statusHistory;