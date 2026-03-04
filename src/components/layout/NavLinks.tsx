'use client'

import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { Link, usePathname } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { key: 'home' as const, href: '/' as const },
  { key: 'about' as const, href: '/about' as const },
  { key: 'join' as const, href: '/join' as const },
  { key: 'calendar' as const, href: '/calendar' as const },
  { key: 'games' as const, href: '/games' as const },
]

type NavLinksProps = {
  className?: string
  linkClassName?: string
  activeLinkClassName?: string
  onClick?: () => void
}

export function NavLinks({
  className,
  linkClassName,
  activeLinkClassName,
  onClick,
}: NavLinksProps) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') {
      return pathname === `/${locale}` || pathname === `/${locale}/`
    }
    return pathname.startsWith(`/${locale}${href}`)
  }

  return (
    <nav className={cn('flex items-center gap-6', className)} aria-label="Navigazione principale">
      {navItems.map(({ key, href }) => (
        <Link
          key={key}
          href={href}
          onClick={onClick}
          className={cn(
            'text-sm font-semibold transition-opacity hover:opacity-75',
            linkClassName,
            isActive(href) && (activeLinkClassName ?? 'underline underline-offset-4'),
          )}
        >
          {t(key)}
        </Link>
      ))}
    </nav>
  )
}
