'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
import Image from 'next/image';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Helper function to safely access localStorage
const setLocalStorage = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

export default function Signup() {
  const router = useRouter();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'find-work' | 'hire-talent' | null>(null);
  const [userType, setUserType] = useState<'student' | 'employer'>('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: '',
    college: '' // Only for students
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpData, setOtpData] = useState({ email: '', phone: '' });
  const [step, setStep] = useState<'role-selection' | 'form' | 'otp' | 'success'>('role-selection');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate form data
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate college for students only
    if (userType === 'student' && !formData.college?.trim()) {
      setError('College/University is required for students');
      setLoading(false);
      return;
    }

    try {
      // Send OTP to email address
      await apiService.sendOTP(formData.email.trim(), 'signup');
      setOtpData(prev => ({ ...prev, email: formData.email }));
      setStep('otp');
      setSuccess('OTP sent to your email address!');
    } catch (error: any) {
      setError(apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!otpData.email) {
      setError('Email is required to verify OTP');
      setLoading(false);
      return;
    }

    if (!formData.otp) {
      setError('OTP is required');
      setLoading(false);
      return;
    }

    try {
      // Option A: Directly register; backend will verify OTP
      await handleRegister();
      setSuccess('OTP verified and account created!');
    } catch (error: any) {
      setError(apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare user data for registration
      const userData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        userType,
        otp: formData.otp // Include the verified OTP
      };

      // Add college for students only
      if (userType === 'student' && formData.college?.trim()) {
        userData.college = formData.college.trim();
      }

      // Register the user
      const response = await apiService.register(userData) as any;
      
      console.log('🔐 Registration response:', response); // Debug log
      
      // The response structure is { success: true, message: "...", data: { user: {...}, token: "..." } }
      const { user, token } = response.data || response;
      
      console.log('👤 User data:', user); // Debug log
      console.log('🔑 Token:', token ? 'Present' : 'Missing'); // Debug log
      
      if (token && user) {
        // Store the token and user data
        setLocalStorage('token', token);
        setLocalStorage('user', JSON.stringify(user));
        
        // Login the user using AuthContext
        login(user, token);
        
        setStep('success');
        setSuccess('Account created successfully! Redirecting...');
        
        // Redirect based on user type
        let redirectPath = '/';
        if (user.userType === 'employer') {
          // If employer doesn't have a category, redirect to role selection
          if (!user.employerCategory) {
            redirectPath = '/employer/select-role';
          } else {
            // If already has category, redirect to their type-specific KYC page
            const category = user.employerCategory;
            if (category === 'corporate') {
              redirectPath = '/employer/kyc/corporate';
            } else if (category === 'local_business') {
              redirectPath = '/employer/kyc/local';
            } else if (category === 'individual') {
              redirectPath = '/employer/kyc/individual';
            } else {
              redirectPath = '/employer/select-role';
            }
          }
        } else if (user.userType === 'student') {
          redirectPath = '/student/dashboard';
        } else if (user.userType === 'admin' || user.role === 'admin') {
          redirectPath = '/admin/dashboard';
        }
        
        console.log('🚀 Redirecting to:', redirectPath); // Debug log
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push(redirectPath);
        }, 1500);
      } else {
        console.error('❌ Missing user or token in response:', { user, token }); // Debug log
        setError('Registration failed. Please try again.');
      }
    } catch (error: any) {
      setError(apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 overflow-hidden">
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

      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl grid-cols-1 items-center gap-4 sm:gap-6 lg:gap-8 px-3 sm:px-4 py-4 sm:py-6 md:grid-cols-2">
        {/* Left: Branding */}
        <div className="hidden md:block">
          <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-md">
            <Image src="/img/norixnobg.jpg" alt="NoriX" width={50} height={50} className="h-10 w-10" />
            <span className="text-sm font-semibold tracking-wide text-gray-800">Welcome to NoriX</span>
          </div>

          <h1 className="mb-2 text-3xl font-bold leading-tight text-gray-900">
            Join NoriX Community
          </h1>
          <p className="mb-6 max-w-lg text-gray-600">
            Create your account and start connecting with opportunities. Students find jobs, employers find talent.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {["Secure Sign-up", "Real-time Verification", "Student & Employer Profiles", "Quick Start"].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-sm text-gray-700 shadow-sm backdrop-blur"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Auth card */}
        <div className="w-full flex items-center justify-center py-4">
          <div className="mx-auto w-full max-w-md rounded-xl sm:rounded-2xl border border-gray-200 bg-white/85 shadow-xl backdrop-blur-sm overflow-hidden flex flex-col">
            {/* Card Header */}
            <div className="pt-3 sm:pt-4 px-4 sm:px-5 pb-2">
              {/* Mobile Logo - Hidden on desktop */}
              <div className="mb-2 flex md:hidden items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-2 py-1 shadow-sm backdrop-blur-md">
                  <Image src="/img/norixnobg.jpg" alt="NoriX" width={32} height={32} className="h-8 w-8" />
                  <span className="text-xs font-semibold tracking-wide text-gray-800">Welcome to NoriX</span>
                </div>
              </div>

              <div className="mb-2 flex flex-col items-center text-center">
                {/* Big logo - Hidden on mobile */}
                <Image src="/img/norixnobg.jpg" alt="NoriX" width={80} height={80} className="hidden md:block h-12 w-12" priority />
                <h2 className="mt-1 text-base sm:text-lg font-semibold text-gray-900">
                  {step === 'role-selection' ? 'Choose Your Path' : 'Create account'}
                </h2>
                {step === 'form' && selectedRole && (
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span className="text-xl">
                      {selectedRole === 'find-work' ? '🎓' : '💼'}
                    </span>
                    <span className="text-xs text-gray-600">
                      {selectedRole === 'find-work' ? 'Find Work' : 'Hire Talent'}
                    </span>
                    <button
                      onClick={() => {
                        setStep('role-selection');
                        setSelectedRole(null);
                      }}
                      className="ml-1 text-xs text-indigo-600 hover:text-indigo-700 underline"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content - No scrolling */}
            <div className="px-4 sm:px-5 pb-5 sm:pb-6">
              {/* Role Selection Screen */}
              {step === 'role-selection' && (
                <>
                  <div className="text-center mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                      What do you want to do in NoriX?
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Choose the option that best describes your goal
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Find Work Option */}
                    <button
                      onClick={() => {
                        setSelectedRole('find-work');
                        setUserType('student');
                        setStep('form');
                      }}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-4xl sm:text-5xl group-hover:scale-110 transition-transform shadow-md">
                            🎓
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Find Work</h3>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-2">
                            Looking for job opportunities? Connect with employers and browse part-time jobs.
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">Part-time</span>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">Flexible</span>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">Student</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Hire Talent Option */}
                    <button
                      onClick={() => {
                        setSelectedRole('hire-talent');
                        setUserType('employer');
                        setStep('form');
                      }}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-4xl sm:text-5xl group-hover:scale-110 transition-transform shadow-md">
                            💼
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Hire Talent</h3>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-2">
                            Post jobs and recruit talented individuals. Find skilled students for your team.
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Post Jobs</span>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Recruit</span>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Quick Hire</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}

              {step === 'form' && (
            <>

              <form className="space-y-3" onSubmit={handleSendOTP}>
                {/* Common Fields */}
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-0.5">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border-2 border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-0.5">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border-2 border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-0.5">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border-2 border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-0.5">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border-2 border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                      placeholder="Create a password"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-0.5">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border-2 border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>

                {/* College field - Only for students */}
                {userType === 'student' && (
                  <div>
                    <label htmlFor="college" className="block text-xs font-medium text-gray-700">
                      College/University <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-0.5">
                      <input
                        id="college"
                        name="college"
                        type="text"
                        required
                        value={formData.college}
                        onChange={handleInputChange}
                        className="appearance-none block w-full px-3 py-2 border-2 border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                        placeholder="Enter your college/university name"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? 'Sending OTP...' : 'Continue'}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="text-center mb-3">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Verify your email
              </h2>
                <p className="mt-1 text-xs text-gray-600">
                Code sent to <strong>{otpData.email}</strong>
              </p>
              </div>

              {/* Display entered information for review */}
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-3 mb-3">
                <h3 className="text-xs font-semibold text-indigo-900 mb-1.5 flex items-center gap-1">
                  <span className="text-indigo-600">✓</span> Your Details:
                </h3>
                <div className="space-y-0.5 text-xs text-gray-700">
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                  {userType === 'student' && formData.college && (
                    <p><strong>College:</strong> {formData.college}</p>
                  )}
                </div>
              </div>

              <form className="space-y-3" onSubmit={handleVerifyOTP}>
                <div>
                  <label htmlFor="otp" className="block text-xs font-medium text-gray-700">
                    Verification Code
                  </label>
                  <div className="mt-0.5">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      value={formData.otp}
                      onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                      className="appearance-none block w-full px-3 py-2 border-2 border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                      placeholder="Enter 6-digit code"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  {/* Edit Details Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setFormData(prev => ({ ...prev, otp: '' }));
                      setError('');
                      setSuccess('');
                    }}
                    className="w-full flex justify-center py-2 px-4 border-2 border-gray-200 rounded-lg shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                    disabled={loading}
                  >
                    ← Edit Details
                  </button>

                  {/* Resend OTP Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        setError('');
                        await apiService.sendOTP(formData.email.trim(), 'signup');
                        setSuccess('OTP resent!');
                      } catch (error: any) {
                        setError(apiService.handleError(error));
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full flex justify-center py-1.5 px-4 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                Welcome, {formData.name}!
              </h2>
                <p className="mt-2 text-sm text-gray-600">
                Your account has been created successfully. You're being redirected to your dashboard...
              </p>
              </div>
            </>
          )}

              {error && (
                <div className="mt-2 text-center text-xs text-red-600 bg-red-50 border-2 border-red-200 rounded-lg p-2">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-2 text-center text-xs text-green-700 bg-green-50 border-2 border-green-200 rounded-lg p-2">
                  {success}
                </div>
              )}

              {step === 'form' && (
                <>
                  <div className="my-3 flex items-center gap-2">
                    <span className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs uppercase tracking-wide text-gray-400">or</span>
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>

                  <div className="text-center pb-1">
                    <span className="text-xs text-gray-600">Already have an account?</span>{' '}
                    <Link
                      href="/login"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Sign in
                    </Link>
                  </div>
                </>
              )}

              {step === 'role-selection' && (
                <div className="text-center pt-2 pb-1">
                  <span className="text-xs text-gray-600">Already have an account?</span>{' '}
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
