export const revalidate = 3600

import Image from 'next/image'
import { Mail, Instagram, Facebook } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { db } from '@/lib/db'
import { events, recurringRules, recurringExceptions, games } from '@/lib/db/schema'
import { gte, isNull, or, eq, asc } from 'drizzle-orm'
import { getContentBlocks } from '@/lib/content/blocks'
import { generateRecurringInstances } from '@/lib/events/generate'
import { mergeAndSortEvents } from '@/lib/events/merge'
import { EventList } from '@/components/events/EventList'
import { GameCard } from '@/components/games/GameCard'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'
import type { Locale } from '@/types/content'
import type { GameWithRelations } from '@/types/games'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'homepage' })
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://oxzyo.it'
  return {
    title: `${t('title')} | OxzyO`,
    description: t('description'),
    openGraph: {
      title: `${t('title')} | OxzyO`,
      description: t('description'),
      url: `${siteUrl}/${locale}`,
      siteName: 'OxzyO - Orizzonti Ludici',
      locale: locale === 'it' ? 'it_IT' : 'en_GB',
    },
  }
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

async function fetchHomePageData(locale: Locale) {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)
  const twoMonthsLater = new Date(today)
  twoMonthsLater.setUTCMonth(twoMonthsLater.getUTCMonth() + 2)

  const [oneOffEvents, activeRules, allExceptions, staffPickRows, contentData] = await Promise.all([
    db.select().from(events).where(or(isNull(events.date), gte(events.date, todayStr))),
    db.select().from(recurringRules).where(eq(recurringRules.active, true)),
    db.select().from(recurringExceptions),
    db.query.games.findMany({
      where: eq(games.staffPick, true),
      orderBy: asc(games.title),
      limit: 4,
      with: {
        gameDesigners: { with: { designer: true } },
        gameMechanics: { with: { mechanic: true } },
        gameCategories: { with: { category: true } },
      },
    }),
    getContentBlocks(
      ['homepage.hero.tagline', 'homepage.hero.cta', 'homepage.intro'],
      locale,
    ),
  ])

  const recurringInstances = generateRecurringInstances(
    activeRules,
    allExceptions,
    today,
    twoMonthsLater,
  )
  const allEventsDisplay = mergeAndSortEvents(oneOffEvents, recurringInstances, locale)
  const upcomingEvents = allEventsDisplay.filter((e) => e.date !== null).slice(0, 4)

  const staffPicks: GameWithRelations[] = staffPickRows.map((g) => ({
    ...g,
    designers: g.gameDesigners.map((gd) => gd.designer),
    mechanics: g.gameMechanics.map((gm) => gm.mechanic),
    categories: g.gameCategories.map((gc) => gc.category),
  }))

  return { upcomingEvents, staffPicks, contentData }
}

export default async function HomePage({ params }: Props) {
  const { locale: localeStr } = await params
  const locale = localeStr as Locale
  setRequestLocale(locale)
  const t = await getTranslations('homepage')
  const { upcomingEvents, staffPicks, contentData } = await fetchHomePageData(locale)

  const tagline = contentData['homepage.hero.tagline'] ?? ''
  const ctaLabel =
    contentData['homepage.hero.cta'] ?? (locale === 'it' ? 'Unisciti a noi' : 'Join us')
  const intro = contentData['homepage.intro'] ?? ''

  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-[#fd7c01] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center text-center gap-6">
          <Image
            src="/images/oxzyo_logo_no_bg.png"
            alt="OxzyO - Orizzonti Ludici"
            width={5000}
            height={5000}
            className="h-24 w-auto"
            priority
          />
          <h1 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-poppins)] leading-tight">
            OxzyO - Orizzonti Ludici
          </h1>
          {tagline && (
            <p className="text-lg sm:text-xl text-white/90 max-w-xl">{tagline}</p>
          )}
          <Button
            asChild
            size="lg"
            className="bg-white text-[#fd7c01] hover:bg-white/90 font-semibold mt-2"
          >
            <Link href="/join">{ctaLabel}</Link>
          </Button>
        </div>
      </section>

      {/* ── Intro ── */}
      {intro && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <MarkdownRenderer content={intro} className="text-gray-700 dark:text-gray-300" />
        </section>
      )}

      {/* ── Upcoming events ── */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-[family-name:var(--font-poppins)]">
              {t('upcomingEvents')}
            </h2>
            <Link
              href="/calendar"
              className="text-sm text-[#0076fb] hover:underline font-medium"
            >
              {t('seeAllEvents')} →
            </Link>
          </div>
          {upcomingEvents.length > 0 ? (
            <EventList events={upcomingEvents} />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm py-6">{t('noEvents')}</p>
          )}
        </div>
      </section>

      {/* ── Staff picks ── */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-[family-name:var(--font-poppins)]">
              {t('staffPicks')}
            </h2>
            <Link
              href="/games?staffPick=true"
              className="text-sm text-[#0076fb] hover:underline font-medium"
            >
              {t('seeAllGames')} →
            </Link>
          </div>
          {staffPicks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {staffPicks.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm py-6">{t('noStaffPicks')}</p>
          )}
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="bg-[#0076fb] text-white py-14">
        <div className="max-w-xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center gap-6">
          <h2 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">
            {t('contact.heading')}
          </h2>
          <Button
            asChild
            size="lg"
            className="bg-white text-[#0076fb] hover:bg-white/90 font-semibold"
          >
            <a href="mailto:tdg.pisa@gmail.com">
              <Mail className="h-4 w-4 mr-2" />
              {t('contact.button')}
            </a>
          </Button>
          <p className="text-white/80 text-sm">{t('contact.address')}</p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/oxyzo_orizzontiludici/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-white/80 hover:text-white transition-colors"
            >
              <Instagram className="h-6 w-6" />
            </a>
            <a
              href="https://www.facebook.com/OxyzOOrizzontiLudici/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-white/80 hover:text-white transition-colors"
            >
              <Facebook className="h-6 w-6" />
            </a>
            <a
              href="https://t.me/OxyzO_OrizzontiLudiciNEWS#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="text-white/80 hover:text-white transition-colors"
            >
              <TelegramIcon className="h-6 w-6" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
