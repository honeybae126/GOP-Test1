import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/auth/signin', '/auth/error', '/auth/no-access', '/auth/role-select']
const PRINT_ROUTES  = ['/print']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session      = req.auth

  // Allow public and print routes through without auth
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) return NextResponse.next()
  if (PRINT_ROUTES.some(r => pathname.startsWith(r)))  return NextResponse.next()

  // Not authenticated → redirect to sign in
  if (!session?.user) {
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Authenticated but no role assigned in Azure
  if (session.user.role === 'NO_ROLE') {
    return NextResponse.redirect(new URL('/auth/no-access', req.url))
  }

  const role = session.user.role

  // Admin-only routes
  if (pathname.startsWith('/admin') && role !== 'IT_ADMIN') {
    return NextResponse.redirect(new URL('/gop', req.url))
  }

  // Finance dashboard
  if (pathname.startsWith('/finance') && !['FINANCE', 'IT_ADMIN'].includes(role)) {
    return NextResponse.redirect(new URL('/gop', req.url))
  }

  // Doctor dashboard
  if (pathname.startsWith('/dashboard/doctor') && !['DOCTOR', 'IT_ADMIN'].includes(role)) {
    return NextResponse.redirect(new URL('/gop', req.url))
  }

  // Patient routes
  if (pathname.startsWith('/patients') && !['INSURANCE_STAFF', 'IT_ADMIN'].includes(role)) {
    return NextResponse.redirect(new URL('/gop', req.url))
  }

  // New GOP wizard
  if (pathname.startsWith('/gop/new') && !['INSURANCE_STAFF', 'IT_ADMIN'].includes(role)) {
    return NextResponse.redirect(new URL('/gop', req.url))
  }

  // Root — redirect based on role
  if (pathname === '/') {
    if (role === 'DOCTOR')  return NextResponse.redirect(new URL('/dashboard/doctor', req.url))
    if (role === 'FINANCE') return NextResponse.redirect(new URL('/finance', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

