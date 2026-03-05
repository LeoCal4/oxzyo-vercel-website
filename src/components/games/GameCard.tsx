'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Users, Clock, BookOpen } from 'lucide-react'
import { StaffPickBadge } from '@/components/StaffPickBadge'
import { cn, decodeHtml } from '@/lib/utils'
import type { GameWithRelations } from '@/types/games'

function weightColor(weight: number | null): string {
  if (weight == null) return 'bg-gray-100 text-gray-600'
  if (weight < 2) return 'bg-green-100 text-green-700'
  if (weight < 3.5) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

function playerRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return '–'
  if (min === max) return String(min ?? max)
  return `${min ?? '?'}–${max ?? '?'}`
}

function playtimeRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return '–'
  if (min === max || max == null) return `${min} min`
  return `${min}–${max} min`
}

type Props = {
  game: GameWithRelations
  className?: string
}

export function GameCard({ game, className }: Props) {
  const t = useTranslations('games')
  const title = decodeHtml(game.titleOverride ?? game.title)
  const imageUrl = game.imageOverride ?? game.imageUrl

  const bggUrl = game.bggId ? `https://boardgamegeek.com/boardgame/${game.bggId}` : null

  function weightLabel(weight: number | null): string {
    if (weight == null) return ''
    if (weight < 2) return t('weightLight')
    if (weight < 3.5) return t('weightMedium')
    return t('weightHeavy')
  }

  return (
    <div
      className={cn(
        'group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow',
        className,
      )}
    >
      {/* Cover image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <BookOpen className="h-12 w-12 text-gray-400" />
          </div>
        )}
        {game.staffPick && (
          <div className="absolute top-2 left-2">
            <StaffPickBadge />
          </div>
        )}
        {game.lendingTo && (
          <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            {t('lendingBadge')}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">
          {bggUrl ? (
            <a href={bggUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#fd7c01] transition-colors">
              {title}
            </a>
          ) : title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {playerRange(game.minPlayers, game.maxPlayers)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {playtimeRange(game.minPlaytime, game.maxPlaytime)}
          </span>
          {game.weight != null && (
            <span
              className={cn(
                'ml-auto rounded-full px-2 py-0.5 text-xs font-medium',
                weightColor(game.weight),
              )}
            >
              {weightLabel(game.weight)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
