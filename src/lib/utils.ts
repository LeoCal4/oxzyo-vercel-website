import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
  eacute: 'é', Eacute: 'É', egrave: 'è', Egrave: 'È',
  agrave: 'à', Agrave: 'À', igrave: 'ì', ograve: 'ò', ugrave: 'ù',
  ntilde: 'ñ', Ntilde: 'Ñ', ouml: 'ö', uuml: 'ü', auml: 'ä',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d',
  mdash: '\u2014', ndash: '\u2013', hellip: '\u2026', trade: '\u2122',
}

/** Decode HTML/XML character references (e.g. &#039; → ', &amp; → &). */
export function decodeHtml(s: string): string {
  return s.replace(/&(?:#(\d+)|#x([\da-fA-F]+)|([a-zA-Z]+));/g, (_, dec, hex, name) => {
    if (dec) return String.fromCharCode(Number(dec))
    if (hex) return String.fromCharCode(parseInt(hex, 16))
    return NAMED_ENTITIES[name] ?? _
  })
}
