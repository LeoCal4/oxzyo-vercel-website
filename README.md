# OxzyO — Orizzonti Ludici

Website for OxzyO - Orizzonti Ludici, a board game club based in Pisa, Italy. Bilingual (Italian/English), with a games library synced from BoardGameGeek, an events calendar with recurring rules, and a secret admin panel.

Live at: [oxzyo.it](https://oxzyo.it)

---

## Stack

- **Framework**: Next.js 16, App Router, TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Neon Postgres via Drizzle ORM
- **File storage**: Vercel Blob
- **i18n**: next-intl (IT default, EN secondary)
- **Events**: rrule (RFC 5545 recurrence rules)
- **BGG**: BGG XML API v2 + fast-xml-parser

## Getting Started

```bash
# Pull environment variables from Vercel (requires Vercel CLI)
vercel env pull .env.local

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/it`.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled connection (runtime queries) |
| `DATABASE_URL_UNPOOLED` | Neon direct connection (migrations only) |
| `ADMIN_TOKEN` | Secret URL segment for admin panel (min 32 chars) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token |
| `BGG_USERNAME` | BGG profile username (`orizzontiludici`) |
| `BGG_PASSWORD` | BGG password (for collection sync) |
| `BGG_API_TOKEN` | BGG registered app token (required for mechanics/categories/designers enrichment) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (e.g. `https://oxzyo.it`) |

`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `BLOB_READ_WRITE_TOKEN` are injected automatically by the Vercel Marketplace integrations (Neon and Blob).

## Commands

```bash
npm run dev          # Local development server
npm run build        # Production build
npm run test         # Run Vitest unit tests

npx drizzle-kit generate   # Generate migration SQL from schema changes
npx drizzle-kit migrate    # Apply migrations to Neon (uses DATABASE_URL_UNPOOLED)
npx drizzle-kit studio     # Open Drizzle Studio to browse and edit the database
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # Public pages (it/en)
│   │   ├── page.tsx       # Homepage
│   │   ├── about/         # Chi Siamo
│   │   ├── join/          # Unisciti a Noi
│   │   ├── calendar/      # Calendario & Annunci
│   │   └── games/         # Giochi (games library)
│   ├── admin/[token]/     # Admin panel (English-only, token-gated)
│   └── api/admin/         # BGG sync and image upload API routes
├── components/
│   ├── layout/            # Header, Footer, ThemeToggle
│   ├── events/            # EventCard, CalendarGrid, EventsDisplay
│   └── games/             # GameCard, GameFilters, GamePagination
├── lib/
│   ├── bgg/               # BGG API client, XML parser, sync orchestration
│   ├── db/                # Drizzle client, schema, migrations
│   ├── events/            # RRULE generation, exceptions, merge/sort
│   └── content/           # CMS content block helpers
├── types/                 # Shared TypeScript types
└── tests/                 # Vitest unit tests
messages/
├── it.json                # Italian strings (default)
└── en.json                # English strings
```

## Admin Panel

The admin panel lives at `/admin/[ADMIN_TOKEN]/`. A wrong or missing token returns 404 — it is not disclosed in `robots.txt`.

Admin sections:
- **Sync** — trigger BGG collection sync (~675 games), monitor progress
- **Giochi** — manage games: custom fields, staff picks, lending status
- **Eventi** — manage one-off events and recurring rules (with exceptions)
- **Contenuti** — edit CMS content blocks (markdown or plain text, IT + EN)

## BGG Sync

Triggered manually from the admin sync panel. The sync:
1. Fetches the full BGG collection for `orizzontiludici`
2. Batch-fetches game details (mechanics, categories, designers) in groups of 100
3. Upserts all games into Neon, preserving custom club fields
4. Runs in the background via Next.js `after()` (up to 300s)

Without `BGG_API_TOKEN`, the sync still completes with all core game data (title, players, playtime, weight, rating) but skips mechanics/categories/designers enrichment.

## Events System

Two types of events are supported:
- **One-off events** — stored in the `events` table with a specific date
- **Recurring rules** — stored as iCal RRULE strings (e.g. `FREQ=WEEKLY;BYDAY=FR` for every Friday); exceptions (cancellations or per-date overrides) are stored in `recurring_exceptions`

Instances are generated on-the-fly at render time using the `rrule` library — no pre-materialised rows.

## Deployment

Deployed on Vercel. Push to `main` to trigger a production deploy.

```bash
# After schema changes, generate and commit migrations before deploying
npx drizzle-kit generate
npx drizzle-kit migrate
git add src/lib/db/migrations/
git commit -m "add migration: ..."
git push
```
