'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

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

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        console.log('🔒 User not authenticated, redirecting to login');
        router.push(fallbackPath);
        return;
      }

      if (requiredUserType && user?.userType !== requiredUserType) {
        console.log(`🔒 User type ${user?.userType} does not match required type ${requiredUserType}`);
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, user, loading, requiredUserType, router, fallbackPath]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated || (requiredUserType && user?.userType !== requiredUserType)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
