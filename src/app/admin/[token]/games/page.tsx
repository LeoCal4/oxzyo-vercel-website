import { db } from '@/lib/db'
import { games } from '@/lib/db/schema'
import { ilike, count } from 'drizzle-orm'
import { asc } from 'drizzle-orm'
import GamesAdminTable from '@/components/admin/GamesAdminTable'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

const ADMIN_PAGE_SIZE = 50

export default async function GamesAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const { token } = await params
  const { search, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * ADMIN_PAGE_SIZE

  const searchCondition = search
    ? ilike(games.title, `%${search}%`)
    : undefined

  const [totalResult, rows] = await Promise.all([
    db
      .select({ count: count() })
      .from(games)
      .where(searchCondition),
    db
      .select()
      .from(games)
      .where(searchCondition)
      .orderBy(asc(games.title))
      .limit(ADMIN_PAGE_SIZE)
      .offset(offset),
  ])

  const total = totalResult[0]?.count ?? 0
  const pageCount = Math.ceil(total / ADMIN_PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">
          Games <span className="text-gray-500 text-lg font-normal ml-2">{total} total</span>
        </h1>
        <Link href={`/admin/${token}/games/new`}>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white text-sm">
            + Add Game
          </Button>
        </Link>
      </div>
      <GamesAdminTable
        games={rows}
        token={token}
        search={search ?? ''}
        page={page}
        pageCount={pageCount}
      />
    </div>
  )
}
