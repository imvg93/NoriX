'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface JobData {
  _id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  status: string;
  approvalStatus: string;
  applicationsCount: number;
  createdAt: string;
}

interface ApplicationData {
  _id: string;
  jobId: {
    _id: string;
    jobTitle: string;
    companyName: string;
    location: string;
  };
  studentId: {
    _id: string;
    name: string;
    email: string;
    skills: string[];
  };
  status: string;
  appliedAt: string;
  coverLetter?: string;
  expectedPay?: number;
}

export default function EmployerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<'not-submitted' | 'pending' | 'approved' | 'rejected' | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycForm, setKycForm] = useState<{ companyName: string; GSTNumber: string; PAN: string }>({
    companyName: '',
    GSTNumber: '',
    PAN: ''
  });
  const [showKycModal, setShowKycModal] = useState(false);
  
  // Real data states
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedJobs: 0
  });

  useEffect(() => {
    const init = async () => {
      if (!user || user.userType !== 'employer') return;
      
      try {
        setLoading(true);
        
        // Fetch KYC status
        try {
          const res = await apiService.getEmployerKYCStatus(user._id);
          setKycStatus((res?.status as 'not-submitted' | 'pending' | 'approved' | 'rejected' | null) || 'not-submitted');
        } catch (e) {
          console.error('❌ Error loading KYC status:', e);
          setKycStatus('not-submitted');
        }
        
        setKycForm(prev => ({ ...prev, companyName: (user as any).companyName || '' }));
        
        // Fetch jobs data
        try {
          const jobsResponse = await apiService.getEmployerDashboardJobs();
          const jobsData = jobsResponse.jobs || [];
          setJobs(jobsData);

          // Calculate stats
          const totalJobs = jobsData.length;
          const activeJobs = jobsData.filter((job: any) => job.status === 'active').length;
          const totalApplications = jobsData.reduce((sum: number, job: any) => sum + (job.applicationsCount || 0), 0);
          const approvedJobs = jobsData.filter((job: any) => (job.approvalStatus || '').toLowerCase() === 'approved').length;

          setStats({
            totalJobs,
            activeJobs,
            totalApplications,
            pendingApplications: 0, // Will be updated when we fetch applications
            approvedJobs
          });
        } catch (e) {
          console.error('❌ Error loading jobs:', e);
        }
        
        // Fetch applications data
        try {
          const applicationsResponse = await apiService.getEmployerApplications();
          const applicationsData = applicationsResponse.applications || [];
          setApplications(applicationsData);
          
          // Update pending applications count
          const pendingApplications = applicationsData.filter((app: any) => 
            app.status === 'applied' || app.status === 'pending'
          ).length;
          
          setStats(prev => ({
            ...prev,
            pendingApplications
          }));
        } catch (e) {
          console.error('❌ Error loading applications:', e);
        }
        
      } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [user]);

  const handleKycInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setKycForm(prev => ({ ...prev, [name]: value } as any));
  };

  const submitEmployerKYC = async () => {
    if (!user) return;
    try {
      setSubmittingKyc(true);
      await apiService.submitEmployerKYC({
        companyName: kycForm.companyName,
        GSTNumber: kycForm.GSTNumber || undefined,
        PAN: kycForm.PAN || undefined,
      });
      alert('KYC submitted. Status set to Pending.');
      setKycStatus('pending');
      setShowKycModal(false);
    } catch (e: any) {
      alert(e?.message || 'Failed to submit KYC');
    } finally {
      setSubmittingKyc(false);
    }
  };

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
      const applicationsResponse = await apiService.getEmployerApplications();
      setApplications(applicationsResponse.applications || []);
      
      // Update stats
      const pendingApplications = (applicationsResponse.applications || []).filter((app: any) => 
        app.status === 'applied' || app.status === 'pending'
      ).length;
      
      setStats(prev => ({
        ...prev,
        pendingApplications
      }));
      
    } catch (error: any) {
      console.error('Error updating application:', error);
      alert(error?.message || 'Failed to update application');
    }
  };

  const handleJobApproval = async (jobId: string) => {
    try {
      await apiService.approveEmployerJob(jobId);
      alert('Job approved successfully!');
      
      // Refresh jobs data
      const jobsResponse = await apiService.getEmployerDashboardJobs();
      setJobs(jobsResponse.jobs || []);
      
    } catch (error: any) {
      console.error('Error approving job:', error);
      alert(error?.message || 'Failed to approve job');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 border border-gray-200 rounded-xl p-4 sm:p-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Employer Overview</h2>
          <p className="text-sm text-gray-600">Manage jobs, applications and company information</p>
        </div>
        <div className="hidden sm:flex gap-2">
          <Link href="/employer/post-job" className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">Post Job</Link>
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
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-indigo-600">{stats.totalJobs}</div>
              <div className="text-sm text-gray-600">Total Jobs</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.activeJobs}</div>
              <div className="text-sm text-gray-600">Active Jobs</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{stats.totalApplications}</div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-emerald-600">{stats.approvedJobs}</div>
              <div className="text-sm text-gray-600">Approved Jobs</div>
            </div>
          </div>

          {/* Applications by Job */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Applications by Job</h3>
                <button
                  onClick={() => router.push('/employer/applications')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All Applications
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {(() => {
                const applicationsByJob = applications.reduce((acc: any, app: any) => {
                  const jobId = app.job?._id || app.jobId?._id || app.jobId;
                  const jobTitle = app.job?.title || app.jobId?.jobTitle || app.job?.jobTitle || 'Unknown Job';
                  if (!acc[jobId]) acc[jobId] = { jobTitle, applications: [] };
                  acc[jobId].applications.push(app);
                  return acc;
                }, {});

                const jobEntries = Object.entries(applicationsByJob);
                if (jobEntries.length === 0) {
                  return (
                    <div className="p-4 text-center text-gray-500">
                      <div className="mb-4">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h4>
                        <p className="text-gray-600 mb-2">You haven't received any applications for your job postings yet.</p>
                      </div>
                      <button onClick={() => router.push('/employer/post-job')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Post a New Job</button>
                    </div>
                  );
                }

                return jobEntries.slice(0, 3).map(([jobId, jobData]: [string, any]) => (
                  <div key={jobId} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{jobData.jobTitle}</h4>
                        <p className="text-xs text-gray-500">{jobData.applications.length} application{jobData.applications.length !== 1 ? 's' : ''}</p>
                      </div>
                      <button onClick={() => router.push(`/employer/applications?job=${jobId}`)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
                    </div>
                    <div className="space-y-2">
                      {jobData.applications.slice(0, 2).map((app: any) => (
                        <div key={app._id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{app.student?.name || app.studentId?.name || 'Unknown Student'}</p>
                            <p className="text-xs text-gray-500">Applied: {new Date(app.appliedAt || app.appliedDate).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${app.status === 'applied' ? 'bg-blue-100 text-blue-800' : app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : app.status === 'approved' ? 'bg-green-100 text-green-800' : app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{app.status}</span>
                            <button onClick={() => router.push(`/employer/applications/${app._id}`)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">View</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-3">
              {kycStatus === 'approved' ? (
                <Link href="/employer/post-job" className="w-full block bg-indigo-600 text-white py-2 px-4 rounded-md text-center hover:bg-indigo-700">Post New Job</Link>
              ) : (
                <button className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md cursor-not-allowed" onClick={() => alert('Your employer KYC must be Approved before posting jobs.')}>Post New Job (KYC Required)</button>
              )}
              <Link href="/employer/applications" className="w-full block bg-green-600 text-white py-2 px-4 rounded-md text-center hover:bg-green-700">Review Applications</Link>
              {kycStatus !== 'approved' && (
                <button className="w-full bg-white border border-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-50" onClick={() => setShowKycModal(true)}>Complete KYC</button>
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
              <h4 className="text-base font-semibold text-gray-900">{job.jobTitle}</h4>
              <p className="text-xs text-gray-500">{job.companyName} • {job.location}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                job.status === 'active' ? 'bg-green-100 text-green-800' :
                job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {job.status}
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
            {job.approvalStatus === 'pending' && (
              <button 
                onClick={() => handleJobApproval(job._id)}
                className="flex-1 text-xs bg-blue-600 text-white py-1.5 px-2 rounded hover:bg-blue-700"
              >
                Approve
              </button>
            )}
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
      {applications.map((app) => (
        <div key={app._id} className="bg-white rounded-xl shadow border border-gray-200 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="text-base font-semibold text-gray-900">{app.jobId.jobTitle}</h4>
              <p className="text-xs text-gray-500">{app.studentId.name} • {app.studentId.email}</p>
              <p className="text-xs text-gray-500">Skills: {app.studentId.skills?.join(', ') || 'Not specified'}</p>
              {app.expectedPay && (
                <p className="text-xs text-gray-500">Expected Pay: ₹{app.expectedPay}</p>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                app.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {app.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {app.coverLetter && (
            <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
              <strong>Cover Letter:</strong> {app.coverLetter}
            </div>
          )}

          <div className="flex gap-2">
            <button className="flex-1 text-xs bg-indigo-600 text-white py-1.5 px-2 rounded hover:bg-indigo-700">
              View Profile
            </button>
            {app.status === 'applied' || app.status === 'pending' ? (
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
            ) : (
              <button className="flex-1 text-xs bg-gray-400 text-white py-1.5 px-2 rounded cursor-not-allowed">
                {app.status === 'accepted' ? 'Approved' : 'Rejected'}
              </button>
            )}
          </div>
        </div>
      ))}
      {applications.length === 0 && (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No applications received yet</p>
          <p className="text-sm text-gray-400 mt-2">Applications will appear here when students apply to your jobs</p>
        </div>
      )}
    </div>
  );

  const renderCompanyProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-2xl text-indigo-600">🏢</span>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Pizza Palace</h3>
            <p className="text-gray-600">Restaurant & Food Service</p>
            <p className="text-sm text-gray-500">Hyderabad, Telangana</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Type</label>
            <p className="mt-1 text-sm text-gray-900">Restaurant & Food Service</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <p className="mt-1 text-sm text-gray-900">123 Main Street, Hyderabad, Telangana 500001</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
            <p className="mt-1 text-sm text-gray-900">hr@pizzapalace.com</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <p className="mt-1 text-sm text-gray-900">+91 98765 43210</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">KYC Status</label>
            {kycStatus === 'approved' && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                ✓ Approved
              </span>
            )}
            {kycStatus === 'pending' && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                ⏳ Pending
              </span>
            )}
            {kycStatus === 'rejected' && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                ✗ Rejected
              </span>
            )}
            {(kycStatus === 'not-submitted' || kycStatus === null) && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                Not Submitted
              </span>
            )}
          </div>
        </div>

        <button className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
          Edit Company Profile
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Employer Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Link href="/employer-home" className="text-orange-600 hover:text-orange-700 font-medium">
                Home
              </Link>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                </svg>
              </button>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'myJobs', label: 'My Jobs', icon: '💼' },
              { id: 'applications', label: 'Applications', icon: '📝' },
              { id: 'profile', label: 'Company Profile', icon: '🏢' }
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
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Employer KYC Banner */}
        {user && user.userType === 'employer' && kycStatus !== 'approved' && (
          <div className="mb-6 bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Employer KYC Required</h3>
                <p className="text-sm text-gray-600">
                  {kycStatus === 'pending' && 'Your KYC is under review. You will be able to post jobs once approved.'}
                  {kycStatus === 'rejected' && 'Your KYC was rejected. Please resubmit with correct details.'}
                  {(kycStatus === 'not-submitted' || kycStatus === null) && 'Please submit your company KYC to start posting jobs.'}
                </p>
              </div>
              <div>
                {(kycStatus as string) === 'approved' && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>
                )}
                {kycStatus === 'pending' && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                )}
                {kycStatus === 'rejected' && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>
                )}
                {(kycStatus === 'not-submitted' || kycStatus === null) && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Not Submitted</span>
                )}
              </div>
            </div>
            {(kycStatus === 'not-submitted' || kycStatus === 'rejected') && (
              <div className="mt-4">
                <button
                  onClick={() => setShowKycModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Open KYC Form
                </button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'myJobs' && renderMyJobs()}
        {activeTab === 'applications' && renderApplications()}
        {activeTab === 'profile' && renderCompanyProfile()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-indigo-600">
            <span className="text-lg">🏠</span>
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/jobs" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-indigo-600">
            <span className="text-lg">💼</span>
            <span className="text-xs">Jobs</span>
          </Link>
          <Link href="/employer" className="flex flex-col items-center py-2 px-3 text-indigo-600">
            <span className="text-lg">📊</span>
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link
            href={kycStatus === 'approved' ? '/employer/post-job' : '/employer'}
            onClick={(e) => { if (kycStatus !== 'approved') { e.preventDefault(); alert('Complete employer KYC (Approved) to post jobs.'); } }}
            className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-indigo-600"
          >
            <span className="text-lg">➕</span>
            <span className="text-xs">Post Job</span>
          </Link>
        </div>
      </div>
      {showKycModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow w-full max-w-xl">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Employer KYC</h3>
              <p className="text-sm text-gray-600">Provide your company details for verification</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  name="companyName"
                  value={kycForm.companyName}
                  onChange={handleKycInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Your legal company name"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input
                    name="GSTNumber"
                    value={kycForm.GSTNumber}
                    onChange={handleKycInput}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                  <input
                    name="PAN"
                    value={kycForm.PAN}
                    onChange={handleKycInput}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setShowKycModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitEmployerKYC}
                disabled={submittingKyc || !kycForm.companyName}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {submittingKyc ? 'Submitting...' : 'Submit KYC'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
