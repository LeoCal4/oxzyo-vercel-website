'use server'

import { db } from '@/lib/db'
import { contentBlocks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/utils/admin'
import { revalidatePath } from 'next/cache'

type ActionResult = { success: true } | { success: false; error: string }

export async function updateContentBlock(
  token: string,
  key: string,
  contentIt: string,
  contentEn: string | null
): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db
      .update(contentBlocks)
      .set({
        contentIt,
        contentEn: contentEn || null,
        updatedAt: new Date(),
      })
      .where(eq(contentBlocks.key, key))
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
