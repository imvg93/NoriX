'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowLeft, Home, LockKeyhole, ShieldCheck } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const inputStyle =
  'w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const redirectPath = useMemo(() => {
    const redirect = searchParams?.get('redirect');
    if (!redirect || redirect === '/admin/login') {
      return '/admin/dashboard';
    }
    return redirect;
  }, [searchParams]);

  const unauthorizedMessage = searchParams?.get('message') ?? (searchParams?.get('unauthorized') ? 'Access restricted to Norix Admins.' : null);

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      router.replace(redirectPath);
    }
  }, [authLoading, user, redirectPath, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.loginAuto(email.trim().toLowerCase(), password);

      if (!response?.user) {
        throw new Error('Login failed. Please verify your credentials.');
      }

      if (response.user.role !== 'admin') {
        setError('Access restricted to Norix Admins. Please use an authorised admin account.');
        await apiService.logout();
        return;
      }

      await login(response.user, response.token);
      setSuccess('Welcome back, Norix Admin!');
      setTimeout(() => {
        router.replace(redirectPath);
      }, 400);
    } catch (err: any) {
      const message =
        err?.message ||
        (typeof err === 'string' ? err : 'Unable to sign in. Please double-check your email and password.');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <motion.div
        className="absolute inset-0 opacity-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(103, 132, 255, 0.28) 0, transparent 45%), radial-gradient(circle at 80% 30%, rgba(129, 92, 246, 0.3) 0, transparent 45%), radial-gradient(circle at 50% 80%, rgba(17, 204, 223, 0.25) 0, transparent 45%)',
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 backdrop-blur transition hover:bg-slate-800/70"
          >
            <Home className="h-4 w-4" />
            Back to Norix
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 backdrop-blur transition hover:bg-slate-800/70"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to User Login
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-6 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            <motion.section
              className="hidden flex-col justify-center rounded-3xl border border-slate-800/70 bg-slate-900/50 p-8 shadow-2xl shadow-indigo-900/20 backdrop-blur lg:flex"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            >
              <div className="mb-8 flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-2">
                  <Image src="/img/norixnobg.jpg" alt="Norix Logo" fill className="object-contain" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-indigo-300/70">Norix Control Center</p>
                  <h1 className="text-2xl font-semibold text-white">Admin Access Portal</h1>
                </div>
              </div>

              <div className="space-y-5 text-sm text-slate-300">
                <p>
                  Manage the Norix ecosystem, review verifications, and oversee platform insights with a secure
                  administrator console crafted for precision and speed.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Real-time dashboards',
                    'Student onboarding',
                    'Employer compliance',
                    'Job approvals',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-900/40 px-3 py-3 text-xs font-medium uppercase tracking-wide text-indigo-200/90"
                    >
                      <ShieldCheck className="h-4 w-4 text-teal-300" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-xl shadow-indigo-900/30 backdrop-blur"
            >
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative z-10">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/40 bg-indigo-500/20 text-indigo-200">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/80">Secure Sign In</p>
                    <h2 className="text-xl font-semibold text-white">Norix Admin Login</h2>
                  </div>
                </div>

                <AnimatePresence>
                  {(unauthorizedMessage || error) && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-300" />
                        <div className="space-y-1">
                          <p className="font-medium tracking-wide text-rose-100">
                            {unauthorizedMessage ?? 'Access restricted to Norix Admins.'}
                          </p>
                          {error && <p className="text-slate-200/80">{error}</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {success && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 flex-shrink-0 text-emerald-300" />
                        <p>{success}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="admin-email" className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                      Admin Email
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      required
                      placeholder="admin@norixhq.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={inputStyle}
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-password" className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                      Password
                    </label>
                    <input
                      id="admin-password"
                      type="password"
                      required
                      placeholder="Enter secure admin password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={inputStyle}
                      autoComplete="current-password"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 px-5 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-400 hover:via-purple-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Securing access…' : 'Sign in to Norix Admin'}
                  </motion.button>
                </form>

                <div className="mt-6 space-y-3 text-xs text-slate-400">
                  <p className="flex items-center gap-2 text-slate-500">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow shadow-emerald-400/40" />
                    Multi-factor authentication enforced for all admin accounts.
                  </p>
                  <p>
                    Need assistance? Reach out to the Norix security team at{' '}
                    <a
                      href="mailto:security@norixhq.com"
                      className="font-medium text-indigo-300 transition hover:text-indigo-200"
                    >
                      security@norixhq.com
                    </a>
                    .
                  </p>
                </div>
              </div>
            </motion.section>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100">Loading admin portal…</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}





