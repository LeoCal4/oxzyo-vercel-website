import { XMLParser } from 'fast-xml-parser'

export interface BggCollectionItem {
  bggId: number
  title: string
  imageUrl: string | null
  thumbnailUrl: string | null
  yearPublished: number | null
  minPlayers: number | null
  maxPlayers: number | null
  minPlaytime: number | null
  maxPlaytime: number | null
  bggRating: number | null
  weight: number | null
}

export interface BggThingDetail {
  bggId: number
  mechanics: { bggId: number; name: string }[]
  categories: { bggId: number; name: string }[]
  designers: { name: string }[]
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['item', 'name', 'link'].includes(name),
})

function normalizeUrl(url: unknown): string | null {
  if (!url || typeof url !== 'string') return null
  return url.startsWith('//') ? `https:${url}` : url
}

function parseNum(val: unknown): number | null {
  const n = parseInt(String(val ?? ''), 10)
  return isNaN(n) || n === 0 ? null : n
}

function parseFloat_(val: unknown): number | null {
  const n = parseFloat(String(val ?? ''))
  return isNaN(n) ? null : n
}

function resolveCollectionName(nameField: unknown): string {
  const entries: unknown[] = Array.isArray(nameField)
    ? nameField
    : nameField != null
      ? [nameField]
      : []
  const first = entries[0]
  if (typeof first === 'string') return first
  if (first && typeof first === 'object') {
    const obj = first as Record<string, unknown>
    return String(obj['#text'] ?? obj['@_value'] ?? '')
  }
  return ''
}

export function parseCollection(xml: string): BggCollectionItem[] {
  const data = parser.parse(xml)
  const items: unknown[] = data?.items?.item ?? []

  const results: BggCollectionItem[] = []

  for (const raw of items) {
    const item = raw as Record<string, unknown>

    if (item['@_subtype'] !== 'boardgame') continue

    const bggId = parseInt(String(item['@_objectid'] ?? ''), 10)
    if (!bggId || isNaN(bggId)) continue

    const title = resolveCollectionName(item.name)
    if (!title) continue

    const stats = (item.stats ?? {}) as Record<string, unknown>
    const rating = (stats.rating ?? {}) as Record<string, unknown>
    const average = (rating.average as Record<string, unknown> | undefined)?.['@_value']
    const avgWeight = (rating.averageweight as Record<string, unknown> | undefined)?.['@_value']

    results.push({
      bggId,
      title,
      imageUrl: normalizeUrl(item.image),
      thumbnailUrl: normalizeUrl(item.thumbnail),
      yearPublished: parseNum(item.yearpublished),
      minPlayers: parseNum(stats['@_minplayers']),
      maxPlayers: parseNum(stats['@_maxplayers']),
      minPlaytime: parseNum(stats['@_minplaytime']),
      maxPlaytime: parseNum(stats['@_maxplaytime']),
      bggRating: parseFloat_(average),
      weight: parseFloat_(avgWeight),
    })
  }

  return results
}

export function parseThings(xml: string): BggThingDetail[] {
  const data = parser.parse(xml)
  const items: unknown[] = data?.items?.item ?? []

  return items.map((raw) => {
    const item = raw as Record<string, unknown>
    const bggId = parseInt(String(item['@_id'] ?? ''), 10)

    const links: Record<string, unknown>[] = Array.isArray(item.link)
      ? (item.link as Record<string, unknown>[])
      : item.link
        ? [item.link as Record<string, unknown>]
        : []

    const mechanics = links
      .filter((l) => l['@_type'] === 'boardgamemechanic')
      .map((l) => ({ bggId: parseInt(String(l['@_id'] ?? ''), 10), name: String(l['@_value'] ?? '') }))
      .filter((m) => m.name && !isNaN(m.bggId))

    const categories = links
      .filter((l) => l['@_type'] === 'boardgamecategory')
      .map((l) => ({ bggId: parseInt(String(l['@_id'] ?? ''), 10), name: String(l['@_value'] ?? '') }))
      .filter((c) => c.name && !isNaN(c.bggId))

    const designers = links
      .filter((l) => l['@_type'] === 'boardgamedesigner')
      .map((l) => ({ name: String(l['@_value'] ?? '') }))
      .filter((d) => d.name && d.name !== '(Uncredited)')

    return { bggId, mechanics, categories, designers }
  })
}
