import { Skeleton } from '@/components/ui/skeleton'

export function GameListRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-3">
      <Skeleton className="h-14 w-14 rounded-md shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="hidden sm:flex gap-4">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  )
}

export function GamesListSkeleton({ count = 24 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <GameListRowSkeleton key={i} />
      ))}
    </div>
  )
}
