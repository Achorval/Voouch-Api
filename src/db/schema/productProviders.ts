// src/db/schema/services/index.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  decimal,
  int,
  json,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";
import products from "./products";
import providers from "./providers";

export const feeTypes = ["flat", "percentage"] as const;
export type FeeTypes = (typeof feeTypes)[number];

// Link between products and providers
const productProviders = mysqlTable("productProviders", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  productId: varchar("productId", { length: 128 })
    .notNull()
    .references(() => products.id),
  providerId: varchar("providerId", { length: 128 })
    .notNull()
    .references(() => providers.id),

  providerProductCode: varchar("providerProductCode", { length: 50 })
    .unique()
    .notNull(),
  priority: int("priority").default(1).notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),

  // Fee configuration
  feeType: varchar("feeType", { length: 20, enum: feeTypes })
    .$type<FeeTypes>()
    .notNull(),
  feeValue: decimal("feeValue", { precision: 10, scale: 2 }).notNull(),
  minFee: decimal("minFee", { precision: 10, scale: 2 }),
  maxFee: decimal("maxFee", { precision: 10, scale: 2 }),

  // Provider-specific endPoints
  endPoints: json("endPoints").$type<{
    validation?: string;
    transaction?: string;
    status?: string;
    [key: string]: string | undefined;
  }>(),

  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export default productProviders;
