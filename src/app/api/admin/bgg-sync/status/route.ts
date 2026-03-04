import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bggSyncJobs } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const token = request.headers.get('x-admin-token')
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [latest] = await db
    .select()
    .from(bggSyncJobs)
    .orderBy(desc(bggSyncJobs.startedAt))
    .limit(1)

  if (!latest) {
    return NextResponse.json(null)
  }

  return NextResponse.json(latest)
}
