'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Clock, MapPin, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { EventDetail } from './EventDetail'
import type { DisplayEvent } from '@/types/events'

function eventTypeBadgeClass(type: DisplayEvent['eventType']): string {
  switch (type) {
    case 'game_night':   return 'bg-[#0076fb] text-white hover:bg-[#0076fb]'
    case 'tournament':   return 'bg-[#fd7c01] text-white hover:bg-[#fd7c01]'
    case 'special':      return 'bg-purple-600 text-white hover:bg-purple-600'
    case 'announcement': return 'bg-gray-500 text-white hover:bg-gray-500'
  }
}

function formatTime(time: string | null): string | null {
  if (!time) return null
  const [h, m] = time.split(':')
  return `${h}:${m}`
}

type Props = {
  event: DisplayEvent
  className?: string
}

export function EventCard({ event, className }: Props) {
  const t = useTranslations('calendar')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const badgeClass = eventTypeBadgeClass(event.eventType)
  const badgeLabel = t(`eventTypes.${event.eventType}` as Parameters<typeof t>[0])
  const startTime = formatTime(event.startTime)
  const endTime = formatTime(event.endTime)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'w-full text-left group flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800',
          'hover:shadow-md hover:border-[#fd7c01]/40 transition-all dark:hover:border-[#fd7c01]/40',
          className,
        )}
        aria-label={t('openDetails', { title: event.title })}
      >
        {/* Date column — only for dated events */}
        {event.date && (
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 text-center">
            <span className="text-2xl font-bold font-[family-name:var(--font-poppins)] text-[#fd7c01] leading-none">
              {event.date.getUTCDate()}
            </span>
            <span className="text-xs uppercase text-gray-500 dark:text-gray-400 mt-0.5">
              {event.date.toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-GB', { month: 'short' })}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <Badge className={cn('text-xs', badgeClass)}>{badgeLabel}</Badge>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 group-hover:text-[#fd7c01] transition-colors" />
          </div>

          <h3 className="font-semibold text-sm leading-snug mb-1 group-hover:text-[#fd7c01] transition-colors">
            {event.title}
          </h3>

          {event.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{event.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            {startTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {startTime}
                {endTime ? `–${endTime}` : ''}
              </span>
            )}
            {(event.useFixedVenue || event.locationText) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.useFixedVenue ? t('fixedVenue') : event.locationText}
              </span>
            )}
          </div>
        </div>
      </button>

      <EventDetail event={event} open={open} onOpenChange={setOpen} />
    </>
  )
}
