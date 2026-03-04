import { db } from '@/lib/db'
import { contentBlocks } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import type { ContentBlockKey, Locale } from '@/types/content'

/**
 * Fetch a single content block and return the localized content.
 * Falls back to Italian if English is null.
 */
export async function getContentBlock(key: ContentBlockKey, locale: Locale): Promise<string> {
  const rows = await db.select().from(contentBlocks).where(eq(contentBlocks.key, key))
  const block = rows[0]
  if (!block) return ''
  if (locale === 'en' && block.contentEn) return block.contentEn
  return block.contentIt
}

/**
 * Fetch multiple content blocks in a single query.
 * Returns a Record keyed by content block key.
 * Falls back to Italian per block if English is null.
 */
export async function getContentBlocks(
  keys: ContentBlockKey[],
  locale: Locale,
): Promise<Record<string, string>> {
  if (keys.length === 0) return {}
  const rows = await db.select().from(contentBlocks).where(inArray(contentBlocks.key, keys))
  const result: Record<string, string> = {}
  for (const block of rows) {
    result[block.key] = locale === 'en' && block.contentEn ? block.contentEn : block.contentIt
  }
  return result
}
