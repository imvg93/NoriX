'use client';

import React, { useState } from 'react';
import { Building2, Store, User, ChevronDown, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
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
    primaryColor: 'bg-gradient-to-br from-blue-600 to-indigo-700',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  local_business: {
    icon: Store,
    label: 'Local Business',
    primaryColor: 'bg-gradient-to-br from-purple-600 to-pink-600',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  individual: {
    icon: User,
    label: 'Individual',
    primaryColor: 'bg-gradient-to-br from-green-600 to-emerald-700',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    badgeColor: 'bg-green-50 text-green-700 border-green-200'
  }
};

const kycStatusConfig = {
  'approved': {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Verified'
  },
  'pending': {
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Pending Review'
  },
  'rejected': {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Rejected'
  },
  'suspended': {
    icon: AlertCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'Suspended'
  },
  'not-submitted': {
    icon: AlertCircle,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    label: 'Not Verified'
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
  const kycConfig = kycStatusConfig[kycStatus || 'not-submitted'];
  const KycIcon = kycConfig.icon;

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
      {/* Professional Header Card */}
      <div className="relative overflow-hidden bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 mb-4 sm:mb-6">
        {/* Gradient Accent Bar */}
        <div className={`h-0.5 sm:h-1 ${config.primaryColor}`}></div>
        
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            {/* Left Section: User Info */}
            <div className="flex items-start gap-3 sm:gap-4 flex-1">
              {/* Icon */}
              <div className={`${config.iconBg} p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm flex-shrink-0`}>
                <Icon className={`h-5 w-5 sm:h-7 sm:w-7 ${config.iconColor}`} />
              </div>
              
              {/* User Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-1.5 sm:mb-2">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                    Welcome back, {user.name?.split(' ')[0] || 'User'}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold border ${config.badgeColor} self-start sm:self-center`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed mb-2 sm:mb-3">
                  {employerType === 'corporate' && 'Streamline your hiring process and manage talent acquisition efficiently'}
                  {employerType === 'local_business' && 'Connect with local talent and grow your business'}
                  {employerType === 'individual' && 'Find the right help for your tasks and projects'}
                </p>
                
                {/* KYC Status Badge */}
                <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border ${kycConfig.bg} ${kycConfig.border} ${kycConfig.color}`}>
                  <KycIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs font-medium">{kycConfig.label}</span>
                </div>
              </div>
            </div>

            {/* Right Section: Action Button */}
            {canChangeType && (
              <div className="lg:flex-shrink-0">
                <button
                  onClick={() => setShowChangeModal(true)}
                  disabled={changing}
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Change Type
                </button>
              </div>
            )}
          </div>
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


