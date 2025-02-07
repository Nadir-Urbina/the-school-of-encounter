import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const user = request.cookies.get('user')
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/teacher-dashboard')

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/teacher-dashboard/:path*',
    '/auth/:path*'
  ],
} 