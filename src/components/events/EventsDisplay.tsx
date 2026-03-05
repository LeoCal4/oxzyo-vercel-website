'use client'

import { useState } from 'react'
import { List, CalendarDays } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EventList } from './EventList'
import { CalendarGrid } from './CalendarGrid'
import type { DisplayEvent } from '@/types/events'

function groupByMonth(events: DisplayEvent[]): [string, DisplayEvent[]][] {
  const map = new Map<string, DisplayEvent[]>()
  for (const event of events) {
    const key = event.date!.toISOString().slice(0, 7)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(event)
  }
  return Array.from(map.entries())
}

type Props = {
  datedEvents: DisplayEvent[]
  announcements: DisplayEvent[]
  locale: string
}

export function EventsDisplay({ datedEvents, announcements, locale }: Props) {
  const t = useTranslations('calendar')
  const [view, setView] = useState<'list' | 'calendar'>('list')

  const intlLocale = locale === 'it' ? 'it-IT' : 'en-GB'
  const monthGroups = groupByMonth(datedEvents)

  return (
    <>
      {/* Upcoming dated events */}
      <section aria-labelledby="upcoming-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="upcoming-heading" className="text-lg font-semibold">
            {t('upcomingEvents')}
          </h2>
          <div className="flex items-center gap-0.5 p-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={() => setView('list')}
              aria-label={t('viewList')}
              aria-pressed={view === 'list'}
              className={`p-1.5 rounded-md transition-colors ${
                view === 'list'
                  ? 'bg-white dark:bg-gray-700 text-[#fd7c01] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('calendar')}
              aria-label={t('viewCalendar')}
              aria-pressed={view === 'calendar'}
              className={`p-1.5 rounded-md transition-colors ${
                view === 'calendar'
                  ? 'bg-white dark:bg-gray-700 text-[#fd7c01] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
        </div>

        {datedEvents.length > 0 ? (
          view === 'list' ? (
            <div className="space-y-6">
              {monthGroups.map(([key, events]) => {
                const monthLabel = new Date(key + '-01T00:00:00Z').toLocaleDateString(intlLocale, {
                  month: 'long',
                  year: 'numeric',
                })
                return (
                  <div key={key}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 capitalize">
                      {monthLabel}
                    </h3>
                    <EventList events={events} />
                  </div>
                )
              })}
            </div>
          ) : (
            <CalendarGrid events={datedEvents} locale={locale} />
          )
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm py-6">{t('noEvents')}</p>
        )}
      </section>

      {/* Dateless announcements — shown regardless of view mode */}
      {announcements.length > 0 && (
        <section aria-labelledby="announcements-heading" className="mt-10">
          <h2 id="announcements-heading" className="text-lg font-semibold mb-4">
            {t('announcements')}
          </h2>
          <EventList events={announcements} />
        </section>
      )}
    </>
  )
}
