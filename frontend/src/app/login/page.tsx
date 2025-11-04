"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import LoginForm from '@/components/LoginForm';

export default function Login() {
  const router = useRouter();

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
      <div className="flex min-h-screen items-center justify-center px-3 sm:px-4 pt-16 pb-6 sm:pb-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-4">
            
            {/* Left Side - Branding */}
            <div className="hidden lg:flex flex-col justify-center pr-8">
              <div className="mb-4 inline-flex items-center gap-3 rounded-full border-2 border-gray-200 bg-white/80 px-6 py-3 shadow-md backdrop-blur-sm w-fit">
                <Image src="/img/norixnobg.jpg" alt="NoriX" width={40} height={40} className="h-10 w-10" />
                <span className="text-sm font-bold tracking-wide text-gray-800">Welcome to NoriX</span>
              </div>

              <h1 className="mb-3 text-3xl font-bold leading-tight text-gray-900">
                Welcome Back!
              </h1>
              <p className="mb-6 text-base text-gray-600 max-w-md">
                Sign in to continue your journey with the best part-time job opportunities.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  "Secure Login",
                  "Real-time Updates", 
                  "Student & Employer Tools", 
                  "Quick Access"
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-white/80 px-3 py-2 text-sm text-gray-700 shadow-sm backdrop-blur"
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white text-xs flex-shrink-0">✓</span>
                    <span className="text-xs truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Auth Card */}
            <div className="flex items-center justify-center lg:pl-4">
              <div className="w-full max-w-md">
                {/* Mobile Logo */}
                <div className="mb-4 flex lg:hidden justify-center">
                  <div className="inline-flex items-center gap-3 rounded-full border-2 border-gray-200 bg-white/80 px-4 py-2 shadow-md backdrop-blur-sm">
                    <Image src="/img/norixnobg.jpg" alt="NoriX" width={40} height={40} className="h-10 w-10" />
                    <span className="text-sm font-bold tracking-wide text-gray-800">Welcome to NoriX</span>
                  </div>
                </div>

                {/* Auth Card */}
                <div className="rounded-2xl sm:rounded-3xl border-2 border-gray-200 bg-white/90 p-4 sm:p-6 shadow-2xl backdrop-blur-md max-h-[calc(100vh-8rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {/* Logo and Auth Switch */}
                  <div className="mb-4 sm:mb-6 flex flex-col items-center">
                    <Image 
                      src="/img/norixnobg.jpg" 
                      alt="NoriX" 
                      width={100} 
                      height={100} 
                      className="h-20 w-20 sm:h-24 sm:w-24" 
                      priority 
                    />
                    <h2 className="mt-2 sm:mt-3 mb-2 sm:mb-3 text-lg sm:text-xl font-bold text-gray-900 px-2 text-center">
                      Sign in to your account
                    </h2>
                  </div>

                  {/* Login Form */}
                  <LoginForm compact />

                  {/* Create Account Link */}
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{' '}
                      <Link 
                        href="/signup"
                        className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        Create account
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
