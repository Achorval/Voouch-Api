// src/db/schema/kycs.ts
import {
  mysqlTable,
  varchar,
  timestamp,
  json,
  int,
  boolean,
} from "drizzle-orm/mysql-core";
import { users } from ".";
import { createId } from "@paralleldrive/cuid2";

export const kycLevels = {
  LEVEL_1: 1, // BVN Verification
  LEVEL_2: 2, // ID Verification
  LEVEL_3: 3, // Address Verification
} as const;

export const kycStatus = ["pending", "approved", "rejected"] as const;
export type KycStatus = (typeof kycStatus)[number];

const kycs = mysqlTable("kycs", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("userId", { length: 128 })
    .notNull()
    .references(() => users.id),
  level: int("level").notNull(),
  status: varchar("status", { length: 20, enum: kycStatus })
    .$type<KycStatus>()
    .default("pending")
    .notNull(),

  // Level 1 - BVN
  bvn: varchar("bvn", { length: 11 }),
  bvnVerified: boolean("bvnVerified").default(false).notNull(),

  // Level 2 - ID Verification
  idType: varchar("idType", { length: 50 }),
  idNumber: varchar("idNumber", { length: 100 }),
  idExpiryDate: varchar("idExpiryDate", { length: 10 }),
  idFrontUrl: varchar("idFrontUrl", { length: 255 }),
  idBackUrl: varchar("idBackUrl", { length: 255 }),
  idVerified: boolean("bvnVerified").default(false).notNull(),

  // Level 3 - Address Verification
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  lga: varchar("lga", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  utilityBillUrl: varchar("utilityBillUrl", { length: 255 }),
  addressVerified: boolean("bvnVerified").default(false).notNull(),

  verifiedBy: varchar("verifiedBy", { length: 128 })
    .references(() => users.id),
  rejectionReason: varchar("rejectionReason", { length: 255 }),
  metadata: json("metadata").$type<Record<string, any>>(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  verifiedAt: timestamp("verifiedAt"),
});

export default kycs;
