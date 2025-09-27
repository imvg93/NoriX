'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';
import ProtectedRoute from '../../../components/ProtectedRoute';
import {
  Users,
  Building,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar,
  MapPin,
  ShieldCheckIcon,
  FileText,
  ArrowLeft,
  UserPlus,
  Mail,
  Phone,
  Globe,
  Star
} from 'lucide-react';

interface UserStatistics {
  totalUsers: number;
  userTypes: {
    students: number;
    employers: number;
    admins: number;
  };
  status: {
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
    emailVerified: number;
    emailUnverified: number;
  };
  kycStatus: {
    notSubmitted: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  recentActivity: {
    newUsersLast30Days: number;
    recentUserDetails: Array<{
      _id: string;
      name: string;
      email: string;
      userType: string;
      createdAt: string;
      isActive: boolean;
      isVerified: boolean;
      kycStatus: string;
    }>;
  };
  growth: {
    monthlyGrowth: Array<{
      _id: {
        year: number;
        month: number;
      };
      count: number;
      students: number;
      employers: number;
      admins: number;
    }>;
  };
  topCompanies: Array<{
    _id: string;
    userCount: number;
    verifiedCount: number;
  }>;
}

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchUserStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching comprehensive user statistics...');
      
      const response = await apiService.getUserStatistics();
      console.log('📊 User statistics response:', response);
      
      const stats = (response as any)?.data || response;
      console.log('📊 Processed user stats:', stats);
      
