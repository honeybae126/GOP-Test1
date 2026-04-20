import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn   = !!req.auth
  const isAuthPage   = pathname.startsWith('/auth')

  // Public auth routes (sign-in, access-denied, etc.) — always allow
  if (isAuthPage) return

  // Unauthenticated → send to sign-in
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // Authenticated but no matching Azure AD group → send to access-denied
  if ((req.auth as { user?: { accessDenied?: boolean } })?.user?.accessDenied) {
    return NextResponse.redirect(new URL('/auth/access-denied', req.url))
  }
})

export const config = {
  // Only run middleware on app page routes — never on API routes or Next.js internals
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
