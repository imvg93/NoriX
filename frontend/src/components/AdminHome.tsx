"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Users, 
  Building, 
  BookOpen, 
  Activity, 
  AlertTriangle, 
  Plus, 
  Eye,
  TrendingUp,
  Clock,
  ArrowLeft,
  LogOut,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  User,
  CreditCard,
  FileCheck,
  Download
} from 'lucide-react';
import StatsCard from './StatsCard';
import NotificationCard from './NotificationCard';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface Activity {
  id: number;
  action: string;
  user: string;
  time: string;
  type: string;
}

interface SystemAlert {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
}

interface KYCSubmission {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    userType: string;
  };
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  college: string;
  courseYear: string;
  stayType: string;
  pgDetails?: {
    name: string;
    address: string;
    contact: string;
  };
  hoursPerWeek: number;
  availableDays: string[];
  emergencyContact: {
    name: string;
    phone: string;
  };
  bloodGroup: string;
  preferredJobTypes: string[];
  experienceSkills: string;
  payroll: {
    consent: boolean;
    bankAccount: string;
    ifsc: string;
    beneficiaryName: string;
  };
  verificationStatus: 'pending' | 'in-review' | 'approved' | 'rejected';
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  aadharCard?: string;
  collegeIdCard?: string;
}

interface AdminHomeProps {
  user: any;
}

