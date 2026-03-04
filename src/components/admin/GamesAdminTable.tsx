'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Game } from '@/lib/db/schema'
import { toggleStaffPick, deleteGame } from '@/app/admin/[token]/games/actions'
import GameEditDialog from './GameEditDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface GamesAdminTableProps {
  games: Game[]
  token: string
  search: string
  page: number
  pageCount: number
}

export default function GamesAdminTable({
  games,
  token,
  search,
  page,
  pageCount,
}: GamesAdminTableProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(search)
  const [editGame, setEditGame] = useState<Game | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchValue) params.set('search', searchValue)
    params.set('page', '1')
    router.push(`/admin/${token}/games?${params.toString()}`)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', String(newPage))
    router.push(`/admin/${token}/games?${params.toString()}`)
  }

  function handleToggleStaff(game: Game) {
    startTransition(async () => {
      const result = await toggleStaffPick(token, game.id, game.staffPick)
      if (result.success) {
        router.refresh()
      } else {
        toast.error('Failed to update staff pick')
      }
    })
  }

  function handleDelete(game: Game) {
    if (!confirm(`Delete "${game.titleOverride ?? game.title}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteGame(token, game.id)
      if (result.success) {
        toast.success('Game deleted')
        router.refresh()
      } else {
        toast.error('Failed to delete game')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search by title…"
          className="bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500"
        />
        <Button type="submit" variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
          Search
        </Button>
        {search && (
          <Button
            type="button"
            variant="ghost"
            className="text-gray-500 hover:text-white"
            onClick={() => {
              setSearchValue('')
              router.push(`/admin/${token}/games`)
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800 bg-gray-900/50">
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">BGG ID</th>
                <th className="px-4 py-3 text-left font-medium">Played</th>
                <th className="px-4 py-3 text-left font-medium">Rating</th>
                <th className="px-4 py-3 text-left font-medium">Staff Pick</th>
                <th className="px-4 py-3 text-left font-medium">Lending</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {games.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No games found
                  </td>
                </tr>
              )}
              {games.map((game) => (
                <tr
                  key={game.id}
                  className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30"
                >
                  <td className="px-4 py-3 max-w-[240px]">
                    <div className="truncate font-medium text-gray-200">
                      {game.titleOverride ?? game.title}
                    </div>
                    {game.titleOverride && (
                      <div className="text-xs text-gray-600 truncate">{game.title}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {game.bggId ? (
                      <a
                        href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {game.bggId}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{game.timesPlayed}</td>
                  <td className="px-4 py-3 text-gray-300">{game.clubRating ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStaff(game)}
                      disabled={isPending}
                      className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                        game.staffPick
                          ? 'bg-orange-400/20 text-orange-400 hover:bg-orange-400/30'
                          : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {game.staffPick ? '★ Staff Pick' : '☆ No'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">
                    {game.lendingTo ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditGame(game)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(game)}
                        disabled={isPending}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-700 text-gray-400"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            ← Prev
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-700 text-gray-400"
            disabled={page >= pageCount}
            onClick={() => handlePageChange(page + 1)}
          >
            Next →
          </Button>
        </div>
      )}

      {/* Edit dialog */}
      {editGame && (
        <GameEditDialog
          game={editGame}
          token={token}
          onClose={() => setEditGame(null)}
          onSaved={() => {
            setEditGame(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
