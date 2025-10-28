"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import LoginForm from '@/components/LoginForm';
import dynamic from 'next/dynamic';
const SignupInline = dynamic(() => import('@/components/SignupInline'));
import { motion, AnimatePresence } from 'framer-motion';
import { AuthSwitch } from '@/components/ui/auth-switch';

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

  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    history.replaceState(null, '', newMode === 'signup' ? '#signup' : '#');
  };

  return (
    <div className="relative h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 overflow-hidden">
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white/80 px-4 py-2 text-sm text-gray-700 shadow-sm backdrop-blur-md transition hover:bg-white"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white/80 px-4 py-2 text-sm text-gray-700 shadow-sm backdrop-blur-md transition hover:bg-white"
            aria-label="Go home"
          >
            <Home className="h-4 w-4" /> Home
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-screen items-center justify-center px-4 pt-16 pb-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-4">
            
            {/* Left Side - Branding */}
            <motion.div
              className="hidden lg:flex flex-col justify-center pr-8"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-4 inline-flex items-center gap-3 rounded-full border-2 border-gray-200 bg-white/80 px-6 py-3 shadow-md backdrop-blur-sm w-fit">
                <Image src="/img/norixnobg.jpg" alt="NoriX" width={40} height={40} className="h-10 w-10" />
                <span className="text-sm font-bold tracking-wide text-gray-800">Welcome to NoriX</span>
              </div>

              <h1 className="mb-3 text-3xl font-bold leading-tight text-gray-900">
                {mode === 'login' ? 'Welcome Back!' : 'Join NoriX Community'}
              </h1>
              <p className="mb-6 text-base text-gray-600 max-w-md">
                {mode === 'login' 
                  ? 'Sign in to continue your journey with the best part-time job opportunities.' 
                  : 'Create your account and start connecting with opportunities. Students find jobs, employers find talent.'}
              </p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  mode === 'login' ? "Secure Login" : "Secure Sign-up",
                  "Real-time Updates", 
                  "Student & Employer Tools", 
                  mode === 'login' ? "Quick Access" : "Quick Start"
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 * idx }}
                    className="flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-white/80 px-3 py-2 text-sm text-gray-700 shadow-sm backdrop-blur"
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white text-xs flex-shrink-0">✓</span>
                    <span className="text-xs truncate">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side - Auth Card */}
            <motion.div
              className="flex items-center justify-center lg:pl-4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-full max-w-md">
                {/* Mobile Logo */}
                <div className="mb-4 flex lg:hidden justify-center">
                  <div className="inline-flex items-center gap-3 rounded-full border-2 border-gray-200 bg-white/80 px-4 py-2 shadow-md backdrop-blur-sm">
                    <Image src="/img/norixnobg.jpg" alt="NoriX" width={40} height={40} className="h-10 w-10" />
                    <span className="text-sm font-bold tracking-wide text-gray-800">Welcome to NoriX</span>
                  </div>
                </div>

                {/* Auth Card */}
                <div className="rounded-3xl border-2 border-gray-200 bg-white/90 p-6 shadow-2xl backdrop-blur-md max-h-[calc(100vh-8rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {/* Logo and Auth Switch */}
                  <div className="mb-4 flex flex-col items-center">
                    <Image 
                      src="/img/norixnobg.jpg" 
                      alt="NoriX" 
                      width={100} 
                      height={100} 
                      className="h-24 w-24" 
                      priority 
                    />
                    <h2 className="mt-3 mb-3 text-xl font-bold text-gray-900">
                      {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
                    </h2>
                    <AuthSwitch
                      initialMode={mode}
                      onSwitch={handleModeSwitch}
                    />
                  </div>

                  {/* Animated Form Container */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {mode === 'signup' ? (
                        <SignupInline />
                      ) : (
                        <LoginForm compact />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
