'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errorPage')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-5xl mb-6" aria-hidden="true">⚠️</div>
      <h1 className="text-xl font-semibold font-[family-name:var(--font-poppins)] mb-2">
        {t('title')}
      </h1>
      <p className="text-gray-500 mb-8 max-w-md">{t('description')}</p>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center rounded-md bg-[#fd7c01] px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#e06d00] transition-colors"
      >
        {t('retry')}
      </button>
    </div>
  )
}
