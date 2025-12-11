"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentKYCForm from '../../components/kyc/StudentKYCForm';
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
  const [isKYCCompleted, setIsKYCCompleted] = useState(false);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    const checkKYCStatus = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // ProtectedRoute will handle redirect if not authenticated
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      // Only allow students to access KYC (ProtectedRoute also checks this)
      if (user.userType !== 'student') {
        setIsLoading(false);
        return;
      }

      try {
        // Force refresh KYC status from MongoDB (bypass cache)
        // This ensures we always get the latest status from the database
        const status = await kycStatusService.forceRefreshKYCStatus();
        const actualStatus = status.status;
        
        console.log('📊 KYC Status from MongoDB:', actualStatus);
        
        // Clear localStorage flag if status is approved (no longer needed)
        if (actualStatus === 'approved') {
          try {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('kycSubmitted');
            }
          } catch {}
        }
        
        setKycStatus(actualStatus);
        setIsKYCCompleted(status.isCompleted);
        
        // If KYC is submitted (pending, approved, or rejected), don't show form
        if (actualStatus === 'pending' || actualStatus === 'approved' || actualStatus === 'rejected' || actualStatus === 'suspended') {
          setShowForm(false);
        } else {
          // Default: show form for not_submitted
          setShowForm(true);
        }
      } catch (error) {
        console.error('Error checking KYC status:', error);
        // On error, default to showing form
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
      window.location.href = '/student-home';
    }
  };

  const handleResubmit = () => {
    setShowForm(true);
  };

  const handleFormSubmitted = () => {
    // After form submission, update status and show pending message
    setKycStatus('pending');
    setShowForm(false);
  };

  // Show loading while auth is loading or KYC status is being fetched
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
        {/* Header */}
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

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showForm ? (
            <StudentKYCForm />
          ) : (
            // Show Status Messages
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
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                          <Video className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-indigo-900 mb-1">
                              Complete Video KYC Verification
                            </p>
                            <p className="text-sm text-indigo-700">
                              Get verified by Video KYC to unlock more opportunities and priority access to premium job listings.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                          href="/verification"
                          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-center flex items-center justify-center gap-2"
                        >
                          <Video className="w-4 h-4" />
                          Get Verified by Video KYC
                        </a>
                        <button
                          onClick={() => router.push('/student-home')}
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
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">KYC Submitted Successfully! ✅</h2>
                      <p className="text-gray-600 mb-6 text-lg">
                        You have submitted your KYC. It's pending review. We will update you shortly.
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 justify-center">
                          <Clock className="h-5 w-5 text-green-600" />
                          <p className="text-sm text-green-800">
                            <strong>Status:</strong> Pending Review - Our team is checking your data
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                          href="/verification"
                          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-center"
                        >
                          Get Verified Now
                        </a>
                        <button
                          onClick={() => router.push('/')}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Go to Home
                        </button>
                        <button
                          onClick={() => router.push('/student/dashboard')}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          Go to Dashboard
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

                  {(kycStatus === 'not_submitted' || kycStatus === 'not-submitted' || !kycStatus) && (
                    <>
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                        <Shield className="h-8 w-8 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Complete Your KYC Verification</h2>
                      <p className="text-gray-600 mb-6">
                        Please complete your KYC verification to access all job opportunities and start applying.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => setShowForm(true)}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Start KYC Verification
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

              {/* Additional Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About KYC Verification</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Secure Process:</strong> Your personal information is encrypted and stored securely.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Quick Verification:</strong> Most verifications are completed within 24-48 hours.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Job Access:</strong> Verified users get priority access to job opportunities.</p>
                  </div>
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
