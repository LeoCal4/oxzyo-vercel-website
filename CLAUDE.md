# CLAUDE.md — OxzyO: Orizzonti Ludici Website

> Always-loaded reference for coding agents. Keep this file updated as decisions evolve.
> Full context: see REQUIREMENTS.md and TECHNICAL_DESIGN.md.

---

## Project in One Line

Italian board game club website (OxzyO - Orizzonti Ludici, Pisa), Vercel-deployed, bilingual IT/EN, with a games library (BGG-imported), events calendar (with recurring rules), and a secret admin panel.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui + Radix UI |
| Icons | Lucide React |
| ORM | Drizzle ORM (`drizzle-orm/neon-http`) |
| Database | Neon Postgres (via Vercel Marketplace) |
| File storage | Vercel Blob |
| i18n | next-intl (JSON files, `[locale]` segment) |
| Recurrence | rrule (RFC 5545) |
| BGG parsing | fast-xml-parser |
| Markdown render | react-markdown |
| Markdown edit | @uiw/react-md-editor |
| Date utils | date-fns |
| Testing | Vitest + @testing-library/react |

---

## Commands

```bash
npm run dev          # local dev server
npm run build        # production build
npm run test         # run Vitest unit tests
npx drizzle-kit generate   # generate migration from schema diff
npx drizzle-kit migrate    # apply migrations (uses DATABASE_URL_UNPOOLED)
npx drizzle-kit studio     # Drizzle visual DB browser
```

---

## Environment Variables

```bash
# Injected automatically by Neon Vercel Marketplace integration
DATABASE_URL=            # pooled (runtime queries)
DATABASE_URL_UNPOOLED=   # direct (drizzle-kit migrations only)

ADMIN_TOKEN=             # secret URL segment, min 32 chars alphanumeric
BLOB_READ_WRITE_TOKEN=   # Vercel Blob (injected by Blob Marketplace integration)
BGG_USERNAME=orizzontiludici
# BGG auth — one of the two is required:
BGG_PASSWORD=            # BGG account password (no registration needed for own collection per BGG policy)
BGG_API_TOKEN=           # OR: Bearer token from BGG app registration (boardgamegeek.com/using_the_xml_api)
NEXT_PUBLIC_SITE_URL=    # e.g. https://oxzyo.it
```

---

## Database Client Pattern

```typescript
// src/lib/db/index.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

Never import `@vercel/postgres` — it is deprecated. Always use `@neondatabase/serverless`.

---

## i18n Pattern

- Locales: `it` (default), `en`
- URL structure: `/it/about`, `/en/about` — slugs always in English
- UI strings: `messages/it.json` and `messages/en.json`
- CMS content: stored in DB as `content_it` / `content_en` columns; fall back to `content_it` if `content_en` is null

```typescript
// Server Component
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('nav')

