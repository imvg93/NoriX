"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Home } from 'lucide-react';
import LoginForm from '@/components/LoginForm';
import dynamic from 'next/dynamic';
const SignupInline = dynamic(() => import('@/components/SignupInline'));
import { motion } from 'framer-motion';

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const applyHash = () => {
      if (typeof window === 'undefined') return;
      setMode(window.location.hash === '#signup' ? 'signup' : 'login');
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const isSignup = mode === 'signup';

  return (
    <div className="relative h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 overflow-hidden">
      {/* Top bar with Back and Home */}
      <div className="sticky top-0 z-10 bg-transparent h-16">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-2 text-sm text-gray-700 shadow-sm backdrop-blur-md transition hover:bg-white"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-2 text-sm text-gray-700 shadow-sm backdrop-blur-md transition hover:bg-white"
            aria-label="Go home"
          >
            <Home className="h-4 w-4" /> Home
          </Link>
        </div>
      </div>

      {/* Single screen layout with two columns (no vertical scroll) */}
      <div className="mx-auto grid h-[calc(100vh-64px)] max-w-6xl grid-cols-1 items-center gap-8 px-4 md:grid-cols-2">
        {/* Left: Branding with subtle animations */}
        <motion.div
          className="hidden md:block"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-md">
            <Image src="/img/norixnobg.jpg" alt="NoriX" width={50} height={50} className="h-10 w-10" />
            <span className="text-sm font-semibold tracking-wide text-gray-800">Welcome to NoriX</span>
          </div>

          <h1 className="mb-2 text-3xl font-bold leading-tight text-gray-900">
            Work better with NoriX
          </h1>
          <p className="mb-6 max-w-lg text-gray-600">
            Real-time tools for students and employers to find and post jobs quickly.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {["Secure authentication", "Real-time updates", "Employer tools", "Student friendly"].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * idx }}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-sm text-gray-700 shadow-sm backdrop-blur"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">✓</span>
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right: Auth card kept compact to fit viewport */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
        >
          <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white/85 p-6 shadow-xl backdrop-blur-sm">
            <div className="mb-4 flex flex-col items-center text-center">
              {/* Big logo */}
              <Image src="/img/norixnobg.jpg" alt="NoriX" width={160} height={160} className="h-32 w-32" priority />
              {/* Heading moved out of LoginForm; keep compact form to avoid duplicate heading */}
              <h2 className="mt-3 text-xl font-semibold text-gray-900">{isSignup ? 'Create your account' : 'Sign in to your account'}</h2>
            </div>


            {/* Forms container with smooth cross-fade */}
            <div className="relative">
              {/* Toggle via hash/state: #signup switches view without leaving page */}
              {isSignup ? (
                <div className="animate-fade-in">
                  <SignupInline />
                </div>
              ) : (
                <div className="animate-fade-in">
                  <LoginForm compact />
                </div>
              )}
            </div>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-xs uppercase tracking-wide text-gray-400">or</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="text-center">
              {isSignup ? (
                <>
                  <span className="text-sm text-gray-600">Already have an account?</span>{' '}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); history.replaceState(null, '', '#'); setMode('login'); }}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Sign in
                  </a>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-600">New here?</span>{' '}
                  <a
                    href="#signup"
                    onClick={(e) => { e.preventDefault(); history.replaceState(null, '', '#signup'); setMode('signup'); }}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Create an account
                  </a>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
