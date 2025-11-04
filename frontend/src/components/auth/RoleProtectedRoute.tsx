'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { AuthPreservation } from '../../utils/authPreservation';
import LoadingOverlay from '../LoadingOverlay';
import AccessDeniedModal from '../AccessDeniedModal';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('student' | 'employer' | 'admin')[];
  fallbackPath?: string;
  allowUnauthenticated?: boolean; // New prop to allow public access
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/',
  allowUnauthenticated = false
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('');

  // Memoize allowedRoles to prevent unnecessary re-renders
  const memoizedAllowedRoles = useMemo(() => allowedRoles, [allowedRoles.join(',')]);

  useEffect(() => {
    if (!loading) {
      // If allowing unauthenticated access, don't show access denied
      if (allowUnauthenticated) {
        setShowAccessDenied(false);
        return;
      }

      if (!isAuthenticated) {
        console.log('🔒 User not authenticated');
        setAccessDeniedMessage('You need to be logged in to access this page.');
        setShowAccessDenied(true);
        return;
      }

      if (user && !memoizedAllowedRoles.includes(user.userType)) {
        console.log(`🔒 User type ${user.userType} not allowed. Allowed types: ${memoizedAllowedRoles.join(', ')}`);
        setAccessDeniedMessage(`This page is only accessible to ${memoizedAllowedRoles.join(', ')}. You are currently logged in as a ${user.userType}.`);
        setShowAccessDenied(true);
        return;
      }

      // User is authenticated and has correct role
      setShowAccessDenied(false);
    }
  }, [isAuthenticated, user?._id, user?.userType, loading, memoizedAllowedRoles, allowUnauthenticated]);

  // Track navigation when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      AuthPreservation.trackNavigation(window.location.pathname, user?.userType);
    }
  }, [user?.userType]);

  const handleCloseAccessDenied = () => {
    setShowAccessDenied(false);
    // Navigate back or to fallback path
    router.back();
  };

  // Show loading overlay while checking authentication
  if (loading) {
    return <LoadingOverlay message="Verifying access..." />;
  }

  // If allowing unauthenticated access, show children regardless
  if (allowUnauthenticated) {
    return <>{children}</>;
  }

  // Show access denied modal if user doesn't have access
  if (!isAuthenticated || (user && !allowedRoles.includes(user.userType))) {
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

export default RoleProtectedRoute;
