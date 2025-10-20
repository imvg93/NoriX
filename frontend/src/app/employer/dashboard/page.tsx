"use client";

import EmployerHome from '../../../components/EmployerHome';
import { useAuth } from '../../../contexts/AuthContext';
import RoleProtectedRoute from '../../../components/auth/RoleProtectedRoute';

export default function EmployerDashboardPage() {
  const { user } = useAuth();

  return (
    <RoleProtectedRoute allowedRoles={['employer']}>
      <EmployerHome user={user} />
    </RoleProtectedRoute>
  );
}
