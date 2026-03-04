export const revalidate = 86400

import { getTranslations, getLocale } from 'next-intl/server'
import { getContentBlocks } from '@/lib/content/blocks'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import type { Locale } from '@/types/content'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'join' })
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://oxzyo.it'
  return {
    title: `${t('title')} | OxzyO`,
    description: t('description'),
    openGraph: {
      title: `${t('title')} | OxzyO`,
      description: t('description'),
      url: `${siteUrl}/${locale}/join`,
      siteName: 'OxzyO – Orizzonti Ludici',
      locale: locale === 'it' ? 'it_IT' : 'en_GB',
    },
  }
}

export default async function JoinPage() {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations('join')

  const contentData = await getContentBlocks(
    ['join.process', 'join.benefits', 'join.fee_note'],
    locale,
  )
  const process = contentData['join.process'] ?? ''
  const benefits = contentData['join.benefits'] ?? ''
  const feeNote = contentData['join.fee_note'] ?? ''

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold font-[family-name:var(--font-poppins)] mb-10">
        {t('title')}
      </h1>

      {/* ── Process ── */}
      <section aria-labelledby="process-heading" className="mb-14">
        <h2
          id="process-heading"
          className="text-xl font-semibold font-[family-name:var(--font-poppins)] mb-4"
        >
          {t('process')}
        </h2>
        {process ? (
          <MarkdownRenderer content={process} />
        ) : (
          <p className="text-gray-500 text-sm italic">Contenuto in arrivo.</p>
        )}
      </section>

      {/* ── Fee ── */}
      {feeNote && (
        <section aria-labelledby="fee-heading" className="mb-14">
          <h2
            id="fee-heading"
            className="text-xl font-semibold font-[family-name:var(--font-poppins)] mb-3"
          >
            {t('fee')}
          </h2>
          <p className="text-gray-700">{feeNote}</p>
        </section>
      )}

      {/* ── Benefits ── */}
      <section aria-labelledby="benefits-heading">
        <h2
          id="benefits-heading"
          className="text-xl font-semibold font-[family-name:var(--font-poppins)] mb-4"
        >
          {t('benefits')}
        </h2>
        {benefits ? (
          <MarkdownRenderer content={benefits} />
        ) : (
          <p className="text-gray-500 text-sm italic">Contenuto in arrivo.</p>
        )}
      </section>
    </div>
  )
}
