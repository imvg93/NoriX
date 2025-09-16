"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmployerHome from '../../components/EmployerHome';
import { useAuth } from '../../contexts/AuthContext';

export default function EmployerHomePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect if user is not an employer
    if (user && user.userType !== 'employer') {
      if (user.userType === 'student') {
        router.push('/student-home');
      } else if (user.userType === 'admin') {
        router.push('/admin-home');
      } else {
        router.push('/login');
      }
      return;
    }
  }, [isAuthenticated, user, router]);

  // Show loading or redirect if not authenticated
  if (!isAuthenticated || !user || user.userType !== 'employer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <EmployerHome user={user} />;
}
