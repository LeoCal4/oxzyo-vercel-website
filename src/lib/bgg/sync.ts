import { inArray, sql, eq } from 'drizzle-orm'
import { db } from '../db'
import {
  bggSyncJobs,
  categories,
  designers,
  gameCategories,
  gameDesigners,
  gameMechanics,
  games,
  mechanics,
} from '../db/schema'
import { fetchCollection, fetchThings } from './client'
import { parseCollection, parseThings } from './parser'

const BGG_THING_BATCH_SIZE = 100

export async function runBggSync(jobId: string): Promise<void> {
  try {
    await db
      .update(bggSyncJobs)
      .set({ status: 'in_progress', startedAt: new Date() })
      .where(eq(bggSyncJobs.id, jobId))

    // 1. Fetch and parse collection
    const username = process.env.BGG_USERNAME ?? 'orizzontiludici'
    const collectionXml = await fetchCollection(username)
    const collectionItems = parseCollection(collectionXml)

    if (collectionItems.length === 0) {
      await db
        .update(bggSyncJobs)
        .set({ status: 'completed', completedAt: new Date(), gamesImported: 0, gamesUpdated: 0, gamesTotal: 0 })
        .where(eq(bggSyncJobs.id, jobId))
      return
    }

    // 2. Batch fetch thing details (mechanics, categories, designers)
    // Requires a registered BGG_API_TOKEN. If unavailable (401), the sync still
    // completes with core game data — enrichment is skipped with a warning.
    const bggIds = collectionItems.map((item) => item.bggId)
    const allThings = []
    let thingsSkipped = false
    try {
      for (let i = 0; i < bggIds.length; i += BGG_THING_BATCH_SIZE) {
        const batch = bggIds.slice(i, i + BGG_THING_BATCH_SIZE)
        const xml = await fetchThings(batch)
        allThings.push(...parseThings(xml))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('401')) {
        console.warn(
          'BGG things API returned 401 — skipping mechanics/categories/designers enrichment. ' +
            'Set BGG_API_TOKEN to enable full sync.',
        )
        thingsSkipped = true
      } else {
        throw err
      }
    }
    const thingMap = new Map(allThings.map((t) => [t.bggId, t]))

    // 3. Determine which games already exist (to count imported vs updated)
    const existingBggIds = new Set(
      (await db.select({ bggId: games.bggId }).from(games).where(inArray(games.bggId, bggIds)))
        .map((g) => g.bggId)
        .filter((id): id is number => id !== null),
    )

    // 4. Batch upsert games — preserve custom fields on conflict
    const now = new Date()
    const gameValues = collectionItems.map((item) => ({
      bggId: item.bggId,
      title: item.title,
      imageUrl: item.imageUrl,
      yearPublished: item.yearPublished,
      minPlayers: item.minPlayers,
      maxPlayers: item.maxPlayers,
      minPlaytime: item.minPlaytime,
      maxPlaytime: item.maxPlaytime,
      bggRating: item.bggRating,
      weight: thingMap.get(item.bggId)?.weight ?? null,
      bggSyncedAt: now,
      updatedAt: now,
    }))

    await db
      .insert(games)
      .values(gameValues)
      .onConflictDoUpdate({
        target: games.bggId,
        set: {
          title: sql`excluded.title`,
          imageUrl: sql`excluded.image_url`,
          yearPublished: sql`excluded.year_published`,
          minPlayers: sql`excluded.min_players`,
          maxPlayers: sql`excluded.max_players`,
          minPlaytime: sql`excluded.min_playtime`,
          maxPlaytime: sql`excluded.max_playtime`,
          bggRating: sql`excluded.bgg_rating`,
          weight: sql`excluded.weight`,
          bggSyncedAt: sql`excluded.bgg_synced_at`,
          updatedAt: sql`excluded.updated_at`,
          // Custom fields (timesPlayed, clubRating, staffPick, lendingTo) are intentionally omitted
        },
      })

    const gamesImported = bggIds.filter((id) => !existingBggIds.has(id)).length
    const gamesUpdated = bggIds.filter((id) => existingBggIds.has(id)).length

    // 5. Fetch game UUIDs for junction tables
    const gameRecords = await db
      .select({ id: games.id, bggId: games.bggId })
      .from(games)
      .where(inArray(games.bggId, bggIds))
    const gameIdMap = new Map<number, string>()
    for (const g of gameRecords) {
      if (g.bggId !== null) gameIdMap.set(g.bggId, g.id)
    }

    // 6. Collect unique mechanics, categories, designers across all synced games
    const allMechanicsMap = new Map<number, string>()
    const allCategoriesMap = new Map<number, string>()
    const allDesignersSet = new Set<string>()

    for (const detail of allThings) {
      for (const m of detail.mechanics) allMechanicsMap.set(m.bggId, m.name)
      for (const c of detail.categories) allCategoriesMap.set(c.bggId, c.name)
      for (const d of detail.designers) allDesignersSet.add(d.name)
    }

    // 7. Batch upsert mechanics
    if (allMechanicsMap.size > 0) {
      await db
        .insert(mechanics)
        .values([...allMechanicsMap.entries()].map(([bggId, name]) => ({ bggId, name })))
        .onConflictDoUpdate({ target: mechanics.bggId, set: { name: sql`excluded.name` } })
    }

    // 8. Batch upsert categories
    if (allCategoriesMap.size > 0) {
      await db
        .insert(categories)
        .values([...allCategoriesMap.entries()].map(([bggId, name]) => ({ bggId, name })))
        .onConflictDoUpdate({ target: categories.bggId, set: { name: sql`excluded.name` } })
    }

    // 9. Batch upsert designers (conflict on name, no bggId)
    if (allDesignersSet.size > 0) {
      await db
        .insert(designers)
        .values([...allDesignersSet].map((name) => ({ name })))
        .onConflictDoNothing()
    }

    // 10. Fetch lookup maps for IDs
    const mechanicRecords = await db.select({ id: mechanics.id, bggId: mechanics.bggId }).from(mechanics)
    const mechanicIdMap = new Map<number, string>()
    for (const m of mechanicRecords) {
      if (m.bggId !== null) mechanicIdMap.set(m.bggId, m.id)
    }

    const categoryRecords = await db.select({ id: categories.id, bggId: categories.bggId }).from(categories)
    const categoryIdMap = new Map<number, string>()
    for (const c of categoryRecords) {
      if (c.bggId !== null) categoryIdMap.set(c.bggId, c.id)
    }

    const designerRecords = await db.select({ id: designers.id, name: designers.name }).from(designers)
    const designerIdMap = new Map<string, string>()
    for (const d of designerRecords) designerIdMap.set(d.name, d.id)

    // 11. Build and batch insert junction rows
    const mechanicJunctions: { gameId: string; mechanicId: string }[] = []
    const categoryJunctions: { gameId: string; categoryId: string }[] = []
    const designerJunctions: { gameId: string; designerId: string }[] = []

    for (const detail of allThings) {
      const gameId = gameIdMap.get(detail.bggId)
      if (!gameId) continue

      for (const m of detail.mechanics) {
        const mechanicId = mechanicIdMap.get(m.bggId)
        if (mechanicId) mechanicJunctions.push({ gameId, mechanicId })
      }
      for (const c of detail.categories) {
        const categoryId = categoryIdMap.get(c.bggId)
        if (categoryId) categoryJunctions.push({ gameId, categoryId })
      }
      for (const d of detail.designers) {
        const designerId = designerIdMap.get(d.name)
        if (designerId) designerJunctions.push({ gameId, designerId })
      }
    }

    if (mechanicJunctions.length > 0) {
      await db.insert(gameMechanics).values(mechanicJunctions).onConflictDoNothing()
    }
    if (categoryJunctions.length > 0) {
      await db.insert(gameCategories).values(categoryJunctions).onConflictDoNothing()
    }
    if (designerJunctions.length > 0) {
      await db.insert(gameDesigners).values(designerJunctions).onConflictDoNothing()
    }

    await db
      .update(bggSyncJobs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        gamesImported,
        gamesUpdated,
        gamesTotal: collectionItems.length,
        ...(thingsSkipped
          ? { errorMessage: 'Things enrichment skipped (no BGG_API_TOKEN). Core game data synced.' }
          : {}),
      })
      .where(eq(bggSyncJobs.id, jobId))
  } catch (error) {
    await db
      .update(bggSyncJobs)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      .where(eq(bggSyncJobs.id, jobId))
    throw error
  }
}
