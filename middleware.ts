import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './src/lib/i18n/routing'
import { createHash } from 'crypto'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin guard — runs before locale middleware
  if (pathname.startsWith('/admin/')) {
    const token = pathname.split('/')[2]
    if (token !== process.env.ADMIN_TOKEN) {
      return new NextResponse(null, { status: 404 })
    }
    // Set admin_session cookie (SHA-256 hash of token, 8h, httpOnly)
    const response = NextResponse.next()
    const hash = createHash('sha256').update(token).digest('hex')
    response.cookies.set('admin_session', hash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
      path: '/',
      sameSite: 'strict',
    })
    return response
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|images|public).*)',
  ],
}
