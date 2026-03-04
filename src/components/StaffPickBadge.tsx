import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

export function StaffPickBadge({ className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-[#fd7c01] px-2 py-0.5 text-xs font-semibold text-white',
        className,
      )}
      aria-label="Staff pick"
    >
      <Star className="h-3 w-3 fill-current" aria-hidden="true" />
      Staff Pick
    </span>
  )
}
