'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { AuthPreservation } from '../../utils/authPreservation';

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
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading) {
      // If allowing unauthenticated access, don't redirect
      if (allowUnauthenticated) {
        return;
      }

      if (!isAuthenticated) {
        console.log('🔒 User not authenticated, but allowing access or will redirect later');
        setShouldRedirect(true);
        return;
      }

      if (user && !allowedRoles.includes(user.userType)) {
        console.log(`🔒 User type ${user.userType} not allowed. Allowed types: ${allowedRoles.join(', ')}`);
        setShouldRedirect(true);
        return;
      }

      // User is authenticated and has correct role
      setShouldRedirect(false);
    }
  }, [isAuthenticated, user, loading, allowedRoles, allowUnauthenticated]);

  // Track navigation when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      AuthPreservation.trackNavigation(window.location.pathname, user?.userType);
    }
  }, [user?.userType]);

  // Only redirect if we're not in the middle of loading and should redirect
  useEffect(() => {
    if (!loading && shouldRedirect && !allowUnauthenticated) {
      if (!isAuthenticated) {
        // Use enhanced navigation logic to determine if we should redirect to login
        const shouldRedirectToLogin = AuthPreservation.shouldRedirectToLogin();
        
        if (!shouldRedirectToLogin) {
          console.log('🔒 Recent navigation detected, going to home instead of login');
          router.push('/');
        } else {
          console.log('🔒 Redirecting to login');
          router.push('/login');
        }
        return;
      }

      if (user && !allowedRoles.includes(user.userType)) {
        console.log(`🔒 Redirecting to role-based home: ${fallbackPath}`);
        router.push(fallbackPath);
        return;
      }
    }
  }, [loading, shouldRedirect, isAuthenticated, user, allowedRoles, router, fallbackPath, allowUnauthenticated]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If allowing unauthenticated access, show children regardless
  if (allowUnauthenticated) {
    return <>{children}</>;
  }

  // Show nothing while redirecting
  if (!isAuthenticated || (user && !allowedRoles.includes(user.userType))) {
    return null;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
