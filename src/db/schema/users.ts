// src/db/schema/users/index.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  json,
  date,
  int
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";

// Shared enums
export const userRoles = ["user", "admin", "super_admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const userTiers = ["basic", "silver", "gold", "platinum"] as const;
export type UserTier = (typeof userTiers)[number];

export const genderTypes = ["male", "female", "other"] as const;
export type Gender = (typeof genderTypes)[number];

export const accountStatus = [
  "active",
  "blocked",
  "locked",
  "deactivated",
  "suspended",
  "deleted",
  "restricted",
] as const;
export type AccountStatus = (typeof accountStatus)[number];

// Core users table (with essential profile info)
const users = mysqlTable("users", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull().unique(),
  gender: varchar("gender", { length: 10, enum: genderTypes }).$type<Gender>(),
  dateOfBirth: date("dateOfBirth"),
  avatar: varchar("avatar", { length: 255 }),
  role: varchar("role", { length: 20, enum: userRoles })
    .$type<UserRole>()
    .default("user")
    .notNull(),
  status: varchar("status", { length: 20, enum: accountStatus })
    .$type<AccountStatus>()
    .default("active")
    .notNull(),
  kycLevel: int("kycLevel").default(0).notNull(),
  tierLevel: varchar("tierLevel", { length: 20, enum: userTiers })
    .$type<UserTier>()
    .default("basic")
    .notNull(),
  isEmailVerified: boolean("isEmailVerified").default(false).notNull(),
  isPhoneVerified: boolean("isPhoneVerified").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow(),
  deletedAt: timestamp("deletedAt"),
});

export default users;