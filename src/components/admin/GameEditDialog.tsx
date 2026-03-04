'use client'

import { useState, useTransition } from 'react'
import { Game } from '@/lib/db/schema'
import { updateGameCustomFields, updateGameOverrides } from '@/app/admin/[token]/games/actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import ImageUploader from './ImageUploader'

interface GameEditDialogProps {
  game: Game
  token: string
  onClose: () => void
  onSaved: () => void
}

export default function GameEditDialog({ game, token, onClose, onSaved }: GameEditDialogProps) {
  const [isPending, startTransition] = useTransition()

  // Custom fields state
  const [timesPlayed, setTimesPlayed] = useState(String(game.timesPlayed))
  const [clubRating, setClubRating] = useState(String(game.clubRating ?? ''))
  const [staffPick, setStaffPick] = useState(game.staffPick)
  const [lendingTo, setLendingTo] = useState(game.lendingTo ?? '')

  // Override fields state
  const [titleOverride, setTitleOverride] = useState(game.titleOverride ?? '')
  const [imageOverride, setImageOverride] = useState(game.imageOverride ?? '')

  function saveCustomFields() {
    startTransition(async () => {
      const result = await updateGameCustomFields(token, game.id, {
        timesPlayed: Math.max(0, parseInt(timesPlayed, 10) || 0),
        clubRating: clubRating ? parseInt(clubRating, 10) : null,
        staffPick,
        lendingTo: lendingTo || null,
      })
      if (result.success) {
        toast.success('Custom fields updated')
        onSaved()
      } else {
        toast.error('Update failed: ' + (result as { success: false; error: string }).error)
      }
    })
  }

  function saveOverrides() {
    startTransition(async () => {
      const result = await updateGameOverrides(token, game.id, {
        titleOverride: titleOverride || null,
        imageOverride: imageOverride || null,
      })
      if (result.success) {
        toast.success('Overrides updated')
        onSaved()
      } else {
        toast.error('Update failed: ' + (result as { success: false; error: string }).error)
      }
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-100">
            Edit: {game.titleOverride ?? game.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="custom">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="custom" className="data-[state=active]:bg-gray-700 text-gray-400 data-[state=active]:text-white">
              Custom Fields
            </TabsTrigger>
            <TabsTrigger value="overrides" className="data-[state=active]:bg-gray-700 text-gray-400 data-[state=active]:text-white">
              Overrides
            </TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-4 mt-4">
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
                <Label className="text-gray-400 text-xs mb-1 block">Club Rating (1–5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={clubRating}
                  onChange={(e) => setClubRating(e.target.value)}
                  placeholder="—"
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Lending To</Label>
              <Input
                value={lendingTo}
                onChange={(e) => setLendingTo(e.target.value)}
                placeholder="Person's name (leave blank if in library)"
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
              <Label htmlFor="staffPick" className="text-gray-300 cursor-pointer">
                Staff Pick
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={saveCustomFields}
                disabled={isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Save
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="overrides" className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Title Override</Label>
              <Input
                value={titleOverride}
                onChange={(e) => setTitleOverride(e.target.value)}
                placeholder={game.title}
                className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-600"
              />
              <p className="text-xs text-gray-600 mt-1">Replaces the BGG title on the public site</p>
            </div>
            <div>
              <Label className="text-gray-400 text-xs mb-2 block">Image Override URL</Label>
              <Input
                value={imageOverride}
                onChange={(e) => setImageOverride(e.target.value)}
                placeholder="https://… or upload below"
                className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-600 mb-2"
              />
              <ImageUploader onUpload={(url) => setImageOverride(url)} />
              {imageOverride && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageOverride} alt="preview" className="h-20 w-20 object-cover rounded border border-gray-700" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={saveOverrides}
                disabled={isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Save
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
