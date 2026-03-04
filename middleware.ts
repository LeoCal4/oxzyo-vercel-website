import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './src/lib/i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin guard — runs before locale middleware
  if (pathname.startsWith('/admin/')) {
    const token = pathname.split('/')[2]
    if (token !== process.env.ADMIN_TOKEN) {
      return new NextResponse(null, { status: 404 })
    }
    return NextResponse.next()
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|images|public).*)',
  ],
}
