// src/db/schema/auditLogs.ts
import { mysqlTable, varchar, timestamp, json } from 'drizzle-orm/mysql-core';
import { createId } from '@paralleldrive/cuid2';

export const activityTypes = [
  'login',
  'logout',
  'profileUpdate',
  'passwordChange',
  'pinChange',
  'enableTwoFactor',
  'disableTwoFactor',
  'buyAirtime',
  'buyData',
  'transfer',
  'withdrawal',
  'deposit',
  'kycUpdate',
  'referralSignup',
  'referralEarning',
  'securityReset',
  'statusChange',
  'permissionChange',
  'transactionAction'
] as const;
export type ActivityType = typeof activityTypes[number];

export const clientSources = [
  'web',
  'mobileApp',
  'api',
  'pos',
  'ussd',
  'adminPortal',
  'merchantPos',
  'thirdPartyApp'
] as const;
export type ClientSource = typeof clientSources[number];

const auditLogs = mysqlTable('auditLogs', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('userId', { length: 128 }).notNull(),
  type: varchar('type', { length: 50, enum: activityTypes }).$type<ActivityType>().notNull(),
  description: varchar('description', { length: 255 }),
  
  // Client Source Information
  source: varchar('source', { length: 20, enum: clientSources }).$type<ClientSource>().notNull(),
  clientId: varchar('clientId', { length: 255 }),
  clientVersion: varchar('clientVersion', { length: 50 }),
  deviceId: varchar('deviceId', { length: 255 }),
  deviceInfo: json('deviceInfo').$type<{
    model?: string;
    os?: string;
    osVersion?: string;
    manufacturer?: string;
    brand?: string;
  }>(),
  
  // Request Information
  ipAddress: varchar('ipAddress', { length: 45 }),
  userAgent: varchar('userAgent', { length: 255 }),
  location: json('location').$type<{
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  }>(),
  
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export default auditLogs;