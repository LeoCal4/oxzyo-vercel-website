import {
  boolean,
  date,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const eventTypeEnum = pgEnum('event_type', [
  'game_night',
  'tournament',
  'special',
  'announcement',
])

export const contentBlockTypeEnum = pgEnum('content_block_type', ['text', 'markdown'])

export const syncStatusEnum = pgEnum('sync_status', [
  'pending',
  'in_progress',
  'completed',
  'failed',
])

// ─── Games ────────────────────────────────────────────────────────────────────

export const games = pgTable('games', {
  id:            uuid('id').primaryKey().defaultRandom(),
  bggId:         integer('bgg_id').unique(),
  title:         text('title').notNull(),
  titleOverride: text('title_override'),
  imageUrl:      text('image_url'),
  imageOverride: text('image_override'),
  minPlayers:    integer('min_players'),
  maxPlayers:    integer('max_players'),
  minPlaytime:   integer('min_playtime'),
  maxPlaytime:   integer('max_playtime'),
  weight:        doublePrecision('weight'),
  yearPublished: integer('year_published'),
  bggRating:     doublePrecision('bgg_rating'),
  bggSyncedAt:   timestamp('bgg_synced_at'),
  // Custom fields
  timesPlayed:   integer('times_played').default(0).notNull(),
  clubRating:    integer('club_rating'),
  staffPick:     boolean('staff_pick').default(false).notNull(),
  lendingTo:     text('lending_to'),
  // Meta
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
})

export const designers = pgTable('designers', {
  id:   uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
})

export const mechanics = pgTable('mechanics', {
  id:    uuid('id').primaryKey().defaultRandom(),
  name:  text('name').notNull().unique(),
  bggId: integer('bgg_id').unique(),
})

export const categories = pgTable('categories', {
  id:    uuid('id').primaryKey().defaultRandom(),
  name:  text('name').notNull().unique(),
  bggId: integer('bgg_id').unique(),
})

export const gameDesigners = pgTable(
  'game_designers',
  {
    gameId:     uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
    designerId: uuid('designer_id').notNull().references(() => designers.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.designerId] })],
)

export const gameMechanics = pgTable(
  'game_mechanics',
  {
    gameId:     uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
    mechanicId: uuid('mechanic_id').notNull().references(() => mechanics.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.mechanicId] })],
)

export const gameCategories = pgTable(
  'game_categories',
  {
    gameId:     uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.categoryId] })],
)

// ─── Events ───────────────────────────────────────────────────────────────────

export const events = pgTable('events', {
  id:            uuid('id').primaryKey().defaultRandom(),
  titleIt:       text('title_it').notNull(),
  titleEn:       text('title_en'),
  descriptionIt: text('description_it'),
  descriptionEn: text('description_en'),
  eventType:     eventTypeEnum('event_type').notNull(),
  date:          date('date'),
  startTime:     time('start_time'),
  endTime:       time('end_time'),
  locationText:  text('location_text'),
  useFixedVenue: boolean('use_fixed_venue').default(false).notNull(),
  imageUrl:      text('image_url'),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
})

export const recurringRules = pgTable('recurring_rules', {
  id:            uuid('id').primaryKey().defaultRandom(),
  titleIt:       text('title_it').notNull(),
  titleEn:       text('title_en'),
  descriptionIt: text('description_it'),
  descriptionEn: text('description_en'),
  eventType:     eventTypeEnum('event_type').notNull(),
  rrule:         text('rrule').notNull(),
  dtstart:       date('dtstart').notNull(),
  until:         date('until'),
  startTime:     time('start_time'),
  endTime:       time('end_time'),
  locationText:  text('location_text'),
  useFixedVenue: boolean('use_fixed_venue').default(false).notNull(),
  imageUrl:      text('image_url'),
  active:        boolean('active').default(true).notNull(),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
})