      setUserStats(stats);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('❌ Error fetching user statistics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch user statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStatistics();
    
    // Auto-refresh every 5 minutes if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing user statistics...');
        fetchUserStatistics();
      }, 5 * 60 * 1000); // 5 minutes
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }: {
    title: string;
    value: number;
    icon: React.ComponentType<any>;
    color: string;
    subtitle?: string;
    trend?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </motion.div>
  );

  const ProgressBar = ({ label, value, total, color }: {
    label: string;
    value: number;
    total: number;
    color: string;
  }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-600">{value} / {total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full bg-${color}-500`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'student': return GraduationCap;
      case 'employer': return Building;
      case 'admin': return Users;
      default: return Users;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'student': return 'blue';
      case 'employer': return 'green';
      case 'admin': return 'purple';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredUserType="admin">
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading user statistics...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredUserType="admin">
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Reports</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchUserStatistics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredUserType="admin">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Statistics & Reports</h1>
                  <p className="text-gray-600 mt-2">Comprehensive user analytics and system overview</p>
                  {lastUpdated && (
                    <p className="text-sm text-gray-500 mt-1">
                      Last updated: {lastUpdated.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    autoRefresh 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
                </button>
                <button
                  onClick={fetchUserStatistics}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {userStats && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Users"
                  value={userStats.totalUsers}
                  icon={Users}
                  color="blue"
                  subtitle={`${userStats.userTypes.students} students, ${userStats.userTypes.employers} employers`}
                />
                <StatCard
                  title="Active Users"
                  value={userStats.status.active}
                  icon={Activity}
                  color="green"
                  subtitle={`${userStats.status.inactive} inactive`}
                />
                <StatCard
                  title="Verified Users"
                  value={userStats.status.verified}
                  icon={CheckCircle}
                  color="purple"
                  subtitle={`${userStats.status.unverified} unverified`}
                />
                <StatCard
                  title="New Users (30 days)"
                  value={userStats.recentActivity.newUsersLast30Days}
                  icon={UserPlus}
                  color="orange"
                  subtitle="Recent registrations"
                />
              </div>

              {/* Detailed Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* User Type Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <PieChart className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">User Type Distribution</h3>
                  </div>
                  
                  <ProgressBar
                    label="Students"
                    value={userStats.userTypes.students}
                    total={userStats.totalUsers}
                    color="blue"
                  />
                  <ProgressBar
                    label="Employers"
                    value={userStats.userTypes.employers}
                    total={userStats.totalUsers}
                    color="green"
                  />
                  <ProgressBar
                    label="Admins"
                    value={userStats.userTypes.admins}
                    total={userStats.totalUsers}
                    color="purple"
                  />
                </motion.div>

                {/* User Status Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">User Status Overview</h3>
                  </div>
                  
                  <ProgressBar
                    label="Email Verified"
                    value={userStats.status.emailVerified}
                    total={userStats.totalUsers}
                    color="green"
                  />
                  <ProgressBar
                    label="Email Unverified"
                    value={userStats.status.emailUnverified}
                    total={userStats.totalUsers}
                    color="yellow"
                  />
                  <ProgressBar
                    label="Account Verified"
                    value={userStats.status.verified}
                    total={userStats.totalUsers}
                    color="blue"
                  />
                  <ProgressBar
                    label="Account Unverified"
                    value={userStats.status.unverified}
                    total={userStats.totalUsers}
                    color="red"
                  />
                </motion.div>

                {/* KYC Status */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <ShieldCheckIcon className="w-6 h-6 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">KYC Status Distribution</h3>
                  </div>
                  
                  <ProgressBar
                    label="KYC Approved"
                    value={userStats.kycStatus.approved}
                    total={userStats.totalUsers}
                    color="green"
                  />
                  <ProgressBar
                    label="KYC Pending"
                    value={userStats.kycStatus.pending}
                    total={userStats.totalUsers}
                    color="yellow"
                  />
                  <ProgressBar
                    label="KYC Not Submitted"
                    value={userStats.kycStatus.notSubmitted}
                    total={userStats.totalUsers}
                    color="gray"
                  />
                  <ProgressBar
                    label="KYC Rejected"
                    value={userStats.kycStatus.rejected}
                    total={userStats.totalUsers}
                    color="red"
                  />
                </motion.div>

                {/* Top Companies */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Building className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Top Companies</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {userStats.topCompanies.slice(0, 5).map((company, index) => (
                      <div key={company._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-purple-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{company._id}</p>
                            <p className="text-sm text-gray-500">{company.verifiedCount} verified users</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{company.userCount}</p>
                          <p className="text-xs text-gray-500">users</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Recent Users Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Recent User Registrations</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">KYC</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {userStats.recentActivity.recentUserDetails.map((user) => {
                        const UserIcon = getUserTypeIcon(user.userType);
                        const userColor = getUserTypeColor(user.userType);
                        
                        return (
                          <tr key={user._id} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-${userColor}-100`}>
                                  <UserIcon className={`w-4 h-4 text-${userColor}-600`} />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{user.name}</p>
                                  <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${userColor}-100 text-${userColor}-800`}>
                                {user.userType}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {user.isActive ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-sm text-gray-600">
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                user.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
                                user.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                user.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.kycStatus || 'Not Submitted'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(user.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Summary Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Summary Overview</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Active</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Verified</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">KYC Approved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-3 px-4 font-medium text-gray-900">All Users</td>
                        <td className="py-3 px-4 text-gray-600">{userStats.totalUsers}</td>
                        <td className="py-3 px-4 text-green-600">{userStats.status.active}</td>
                        <td className="py-3 px-4 text-blue-600">{userStats.status.verified}</td>
                        <td className="py-3 px-4 text-green-600">{userStats.kycStatus.approved}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-gray-900">Students</td>
                        <td className="py-3 px-4 text-gray-600">{userStats.userTypes.students}</td>
                        <td className="py-3 px-4 text-gray-600">-</td>
                        <td className="py-3 px-4 text-gray-600">-</td>
                        <td className="py-3 px-4 text-gray-600">-</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-gray-900">Employers</td>
                        <td className="py-3 px-4 text-gray-600">{userStats.userTypes.employers}</td>
                        <td className="py-3 px-4 text-gray-600">-</td>
                        <td className="py-3 px-4 text-gray-600">-</td>
                        <td className="py-3 px-4 text-gray-600">-</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-gray-900">Admins</td>
                        <td className="py-3 px-4 text-gray-600">{userStats.userTypes.admins}</td>
                        <td className="py-3 px-4 text-gray-600">-</td>
                        <td className="py-3 px-4 text-gray-600">-</td>
                        <td className="py-3 px-4 text-gray-600">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ReportsPage;