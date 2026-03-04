import Image from 'next/image'
import { Link } from '@/lib/i18n/navigation'
import { NavLinks } from './NavLinks'
import { LocaleSwitcher } from './LocaleSwitcher'
import { MobileNav } from './MobileNav'

export function Header() {
  return (
    <header className="bg-[#fd7c01] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0" aria-label="OxzyO – Orizzonti Ludici">
          <Image
            src="/images/oxzyo_logo_no_bg.png"
            alt="OxzyO – Orizzonti Ludici"
            width={5000}
            height={5000}
            className="h-12 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-white">
          <NavLinks linkClassName="text-white" />
          <LocaleSwitcher />
        </div>

        {/* Mobile nav */}
        <div className="md:hidden text-white">
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
