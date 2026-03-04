import { cn } from '@/lib/utils'

// Via Bonanno Pisano 20, Pisa, 56124, Italy
// Approximate coordinates: 43.7235°N, 10.4090°E
const MAP_URL =
  'https://www.openstreetmap.org/export/embed.html?bbox=10.3990%2C43.7185%2C10.4190%2C43.7285&layer=mapnik&marker=43.7235%2C10.4090'

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
        title="Via Bonanno Pisano 20, Pisa"
        aria-label="Mappa della sede: Via Bonanno Pisano 20, Pisa"
      />
    </div>
  )
}
