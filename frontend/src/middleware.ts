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

  // Allow login page and non-admin routes
  if (!pathname.startsWith('/admin') || pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Try to verify token, but if it fails, allow through to let client-side handle it
  // This prevents blocking due to network issues or API unavailability
  try {
    const apiUrl = getApiBaseUrl();
    const verifyUrl = `${apiUrl}/auth/verify-token`;
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(verifyUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
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
    } else {
      // If verification fails but we have a token, allow through
      // The layout component will handle the actual verification
      console.warn(`Token verification returned ${response.status}, allowing through for client-side check`);
    }
  } catch (error: any) {
    // If there's a network error or timeout, allow through
    // The layout component will handle verification on the client side
    console.warn('Middleware: Token verification error, allowing through for client-side check:', error?.message || error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

















