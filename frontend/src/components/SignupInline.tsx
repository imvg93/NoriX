'use client';

import React, { useState } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type UserType = 'student' | 'employer' | 'admin';

const SignupInline: React.FC = () => {
  const { login } = useAuth();

  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [userType, setUserType] = useState<UserType>('student');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // student
    college: '',
    availability: 'flexible',
    // employer
    companyName: '',
    businessType: '',
    // otp
    otp: '',
  });

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
        setError('Please fill all required fields');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (userType === 'employer' && (!form.companyName || !form.businessType)) {
        setError('Company name and business type are required for employers');
        return;
      }
      if (userType === 'student' && !form.college) {
        setError('College/University is required for students');
        return;
      }
      setLoading(true);
      await apiService.sendOTP(form.email.trim(), 'signup');
      setSuccess('OTP sent to your email');
      setStep('otp');
    } catch (err: any) {
      setError(apiService.handleError(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        userType,
        otp: form.otp,
      };
      if (userType === 'student') {
        payload.college = form.college;
        payload.skills = '';
        payload.availability = form.availability || 'flexible';
      }
      if (userType === 'employer') {
        payload.companyName = form.companyName;
        payload.businessType = form.businessType;
      }
      const resp: any = await apiService.register(payload);
      const { user, token } = resp.data || resp;
      if (user && token) {
        login(user, token);
        setSuccess('Account created successfully.');
        setStep('success');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(apiService.handleError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 'form' && (
        <form className="space-y-4" onSubmit={sendOTP}>
          <div className="grid grid-cols-3 gap-2">
            {(['student','employer','admin'] as UserType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setUserType(type)}
                className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                  userType === type 
                    ? type === 'admin'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                      : 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {type === 'student' ? '🎓 Student' : type === 'employer' ? '💼 Employer' : '👑 Admin'}
              </button>)
            )}
          </div>

          <input name="name" placeholder="Full name" value={form.name} onChange={onChange}
            className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" required />
          <input name="email" type="email" placeholder="Email address" value={form.email} onChange={onChange}
            className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" required />
          <input name="phone" type="tel" placeholder="Phone number" value={form.phone} onChange={onChange}
            className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" required />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange}
              className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" required />
            <input name="confirmPassword" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={onChange}
              className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" required />
          </div>

          {userType === 'student' && (
            <input name="college" placeholder="College / University" value={form.college} onChange={onChange}
              className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" required />
          )}

          {userType === 'employer' && (
            <>
              <input name="companyName" placeholder="Company name" value={form.companyName} onChange={onChange}
                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" required />
              <select name="businessType" value={form.businessType} onChange={onChange}
                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" required>
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
            </>
          )}

          {error && <div className="text-sm text-red-700 bg-red-50 border-2 border-red-200 rounded-lg p-3">{error}</div>}
          {success && <div className="text-sm text-green-700 bg-green-50 border-2 border-green-200 rounded-lg p-3">{success}</div>}

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Sending OTP…' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form className="space-y-4" onSubmit={verifyAndRegister}>
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              We sent a verification code to <strong className="text-indigo-700">{form.email}</strong>
            </p>
          </div>
          <input name="otp" placeholder="Enter 6-digit OTP" value={form.otp} onChange={onChange}
            className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" required />
          {error && <div className="text-sm text-red-700 bg-red-50 border-2 border-red-200 rounded-lg p-3">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setStep('form'); setError(''); setSuccess(''); }}
              className="rounded-lg border-2 border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
              Edit Details
            </button>
            <button type="submit" disabled={loading}
              className="rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading ? 'Creating…' : 'Verify & Create'}
            </button>
          </div>
        </form>
      )}

      {step === 'success' && (
        <div className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="text-green-700 font-semibold">Account created successfully!</div>
          <div className="text-sm text-gray-600">You can close this dialog or continue.</div>
        </div>
      )}
    </div>
  );
};

export default SignupInline;


