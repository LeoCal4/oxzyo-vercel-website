'use server'

import { db } from '@/lib/db'
import { games } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/utils/admin'
import { revalidatePath } from 'next/cache'

type ActionResult = { success: true } | { success: false; error: string }

export async function updateGameCustomFields(
  token: string,
  gameId: string,
  data: {
    timesPlayed: number
    clubRating: number | null
    staffPick: boolean
    lendingTo: string | null
  }
): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db
      .update(games)
      .set({
        timesPlayed: data.timesPlayed,
        clubRating: data.clubRating,
        staffPick: data.staffPick,
        lendingTo: data.lendingTo || null,
        updatedAt: new Date(),
      })
      .where(eq(games.id, gameId))
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateGameOverrides(
  token: string,
  gameId: string,
  data: {
    titleOverride: string | null
    imageOverride: string | null
  }
): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db
      .update(games)
      .set({
        titleOverride: data.titleOverride || null,
        imageOverride: data.imageOverride || null,
        updatedAt: new Date(),
      })
      .where(eq(games.id, gameId))
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function toggleStaffPick(
  token: string,
  gameId: string,
  current: boolean
): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db
      .update(games)
      .set({ staffPick: !current, updatedAt: new Date() })
      .where(eq(games.id, gameId))
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteGame(token: string, gameId: string): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db.delete(games).where(eq(games.id, gameId))
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function createManualGame(
  token: string,
  data: {
    title: string
    bggId: number | null
    imageUrl: string | null
    minPlayers: number | null
    maxPlayers: number | null
    minPlaytime: number | null
    maxPlaytime: number | null
    weight: number | null
    yearPublished: number | null
    timesPlayed: number
    clubRating: number | null
    staffPick: boolean
    lendingTo: string | null
  }
): Promise<ActionResult> {
  try {
    requireAdmin(token)
    await db.insert(games).values({
      title: data.title,
      bggId: data.bggId,
      imageUrl: data.imageUrl,
      minPlayers: data.minPlayers,
      maxPlayers: data.maxPlayers,
      minPlaytime: data.minPlaytime,
      maxPlaytime: data.maxPlaytime,
      weight: data.weight,
      yearPublished: data.yearPublished,
      timesPlayed: data.timesPlayed,
      clubRating: data.clubRating,
      staffPick: data.staffPick,
      lendingTo: data.lendingTo,
    })
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
