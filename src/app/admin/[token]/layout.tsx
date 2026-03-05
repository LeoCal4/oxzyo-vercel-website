import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Toaster } from '@/components/ui/sonner'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  if (token !== process.env.ADMIN_TOKEN) {
    notFound()
  }

  const navLinks = [
    { href: `/admin/${token}`, label: 'Dashboard' },
    { href: `/admin/${token}/sync`, label: 'Sync BGG' },
    { href: `/admin/${token}/games`, label: 'Giochi' },
    { href: `/admin/${token}/events`, label: 'Eventi' },
    { href: `/admin/${token}/content`, label: 'Contenuti' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-6 h-14">
          <div className="flex items-center gap-8">
            <span className="text-orange-400 font-bold text-sm tracking-wide font-[family-name:var(--font-poppins)]">
              OxzyO Admin
            </span>
            <div className="hidden sm:flex gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <span className="text-xs text-gray-600 hidden md:block">OxzyO - Orizzonti Ludici</span>
        </div>
        {/* Mobile nav */}
        <div className="sm:hidden flex gap-4 px-6 pb-3 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-400 hover:text-white whitespace-nowrap transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      <Toaster />
    </div>
  )
}
