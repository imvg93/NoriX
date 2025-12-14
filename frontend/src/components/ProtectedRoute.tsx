'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import LoadingOverlay from './LoadingOverlay';
import AccessDeniedModal from './AccessDeniedModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'student' | 'employer' | 'admin';
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredUserType, 
  fallbackPath = '/login' 
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('');

  useEffect(() => {
    if (!loading) {
      // Check if user is logging out - don't show access denied modal
      if (typeof window !== 'undefined' && sessionStorage.getItem('isLoggingOut') === 'true') {
        setShowAccessDenied(false);
        return;
      }

      if (!isAuthenticated) {
        console.log('🔒 User not authenticated');
        setAccessDeniedMessage('You need to be logged in to access this page.');
        setShowAccessDenied(true);
        return;
      }

      if (requiredUserType && user?.userType !== requiredUserType) {
        console.log(`🔒 User type ${user?.userType} does not match required type ${requiredUserType}`);
        setAccessDeniedMessage(`This page is only accessible to ${requiredUserType}s. You are currently logged in as a ${user?.userType}.`);
        setShowAccessDenied(true);
        return;
      }

      // User has access
      setShowAccessDenied(false);
    }
  }, [isAuthenticated, user, loading, requiredUserType, router, fallbackPath]);

  const handleCloseAccessDenied = () => {
    setShowAccessDenied(false);
    // Navigate back or to home
    router.back();
  };

  // Show loading overlay while checking authentication
  if (loading) {
    return <LoadingOverlay message="Verifying authentication..." />;
  }

  // Show access denied modal if user doesn't have access
  if (!isAuthenticated || (requiredUserType && user?.userType !== requiredUserType)) {
    return (
      <>
        <AccessDeniedModal
          isOpen={showAccessDenied}
          onClose={handleCloseAccessDenied}
          title="Access Denied"
          message={accessDeniedMessage || 'You do not have permission to access this page.'}
        />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Checking access...</p>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
