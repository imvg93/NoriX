'use client';

import React, { useState } from 'react';
import { Building2, Store, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { useRouter } from 'next/navigation';
import ChangeTypeModal from './ChangeTypeModal';

type EmployerCategory = 'corporate' | 'local_business' | 'individual';

interface EmployerTypeBannerProps {
  employerType: EmployerCategory;
  kycStatus?: 'not-submitted' | 'pending' | 'approved' | 'rejected' | 'suspended';
}

const typeConfig = {
  corporate: {
    icon: Building2,
    label: 'Corporate Employer',
    color: 'blue',
    bgGradient: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  local_business: {
    icon: Store,
    label: 'Local Business',
    color: 'purple',
    bgGradient: 'from-purple-50 to-purple-100',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-900',
    badgeColor: 'bg-purple-100 text-purple-800'
  },
  individual: {
    icon: User,
    label: 'Individual',
    color: 'green',
    bgGradient: 'from-green-50 to-green-100',
    borderColor: 'border-green-200',
    textColor: 'text-green-900',
    badgeColor: 'bg-green-100 text-green-800'
  }
};

export default function EmployerTypeBanner({ employerType, kycStatus }: EmployerTypeBannerProps) {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changing, setChanging] = useState(false);

  // Check if type change is allowed
  const canChangeType = kycStatus === 'not-submitted' || kycStatus === 'rejected';

  const config = typeConfig[employerType];
  const Icon = config.icon;

  const handleChangeType = async (newType: 'corporate' | 'local' | 'individual') => {
    try {
      setChanging(true);
      const response = await apiService.changeEmployerType(newType) as any;
      
      // Update user context
      const categoryMap: Record<string, EmployerCategory> = {
        'corporate': 'corporate',
        'local': 'local_business',
        'individual': 'individual'
      };
      
      updateUser({ 
        employerCategory: categoryMap[newType],
        kycStatus: 'not-submitted',
        onboardingCompleted: false
      });

      // Redirect to new type's KYC page
      const redirectTo = response?.data?.redirectTo || response?.redirectTo;
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        // Fallback redirect
        const fallbackMap: Record<string, string> = {
          'corporate': '/employer/kyc/corporate',
          'local': '/employer/kyc/local',
          'individual': '/employer/kyc/individual'
        };
        router.push(fallbackMap[newType]);
      }
    } catch (error: any) {
      console.error('Error changing employer type:', error);
      alert(error?.message || 'Failed to change employer type. Please try again.');
    } finally {
      setChanging(false);
      setShowChangeModal(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className={`w-full bg-gradient-to-r ${config.bgGradient} border ${config.borderColor} rounded-xl p-4 sm:p-6 mb-6`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Welcome & Type Badge */}
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-white/80 ${config.textColor}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Welcome, {user.name}!
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.badgeColor}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {employerType === 'corporate' && 'Manage your corporate job postings and applications'}
                {employerType === 'local_business' && 'Find local talent for your business'}
                {employerType === 'individual' && 'Post tasks and find help nearby'}
              </p>
            </div>
          </div>

          {/* Right: Change Type Button (conditional) */}
          {canChangeType && (
            <button
              onClick={() => setShowChangeModal(true)}
              disabled={changing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronDown className="h-4 w-4" />
              Change Type
            </button>
          )}
        </div>
      </div>

      {/* Change Type Modal */}
      {showChangeModal && (
        <ChangeTypeModal
          currentType={employerType}
          onConfirm={handleChangeType}
          onCancel={() => setShowChangeModal(false)}
          changing={changing}
        />
      )}
    </>
  );
}


