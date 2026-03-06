import { cn } from '@/lib/utils'

// Via Bonanno Pisano 95, Pisa, 56124, Italy
// Coordinates: 43.720118°N, 10.390470°E
const MAP_URL =
  'https://www.openstreetmap.org/export/embed.html?bbox=10.3805%2C43.7151%2C10.4005%2C43.7251&layer=mapnik&marker=43.720118%2C10.390470'

type Props = {
  className?: string
}

export function MapEmbed({ className }: Props) {
  return (
    <div className={cn('rounded-lg overflow-hidden border border-gray-200', className)}>
      <iframe
        src={MAP_URL}
        width="100%"
        height="300"
        style={{ border: 0 }}
        loading="lazy"
        title="Via Bonanno Pisano 95, Pisa"
        aria-label="Mappa della sede: Via Bonanno Pisano 95, Pisa"
      />
    </div>
  )
}
