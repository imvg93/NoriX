"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useCallback } from 'react';
import { AuthPreservation } from '../utils/authPreservation';

export const useSafeNavigation = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const navigateBack = useCallback(() => {
    // Track the back navigation
    if (typeof window !== 'undefined') {
      AuthPreservation.trackNavigation(window.location.pathname, user?.userType);
    }

    // Check if there's history to go back to
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to role-based home if no history
      navigateToRoleBasedHome();
    }
  }, [router, user?.userType]);

  const navigateTo = useCallback((path: string, options?: { replace?: boolean }) => {
    // Track navigation
    if (typeof window !== 'undefined') {
      AuthPreservation.trackNavigation(path, user?.userType);
    }

    // If user is authenticated, navigate normally
    if (isAuthenticated) {
      if (options?.replace) {
        router.replace(path);
      } else {
        router.push(path);
      }
      return;
    }

    // If not authenticated, only allow certain public paths
    const publicPaths = ['/login', '/signup', '/jobs', '/about', '/how-it-works', '/services'];
    if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
      if (options?.replace) {
        router.replace(path);
      } else {
        router.push(path);
      }
    } else {
      // Redirect to login for protected paths
      router.push('/login');
    }
  }, [router, isAuthenticated, user?.userType]);

  const navigateToRoleBasedHome = useCallback(() => {
    if (!isAuthenticated || !user) {
      router.push('/');
      return;
    }

    switch (user.userType) {
      case 'student':
        router.push('/');
        break;
      case 'employer':
        router.push('/');
        break;
      case 'admin':
        router.push('/admin');
        break;
      default:
        router.push('/');
    }
  }, [router, isAuthenticated, user]);

  return {
    navigateBack,
    navigateTo,
    navigateToRoleBasedHome,
    isAuthenticated,
    user
  };
};
