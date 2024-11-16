// src/db/schema/referral/settings.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  json,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";

// Type definitions for referral program configurations
export type ReferralReward = {
  type: 'fixed' | 'percentage';
  value: number;
  maxAmount?: number;
  minAmount?: number;
  currency: string;
};

export type ReferralCondition = {
  type: 'transaction' | 'deposit' | 'signup' | 'kyc_level';
  requirement: string | number;
  duration?: number; // in days
};

export type ReferralProgramConfig = {
  name: string;
  description: string;
  rewardType: 'one_time' | 'recurring';
  referrerReward: ReferralReward;
  refereeReward?: ReferralReward;
  conditions: ReferralCondition[];
  maxReferrals?: number;
  maxRewardsPerDay?: number;
  maxRewardsPerMonth?: number;
  cooldownPeriod?: number; // in days
};

const referralSettings = mysqlTable("referralSettings", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  
  // Flexible configuration stored as JSON
  configuration: json("configuration").$type<ReferralProgramConfig>().notNull(),
  
  metadata: json("metadata").$type<{
    displayOrder?: number;
    targetAudience?: string[];
    eligibilityCriteria?: Record<string, any>;
    [key: string]: any;
  }>(),
  
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export default referralSettings;