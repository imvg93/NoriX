'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';
import EmployerTypeBanner from '../../../components/employer/EmployerTypeBanner';
import EmployerDashboardContent from '../../../components/employer/EmployerDashboardContent';

export default function IndividualEmployerPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [checkingKYC, setCheckingKYC] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.userType !== 'employer') {
      router.push('/');
      return;
    }
    
    // If no category, redirect to type selection
    if (!user.employerCategory) {
      router.push('/employer/select-role');
      return;
    }
    
    // If wrong category, redirect to correct type page
    if (user.employerCategory !== 'individual') {
      if (user.employerCategory === 'corporate') {
        router.push('/employer/corporate');
      } else if (user.employerCategory === 'local_business') {
        router.push('/employer/local');
      } else {
        router.push('/employer/select-role');
      }
      return;
    }

    // Check KYC status - update context but don't redirect (show home page with banner)
    const checkKYCStatus = async () => {
      try {
        const employerId = user._id as string;
        const res = await apiService.getEmployerKYCStatus(employerId);
        const kycStatus = res?.status || res?.user?.kycStatus || user.kycStatus || 'not-submitted';
        const normalizedStatus = kycStatus.replace(/_/g, '-').toLowerCase();
        
        // Update user context with latest KYC status
        if (user.kycStatus !== normalizedStatus) {
          updateUser({ kycStatus: normalizedStatus as any });
        }
      } catch (error) {
        console.error('Error checking KYC status:', error);
        // If error, still allow access
      } finally {
        setCheckingKYC(false);
      }
    };

    checkKYCStatus();
  }, [user, router, updateUser]);

  if (checkingKYC || !user || user.userType !== 'employer' || user.employerCategory !== 'individual') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <EmployerTypeBanner 
          employerType="individual" 
          kycStatus={user.kycStatus as any}
        />
        <EmployerDashboardContent 
          employerType="individual"
          kycStatus={user.kycStatus as any}
        />
      </div>
    </div>
  );
}


