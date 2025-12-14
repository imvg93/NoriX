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

        // 2) Fetch employer jobs list (NOT by ID)
        let normalizedJobs: any[] = [];
        try {
          // Fetch job LIST first - does NOT call /jobs/:jobId
          const jobsResponse = await apiService.getEmployerJobsList(1, 1000);
          const jobsRaw = jobsResponse?.jobs || [];
          
          if (jobsRaw.length === 0) {
            // No jobs posted yet - show empty state, do NOT call getJobDetails
            console.log('📊 No jobs posted yet');
            setJobs([]);
          } else {
            // Only normalize jobs that exist - do NOT fetch individual job details
            normalizedJobs = jobsRaw
              .map((job: any) => normalizeEmployerJob(job))
              .filter((job: any) => !!job && !!job._id); // Ensure job has valid ID
            setJobs(normalizedJobs);
            console.log('📊 Loaded', normalizedJobs.length, 'jobs from list');
          }
        } catch (e) {
          console.error('❌ Error loading jobs:', e);
          setJobs([]); // Set empty array on error
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Type-specific messaging
  const typeMessages = {
    corporate: {
      title: 'Corporate Employer Overview',
      subtitle: 'Manage jobs, applications and company information',
      postJobLabel: 'Post Corporate Job',
      kycLabel: 'Complete Corporate KYC'
    },
    local_business: {
      title: 'Local Business Overview',
      subtitle: 'Find local talent for your business',
      postJobLabel: 'Post Part-time Job',
      kycLabel: 'Complete Business KYC'
    },
    individual: {
      title: 'Individual Employer Overview',
      subtitle: 'Post tasks and find help nearby',
      postJobLabel: 'Post a Task',
      kycLabel: 'Complete Individual KYC'
    }
  };

  const messages = typeMessages[employerType];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 border border-gray-200 rounded-xl p-4 sm:p-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{messages.title}</h2>
          <p className="text-sm text-gray-600">{messages.subtitle}</p>
        </div>
        <div className="hidden sm:flex gap-2">
          {kycStatus === 'approved' ? (
            <Link href="/employer/post-job" className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">{messages.postJobLabel}</Link>
          ) : (
            <button onClick={handleOpenKycPage} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">
              {kycStatus === 'pending' || kycStatus === 'suspended' ? 'View KYC Status' : messages.kycLabel}
            </button>
          )}
          <Link href="/employer/applications" className="px-3 py-2 bg-white border border-gray-300 text-gray-800 rounded-md text-sm hover:bg-gray-100">View Applications</Link>
        </div>
      </div>

      {/* 2-column layout: left content + right sidebar */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left (main) */}
        <div className="md:col-span-2 space-y-6">
          {/* Approval summary */}
          {Array.isArray(jobs) && jobs.filter(j => (j.approvalStatus || '').toLowerCase() === 'pending').length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Approval Pending</h3>
                <p className="text-sm text-yellow-700">
                  {jobs.filter(j => (j.approvalStatus || '').toLowerCase() === 'pending').length} job(s) are awaiting approval.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('myJobs')}
                className="text-sm bg-yellow-600 text-white px-3 py-1.5 rounded-md hover:bg-yellow-700"
              >
                Review Jobs
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-indigo-600">{stats.totalJobs}</div>
              <div className="text-sm text-gray-600">Total Jobs</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-green-600">{stats.totalApplications}</div>
              <div className="text-sm text-gray-600">Applications</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.pendingApplications}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.approvedApplications}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Applications</h3>
            {applications.slice(0, 5).length > 0 ? (
              <div className="space-y-2">
                {applications.slice(0, 5).map((app) => {
                  const studentInfo = app.student || app.studentId || {};
                  const status = (app.status || '').toLowerCase();
                  const statusClass =
                    status === 'applied' ? 'bg-blue-100 text-blue-800' :
                    status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    status === 'approved' || status === 'accepted' ? 'bg-green-100 text-green-800' :
                    status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800';
                  const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Status';
                  const appliedAt = app.appliedAt || app.appliedDate || app.createdAt;
                  const appliedLabel = appliedAt ? new Date(appliedAt).toLocaleDateString() : 'N/A';

                  return (
                    <div key={app._id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{studentInfo.name || 'Unknown Student'}</p>
                        <p className="text-xs text-gray-500">Applied: {appliedLabel}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                          {statusLabel}
                        </span>
                        <button onClick={() => router.push(`/employer/applications/${app._id}`)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">View</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No applications yet</p>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-3">
              {kycStatus === 'approved' ? (
                <Link href="/employer/post-job" className="w-full block bg-indigo-600 text-white py-2 px-4 rounded-md text-center hover:bg-indigo-700">{messages.postJobLabel}</Link>
              ) : (
                <button className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition" onClick={handleOpenKycPage}>{messages.postJobLabel} (KYC Required)</button>
              )}
              <Link href="/employer/applications" className="w-full block bg-green-600 text-white py-2 px-4 rounded-md text-center hover:bg-green-700">Review Applications</Link>
              {kycStatus !== 'approved' && (
                <button className="w-full bg-white border border-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-50" onClick={handleOpenKycPage}>
                  {kycStatus === 'pending' || kycStatus === 'suspended' ? 'View KYC Status' : messages.kycLabel}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Tips</h4>
            <p className="text-sm text-gray-600">Use clear job titles and add 3–5 key requirements for better matches.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMyJobs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {jobs.map((job) => (
        <div key={job._id} className="bg-white rounded-xl shadow border border-gray-200 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="text-base font-semibold text-gray-900">{job.jobTitle || job.title || 'Untitled Role'}</h4>
              <p className="text-xs text-gray-500">{job.companyName || job.company || 'Company'} • {job.location || 'Location not specified'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                (job.status || '').toLowerCase() === 'active' ? 'bg-green-100 text-green-800' :
                (job.status || '').toLowerCase() === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {job.status || 'pending'}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                (job.approvalStatus || '').toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                (job.approvalStatus || '').toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {(job.approvalStatus || 'pending')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-600 mb-3">
            <div>
              <div className="font-medium text-indigo-600">{job.applicationsCount || 0}</div>
              <div>Applications</div>
            </div>
            <div>
              <div className="font-medium text-blue-600">{job.location}</div>
              <div>Location</div>
            </div>
            <div>
              <div className="font-medium text-gray-600">{new Date(job.createdAt).toLocaleDateString()}</div>
              <div>Posted</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 text-xs bg-indigo-600 text-white py-1.5 px-2 rounded hover:bg-indigo-700">
              Edit
            </button>
            <button 
              onClick={() => setActiveTab('applications')}
              className="flex-1 text-xs bg-green-600 text-white py-1.5 px-2 rounded hover:bg-green-700"
            >
              View Apps ({job.applicationsCount || 0})
            </button>
          </div>
        </div>
      ))}
      {jobs.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No jobs posted yet</p>
          {kycStatus === 'approved' && (
            <Link href="/employer/post-job" className="mt-4 inline-block bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
              Post Your First Job
            </Link>
          )}
        </div>
      )}
    </div>
  );

  const renderApplications = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {applications.map((app) => {
        const jobInfo = app.job && typeof app.job === 'object' ? app.job : {};
        const studentInfo = app.student || app.studentId || {};
        const status = (app.status || '').toLowerCase();
        const statusClass =
          status === 'applied' ? 'bg-blue-100 text-blue-800' :
          status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          status === 'approved' || status === 'accepted' ? 'bg-green-100 text-green-800' :
          status === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800';
        const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Status';
        const appliedAt = app.appliedAt || app.appliedDate || app.createdAt;
        const appliedLabel = appliedAt ? new Date(appliedAt).toLocaleDateString() : 'N/A';

        return (
          <div key={app._id} className="bg-white rounded-xl shadow border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-base font-semibold text-gray-900">
                  {jobInfo.jobTitle || jobInfo.title || 'Job Opportunity'}
                </h4>
                <p className="text-xs text-gray-500">
                  {(studentInfo.name || 'Candidate')}
                  {studentInfo.email ? ` • ${studentInfo.email}` : ''}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                  {statusLabel}
                </span>
                <p className="text-xs text-gray-500 mt-1">Applied: {appliedLabel}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 text-xs bg-indigo-600 text-white py-1.5 px-2 rounded hover:bg-indigo-700">
                View Profile
              </button>
              {status === 'applied' || status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleApplicationAction(app._id, 'approve')}
                    className="flex-1 text-xs bg-green-600 text-white py-1.5 px-2 rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApplicationAction(app._id, 'reject')}
                    className="flex-1 text-xs bg-red-600 text-white py-1.5 px-2 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
      {applications.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No applications yet</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* KYC Prompt */}
      {showKycPrompt && (
        <div className="mb-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">KYC Verification Required</h3>
              <p className="text-sm text-gray-600 mb-2">{kycPromptMessage}</p>
              {kycRejectionReason && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800"><strong>Rejection Reason:</strong> {kycRejectionReason}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              {kycStatus === 'pending' && (
                <button
                  onClick={handleDismissKycPrompt}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Got it
                </button>
              )}
              <button
                onClick={handleOpenKycPage}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {kycStatus === 'rejected' ? 'Resubmit KYC' : kycStatus === 'suspended' ? 'View KYC Status' : messages.kycLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'myJobs', label: 'My Jobs', icon: '💼' },
            { id: 'applications', label: 'Applications', icon: '📝' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
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


