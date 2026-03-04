export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { events, recurringRules, recurringExceptions } from '@/lib/db/schema'
import { gte, isNull, or, eq } from 'drizzle-orm'
import { getLocale, getTranslations } from 'next-intl/server'

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'calendar' })
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://oxzyo.it'
  return {
    title: `${t('title')} | OxzyO`,
    description: t('description'),
    openGraph: {
      title: `${t('title')} | OxzyO`,
      description: t('description'),
      url: `${siteUrl}/${locale}/calendar`,
      siteName: 'OxzyO – Orizzonti Ludici',
      locale: locale === 'it' ? 'it_IT' : 'en_GB',
    },
  }
}
import { generateRecurringInstances } from '@/lib/events/generate'
import { mergeAndSortEvents } from '@/lib/events/merge'
import { EventList } from '@/components/events/EventList'
import { MapEmbed } from '@/components/MapEmbed'
import type { Locale } from '@/types/content'

async function fetchCalendarData() {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)

  const twoMonthsLater = new Date(today)
  twoMonthsLater.setUTCMonth(twoMonthsLater.getUTCMonth() + 2)

  const [oneOffEvents, activeRules, allExceptions] = await Promise.all([
    // One-off events: date >= today, or dateless announcements
    db
      .select()
      .from(events)
      .where(or(isNull(events.date), gte(events.date, todayStr))),
    // Active recurring rules
    db.select().from(recurringRules).where(eq(recurringRules.active, true)),
    // All exceptions (table is small; no subquery needed)
    db.select().from(recurringExceptions),
  ])

  return { oneOffEvents, activeRules, allExceptions, today, twoMonthsLater }
}

export default async function CalendarPage() {
  const locale = (await getLocale()) as Locale
  const { oneOffEvents, activeRules, allExceptions, today, twoMonthsLater } =
    await fetchCalendarData()

  const recurringInstances = generateRecurringInstances(
    activeRules,
    allExceptions,
    today,
    twoMonthsLater,
  )

  const allEvents = mergeAndSortEvents(oneOffEvents, recurringInstances, locale)

  const datedEvents = allEvents.filter((e) => e.date !== null)
  const announcements = allEvents.filter((e) => e.date === null)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] mb-1">
        Calendario
      </h1>
      <p className="text-gray-500 text-sm mb-8">Prossimi eventi e serate del club</p>

      {/* Upcoming dated events */}
      <section aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="text-lg font-semibold mb-4">
          Prossimi eventi
        </h2>
        {datedEvents.length > 0 ? (
          <EventList events={datedEvents} />
        ) : (
          <p className="text-gray-500 text-sm py-6">Nessun evento in programma.</p>
        )}
      </section>

      {/* Dateless announcements */}
      {announcements.length > 0 && (
        <section aria-labelledby="announcements-heading" className="mt-10">
          <h2 id="announcements-heading" className="text-lg font-semibold mb-4">
            Annunci
          </h2>
          <EventList events={announcements} />
        </section>
      )}

      {/* Fixed venue map */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold mb-1">La nostra sede</h2>
        <p className="text-sm text-gray-500 mb-3">Via Bonanno Pisano 20, Pisa</p>
        <MapEmbed />
      </section>
    </div>
  )
}
