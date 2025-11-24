'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const isLoginRoute = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginRoute) {
      return;
    }

    if (!loading && !token) {
      const redirectTarget = pathname && pathname !== '/admin' ? pathname : '/admin/dashboard';
      router.replace(`/admin/login?redirect=${encodeURIComponent(redirectTarget)}`);
    }
  }, [isLoginRoute, loading, token, pathname, router]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <div className="animate-spin h-14 w-14 rounded-full border-4 border-indigo-500 border-t-transparent mb-6" />
        <p className="text-sm text-slate-400 tracking-wide uppercase">Checking admin access…</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200 px-6">
        <ShieldAlert className="h-16 w-16 text-amber-400 mb-5" />
        <h1 className="text-2xl font-semibold text-slate-100 mb-2 text-center">
          Admin authentication required
        </h1>
        <p className="text-sm text-slate-400 max-w-md text-center">
          Your session expired or you are not signed in. Please log in with an authorised Norix admin account to continue.
        </p>
        <Link
          href={`/admin/login?redirect=${encodeURIComponent(pathname ?? '/admin/dashboard')}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-600"
        >
          <LogIn className="h-4 w-4" />
          Sign in as Admin
        </Link>
      </div>
    );
  }

  const isAdmin = (user?.role ?? (user?.userType === 'admin' ? 'admin' : 'user')) === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-50 px-6">
        <ShieldAlert className="h-16 w-16 text-amber-400 mb-5" />
        <h1 className="text-2xl font-semibold text-slate-100 mb-2 text-center">
          Access restricted to Norix Admins.
        </h1>
        <p className="text-sm text-slate-400 max-w-md text-center">
          You are currently signed in with a non-admin account. Please switch to an authorised admin profile to view Norix admin tools.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800/70"
          >
            Back to User Login
          </Link>
          <Link
            href={`/admin/login?redirect=${encodeURIComponent(pathname ?? '/admin/dashboard')}`}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-600"
          >
            <LogIn className="h-4 w-4" />
            Switch to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


















