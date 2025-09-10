"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileVerification } from '../../components/kyc';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { kycStatusService } from '../../services/kycStatusService';

const KYCProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [isKYCCompleted, setIsKYCCompleted] = useState(false);

  useEffect(() => {
    const checkKYCStatus = async () => {
      if (!isAuthenticated || !user) {
        router.push('/login');
        return;
      }

      // Only allow students to access KYC
      if (user.userType !== 'student') {
        router.push('/unauthorized');
        return;
      }

      try {
        const status = await kycStatusService.checkKYCStatus();
        setKycStatus(status.status);
        setIsKYCCompleted(status.isCompleted);
        
        // Remove automatic redirect - let users stay on KYC page if they want
        // if (status.isCompleted) {
        //   router.push('/student-home');
        //   return;
        // }
      } catch (error) {
        console.error('Error checking KYC status:', error);
        // Continue to show KYC form if there's an error
      } finally {
        setIsLoading(false);
      }
    };

    checkKYCStatus();
  }, [isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking KYC status...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['student']}>
      <div>
        {kycStatus && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {kycStatus === 'approved' && 'Your KYC is verified and approved! ✅'}
                  {kycStatus === 'pending' && 'Your KYC is pending review.'}
                  {kycStatus === 'in-review' && 'Your KYC is currently under review.'}
                  {kycStatus === 'rejected' && 'Your KYC was rejected. Please update and resubmit.'}
                  {kycStatus === 'not-submitted' && 'Please complete your KYC verification to continue.'}
                </p>
              </div>
            </div>
          </div>
        )}
        <ProfileVerification isDisabled={isKYCCompleted} />
      </div>
    </ProtectedRoute>
  );
};

export default KYCProfilePage;
