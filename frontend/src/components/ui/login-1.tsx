'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiService } from '../../services/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface Login1Props {
  heading?: string;
  logo: {
    url: string;
    src: string;
    alt: string;
    title?: string;
  };
  buttonText?: string;
  googleText?: string;
  signupText?: string;
  signupUrl?: string;
}

const Login1 = ({
  heading = "Sign in to your account",
  logo = {
    url: "/",
    src: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=60&fit=crop&crop=center",
    alt: "StudentJobs Logo",
    title: "MeWork",
  },
  buttonText = "Send OTP",
  googleText = "Sign up with Google",
  signupText = "Don't have an account?",
  signupUrl = "/signup",
}: Login1Props) => {
  const { login } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [userType, setUserType] = useState<'student' | 'employer' | 'admin'>('student');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  // Validation functions
  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return 'Please enter your email address';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address (e.g., user@example.com)';
    }
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password.trim()) {
      return 'Please enter your password';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  };

  const validateOTP = (otp: string): string => {
    const cleanOtp = otp.replace(/\D/g, '');
    if (!cleanOtp) {
      return 'Please enter the 6-digit OTP';
    }
    if (cleanOtp.length !== 6) {
      return 'OTP must be exactly 6 digits';
    }
    return '';
  };

  const clearFieldErrors = () => {
    setFieldErrors({});
    setError('');
  };
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearFieldErrors();

    // Validate fields
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    if (emailError || passwordError) {
      setFieldErrors({
        email: emailError,
        password: passwordError
      });
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting auto-login for:', formData.email);
      const response: any = await apiService.loginAuto(formData.email.trim(), formData.password);
      
      console.log('🔐 Auto-login response:', response);
      
      const { user, token } = response.data || response;
      
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
        
        console.log('🚀 Redirecting to:', redirectPath);
        
        router.push(redirectPath);
        return;
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error: any) {
      console.error('❌ Auto-login error:', error);
      setError(error.message || 'Login failed. Please try again.');
      setError(apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    setLoading(true);
    clearFieldErrors();

    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setFieldErrors({ email: emailError });
      setLoading(false);
      return;
    }

    try {
      await apiService.loginRequestOTP(formData.email.trim(), userType);

      setStep('otp');
      setSuccess('OTP sent to your email address!');
      setResendTimer(30);
      setCanResend(false);
      localStorage.setItem('tempUserType', userType);
    } catch (error: any) {
      setError(apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearFieldErrors();

    // Validate OTP
    const otpError = validateOTP(formData.otp);
    if (otpError) {
      setFieldErrors({ otp: otpError });
      setLoading(false);
      return;
    }

    try {
      const userType = localStorage.getItem('tempUserType') || 'student';
      const cleanOtp = formData.otp.replace(/\D/g, '');
      
      // Login with OTP verification
      const response: any = await apiService.loginVerifyOTP(formData.email.trim(), userType, cleanOtp);
      
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
      const storedUserType = (localStorage.getItem('tempUserType') as 'student' | 'employer' | 'admin') || userType;
      await apiService.loginRequestOTP(formData.email.trim(), storedUserType);
      setSuccess('OTP resent to your email address!');
      setResendTimer(30);
      setCanResend(false);
    } catch (error: any) {
      setError(apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep('login');
    setFormData(prev => ({ ...prev, otp: '' }));
    setError('');
    setSuccess('');
    setResendTimer(0);
    setCanResend(false);
    localStorage.removeItem('tempUserType');
  };

  

  return (
    <section className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="flex h-full items-center justify-center relative z-10 p-4">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 flex w-full max-w-md flex-col items-center gap-y-8 rounded-2xl px-8 py-12 shadow-2xl shadow-green-500/10 transform transition-all duration-500 hover:shadow-3xl hover:shadow-green-500/20 hover:scale-[1.02]">
          <div className="flex flex-col items-center gap-y-4 animate-fade-in-up">
            {/* Logo */}
            <div className="flex items-center gap-1 lg:justify-start transform transition-all duration-300 hover:scale-110">
              <Link href={logo.url} className="group">
                {logo.src ? (
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    title={logo.title}
                    className="h-12 dark:invert transition-all duration-300 group-hover:drop-shadow-lg"
                  />
                ) : (
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg">
                    {logo.title || logo.alt}
                  </div>
                )}
              </Link>
            </div>
            {heading && (
              <h1 className="text-3xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent animate-fade-in-up delay-200">
                {heading}
              </h1>
            )}
          </div>

          {/* Back to Home Button */}
          <div className="w-full animate-fade-in-up delay-300">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-105 group"
            >
              <svg className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>

          

          <div className="flex w-full flex-col gap-8 animate-fade-in-up delay-500">
            {step === 'login' && (
              <form className="flex flex-col gap-6" onSubmit={handlePasswordLogin}>
                <div className="flex flex-col gap-4">
                  <div className="relative group">
                    <Input 
                      type="email" 
                      placeholder="Email" 
                      required 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`transition-all duration-300 focus:scale-105 focus:shadow-lg focus:shadow-green-500/20 border rounded-xl h-12 px-4 ${
                        fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-green-500'
                      }`}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-emerald-500/0 to-teal-500/0 group-focus-within:from-green-500/5 group-focus-within:via-emerald-500/5 group-focus-within:to-teal-500/5 transition-all duration-300 pointer-events-none"></div>
                    {fieldErrors.email && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                  
                  <div className="relative group">
                    <Input 
                      type="password" 
                      placeholder="Password" 
                      required 
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`transition-all duration-300 focus:scale-105 focus:shadow-lg focus:shadow-green-500/20 border rounded-xl h-12 px-4 ${
                        fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-green-500'
                      }`}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-emerald-500/0 to-teal-500/0 group-focus-within:from-green-500/5 group-focus-within:via-emerald-500/5 group-focus-within:to-teal-500/5 transition-all duration-300 pointer-events-none"></div>
                    {fieldErrors.password && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                </div>
                
                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-4 rounded-xl border border-red-200 animate-shake">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                    disabled={loading}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Signing in...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Log In
                        </>
                      )}
                    </span>
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-12 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-700 hover:text-green-700 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/10" 
                    onClick={handleRequestOTP}
                    disabled={loading}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Forgot Password? Use OTP
                    </span>
                  </Button>
                </div>
              </form>
            )}

            {step === 'otp' && (
              <form className="flex flex-col gap-6" onSubmit={handleVerifyOTP}>
                <div className="text-center mb-4 animate-fade-in-up">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Verify your email</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    We sent a verification code to <strong className="text-green-600">{formData.email}</strong>
                  </p>
                </div>

                <div className="relative group">
                  <Input 
                    type="text" 
                    placeholder="Enter 6-digit code" 
                    required 
                    name="otp"
                    value={formData.otp}
                    onChange={handleInputChange}
                    maxLength={6}
                    className={`text-center text-2xl tracking-widest font-mono transition-all duration-300 focus:scale-105 focus:shadow-lg focus:shadow-green-500/20 border rounded-xl h-14 px-4 ${
                      fieldErrors.otp ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-green-500'
                    }`}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-indigo-500/0 group-focus-within:from-blue-500/5 group-focus-within:via-purple-500/5 group-focus-within:to-indigo-500/5 transition-all duration-300 pointer-events-none"></div>
                  {fieldErrors.otp && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <span className="text-red-500">⚠</span>
                      {fieldErrors.otp}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-4 rounded-xl border border-red-200 animate-shake">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-green-600 text-sm text-center bg-green-50 p-4 rounded-xl border border-green-200 animate-fade-in">
                    {success}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                    disabled={loading}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verify & Sign In
                        </>
                      )}
                    </span>
                  </Button>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-12 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-700 hover:text-green-700 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/10" 
                    onClick={handleResendOTP}
                    disabled={!canResend || loading}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {canResend ? 'Resend OTP' : `Resend OTP in ${resendTimer}s`}
                    </span>
                  </Button>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-12 border-2 border-gray-300 hover:border-gray-500 hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-gray-500/10" 
                    onClick={handleBackToLogin}
                    disabled={loading}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Login
                    </span>
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="text-muted-foreground flex justify-center gap-1 text-sm">
            <p>{signupText}</p>
            <Link
              href={signupUrl}
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Login1 };
