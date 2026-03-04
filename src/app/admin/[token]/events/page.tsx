import { db } from '@/lib/db'
import { events, recurringRules, recurringExceptions } from '@/lib/db/schema'
import { asc, desc } from 'drizzle-orm'
import EventsAdminPanel from '@/components/admin/EventsAdminPanel'

export const dynamic = 'force-dynamic'

export default async function EventsAdminPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const [allEvents, allRules] = await Promise.all([
    db.select().from(events).orderBy(desc(events.date)),
    db.select().from(recurringRules).orderBy(asc(recurringRules.titleIt)),
  ])

  // Load exceptions for all rules
  const allExceptions = await db.select().from(recurringExceptions).orderBy(asc(recurringExceptions.exceptionDate))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 font-[family-name:var(--font-poppins)]">Events</h1>
      <EventsAdminPanel
        token={token}
        events={allEvents}
        rules={allRules}
        exceptions={allExceptions}
      />
    </div>
  )
}
