import { describe, test, expect, vi } from 'vitest'

// Mock the db module so buildGameConditions can be imported without a live DB connection
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn(),
        innerJoin: vi.fn().mockReturnValue({ where: vi.fn() }),
      }),
    }),
    query: { games: { findMany: vi.fn() } },
  },
}))

import { buildGameConditions } from '@/lib/games/query'

describe('buildGameConditions', () => {
  test('returns empty array when no filters provided', () => {
    expect(buildGameConditions({})).toHaveLength(0)
  })

  test('returns empty array when staffPick is false', () => {
    expect(buildGameConditions({ staffPick: false })).toHaveLength(0)
  })

  test('adds one condition for staffPick=true', () => {
    expect(buildGameConditions({ staffPick: true })).toHaveLength(1)
  })

  test('adds one OR-condition for search text', () => {
    expect(buildGameConditions({ search: 'catan' })).toHaveLength(1)
  })

  test('ignores blank search string', () => {
    expect(buildGameConditions({ search: '   ' })).toHaveLength(0)
  })

  test('player count adds two conditions (min ≤ N ≤ max)', () => {
    // minPlayers <= players AND maxPlayers >= players → two conditions
    expect(buildGameConditions({ players: 4 })).toHaveLength(2)
  })

  test('minTime adds one condition', () => {
    expect(buildGameConditions({ minTime: 30 })).toHaveLength(1)
  })

  test('maxTime adds one condition', () => {
    expect(buildGameConditions({ maxTime: 90 })).toHaveLength(1)
  })

  test('minTime + maxTime adds two conditions', () => {
    expect(buildGameConditions({ minTime: 30, maxTime: 90 })).toHaveLength(2)
  })

  test('minWeight adds one condition', () => {
    expect(buildGameConditions({ minWeight: 2 })).toHaveLength(1)
  })

  test('maxWeight adds one condition', () => {
    expect(buildGameConditions({ maxWeight: 3.5 })).toHaveLength(1)
  })

  test('each mechanic ID adds one EXISTS condition', () => {
    const ids = ['id-a', 'id-b', 'id-c']
    expect(buildGameConditions({ mechanics: ids })).toHaveLength(3)
  })

  test('each category ID adds one EXISTS condition', () => {
    expect(buildGameConditions({ categories: ['id-x', 'id-y'] })).toHaveLength(2)
  })

  test('each designer ID adds one EXISTS condition', () => {
    expect(buildGameConditions({ designers: ['id-d'] })).toHaveLength(1)
  })

  test('combines multiple filter types correctly', () => {
    // players=2 → +2, maxWeight=3 → +1, staffPick=true → +1
    expect(buildGameConditions({ players: 2, maxWeight: 3, staffPick: true })).toHaveLength(4)
  })

  test('empty arrays for mechanics/categories/designers add no conditions', () => {
    expect(buildGameConditions({ mechanics: [], categories: [], designers: [] })).toHaveLength(0)
  })
})
