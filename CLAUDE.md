# CLAUDE.md — OxzyO: Orizzonti Ludici Website

> Always-loaded reference for coding agents. Keep this file updated as decisions evolve.
> Full context: see REQUIREMENTS.md and TECHNICAL_DESIGN.md.

---

## Project in One Line

Italian board game club website (OxzyO – Orizzonti Ludici, Pisa), Vercel-deployed, bilingual IT/EN, with a games library (BGG-imported), events calendar (with recurring rules), and a secret admin panel.

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

The admin panel lives at `/admin/[token]/`. Access is controlled by comparing the URL token segment to `process.env.ADMIN_TOKEN` in middleware. On a valid first visit, an `httpOnly` cookie `admin_session` is set (hash of the token) so Server Actions can re-validate without reading the URL.

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

Server Actions must always re-validate via the `admin_session` cookie — never trust client input alone.

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
- Returns job ID immediately; background work runs via Next.js `after()` (Fluid Compute, 300s limit — fine for ~400 games)
- Frontend polls `GET /api/admin/bgg-sync/status` every 3s
- BGG API may return HTTP 202 ("try again") — retry up to 5× with 2s delay
- Batch thing requests in groups of 100 IDs
- Upsert preserves all custom fields (`times_played`, `club_rating`, `staff_pick`, `lending_to`)

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
Club name:    OxzyO – Orizzonti Ludici
Contact:      tdg.pisa@gmail.com
Address:      Via Bonanno Pisano 20, Pisa, 56124, Italy
BGG profile:  https://boardgamegeek.com/profile/orizzontiludici
Social:       Instagram, Facebook, Telegram (WhatsApp: future placeholder)
```

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
