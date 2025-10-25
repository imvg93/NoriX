'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { apiService } from '../../../services/api';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  Bell,
  Settings,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  Loader2,
  Menu,
  LogOut,
  Shield,
  ChevronDown,
  User,
  Eye,
  X,
  Download,
} from 'lucide-react';

type AdminSection = 'overview' | 'users' | 'jobs' | 'applications' | 'kyc' | 'analytics' | 'notifications' | 'settings';

interface AdminUser {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  userType?: 'student' | 'employer' | 'admin' | string;
  status?: 'active' | 'suspended' | string;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | string;
  createdAt?: string;
}

interface AdminJob {
  _id: string;
  title?: string;
  description?: string;
  company?: string;
  status?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | string;
  createdAt?: string;
  location?: string;
  applicationsCount?: number;
}

export default function AdminDashboardPage(): React.JSX.Element {
  const [section, setSection] = useState<AdminSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  // Loading flags
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Data state
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [kycRecords, setKycRecords] = useState<any[]>([]);
  const [employerKycRecords, setEmployerKycRecords] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    activeEmployers: 0,
  });
  const [comprehensiveData, setComprehensiveData] = useState<any>(null);
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);

  const [announceSubject, setAnnounceSubject] = useState('');
  const [announceMessage, setAnnounceMessage] = useState('');
  const [announceSending, setAnnounceSending] = useState(false);
  const [announceStatus, setAnnounceStatus] = useState<string | null>(null);

  // KYC Modal state
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState<any | null>(null);
  const [selectedKYCType, setSelectedKYCType] = useState<'student' | 'employer'>('student');

  const navItems: Array<{ key: AdminSection; label: string; icon: React.ReactNode }> = useMemo(
    () => [
      { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
      { key: 'jobs', label: 'Jobs', icon: <Briefcase className="w-4 h-4" /> },
      { key: 'applications', label: 'Applications', icon: <User className="w-4 h-4" /> },
      { key: 'kyc', label: 'KYC Records', icon: <Shield className="w-4 h-4" /> },
      { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
      { key: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
      { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ],
    []
  );

  useEffect(() => {
    // Always fetch comprehensive data on mount
    void fetchComprehensiveData();
    
    // Also fetch individual data based on section
    if (section === 'users') {
      void fetchUsers();
    }
    if (section === 'jobs') {
      void fetchJobs();
    }
    if (section === 'applications') {
      void fetchApplications();
    }
    if (section === 'kyc') {
      void fetchKYCData();
    }
    if (section === 'analytics') {
      void fetchApplications();
      void fetchKYCData();
    }
  }, [section]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (adminDropdownOpen && !target.closest('.admin-dropdown')) {
        setAdminDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [adminDropdownOpen]);

  async function fetchOverview(): Promise<void> {
    try {
      setLoadingOverview(true);
      console.log('🔄 Fetching admin overview data...');
      
      // Fetch comprehensive dashboard summary
      const summaryResponse = await apiService.getDashboardSummary().catch((err) => {
        console.error('❌ Error fetching dashboard summary:', err);
        return null;
      });

      if (summaryResponse && typeof summaryResponse === 'object' && 'data' in summaryResponse) {
        const summary = (summaryResponse as any).data;
        console.log('📊 Dashboard summary:', summary);
        
        setDashboardSummary(summary);
        setKpis({
          totalUsers: summary.overview?.totalUsers || 0,
          totalJobs: summary.overview?.totalJobs || 0,
          totalApplications: summary.overview?.totalApplications || 0,
          activeEmployers: summary.overview?.activeEmployers || 0,
        });
      } else {
        // Fallback to individual API calls
        const [adminStats, userStats, jobStats, appStats] = await Promise.all([
          apiService.getAdminStats().catch((err) => {
            console.error('❌ Error fetching admin stats:', err);
            return { activeEmployers: 0 };
          }),
          apiService.getUserStats().catch((err) => {
            console.error('❌ Error fetching user stats:', err);
            return { total: 0, count: 0 };
          }),
          apiService.getJobAnalytics().catch((err) => {
            console.error('❌ Error fetching job analytics:', err);
            return { total: 0, count: 0 };
          }),
          apiService.getApplicationAnalytics().catch((err) => {
            console.error('❌ Error fetching application analytics:', err);
            return { total: 0, count: 0 };
          }),
        ]);

        console.log('📊 Admin stats:', adminStats);
        console.log('📊 User stats:', userStats);
        console.log('📊 Job stats:', jobStats);
        console.log('📊 App stats:', appStats);

        const totalUsers = (userStats as any)?.total || (userStats as any)?.count || (userStats as any)?.users?.length || 0;
        const totalJobs = (jobStats as any)?.total || (jobStats as any)?.count || (jobStats as any)?.jobs?.length || 0;
        const totalApplications = (appStats as any)?.total || (appStats as any)?.count || (appStats as any)?.applications?.length || 0;
        const activeEmployers = (adminStats as any)?.activeEmployers || (adminStats as any)?.employers || 0;

        console.log('📈 Final KPIs:', { totalUsers, totalJobs, totalApplications, activeEmployers });
        setKpis({ totalUsers, totalJobs, totalApplications, activeEmployers });
      }
    } catch (error) {
      console.error('❌ Error in fetchOverview:', error);
    } finally {
      setLoadingOverview(false);
    }
  }

  async function fetchUsers(): Promise<void> {
    try {
      setLoadingUsers(true);
      console.log('🔄 Fetching users data...');
      
      // Fetch comprehensive user data
      const usersResponse = await apiService.getAllUsersAdmin({
        page: 1,
        limit: 100,
        userType: 'all',
        status: 'all'
      }).catch((err) => {
        console.error('❌ Error fetching users:', err);
        return null;
      });

      if (usersResponse && typeof usersResponse === 'object' && 'data' in usersResponse) {
        const usersData = (usersResponse as any).data;
        console.log('📊 Users response:', usersData);
        
        setAllUsers(usersData.users || []);
        
        // Separate pending users (users with pending KYC or other pending statuses)
        const pendingUsersList = (usersData.users || []).filter((user: any) => 
          user.kycStatus === 'pending' || 
          user.approvalStatus === 'pending' ||
          !user.isActive
        );
        setPendingUsers(pendingUsersList);
      } else {
        // Fallback to individual API calls
        const [all, pendingStudents, pendingEmployers] = await Promise.all([
          apiService.getAllUsers().catch((err) => {
            console.error('❌ Error fetching all users:', err);
            return { users: [] };
          }),
          apiService.getPendingUsers('student').catch((err) => {
            console.error('❌ Error fetching pending students:', err);
            return { users: [] };
          }),
          apiService.getPendingUsers('employer').catch((err) => {
            console.error('❌ Error fetching pending employers:', err);
            return { users: [] };
          }),
        ]);

        console.log('📊 All users response:', all);
        console.log('📊 Pending students:', pendingStudents);
        console.log('📊 Pending employers:', pendingEmployers);

        const allUsersList: AdminUser[] = (all as any)?.users || (Array.isArray(all) ? (all as any) : []);
        const pStudents: AdminUser[] = (pendingStudents as any)?.users || [];
        const pEmployers: AdminUser[] = (pendingEmployers as any)?.users || [];
        
        console.log('📋 Processed users:', { allUsersList: allUsersList.length, pStudents: pStudents.length, pEmployers: pEmployers.length });
        
        setAllUsers(allUsersList);
        setPendingUsers([...pStudents, ...pEmployers]);
      }
    } catch (error) {
      console.error('❌ Error in fetchUsers:', error);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchJobs(): Promise<void> {
    try {
      setLoadingJobs(true);
      console.log('🔄 Fetching jobs data...');
      
      // Fetch comprehensive jobs data
      const jobsResponse = await apiService.getAllJobsAdmin({
        page: 1,
        limit: 100,
        status: 'all',
        approvalStatus: 'all'
      }).catch((err) => {
        console.error('❌ Error fetching jobs:', err);
        return null;
      });

      if (jobsResponse && typeof jobsResponse === 'object' && 'data' in jobsResponse) {
        const jobsData = (jobsResponse as any).data;
        console.log('📊 Jobs response:', jobsData);
        
        // Map backend job structure to frontend AdminJob interface
        const mappedJobs = (jobsData.jobs || []).map((job: any) => ({
          _id: job._id,
          title: job.jobTitle || job.title,
          company: job.companyName || job.company,
          location: job.location,
          status: job.status,
          approvalStatus: job.approvalStatus,
          createdAt: job.createdAt,
          applicationsCount: job.applicationsCount || job.applications?.length || 0,
          description: job.description
        }));
        
        setJobs(mappedJobs);
      } else {
        // Fallback to existing API
        const response = await apiService.getAllJobsForAdmin('all', 'all', 1, 50).catch((err) => {
          console.error('❌ Error fetching jobs:', err);
          return { jobs: [] };
        });
        
        console.log('📊 Jobs response:', response);
        
        const jobsList: AdminJob[] = ((response as any)?.jobs || (Array.isArray(response) ? (response as any) : [])).map((job: any) => ({
          _id: job._id,
          title: job.jobTitle || job.title,
          company: job.companyName || job.company,
          location: job.location,
          status: job.status,
          approvalStatus: job.approvalStatus,
          createdAt: job.createdAt,
          applicationsCount: job.applicationsCount || job.applications?.length || 0,
          description: job.description
        }));
        
        console.log('📋 Processed jobs:', jobsList.length);
        
        setJobs(jobsList);
      }
    } catch (error) {
      console.error('❌ Error in fetchJobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  }

  async function fetchApplications(): Promise<void> {
    try {
      console.log('🔄 Fetching applications data...');
      
      const applicationsResponse = await apiService.getAllApplicationsAdmin({
        page: 1,
        limit: 100,
        status: 'all'
      }).catch((err) => {
        console.error('❌ Error fetching applications:', err);
        return null;
      });

      if (applicationsResponse && typeof applicationsResponse === 'object' && 'data' in applicationsResponse) {
        const applicationsData = (applicationsResponse as any).data;
        console.log('📊 Applications response:', applicationsData);
        
        setApplications(applicationsData.applications || []);
      }
    } catch (error) {
      console.error('❌ Error in fetchApplications:', error);
    }
  }

  async function fetchKYCData(): Promise<void> {
    try {
      console.log('🔄 Fetching KYC data...');
      
      const [studentKYCResponse, employerKYCResponse] = await Promise.all([
        apiService.getAllKYCAdmin({
          page: 1,
          limit: 100,
          status: 'all',
          type: 'student'
        }).catch((err) => {
          console.error('❌ Error fetching student KYC:', err);
          return null;
        }),
        apiService.getAllKYCAdmin({
          page: 1,
          limit: 100,
          status: 'all',
          type: 'employer'
        }).catch((err) => {
          console.error('❌ Error fetching employer KYC:', err);
          return null;
        })
      ]);

      if (studentKYCResponse && typeof studentKYCResponse === 'object' && 'data' in studentKYCResponse) {
        const studentKYCData = (studentKYCResponse as any).data;
        console.log('📊 Student KYC response:', studentKYCData);
        setKycRecords(studentKYCData.kyc || []);
      }

      if (employerKYCResponse && typeof employerKYCResponse === 'object' && 'data' in employerKYCResponse) {
        const employerKYCData = (employerKYCResponse as any).data;
        console.log('📊 Employer KYC response:', employerKYCData);
        setEmployerKycRecords(employerKYCData.kyc || []);
      }
    } catch (error) {
      console.error('❌ Error in fetchKYCData:', error);
    }
  }

  async function fetchComprehensiveData(): Promise<void> {
    try {
      setLoadingOverview(true);
      console.log('🔄 Fetching comprehensive admin data...');
      
      const comprehensiveResponse = await apiService.getComprehensiveAdminData({
        userPage: 1,
        userLimit: 50,
        jobPage: 1,
        jobLimit: 50,
        appPage: 1,
        appLimit: 50,
        kycPage: 1,
        kycLimit: 50
      }).catch((err) => {
        console.error('❌ Error fetching comprehensive data:', err);
        return null;
      });

      if (comprehensiveResponse && typeof comprehensiveResponse === 'object' && 'data' in comprehensiveResponse) {
        const data = (comprehensiveResponse as any).data;
        console.log('📊 Comprehensive data response:', data);
        
        setComprehensiveData(data);
        
        // Update individual state
        setAllUsers(data.users?.data || []);
        
        // Map jobs from backend structure to frontend AdminJob interface
        const mappedJobs = (data.jobs?.data || []).map((job: any) => ({
          _id: job._id,
          title: job.jobTitle || job.title,
          company: job.companyName || job.company,
          location: job.location,
          status: job.status,
          approvalStatus: job.approvalStatus,
          createdAt: job.createdAt,
          applicationsCount: job.applicationsCount || job.applications?.length || 0,
          description: job.description
        }));
        setJobs(mappedJobs);
        
        setApplications(data.applications?.data || []);
        setKycRecords(data.kyc?.studentKYC?.data || []);
        setEmployerKycRecords(data.kyc?.employerKYC?.data || []);
        
        // Update KPIs
        if (data.summary) {
          setKpis({
            totalUsers: data.summary.totalUsers || 0,
            totalJobs: data.summary.totalJobs || 0,
            totalApplications: data.summary.totalApplications || 0,
            activeEmployers: data.summary.activeEmployers || 0,
          });
        }
        
        // Set pending users from the data
        const pendingUsersList = (data.users?.data || []).filter((user: any) => 
          user.kycStatus === 'pending' || 
          user.approvalStatus === 'pending' ||
          !user.isActive
        );
        setPendingUsers(pendingUsersList);
      }
    } catch (error) {
      console.error('❌ Error in fetchComprehensiveData:', error);
    } finally {
      setLoadingOverview(false);
    }
  }

  async function handleApproveUser(userId: string): Promise<void> {
    try {
      setLoadingAction(`approve-user-${userId}`);
      console.log('✅ Approving user:', userId);
      await apiService.approveUser(userId);
      console.log('✅ User approved successfully');
      alert('User approved successfully!');
      // Refresh comprehensive data and individual data
      await Promise.all([fetchComprehensiveData(), fetchUsers()]);
    } catch (error: any) {
      console.error('❌ Error approving user:', error);
      alert(`Failed to approve user: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleRejectUser(userId: string): Promise<void> {
    try {
      const reason = window.prompt('Enter reason for rejection:') || '';
      if (!reason) return;
      setLoadingAction(`reject-user-${userId}`);
      console.log('❌ Rejecting user:', userId, 'Reason:', reason);
      await apiService.rejectUser(userId, reason);
      console.log('✅ User rejected successfully');
      alert('User rejected successfully!');
      // Refresh comprehensive data and individual data
      await Promise.all([fetchComprehensiveData(), fetchUsers()]);
    } catch (error: any) {
      console.error('❌ Error rejecting user:', error);
      alert(`Failed to reject user: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleSuspendUser(userId: string): Promise<void> {
    try {
      setLoadingAction(`suspend-user-${userId}`);
      console.log('⏸️ Suspending user:', userId);
      await apiService.suspendUser(userId);
      console.log('✅ User suspended successfully');
      alert('User suspended successfully!');
      // Refresh comprehensive data and individual data
      await Promise.all([fetchComprehensiveData(), fetchUsers()]);
    } catch (error: any) {
      console.error('❌ Error suspending user:', error);
      alert(`Failed to suspend user: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleActivateUser(userId: string): Promise<void> {
    try {
      setLoadingAction(`activate-user-${userId}`);
      console.log('▶️ Activating user:', userId);
      await apiService.activateUser(userId);
      console.log('✅ User activated successfully');
      alert('User activated successfully!');
      // Refresh comprehensive data and individual data
      await Promise.all([fetchComprehensiveData(), fetchUsers()]);
    } catch (error: any) {
      console.error('❌ Error activating user:', error);
      alert(`Failed to activate user: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleApproveJob(jobId: string): Promise<void> {
    try {
      setLoadingAction(`approve-job-${jobId}`);
      await apiService.approveJob(jobId);
      // Refresh comprehensive data and individual data
      await Promise.all([fetchComprehensiveData(), fetchJobs()]);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleRejectJob(jobId: string): Promise<void> {
    try {
      const rejectionReason = window.prompt('Reason for job rejection:') || '';
      setLoadingAction(`reject-job-${jobId}`);
      await apiService.rejectJob(jobId, rejectionReason);
      // Refresh comprehensive data and individual data
      await Promise.all([fetchComprehensiveData(), fetchJobs()]);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleSendAnnouncement(): Promise<void> {
    try {
      setAnnounceSending(true);
      setAnnounceStatus(null);
      // Attempt generic announcement endpoint; backend may expose this.
      // Uses internal request helper for auth headers.
      await (apiService as any).request('/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({ subject: announceSubject, message: announceMessage }),
      });
      setAnnounceStatus('Announcement sent successfully');
      setAnnounceSubject('');
      setAnnounceMessage('');
    } catch (err: any) {
      setAnnounceStatus(err?.message || 'Failed to send announcement');
    } finally {
      setAnnounceSending(false);
    }
  }

  function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }): React.JSX.Element {
    return (
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
    );
  }

  function StatCard({ label, value }: { label: string; value: number }): React.JSX.Element {
    return (
      <div className="rounded-xl bg-white shadow-sm p-5">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    );
  }

  function renderOverview(): React.JSX.Element {
    return (
      <div>
        <SectionHeader title="Overview" action={
          <button
            onClick={() => fetchComprehensiveData()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
          >
            {loadingOverview ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Refresh All Data
          </button>
        } />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={kpis.totalUsers} />
          <StatCard label="Total Jobs" value={kpis.totalJobs} />
          <StatCard label="Applications" value={kpis.totalApplications} />
          <StatCard label="Active Employers" value={kpis.activeEmployers} />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-900">Quick Actions</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={() => setSection('users')} className="rounded-lg bg-gray-100 px-4 py-3 text-left hover:bg-gray-200">Manage Users</button>
              <button onClick={() => setSection('jobs')} className="rounded-lg bg-gray-100 px-4 py-3 text-left hover:bg-gray-200">Review Jobs</button>
              <a href="/kyc-management" className="rounded-lg bg-gray-100 px-4 py-3 text-left hover:bg-gray-200">KYC Management</a>
              <button onClick={() => setSection('analytics')} className="rounded-lg bg-gray-100 px-4 py-3 text-left hover:bg-gray-200">View Analytics</button>
            </div>
          </div>
          <div className="rounded-xl bg-white shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            <div className="mt-4 space-y-3">
              <input
                value={announceSubject}
                onChange={(e) => setAnnounceSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <textarea
                value={announceMessage}
                onChange={(e) => setAnnounceMessage(e.target.value)}
                placeholder="Write announcement message..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSendAnnouncement}
                  disabled={announceSending || !announceSubject || !announceMessage}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {announceSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  Send Announcement
                </button>
                {announceStatus && (
                  <span className="text-sm text-gray-600">{announceStatus}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 rounded-xl bg-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Debug Information</h3>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <p><strong>Loading Overview:</strong> {loadingOverview ? 'Yes' : 'No'}</p>
              <p><strong>Loading Users:</strong> {loadingUsers ? 'Yes' : 'No'}</p>
              <p><strong>Loading Jobs:</strong> {loadingJobs ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>Total Users:</strong> {kpis.totalUsers}</p>
              <p><strong>Total Jobs:</strong> {kpis.totalJobs}</p>
              <p><strong>Total Applications:</strong> {kpis.totalApplications}</p>
              <p><strong>Active Employers:</strong> {kpis.activeEmployers}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderUsers(): React.JSX.Element {
    return (
      <div>
        <SectionHeader title="User Management" action={
          <button onClick={() => fetchUsers()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">
            {loadingUsers ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Refresh
          </button>
        } />

        {/* Pending Users */}
        <div className="rounded-xl bg-white shadow-sm p-5">
          <h3 className="text-sm font-medium text-gray-900">Pending Approvals</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">No pending users</td>
                  </tr>
                )}
                {pendingUsers.map((u) => (
                  <tr key={u._id} className="align-top">
                    <td className="py-2 pr-4 font-medium text-gray-900">{u.name || 'N/A'}</td>
                    <td className="py-2 pr-4 text-gray-700">{u.email || '-'}</td>
                    <td className="py-2 pr-4 capitalize">{u.userType || '-'}</td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveUser(u._id)}
                          disabled={loadingAction === `approve-user-${u._id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {loadingAction === `approve-user-${u._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                        </button>
                        <button
                          onClick={() => handleRejectUser(u._id)}
                          disabled={loadingAction === `reject-user-${u._id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {loadingAction === `reject-user-${u._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Users */}
        <div className="mt-6 rounded-xl bg-white shadow-sm p-5">
          <h3 className="text-sm font-medium text-gray-900">All Users</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">No users found</td>
                  </tr>
                )}
                {allUsers.map((u) => (
                  <tr key={u._id} className="align-top">
                    <td className="py-2 pr-4 font-medium text-gray-900">{u.name || 'N/A'}</td>
                    <td className="py-2 pr-4 text-gray-700">{u.email || '-'}</td>
                    <td className="py-2 pr-4 capitalize">{u.userType || '-'}</td>
                    <td className="py-2 pr-4 capitalize">{u.status || 'active'}</td>
                    <td className="py-2 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleSuspendUser(u._id)}
                          disabled={loadingAction === `suspend-user-${u._id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-200 px-3 py-1.5 text-gray-900 hover:bg-gray-300 disabled:opacity-50"
                        >
                          {loadingAction === `suspend-user-${u._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />} Suspend
                        </button>
                        <button
                          onClick={() => handleActivateUser(u._id)}
                          disabled={loadingAction === `activate-user-${u._id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {loadingAction === `activate-user-${u._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />} Activate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderJobs(): React.JSX.Element {
    return (
      <div>
        <SectionHeader title="Job Management" action={
          <button onClick={() => fetchJobs()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">
            {loadingJobs ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Refresh
          </button>
        } />

        <div className="rounded-xl bg-white shadow-sm p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Apps</th>
                  <th className="py-2 pr-4">Approval</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">No jobs found</td>
                  </tr>
                )}
                {jobs.map((j) => (
                  <tr key={j._id} className="align-top">
                    <td className="py-2 pr-4 font-medium text-gray-900">{j.title || 'Untitled'}</td>
                    <td className="py-2 pr-4 text-gray-700">{j.company || '-'}</td>
                    <td className="py-2 pr-4">{j.location || '-'}</td>
                    <td className="py-2 pr-4">{typeof j.applicationsCount === 'number' ? j.applicationsCount : '-'}</td>
                    <td className="py-2 pr-4 capitalize">{j.approvalStatus || 'unknown'}</td>
                    <td className="py-2 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleApproveJob(j._id)}
                          disabled={loadingAction === `approve-job-${j._id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {loadingAction === `approve-job-${j._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                        </button>
                        <button
                          onClick={() => handleRejectJob(j._id)}
                          disabled={loadingAction === `reject-job-${j._id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {loadingAction === `reject-job-${j._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderApplications(): React.JSX.Element {
    return (
      <div>
        <SectionHeader title="Application Management" action={
          <button onClick={() => fetchApplications()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">
            Refresh Applications
          </button>
        } />

        <div className="rounded-xl bg-white shadow-sm p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Job</th>
                  <th className="py-2 pr-4">Employer</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Applied Date</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">No applications found</td>
                  </tr>
                )}
                {applications.map((app) => (
                  <tr key={app._id} className="align-top">
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      {typeof app.studentId === 'object' ? app.studentId?.name : 'N/A'}
                    </td>
                    <td className="py-2 pr-4 text-gray-700">
                      {typeof app.jobId === 'object' ? app.jobId?.title : 'N/A'}
                    </td>
                    <td className="py-2 pr-4 text-gray-700">
                      {typeof app.employerId === 'object' ? app.employerId?.name : 'N/A'}
                    </td>
                    <td className="py-2 pr-4 capitalize">{app.status || 'pending'}</td>
                    <td className="py-2 pr-4">{app.appliedDate || app.createdAt || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderKYC(): React.JSX.Element {
    return (
      <div>
        <SectionHeader title="KYC Management" action={
          <button onClick={() => fetchKYCData()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">
            Refresh KYC Data
          </button>
        } />

        {/* Student KYC */}
        <div className="rounded-xl bg-white shadow-sm p-5 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Student KYC Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">College</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Submitted</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kycRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">No student KYC records found</td>
                  </tr>
                )}
                {kycRecords.map((kyc) => (
                  <tr key={kyc._id} className="align-top">
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      {typeof kyc.userId === 'object' ? kyc.userId?.name : kyc.fullName || 'N/A'}
                    </td>
                    <td className="py-2 pr-4 text-gray-700">{kyc.college || '-'}</td>
                    <td className="py-2 pr-4 capitalize">{kyc.verificationStatus || 'pending'}</td>
                    <td className="py-2 pr-4">{kyc.submittedAt || kyc.createdAt || '-'}</td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => {
                          setSelectedKYC(kyc);
                          setSelectedKYCType('student');
                          setShowKYCModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employer KYC */}
        <div className="rounded-xl bg-white shadow-sm p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Employer KYC Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Submitted</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employerKycRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">No employer KYC records found</td>
                  </tr>
                )}
                {employerKycRecords.map((kyc) => (
                  <tr key={kyc._id} className="align-top">
                    <td className="py-2 pr-4 font-medium text-gray-900">{kyc.companyName || 'N/A'}</td>
                    <td className="py-2 pr-4 text-gray-700">
                      {typeof kyc.userId === 'object' ? kyc.userId?.name : 'N/A'}
                    </td>
                    <td className="py-2 pr-4 capitalize">{kyc.verificationStatus || 'pending'}</td>
                    <td className="py-2 pr-4">{kyc.createdAt || '-'}</td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => {
                          setSelectedKYC(kyc);
                          setSelectedKYCType('employer');
                          setShowKYCModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* KYC Documentation Modal */}
        {showKYCModal && selectedKYC && renderKYCModal()}
      </div>
    );
  }

  function DetailField({ label, value }: { label: string; value: string }) {
    return (
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    );
  }

  function renderKYCModal(): React.JSX.Element {
    if (!selectedKYC) return <></>;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">KYC Documentation</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Status: <span className={`font-semibold capitalize ${
                    selectedKYC.verificationStatus === 'approved' ? 'text-green-600' :
                    selectedKYC.verificationStatus === 'rejected' ? 'text-red-600' :
                    selectedKYC.verificationStatus === 'suspended' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {selectedKYC.verificationStatus || 'pending'}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowKYCModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailField label="Full Name" value={selectedKYC.fullName || 'N/A'} />
                <DetailField label="Date of Birth" value={selectedKYC.dob ? new Date(selectedKYC.dob).toLocaleDateString() : 'N/A'} />
                <DetailField label="Gender" value={selectedKYC.gender || 'N/A'} />
                <DetailField label="Phone" value={selectedKYC.phone || 'N/A'} />
                <DetailField label="Email" value={selectedKYC.email || 'N/A'} />
                <DetailField label="Address" value={selectedKYC.address || 'N/A'} />
              </div>
            </div>

            {/* Academic Information (for students) */}
            {selectedKYCType === 'student' && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="College" value={selectedKYC.college || 'N/A'} />
                  <DetailField label="Course & Year" value={selectedKYC.courseYear || 'N/A'} />
                  <DetailField label="Student ID" value={selectedKYC.studentId || 'N/A'} />
                </div>
              </div>
            )}

            {/* Stay & Availability (for students) */}
            {selectedKYCType === 'student' && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Stay & Availability</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Stay Type" value={selectedKYC.stayType || 'N/A'} />
                  <DetailField label="Hours Per Week" value={selectedKYC.hoursPerWeek ? `${selectedKYC.hoursPerWeek} hours` : 'N/A'} />
                  {selectedKYC.availableDays && selectedKYC.availableDays.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-2">Available Days</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedKYC.availableDays.map((day: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedKYC.pgDetails && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-2">PG Details</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm"><strong>Name:</strong> {selectedKYC.pgDetails.name}</p>
                        <p className="text-sm"><strong>Address:</strong> {selectedKYC.pgDetails.address}</p>
                        <p className="text-sm"><strong>Contact:</strong> {selectedKYC.pgDetails.contact}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {selectedKYC.emergencyContact && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Name" value={selectedKYC.emergencyContact.name || 'N/A'} />
                  <DetailField label="Phone" value={selectedKYC.emergencyContact.phone || 'N/A'} />
                  <DetailField label="Blood Group" value={selectedKYC.bloodGroup || 'N/A'} />
                </div>
              </div>
            )}

            {/* Work Preferences (for students) */}
            {selectedKYCType === 'student' && selectedKYC.preferredJobTypes && selectedKYC.preferredJobTypes.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Work Preferences</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedKYC.preferredJobTypes.map((jobType: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {jobType}
                    </span>
                  ))}
                </div>
                {selectedKYC.experienceSkills && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Experience & Skills</p>
                    <p className="text-sm text-gray-900">{selectedKYC.experienceSkills}</p>
                  </div>
                )}
              </div>
            )}

            {/* Payroll Information (for students) */}
            {selectedKYCType === 'student' && selectedKYC.payroll && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Payroll Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Payroll Consent" value={selectedKYC.payroll.consent ? 'Yes' : 'No'} />
                  <DetailField label="Bank Account" value={selectedKYC.payroll.bankAccount || 'N/A'} />
                  <DetailField label="IFSC" value={selectedKYC.payroll.ifsc || 'N/A'} />
                  <DetailField label="Beneficiary Name" value={selectedKYC.payroll.beneficiaryName || 'N/A'} />
                </div>
              </div>
            )}

            {/* Documents */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedKYC.aadharCard && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Aadhar Card</p>
                    <img
                      src={selectedKYC.aadharCard}
                      alt="Aadhar Card"
                      className="w-full h-48 object-contain border border-gray-200 rounded"
                    />
                    <a
                      href={selectedKYC.aadharCard}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      <Download className="w-4 h-4" />
                      View Full Size
                    </a>
                  </div>
                )}
                {selectedKYC.collegeIdCard && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">College ID Card</p>
                    <img
                      src={selectedKYC.collegeIdCard}
                      alt="College ID Card"
                      className="w-full h-48 object-contain border border-gray-200 rounded"
                    />
                    <a
                      href={selectedKYC.collegeIdCard}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      <Download className="w-4 h-4" />
                      View Full Size
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={async () => {
                  try {
                    setLoadingAction('approve-kyc');
                    console.log('✅ Approving KYC:', selectedKYC._id);
                    await apiService.approveKYC(selectedKYC._id);
                    console.log('✅ KYC approved successfully');
                    alert('KYC approved successfully!');
                    await fetchKYCData();
                    setShowKYCModal(false);
                  } catch (error: any) {
                    console.error('❌ Error approving KYC:', error);
                    alert(`Failed to approve KYC: ${error.message || 'Unknown error'}`);
                  } finally {
                    setLoadingAction(null);
                  }
                }}
                disabled={loadingAction === 'approve-kyc'}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loadingAction === 'approve-kyc' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Approve KYC
              </button>
              <button
                onClick={async () => {
                  const reason = prompt('Enter suspension reason:') || '';
                  if (!reason) return;
                  try {
                    setLoadingAction('suspend-kyc');
                    console.log('⏸️ Suspending KYC:', selectedKYC._id, 'Reason:', reason);
                    await apiService.suspendKYC(selectedKYC._id, reason);
                    console.log('✅ KYC suspended successfully');
                    alert('KYC suspended successfully!');
                    await fetchKYCData();
                    setShowKYCModal(false);
                  } catch (error: any) {
                    console.error('❌ Error suspending KYC:', error);
                    alert(`Failed to suspend KYC: ${error.message || 'Unknown error'}`);
                  } finally {
                    setLoadingAction(null);
                  }
                }}
                disabled={loadingAction === 'suspend-kyc'}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700 disabled:opacity-50"
              >
                {loadingAction === 'suspend-kyc' ? <Loader2 className="w-5 h-5 animate-spin" /> : <PauseCircle className="w-5 h-5" />}
                Suspend KYC
              </button>
              <button
                onClick={async () => {
                  const reason = prompt('Enter rejection reason:') || '';
                  if (!reason) return;
                  try {
                    setLoadingAction('reject-kyc');
                    console.log('❌ Rejecting KYC:', selectedKYC._id, 'Reason:', reason);
                    await apiService.rejectKYC(selectedKYC._id, reason);
                    console.log('✅ KYC rejected successfully');
                    alert('KYC rejected successfully!');
                    await fetchKYCData();
                    setShowKYCModal(false);
                  } catch (error: any) {
                    console.error('❌ Error rejecting KYC:', error);
                    alert(`Failed to reject KYC: ${error.message || 'Unknown error'}`);
                  } finally {
                    setLoadingAction(null);
                  }
                }}
                disabled={loadingAction === 'reject-kyc'}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loadingAction === 'reject-kyc' ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                Reject KYC
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderAnalytics(): React.JSX.Element {
    return (
      <div>
        <SectionHeader title="Analytics" action={
          <button onClick={() => fetchOverview()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">
            {loadingOverview ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Refresh
          </button>
        } />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={kpis.totalUsers} />
          <StatCard label="Total Jobs" value={kpis.totalJobs} />
          <StatCard label="Applications" value={kpis.totalApplications} />
          <StatCard label="Active Employers" value={kpis.activeEmployers} />
        </div>

        {/* Placeholder for charts - you can integrate a chart lib later */}
        <div className="mt-6 rounded-xl bg-white shadow-sm p-5">
          <p className="text-sm text-gray-600">Charts area (integrate your preferred charting library)</p>
        </div>
      </div>
    );
  }

  function renderNotifications(): React.JSX.Element {
    return (
      <div>
        <SectionHeader title="Notifications & Announcements" />
        <div className="rounded-xl bg-white shadow-sm p-5 max-w-2xl">
          <div className="space-y-3">
            <input
              value={announceSubject}
              onChange={(e) => setAnnounceSubject(e.target.value)}
              placeholder="Subject"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <textarea
              value={announceMessage}
              onChange={(e) => setAnnounceMessage(e.target.value)}
              placeholder="Write announcement message..."
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={handleSendAnnouncement}
              disabled={announceSending || !announceSubject || !announceMessage}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {announceSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              Send Announcement
            </button>
            {announceStatus && (
              <div className="text-sm text-gray-600">{announceStatus}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderSettings(): React.JSX.Element {
    return (
      <div>
        <SectionHeader title="Settings" />
        <div className="rounded-xl bg-white shadow-sm p-5 max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Theme</label>
              <div className="mt-2 flex gap-2">
                <button className="rounded-lg bg-gray-100 px-3 py-2">Light</button>
                <button className="rounded-lg bg-gray-900 px-3 py-2 text-white">Dark</button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Branding</label>
              <div className="mt-2 flex items-center gap-2">
                <input type="text" placeholder="Brand name" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                <button className="rounded-lg bg-indigo-600 px-3 py-2 text-white">Save</button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Maintenance Mode</label>
              <div className="mt-2 flex items-center gap-3">
                <input id="maintenance" type="checkbox" className="h-4 w-4 rounded" />
                <label htmlFor="maintenance" className="text-sm text-gray-700">Enable maintenance mode</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderContent(): React.JSX.Element {
    switch (section) {
      case 'users':
        return renderUsers();
      case 'jobs':
        return renderJobs();
      case 'applications':
        return renderApplications();
      case 'kyc':
        return renderKYC();
      case 'analytics':
        return renderAnalytics();
      case 'notifications':
        return renderNotifications();
      case 'settings':
        return renderSettings();
      case 'overview':
      default:
        return renderOverview();
    }
  }

  return (
    <ProtectedRoute requiredUserType="admin" fallbackPath="/login">
      <div className="min-h-screen bg-gray-50 relative">
        {/* Background Logo */}
        <div className="fixed inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <img
              src="/img/norixnobg.jpg"
              alt="NoriX Background Logo"
              className="w-[2000px] h-[500px] object-contain"
            />
          </div>
        </div>

        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen((s) => !s)}
                  className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
                  aria-label="Toggle sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                  <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900 hover:bg-gray-200"
                >
                  <LogOut className="w-4 h-4" />
                  Exit
                </a>
                
                {/* Admin Dropdown */}
                <div className="relative admin-dropdown">
                  <button
                    onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {adminDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-50">
                      <a
                        href="/kyc-management"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setAdminDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        KYC Management
                      </a>
                      <a
                        href="/kyc-direct-view"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setAdminDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Direct KYC View
                      </a>
                      <a
                        href="/kyc-test"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setAdminDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        KYC Test
                      </a>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          setAdminDropdownOpen(false);
                          setSection('overview');
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard Overview
                      </button>
                      <button
                        onClick={() => {
                          setAdminDropdownOpen(false);
                          setSection('users');
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Users className="w-4 h-4" />
                        User Management
                      </button>
                      <button
                        onClick={() => {
                          setAdminDropdownOpen(false);
                          setSection('jobs');
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Briefcase className="w-4 h-4" />
                        Job Management
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content layout */}
        <div className="mx-auto max-w-7xl px-4 py-6 lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Sidebar */}
          <aside className={`mb-6 lg:mb-0 lg:col-span-3 ${sidebarOpen ? '' : 'hidden'} lg:block`}>
            <nav className="rounded-xl bg-white shadow-sm p-2">
              {navItems.map((n) => (
                <button
                  key={n.key}
                  onClick={() => {
                    setSection(n.key);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 ${
                    section === n.key ? 'bg-gray-100' : ''
                  }`}
                >
                  {n.icon}
                  <span className="text-sm font-medium text-gray-900">{n.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <main className="lg:col-span-9">
            {renderContent()}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}


