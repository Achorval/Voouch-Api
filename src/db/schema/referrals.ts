// src/db/schema/users/index.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  decimal
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";
import users from "./users";;

const referrals = mysqlTable("referrals", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("userId", { length: 128 })
    .notNull()
    .references(() => users.id),
  referralCode: varchar("referralCode", { length: 20 }).unique(),
  referredBy: varchar("referredBy", { length: 128 }),
  referralCount: int("referralCount").default(0).notNull(),
  totalReferralEarnings: decimal("totalReferralEarnings", {
    precision: 19,
    scale: 2,
  }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

export default referrals;