import Link from 'next/link'
import NewGameForm from '@/components/admin/NewGameForm'

export default async function NewGamePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/${token}/games`} className="text-gray-500 hover:text-gray-300 text-sm">
          ← Games
        </Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">Add Game</h1>
      </div>
      <NewGameForm token={token} />
    </div>
  )
}
