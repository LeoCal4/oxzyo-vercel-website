import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Suspense } from 'react'
import { fetchGames, fetchFilterOptions } from '@/lib/games/query'

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'games' })
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://oxzyo.it'
  return {
    title: `${t('title')} | OxzyO`,
    description: t('description'),
    openGraph: {
      title: `${t('title')} | OxzyO`,
      description: t('description'),
      url: `${siteUrl}/${locale}/games`,
      siteName: 'OxzyO – Orizzonti Ludici',
      locale: locale === 'it' ? 'it_IT' : 'en_GB',
    },
  }
}
import { GameViewToggle } from '@/components/games/GameViewToggle'
import { GameFilters } from '@/components/games/GameFilters'
import { GamePagination } from '@/components/games/GamePagination'
import { GamesGridSkeleton } from '@/components/games/GameCardSkeleton'
import type { GameFilterParams } from '@/types/games'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function parseParams(raw: Record<string, string | string[] | undefined>): GameFilterParams {
  function str(v: string | string[] | undefined) {
    return Array.isArray(v) ? v[0] : v
  }
  function num(v: string | string[] | undefined) {
    const s = str(v)
    if (!s) return undefined
    const n = Number(s)
    return isNaN(n) ? undefined : n
  }
  function arr(v: string | string[] | undefined): string[] {
    if (!v) return []
    return Array.isArray(v) ? v : [v]
  }

  return {
    search: str(raw.search),
    players: num(raw.players),
    minTime: num(raw.minTime),
    maxTime: num(raw.maxTime),
    minWeight: num(raw.minWeight),
    maxWeight: num(raw.maxWeight),
    mechanics: arr(raw.mechanics),
    categories: arr(raw.categories),
    designers: arr(raw.designers),
    staffPick: str(raw.staffPick) === 'true',
    page: num(raw.page) ?? 1,
  }
}

async function GamesContent({ params }: { params: GameFilterParams }) {
  const { games, total, pageCount } = await fetchGames(params)
  const t = await getTranslations('games')

  if (games.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500">
        <p className="text-lg font-medium">{t('notFound')}</p>
        <p className="text-sm mt-1">{t('noResultsHint')}</p>
      </div>
    )
  }

  return (
    <>
      <GameViewToggle games={games} />
      <GamePagination page={params.page ?? 1} pageCount={pageCount} total={total} />
    </>
  )
}

export default async function GamesPage({
  params,
  searchParams,
}: {
  params: PageProps['params']
  searchParams: SearchParams
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const rawParams = await searchParams
  const filterParams = parseParams(rawParams)
  const t = await getTranslations('games')

  // Fetch filter options eagerly — fast query, needed for sidebar
  const filterOptions = await fetchFilterOptions()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] mb-6">
        {t('title')}
      </h1>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        <GameFilters
          mechanics={filterOptions.mechanics}
          categories={filterOptions.categories}
          designers={filterOptions.designers}
          currentParams={rawParams}
        />

        <div className="flex-1 min-w-0">
          <Suspense fallback={<GamesGridSkeleton />}>
            <GamesContent params={filterParams} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
