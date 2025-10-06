'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const [userType, setUserType] = useState<'student' | 'employer' | 'admin'>('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: '',
    // Student-specific fields
    college: '',
    skills: '',
    availability: 'flexible', // Default value
    // Employer-specific fields
    companyName: '',
    businessType: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpData, setOtpData] = useState({ email: '', phone: '' });
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');

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

    if (userType === 'student' && !formData.college) {
      setError('Please enter your college/university');
      setLoading(false);
      return;
    }

    if (userType === 'student' && !formData.availability) {
      setError('Please select your availability');
      setLoading(false);
      return;
    }

    if (userType === 'employer' && !formData.companyName) {
      setError('Please enter your company name');
      setLoading(false);
      return;
    }

    if (userType === 'employer' && !formData.businessType) {
      setError('Please select your business type');
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
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        userType,
        otp: formData.otp, // Include the verified OTP
        ...(userType === 'student' && {
          college: formData.college,
          skills: formData.skills,
          availability: formData.availability
        }),
        ...(userType === 'employer' && {
          companyName: formData.companyName,
          businessType: formData.businessType,
          address: formData.address
        })
      };

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
        setSuccess('Account created successfully! Redirecting to your dashboard...');
        
        // Redirect immediately to appropriate dashboard based on user type
        const redirectPath = userType === 'student' ? '/student-home' 
                           : userType === 'employer' ? '/employer-home'
                           : '/';
        
        console.log('🚀 Redirecting to:', redirectPath); // Debug log
        
        // Use router.push immediately instead of setTimeout
        router.push(redirectPath);
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-4">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 'form' && (
            <>
              {/* User Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserType('student')}
                    className={`flex-1 py-2 px-4 border rounded-md text-sm font-medium ${
                      userType === 'student'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    🎓 Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('employer')}
                    className={`flex-1 py-2 px-4 border rounded-md text-sm font-medium ${
                      userType === 'employer'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    💼 Employer
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('admin')}
                    className={`flex-1 py-2 px-4 border rounded-md text-sm font-medium ${
                      userType === 'admin'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    👑 Admin
                  </button>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSendOTP}>
                {/* Common Fields */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
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
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Create a password"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>

                {/* Student-specific fields */}
                {userType === 'student' && (
                  <>
                    <div>
                      <label htmlFor="college" className="block text-sm font-medium text-gray-700">
                        College/University
                      </label>
                      <div className="mt-1">
                        <input
                          id="college"
                          name="college"
                          type="text"
                          required
                          value={formData.college}
                          onChange={handleInputChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Enter your college name"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                        Skills
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="skills"
                          name="skills"
                          rows={3}
                          value={formData.skills}
                          onChange={handleInputChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="List your skills (e.g., Customer Service, Data Entry, Tutoring)"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                        Availability
                      </label>
                      <div className="mt-1">
                        <select
                          id="availability"
                          name="availability"
                          required
                          value={formData.availability}
                          onChange={handleInputChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">Select your availability</option>
                          <option value="weekdays">Weekdays</option>
                          <option value="weekends">Weekends</option>
                          <option value="both">Both (Weekdays & Weekends)</option>
                          <option value="flexible">Flexible</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Employer-specific fields */}
                {userType === 'employer' && (
                  <>
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                        Company Name
                      </label>
                      <div className="mt-1">
                        <input
                          id="companyName"
                          name="companyName"
                          type="text"
                          required
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Enter your company name"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                        Business Type
                      </label>
                      <div className="mt-1">
                        <select
                          id="businessType"
                          name="businessType"
                          required
                          value={formData.businessType}
                          onChange={handleInputChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">Select business type</option>
                          <option value="Cafe & Restaurant">Cafe & Restaurant</option>
                          <option value="Retail Store">Retail Store</option>
                          <option value="Tuition Center">Tuition Center</option>
                          <option value="Events & Entertainment">Events & Entertainment</option>
                          <option value="Delivery Service">Delivery Service</option>
                          <option value="Office & Corporate">Office & Corporate</option>
                          <option value="Tech Company">Tech Company</option>
                          <option value="Creative Agency">Creative Agency</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Business Address
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="address"
                          name="address"
                          rows={3}
                          required
                          value={formData.address}
                          onChange={handleInputChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Enter your business address"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Verify your email
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                We sent a verification code to <strong>{otpData.email}</strong>. Enter it below to complete your registration.
              </p>

              {/* Display entered information for review */}
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Your Details:</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                  {userType === 'student' && formData.college && (
                    <p><strong>College:</strong> {formData.college}</p>
                  )}
                  {userType === 'employer' && formData.companyName && (
                    <p><strong>Company:</strong> {formData.companyName}</p>
                  )}
                </div>
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
                      required
                      value={formData.otp}
                      onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter the 6-digit code"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                        setSuccess('OTP resent to your email!');
                      } catch (error: any) {
                        setError(apiService.handleError(error));
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full flex justify-center py-2 px-4 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    disabled={loading}
                  >
                    Didn't receive code? Resend OTP
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'success' && (
            <>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Welcome, {formData.name}!
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Your account has been created successfully. You're being redirected to your dashboard...
              </p>

              <div className="mt-6">
                <div className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white">
                  Redirecting...
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="mt-6 text-center text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-6 text-center text-sm text-green-600">
              {success}
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
