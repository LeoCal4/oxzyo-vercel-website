import type { MetadataRoute } from 'next'

const locales = ['it', 'en'] as const
const publicRoutes = ['', '/about', '/join', '/calendar', '/games'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://oxzyo.it'

  return locales.flatMap((locale) =>
    publicRoutes.map((route) => ({
      url: `${siteUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' || route === '/calendar' ? 'daily' : 'weekly',
      priority: route === '' ? 1 : 0.8,
    })),
  )
}
