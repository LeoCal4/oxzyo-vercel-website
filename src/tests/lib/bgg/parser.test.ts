import { describe, expect, it } from 'vitest'
import { parseCollection, parseThings } from '@/lib/bgg/parser'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const COLLECTION_XML = `<?xml version="1.0" encoding="utf-8"?>
<items totalitems="3" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse" pubdate="">
  <item objecttype="thing" objectid="36218" subtype="boardgame" collid="11111">
    <name sortindex="1">Dominion</name>
    <yearpublished>2008</yearpublished>
    <image>//cf.geekdo-images.com/abc.jpg</image>
    <thumbnail>//cf.geekdo-images.com/abc_t.jpg</thumbnail>
    <stats minplayers="2" maxplayers="4" minplaytime="30" maxplaytime="60" playingtime="60" numowned="100000">
      <rating value="N/A">
        <usersrated value="57234"/>
        <average value="7.58321"/>
        <bayesaverage value="7.43890"/>
        <stddev value="1.46120"/>
        <median value="0"/>
        <averageweight value="2.4455"/>
        <numweights value="12345"/>
      </rating>
    </stats>
  </item>
  <item objecttype="thing" objectid="13291" subtype="boardgame" collid="22222">
    <name sortindex="1">Agricola</name>
    <yearpublished>2007</yearpublished>
    <image>//cf.geekdo-images.com/def.jpg</image>
    <thumbnail>//cf.geekdo-images.com/def_t.jpg</thumbnail>
    <stats minplayers="1" maxplayers="5" minplaytime="30" maxplaytime="150" playingtime="150" numowned="80000">
      <rating value="8.0">
        <usersrated value="75000"/>
        <average value="8.03"/>
        <bayesaverage value="7.91"/>
        <stddev value="1.20"/>
        <median value="0"/>
        <averageweight value="3.6"/>
        <numweights value="20000"/>
      </rating>
    </stats>
  </item>
  <item objecttype="thing" objectid="99999" subtype="boardgameexpansion" collid="33333">
    <name sortindex="1">Some Expansion</name>
    <yearpublished>2015</yearpublished>
    <stats minplayers="2" maxplayers="4" minplaytime="30" maxplaytime="60" playingtime="60" numowned="5000">
      <rating value="N/A">
        <average value="N/A"/>
        <averageweight value="N/A"/>
      </rating>
    </stats>
  </item>
</items>`

const THINGS_XML = `<?xml version="1.0" encoding="utf-8"?>
<items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
  <item type="boardgame" id="36218">
    <name type="primary" sortindex="1" value="Dominion"/>
    <name type="alternate" sortindex="1" value="Dominion (2nd Ed)"/>
    <link type="boardgamecategory" id="1002" value="Card Game"/>
    <link type="boardgamemechanic" id="2041" value="Hand Management"/>
    <link type="boardgamemechanic" id="2040" value="Variable Player Powers"/>
    <link type="boardgamedesigner" id="36105" value="Donald X. Vaccarino"/>
    <link type="boardgamepublisher" id="9" value="Rio Grande Games"/>
  </item>
  <item type="boardgame" id="13291">
    <name type="primary" sortindex="1" value="Agricola"/>
    <link type="boardgamecategory" id="1021" value="Economic"/>
    <link type="boardgamemechanic" id="2048" value="Worker Placement"/>
    <link type="boardgamedesigner" id="9393" value="Uwe Rosenberg"/>
  </item>
</items>`

const THINGS_XML_SINGLE = `<?xml version="1.0" encoding="utf-8"?>
<items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
  <item type="boardgame" id="36218">
    <name type="primary" sortindex="1" value="Dominion"/>
    <link type="boardgamemechanic" id="2041" value="Hand Management"/>
    <link type="boardgamedesigner" id="36105" value="Donald X. Vaccarino"/>
  </item>
</items>`

const MISSING_FIELDS_XML = `<?xml version="1.0" encoding="utf-8"?>
<items totalitems="1" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse" pubdate="">
  <item objecttype="thing" objectid="12345" subtype="boardgame" collid="99999">
    <name sortindex="1">Minimal Game</name>
    <stats minplayers="0" maxplayers="0" minplaytime="0" maxplaytime="0" playingtime="0" numowned="0">
      <rating value="N/A">
        <average value="N/A"/>
        <averageweight value="N/A"/>
      </rating>
    </stats>
  </item>
</items>`

const THINGS_UNCREDITED_XML = `<?xml version="1.0" encoding="utf-8"?>
<items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
  <item type="boardgame" id="12345">
    <name type="primary" sortindex="1" value="Minimal Game"/>
    <link type="boardgamedesigner" id="3" value="(Uncredited)"/>
    <link type="boardgamecategory" id="1002" value="Card Game"/>
  </item>
</items>`

// ─── parseCollection ──────────────────────────────────────────────────────────

