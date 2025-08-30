'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

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
          <Link href="/post-job" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-center block">
            Post New Job
          </Link>
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
            <label className="block text-sm font-medium text-gray-700">Verification Status</label>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              ✓ Verified
            </span>
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
          <Link href="/post-job" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-indigo-600">
            <span className="text-lg">➕</span>
            <span className="text-xs">Post Job</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
