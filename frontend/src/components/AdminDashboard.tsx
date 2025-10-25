'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Bell,
  Settings,
  Search,
  Filter,
  X,
  CheckCircle,
  XCircle,
  PauseCircle,
  Eye,
  Send,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building,
  GraduationCap,
  TrendingUp,
  Activity,
  AlertCircle,
  FileIcon,
  Image as ImageIcon,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  userType: 'student' | 'employer' | 'admin';
  status?: 'pending' | 'approved' | 'suspended' | 'rejected';
  kycStatus?: 'not-submitted' | 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  createdAt: string;
  college?: string;
  companyName?: string;
  skills?: string[];
}

interface Job {
  _id: string;
  jobTitle: string;
  description: string;
  companyName: string;
  location: string;
  status: string;
  approvalStatus: string;
  createdAt: string;
}

interface KYC {
  _id: string;
  userId: any;
  fullName: string;
  email: string;
  phone: string;
  college: string;
  verificationStatus: string;
  aadharCard?: string;
  collegeIdCard?: string;
  submittedAt: string;
}

type Section = 'overview' | 'students' | 'employers' | 'jobs' | 'kyc' | 'notifications' | 'settings';

export default function AdminDashboard() {
  const [section, setSection] = useState<Section>('overview');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [kycRecords, setKycRecords] = useState<KYC[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalEmployers: 0,
    totalJobs: 0,
    pendingApprovals: 0,
    activeUsers: 0,
  });

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'student' | 'employer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'suspended' | 'rejected'>('all');
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedKYC, setSelectedKYC] = useState<KYC | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  
  // Notification modal
  const [notificationData, setNotificationData] = useState({
    userIds: [] as string[],
    title: '',
    message: '',
    userType: 'all' as 'all' | 'student' | 'employer',
  });

  // Fetch comprehensive data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refetch when section changes
  useEffect(() => {
    if (section === 'students' || section === 'employers') {
      fetchUsers();
    } else if (section === 'jobs') {
      fetchJobs();
    } else if (section === 'kyc') {
      fetchKYC();
    }
  }, [section]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const response = await apiService.getDashboardSummary() as any;
      const data = response.data;
      
      setStats({
        totalUsers: data.users?.total || 0,
        totalStudents: data.users?.students || 0,
        totalEmployers: data.users?.employers || 0,
        totalJobs: data.jobs?.total || 0,
        pendingApprovals: data.overview?.pendingApprovals || 0,
        activeUsers: data.users?.active || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      setLoading(true);
      const response = await apiService.getAllUsersAdmin({
        page: 1,
        limit: 100,
        userType: section === 'students' ? 'student' : section === 'employers' ? 'employer' : 'all',
        status: 'all',
      }) as any;
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchJobs() {
    try {
      setLoading(true);
      const response = await apiService.getAllJobsAdmin({
        page: 1,
        limit: 100,
        status: 'all',
        approvalStatus: 'all',
      }) as any;
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchKYC() {
    try {
      setLoading(true);
      const response = await apiService.getAllKYCAdmin({
        page: 1,
        limit: 100,
        status: 'all',
        type: 'student',
      }) as any;
      setKycRecords(response.data.kyc || []);
    } catch (error) {
      console.error('Error fetching KYC:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesUserType = userTypeFilter === 'all' || user.userType === userTypeFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesUserType && matchesStatus;
    });
  }, [users, searchTerm, userTypeFilter, statusFilter]);

  // User action handlers
  async function handleApproveUser(userId: string) {
    try {
      setActionLoading(`approve-${userId}`);
      await apiService.approveUser(userId);
      await fetchUsers();
      await fetchDashboardData();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectUser(userId: string) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      setActionLoading(`reject-${userId}`);
      await apiService.rejectUser(userId, reason);
      await fetchUsers();
      await fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSuspendUser(userId: string) {
    try {
      setActionLoading(`suspend-${userId}`);
      await apiService.suspendUser(userId);
      await fetchUsers();
      await fetchDashboardData();
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleActivateUser(userId: string) {
    try {
      setActionLoading(`activate-${userId}`);
      await apiService.activateUser(userId);
      await fetchUsers();
      await fetchDashboardData();
    } catch (error) {
      console.error('Error activating user:', error);
      alert('Failed to activate user');
    } finally {
      setActionLoading(null);
    }
  }

  // Notification sending
  async function handleSendNotification() {
    try {
      setActionLoading('send-notification');
      
      if (notificationData.userIds.length > 0) {
        // Send to specific users
        await (apiService as any).request('/notifications/admin/send', {
          method: 'POST',
          body: JSON.stringify({
            userIds: notificationData.userIds,
            title: notificationData.title,
            message: notificationData.message,
            type: 'announcement',
          }),
        });
      } else {
        // Broadcast to all users of selected type
        await (apiService as any).request('/notifications/admin/broadcast', {
          method: 'POST',
          body: JSON.stringify({
            userType: notificationData.userType,
            title: notificationData.title,
            message: notificationData.message,
            type: 'announcement',
          }),
        });
      }
      
      alert('Notification sent successfully!');
      setShowNotificationModal(false);
      setNotificationData({ userIds: [], title: '', message: '', userType: 'all' });
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setActionLoading(null);
    }
  }

  // Render functions will be continued...
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <button
              onClick={() => setShowNotificationModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Bell className="w-5 h-5" />
              Send Notification
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm p-4 space-y-2">
              {[
                { key: 'overview', label: 'Overview', icon: LayoutDashboard },
                { key: 'students', label: 'Students', icon: Users },
                { key: 'employers', label: 'Employers', icon: Building },
                { key: 'jobs', label: 'Jobs', icon: Briefcase },
                { key: 'kyc', label: 'KYC Management', icon: FileText },
                { key: 'notifications', label: 'Notifications', icon: Bell },
                { key: 'settings', label: 'Settings', icon: Settings },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSection(item.key as Section)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    section === item.key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {loading && !actionLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <>
                {section === 'overview' && renderOverview()}
                {section === 'students' && renderUsers('student')}
                {section === 'employers' && renderUsers('employer')}
                {section === 'jobs' && renderJobs()}
                {section === 'kyc' && renderKYC()}
                {section === 'notifications' && renderNotifications()}
                {section === 'settings' && renderSettings()}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      {showUserModal && selectedUser && renderUserModal()}
      {showKYCModal && selectedKYC && renderKYCModal()}
      {showNotificationModal && renderNotificationModal()}
    </div>
  );

  // Placeholder for render functions - will be added next
  function renderOverview() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            color="blue"
          />
          <StatCard
            icon={GraduationCap}
            label="Students"
            value={stats.totalStudents}
            color="green"
          />
          <StatCard
            icon={Building}
            label="Employers"
            value={stats.totalEmployers}
            color="purple"
          />
          <StatCard
            icon={Briefcase}
            label="Total Jobs"
            value={stats.totalJobs}
            color="orange"
          />
          <StatCard
            icon={Activity}
            label="Active Users"
            value={stats.activeUsers}
            color="teal"
          />
          <StatCard
            icon={AlertCircle}
            label="Pending Approvals"
            value={stats.pendingApprovals}
            color="red"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setSection('students')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium text-gray-700">Manage Students</p>
            </button>
            <button
              onClick={() => setSection('employers')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <Building className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium text-gray-700">Manage Employers</p>
            </button>
            <button
              onClick={() => setSection('jobs')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium text-gray-700">Review Jobs</p>
            </button>
            <button
              onClick={() => setSection('kyc')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium text-gray-700">KYC Review</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  function StatCard({ icon: Icon, label, value, color }: any) {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      teal: 'bg-teal-100 text-teal-600',
      red: 'bg-red-100 text-red-600',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="w-8 h-8" />
          </div>
        </div>
      </motion.div>
    );
  }

  function renderUsers(type: 'student' | 'employer') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 capitalize">{type}s Management</h2>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{type === 'student' ? user.college : user.companyName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={user.status || 'pending'} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {user.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveUser(user._id)}
                                disabled={actionLoading === `approve-${user._id}`}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                {actionLoading === `approve-${user._id}` ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-5 h-5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleRejectUser(user._id)}
                                disabled={actionLoading === `reject-${user._id}`}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                {actionLoading === `reject-${user._id}` ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <XCircle className="w-5 h-5" />
                                )}
                              </button>
                            </>
                          )}
                          {user.status === 'approved' && (
                            <button
                              onClick={() => handleSuspendUser(user._id)}
                              disabled={actionLoading === `suspend-${user._id}`}
                              className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                            >
                              {actionLoading === `suspend-${user._id}` ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <PauseCircle className="w-5 h-5" />
                              )}
                            </button>
                          )}
                          {(user.status === 'suspended' || user.status === 'rejected') && (
                            <button
                              onClick={() => handleActivateUser(user._id)}
                              disabled={actionLoading === `activate-${user._id}`}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              {actionLoading === `activate-${user._id}` ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <UserCheck className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function StatusBadge({ status }: { status: string }) {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      suspended: { color: 'bg-orange-100 text-orange-800', icon: PauseCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  }

  function renderJobs() {
    return <div className="text-center py-12 text-gray-500">Jobs management - Implementation coming soon</div>;
  }

  function renderKYC() {
    return <div className="text-center py-12 text-gray-500">KYC management - Implementation coming soon</div>;
  }

  function renderNotifications() {
    return <div className="text-center py-12 text-gray-500">Notifications management - Implementation coming soon</div>;
  }

  function renderSettings() {
    return <div className="text-center py-12 text-gray-500">Settings - Implementation coming soon</div>;
  }

  function renderUserModal() {
    if (!selectedUser) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowUserModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <DetailRow label="Name" value={selectedUser.name} />
              <DetailRow label="Email" value={selectedUser.email} />
              <DetailRow label="Phone" value={selectedUser.phone} />
              <DetailRow label="User Type" value={selectedUser.userType} />
              <DetailRow label="Status" value={selectedUser.status || 'pending'} />
              <DetailRow label="KYC Status" value={selectedUser.kycStatus || 'not-submitted'} />
              {selectedUser.college && <DetailRow label="College" value={selectedUser.college} />}
              {selectedUser.companyName && <DetailRow label="Company" value={selectedUser.companyName} />}
              {selectedUser.skills && selectedUser.skills.length > 0 && (
                <DetailRow label="Skills" value={selectedUser.skills.join(', ')} />
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  function renderKYCModal() {
    return <div>KYC Modal - Coming soon</div>;
  }

  function renderNotificationModal() {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNotificationModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Send Notification</h3>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <select
                  value={notificationData.userType}
                  onChange={(e) => setNotificationData({ ...notificationData, userType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Users</option>
                  <option value="student">Students Only</option>
                  <option value="employer">Employers Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Notification title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={notificationData.message}
                  onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your message here..."
                />
              </div>
              <button
                onClick={handleSendNotification}
                disabled={!notificationData.title || !notificationData.message || actionLoading === 'send-notification'}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading === 'send-notification' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  function DetailRow({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex items-start gap-4">
        <span className="text-sm font-medium text-gray-500 w-24">{label}:</span>
        <span className="text-sm text-gray-900 flex-1">{value}</span>
      </div>
    );
  }
}