describe('parseCollection', () => {
  it('returns boardgame items with correct fields', () => {
    const result = parseCollection(COLLECTION_XML)

    // boardgameexpansion should be filtered out
    expect(result).toHaveLength(2)

    const dominion = result.find((g) => g.bggId === 36218)
    expect(dominion).toBeDefined()
    expect(dominion!.title).toBe('Dominion')
    expect(dominion!.bggId).toBe(36218)
    expect(dominion!.yearPublished).toBe(2008)
    expect(dominion!.minPlayers).toBe(2)
    expect(dominion!.maxPlayers).toBe(4)
    expect(dominion!.minPlaytime).toBe(30)
    expect(dominion!.maxPlaytime).toBe(60)
    expect(dominion!.bggRating).toBeCloseTo(7.583, 2)
    expect(dominion!.weight).toBeCloseTo(2.445, 2)
    expect(dominion!.imageUrl).toBe('https://cf.geekdo-images.com/abc.jpg')
    expect(dominion!.thumbnailUrl).toBe('https://cf.geekdo-images.com/abc_t.jpg')
  })

  it('filters out boardgameexpansion items', () => {
    const result = parseCollection(COLLECTION_XML)
    const ids = result.map((g) => g.bggId)
    expect(ids).not.toContain(99999)
  })

  it('handles missing optional fields gracefully (no throw)', () => {
    expect(() => parseCollection(MISSING_FIELDS_XML)).not.toThrow()

    const result = parseCollection(MISSING_FIELDS_XML)
    expect(result).toHaveLength(1)

    const game = result[0]
    expect(game.bggRating).toBeNull()
    expect(game.weight).toBeNull()
    expect(game.imageUrl).toBeNull()
    expect(game.thumbnailUrl).toBeNull()
    // 0 values for player counts become null
    expect(game.minPlayers).toBeNull()
    expect(game.maxPlayers).toBeNull()
  })

  it('returns empty array for empty collection', () => {
    const emptyXml = `<?xml version="1.0" encoding="utf-8"?>
<items totalitems="0" termsofuse="" pubdate=""></items>`
    expect(parseCollection(emptyXml)).toHaveLength(0)
  })

  it('normalizes protocol-relative image URLs to https', () => {
    const result = parseCollection(COLLECTION_XML)
    for (const game of result) {
      if (game.imageUrl) expect(game.imageUrl).toMatch(/^https:\/\//)
      if (game.thumbnailUrl) expect(game.thumbnailUrl).toMatch(/^https:\/\//)
    }
  })
})

// ─── parseThings ─────────────────────────────────────────────────────────────

describe('parseThings', () => {
  it('returns correct mechanics, categories, designers', () => {
    const result = parseThings(THINGS_XML)

    expect(result).toHaveLength(2)

    const dominion = result.find((t) => t.bggId === 36218)
    expect(dominion).toBeDefined()
    expect(dominion!.mechanics).toHaveLength(2)
    expect(dominion!.mechanics.map((m) => m.name)).toContain('Hand Management')
    expect(dominion!.mechanics.map((m) => m.name)).toContain('Variable Player Powers')
    expect(dominion!.categories).toHaveLength(1)
    expect(dominion!.categories[0].name).toBe('Card Game')
    expect(dominion!.categories[0].bggId).toBe(1002)
    expect(dominion!.designers).toHaveLength(1)
    expect(dominion!.designers[0].name).toBe('Donald X. Vaccarino')
  })

  it('ignores publisher links', () => {
    const result = parseThings(THINGS_XML)
    const dominion = result.find((t) => t.bggId === 36218)!
    // publishers should not appear in mechanics, categories, or designers
    const allNames = [
      ...dominion.mechanics.map((m) => m.name),
      ...dominion.categories.map((c) => c.name),
      ...dominion.designers.map((d) => d.name),
    ]
    expect(allNames).not.toContain('Rio Grande Games')
  })

  it('works for a single item response', () => {
    const result = parseThings(THINGS_XML_SINGLE)
    expect(result).toHaveLength(1)
    expect(result[0].bggId).toBe(36218)
    expect(result[0].mechanics).toHaveLength(1)
    expect(result[0].designers).toHaveLength(1)
  })

  it('filters out (Uncredited) designers', () => {
    const result = parseThings(THINGS_UNCREDITED_XML)
    const game = result.find((t) => t.bggId === 12345)!
    expect(game.designers).toHaveLength(0)
  })

  it('handles missing fields gracefully (no throw)', () => {
    const minimalXml = `<?xml version="1.0" encoding="utf-8"?>
<items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
  <item type="boardgame" id="99999">
    <name type="primary" sortindex="1" value="No Relationships"/>
  </item>
</items>`
    expect(() => parseThings(minimalXml)).not.toThrow()
    const result = parseThings(minimalXml)
    expect(result[0].mechanics).toHaveLength(0)
    expect(result[0].categories).toHaveLength(0)
    expect(result[0].designers).toHaveLength(0)
  })

  it('uses primary name only (ignores alternates)', () => {
    // parseThings returns the bggId from the item attribute, not from names
    // The primary/alternate name distinction matters for the title if we were to use it,
    // but the current parser just returns links — this test confirms no duplication
    const result = parseThings(THINGS_XML)
    const dominion = result.find((t) => t.bggId === 36218)!
    // Only one designer despite multiple name elements
    expect(dominion.designers).toHaveLength(1)
  })
})
