"use client";

import React from 'react';
import { motion } from 'framer-motion';
import StudentHome from './StudentHome';
import Link from 'next/link';

interface User {
  name: string;
  userType: 'student' | 'admin' | 'employer';
}

const HomePage: React.FC = () => {
  // Mock user data for now - replace with real auth context later
  const user: User = {
    name: 'John Doe',
    userType: 'student'
  };

  const renderRoleBasedHome = () => {
    switch (user.userType) {
      case 'student':
        return <StudentHome user={user} />;
      case 'admin':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Portal</h2>
            <p className="text-gray-600 mb-4">Open the unified admin dashboard.</p>
            <Link href="/admin/dashboard" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Open Admin Dashboard</Link>
          </div>
        );
      case 'employer':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Employer Portal</h2>
            <p className="text-gray-600 mb-4">Go to your dashboard to manage jobs and applications.</p>
            <Link href="/employer" className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Open Employer Dashboard</Link>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unknown User Role</h2>
            <p className="text-gray-600">Please contact support to resolve this issue.</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {renderRoleBasedHome()}
      </div>
    </motion.div>
  );
};

export default HomePage;
