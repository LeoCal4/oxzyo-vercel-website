const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2'
const BGG_LOGIN_URL = 'https://boardgamegeek.com/login/api/v1'
const MAX_RETRIES = 5
const RETRY_DELAY_MS = 2000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Log in to BGG and return session cookies.
 * Required when BGG_API_TOKEN is not set but BGG_PASSWORD is available.
 * BGG policy: no registration needed if you're only downloading your own collection while logged in.
 */
async function getBggSessionCookie(): Promise<string> {
  const username = process.env.BGG_USERNAME
  const password = process.env.BGG_PASSWORD
  if (!username || !password) {
    throw new Error(
      'Set either BGG_API_TOKEN (registered app) or BGG_PASSWORD (own collection login) in your environment.',
    )
  }

  const res = await fetch(BGG_LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credentials: { username, password } }),
  })

  if (!res.ok) {
    throw new Error(`BGG login failed: HTTP ${res.status}`)
  }

  const cookies = res.headers.getSetCookie()
  if (!cookies.length) throw new Error('BGG login succeeded but no session cookie was returned')

  return cookies.map((c) => c.split(';')[0]).join('; ')
}

let _sessionCookie: string | null = null

async function authHeaders(): Promise<HeadersInit> {
  const token = process.env.BGG_API_TOKEN
  if (token) return { Authorization: `Bearer ${token}` }

  // Fall back to session-based auth (own collection, no registration needed)
  if (!_sessionCookie) {
    _sessionCookie = await getBggSessionCookie()
  }
  return { Cookie: _sessionCookie }
}

export async function fetchCollection(username: string): Promise<string> {
  const url = `${BGG_API_BASE}/collection?username=${encodeURIComponent(username)}&own=1&stats=1`
  const headers = await authHeaders()

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, { headers })

    if (res.status === 202) {
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY_MS)
        continue
      }
      throw new Error(`BGG returned 202 after ${MAX_RETRIES} attempts for collection`)
    }

    if (!res.ok) {
      throw new Error(`BGG collection fetch failed: HTTP ${res.status}`)
    }

    return res.text()
  }

  throw new Error('Unreachable: retry loop exhausted')
}

export async function fetchThings(ids: number[]): Promise<string> {
  const url = `${BGG_API_BASE}/thing?id=${ids.join(',')}&stats=1`
  const res = await fetch(url, { headers: await authHeaders() })

  if (!res.ok) {
    throw new Error(
      `BGG things fetch failed: HTTP ${res.status} for IDs: ${ids.slice(0, 5).join(',')}...`,
    )
  }

  return res.text()
}
