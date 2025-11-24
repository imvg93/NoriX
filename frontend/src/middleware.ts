import { NextRequest, NextResponse } from 'next/server';

const ADMIN_LOGIN_PATH = '/admin/login';
const TOKEN_COOKIE = 'norix_token';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  return 'http://localhost:5000/api';
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin') || pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/verify-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Token verification failed with status ${response.status}`);
    }

    const data = await response.json();
    const user = data?.user;
    const role =
      user?.role === 'admin'
        ? 'admin'
        : user?.role === 'user'
          ? 'user'
          : user?.userType === 'admin'
            ? 'admin'
            : 'user';

    if (role !== 'admin') {
      const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('unauthorized', '1');
      loginUrl.searchParams.set('message', 'Access restricted to Norix Admins.');
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    console.error('Admin middleware verification error:', error);
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

















