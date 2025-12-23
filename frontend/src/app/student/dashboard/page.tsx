"use client";

import StudentDashboard from '../../../components/StudentDashboard';
import { useAuth } from '../../../contexts/AuthContext';
import RoleProtectedRoute from '../../../components/auth/RoleProtectedRoute';

export default function StudentDashboardPage() {
  const { user } = useAuth();

  return (
    <RoleProtectedRoute allowedRoles={['student']}>
      <StudentDashboard user={user} />
    </RoleProtectedRoute>
  );
}
