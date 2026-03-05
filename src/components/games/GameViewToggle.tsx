'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GameCard } from './GameCard'
import { GameListRow } from './GameListRow'
import { GamesGridSkeleton, GameCardSkeleton } from './GameCardSkeleton'
import { GamesListSkeleton } from './GameListRowSkeleton'
import type { GameWithRelations } from '@/types/games'

const STORAGE_KEY = 'gameView'

type View = 'grid' | 'list'

type Props = {
  games: GameWithRelations[]
}

export function GameViewToggle({ games }: Props) {
  const t = useTranslations('games')
  const [view, setView] = useState<View>('grid')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as View | null
    if (saved === 'list' || saved === 'grid') setView(saved)
    setMounted(true)
  }, [])

  function switchView(v: View) {
    setView(v)
    localStorage.setItem(STORAGE_KEY, v)
  }

  return (
    <div>
      {/* Toggle buttons */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => switchView('grid')}
            aria-label={t('viewGrid')}
            aria-pressed={view === 'grid'}
            className={cn(
              'p-2 transition-colors',
              view === 'grid' ? 'bg-[#fd7c01] text-white' : 'bg-white hover:bg-gray-50',
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => switchView('list')}
            aria-label={t('viewList')}
            aria-pressed={view === 'list'}
            className={cn(
              'p-2 transition-colors',
              view === 'list' ? 'bg-[#fd7c01] text-white' : 'bg-white hover:bg-gray-50',
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Game items — show skeleton on first render to avoid hydration mismatch */}
      {!mounted ? (
        <GamesGridSkeleton count={Math.min(games.length, 24)} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {games.map((game) => (
            <GameListRow key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}
