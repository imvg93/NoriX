'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

export default function EmployerDashboard() {
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

  useEffect(() => {
    const init = async () => {
      if (!user || user.userType !== 'employer') return;
      try {
        const res = await apiService.getEmployerKYCStatus(user._id);
        setKycStatus((res?.status as 'not-submitted' | 'pending' | 'approved' | 'rejected' | null) || 'not-submitted');
      } catch (e) {
        console.error('❌ Error loading KYC status:', e);
        setKycStatus('not-submitted');
      }
      setKycForm(prev => ({ ...prev, companyName: (user as any).companyName || '' }));
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

  // Mock data for demonstration
  const mockData = {
    overview: {
      totalJobs: 8,
      activeJobs: 5,
      totalApplications: 24,
      pendingApplications: 12,
      recentApplications: [
        { id: 1, jobTitle: 'Part-time Server', applicant: 'John Doe', date: '2024-01-15', status: 'New' },
        { id: 2, jobTitle: 'Part-time Server', applicant: 'Jane Smith', date: '2024-01-14', status: 'New' },
        { id: 3, jobTitle: 'Tutor - Mathematics', applicant: 'Mike Johnson', date: '2024-01-13', status: 'Under Review' }
      ]
    },
    myJobs: [
      { id: 1, title: 'Part-time Server', status: 'Active', applications: 8, views: 45, posted: '2024-01-10' },
      { id: 2, title: 'Tutor - Mathematics', status: 'Active', applications: 5, views: 32, posted: '2024-01-08' },
      { id: 3, title: 'Delivery Partner', status: 'Paused', applications: 3, views: 28, posted: '2024-01-05' },
      { id: 4, title: 'Sales Assistant', status: 'Closed', applications: 12, views: 67, posted: '2023-12-20' }
    ],
    applications: [
      { id: 1, jobTitle: 'Part-time Server', applicant: 'John Doe', email: 'john@email.com', phone: '+91 98765 43210', date: '2024-01-15', status: 'New' },
      { id: 2, jobTitle: 'Part-time Server', applicant: 'Jane Smith', email: 'jane@email.com', phone: '+91 98765 43211', date: '2024-01-14', status: 'New' },
      { id: 3, jobTitle: 'Tutor - Mathematics', applicant: 'Mike Johnson', email: 'mike@email.com', phone: '+91 98765 43212', date: '2024-01-13', status: 'Under Review' },
      { id: 4, jobTitle: 'Part-time Server', applicant: 'Sarah Wilson', email: 'sarah@email.com', phone: '+91 98765 43213', date: '2024-01-12', status: 'Interview Scheduled' }
    ]
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-indigo-600">{mockData.overview.totalJobs}</div>
          <div className="text-sm text-gray-600">Total Jobs</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{mockData.overview.activeJobs}</div>
          <div className="text-sm text-gray-600">Active Jobs</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{mockData.overview.totalApplications}</div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{mockData.overview.pendingApplications}</div>
          <div className="text-sm text-gray-600">Pending Review</div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {mockData.overview.recentApplications.map((app) => (
            <div key={app.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{app.jobTitle}</h4>
                  <p className="text-sm text-gray-600">{app.applicant}</p>
                  <p className="text-xs text-gray-500">Applied: {app.date}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    app.status === 'New' ? 'bg-blue-100 text-blue-800' :
                    app.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {app.status}
                  </span>
                  <button className="mt-2 text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          {kycStatus === 'approved' ? (
            <Link href="/employer/post-job" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-center block">
              Post New Job
            </Link>
          ) : (
            <button
              className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md cursor-not-allowed text-center block"
              onClick={() => alert('Your employer KYC must be Approved before posting jobs.')}
            >
              Post New Job (KYC Required)
            </button>
          )}
          {kycStatus !== 'approved' && (
            <button
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-center block"
              onClick={() => setShowKycModal(true)}
            >
              Complete KYC
            </button>
          )}
          <Link href="/employer?tab=applications" className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-center block">
            Review Applications
          </Link>
        </div>
      </div>
    </div>
  );

  const renderMyJobs = () => (
    <div className="space-y-4">
      {mockData.myJobs.map((job) => (
        <div key={job.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              job.status === 'Active' ? 'bg-green-100 text-green-800' :
              job.status === 'Paused' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {job.status}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-600 mb-3">
            <div>
              <div className="font-medium text-indigo-600">{job.applications}</div>
              <div>Applications</div>
            </div>
            <div>
              <div className="font-medium text-blue-600">{job.views}</div>
              <div>Views</div>
            </div>
            <div>
              <div className="font-medium text-gray-600">{job.posted}</div>
              <div>Posted</div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button className="flex-1 text-xs bg-indigo-600 text-white py-1 px-2 rounded hover:bg-indigo-700">
              Edit
            </button>
            <button className="flex-1 text-xs bg-green-600 text-white py-1 px-2 rounded hover:bg-green-700">
              View Apps
            </button>
            <button className="flex-1 text-xs bg-gray-600 text-white py-1 px-2 rounded hover:bg-gray-700">
              {job.status === 'Active' ? 'Pause' : 'Activate'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-4">
      {mockData.applications.map((app) => (
        <div key={app.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{app.jobTitle}</h4>
              <p className="text-sm text-gray-600">{app.applicant}</p>
              <p className="text-xs text-gray-500">{app.email}</p>
              <p className="text-xs text-gray-500">{app.phone}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                app.status === 'New' ? 'bg-blue-100 text-blue-800' :
                app.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {app.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">Applied: {app.date}</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button className="flex-1 text-xs bg-indigo-600 text-white py-1 px-2 rounded hover:bg-indigo-700">
              View Profile
            </button>
            <button className="flex-1 text-xs bg-green-600 text-white py-1 px-2 rounded hover:bg-green-700">
              Schedule Interview
            </button>
            <button className="flex-1 text-xs bg-red-600 text-white py-1 px-2 rounded hover:bg-red-700">
              Reject
            </button>
          </div>
        </div>
      ))}
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
        <div className="px-4 py-4">
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
        <div className="px-4">
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
      <div className="px-4 py-6">
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
