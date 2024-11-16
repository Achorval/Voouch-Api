// src/db/schema/electricityDiscos.ts
import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { products } from ".";
import { createId } from "@paralleldrive/cuid2";

const electricityDiscos = mysqlTable("electricityDiscos", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  productId: varchar("productId", { length: 128 })
    .notNull()
    .references(() => products.id),
  vendType: varchar("vendType", { length: 50 }).notNull(),
  identifier: varchar("identifier", { length: 100 }).notNull(),
});

export default electricityDiscos;
