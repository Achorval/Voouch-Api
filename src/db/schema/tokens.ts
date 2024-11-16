// src/db/schema/tokens.ts
import { mysqlTable, varchar, timestamp, boolean } from 'drizzle-orm/mysql-core';
import { createId } from '@paralleldrive/cuid2';

export const tokenTypes = [
  'emailVerification',
  'phoneVerification',
  'passwordReset',
  'refreshToken',
  'apiKey',
  'deviceVerification'
] as const;
export type TokenType = typeof tokenTypes[number];

const tokens = mysqlTable('tokens', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('userId', { length: 128 }).notNull(),
  type: varchar('type', { length: 50, enum: tokenTypes }).$type<TokenType>().notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  
  device: varchar('device', { length: 255 }),
  ipAddress: varchar('ipAddress', { length: 45 }),
  userAgent: varchar('userAgent', { length: 255 }),
  
  isUsed: boolean('isUsed').default(false).notNull(),
  isRevoked: boolean('isRevoked').default(false).notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  
  lastUsedAt: timestamp('lastUsedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull().onUpdateNow(),
});

export default tokens;