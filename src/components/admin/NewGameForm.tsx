'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createManualGame } from '@/app/admin/[token]/games/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import ImageUploader from './ImageUploader'

interface NewGameFormProps {
  token: string
}

export default function NewGameForm({ token }: NewGameFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState('')
  const [bggId, setBggId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [minPlayers, setMinPlayers] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [minPlaytime, setMinPlaytime] = useState('')
  const [maxPlaytime, setMaxPlaytime] = useState('')
  const [weight, setWeight] = useState('')
  const [yearPublished, setYearPublished] = useState('')
  const [timesPlayed, setTimesPlayed] = useState('0')
  const [clubRating, setClubRating] = useState('')
  const [staffPick, setStaffPick] = useState(false)
  const [lendingTo, setLendingTo] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    startTransition(async () => {
      const result = await createManualGame(token, {
        title: title.trim(),
        bggId: bggId ? parseInt(bggId, 10) : null,
        imageUrl: imageUrl || null,
        minPlayers: minPlayers ? parseInt(minPlayers, 10) : null,
        maxPlayers: maxPlayers ? parseInt(maxPlayers, 10) : null,
        minPlaytime: minPlaytime ? parseInt(minPlaytime, 10) : null,
        maxPlaytime: maxPlaytime ? parseInt(maxPlaytime, 10) : null,
        weight: weight ? parseFloat(weight) : null,
        yearPublished: yearPublished ? parseInt(yearPublished, 10) : null,
        timesPlayed: parseInt(timesPlayed, 10) || 0,
        clubRating: clubRating ? parseInt(clubRating, 10) : null,
        staffPick,
        lendingTo: lendingTo || null,
      })
      if (result.success) {
        toast.success('Game created')
        router.push(`/admin/${token}/games`)
      } else {
        toast.error('Failed: ' + (result as { success: false; error: string }).error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Core info */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Game Info</h2>
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">BGG ID (optional)</Label>
            <Input
              type="number"
              value={bggId}
              onChange={(e) => setBggId(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Year Published</Label>
            <Input
              type="number"
              value={yearPublished}
              onChange={(e) => setYearPublished(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
          </div>
        </div>
        <div>
          <Label className="text-gray-400 text-xs mb-2 block">Cover Image URL</Label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… or upload below"
            className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-600 mb-2"
          />
          <ImageUploader onUpload={(url) => setImageUrl(url)} />
        </div>
      </div>

      {/* Player count & playtime */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Min Players</Label>
            <Input
              type="number"
              min={1}
              value={minPlayers}
              onChange={(e) => setMinPlayers(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Max Players</Label>
            <Input
              type="number"
              min={1}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Min Playtime (min)</Label>
            <Input
              type="number"
              min={0}
              value={minPlaytime}
              onChange={(e) => setMinPlaytime(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Max Playtime (min)</Label>
            <Input
              type="number"
              min={0}
              value={maxPlaytime}
              onChange={(e) => setMaxPlaytime(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Weight (1-5)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              step={0.01}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Club fields */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Club Fields</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Times Played</Label>
            <Input
              type="number"
              min={0}
              value={timesPlayed}
              onChange={(e) => setTimesPlayed(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Club Rating (1-5)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={clubRating}
              onChange={(e) => setClubRating(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
          </div>
        </div>
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Lending To</Label>
          <Input
            value={lendingTo}
            onChange={(e) => setLendingTo(e.target.value)}
            placeholder="Person's name"
            className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-600"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            id="staffPick"
            type="checkbox"
            checked={staffPick}
            onChange={(e) => setStaffPick(e.target.checked)}
            className="w-4 h-4 rounded accent-orange-500"
          />
          <Label htmlFor="staffPick" className="text-gray-300 cursor-pointer">Staff Pick</Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isPending ? 'Creating…' : 'Create Game'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/admin/${token}/games`)}
          className="text-gray-400 hover:text-white"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
