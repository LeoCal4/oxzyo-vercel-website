'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  page: number
  pageCount: number
  total: number
}

export function GamePagination({ page, pageCount, total }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (pageCount <= 1) return null

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`, { scroll: true })
  }

  // Build page number list with ellipsis
  const pages: (number | '...')[] = []
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < pageCount - 2) pages.push('...')
    pages.push(pageCount)
  }

  return (
    <div className="flex items-center justify-between mt-8">
      <p className="text-sm text-gray-500">
        {total} gioch{total === 1 ? 'o' : 'i'}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          aria-label="Pagina precedente"
          className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p)}
              aria-label={`Pagina ${p}`}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'h-9 w-9 rounded-lg text-sm font-medium transition-colors',
                p === page
                  ? 'bg-[#fd7c01] text-white'
                  : 'border border-gray-200 hover:bg-gray-50',
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= pageCount}
          aria-label="Pagina successiva"
          className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
