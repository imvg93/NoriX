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
  Clock,
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
  isActive?: boolean;
  kycStatus?: string;
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
  const [jobFilter, setJobFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'student' | 'employer' | 'admin'>('all');
  const [applications, setApplications] = useState<any[]>([]);
  const [kycRecords, setKycRecords] = useState<any[]>([]);
  const [employerKycRecords, setEmployerKycRecords] = useState<any[]>([]);
  const [corporateKYC, setCorporateKYC] = useState<any[]>([]);
  const [localBusinessKYC, setLocalBusinessKYC] = useState<any[]>([]);
  const [individualKYC, setIndividualKYC] = useState<any[]>([]);
  const [kycStatusFilter, setKycStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [kpis, setKpis] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    activeEmployers: 0,
  });
  const [kycStats, setKycStats] = useState({
    student: { total: 0, pending: 0, approved: 0, rejected: 0 },
    corporate: { total: 0, pending: 0, approved: 0, rejected: 0 },
    localBusiness: { total: 0, pending: 0, approved: 0, rejected: 0 },
    individual: { total: 0, pending: 0, approved: 0, rejected: 0 },
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
  const [selectedKYCType, setSelectedKYCType] = useState<'student' | 'corporate' | 'local_business' | 'individual'>('student');

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
    // Always fetch KYC data on mount to show stats in overview
    // For overview, show pending records by default so admin can verify them
    if (section === 'overview') {
      void fetchKYCData(true); // Pass true to show pending only
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
        const pendingUsersList = (usersData.users || []).filter((user: any) => {
          const status = user.kycStatus || user.approvalStatus;
          return status === 'pending' || !status || !user.isActive;
        });
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

  async function fetchKYCData(showPendingOnly: boolean = false): Promise<void> {
    try {
      console.log('🔄 Fetching KYC data...', { showPendingOnly, kycStatusFilter });
      
      // For overview page, default to showing pending records for verification
      const statusFilter = showPendingOnly ? 'pending' : (kycStatusFilter === 'all' ? 'all' : kycStatusFilter);
      
      const [studentKYCResponse, employerKYCResponse] = await Promise.all([
        apiService.getAllKYCAdmin({
          page: 1,
          limit: 1000, // Increased limit to get all pending records
          status: statusFilter,
          type: 'student'
        }).catch((err) => {
          console.error('❌ Error fetching student KYC:', err);
          return null;
        }),
        apiService.getAllEmployerKYCAdmin({
          page: 1,
          limit: 1000, // Increased limit to get all pending records
          status: statusFilter,
          type: 'all'
        }).catch((err) => {
          console.error('❌ Error fetching employer KYC:', err);
          return null;
        })
      ]);

      if (studentKYCResponse && typeof studentKYCResponse === 'object' && 'data' in studentKYCResponse) {
        const studentKYCData = (studentKYCResponse as any).data;
        console.log('📊 Student KYC response:', studentKYCData);
        const studentRecords = studentKYCData.kyc || [];
        
        // Filter to show only pending if needed
        const filteredStudents = statusFilter === 'pending' 
          ? studentRecords.filter((r: any) => (r.verificationStatus || r.status) === 'pending')
          : studentRecords;
        
        console.log('📋 Student KYC records (filtered):', filteredStudents.length, filteredStudents);
        setKycRecords(filteredStudents);
      }

      if (employerKYCResponse && typeof employerKYCResponse === 'object' && 'data' in employerKYCResponse) {
        const employerKYCData = (employerKYCResponse as any).data;
        console.log('📊 Employer KYC response:', employerKYCData);
        
        // Separate by type - Corporate KYC is in employerKYCData.corporate.records
        const corporate = employerKYCData.corporate?.records || [];
        const localBusiness = employerKYCData.localBusiness?.records || [];
        const individual = employerKYCData.individual?.records || [];
        
        console.log('📋 Corporate KYC records (raw):', corporate.length, corporate);
        console.log('📋 Local Business KYC records (raw):', localBusiness.length, localBusiness);
        console.log('📋 Individual KYC records (raw):', individual.length, individual);
        
        // Filter to show only pending if needed
        const filterPending = (records: any[]) => {
          if (statusFilter === 'pending') {
            const pending = records.filter((r: any) => (r.status || r.verificationStatus) === 'pending');
            console.log(`📋 Filtered ${records.length} records to ${pending.length} pending`);
            return pending;
          }
          return records;
        };
        
        const filteredCorporate = filterPending(corporate);
        const filteredLocalBusiness = filterPending(localBusiness);
        const filteredIndividual = filterPending(individual);
        
        console.log('📋 Corporate KYC (filtered):', filteredCorporate.length);
        console.log('📋 Local Business KYC (filtered):', filteredLocalBusiness.length);
        console.log('📋 Individual KYC (filtered):', filteredIndividual.length);
        
        setCorporateKYC(filteredCorporate);
        setLocalBusinessKYC(filteredLocalBusiness);
        setIndividualKYC(filteredIndividual);
        
        // Also set combined for backward compatibility
        setEmployerKycRecords(employerKYCData.kyc || []);
        
        // Calculate KYC stats
        const calculateStats = (records: any[]) => ({
          total: records.length,
          pending: records.filter((r: any) => r.status === 'pending').length,
          approved: records.filter((r: any) => r.status === 'approved').length,
          rejected: records.filter((r: any) => r.status === 'rejected').length,
        });
        
        setKycStats({
          student: calculateStats(kycRecords),
          corporate: calculateStats(corporate),
          localBusiness: calculateStats(localBusiness),
          individual: calculateStats(individual),
        });
      }
      
      // Calculate student KYC stats
      if (studentKYCResponse && typeof studentKYCResponse === 'object' && 'data' in studentKYCResponse) {
        const studentKYCData = (studentKYCResponse as any).data;
        const studentRecords = studentKYCData.kyc || [];
        setKycStats(prev => ({
          ...prev,
          student: {
            total: studentRecords.length,
            pending: studentRecords.filter((r: any) => r.verificationStatus === 'pending').length,
            approved: studentRecords.filter((r: any) => r.verificationStatus === 'approved').length,
            rejected: studentRecords.filter((r: any) => r.verificationStatus === 'rejected').length,
          }
        }));
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
        const pendingUsersList = (data.users?.data || []).filter((user: any) => {
          const status = user.kycStatus || user.approvalStatus;
          return status === 'pending' || !status || !user.isActive;
        });
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
      console.log('✅ Admin dashboard: Approving job:', jobId);
      await apiService.approveJob(jobId);
      console.log('✅ Job approved successfully');
      
      // Update local state immediately to reflect the change
      setJobs(prevJobs => prevJobs.map(job => 
        job._id === jobId 
          ? { ...job, approvalStatus: 'approved', status: 'active' }
          : job
      ));
      
      alert('Job approved successfully! The job has been moved to the approved section.');
      
      // Refresh data to ensure consistency
      await Promise.all([fetchComprehensiveData(), fetchJobs()]);
    } catch (error: any) {
      console.error('❌ Error approving job:', error);
      alert(`Failed to approve job: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleRejectJob(jobId: string): Promise<void> {
    try {
      const rejectionReason = window.prompt('Reason for job rejection:') || '';
      if (!rejectionReason.trim()) {
        alert('Rejection reason is required');
        return;
      }
      setLoadingAction(`reject-job-${jobId}`);
      console.log('❌ Admin dashboard: Rejecting job:', jobId, 'Reason:', rejectionReason);
      await apiService.rejectJob(jobId, rejectionReason);
      console.log('✅ Job rejected successfully');
      
      // Update local state immediately to reflect the change
      setJobs(prevJobs => prevJobs.map(job => 
        job._id === jobId 
          ? { ...job, approvalStatus: 'rejected', status: 'closed' }
          : job
      ));
      
      alert('Job rejected successfully! The job has been moved to the rejected section.');
      
      // Refresh data to ensure consistency
      await Promise.all([fetchComprehensiveData(), fetchJobs()]);
    } catch (error: any) {
      console.error('❌ Error rejecting job:', error);
      alert(`Failed to reject job: ${error.message || 'Unknown error'}`);
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

        {/* KYC Details Section - Showing Pending Records for Verification */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pending KYC Submissions - Awaiting Verification</h3>
              <p className="text-sm text-gray-500 mt-1">Review and verify all pending KYC applications below</p>
            </div>
            <div className="flex gap-2">
              <select
                value={kycStatusFilter}
                onChange={(e) => {
                  setKycStatusFilter(e.target.value as any);
                  fetchKYCData(e.target.value === 'pending');
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="pending">Pending Only</option>
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={() => fetchKYCData(kycStatusFilter === 'pending')}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 text-sm"
              >
                Refresh KYC Data
              </button>
            </div>
          </div>

          {/* Student KYC Details */}
          <div className="rounded-xl bg-white shadow-sm p-5 mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Student KYC Records ({kycRecords.length})</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Student Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">College</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Submitted</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kycRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">No student KYC records found</td>
                    </tr>
                  ) : (
                    kycRecords.map((kyc) => (
                      <tr key={kyc._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-900">
                          {typeof kyc.userId === 'object' ? kyc.userId?.name : kyc.fullName || 'N/A'}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">{kyc.email || (typeof kyc.userId === 'object' ? kyc.userId?.email : 'N/A')}</td>
                        <td className="py-3 pr-4 text-gray-700">{kyc.college || 'N/A'}</td>
                        <td className="py-3 pr-4 text-gray-700">{kyc.phone || (typeof kyc.userId === 'object' ? kyc.userId?.phone : 'N/A')}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            kyc.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                            kyc.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {kyc.verificationStatus || 'pending'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{new Date(kyc.submittedAt || kyc.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 pr-4">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Corporate Employer KYC Details */}
          <div className="rounded-xl bg-white shadow-sm p-5 mb-6 border-l-4 border-l-blue-500">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Corporate Employer KYC ({corporateKYC.length})</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Company Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">GST Number</th>
                    <th className="py-2 pr-4">Admin Name</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Submitted</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {corporateKYC.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">No Corporate KYC records found</td>
                    </tr>
                  ) : (
                    corporateKYC.map((kyc) => (
                      <tr key={kyc._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-900">{kyc.companyName || 'N/A'}</td>
                        <td className="py-3 pr-4 text-gray-700">
                          {kyc.companyEmail || (typeof kyc.employerId === 'object' ? kyc.employerId?.email : 'N/A')}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">{kyc.GSTNumber || kyc.gstNumber || 'N/A'}</td>
                        <td className="py-3 pr-4 text-gray-700">{kyc.authorizedName || kyc.fullName || kyc.adminName || 'N/A'}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            kyc.status === 'approved' ? 'bg-green-100 text-green-800' :
                            kyc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {kyc.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{new Date(kyc.submittedAt || kyc.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 pr-4">
                          <button
                            onClick={() => {
                              setSelectedKYC(kyc);
                              setSelectedKYCType('corporate');
                              setShowKYCModal(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Local Business KYC Details */}
          <div className="rounded-xl bg-white shadow-sm p-5 mb-6 border-l-4 border-l-purple-500">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Local Business KYC ({localBusinessKYC.length})</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Business Name</th>
                    <th className="py-2 pr-4">Business Type</th>
                    <th className="py-2 pr-4">Owner Name</th>
                    <th className="py-2 pr-4">Owner Phone</th>
                    <th className="py-2 pr-4">Address</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Submitted</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {localBusinessKYC.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-500">No Local Business KYC records found</td>
                    </tr>
                  ) : (
                    localBusinessKYC.map((kyc) => (
                      <tr key={kyc._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-900">{kyc.businessName || 'N/A'}</td>
                        <td className="py-3 pr-4 text-gray-700">{kyc.businessType || 'N/A'}</td>
                        <td className="py-3 pr-4 text-gray-700">{kyc.ownerName || 'N/A'}</td>
                        <td className="py-3 pr-4 text-gray-700">{kyc.ownerPhone || 'N/A'}</td>
                        <td className="py-3 pr-4 text-gray-700">{kyc.address || 'N/A'}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            kyc.status === 'approved' ? 'bg-green-100 text-green-800' :
                            kyc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {kyc.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{new Date(kyc.submittedAt || kyc.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 pr-4">
                          <button
                            onClick={() => {
                              setSelectedKYC(kyc);
                              setSelectedKYCType('local_business');
                              setShowKYCModal(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual KYC Details */}
          <div className="rounded-xl bg-white shadow-sm p-5 border-l-4 border-l-green-500">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Individual Employer KYC ({individualKYC.length})</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Full Name</th>
                    <th className="py-2 pr-4">Aadhaar Number</th>
                    <th className="py-2 pr-4">Address</th>
                    <th className="py-2 pr-4">City</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Submitted</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {individualKYC.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">No Individual KYC records found</td>
                    </tr>
                  ) : (
                    individualKYC.map((kyc) => (
                      <tr key={kyc._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-900">{kyc.fullName || 'N/A'}</td>
                        <td className="py-3 pr-4 text-gray-700">
                          {kyc.aadhaarNumber ? `${kyc.aadhaarNumber.substring(0, 4)}****${kyc.aadhaarNumber.substring(kyc.aadhaarNumber.length - 4)}` : 'N/A'}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">{kyc.address || 'N/A'}</td>
                        <td className="py-3 pr-4 text-gray-700">{kyc.city || 'N/A'}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            kyc.status === 'approved' ? 'bg-green-100 text-green-800' :
                            kyc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {kyc.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{new Date(kyc.submittedAt || kyc.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 pr-4">
                          <button
                            onClick={() => {
                              setSelectedKYC(kyc);
                              setSelectedKYCType('individual');
                              setShowKYCModal(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-900">Quick Actions</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={() => setSection('users')} className="rounded-lg bg-gray-100 px-4 py-3 text-left hover:bg-gray-200">Manage Users</button>
              <button onClick={() => setSection('jobs')} className="rounded-lg bg-gray-100 px-4 py-3 text-left hover:bg-gray-200">Review Jobs</button>
              <button 
                onClick={() => {
                  setSection('kyc');
                  fetchKYCData();
                }} 
                className="rounded-lg bg-gray-100 px-4 py-3 text-left hover:bg-gray-200"
              >
                KYC Management
              </button>
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
    // Separate users by type for counts
    const students = allUsers.filter(u => u.userType === 'student');
    const employers = allUsers.filter(u => u.userType === 'employer');
    const admins = allUsers.filter(u => u.userType === 'admin');
    
    // Separate pending users by type for counts
    const pendingStudents = pendingUsers.filter(u => u.userType === 'student');
    const pendingEmployers = pendingUsers.filter(u => u.userType === 'employer');
    const pendingAdmins = pendingUsers.filter(u => u.userType === 'admin');
    
    // Filter users based on selected type filter
    const getFilteredUsers = () => {
      if (userTypeFilter === 'all') {
        return allUsers;
      }
      return allUsers.filter(u => u.userType === userTypeFilter);
    };
    
    const getFilteredPendingUsers = () => {
      if (userTypeFilter === 'all') {
        return pendingUsers;
      }
      return pendingUsers.filter(u => u.userType === userTypeFilter);
    };
    
    const displayedUsers = getFilteredUsers();
    const displayedPendingUsers = getFilteredPendingUsers();

    const renderUserTable = (users: AdminUser[], showActions: boolean = true, showApprovalStatus: boolean = false) => (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Phone</th>
              {showApprovalStatus && <th className="py-2 pr-4">Approval Status</th>}
              <th className="py-2 pr-4">Status</th>
              {showActions && <th className="py-2 pr-4">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={showActions ? (showApprovalStatus ? 6 : 5) : (showApprovalStatus ? 5 : 4)} className="py-6 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="align-top border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-900">{u.name || 'N/A'}</td>
                  <td className="py-3 pr-4 text-gray-700 break-words">{u.email || '-'}</td>
                  <td className="py-3 pr-4 text-gray-600">{u.phone || '-'}</td>
                  {showApprovalStatus && (
                    <td className="py-3 pr-4">
                      {/* Use kycStatus as the primary indicator - if not set, fall back to approvalStatus */}
                      {(() => {
                        const status = u.kycStatus || u.approvalStatus;
                        
                        if (status === 'approved' || status === 'verified') {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved
                            </span>
                          );
                        } else if (status === 'pending' || (!status && !u.isActive)) {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                          );
                        } else if (status === 'rejected') {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejected
                            </span>
                          );
                        } else if (status === 'not-submitted' || !status) {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Not Submitted
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                              {status}
                            </span>
                          );
                        }
                      })()}
                    </td>
                  )}
                  <td className="py-3 pr-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      u.status === 'active' || u.isActive ? 'bg-green-100 text-green-800' :
                      u.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {u.status || (u.isActive ? 'active' : 'inactive')}
                    </span>
                  </td>
                  {showActions && (
                    <td className="py-3 pr-4">
                      {(() => {
                        const status = u.kycStatus || u.approvalStatus;
                        const isPending = status === 'pending' || !status || !u.isActive;
                        const isApproved = status === 'approved' || status === 'verified';
                        
                        if (isPending) {
                          return (
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <button
                                onClick={() => handleApproveUser(u._id)}
                                disabled={loadingAction === `approve-user-${u._id}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-white hover:bg-green-700 disabled:opacity-50 text-xs whitespace-nowrap"
                              >
                                {loadingAction === `approve-user-${u._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                              </button>
                              <button
                                onClick={() => handleRejectUser(u._id)}
                                disabled={loadingAction === `reject-user-${u._id}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50 text-xs whitespace-nowrap"
                              >
                                {loadingAction === `reject-user-${u._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Reject
                              </button>
                            </div>
                          );
                        } else if (isApproved) {
                          return (
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <button
                                onClick={() => handleSuspendUser(u._id)}
                                disabled={loadingAction === `suspend-user-${u._id}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-gray-200 px-3 py-1.5 text-gray-900 hover:bg-gray-300 disabled:opacity-50 text-xs whitespace-nowrap"
                              >
                                {loadingAction === `suspend-user-${u._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <PauseCircle className="w-3 h-3" />} Suspend
                              </button>
                              <button
                                onClick={() => handleRejectUser(u._id)}
                                disabled={loadingAction === `reject-user-${u._id}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50 text-xs whitespace-nowrap"
                              >
                                {loadingAction === `reject-user-${u._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Reject
                              </button>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <button
                                onClick={() => handleApproveUser(u._id)}
                                disabled={loadingAction === `approve-user-${u._id}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-white hover:bg-green-700 disabled:opacity-50 text-xs whitespace-nowrap"
                              >
                                {loadingAction === `approve-user-${u._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                              </button>
                              <button
                                onClick={() => handleRejectUser(u._id)}
                                disabled={loadingAction === `reject-user-${u._id}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50 text-xs whitespace-nowrap"
                              >
                                {loadingAction === `reject-user-${u._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Reject
                              </button>
                            </div>
                          );
                        }
                      })()}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );

    return (
      <div>
        <SectionHeader title="User Management" action={
          <button onClick={() => fetchUsers()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">
            {loadingUsers ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Refresh
          </button>
        } />

        {/* Type Filter Buttons */}
        <div className="mb-6 rounded-xl bg-white shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setUserTypeFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                userTypeFilter === 'all' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Users ({allUsers.length})
            </button>
            <button
              onClick={() => setUserTypeFilter('student')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                userTypeFilter === 'student' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              }`}
            >
              <User className="w-4 h-4" />
              Students ({students.length})
              <span className="text-xs opacity-75">({pendingStudents.length} pending)</span>
            </button>
            <button
              onClick={() => setUserTypeFilter('employer')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                userTypeFilter === 'employer' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Employers ({employers.length})
              <span className="text-xs opacity-75">({pendingEmployers.length} pending)</span>
            </button>
            <button
              onClick={() => setUserTypeFilter('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                userTypeFilter === 'admin' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admins ({admins.length})
              <span className="text-xs opacity-75">({pendingAdmins.length} pending)</span>
            </button>
          </div>
        </div>

        {/* Pending Approvals Section */}
        {displayedPendingUsers.length > 0 && (
          <div className="mb-6 rounded-xl bg-white shadow-sm p-5 border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Pending Approvals ({displayedPendingUsers.length})
            </h3>
            {renderUserTable(displayedPendingUsers, true, true)}
          </div>
        )}

        {/* All Users Section */}
        <div className="rounded-xl bg-white shadow-sm p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            {userTypeFilter === 'all' ? 'All Users' : 
             userTypeFilter === 'student' ? 'Students' :
             userTypeFilter === 'employer' ? 'Employers' : 'Admins'}
            <span className="text-sm font-normal text-gray-500">
              ({displayedUsers.length} total)
            </span>
          </h3>
          {renderUserTable(displayedUsers, true, true)}
        </div>
      </div>
    );
  }

  function renderJobs(): React.JSX.Element {
    // Separate pending jobs from approved/rejected jobs
    const pendingJobs = jobs.filter(j => j.approvalStatus === 'pending' || !j.approvalStatus);
    const approvedJobs = jobs.filter(j => j.approvalStatus === 'approved');
    const rejectedJobs = jobs.filter(j => j.approvalStatus === 'rejected');
    
    // Filter jobs based on selected filter
    const getFilteredJobs = () => {
      switch (jobFilter) {
        case 'approved':
          return approvedJobs;
        case 'rejected':
          return rejectedJobs;
        case 'pending':
          return pendingJobs;
        default:
          return jobs;
      }
    };
    
    const displayedJobs = getFilteredJobs();

    return (
      <div>
        <SectionHeader title="Job Management" action={
          <button onClick={() => fetchJobs()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">
            {loadingJobs ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Refresh
          </button>
        } />

        {/* Pending Approval Section */}
        {pendingJobs.length > 0 && (
          <div className="mb-6 rounded-xl bg-white shadow-sm p-5 border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Pending Approval ({pendingJobs.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Company</th>
                    <th className="py-2 pr-4">Location</th>
                    <th className="py-2 pr-4">Apps</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingJobs.map((j) => (
                    <tr key={j._id} className="align-top border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium text-gray-900">{j.title || 'Untitled'}</td>
                      <td className="py-3 pr-4 text-gray-700">{j.company || '-'}</td>
                      <td className="py-3 pr-4">{j.location || '-'}</td>
                      <td className="py-3 pr-4">{typeof j.applicationsCount === 'number' ? j.applicationsCount : '-'}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleApproveJob(j._id)}
                            disabled={loadingAction === `approve-job-${j._id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-white hover:bg-green-700 disabled:opacity-50 text-xs"
                          >
                            {loadingAction === `approve-job-${j._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                          </button>
                          <button
                            onClick={() => handleRejectJob(j._id)}
                            disabled={loadingAction === `reject-job-${j._id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50 text-xs"
                          >
                            {loadingAction === `reject-job-${j._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Jobs Section */}
        <div className="rounded-xl bg-white shadow-sm p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            All Jobs ({jobs.length})
          </h3>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setJobFilter('all')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                jobFilter === 'all' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({jobs.length})
            </button>
            <button
              onClick={() => setJobFilter('approved')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                jobFilter === 'approved' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Approved ({approvedJobs.length})
            </button>
            <button
              onClick={() => setJobFilter('rejected')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                jobFilter === 'rejected' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Rejected ({rejectedJobs.length})
            </button>
            <button
              onClick={() => setJobFilter('pending')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                jobFilter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              Pending ({pendingJobs.length})
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Apps</th>
                  <th className="py-2 pr-4">Approval Status</th>
                  <th className="py-2 pr-4">Job Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedJobs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500">No jobs found</td>
                  </tr>
                )}
                {displayedJobs.map((j) => (
                  <tr key={j._id} className="align-top border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium text-gray-900">{j.title || 'Untitled'}</td>
                    <td className="py-3 pr-4 text-gray-700">{j.company || '-'}</td>
                    <td className="py-3 pr-4">{j.location || '-'}</td>
                    <td className="py-3 pr-4">{typeof j.applicationsCount === 'number' ? j.applicationsCount : '-'}</td>
                    <td className="py-3 pr-4">
                      {j.approvalStatus === 'approved' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </span>
                      ) : j.approvalStatus === 'rejected' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 capitalize">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        j.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        j.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {j.status || 'unknown'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {j.approvalStatus === 'pending' || !j.approvalStatus ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleApproveJob(j._id)}
                            disabled={loadingAction === `approve-job-${j._id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-white hover:bg-green-700 disabled:opacity-50 text-xs"
                          >
                            {loadingAction === `approve-job-${j._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                          </button>
                          <button
                            onClick={() => handleRejectJob(j._id)}
                            disabled={loadingAction === `reject-job-${j._id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50 text-xs"
                          >
                            {loadingAction === `reject-job-${j._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No actions</span>
                      )}
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
    const handleApproveKYC = async (kycId: string, kycType: 'corporate' | 'local_business' | 'individual') => {
      try {
        setLoadingAction(`approve-${kycId}`);
        await apiService.approveEmployerKYCByType(kycId, kycType);
        alert('KYC approved successfully!');
        await fetchKYCData();
      } catch (error: any) {
        alert(error?.message || 'Failed to approve KYC');
      } finally {
        setLoadingAction(null);
      }
    };

    const handleRejectKYC = async (kycId: string, kycType: 'corporate' | 'local_business' | 'individual') => {
      const reason = prompt('Please provide a rejection reason:');
      if (!reason || !reason.trim()) {
        alert('Rejection reason is required');
        return;
      }
      try {
        setLoadingAction(`reject-${kycId}`);
        await apiService.rejectEmployerKYCByType(kycId, kycType, reason);
        alert('KYC rejected successfully!');
        await fetchKYCData();
      } catch (error: any) {
        alert(error?.message || 'Failed to reject KYC');
      } finally {
        setLoadingAction(null);
      }
    };

    return (
      <div>
        <SectionHeader title="KYC Management" action={
          <div className="flex gap-2">
            <select
              value={kycStatusFilter}
              onChange={(e) => {
                setKycStatusFilter(e.target.value as any);
                fetchKYCData();
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={() => fetchKYCData()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">
              Refresh KYC Data
            </button>
          </div>
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

        {/* Corporate Employer KYC */}
        <div className="rounded-xl bg-white shadow-sm p-5 mb-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Corporate Employer KYC</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
              {corporateKYC.length} Records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 pr-4">Company Name</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Submitted</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {corporateKYC.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">No Corporate KYC records found</td>
                  </tr>
                ) : (
                  corporateKYC.map((kyc) => (
                    <tr key={kyc._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-900">{kyc.companyName || 'N/A'}</td>
                      <td className="py-3 pr-4 text-gray-700">
                        {typeof kyc.employerId === 'object' ? kyc.employerId?.email : kyc.companyEmail || 'N/A'}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          kyc.status === 'approved' ? 'bg-green-100 text-green-800' :
                          kyc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {kyc.status || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{new Date(kyc.submittedAt || kyc.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedKYC(kyc);
                              setSelectedKYCType('corporate');
                              setShowKYCModal(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Local Business KYC */}
        <div className="rounded-xl bg-white shadow-sm p-5 mb-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Local Business KYC</h3>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
              {localBusinessKYC.length} Records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 pr-4">Business Name</th>
                  <th className="py-3 pr-4">Owner</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Submitted</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {localBusinessKYC.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">No Local Business KYC records found</td>
                  </tr>
                ) : (
                  localBusinessKYC.map((kyc) => (
                    <tr key={kyc._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-900">{kyc.businessName || 'N/A'}</td>
                      <td className="py-3 pr-4 text-gray-700">{kyc.ownerName || 'N/A'}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          kyc.status === 'approved' ? 'bg-green-100 text-green-800' :
                          kyc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {kyc.status || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{new Date(kyc.submittedAt || kyc.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedKYC(kyc);
                              setSelectedKYCType('local_business');
                              setShowKYCModal(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Individual KYC */}
        <div className="rounded-xl bg-white shadow-sm p-5 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Individual Employer KYC</h3>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
              {individualKYC.length} Records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 pr-4">Full Name</th>
                  <th className="py-3 pr-4">Aadhaar</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Submitted</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {individualKYC.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">No Individual KYC records found</td>
                  </tr>
                ) : (
                  individualKYC.map((kyc) => (
                    <tr key={kyc._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-900">{kyc.fullName || 'N/A'}</td>
                      <td className="py-3 pr-4 text-gray-700">{kyc.aadhaarNumber ? `${kyc.aadhaarNumber.substring(0, 4)}****${kyc.aadhaarNumber.substring(kyc.aadhaarNumber.length - 4)}` : 'N/A'}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          kyc.status === 'approved' ? 'bg-green-100 text-green-800' :
                          kyc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {kyc.status || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{new Date(kyc.submittedAt || kyc.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedKYC(kyc);
                              setSelectedKYCType('individual');
                              setShowKYCModal(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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

    const handleApproveFromModal = async () => {
      try {
        setLoadingAction('approve-kyc');
        if (selectedKYCType === 'corporate' || selectedKYCType === 'local_business' || selectedKYCType === 'individual') {
          await apiService.approveEmployerKYCByType(selectedKYC._id, selectedKYCType);
        } else {
          await apiService.approveKYC(selectedKYC._id);
        }
        alert('KYC approved successfully!');
        await fetchKYCData();
        setShowKYCModal(false);
      } catch (error: any) {
        alert(`Failed to approve KYC: ${error.message || 'Unknown error'}`);
      } finally {
        setLoadingAction(null);
      }
    };

    const handleRejectFromModal = async () => {
      const reason = prompt('Enter rejection reason:');
      if (!reason || !reason.trim()) {
        alert('Rejection reason is required');
        return;
      }
      try {
        setLoadingAction('reject-kyc');
        if (selectedKYCType === 'corporate' || selectedKYCType === 'local_business' || selectedKYCType === 'individual') {
          await apiService.rejectEmployerKYCByType(selectedKYC._id, selectedKYCType, reason);
        } else {
          await apiService.rejectKYC(selectedKYC._id, reason);
        }
        alert('KYC rejected successfully!');
        await fetchKYCData();
        setShowKYCModal(false);
      } catch (error: any) {
        alert(`Failed to reject KYC: ${error.message || 'Unknown error'}`);
      } finally {
        setLoadingAction(null);
      }
    };

    const kycStatus = selectedKYC.status || selectedKYC.verificationStatus || 'pending';
    const canApprove = kycStatus !== 'approved';
    const canReject = kycStatus !== 'rejected';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedKYCType === 'corporate' ? 'Corporate Employer KYC Details' :
                   selectedKYCType === 'local_business' ? 'Local Business KYC Details' :
                   selectedKYCType === 'individual' ? 'Individual Employer KYC Details' :
                   'Student KYC Details'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Status: <span className={`font-semibold capitalize ${
                    kycStatus === 'approved' ? 'text-green-600' :
                    kycStatus === 'rejected' ? 'text-red-600' :
                    kycStatus === 'suspended' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {kycStatus}
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
            {/* Corporate Employer KYC Details */}
            {selectedKYCType === 'corporate' && (
              <>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailField label="Company Name" value={selectedKYC.companyName || 'N/A'} />
                    <DetailField label="Business Registration Type" value={selectedKYC.businessRegistrationType || 'N/A'} />
                    <DetailField label="GST Number" value={selectedKYC.GSTNumber || selectedKYC.gstNumber || 'N/A'} />
                    <DetailField label="Business Registration No" value={selectedKYC.businessRegNo || 'N/A'} />
                    <DetailField label="Company Email" value={selectedKYC.companyEmail || 'N/A'} />
                    <DetailField label="Company Phone" value={selectedKYC.companyPhone || 'N/A'} />
                    <DetailField label="Website" value={selectedKYC.website || 'N/A'} />
                    <DetailField label="Address" value={selectedKYC.address || 'N/A'} />
                    <DetailField label="City" value={selectedKYC.city || 'N/A'} />
                    <DetailField label="PIN Code" value={selectedKYC.pinCode || 'N/A'} />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Admin Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailField label="Admin Name" value={selectedKYC.authorizedName || selectedKYC.fullName || selectedKYC.adminName || 'N/A'} />
                    <DetailField label="Admin Email" value={selectedKYC.adminEmail || 'N/A'} />
                    <DetailField label="Admin Phone" value={selectedKYC.adminPhone || 'N/A'} />
                    <DetailField label="Designation" value={selectedKYC.designation || 'N/A'} />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedKYC.documents?.companyProof?.url && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Registration Certificate</p>
                        <img src={selectedKYC.documents.companyProof.url} alt="Registration Certificate" className="w-full h-48 object-contain border border-gray-200 rounded" />
                        <a href={selectedKYC.documents.companyProof.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                          <Download className="w-4 h-4" /> View Full Size
                        </a>
                      </div>
                    )}
                    {selectedKYC.documents?.idProof?.url && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Director/Owner ID Proof</p>
                        <img src={selectedKYC.documents.idProof.url} alt="ID Proof" className="w-full h-48 object-contain border border-gray-200 rounded" />
                        <a href={selectedKYC.documents.idProof.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                          <Download className="w-4 h-4" /> View Full Size
                        </a>
                      </div>
                    )}
                    {(selectedKYC.documents?.gstDoc?.url || selectedKYC.documents?.gstCertificateUrl) && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">GST Certificate</p>
                        <img src={selectedKYC.documents?.gstDoc?.url || selectedKYC.documents?.gstCertificateUrl} alt="GST Certificate" className="w-full h-48 object-contain border border-gray-200 rounded" />
                        <a href={selectedKYC.documents?.gstDoc?.url || selectedKYC.documents?.gstCertificateUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                          <Download className="w-4 h-4" /> View Full Size
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Local Business KYC Details */}
            {selectedKYCType === 'local_business' && (
              <>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailField label="Business Name" value={selectedKYC.businessName || 'N/A'} />
                    <DetailField label="Business Type" value={selectedKYC.businessType || 'N/A'} />
                    <DetailField label="Owner Name" value={selectedKYC.ownerName || 'N/A'} />
                    <DetailField label="Owner Email" value={selectedKYC.ownerEmail || 'N/A'} />
                    <DetailField label="Owner Phone" value={selectedKYC.ownerPhone || 'N/A'} />
                    <DetailField label="Address" value={selectedKYC.address || 'N/A'} />
                    <DetailField label="City" value={selectedKYC.city || 'N/A'} />
                    <DetailField label="PIN Code" value={selectedKYC.pinCode || 'N/A'} />
                    <DetailField label="Location Pin" value={selectedKYC.locationPin || 'N/A'} />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedKYC.documents?.shopPhotoUrl && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Shop Photo</p>
                        <img src={selectedKYC.documents.shopPhotoUrl} alt="Shop Photo" className="w-full h-48 object-contain border border-gray-200 rounded" />
                        <a href={selectedKYC.documents.shopPhotoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                          <Download className="w-4 h-4" /> View Full Size
                        </a>
                      </div>
                    )}
                    {selectedKYC.documents?.businessLicenseUrl && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Business License</p>
                        <img src={selectedKYC.documents.businessLicenseUrl} alt="Business License" className="w-full h-48 object-contain border border-gray-200 rounded" />
                        <a href={selectedKYC.documents.businessLicenseUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                          <Download className="w-4 h-4" /> View Full Size
                        </a>
                      </div>
                    )}
                    {selectedKYC.documents?.ownerIdProofUrl && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Owner ID Proof</p>
                        <img src={selectedKYC.documents.ownerIdProofUrl} alt="Owner ID Proof" className="w-full h-48 object-contain border border-gray-200 rounded" />
                        <a href={selectedKYC.documents.ownerIdProofUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                          <Download className="w-4 h-4" /> View Full Size
                        </a>
                      </div>
                    )}
                    {selectedKYC.documents?.tradeLicenseUrl && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Trade License</p>
                        <img src={selectedKYC.documents.tradeLicenseUrl} alt="Trade License" className="w-full h-48 object-contain border border-gray-200 rounded" />
                        <a href={selectedKYC.documents.tradeLicenseUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                          <Download className="w-4 h-4" /> View Full Size
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Individual KYC Details */}
            {selectedKYCType === 'individual' && (
              <>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailField label="Full Name" value={selectedKYC.fullName || 'N/A'} />
                    <DetailField label="Aadhaar Number" value={selectedKYC.aadhaarNumber ? `${selectedKYC.aadhaarNumber.substring(0, 4)}****${selectedKYC.aadhaarNumber.substring(selectedKYC.aadhaarNumber.length - 4)}` : 'N/A'} />
                    <DetailField label="Address" value={selectedKYC.address || 'N/A'} />
                    <DetailField label="City" value={selectedKYC.city || 'N/A'} />
                    <DetailField label="PIN Code" value={selectedKYC.pinCode || 'N/A'} />
                    <DetailField label="Location Pin" value={selectedKYC.locationPin || 'N/A'} />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedKYC.aadhaarFrontUrl && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Aadhaar Front</p>
                        <img src={selectedKYC.aadhaarFrontUrl} alt="Aadhaar Front" className="w-full h-48 object-contain border border-gray-200 rounded" />
                        <a href={selectedKYC.aadhaarFrontUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                          <Download className="w-4 h-4" /> View Full Size
                        </a>
                      </div>
                    )}
                    {selectedKYC.aadhaarBackUrl && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Aadhaar Back</p>
                        <img src={selectedKYC.aadhaarBackUrl} alt="Aadhaar Back" className="w-full h-48 object-contain border border-gray-200 rounded" />
                        <a href={selectedKYC.aadhaarBackUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                          <Download className="w-4 h-4" /> View Full Size
                        </a>
                      </div>
                    )}
                    {selectedKYC.selfieUrl && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Selfie</p>
                        <img src={selectedKYC.selfieUrl} alt="Selfie" className="w-full h-48 object-contain border border-gray-200 rounded" />
                        <a href={selectedKYC.selfieUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                          <Download className="w-4 h-4" /> View Full Size
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Student KYC Details */}
            {selectedKYCType === 'student' && (
              <>
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
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailField label="College" value={selectedKYC.college || 'N/A'} />
                    <DetailField label="Course & Year" value={selectedKYC.courseYear || 'N/A'} />
                    <DetailField label="Student ID" value={selectedKYC.studentId || 'N/A'} />
                  </div>
                </div>

                {/* Stay & Availability (for students) */}
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
                {selectedKYC.preferredJobTypes && selectedKYC.preferredJobTypes.length > 0 && (
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
                {selectedKYC.payroll && (
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
              </>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              {canApprove && (
                <button
                  onClick={handleApproveFromModal}
                  disabled={loadingAction === 'approve-kyc'}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {loadingAction === 'approve-kyc' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Approve KYC
                </button>
              )}
              {canReject && (
                <button
                  onClick={handleRejectFromModal}
                  disabled={loadingAction === 'reject-kyc'}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loadingAction === 'reject-kyc' ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  Reject KYC
                </button>
              )}
              {!canApprove && !canReject && (
                <div className="flex-1 text-center text-gray-500 py-2">
                  KYC is already {kycStatus}
                </div>
              )}
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