// Client Component
import { useTranslations } from 'next-intl'
const t = useTranslations('nav')
```

The admin panel is **English-only** — no locale routing inside `/admin`.

---

## Admin Auth Pattern

The admin panel lives at `/admin/[token]/`. Access is controlled by comparing the URL token segment to `process.env.ADMIN_TOKEN` in middleware.

```typescript
// middleware.ts — admin guard (runs before next-intl middleware)
if (pathname.startsWith('/admin/')) {
  const token = pathname.split('/')[2]
  if (token !== process.env.ADMIN_TOKEN) {
    return new NextResponse(null, { status: 404 }) // 404, not 401
    // NOTE: NextResponse.notFound() does NOT exist in middleware — only in route handlers
  }
}
```

**Server Actions auth**: Pass `token: string` as the first parameter to every server action, then validate with `requireAdmin(token)` in `src/lib/utils/admin.ts` (synchronous, compares directly to `process.env.ADMIN_TOKEN`). The cookie-based approach (`cookies()` from `next/headers`) was tried and abandoned — the `admin_session` cookie is not reliably available inside Server Action context. The token flows: URL param → Server Component → Client Component prop → server action argument.

The admin layout (`src/app/admin/[token]/layout.tsx`) must include `<Toaster />` from sonner for toast notifications to render.

---

## Routing Map

```
/                     → redirects to /it
/[locale]/            → Homepage
/[locale]/about       → Chi Siamo
/[locale]/join        → Unisciti a Noi
/[locale]/calendar    → Calendario & Annunci
/[locale]/games       → Giochi (games library)
/admin/[token]/       → Admin dashboard
/admin/[token]/games  → Games management
/admin/[token]/events → Events management
/admin/[token]/content→ CMS content blocks
/admin/[token]/sync   → BGG sync panel
```

---

## Rendering Strategy

| Route | Strategy |
|---|---|
| Homepage | ISR, `revalidate: 3600` |
| Chi Siamo, Unisciti | ISR, `revalidate: 86400` |
| Calendar | SSR (no cache) — time-sensitive |
| Games | SSR (no cache) — filter via `searchParams` |
| All admin pages | SSR (no cache) |

Default to **React Server Components**. Add `'use client'` only when required (filter state, sync polling, image upload, markdown editor).

---

## Games Page Filter Pattern

Filters are driven by URL `searchParams` — no client-side API calls. Filter changes push new params to the URL, which triggers SSR re-fetch. This makes filters shareable and bookmarkable.

```typescript
// URL: /it/games?players=4&maxWeight=3&staffPick=true&page=2
// Server Component reads searchParams and passes to Drizzle query builder
```

---

## Event System

Two DB tables: `events` (one-off) and `recurring_rules` (iCal RRULE). A third table `recurring_exceptions` handles cancellations and modifications per date.

Generation is **on-the-fly** at render time using the `rrule` library. Window: **2 months ahead** for the calendar page, **next 4 events** for the homepage preview.

```typescript
// RRULE examples stored in DB:
// Every Friday:         "FREQ=WEEKLY;BYDAY=FR"
// Every other Wed:      "FREQ=WEEKLY;INTERVAL=2;BYDAY=WE"
```

---

## BGG Sync

- Triggered manually from `/admin/[token]/sync` via `POST /api/admin/bgg-sync`
- Returns job ID immediately; background work runs via Next.js `after()` (Fluid Compute, 300s limit — fine for ~675 games)
- Frontend polls `GET /api/admin/bgg-sync/status` every 3s
- BGG API may return HTTP 202 ("try again") — retry up to 5× with 2s delay
- Batch thing requests in groups of 100 IDs
- Upsert preserves all custom fields (`times_played`, `club_rating`, `staff_pick`, `lending_to`)

### BGG API Authentication (as of 2025)

BGG XML API v2 **requires authentication** on all endpoints. Two modes are supported in `src/lib/bgg/client.ts`:

| Mode | Env vars needed | What works |
|---|---|---|
| Session auth | `BGG_USERNAME` + `BGG_PASSWORD` | `/collection` endpoint only (BGG policy: own collection while logged in needs no registration) |
| Bearer token | `BGG_API_TOKEN` | All endpoints, including `/thing` (mechanics/categories/designers) |

The client logs into `https://boardgamegeek.com/login/api/v1` (POST with `{"credentials":{...}}`), caches the session cookie for the process lifetime, and sends it as a `Cookie` header. `BGG_API_TOKEN` (if set) takes priority and is sent as `Authorization: Bearer`.

**Practical consequence**: without `BGG_API_TOKEN`, the sync completes with all core game fields (title, players, playtime, weight, rating) but junction tables (`game_mechanics`, `game_categories`, `game_designers`) are not populated. The `bgg_sync_jobs.error_message` field notes this. Register at `boardgamegeek.com/using_the_xml_api` to get a token.

---

## Key DB Tables (summary)

| Table | Purpose |
|---|---|
| `games` | Game catalogue; BGG fields + custom club fields |
| `designers` | Normalized designer names |
| `mechanics` | Normalized mechanic names (with BGG IDs) |
| `categories` | Normalized category names (with BGG IDs) |
| `game_designers` | Junction: games ↔ designers |
| `game_mechanics` | Junction: games ↔ mechanics |
| `game_categories` | Junction: games ↔ categories |
| `events` | One-off events and announcements |
| `recurring_rules` | Recurring event rules (iCal RRULE) |
| `recurring_exceptions` | Cancellations/modifications per rule date |
| `content_blocks` | CMS text/markdown blocks keyed by slug |
| `bgg_sync_jobs` | Sync job status tracking |

---

## Content Block Keys

Predefined keys for CMS-editable content:

