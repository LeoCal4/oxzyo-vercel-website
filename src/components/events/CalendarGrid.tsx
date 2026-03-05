'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EventDetail } from './EventDetail'
import type { DisplayEvent } from '@/types/events'

const EVENT_COLORS: Record<DisplayEvent['eventType'], { dot: string; pill: string }> = {
  game_night:   { dot: 'bg-[#0076fb]', pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  tournament:   { dot: 'bg-[#fd7c01]', pill: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  special:      { dot: 'bg-purple-500', pill: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  announcement: { dot: 'bg-gray-400',  pill: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
}

/** Monday-first ISO day-of-week: 0 = Mon, 6 = Sun */
function isoDow(date: Date): number {
  return (date.getUTCDay() + 6) % 7
}

type Props = {
  events: DisplayEvent[]
  locale: string
}

export function CalendarGrid({ events, locale }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getUTCFullYear())
  const [month, setMonth] = useState(now.getUTCMonth())
  const [selectedEvent, setSelectedEvent] = useState<DisplayEvent | null>(null)

  const intlLocale = locale === 'it' ? 'it-IT' : 'en-GB'

  // Build event lookup: 'YYYY-MM-DD' -> DisplayEvent[]
  const byDay = new Map<string, DisplayEvent[]>()
  for (const event of events) {
    if (!event.date) continue
    const key = event.date.toISOString().slice(0, 10)
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(event)
  }

  // Day headers Mon–Sun
  const dayHeaders: string[] = []
  for (let i = 0; i < 7; i++) {
    dayHeaders.push(
      new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(intlLocale, { weekday: 'short' }),
    )
  }

  // Month grid
  const firstOfMonth = new Date(Date.UTC(year, month, 1))
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const startPad = isoDow(firstOfMonth)
  const monthLabel = firstOfMonth.toLocaleDateString(intlLocale, { month: 'long', year: 'numeric' })

  const cells: (number | null)[] = [
    ...Array<null>(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = new Date().toISOString().slice(0, 10)

  function prevMonth() {
    const d = new Date(Date.UTC(year, month - 1, 1))
    setYear(d.getUTCFullYear())
    setMonth(d.getUTCMonth())
  }

  function nextMonth() {
    const d = new Date(Date.UTC(year, month + 1, 1))
    setYear(d.getUTCFullYear())
    setMonth(d.getUTCMonth())
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Mese precedente"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold capitalize">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Mese successivo"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
          {dayHeaders.map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2 ${i < 6 ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const isLastRow = i >= cells.length - 7
            const isLastCol = (i + 1) % 7 === 0
            const borderClasses = [
              !isLastRow ? 'border-b border-gray-100 dark:border-gray-700/50' : '',
              !isLastCol ? 'border-r border-gray-100 dark:border-gray-700/50' : '',
            ].join(' ')

            if (!day) {
              return (
                <div
                  key={i}
                  className={`bg-gray-50/50 dark:bg-gray-800/20 min-h-[60px] sm:min-h-[84px] ${borderClasses}`}
                />
              )
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayEvents = byDay.get(dateStr) ?? []
            const isToday = dateStr === todayStr

            return (
              <div
                key={i}
                className={`bg-white dark:bg-gray-800 min-h-[60px] sm:min-h-[84px] p-1 ${borderClasses}`}
              >
                {/* Day number */}
                <div
                  className={`text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full mx-auto ${
                    isToday
                      ? 'bg-[#fd7c01] text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {day}
                </div>

                {/* Mobile: colored dots */}
                {dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 justify-center sm:hidden">
                    {dayEvents.map((e) => (
                      <button
                        key={e.key}
                        onClick={() => setSelectedEvent(e)}
                        className={`w-2 h-2 rounded-full ${EVENT_COLORS[e.eventType].dot}`}
                        aria-label={e.title}
                      />
                    ))}
                  </div>
                )}

                {/* Desktop: event pills */}
                <div className="hidden sm:flex flex-col gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <button
                      key={e.key}
                      onClick={() => setSelectedEvent(e)}
                      className={`w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded truncate ${EVENT_COLORS[e.eventType].pill}`}
                    >
                      {e.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          open={true}
          onOpenChange={(open) => { if (!open) setSelectedEvent(null) }}
        />
      )}
    </div>
  )
}
