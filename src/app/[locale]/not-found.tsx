import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <Image
        src="/images/oxzyo_logo_no_bg.png"
        alt="OxzyO – Orizzonti Ludici"
        width={5000}
        height={5000}
        className="h-20 w-auto mb-8 opacity-30"
      />
      <h1 className="text-6xl font-bold font-[family-name:var(--font-poppins)] text-[#fd7c01] mb-4">
        404
      </h1>
      <h2 className="text-xl font-semibold mb-2">{t('title')}</h2>
      <p className="text-gray-500 mb-8 max-w-md">{t('description')}</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md bg-[#fd7c01] px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#e06d00] transition-colors"
      >
        {t('backHome')}
      </Link>
    </div>
  )
}
