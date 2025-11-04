"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { kycStatusService } from '../../services/kycStatusService';

interface KYCRedirectProps {
  children: React.ReactNode;
}

export const KYCRedirect: React.FC<KYCRedirectProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkKYCAndRedirect = async () => {
      if (!isAuthenticated || !user || user.userType !== 'student') {
        setIsChecking(false);
        return;
      }

      try {
        const kycStatus = await kycStatusService.checkKYCStatus();
        
        // If KYC is not completed, redirect to KYC form
        if (!kycStatus.isCompleted) {
          router.push('/kyc-profile');
          return;
        }
      } catch (error) {
        console.error('Error checking KYC status:', error);
        // If there's an error, assume KYC is not completed and redirect
        router.push('/kyc-profile');
        return;
      } finally {
        setIsChecking(false);
      }
    };

    checkKYCAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?._id, user?.userType]); // Only depend on stable user properties

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default KYCRedirect;
