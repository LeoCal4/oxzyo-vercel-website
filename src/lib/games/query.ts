import { db } from '@/lib/db'
import {
  games,
  designers,
  mechanics,
  categories,
  gameDesigners,
  gameMechanics,
  gameCategories,
} from '@/lib/db/schema'
import { and, ilike, gte, lte, eq, isNull, or, count, asc, desc, inArray, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { GameFilterParams, GamesQueryResult, GameWithRelations } from '@/types/games'
import { PAGE_SIZE } from '@/types/games'

/**
 * Build Drizzle WHERE conditions from filter params.
 * Pure function — no DB calls, safe to unit-test.
 */
export function buildGameConditions(params: GameFilterParams): SQL[] {
  const {
    search,
    players,
    minTime,
    maxTime,
    minWeight,
    maxWeight,
    mechanics: mechIds,
    categories: catIds,
    designers: desIds,
    staffPick,
  } = params

  const conditions: SQL[] = []

  if (search?.trim()) {
    const term = `%${search.trim()}%`
    conditions.push(
      or(
        ilike(games.title, term),
        ilike(games.titleOverride, term),
        sql`EXISTS (SELECT 1 FROM game_designers gd
              JOIN designers d ON d.id = gd.designer_id
              WHERE gd.game_id = ${games.id}
                AND d.name ILIKE ${term})`,
      )!,
    )
  }

  // Player count: minPlayers <= players <= maxPlayers
  if (players != null) {
    conditions.push(or(isNull(games.minPlayers), lte(games.minPlayers, players))!)
    conditions.push(or(isNull(games.maxPlayers), gte(games.maxPlayers, players))!)
  }

  if (minTime != null) {
    conditions.push(or(isNull(games.minPlaytime), gte(games.minPlaytime, minTime))!)
  }
  if (maxTime != null) {
    conditions.push(or(isNull(games.maxPlaytime), lte(games.maxPlaytime, maxTime))!)
  }

  if (minWeight != null) {
    conditions.push(or(isNull(games.weight), gte(games.weight, minWeight))!)
  }
  if (maxWeight != null) {
    conditions.push(or(isNull(games.weight), lte(games.weight, maxWeight))!)
  }

  if (staffPick) {
    conditions.push(eq(games.staffPick, true))
  }

  // Each selected mechanic must be present (AND semantics via correlated EXISTS)
  for (const mechId of mechIds ?? []) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM game_mechanics WHERE game_id = ${games.id} AND mechanic_id = ${mechId})`,
    )
  }

  for (const catId of catIds ?? []) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM game_categories WHERE game_id = ${games.id} AND category_id = ${catId})`,
    )
  }

  for (const desId of desIds ?? []) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM game_designers WHERE game_id = ${games.id} AND designer_id = ${desId})`,
    )
  }

  return conditions
}

/** Fetch paginated games with relations attached. */
export async function fetchGames(params: GameFilterParams): Promise<GamesQueryResult> {
  const page = Math.max(1, params.page ?? 1)
  const conditions = buildGameConditions(params)
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [{ total }] = await db
    .select({ total: count() })
    .from(games)
    .where(where)

  const totalNum = Number(total)
  const pageCount = Math.max(1, Math.ceil(totalNum / PAGE_SIZE))
  const offset = (page - 1) * PAGE_SIZE

  // Determine sort order
  const orderByClauses =
    params.sort === 'titleDesc'
      ? [desc(games.title)]
      : params.sort === 'timesPlayed'
        ? [desc(games.timesPlayed), asc(games.title)]
        : params.sort === 'timesPlayedAsc'
          ? [asc(games.timesPlayed), asc(games.title)]
          : params.sort === 'minPlaytime'
            ? [sql`${games.minPlaytime} ASC NULLS LAST`, asc(games.title)]
            : params.sort === 'minPlaytimeDesc'
              ? [sql`${games.minPlaytime} DESC NULLS LAST`, asc(games.title)]
              : [asc(games.title)]

  // Get the ordered, paginated game IDs
  const rows = await db
    .select({ id: games.id })
    .from(games)
    .where(where)
    .orderBy(...orderByClauses)
    .limit(PAGE_SIZE)
    .offset(offset)

  if (rows.length === 0) {
    return { games: [], total: totalNum, pageCount }
  }

  const gameIds = rows.map((r) => r.id)

  // Fetch full game data + relations for these IDs using relational API
  const result = await db.query.games.findMany({
    where: inArray(games.id, gameIds),
    with: {
      gameDesigners: { with: { designer: true } },
      gameMechanics: { with: { mechanic: true } },
      gameCategories: { with: { category: true } },
    },
  })

  // Re-sort to match the ordered game IDs from the paginated query
  const orderMap = new Map(gameIds.map((id, i) => [id, i]))
  result.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))

  const gamesWithRelations: GameWithRelations[] = result.map((g) => ({
    ...g,
    designers: g.gameDesigners.map((gd) => gd.designer),
    mechanics: g.gameMechanics.map((gm) => gm.mechanic),
    categories: g.gameCategories.map((gc) => gc.category),
  }))

  return { games: gamesWithRelations, total: totalNum, pageCount }
}

/** Fetch all filter option lists for the filter sidebar. */
export async function fetchFilterOptions() {
  const [allMechanics, allCategories, allDesigners] = await Promise.all([
    db.select().from(mechanics).orderBy(asc(mechanics.name)),
    db.select().from(categories).orderBy(asc(categories.name)),
    db.select().from(designers).orderBy(asc(designers.name)),
  ])
  return { mechanics: allMechanics, categories: allCategories, designers: allDesigners }
}
