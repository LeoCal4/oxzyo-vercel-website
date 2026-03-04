import { db } from '@/lib/db'
import { contentBlocks } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import ContentBlocksPanel from '@/components/admin/ContentBlocksPanel'

export const dynamic = 'force-dynamic'

export default async function ContentPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const blocks = await db.select().from(contentBlocks).orderBy(asc(contentBlocks.key))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 font-[family-name:var(--font-poppins)]">Content</h1>
      <p className="text-sm text-gray-500 mb-8">Edit CMS content blocks for all public pages.</p>
      <ContentBlocksPanel token={token} blocks={blocks} />
    </div>
  )
}
