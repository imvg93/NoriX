import { NextRequest, NextResponse } from 'next/server';

// For now, rely on client-side AuthContext and backend API protection for admin routes.
// The frontend app runs on a different domain than the API, so cookie-based checks here
// would fail in production and cause redirect loops.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run middleware on /admin paths; let everything through without auth checks.
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

















