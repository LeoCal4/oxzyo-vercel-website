import { db } from '@/lib/db'
import { bggSyncJobs } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import SyncPanel from '@/components/admin/SyncPanel'

export const dynamic = 'force-dynamic'

export default async function SyncPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const recentJobs = await db
    .select()
    .from(bggSyncJobs)
    .orderBy(desc(bggSyncJobs.startedAt))
    .limit(5)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 font-[family-name:var(--font-poppins)]">BGG Sync</h1>
      <SyncPanel token={token} recentJobs={recentJobs} />
    </div>
  )
}
