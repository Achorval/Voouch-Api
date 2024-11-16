// src/db/schema/tierLimits.ts
import {
  mysqlTable,
  varchar,
  timestamp,
  decimal,
  int,
  json,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";

export type RequirementsType = {
  title: string;
  description: string;
  documents: string[];
};

const tierLimits = mysqlTable("tierLimits", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  level: int("level").unique().notNull(),

  // Transaction Limits
  dailyLimit: decimal("dailyLimit", { precision: 19, scale: 4 }).notNull(),
  maximumBalance: decimal("maximumBalance", {
    precision: 19,
    scale: 4,
  }).notNull(),

  // Requirements
  requirements: json("requirements").$type<RequirementsType>(),

  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow(),
});

export default tierLimits;

// const seedTierLimits = [
//   {
//     level: 1,
//     requirements: {
//       title: "BVN Verification",
//       description: "Verify your BVN to activate your account",
//       documents: ["BVN"]
//     },
//     dailyLimit: 20000,
//     maximumBalance: 100000
//   },
//   {
//     level: 2,
//     requirements: {
//       title: "ID Verification",
//       description: "Upgrade your account with a valid ID",
//       documents: ["National ID", "Driver's License", "International Passport"]
//     },
//     dailyLimit: 500000,
//     maximumBalance: 2000000
//   },
//   {
//     level: 3,
//     requirements: {
//       title: "Address Verification",
//       description: "Provide proof of address",
//       documents: ["Utility Bill", "Proof of Address"]
//     },
//     dailyLimit: 5000000,
//     maximumBalance: 10000000
//   }
// ];