| Key | Page | Type |
|---|---|---|
| `homepage.hero.tagline` | Homepage | text |
| `homepage.hero.cta` | Homepage | text |
| `homepage.intro` | Homepage | markdown |
| `about.story` | Chi Siamo | markdown |
| `about.values` | Chi Siamo | markdown |
| `join.process` | Unisciti | markdown |
| `join.benefits` | Unisciti | markdown |
| `join.fee_note` | Unisciti | text |

---

## Brand & Design

```
Primary orange:   #fd7c01
Primary blue:     #0076fb
Pastel orange:    #ffca98
Off-white/yellow: #fffbd8

Headings / brand: Poppins (Google Fonts)
Body text:        Inter (Google Fonts)

Aesthetic: playful but not overdone; tabletop / warm tones
```

Logo files in `public/images/`:
- `oxzyo_logo_no_bg.png` — for use on colored backgrounds
- `oxyzo_logo_with_bg.png` — for use on white/light backgrounds

---

## Fixed Club Info

```
Club name:    OxzyO - Orizzonti Ludici
Contact:      tdg.pisa@gmail.com
Address:      Via Bonanno Pisano 95, Pisa, 56124, Italy
BGG profile:  https://boardgamegeek.com/profile/orizzontiludici
Social:       Instagram, Facebook, Telegram (WhatsApp: future placeholder)
```

---

## Implementation Notes (Phase 2 findings)

### drizzle-orm 0.45 — breaking syntax changes
The installed version (0.45.x) uses **array syntax** for table-level constraints, not object syntax:
```typescript
// Correct (0.45+)
pgTable('name', { ... }, (t) => [primaryKey({ columns: [t.a, t.b] })])
pgTable('name', { ... }, (t) => [unique().on(t.a, t.b)])

// Wrong (old syntax — do not use)
pgTable('name', { ... }, (t) => ({ pk: primaryKey({ columns: [t.a, t.b] }) }))
```

### Drizzle inferred types
Use `$inferSelect` / `$inferInsert` directly on the table (not the older `InferSelectModel` / `InferInsertModel` helpers):
```typescript
type Game    = typeof games.$inferSelect
type NewGame = typeof games.$inferInsert
```

### Shared type files
`src/types/` contains derived types for use across the app:
- `games.ts` — `GameWithRelations`, `GameFilterParams`, `GamesQueryResult`, `PAGE_SIZE`
- `events.ts` — `DisplayEvent`, `RecurringInstance` (normalized view model types)
- `content.ts` — `ContentBlockKey` union, `Locale` type

### Content block seed script
`src/lib/db/seed-content.ts` is idempotent (`onConflictDoNothing`) — safe to re-run. All 8 predefined content blocks are already seeded in the Neon DB. Run with `npx tsx src/lib/db/seed-content.ts`.

---

## Implementation Notes (Phase 3 findings)

### Running TypeScript scripts against the live DB

`tsx` is installed as a local dev dependency. Use Node's `--env-file` flag to load `.env.local` **before** any module is evaluated — this is critical because `src/lib/db/index.ts` calls `neon()` at import time and needs `DATABASE_URL` to already be set.

```bash
# Correct — env vars loaded before any module runs
node --env-file=.env.local -r tsx/cjs src/scripts/your-script.ts

# Wrong — dotenv import gets hoisted by esbuild, runs too late
npx tsx src/scripts/your-script.ts   # DATABASE_URL not set when neon() is called
```

Scripts that create their own inline `neon()` call (like `seed-content.ts`) can still use `npx tsx` because they call `config({ path: '.env.local' })` before the `neon()` call, and esbuild only hoists the `import` of the dotenv module (not the `config()` invocation). Any script that imports from `src/lib/db` must use `node --env-file`.

### BGG collection size
The `orizzontiludici` BGG collection has **675 games** as of March 2026 (not ~400 as originally estimated). Sync takes roughly 30-40s of wall time including BGG API latency.

### BGG things API requires registered token
See the BGG Sync section above. The `/collection` endpoint works with session-based auth (BGG policy exception for own collection). The `/thing` endpoint always requires `BGG_API_TOKEN`. The sync gracefully degrades: it completes with `status = 'completed'` and notes the skipped enrichment in `error_message`.

---

