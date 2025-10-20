"use client";

import StudentHome from '../../../components/StudentHome';
import { useAuth } from '../../../contexts/AuthContext';
import RoleProtectedRoute from '../../../components/auth/RoleProtectedRoute';

export default function StudentDashboardPage() {
  const { user } = useAuth();

  return (
    <RoleProtectedRoute allowedRoles={['student']}>
      <StudentHome user={user} />
    </RoleProtectedRoute>
  );
}
