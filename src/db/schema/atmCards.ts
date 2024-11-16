// src/db/schema/atmCards.ts
import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  json,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from ".";

export const cardTypes = ["visa", "mastercard", "verve"] as const;
export type CardType = (typeof cardTypes)[number];

const atmCards = mysqlTable("cards", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("userId", { length: 128 })
    .notNull()
    .references(() => users.id),
  token: varchar("token", { length: 255 }).notNull(), // For card tokenization
  cardNumber: varchar("cardNumber", { length: 255 }).notNull(), // Encrypted
  cvv: varchar("cvv", { length: 255 }).notNull(), // Encrypted
  cardHolderName: varchar("cardHolderName", { length: 255 }).notNull(),
  last4Digits: varchar("last4Digits", { length: 4 }).notNull(),
  expiryMonth: varchar("expiryMonth", { length: 2 }).notNull(),
  expiryYear: varchar("expiryYear", { length: 4 }).notNull(),
  cardType: mysqlEnum("cardType", cardTypes).notNull(),
  bin: varchar("bin", { length: 8 }).notNull(),
  isDefault: boolean("isDefault").default(false),
  isActive: boolean("isActive").default(true),
  isTokenized: boolean("isTokenized").default(false),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export default atmCards;