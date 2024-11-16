// src/db/schema/dataBundles.ts
import { mysqlTable, varchar, double, json } from "drizzle-orm/mysql-core";
import { products } from ".";
import { createId } from "@paralleldrive/cuid2";

export const dataBundles = mysqlTable("dataBundles", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  productId: varchar("productId", { length: 128 })
    .notNull()
    .references(() => products.id),
  name: varchar("name", { length: 100 }).notNull(),
  price: double("price", { precision: 10, scale: 2 }).notNull(),
  validity: varchar("validity", { length: 150 }),
  allowance: varchar("allowance", { length: 150 }),
  metadata: json("metadata"),
});

export default dataBundles;