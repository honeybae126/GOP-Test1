import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }
})

export const config = {
  // Only run middleware on app page routes — never on API routes or Next.js internals
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
