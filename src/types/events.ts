import type { Event, RecurringRule, RecurringException } from '@/lib/db/schema'

/** A normalized event ready for display — used for both one-off and recurring instances */
export interface DisplayEvent {
  id: string
  /** Unique key combining source + id (e.g. "oneoff-uuid" or "recurring-uuid-2025-01-10") */
  key: string
  title: string
  description: string | null
  eventType: 'game_night' | 'tournament' | 'special' | 'announcement'
  date: Date | null
  startTime: string | null
  endTime: string | null
  locationText: string | null
  useFixedVenue: boolean
  imageUrl: string | null
  /** Source of this event */
  source: 'oneoff' | 'recurring'
  /** Original rule id if source is recurring */
  ruleId?: string
}

/** A generated instance from a recurring rule, before locale normalization */
export interface RecurringInstance {
  rule: RecurringRule
  date: Date
  exception: RecurringException | null
}

export type { Event, RecurringRule, RecurringException }
