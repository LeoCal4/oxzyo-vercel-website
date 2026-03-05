import type { Game, Designer, Mechanic, Category } from '@/lib/db/schema'

/** Game with related designers, mechanics, and categories joined */
export type GameWithRelations = Game & {
  designers: Designer[]
  mechanics: Mechanic[]
  categories: Category[]
}

export type GameSortOption =
  | 'title'
  | 'titleDesc'
  | 'timesPlayed'
  | 'timesPlayedAsc'
  | 'minPlaytime'
  | 'minPlaytimeDesc'

/** Params accepted by fetchGames() */
export interface GameFilterParams {
  search?: string
  players?: number
  minTime?: number
  maxTime?: number
  minWeight?: number
  maxWeight?: number
  mechanics?: string[]
  categories?: string[]
  designers?: string[]
  staffPick?: boolean
  sort?: GameSortOption
  page?: number
}

/** Result returned by fetchGames() */
export interface GamesQueryResult {
  games: GameWithRelations[]
  total: number
  pageCount: number
}

export const PAGE_SIZE = 24
