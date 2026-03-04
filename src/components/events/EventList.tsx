import { EventCard } from './EventCard'
import { cn } from '@/lib/utils'
import type { DisplayEvent } from '@/types/events'

type Props = {
  events: DisplayEvent[]
  className?: string
}

export function EventList({ events, className }: Props) {
  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {events.map((event) => (
        <li key={event.key}>
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  )
}
