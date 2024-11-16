// src/db/schema/cablePackages.ts
import { mysqlTable, varchar, double, tinyint } from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";
import { products } from ".";

const cablePackages = mysqlTable("cablePackages", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  productId: varchar("productId", { length: 128 })
    .notNull()
    .references(() => products.id),
  name: varchar("name", { length: 100 }).notNull(),
  cycle: tinyint("cycle").notNull(),
  packageCode: varchar("packageCode", { length: 100 }).notNull(),
  packagePrice: double("packagePrice", { precision: 10, scale: 2 }).notNull(),
  addonCode: varchar("addonCode", { length: 100 }),
  addonPrice: double("addonPrice", { precision: 10, scale: 2 }).notNull(),
  totalAmount: double("totalAmount", { precision: 10, scale: 2 }).notNull()
});

export default cablePackages;