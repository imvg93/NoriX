"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MultiStepKYCForm } from '../../components/kyc';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { kycStatusService } from '../../services/kycStatusService';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  ArrowLeft,
  Shield,
  RefreshCw,
  Video
} from 'lucide-react';

const KYCProfilePage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    const checkKYCStatus = async () => {
      if (authLoading) {
        return;
      }

      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      if (user.userType !== 'student') {
        setIsLoading(false);
        return;
      }

      try {
        const status = await kycStatusService.forceRefreshKYCStatus();
        const actualStatus = status.status;
        
        console.log('📊 KYC Status from MongoDB:', actualStatus);
        
        setKycStatus(actualStatus);
        
        // If KYC is submitted (pending, approved, or rejected), don't show form
        if (actualStatus === 'pending' || actualStatus === 'approved' || actualStatus === 'rejected' || actualStatus === 'suspended') {
          setShowForm(false);
        } else {
          setShowForm(true);
        }
      } catch (error) {
        console.error('Error checking KYC status:', error);
        setShowForm(true);
        setKycStatus('not_submitted');
      } finally {
        setIsLoading(false);
      }
    };

    checkKYCStatus();
  }, [isAuthenticated, user, authLoading, router]);

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/student/dashboard';
    }
  };

  const handleResubmit = () => {
    setShowForm(true);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Loading...' : 'Checking KYC status...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['student']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header - Only show if not showing form */}
        {!showForm && (
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackNavigation}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                  
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">KYC Verification</h1>
                    <p className="text-sm text-gray-600">Complete your profile verification</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={showForm ? '' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
          {showForm ? (
            <MultiStepKYCForm />
          ) : (
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  {kycStatus === 'approved' && (
                    <>
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Verified Successfully and Approved ✅</h2>
                      <p className="text-gray-600 mb-6 text-lg">
                        Congratulations! Your KYC verification has been approved. You can now access all job opportunities.
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <p className="text-sm text-green-800">
                            <strong>Status:</strong> Approved - Your verification is complete
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => router.push('/student/dashboard')}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Go to Dashboard
                        </button>
                        <button
                          onClick={handleBackNavigation}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          Back to Previous Page
                        </button>
                      </div>
                    </>
                  )}

                  {(kycStatus === 'pending' || kycStatus === 'in-review') && (
                    <>
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                        <Clock className="h-8 w-8 text-yellow-600" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Verification in progress</h2>
                      <p className="text-gray-600 mb-6 text-lg">
                        Your KYC submission is under review. We will update you shortly.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 justify-center">
                          <Clock className="h-5 w-5 text-yellow-600" />
                          <p className="text-sm text-yellow-800">
                            <strong>Status:</strong> Pending Review - Verification usually takes 24–48 hours
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => router.push('/student/dashboard')}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Go to Dashboard
                        </button>
                        <button
                          onClick={handleBackNavigation}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          Back to Previous Page
                        </button>
                      </div>
                    </>
                  )}

                  {kycStatus === 'rejected' && (
                    <>
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <XCircle className="h-8 w-8 text-red-600" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">KYC Rejected – Please Resubmit ❌</h2>
                      <p className="text-gray-600 mb-6">
                        Your KYC submission was rejected. Please review the requirements and resubmit your verification.
                      </p>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <p className="text-sm text-red-800">
                            <strong>Action Required:</strong> Please update your information and resubmit for verification.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={handleResubmit}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <RefreshCw className="w-4 h-4 inline mr-2" />
                          Resubmit KYC
                        </button>
                        <button
                          onClick={handleBackNavigation}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          Back to Previous Page
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default KYCProfilePage;
