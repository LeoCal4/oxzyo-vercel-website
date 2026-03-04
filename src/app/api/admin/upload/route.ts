import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createHash } from 'crypto'

function isValidSession(sessionHash: string): boolean {
  const expected = createHash('sha256').update(process.env.ADMIN_TOKEN!).digest('hex')
  return sessionHash === expected
}

export async function POST(request: NextRequest) {
  // Validate via x-admin-token header or admin_session cookie
  const headerToken = request.headers.get('x-admin-token')
  const cookieSession = request.cookies.get('admin_session')?.value

  const authorized =
    (headerToken && headerToken === process.env.ADMIN_TOKEN) ||
    (cookieSession && isValidSession(cookieSession))

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  const blob = await put(file.name, file, {
    access: 'public',
    contentType: file.type,
  })

  return NextResponse.json({ url: blob.url })
}
