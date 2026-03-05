'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Users, Clock, BookOpen } from 'lucide-react'
import { StaffPickBadge } from '@/components/StaffPickBadge'
import { cn, decodeHtml } from '@/lib/utils'
import type { GameWithRelations } from '@/types/games'

function weightColor(weight: number | null): string {
  if (weight == null) return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  if (weight < 2) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  if (weight < 3.5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
}

type Props = {
  game: GameWithRelations
  className?: string
}

export function GameListRow({ game, className }: Props) {
  const t = useTranslations('games')
  const title = decodeHtml(game.titleOverride ?? game.title)
  const imageUrl = game.imageOverride ?? game.imageUrl

  function weightLabel(weight: number | null): string {
    if (weight == null) return ''
    if (weight < 2) return t('weightLight')
    if (weight < 3.5) return t('weightMedium')
    return t('weightHeavy')
  }

  const players =
    game.minPlayers == null && game.maxPlayers == null
      ? null
      : game.minPlayers === game.maxPlayers
        ? String(game.minPlayers ?? game.maxPlayers)
        : `${game.minPlayers ?? '?'}–${game.maxPlayers ?? '?'}`

  const playtime =
    game.minPlaytime == null && game.maxPlaytime == null
      ? null
      : game.minPlaytime === game.maxPlaytime || game.maxPlaytime == null
        ? `${game.minPlaytime} min`
        : `${game.minPlaytime}–${game.maxPlaytime} min`

  const bggUrl = game.bggId ? `https://boardgamegeek.com/boardgame/${game.bggId}` : null

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700',
        className,
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Title + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {bggUrl ? (
            <a href={bggUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-sm truncate hover:text-[#fd7c01] transition-colors">
              {title}
            </a>
          ) : (
            <span className="font-medium text-sm truncate">{title}</span>
          )}
          {game.staffPick && <StaffPickBadge />}
          {game.lendingTo && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              {t('lendingBadge')}
            </span>
          )}
        </div>
        {game.designers.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
            {game.designers.map((d) => d.name).join(', ')}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 shrink-0">
        {players && (
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {players}
          </span>
        )}
        {playtime && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {playtime}
          </span>
        )}
        {game.weight != null && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 font-medium',
              weightColor(game.weight),
            )}
          >
            {weightLabel(game.weight)}
          </span>
        )}
      </div>
    </div>
  )
}