## Implementation Notes (Phase 4 & 5 findings)

### next-intl navigation utilities
`src/lib/i18n/navigation.ts` exports locale-aware `Link`, `useRouter`, `usePathname`, `getPathname` via `createNavigation(routing)`. Always import these instead of the `next/navigation` equivalents for public pages.

```typescript
import { Link, useRouter, usePathname } from '@/lib/i18n/navigation'
```

For locale switching use `router.replace(pathname, { locale: newLocale })`.
For `lang` attribute on `<html>`: use `await getLocale()` from `next-intl/server` in the root layout.

### Drizzle EXISTS with raw SQL
`exists(sql\`...\`)` generates `EXISTS SELECT ...` **without parentheses** — Postgres rejects this.
Always write the full expression inline:
```typescript
// Correct
sql`EXISTS (SELECT 1 FROM game_mechanics WHERE game_id = ${games.id} AND mechanic_id = ${mechId})`

// Wrong — missing parens
exists(sql`SELECT 1 FROM game_mechanics WHERE ...`)
```

### BGG titles contain HTML entities
BGG API returns titles with HTML entities (e.g. `&#039;` for apostrophe). `decodeHtml()` is in `src/lib/utils.ts` — use it whenever displaying a game title:
```typescript
const title = decodeHtml(game.titleOverride ?? game.title)
```
The BGG parser also calls `decodeHtml()` on titles at parse time, so future syncs store clean data.

### next/image with logos / square images
Always set `width` and `height` props to the **actual image dimensions** (aspect ratio matters for Next.js srcset). For the OxzyO logo (5000×5000 px): `width={5000} height={5000}`. Control display size via CSS (`className="h-12 w-auto"`). In flex containers, add `self-start` to prevent stretch.

### Games query pattern
- `buildGameConditions(params)` — pure function, no DB calls, unit-testable (see `src/tests/lib/games/query.test.ts`)
- `fetchGames(params)` — runs count + paginated ID query (core API), then fetches relations for those IDs via `db.query.games.findMany` (relational API)
- `fetchFilterOptions()` — returns all mechanics, categories, designers for filter sidebar

---

## Implementation Notes (Phase 6 findings)

