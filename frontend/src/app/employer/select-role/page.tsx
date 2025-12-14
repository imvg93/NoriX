'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Store, User, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';
import Image from 'next/image';

type EmployerCategory = 'corporate' | 'local_business' | 'individual';

interface CategoryOption {
  id: EmployerCategory;
  title: string;
  icon: React.ReactNode;
  description: string;
  examples: string[];
  characteristics: string[];
  color: string;
  bgGradient: string;
  borderColor: string;
}

const categories: CategoryOption[] = [
  {
    id: 'corporate',
    title: 'Corporate Employer',
    icon: <Building2 className="h-8 w-8" />,
    description: 'Big & Registered Companies',
    examples: [
      'IT companies',
      'Startups',
      'MNCs',
      'Registered firms (LLP, Pvt Ltd)',
      'Any company hiring full-time/part-time professionally'
    ],
    characteristics: [
      'Requires full company KYC (documents, GST, etc.)',
      'Posts corporate-style jobs',
      'Uses full applicant tracking system',
      'Paid job posting options'
    ],
    color: 'text-blue-700',
    bgGradient: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-300'
  },
  {
    id: 'local_business',
    title: 'Local Business Employer',
    icon: <Store className="h-8 w-8" />,
    description: 'Shops, Small Businesses, Agencies',
    examples: [
      'Salons',
      'Restaurants',
      'Retail shops',
      'Coaching centers',
      'Local agencies',
      'Small offices'
    ],
    characteristics: [
      'Only basic KYC required (business name + address + basic proof)',
      'Posts simple part-time workers, assistants, frontdesk roles',
      'Lightweight posting flow'
    ],
    color: 'text-purple-700',
    bgGradient: 'from-purple-50 to-purple-100',
    borderColor: 'border-purple-300'
  },
  {
    id: 'individual',
    title: 'Individual Employer',
    icon: <User className="h-8 w-8" />,
    description: 'Normal People Posting Tasks',
    examples: [
      'A person who wants dog walking',
      'Someone needing help shifting items',
      'Someone needing a tutor for 1 hour',
      'Someone needing cooking/cleaning help',
      'Anyone posting a personal one-time gig'
    ],
    characteristics: [
      'Aadhaar + selfie verification',
      'Posts local tasks',
      'Tasks auto-expire',
      'Very short posting flow (title → time → budget → location)'
    ],
    color: 'text-green-700',
    bgGradient: 'from-green-50 to-green-100',
    borderColor: 'border-green-300'
  }
];

export default function SelectEmployerRole() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<EmployerCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not an employer or already has category
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.userType !== 'employer') {
      router.push('/');
      return;
    }
    if (user.employerCategory) {
      router.push('/employer');
      return;
    }
  }, [user, router]);

  const handleSelectCategory = async () => {
    if (!selectedCategory) {
      setError('Please select an employer type');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Map category to API format
      const employerTypeMap: Record<EmployerCategory, 'corporate' | 'local' | 'individual'> = {
        'corporate': 'corporate',
        'local_business': 'local',
        'individual': 'individual'
      };

      const employerType = employerTypeMap[selectedCategory];
      
      // Call the new choose-role endpoint
      const response = await apiService.chooseRole('post', employerType) as any;
      
      // Update user context with the category
      updateUser({ employerCategory: selectedCategory, onboardingCompleted: false });
      
      // Extract redirectTo from response (backend wraps it in data)
      const redirectTo = response?.data?.redirectTo || response?.redirectTo;
      
      // Redirect to the KYC page for the selected role
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        // Fallback redirect based on category
        const fallbackMap: Record<EmployerCategory, string> = {
          'corporate': '/employer/kyc/corporate',
          'local_business': '/employer/kyc/local',
          'individual': '/employer/kyc/individual'
        };
        router.push(fallbackMap[selectedCategory]);
      }
    } catch (error: any) {
      console.error('Error selecting employer role:', error);
      setError(error?.message || 'Failed to select employer role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.userType !== 'employer' || user.employerCategory) {
    return null; // Will redirect
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-md">
              <Image src="/img/norixnobg.jpg" alt="NoriX" width={40} height={40} className="h-10 w-10" />
              <span className="text-sm font-semibold tracking-wide text-gray-800">Welcome to NoriX</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Choose Your Employer Type
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Select the category that best describes your business. This helps us customize your experience.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setError('');
                }}
                className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? `${category.borderColor} border-4 bg-white shadow-xl md:scale-105`
                    : 'border-gray-200 bg-white/80 hover:border-gray-300 hover:shadow-lg'
                }`}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className={`absolute -top-3 -right-3 h-8 w-8 rounded-full ${category.bgGradient} border-2 ${category.borderColor} flex items-center justify-center`}>
                    <Check className={`h-5 w-5 ${category.color}`} />
                  </div>
                )}

                {/* Icon */}
                <div className={`mb-4 inline-flex p-3 rounded-lg bg-gradient-to-br ${category.bgGradient} ${category.color}`}>
                  {category.icon}
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {category.description}
                </p>

                {/* Examples */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Includes:</p>
                  <ul className="space-y-1">
                    {category.examples.slice(0, 3).map((example, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                    {category.examples.length > 3 && (
                      <li className="text-xs text-gray-500 italic">
                        + {category.examples.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>

                {/* Characteristics */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Features:</p>
                  <ul className="space-y-1">
                    {category.characteristics.slice(0, 2).map((char, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                        <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{char}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 text-center text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSelectCategory}
            disabled={!selectedCategory || loading}
            className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

