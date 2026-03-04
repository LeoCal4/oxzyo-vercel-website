'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin } from 'lucide-react'
import { MapEmbed } from '@/components/MapEmbed'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { cn } from '@/lib/utils'
import type { DisplayEvent } from '@/types/events'

function eventTypeBadge(type: DisplayEvent['eventType']) {
  switch (type) {
    case 'game_night':   return { label: 'Serata Giochi',   className: 'bg-[#0076fb] text-white hover:bg-[#0076fb]' }
    case 'tournament':   return { label: 'Torneo',          className: 'bg-[#fd7c01] text-white hover:bg-[#fd7c01]' }
    case 'special':      return { label: 'Evento Speciale', className: 'bg-purple-600 text-white hover:bg-purple-600' }
    case 'announcement': return { label: 'Annuncio',        className: 'bg-gray-500 text-white hover:bg-gray-500' }
  }
}

function formatTime(time: string | null): string | null {
  if (!time) return null
  const [h, m] = time.split(':')
  return `${h}:${m}`
}

type Props = {
  event: DisplayEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventDetail({ event, open, onOpenChange }: Props) {
  const badge = eventTypeBadge(event.eventType)
  const startTime = formatTime(event.startTime)
  const endTime = formatTime(event.endTime)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge className={cn('text-xs', badge.className)}>{badge.label}</Badge>
          </div>
          <DialogTitle className="text-left font-[family-name:var(--font-poppins)]">
            {event.title}
          </DialogTitle>
          {event.date && (
            <DialogDescription className="text-left">
              {event.date.toLocaleDateString('it-IT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Time & location */}
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            {startTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#fd7c01] flex-shrink-0" />
                <span>
                  {startTime}
                  {endTime ? ` – ${endTime}` : ''}
                </span>
              </div>
            )}
            {(event.useFixedVenue || event.locationText) && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#fd7c01] flex-shrink-0" />
                <span>
                  {event.useFixedVenue
                    ? 'Via Bonanno Pisano 20, Pisa (sede del club)'
                    : event.locationText}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && <MarkdownRenderer content={event.description} />}

          {/* Map — only for fixed venue */}
          {event.useFixedVenue && <MapEmbed className="mt-2" />}

          {/* Optional image */}
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full rounded-lg object-cover max-h-48"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
