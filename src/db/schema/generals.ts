// src/db/schema/generals.ts
import {
  mysqlTable,
  varchar,
  text,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";

const generals = mysqlTable("generals", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId())
    .notNull(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: varchar("value", { length: 255 }).notNull(),
  dataType: varchar("dataType", { length: 50 }).notNull(),
  description: text("description")
});

export default generals;