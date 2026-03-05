import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { contentBlocks } from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const CONTENT_BLOCKS = [
  {
    key: 'homepage.hero.tagline',
    label: 'Homepage — tagline',
    contentType: 'text' as const,
    contentIt: 'Il club di giochi da tavolo di Pisa',
    contentEn: 'Pisa\'s board game club',
  },
  {
    key: 'homepage.hero.cta',
    label: 'Homepage — CTA button label',
    contentType: 'text' as const,
    contentIt: 'Scopri di più',
    contentEn: 'Learn more',
  },
  {
    key: 'homepage.intro',
    label: 'Homepage — intro paragraph',
    contentType: 'markdown' as const,
    contentIt: 'Benvenuto in **OxzyO - Orizzonti Ludici**, il club di giochi da tavolo di Pisa.\n\nCi riuniamo regolarmente per giocare, condividere la passione per i giochi da tavolo e accogliere nuovi giocatori.',
    contentEn: 'Welcome to **OxzyO - Orizzonti Ludici**, Pisa\'s board game club.\n\nWe meet regularly to play, share our passion for board games, and welcome new players.',
  },
  {
    key: 'about.story',
    label: 'Chi Siamo — club story',
    contentType: 'markdown' as const,
    contentIt: '## La nostra storia\n\nOxzyO - Orizzonti Ludici nasce dalla passione di un gruppo di amici pisani per i giochi da tavolo moderni. Il club è un punto di riferimento per tutti gli appassionati di giochi da tavolo della zona.',
    contentEn: '## Our story\n\nOxzyO - Orizzonti Ludici was born from the passion of a group of Pisan friends for modern board games. The club is a reference point for all board game enthusiasts in the area.',
  },
  {
    key: 'about.values',
    label: 'Chi Siamo — values',
    contentType: 'markdown' as const,
    contentIt: '## I nostri valori\n\n- **Inclusività**: accogliamo tutti, dai principianti agli esperti\n- **Passione**: amiamo i giochi da tavolo in tutte le loro forme\n- **Comunità**: costruiamo amicizie attorno al tavolo',
    contentEn: '## Our values\n\n- **Inclusivity**: we welcome everyone, from beginners to experts\n- **Passion**: we love board games in all their forms\n- **Community**: we build friendships around the table',
  },
  {
    key: 'join.process',
    label: 'Unisciti — joining process',
    contentType: 'markdown' as const,
    contentIt: '## Come entrare nel club\n\n1. Vieni a trovarci a una delle nostre serate\n2. Presentati e gioca con noi\n3. Se vuoi diventare socio, parla con uno dei nostri responsabili\n4. Paga la quota associativa annuale\n5. Benvenuto in OxzyO!',
    contentEn: '## How to join the club\n\n1. Come visit us at one of our game nights\n2. Introduce yourself and play with us\n3. If you want to become a member, talk to one of our staff\n4. Pay the annual membership fee\n5. Welcome to OxzyO!',
  },
  {
    key: 'join.benefits',
    label: 'Unisciti — membership benefits',
    contentType: 'markdown' as const,
    contentIt: '## Vantaggi del tesseramento\n\n- Accesso alla nostra ludoteca con oltre 400 giochi\n- Sconti su eventi speciali e tornei\n- Possibilità di prendere in prestito i giochi\n- Far parte di una comunità appassionata',
    contentEn: '## Membership benefits\n\n- Access to our game library with over 400 games\n- Discounts on special events and tournaments\n- Ability to borrow games\n- Be part of a passionate community',
  },
  {
    key: 'join.fee_note',
    label: 'Unisciti — fee note',
    contentType: 'text' as const,
    contentIt: 'La quota annuale è di €10',
    contentEn: 'The annual membership fee is €10',
  },
] satisfies Array<{
  key: string
  label: string
  contentType: 'text' | 'markdown'
  contentIt: string
  contentEn: string
}>

async function seedContentBlocks() {
  console.log('Seeding content blocks...')

  for (const block of CONTENT_BLOCKS) {
    await db
      .insert(contentBlocks)
      .values(block)
      .onConflictDoNothing({ target: contentBlocks.key })
    console.log(`  ✓ ${block.key}`)
  }

  console.log(`Done — ${CONTENT_BLOCKS.length} content blocks seeded.`)
}

seedContentBlocks().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
