import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bggSyncJobs } from '@/lib/db/schema'
import { runBggSync } from '@/lib/bgg/sync'

export async function POST(request: NextRequest) {
  const token = request.headers.get('x-admin-token')
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [job] = await db.insert(bggSyncJobs).values({ status: 'pending' }).returning({ id: bggSyncJobs.id })

  after(async () => {
    await runBggSync(job.id)
  })

  return NextResponse.json({ jobId: job.id }, { status: 202 })
}