### rrule + Drizzle date strings
Drizzle `date()` columns return `string | null` (e.g. `'2024-01-05'`), not `Date` objects. Always append `'T00:00:00Z'` when constructing Dates from them to stay in UTC:
```typescript
const dtstart = new Date(rule.dtstart + 'T00:00:00Z')
```
Use `getUTCDay()` / `getUTCDate()` / `getUTCMonth()` for day-of-week or date-part inspection on generated rrule dates (they're always UTC midnight).

### Exception date matching
To match a generated `Date` back to a stored `'YYYY-MM-DD'` exception string, use UTC components. See `toDateString()` in `src/lib/events/exceptions.ts`. The map key format is `"ruleId:YYYY-MM-DD"`.

### Event data flow
```
generateRecurringInstances(rules, exceptions, from, to)
  → calls applyExceptions internally → RecurringInstance[]
mergeAndSortEvents(oneOffEvents, instances, locale)
  → DisplayEvent[] (sorted, locale-normalized, overrides applied)
```
The calendar page at `src/app/[locale]/calendar/page.tsx` uses `getLocale()` from `next-intl/server` (not `params.locale`) to pick the locale.

---

## Implementation Notes (Phase 7 findings)

### Content block helpers
`src/lib/content/blocks.ts` provides two functions — use `getContentBlocks(keys[], locale)` for batch fetching (single DB query) rather than multiple `getContentBlock` calls.

### SEO metadata pattern
All public pages use `generateMetadata({ params })` (not static `export const metadata`) so the locale can be read from `params`. Pattern:
```typescript
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'ns' })
  ...
}
```

### robots.txt — do NOT list /admin/
`src/app/robots.ts` intentionally omits `Disallow: /admin/`. The middleware 404 is the guard; listing the path in robots.txt would disclose its existence. The token is the real secret.

---

## Implementation Notes (Phase 1 findings)

### Tailwind CSS v4
No `tailwind.config.ts` — everything lives in `src/app/globals.css`:
- Register plugins: `@plugin "@tailwindcss/typography"`
- Define theme tokens: `@theme { --color-orange: #fd7c01; ... }`
- shadcn injects its own imports (`tw-animate-css`, `shadcn/tailwind.css`) at the top automatically

### shadcn/ui v3
- `toast` component is **deprecated** — use `sonner` instead (`src/components/ui/sonner.tsx`)
- Init command: `npx shadcn@latest init --defaults -y`
- Add components: `npx shadcn@latest add <name> -y`

### drizzle-kit and .env.local
drizzle-kit does **not** auto-load `.env.local` (that's a Next.js convention). `drizzle.config.ts` must load it explicitly:
```typescript
import { config } from 'dotenv'
config({ path: '.env.local' })
```

### next-intl setup
- Config file: `i18n.ts` at repo root (uses `getRequestConfig`)
- Routing config: `src/lib/i18n/routing.ts` (uses `defineRouting`)
- next.config.ts wraps with: `createNextIntlPlugin('./i18n.ts')`
- `[locale]/layout.tsx` wraps children in `<NextIntlClientProvider messages={messages}>`

### Env vars for local dev
Run `vercel env pull .env.local` to pull all Vercel-injected vars (Neon, Blob) into `.env.local`.

---

## Rules & Conventions

1. **All user-visible text on public pages must be in Italian** (primary) with English translations in `messages/en.json`.
2. **Never use `@vercel/postgres`** — it is deprecated. Always use `@neondatabase/serverless`.
3. **Never store images** from BGG — link directly to BGG CDN URLs (`cf.geekdo-images.com`). For event/admin images use Vercel Blob.
4. **Admin pages are English-only** — no need for locale routing or translation keys inside `/admin`.
5. **Filters are URL-driven** — never manage filter state in React state alone; always reflect in `searchParams`.
6. **Migrations must be committed** — always commit generated migration files in `src/lib/db/migrations/`.
7. **Server Actions for mutations** — use Server Actions (not API routes) for admin create/update/delete operations.
8. **API routes only for**: BGG sync trigger/status (async polling pattern) and Vercel Blob image upload.
9. **Map embed**: use OpenStreetMap iframe — no Google Maps API key required.
10. **Contact**: `mailto:tdg.pisa@gmail.com` — no contact form, just a link.

---

## Implementation Notes (Phase 8 findings)

### Dark mode
`next-themes@^0.4.6` is installed. Dark mode is fully implemented:
- `src/components/layout/ThemeProvider.tsx` — `'use client'` wrapper around `NextThemesProvider` (attribute="class", defaultTheme="system")
- `src/components/layout/ThemeToggle.tsx` — sun/moon button using CSS-based icon swap (`dark:hidden` / `hidden dark:block`) to avoid mounted-state flicker
- `ThemeProvider` wraps `{children}` in `src/app/layout.tsx`
- `ThemeToggle` appears in both desktop nav (`Header.tsx`) and mobile sheet (`MobileNav.tsx`)
- Orange header (`#fd7c01`) and blue footer (`#0076fb`) intentionally unchanged in dark mode — brand identity decision
- `MarkdownRenderer` uses `dark:prose-invert` to flip `@tailwindcss/typography` colors in dark mode

### BGG weight data
`averageweight` is **only** in the `/thing` BGG endpoint (with `stats=1`), NOT in `/collection`. Weight is parsed in `parseThings()` in `src/lib/bgg/parser.ts` and sourced from `thingMap` in sync. Without `BGG_API_TOKEN`, all weights remain null.

### Games sort
Sort is URL-driven via `?sort=` param. Valid values: `title`, `titleDesc`, `timesPlayed`, `timesPlayedAsc`, `minPlaytime`, `minPlaytimeDesc`. Parsed and validated in `parseParams()` in `games/page.tsx`. `minPlaytime` sorts use raw SQL with `NULLS LAST`.

### Calendar view
`src/components/events/EventsDisplay.tsx` — client wrapper that holds list/calendar toggle state. Renders either month-grouped `EventList` or `CalendarGrid`.
`src/components/events/CalendarGrid.tsx` — monthly grid; mobile shows colored dots, desktop shows event title pills (up to 3 per day). Month navigation via prev/next buttons. Clicking any event opens `EventDetail`.
`recurringExceptions` in the calendar page are filtered to `exceptionDate >= today` — past exceptions are irrelevant for future display.
