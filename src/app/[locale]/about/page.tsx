export const revalidate = 86400

import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getContentBlocks } from '@/lib/content/blocks'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import type { Locale } from '@/types/content'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://oxzyo.it'
  return {
    title: `${t('title')} | OxzyO`,
    description: t('description'),
    openGraph: {
      title: `${t('title')} | OxzyO`,
      description: t('description'),
      url: `${siteUrl}/${locale}/about`,
      siteName: 'OxzyO – Orizzonti Ludici',
      locale: locale === 'it' ? 'it_IT' : 'en_GB',
    },
  }
}

export default async function AboutPage({ params }: Props) {
  const { locale: localeStr } = await params
  const locale = localeStr as Locale
  setRequestLocale(locale)
  const t = await getTranslations('about')
  const tCommon = await getTranslations('common')

  const contentData = await getContentBlocks(['about.story', 'about.values'], locale)
  const story = contentData['about.story'] ?? ''
  const values = contentData['about.values'] ?? ''

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold font-[family-name:var(--font-poppins)] mb-10">
        {t('title')}
      </h1>

      {/* ── Story ── */}
      <section aria-labelledby="story-heading" className="mb-14">
        <h2
          id="story-heading"
          className="text-xl font-semibold font-[family-name:var(--font-poppins)] mb-4"
        >
          {t('story')}
        </h2>
        {story ? (
          <MarkdownRenderer content={story} />
        ) : (
          <p className="text-gray-500 text-sm italic">{tCommon('contentComing')}</p>
        )}
      </section>

      {/* ── Photo gallery placeholder ── */}
      <section aria-labelledby="gallery-heading" className="mb-14">
        <h2
          id="gallery-heading"
          className="text-xl font-semibold font-[family-name:var(--font-poppins)] mb-4"
        >
          {t('gallery')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
            >
              <Image
                src="/images/oxzyo_logo_no_bg.png"
                alt=""
                width={5000}
                height={5000}
                className="h-12 w-auto opacity-20"
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-3 italic">{t('galleryComingSoon')}</p>
      </section>

      {/* ── Values ── */}
      <section aria-labelledby="values-heading">
        <h2
          id="values-heading"
          className="text-xl font-semibold font-[family-name:var(--font-poppins)] mb-4"
        >
          {t('values')}
        </h2>
        {values ? (
          <MarkdownRenderer content={values} />
        ) : (
          <p className="text-gray-500 text-sm italic">{tCommon('contentComing')}</p>
        )}
      </section>
    </div>
  )
}
