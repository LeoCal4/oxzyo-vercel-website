'use client'

import { useLocale } from 'next-intl'
import { usePathname } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils'

type SwitcherProps = {
  className?: string
}

export function LocaleSwitcher({ className }: SwitcherProps) {
  const locale = useLocale()
  const pathname = usePathname() // locale-stripped, e.g. '/about'

  function switchLocale(newLocale: 'it' | 'en') {
    if (newLocale === locale) return
    // Hard navigation so the server re-renders everything with the new locale,
    // bypassing the Next.js Router Cache which can otherwise serve a stale layout.
    window.location.href = `/${newLocale}${pathname}`
  }

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      aria-label="Cambia lingua"
    >
      <button
        onClick={() => switchLocale('it')}
        className={cn(
          'text-base leading-none px-1 py-0.5 rounded transition-opacity',
          locale === 'it' ? 'opacity-100' : 'opacity-40 hover:opacity-70',
        )}
        aria-label="Italiano"
        aria-pressed={locale === 'it'}
      >
        🇮🇹
      </button>
      <button
        onClick={() => switchLocale('en')}
        className={cn(
          'text-base leading-none px-1 py-0.5 rounded transition-opacity',
          locale === 'en' ? 'opacity-100' : 'opacity-40 hover:opacity-70',
        )}
        aria-label="English"
        aria-pressed={locale === 'en'}
      >
        🇬🇧
      </button>
    </div>
  )
}
