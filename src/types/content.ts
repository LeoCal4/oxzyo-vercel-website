import type { ContentBlock, BggSyncJob } from '@/lib/db/schema'

export type Locale = 'it' | 'en'

/** Predefined content block keys */
export type ContentBlockKey =
  | 'homepage.hero.tagline'
  | 'homepage.hero.cta'
  | 'homepage.intro'
  | 'about.story'
  | 'about.values'
  | 'join.process'
  | 'join.benefits'
  | 'join.fee_note'

export type { ContentBlock, BggSyncJob }