const AdminHome: React.FC<AdminHomeProps> = ({ user }) => {
  const router = useRouter();
  const { logout } = useAuth();
  const [data, setData] = useState({
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      kycApproved: 0,
      kycPending: 0
    },
    recentActivity: [] as Activity[],
    systemAlerts: [] as SystemAlert[]
  });
  const [loading, setLoading] = useState(true);
  
  // KYC Management State
  const [kycSubmissions, setKycSubmissions] = useState<KYCSubmission[]>([]);
  const [kycStats, setKycStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [kycLoading, setKycLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalReason, setApprovalReason] = useState('');
  const [approvalItemId, setApprovalItemId] = useState('');
  const [systemPerformance, setSystemPerformance] = useState<{ cpuUsage: number | null; memoryUsage: number | null }>({ cpuUsage: null, memoryUsage: null });

  // Fetch KYC data
  const fetchKYCData = async () => {
    try {
      setKycLoading(true);
      const [kycResponse, kycStatsResponse] = await Promise.all([
        apiService.getKYCSubmissions('all', 1, 50),
        apiService.getKYCStats()
      ]);
      
      const kycSubmissions = (kycResponse as any).data?.kycSubmissions || (kycResponse as any).kycSubmissions || [];
      const kycStats = (kycStatsResponse as any).data || kycStatsResponse;
      
      setKycSubmissions(kycSubmissions);
      setKycStats(kycStats);
    } catch (error) {
      console.error('Error fetching KYC data:', error);
    } finally {
      setKycLoading(false);
    }
  };

  // KYC Management Functions
  const handleKYCApproval = async (kycId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      if (action === 'approve') {
        await apiService.approveKYC(kycId);
      } else {
        await apiService.rejectKYC(kycId, reason || '');
      }
      
      // Refresh KYC data
      fetchKYCData();
      setShowApprovalModal(false);
    } catch (error) {
      console.error('Error handling KYC approval:', error);
    }
  };

  const openKYCModal = async (kycId: string) => {
    try {
      const response = await apiService.getKYCSubmissionDetails(kycId) as any;
      setSelectedKYC(response.data?.kyc || response.kyc);
      setShowKYCModal(true);
    } catch (error) {
      console.error('Error fetching KYC details:', error);
    }
  };

  const openApprovalModal = (kycId: string, action: 'approve' | 'reject') => {
    setApprovalItemId(kycId);
    setApprovalAction(action);
    setApprovalReason('');
    setShowApprovalModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in-review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'in-review': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Filter KYC submissions
  const filteredKYCSubmissions = kycSubmissions.filter(kyc => {
    const matchesSearch = kyc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kyc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kyc.college.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || kyc.verificationStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // Fetch real admin statistics
        const statsResponse = await apiService.getAdminStats() as any;
        const stats = statsResponse.data || statsResponse;
        
        const usersTotal = (stats.users?.total ?? ((stats.users?.students || 0) + (stats.users?.employers || 0) + (stats.users?.admins || 0))) || 0;
        const usersActive = (stats.users?.active ?? stats.users?.activeUsers) || 0;
        const kycApproved = (stats.kyc?.approved) || 0;
        const kycPending = (stats.kyc?.pending) || 0;

        const cpuUsage: number | null = (stats.performance?.cpuUsage ?? stats.performance?.cpu?.usage ?? stats.system?.cpuUsage) ?? null;
        const memoryUsage: number | null = (stats.performance?.memoryUsage ?? stats.performance?.memory?.usage ?? stats.system?.memoryUsage) ?? null;

        setSystemPerformance({ cpuUsage, memoryUsage });

        setData({
          stats: {
            totalUsers: usersTotal,
            activeUsers: usersActive,
            kycApproved: kycApproved,
            kycPending: kycPending
          },
          recentActivity: [], // TODO: Implement recent activity API
          systemAlerts: [
            {
              id: 1,
              title: 'KYC Pending',
              message: `${kycPending} submissions waiting for review`,
              type: kycPending > 0 ? 'warning' : 'success',
              timestamp: 'Just now',
              isRead: false
            },
            {
              id: 2,
              title: 'KYC Approved',
              message: `${kycApproved} submissions approved`,
              type: 'success',
              timestamp: 'Just now',
              isRead: false
            }
          ]
        });
        
      } catch (error) {
        console.error('Error fetching admin data:', error);
        // Keep default data on error
        setSystemPerformance({ cpuUsage: null, memoryUsage: null });
        setData({
          stats: {
            totalUsers: 0,
            activeUsers: 0,
            kycApproved: 0,
            kycPending: 0
          },
          recentActivity: [],
          systemAlerts: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
    fetchKYCData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchAdminData();
      fetchKYCData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    { name: 'Manage Students', icon: Users, href: '/admin?tab=students', color: 'blue' },
    { name: 'Manage Employers', icon: Building, href: '/admin?tab=employers', color: 'green' },
    { name: 'Manage Jobs', icon: BookOpen, href: '/admin?tab=jobs', color: 'purple' },
    { name: 'View Reports', icon: Eye, href: '/admin/reports', color: 'orange' }
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 space-y-4 sm:space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 gap-3 sticky top-0 z-20">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link 
            href="/home" 
            className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
          >
            <Shield className="w-4 h-4" />
            Home
          </Link>
          <Link 
            href="/admin-dashboard" 
            className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            KYC Dashboard
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
          <div className="text-left sm:text-right">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">{user?.name || user?.email || 'Admin'} Dashboard</h2>
            <p className="text-xs sm:text-sm text-gray-600">System Management & Analytics</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-4 sm:p-6 text-white"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-white/20 rounded-full">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">Welcome back, {user?.name || user?.email || 'Admin'}!</h1>
            <p className="text-green-100 text-xs sm:text-sm">Here's your system overview and recent activities</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards - wired to real admin stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={(data.stats.totalUsers || 0).toLocaleString()}
          icon={Users}
          color="blue"
          change="Platform total"
          changeType="positive"
        />
        <StatsCard
          title="Active Users"
          value={(data.stats.activeUsers || 0).toLocaleString()}
          icon={Activity}
          color="green"
          change="Currently active"
          changeType="positive"
        />
        <StatsCard
          title="KYC Approved"
          value={(data.stats.kycApproved || 0).toLocaleString()}
          icon={CheckCircle}
          color="purple"
          change="Verified"
          changeType="positive"
        />
        <StatsCard
          title="KYC Pending"
          value={(data.stats.kycPending || 0).toLocaleString()}
          icon={Clock}
          color="orange"
          change="Needs review"
          changeType="negative"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {data.recentActivity.map((activity: Activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600">by {activity.user}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Alerts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
          </div>
          <div className="space-y-3">
            {data.systemAlerts.map((alert: SystemAlert) => (
              <NotificationCard
                key={alert.id}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                timestamp={alert.timestamp}
                isRead={alert.isRead}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-green-50 hover:border-green-200 border border-transparent transition-all duration-200 group"
            >
              <div className={`p-3 bg-${action.color}-100 rounded-full group-hover:bg-${action.color}-200 transition-colors`}>
                <action.icon className={`w-6 h-6 text-${action.color}-600`} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-green-700 text-center">
                {action.name}
              </span>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Performance Overview - uses CPU/Memory from /api/admin/stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">System Performance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{systemPerformance.cpuUsage ?? '—'}%</div>
            <div className="text-sm text-blue-600">CPU Usage</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{systemPerformance.memoryUsage ?? '—'}%</div>
            <div className="text-sm text-green-600">Memory Usage</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{(data.stats.activeUsers || 0).toLocaleString()}</div>
            <div className="text-sm text-purple-600">Active Users</div>
          </div>
        </div>
      </motion.div>

      {/* KYC Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">KYC Verification Management</h2>
              <p className="text-sm text-gray-600">Review and approve student KYC submissions</p>
            </div>
          </div>
          <button 
            onClick={fetchKYCData}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs sm:text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* KYC Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-600">Total KYC</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">{kycStats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-yellow-600">Pending Review</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-700">{kycStats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-600">Approved</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{kycStats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-red-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-red-600">Rejected</p>
                <p className="text-xl sm:text-2xl font-bold text-red-700">{kycStats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search KYC submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* KYC Submissions */}
        {kycLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <>
            {/* Mobile: Card list */}
            <div className="sm:hidden space-y-3">
              {filteredKYCSubmissions.map((kyc) => (
                <div key={kyc._id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{kyc.fullName}</div>
                      <div className="text-xs text-gray-500">{kyc.email}</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(kyc.verificationStatus)}`}>
                      {getStatusIcon(kyc.verificationStatus)}
                      <span className="ml-1 capitalize">{kyc.verificationStatus}</span>
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-700">{kyc.college}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {kyc.aadharCard && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[11px] rounded-full">Aadhaar</span>
                    )}
                    {kyc.collegeIdCard && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] rounded-full">College ID</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{new Date(kyc.submittedAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openKYCModal(kyc._id)} className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100">View</button>
                      {(kyc.verificationStatus === 'pending' || kyc.verificationStatus === 'in-review') && (
                        <>
                          <button onClick={() => openApprovalModal(kyc._id, 'approve')} className="px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700">Approve</button>
                          <button onClick={() => openApprovalModal(kyc._id, 'reject')} className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded hover:bg-red-200">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet/Desktop: Table */}
            <div className="hidden sm:block overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">College</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKYCSubmissions.map((kyc) => (
                  <motion.tr 
                    key={kyc._id}
                    className="hover:bg-gray-50"
                    whileHover={{ backgroundColor: '#f9fafb' }}
                  >
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{kyc.fullName}</div>
                        <div className="text-xs text-gray-500">{kyc.email}</div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900">{kyc.college}</td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {kyc.aadharCard && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[11px] rounded-full">Aadhaar</span>
                        )}
                        {kyc.collegeIdCard && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] rounded-full">College ID</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(kyc.verificationStatus)}`}>
                        {getStatusIcon(kyc.verificationStatus)}
                        <span className="ml-1 capitalize">{kyc.verificationStatus}</span>
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(kyc.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openKYCModal(kyc._id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(kyc.verificationStatus === 'pending' || kyc.verificationStatus === 'in-review') && (
                          <>
                            <button
                              onClick={() => openApprovalModal(kyc._id, 'approve')}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openApprovalModal(kyc._id, 'reject')}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {filteredKYCSubmissions.length === 0 && !kycLoading && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No KYC submissions found</p>
          </div>
        )}
      </motion.div>

      {/* Temporary Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <a 
            href="/admin" 
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Shield className="w-4 h-4 mr-2" />
            Dashboard
          </a>
          <a 
            href="/admin-dashboard" 
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4 mr-2" />
            KYC Dashboard
          </a>
          <a 
            href="/admin/users" 
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Users
          </a>
          <a 
            href="/admin/courses" 
            className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Manage Courses
          </a>
          <a 
            href="/admin/reports" 
            className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Reports
          </a>
        </div>
      </motion.div>

      {/* Comprehensive KYC Details Modal */}
      <AnimatePresence>
        {showKYCModal && selectedKYC && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Complete KYC Details</h3>
                      <p className="text-sm text-gray-600">{selectedKYC.fullName} - {selectedKYC.college}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowKYCModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <h4 className="text-lg font-medium text-gray-900">Personal Information</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Full Name</label>
                          <p className="text-sm text-gray-900 font-medium">{selectedKYC.fullName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                          <p className="text-sm text-gray-900">{new Date(selectedKYC.dob).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Gender</label>
                          <p className="text-sm text-gray-900">{selectedKYC.gender}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Blood Group</label>
                          <p className="text-sm text-gray-900">{selectedKYC.bloodGroup}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Phone className="w-5 h-5 text-green-600" />
                      <h4 className="text-lg font-medium text-gray-900">Contact Information</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedKYC.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedKYC.phone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-900">{selectedKYC.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                      <h4 className="text-lg font-medium text-gray-900">Academic Information</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedKYC.college}</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Course Year</label>
                        <p className="text-sm text-gray-900">{selectedKYC.courseYear}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Stay Type</label>
                        <p className="text-sm text-gray-900">{selectedKYC.stayType}</p>
                      </div>
                      {selectedKYC.pgDetails && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <h5 className="text-sm font-medium text-blue-800 mb-2">PG Details</h5>
                          <div className="space-y-1 text-xs text-blue-700">
                            <p><strong>Name:</strong> {selectedKYC.pgDetails.name}</p>
                            <p><strong>Address:</strong> {selectedKYC.pgDetails.address}</p>
                            <p><strong>Contact:</strong> {selectedKYC.pgDetails.contact}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Work Preferences */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <h4 className="text-lg font-medium text-gray-900">Work Preferences</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Hours per Week</label>
                        <p className="text-sm text-gray-900">{selectedKYC.hoursPerWeek} hours</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Available Days</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedKYC.availableDays.map((day, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Preferred Job Types</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedKYC.preferredJobTypes.map((type, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Experience & Skills</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedKYC.experienceSkills}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Phone className="w-5 h-5 text-red-600" />
                      <h4 className="text-lg font-medium text-gray-900">Emergency Contact</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-sm text-gray-900">{selectedKYC.emergencyContact.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-sm text-gray-900">{selectedKYC.emergencyContact.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payroll Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-lg font-medium text-gray-900">Payroll Information</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedKYC.payroll.consent} readOnly className="rounded" />
                        <span className="text-sm text-gray-900">Payroll Consent Given</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Bank Account</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedKYC.payroll.bankAccount}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">IFSC Code</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedKYC.payroll.ifsc}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Beneficiary Name</label>
                        <p className="text-sm text-gray-900">{selectedKYC.payroll.beneficiaryName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileCheck className="w-5 h-5 text-green-600" />
                      <h4 className="text-lg font-medium text-gray-900">Documents</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {selectedKYC.aadharCard && (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-900">Aadhaar Card</span>
                          </div>
                          <a 
                            href={selectedKYC.aadharCard} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                          >
                            <Download className="w-3 h-3" />
                            View
                          </a>
                        </div>
                      )}
                      {selectedKYC.collegeIdCard && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-900">College ID Card</span>
                          </div>
                          <a 
                            href={selectedKYC.collegeIdCard} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                          >
                            <Download className="w-3 h-3" />
                            View
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {(selectedKYC.verificationStatus === 'pending' || selectedKYC.verificationStatus === 'in-review') && (
                  <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
                    <button
                      onClick={() => {
                        setShowKYCModal(false);
                        openApprovalModal(selectedKYC._id, 'reject');
                      }}
                      className="px-6 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors font-medium"
                    >
                      Reject KYC
                    </button>
                    <button
                      onClick={() => {
                        setShowKYCModal(false);
                        openApprovalModal(selectedKYC._id, 'approve');
                      }}
                      className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Approve KYC
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approval Modal */}
      <AnimatePresence>
        {showApprovalModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {approvalAction === 'approve' ? 'Approve' : 'Reject'} KYC Submission
                </h3>
                
                {approvalAction === 'reject' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for rejection
                    </label>
                    <textarea
                      value={approvalReason}
                      onChange={(e) => setApprovalReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter reason for rejection..."
                    />
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleKYCApproval(approvalItemId, approvalAction, approvalReason);
                    }}
                    className={`px-4 py-2 text-white rounded-lg transition-colors ${
                      approvalAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminHome;