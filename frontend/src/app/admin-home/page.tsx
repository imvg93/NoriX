'use client';

import AdminHome from '../../components/AdminHome';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function AdminHomePage() {
  return (
    <ProtectedRoute requiredUserType="admin">
      <AdminHome />
    </ProtectedRoute>
  );
}
