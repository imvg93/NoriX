'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiService } from '../../services/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [formData, setFormData] = useState({
    email: '',
    userType: 'student',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const router = useRouter();

  // Timer for resend OTP functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === 'otp') {
      // Accept only digits and limit to 6
      nextValue = value.replace(/\D/g, '').slice(0, 6);
    }
    setFormData(prev => ({
      ...prev,
      [name]: nextValue
    }));
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      await apiService.loginRequestOTP(formData.email, formData.userType);
      setStep('otp');
      setSuccess('OTP sent to your email address!');
      setResendTimer(30); // 30 seconds cooldown
      setCanResend(false);
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

    const cleanOtp = (formData.otp || '').toString().replace(/\D/g, '').slice(0, 6);
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the OTP');
      setLoading(false);
      return;
    }

    try {
      // Login with OTP verification
      const response: any = await apiService.loginVerifyOTP(formData.email.trim(), formData.userType, cleanOtp);
      
      console.log('🔐 Login response:', response); // Debug log
      
      // The response structure is { success: true, message: "...", data: { user: {...}, token: "..." } }
      const { user, token } = response.data || response;
      
      console.log('👤 User data:', user); // Debug log
      console.log('🔑 Token:', token ? 'Present' : 'Missing'); // Debug log
      
      if (token && user) {
        // Store the token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Login the user using AuthContext
        login(user, token);
        
        setSuccess('Login successful! Redirecting to your dashboard...');
        
        // Redirect immediately to appropriate dashboard based on user type
        const redirectPath = user.userType === 'student' ? '/student-home' 
                           : user.userType === 'employer' ? '/employer-home'
                           : user.userType === 'admin' ? '/admin-home'
                           : '/';
        
        console.log('🚀 Redirecting to:', redirectPath); // Debug log
        
        // Use router.push immediately instead of setTimeout
        router.push(redirectPath);
      } else {
        console.error('❌ Missing user or token in response:', { user, token }); // Debug log
        setError('Invalid response from server. Please try again.');
      }
    } catch (error: any) {
      setError(apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.loginRequestOTP(formData.email, formData.userType);
      setSuccess('OTP resent to your email address!');
      setResendTimer(30);
      setCanResend(false);
    } catch (error: any) {
      setError(apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setFormData(prev => ({ ...prev, otp: '' }));
    setError('');
    setSuccess('');
    setResendTimer(0);
    setCanResend(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 'email' && (
            <>
              <form className="space-y-6" onSubmit={handleRequestOTP}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
                    I am a:
                  </label>
                  <div className="mt-1">
                    <select
                      id="userType"
                      name="userType"
                      value={formData.userType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="student">Student</option>
                      <option value="employer">Employer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Verify your email</h3>
                <p className="text-sm text-gray-600 mt-1">
                  We sent a verification code to <strong>{formData.email}</strong>
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleVerifyOTP}>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      autoComplete="one-time-code"
                      required
                      value={formData.otp}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-lg tracking-widest"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
                    {success}
                  </div>
                )}

                <div className="flex flex-col space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={!canResend || loading}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {canResend ? 'Resend OTP' : `Resend OTP in ${resendTimer}s`}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back to Email
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/signup"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
