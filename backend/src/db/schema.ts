import {
  bigint,
  bigserial,
  boolean,
  char,
  date,
  index,
  inet,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['USER', 'ADMIN']);
export const collaboratorPermission = pgEnum('collaborator_permission', ['READ', 'WRITE']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 320 }).notNull(),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull().default('USER'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('users_email_unique').on(table.email),
    index('users_role_idx').on(table.role),
    index('users_active_idx').on(table.isActive),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: char('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
    userAgent: varchar('user_agent', { length: 500 }),
    ipAddress: inet('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('sessions_token_hash_unique').on(table.tokenHash),
    index('sessions_user_idx').on(table.userId),
    index('sessions_expiry_idx').on(table.expiresAt),
  ],
);

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: char('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('password_reset_tokens_hash_unique').on(table.tokenHash),
    index('password_reset_tokens_user_idx').on(table.userId),
    index('password_reset_tokens_expiry_idx').on(table.expiresAt),
  ],
);

export const itineraries = pgTable(
  'itineraries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 140 }).notNull(),
    destination: varchar('destination', { length: 140 }).notNull().default(''),
    description: text('description').notNull().default(''),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    endDate: date('end_date', { mode: 'string' }).notNull(),
    timezone: varchar('timezone', { length: 80 }).notNull().default('Europe/Madrid'),
    publicShareEnabled: boolean('public_share_enabled').notNull().default(true),
    shareTokenHash: char('share_token_hash', { length: 64 }).notNull(),
    shareTokenHint: varchar('share_token_hint', { length: 12 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('itineraries_share_hash_unique').on(table.shareTokenHash),
    index('itineraries_owner_idx').on(table.ownerId, table.updatedAt),
    index('itineraries_dates_idx').on(table.startDate, table.endDate),
  ],
);

export const itineraryCollaborators = pgTable(
  'itinerary_collaborators',
  {
    itineraryId: uuid('itinerary_id')
      .notNull()
      .references(() => itineraries.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    permission: collaboratorPermission('permission').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.itineraryId, table.userId] }),
    index('collaborators_user_idx').on(table.userId, table.updatedAt),
  ],
);

export const itineraryEntries = pgTable(
  'itinerary_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itineraryId: uuid('itinerary_id')
      .notNull()
      .references(() => itineraries.id, { onDelete: 'cascade' }),
    entryDate: date('entry_date', { mode: 'string' }).notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time'),
    title: varchar('title', { length: 160 }).notNull(),
    description: text('description').notNull().default(''),
    location: varchar('location', { length: 180 }).notNull().default(''),
    category: varchar('category', { length: 40 }).notNull().default('activity'),
    color: varchar('color', { length: 24 }).notNull().default('sage'),
    sortOrder: integer('sort_order').notNull().default(0),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('entries_itinerary_date_idx').on(
      table.itineraryId,
      table.entryDate,
      table.startTime,
      table.sortOrder,
    ),
    index('entries_updated_idx').on(table.updatedAt),
  ],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 80 }).notNull(),
    entityType: varchar('entity_type', { length: 80 }).notNull(),
    entityId: varchar('entity_id', { length: 100 }),
    metadata: jsonb('metadata').notNull().default({}),
    ipAddress: inet('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_actor_idx').on(table.actorUserId, table.createdAt),
    index('audit_entity_idx').on(table.entityType, table.entityId, table.createdAt),
    index('audit_created_idx').on(table.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type Itinerary = typeof itineraries.$inferSelect;
export type ItineraryEntry = typeof itineraryEntries.$inferSelect;
