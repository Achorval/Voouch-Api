// src/db/schema/internetBundles.ts
import { mysqlTable, varchar, double } from "drizzle-orm/mysql-core";
import { products } from ".";
import { createId } from "@paralleldrive/cuid2";

export const internetBundles = mysqlTable("internetBundles", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  productId: varchar("productId", { length: 128 })
    .notNull()
    .references(() => products.id),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  amount: double("amount", { precision: 10, scale: 2 }).notNull(),
  validity: varchar("validity", { length: 150 }),
  allowance: varchar("allowance", { length: 150 }),
});

export default internetBundles;
