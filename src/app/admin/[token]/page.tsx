import { db } from '@/lib/db'
import { games, events, bggSyncJobs } from '@/lib/db/schema'
import { count, desc, gte, or, isNull } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const today = new Date().toISOString().split('T')[0]

  const [gamesResult, eventsResult, lastSyncResult] = await Promise.all([
    db.select({ count: count() }).from(games),
    db.select({ count: count() }).from(events).where(
      or(isNull(events.date), gte(events.date, today))
    ),
    db.select().from(bggSyncJobs).orderBy(desc(bggSyncJobs.startedAt)).limit(1),
  ])

  const totalGames = gamesResult[0]?.count ?? 0
  const upcomingEvents = eventsResult[0]?.count ?? 0
  const lastSync = lastSyncResult[0]

  const lastSyncDisplay = lastSync?.completedAt
    ? new Date(lastSync.completedAt).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never'

  const lastSyncStatus = lastSync?.status ?? null

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 font-[family-name:var(--font-poppins)]">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Link
          href={`/admin/${token}/games`}
          className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-orange-400/40 transition-colors block"
        >
          <div className="text-3xl font-bold text-orange-400 mb-1">{totalGames}</div>
          <div className="text-sm text-gray-400">Games in library</div>
        </Link>
        <Link
          href={`/admin/${token}/events`}
          className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-orange-400/40 transition-colors block"
        >
          <div className="text-3xl font-bold text-orange-400 mb-1">{upcomingEvents}</div>
          <div className="text-sm text-gray-400">Upcoming events</div>
        </Link>
        <Link
          href={`/admin/${token}/sync`}
          className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-orange-400/40 transition-colors block"
        >
          <div className="text-base font-bold text-orange-400 mb-1 truncate">{lastSyncDisplay}</div>
          {lastSyncStatus && (
            <div className="text-xs text-gray-500 mb-1">Status: {lastSyncStatus}</div>
          )}
          <div className="text-sm text-gray-400">Last BGG sync</div>
        </Link>
      </div>

      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { href: `/admin/${token}/sync`, label: 'BGG Sync', desc: 'Trigger BGG import' },
          { href: `/admin/${token}/games`, label: 'Games Library', desc: 'Manage all games' },
          { href: `/admin/${token}/games/new`, label: 'Add Game', desc: 'Manually add a game' },
          { href: `/admin/${token}/events`, label: 'Events', desc: 'One-off & recurring' },
          { href: `/admin/${token}/content`, label: 'CMS Content', desc: 'Edit page content' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
          >
            <div className="font-medium text-sm mb-1">{item.label}</div>
            <div className="text-xs text-gray-500">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
