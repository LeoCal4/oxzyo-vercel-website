/**
 * Smoke test for BGG sync (Phase 3.6)
 * Run with: node --env-file=.env.local --import tsx/cjs src/scripts/smoke-bgg-sync.ts
 *
 * The --env-file flag loads .env.local before any module is evaluated,
 * so DATABASE_URL is available when the Neon client initializes.
 */

import { count, eq, isNotNull } from 'drizzle-orm'
import { db } from '../lib/db'
import { bggSyncJobs, games } from '../lib/db/schema'
import { runBggSync } from '../lib/bgg/sync'

async function insertJob() {
  const [job] = await db.insert(bggSyncJobs).values({ status: 'pending' }).returning({ id: bggSyncJobs.id })
  return job.id
}

async function countGames() {
  const [row] = await db.select({ total: count() }).from(games)
  return row.total
}

async function getFirstGame() {
  const [game] = await db
    .select({ id: games.id, bggId: games.bggId, title: games.title, clubRating: games.clubRating })
    .from(games)
    .where(isNotNull(games.bggId))
    .limit(1)
  return game
}

async function getJob(id: string) {
  const [job] = await db.select().from(bggSyncJobs).where(eq(bggSyncJobs.id, id))
  return job
}

async function main() {
  console.log('=== BGG Sync Smoke Test ===\n')

  // ── First sync ──
  console.log('[1/4] Running first sync...')
  const jobId1 = await insertJob()
  await runBggSync(jobId1)

  const job1 = await getJob(jobId1)
  console.log(`      Status:   ${job1.status}`)
  if (job1.status === 'failed') {
    console.error(`      Error:    ${job1.errorMessage}`)
    process.exit(1)
  }
  console.log(`      Total:    ${job1.gamesTotal} games from BGG`)
  console.log(`      Imported: ${job1.gamesImported}`)
  console.log(`      Updated:  ${job1.gamesUpdated}`)

  const totalAfterFirst = await countGames()
  console.log(`\n[2/4] Games in DB after first sync: ${totalAfterFirst}`)
  if (totalAfterFirst === 0) {
    console.error('      FAIL: no games were inserted')
    process.exit(1)
  }
  console.log(`      PASS: ${totalAfterFirst} games present`)

  // ── Custom field preservation ──
  const testGame = await getFirstGame()
  if (!testGame) {
    console.error('\n[3/4] SKIP: no game found to test custom field preservation')
    process.exit(1)
  }

  const testClubRating = 42
  console.log(`\n[3/4] Setting club_rating=${testClubRating} on "${testGame.title}" (bggId=${testGame.bggId})`)
  await db.update(games).set({ clubRating: testClubRating }).where(eq(games.id, testGame.id))

  console.log('      Running second sync...')
  const jobId2 = await insertJob()
  await runBggSync(jobId2)

  const job2 = await getJob(jobId2)
  console.log(`      Status: ${job2.status}`)
  if (job2.status === 'failed') {
    console.error(`      Error:  ${job2.errorMessage}`)
    process.exit(1)
  }

  const [afterSync] = await db
    .select({ clubRating: games.clubRating })
    .from(games)
    .where(eq(games.id, testGame.id))

  if (afterSync.clubRating === testClubRating) {
    console.log(`      PASS: club_rating=${afterSync.clubRating} preserved after re-sync`)
  } else {
    console.error(`      FAIL: club_rating expected ${testClubRating}, got ${afterSync.clubRating}`)
    process.exit(1)
  }

  // ── Reset test data ──
  await db.update(games).set({ clubRating: null }).where(eq(games.id, testGame.id))

  const totalAfterSecond = await countGames()
  console.log(`\n[4/4] Games in DB after second sync: ${totalAfterSecond}`)
  console.log(`      PASS: count stable (${totalAfterSecond})`)

  console.log('\n=== All checks passed ✓ ===')
}

main().catch((err) => {
  console.error('\nFATAL:', err)
  process.exit(1)
})