export const recurringExceptions = pgTable(
  'recurring_exceptions',
  {
    id:                    uuid('id').primaryKey().defaultRandom(),
    ruleId:                uuid('rule_id').notNull().references(() => recurringRules.id, { onDelete: 'cascade' }),
    exceptionDate:         date('exception_date').notNull(),
    isCancelled:           boolean('is_cancelled').default(true).notNull(),
    titleItOverride:       text('title_it_override'),
    titleEnOverride:       text('title_en_override'),
    descriptionItOverride: text('description_it_override'),
    descriptionEnOverride: text('description_en_override'),
    locationTextOverride:  text('location_text_override'),
    useFixedVenueOverride: boolean('use_fixed_venue_override'),
    startTimeOverride:     time('start_time_override'),
    endTimeOverride:       time('end_time_override'),
    createdAt:             timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [unique().on(t.ruleId, t.exceptionDate)],
)

// ─── CMS Content Blocks ───────────────────────────────────────────────────────

export const contentBlocks = pgTable('content_blocks', {
  id:          uuid('id').primaryKey().defaultRandom(),
  key:         text('key').notNull().unique(),
  label:       text('label').notNull(),
  contentType: contentBlockTypeEnum('content_type').notNull(),
  contentIt:   text('content_it').notNull(),
  contentEn:   text('content_en'),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
})

// ─── BGG Sync Jobs ────────────────────────────────────────────────────────────

export const bggSyncJobs = pgTable('bgg_sync_jobs', {
  id:            uuid('id').primaryKey().defaultRandom(),
  status:        syncStatusEnum('status').notNull().default('pending'),
  startedAt:     timestamp('started_at').defaultNow().notNull(),
  completedAt:   timestamp('completed_at'),
  gamesImported: integer('games_imported'),
  gamesUpdated:  integer('games_updated'),
  gamesTotal:    integer('games_total'),
  errorMessage:  text('error_message'),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const gamesRelations = relations(games, ({ many }) => ({
  gameDesigners:  many(gameDesigners),
  gameMechanics:  many(gameMechanics),
  gameCategories: many(gameCategories),
}))

export const designersRelations = relations(designers, ({ many }) => ({
  gameDesigners: many(gameDesigners),
}))

export const mechanicsRelations = relations(mechanics, ({ many }) => ({
  gameMechanics: many(gameMechanics),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  gameCategories: many(gameCategories),
}))

export const gameDesignersRelations = relations(gameDesigners, ({ one }) => ({
  game:     one(games,     { fields: [gameDesigners.gameId],     references: [games.id] }),
  designer: one(designers, { fields: [gameDesigners.designerId], references: [designers.id] }),
}))

export const gameMechanicsRelations = relations(gameMechanics, ({ one }) => ({
  game:     one(games,     { fields: [gameMechanics.gameId],     references: [games.id] }),
  mechanic: one(mechanics, { fields: [gameMechanics.mechanicId], references: [mechanics.id] }),
}))

export const gameCategoriesRelations = relations(gameCategories, ({ one }) => ({
  game:     one(games,      { fields: [gameCategories.gameId],     references: [games.id] }),
  category: one(categories, { fields: [gameCategories.categoryId], references: [categories.id] }),
}))

export const recurringRulesRelations = relations(recurringRules, ({ many }) => ({
  exceptions: many(recurringExceptions),
}))

export const recurringExceptionsRelations = relations(recurringExceptions, ({ one }) => ({
  rule: one(recurringRules, { fields: [recurringExceptions.ruleId], references: [recurringRules.id] }),
}))

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Game               = typeof games.$inferSelect
export type NewGame            = typeof games.$inferInsert
export type Designer           = typeof designers.$inferSelect
export type NewDesigner        = typeof designers.$inferInsert
export type Mechanic           = typeof mechanics.$inferSelect
export type NewMechanic        = typeof mechanics.$inferInsert
export type Category           = typeof categories.$inferSelect
export type NewCategory        = typeof categories.$inferInsert
export type GameDesigner       = typeof gameDesigners.$inferSelect
export type GameMechanic       = typeof gameMechanics.$inferSelect
export type GameCategory       = typeof gameCategories.$inferSelect

export type Event              = typeof events.$inferSelect
export type NewEvent           = typeof events.$inferInsert
export type RecurringRule      = typeof recurringRules.$inferSelect
export type NewRecurringRule   = typeof recurringRules.$inferInsert
export type RecurringException = typeof recurringExceptions.$inferSelect
export type NewRecurringException = typeof recurringExceptions.$inferInsert

export type ContentBlock       = typeof contentBlocks.$inferSelect
export type NewContentBlock    = typeof contentBlocks.$inferInsert
export type BggSyncJob         = typeof bggSyncJobs.$inferSelect
export type NewBggSyncJob      = typeof bggSyncJobs.$inferInsert
