// src/db/schema/users/index.ts

import {
  mysqlTable,
  timestamp,
  varchar,
  int,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";
import users from "./users";

// Login attempts tracking
export const loginAttempts = mysqlTable("loginAttempts", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("userId", { length: 128 })
    .notNull()
    .references(() => users.id),
  failedLoginAttempts: int("failedLoginAttempts").default(0).notNull(),
  currentLoginAttempts: int("currentLoginAttempts").default(0).notNull(),
  lastFailedLogin: timestamp("lastFailedLogin"),
  lockoutUntil: timestamp("lockoutUntil"),
  lastLogin: timestamp("lastLogin"),
  lastActiveAt: timestamp("lastActiveAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export default loginAttempts;