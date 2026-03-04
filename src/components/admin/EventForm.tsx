'use client'

import { useState, useTransition } from 'react'
import { Event } from '@/lib/db/schema'
import { EventData, createEvent, updateEvent } from '@/app/admin/[token]/events/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import ImageUploader from './ImageUploader'

interface EventFormProps {
  token: string
  event?: Event
  onSaved: () => void
  onCancel: () => void
}

const EVENT_TYPES = [
  { value: 'game_night', label: 'Game Night' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'special', label: 'Special' },
  { value: 'announcement', label: 'Announcement' },
] as const

export default function EventForm({ token, event, onSaved, onCancel }: EventFormProps) {
  const [isPending, startTransition] = useTransition()

  const [titleIt, setTitleIt] = useState(event?.titleIt ?? '')
  const [titleEn, setTitleEn] = useState(event?.titleEn ?? '')
  const [descIt, setDescIt] = useState(event?.descriptionIt ?? '')
  const [descEn, setDescEn] = useState(event?.descriptionEn ?? '')
  const [eventType, setEventType] = useState<EventData['eventType']>(
    event?.eventType ?? 'game_night'
  )
  const [date, setDate] = useState(event?.date ?? '')
  const [startTime, setStartTime] = useState(event?.startTime ?? '')
  const [endTime, setEndTime] = useState(event?.endTime ?? '')
  const [location, setLocation] = useState(event?.locationText ?? '')
  const [useFixedVenue, setUseFixedVenue] = useState(event?.useFixedVenue ?? false)
  const [imageUrl, setImageUrl] = useState(event?.imageUrl ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titleIt.trim()) {
      toast.error('Italian title is required')
      return
    }
    const data: EventData = {
      titleIt: titleIt.trim(),
      titleEn: titleEn || null,
      descriptionIt: descIt || null,
      descriptionEn: descEn || null,
      eventType,
      date: date || null,
      startTime: startTime || null,
      endTime: endTime || null,
      locationText: location || null,
      useFixedVenue,
      imageUrl: imageUrl || null,
    }
    startTransition(async () => {
      const result = event
        ? await updateEvent(token, event.id, data)
        : await createEvent(token, data)
      if (result.success) {
        toast.success(event ? 'Event updated' : 'Event created')
        onSaved()
      } else {
        toast.error('Failed: ' + (result as { success: false; error: string }).error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Title (IT) *</Label>
          <Input
            value={titleIt}
            onChange={(e) => setTitleIt(e.target.value)}
            required
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Title (EN)</Label>
          <Input
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Description (IT)</Label>
          <Textarea
            value={descIt}
            onChange={(e) => setDescIt(e.target.value)}
            rows={3}
            className="bg-gray-800 border-gray-700 text-gray-100 resize-none"
          />
        </div>
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Description (EN)</Label>
          <Textarea
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            rows={3}
            className="bg-gray-800 border-gray-700 text-gray-100 resize-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Event Type</Label>
          <Select value={eventType} onValueChange={(v) => setEventType(v as EventData['eventType'])}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-gray-100 focus:bg-gray-700">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Date (blank = announcement)</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Start Time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">End Time</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          id="fixedVenue"
          type="checkbox"
          checked={useFixedVenue}
          onChange={(e) => setUseFixedVenue(e.target.checked)}
          className="w-4 h-4 rounded accent-orange-500"
        />
        <Label htmlFor="fixedVenue" className="text-gray-300 cursor-pointer text-sm">
          Use fixed venue (Via Bonanno Pisano 20)
        </Label>
      </div>
      {!useFixedVenue && (
        <div>
          <Label className="text-gray-400 text-xs mb-1 block">Location</Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
      )}
      <div>
        <Label className="text-gray-400 text-xs mb-2 block">Image URL</Label>
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://… or upload below"
          className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-600 mb-2"
        />
        <ImageUploader onUpload={(url) => setImageUrl(url)} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-gray-400 hover:text-white">
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
          {isPending ? 'Saving…' : event ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  )
}
