import type { Game, Designer, Mechanic, Category } from '@/lib/db/schema'

/** Game with related designers, mechanics, and categories joined */
export type GameWithRelations = Game & {
  designers: Designer[]
  mechanics: Mechanic[]
  categories: Category[]
}

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
  page?: number
}

/** Result returned by fetchGames() */
export interface GamesQueryResult {
  games: GameWithRelations[]
  total: number
  pageCount: number
}

export const PAGE_SIZE = 24
