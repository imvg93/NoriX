'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import {
  calculateEmployerDashboardStats,
  EmployerDashboardStats,
  normalizeEmployerApplication,
  normalizeEmployerJob,
} from '@/utils/employerDataUtils';
import { 
  Briefcase, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  Eye,
  Edit,
  UserCheck,
  XCircle,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';

type EmployerCategory = 'corporate' | 'local_business' | 'individual';

interface EmployerDashboardContentProps {
  employerType: EmployerCategory;
  kycStatus?: 'not-submitted' | 'pending' | 'approved' | 'rejected' | 'suspended';
}

const getKycPageUrl = (type: EmployerCategory): string => {
  const map: Record<EmployerCategory, string> = {
    'corporate': '/employer/kyc/corporate',
    'local_business': '/employer/kyc/local',
    'individual': '/employer/kyc/individual'
  };
  return map[type];
};

export default function EmployerDashboardContent({ employerType, kycStatus }: EmployerDashboardContentProps) {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showKycPrompt, setShowKycPrompt] = useState(false);
  const [kycPromptMessage, setKycPromptMessage] = useState('');
  const [kycRejectionReason, setKycRejectionReason] = useState<string | null>(null);
  
  // Real data states
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<EmployerDashboardStats>(() => calculateEmployerDashboardStats([], []));

  const normalizeStatus = (status?: string | null): 'not-submitted' | 'pending' | 'approved' | 'rejected' | 'suspended' => {
    if (!status) return 'not-submitted';
    const normalized = status.replace(/_/g, '-').toLowerCase();
    if (normalized === 'approved' || normalized === 'pending' || normalized === 'rejected' || normalized === 'not-submitted' || normalized === 'suspended') {
      return normalized as 'not-submitted' | 'pending' | 'approved' | 'rejected' | 'suspended';
    }
    return 'not-submitted';
  };

  const handleOpenKycPage = () => {
    setShowKycPrompt(false);
    router.push(getKycPageUrl(employerType));
  };

  const handleDismissKycPrompt = () => {
    setShowKycPrompt(false);
  };

  useEffect(() => {
    const init = async () => {
      if (!user || user.userType !== 'employer' || !user._id) return;

      try {
        setLoading(true);

        const employerId = user._id as string;

        // 1) Fetch KYC status
        try {
          const res = await apiService.getEmployerKYCStatus(employerId);
          const normalized = normalizeStatus(res?.status || res?.user?.kycStatus);
          setKycRejectionReason(res?.kyc?.rejectionReason || null);
          if (user?.kycStatus !== normalized) {
            updateUser({ kycStatus: normalized as any });
          }

          if (normalized === 'approved') {
            setShowKycPrompt(false);
          } else if (normalized === 'pending') {
            setKycPromptMessage('Your KYC is pending approval. You will be notified once it is reviewed.');
            setShowKycPrompt(true);
          } else if (normalized === 'suspended') {
            setKycPromptMessage('Your KYC has been suspended. Please contact support for assistance.');
            setShowKycPrompt(true);
          } else if (normalized === 'rejected') {
            const rejectionMessage = res?.kyc?.rejectionReason
              ? `Reason: ${res.kyc.rejectionReason}`
              : 'Please review your details and resubmit the correct documents.';
            setKycPromptMessage(`Your KYC was rejected. ${rejectionMessage}`);
            setShowKycPrompt(true);
          } else {
            setKycPromptMessage('Please complete your KYC to continue.');
            setShowKycPrompt(true);
          }
        } catch (e) {
          console.error('❌ Error loading KYC status:', e);
          const fallbackStatus: 'not-submitted' = 'not-submitted';
          if (user?.kycStatus !== fallbackStatus) {
            updateUser({ kycStatus: fallbackStatus as any });
          }
          setKycPromptMessage('Please complete your KYC to continue.');
          setShowKycPrompt(true);
        }

        // 2) Fetch employer jobs list
        let normalizedJobs: any[] = [];
        try {
          const jobsResponse = await apiService.getEmployerJobsList(1, 1000);
          const jobsRaw = jobsResponse?.jobs || [];
          
          if (jobsRaw.length === 0) {
            setJobs([]);
          } else {
            normalizedJobs = jobsRaw
              .map((job: any) => normalizeEmployerJob(job))
              .filter((job: any) => !!job && !!job._id);
            setJobs(normalizedJobs);
          }
        } catch (e) {
          console.error('❌ Error loading jobs:', e);
          setJobs([]);
        }

        // 3) Fetch employer applications
        let normalizedApplications: any[] = [];
        try {
          const applicationsResponse = await apiService.getEmployerApplicationsForEmployer(employerId, 1, 1000);
          const applicationsRaw = applicationsResponse?.applications || [];
          normalizedApplications = applicationsRaw
            .map((app: any) => normalizeEmployerApplication(app))
            .filter((app: any) => !!app);
          setApplications(normalizedApplications);
        } catch (e) {
          console.error('❌ Error loading applications:', e);
        }

        // 4) Calculate stats
        const computedStats = calculateEmployerDashboardStats(normalizedJobs, normalizedApplications);
        setStats(computedStats);
      } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, updateUser]);

  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await apiService.approveApplication(applicationId);
        alert('Application approved successfully!');
      } else {
        await apiService.rejectApplication(applicationId);
        alert('Application rejected.');
      }
      
      // Refresh applications data
      if (!user?._id) {
        throw new Error('Unable to refresh applications without a valid employer id');
      }
      const applicationsResponse = await apiService.getEmployerApplicationsForEmployer(user._id);
      const updatedApplications = (applicationsResponse.applications || [])
        .map((app: any) => normalizeEmployerApplication(app))
        .filter((app: any) => !!app);
      setApplications(updatedApplications);
      
      // Update stats
      const updatedStats = calculateEmployerDashboardStats(jobs, updatedApplications);
      setStats(updatedStats);
      
    } catch (error: any) {
      console.error('Error updating application:', error);
      alert(error?.message || 'Failed to update application');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Type-specific messaging
  const typeMessages = {
    corporate: {
      title: 'Corporate Dashboard',
      subtitle: 'Manage your talent acquisition pipeline',
      postJobLabel: 'Post New Job',
      kycLabel: 'Complete Corporate KYC'
    },
    local_business: {
      title: 'Business Dashboard',
      subtitle: 'Find and manage local talent',
      postJobLabel: 'Post Part-time Job',
      kycLabel: 'Complete Business KYC'
    },
    individual: {
      title: 'Task Dashboard',
      subtitle: 'Manage your tasks and helpers',
      postJobLabel: 'Post a Task',
      kycLabel: 'Complete Individual KYC'
    }
  };

  const messages = typeMessages[employerType];

  // Stats cards configuration
  const statsCards = [
    {
      label: 'Total Jobs',
      value: stats.totalJobs,
      icon: Briefcase,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100'
    },
    {
      label: 'Applications',
      value: stats.totalApplications,
      icon: FileText,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100'
    },
    {
      label: 'Pending',
      value: stats.pendingApplications,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100'
    },
    {
      label: 'Approved',
      value: stats.approvedApplications,
      icon: CheckCircle2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index}
              className="bg-white rounded-lg sm:rounded-xl border-2 border-gray-100 p-3 sm:p-5 hover:border-gray-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className={`${stat.bgColor} p-2 sm:p-2.5 rounded-lg group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1">{stat.value}</div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Pending Jobs Alert */}
          {Array.isArray(jobs) && jobs.filter(j => (j.approvalStatus || '').toLowerCase() === 'pending').length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg sm:rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-amber-100 p-1.5 sm:p-2 rounded-lg">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Jobs Pending Approval</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                    {jobs.filter(j => (j.approvalStatus || '').toLowerCase() === 'pending').length} job(s) are awaiting admin approval.
                  </p>
                  <button
                    onClick={() => setActiveTab('myJobs')}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-amber-700 transition-colors"
                  >
                    Review Jobs
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recent Applications */}
          <div className="bg-white rounded-lg sm:rounded-xl border-2 border-gray-100 shadow-sm">
            <div className="p-4 sm:p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Recent Applications</h3>
                <Link 
                  href="/employer/applications"
                  className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              {applications.slice(0, 5).length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {applications.slice(0, 5).map((app) => {
                    const studentInfo = app.student || app.studentId || {};
                    const status = (app.status || '').toLowerCase();
                    const statusConfig = {
                      'applied': { color: 'bg-blue-100 text-blue-700', label: 'Applied' },
                      'pending': { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
                      'approved': { color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
                      'accepted': { color: 'bg-emerald-100 text-emerald-700', label: 'Accepted' },
                      'rejected': { color: 'bg-red-100 text-red-700', label: 'Rejected' }
                    };
                    const currentStatus = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-700', label: status };
                    const appliedAt = app.appliedAt || app.appliedDate || app.createdAt;
                    const appliedLabel = appliedAt ? new Date(appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';

                    return (
                      <div 
                        key={app._id} 
                        className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => router.push(`/employer/applications/${app._id}`)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="bg-white p-1.5 sm:p-2 rounded-lg shadow-sm">
                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{studentInfo.name || 'Unknown Student'}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3" />
                              {appliedLabel}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${currentStatus.color}`}>
                            {currentStatus.label}
                          </span>
                          <button className="p-1.5 sm:p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="bg-gray-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <p className="text-sm sm:text-base text-gray-500 font-medium">No applications yet</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Applications will appear here once candidates apply</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg sm:rounded-xl border-2 border-gray-100 shadow-sm">
            <div className="p-4 sm:p-5 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-4 sm:p-5 space-y-2.5 sm:space-y-3">
              {kycStatus === 'approved' ? (
                <Link 
                  href="/employer/post-job"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  {messages.postJobLabel}
                </Link>
              ) : (
                <button 
                  onClick={handleOpenKycPage}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-gray-300 transition-colors cursor-not-allowed"
                  disabled
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  {messages.postJobLabel}
                </button>
              )}
              <Link 
                href="/employer/applications"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Review Applications
              </Link>
              {kycStatus !== 'approved' && (
                <button 
                  onClick={handleOpenKycPage}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-white border-2 border-amber-200 text-amber-700 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-amber-50 transition-all"
                >
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  {kycStatus === 'pending' || kycStatus === 'suspended' ? 'View KYC Status' : messages.kycLabel}
                </button>
              )}
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-100 rounded-lg sm:rounded-xl p-4 sm:p-5">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="bg-indigo-100 p-1.5 sm:p-2 rounded-lg">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Pro Tip</h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Use clear, specific job titles and include 3–5 key requirements to attract better-matched candidates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMyJobs = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Jobs</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Manage your job postings</p>
        </div>
        {kycStatus === 'approved' && (
          <Link
            href="/employer/post-job"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Post New Job</span>
            <span className="sm:hidden">New</span>
          </Link>
        )}
      </div>

      {jobs.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {jobs.map((job) => {
            const status = (job.status || '').toLowerCase();
            const approvalStatus = (job.approvalStatus || '').toLowerCase();
            
            return (
              <div key={job._id} className="bg-white rounded-lg sm:rounded-xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2">
                        {job.jobTitle || job.title || 'Untitled Role'}
                      </h3>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="truncate">{job.location || 'Location not specified'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                      status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      status === 'paused' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {status || 'Pending'}
                    </span>
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                      approvalStatus === 'approved' ? 'bg-blue-100 text-blue-700' :
                      approvalStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {approvalStatus === 'approved' ? 'Approved' : approvalStatus === 'pending' ? 'Pending Review' : 'Rejected'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl mb-3 sm:mb-4">
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-indigo-600">{job.applicationsCount || 0}</div>
                      <div className="text-xs text-gray-500 mt-0.5 sm:mt-1">Applications</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-blue-600 truncate text-xs sm:text-base">{job.location?.split(',')[0] || 'N/A'}</div>
                      <div className="text-xs text-gray-500 mt-0.5 sm:mt-1">Location</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-gray-600 text-xs sm:text-base">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 sm:mt-1">Posted</div>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-3">
                    <button className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-200 transition-colors">
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Edit
                    </button>
                    <button 
                      onClick={() => setActiveTab('applications')}
                      className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">View ({job.applicationsCount || 0})</span>
                      <span className="sm:hidden">({job.applicationsCount || 0})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg sm:rounded-xl border-2 border-gray-100 shadow-sm p-8 sm:p-12 text-center">
          <div className="bg-gray-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">No jobs posted yet</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Start by posting your first job opportunity</p>
          {kycStatus === 'approved' && (
            <Link
              href="/employer/post-job"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              Post Your First Job
            </Link>
          )}
        </div>
      )}
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Applications</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Review and manage candidate applications</p>
        </div>
      </div>

      {applications.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {applications.map((app) => {
            const jobInfo = app.job && typeof app.job === 'object' ? app.job : {};
            const studentInfo = app.student || app.studentId || {};
            const status = (app.status || '').toLowerCase();
            const statusConfig = {
              'applied': { color: 'bg-blue-100 text-blue-700', label: 'Applied' },
              'pending': { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
              'approved': { color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
              'accepted': { color: 'bg-emerald-100 text-emerald-700', label: 'Accepted' },
              'rejected': { color: 'bg-red-100 text-red-700', label: 'Rejected' }
            };
            const currentStatus = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-700', label: status };
            const appliedAt = app.appliedAt || app.appliedDate || app.createdAt;
            const appliedLabel = appliedAt ? new Date(appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

            return (
              <div key={app._id} className="bg-white rounded-lg sm:rounded-xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2">
                        {jobInfo.jobTitle || jobInfo.title || 'Job Opportunity'}
                      </h3>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="truncate">{studentInfo.name || 'Candidate'}</span>
                      </div>
                      {studentInfo.email && (
                        <p className="text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">{studentInfo.email}</p>
                      )}
                    </div>
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${currentStatus.color} flex-shrink-0`}>
                      {currentStatus.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-100">
                    <Calendar className="h-3 w-3" />
                    <span>Applied on {appliedLabel}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-200 transition-colors">
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      View Profile
                    </button>
                    {status === 'applied' || status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApplicationAction(app._id, 'approve')}
                          className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition-colors"
                        >
                          <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApplicationAction(app._id, 'reject')}
                          className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg sm:rounded-xl border-2 border-gray-100 shadow-sm p-8 sm:p-12 text-center">
          <div className="bg-gray-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">No applications yet</h3>
          <p className="text-sm sm:text-base text-gray-500">Applications from candidates will appear here</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* KYC Prompt */}
      {showKycPrompt && (
        <div className="mb-4 sm:mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="bg-amber-100 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">KYC Verification Required</h3>
              <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 leading-relaxed">{kycPromptMessage}</p>
              {kycRejectionReason && (
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-red-800 leading-relaxed">
                    <strong>Rejection Reason:</strong> {kycRejectionReason}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                {kycStatus === 'pending' && (
                  <button
                    onClick={handleDismissKycPrompt}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Dismiss
                  </button>
                )}
                <button
                  onClick={handleOpenKycPage}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg sm:rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  {kycStatus === 'rejected' ? 'Resubmit KYC' : kycStatus === 'suspended' ? 'View KYC Status' : messages.kycLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Navigation Tabs */}
      <div className="bg-white rounded-lg sm:rounded-xl border-2 border-gray-100 shadow-sm mb-4 sm:mb-6 overflow-hidden">
        <nav className="flex space-x-1 p-1.5 sm:p-2">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'myJobs', label: 'My Jobs', icon: Briefcase },
            { id: 'applications', label: 'Applications', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'myJobs' && renderMyJobs()}
        {activeTab === 'applications' && renderApplications()}
      </div>
    </>
  );
}
