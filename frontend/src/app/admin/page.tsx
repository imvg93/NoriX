'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const mockData = {
    overview: {
      totalUsers: 1247,
      totalJobs: 89,
      totalApplications: 456,
      pendingVerifications: 23,
      recentActivity: [
        { id: 1, type: 'New User Registration', user: 'john.doe@email.com', time: '2 hours ago' },
        { id: 2, type: 'Job Posted', job: 'Part-time Server', employer: 'Pizza Palace', time: '3 hours ago' },
        { id: 3, type: 'Verification Approved', company: 'Tech Solutions', time: '5 hours ago' },
        { id: 4, type: 'New Application', job: 'Tutor - Mathematics', student: 'jane.smith@email.com', time: '6 hours ago' }
      ]
    },
    users: [
      { id: 1, name: 'John Doe', email: 'john.doe@email.com', type: 'Student', status: 'Active', joined: '2024-01-10' },
      { id: 2, name: 'Jane Smith', email: 'jane.smith@email.com', type: 'Student', status: 'Active', joined: '2024-01-09' },
      { id: 3, name: 'Pizza Palace', email: 'hr@pizzapalace.com', type: 'Employer', status: 'Verified', joined: '2024-01-08' },
      { id: 4, name: 'Tech Solutions', email: 'hr@techsolutions.com', type: 'Employer', status: 'Pending', joined: '2024-01-07' }
    ],
    jobs: [
      { id: 1, title: 'Part-time Server', employer: 'Pizza Palace', status: 'Active', applications: 8, posted: '2024-01-10' },
      { id: 2, title: 'Tutor - Mathematics', employer: 'Study Center', status: 'Active', applications: 5, posted: '2024-01-08' },
      { id: 3, title: 'Delivery Partner', employer: 'QuickFood', status: 'Paused', applications: 3, posted: '2024-01-05' },
      { id: 4, title: 'Sales Assistant', employer: 'Fashion Store', status: 'Closed', applications: 12, posted: '2023-12-20' }
    ],
    verifications: [
      { id: 1, company: 'Tech Solutions', email: 'hr@techsolutions.com', documents: 'Business License, GST Certificate', status: 'Pending', submitted: '2024-01-07' },
      { id: 2, company: 'Study Center', email: 'admin@studycenter.com', documents: 'Educational License, Address Proof', status: 'Under Review', submitted: '2024-01-06' },
      { id: 3, company: 'QuickFood', email: 'hr@quickfood.com', documents: 'Food License, FSSAI Certificate', status: 'Approved', submitted: '2024-01-05' }
    ]
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-indigo-600">{mockData.overview.totalUsers}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{mockData.overview.totalJobs}</div>
          <div className="text-sm text-gray-600">Total Jobs</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{mockData.overview.totalApplications}</div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{mockData.overview.pendingVerifications}</div>
          <div className="text-sm text-gray-600">Pending Verifications</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {mockData.overview.recentActivity.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{activity.type}</h4>
                  <p className="text-sm text-gray-600">
                    {activity.user || activity.job || activity.company}
                    {activity.employer && ` - ${activity.employer}`}
                    {activity.student && ` - ${activity.student}`}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                <button className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <Link href="/admin?tab=verifications" className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 text-center block">
            Review Verifications
          </Link>
          <Link href="/admin?tab=users" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-center block">
            Manage Users
          </Link>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      {mockData.users.map((user) => (
        <div key={user.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{user.name}</h4>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-xs text-gray-500">Joined: {user.joined}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.type === 'Student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {user.type}
              </span>
              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.status === 'Active' ? 'bg-green-100 text-green-800' :
                user.status === 'Verified' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {user.status}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button className="flex-1 text-xs bg-indigo-600 text-white py-1 px-2 rounded hover:bg-indigo-700">
              View Profile
            </button>
            <button className="flex-1 text-xs bg-yellow-600 text-white py-1 px-2 rounded hover:bg-yellow-700">
              {user.status === 'Active' ? 'Suspend' : 'Activate'}
            </button>
            <button className="flex-1 text-xs bg-red-600 text-white py-1 px-2 rounded hover:bg-red-700">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-4">
      {mockData.jobs.map((job) => (
        <div key={job.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
              <p className="text-sm text-gray-600">{job.employer}</p>
              <p className="text-xs text-gray-500">Posted: {job.posted}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                job.status === 'Active' ? 'bg-green-100 text-green-800' :
                job.status === 'Paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {job.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">{job.applications} applications</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button className="flex-1 text-xs bg-indigo-600 text-white py-1 px-2 rounded hover:bg-indigo-700">
              View Details
            </button>
            <button className="flex-1 text-xs bg-yellow-600 text-white py-1 px-2 rounded hover:bg-yellow-700">
              {job.status === 'Active' ? 'Pause' : 'Activate'}
            </button>
            <button className="flex-1 text-xs bg-red-600 text-white py-1 px-2 rounded hover:bg-red-700">
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderVerifications = () => (
    <div className="space-y-4">
      {mockData.verifications.map((verification) => (
        <div key={verification.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{verification.company}</h4>
              <p className="text-sm text-gray-600">{verification.email}</p>
              <p className="text-xs text-gray-500">Documents: {verification.documents}</p>
              <p className="text-xs text-gray-500">Submitted: {verification.submitted}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                verification.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                verification.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {verification.status}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button className="flex-1 text-xs bg-indigo-600 text-white py-1 px-2 rounded hover:bg-indigo-700">
              View Documents
            </button>
            {verification.status === 'Pending' && (
              <>
                <button className="flex-1 text-xs bg-green-600 text-white py-1 px-2 rounded hover:bg-green-700">
                  Approve
                </button>
                <button className="flex-1 text-xs bg-red-600 text-white py-1 px-2 rounded hover:bg-red-700">
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Statistics</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Users</span>
            <span className="text-lg font-semibold text-indigo-600">1,247</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Jobs</span>
            <span className="text-lg font-semibold text-green-600">89</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Applications</span>
            <span className="text-lg font-semibold text-blue-600">456</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Verification Rate</span>
            <span className="text-lg font-semibold text-yellow-600">78%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '78%' }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Trends</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">New Users (This Week)</span>
            <span className="font-medium text-green-600">+23</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">New Jobs (This Week)</span>
            <span className="font-medium text-blue-600">+8</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Applications (This Week)</span>
            <span className="font-medium text-indigo-600">+45</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Link href="/admin-home" className="text-green-600 hover:text-green-700 font-medium">
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
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'jobs', label: 'Jobs', icon: '💼' },
              { id: 'verifications', label: 'Verifications', icon: '✅' },
              { id: 'analytics', label: 'Analytics', icon: '📈' }
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
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'jobs' && renderJobs()}
        {activeTab === 'verifications' && renderVerifications()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-indigo-600">
            <span className="text-lg">🏠</span>
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/admin" className="flex flex-col items-center py-2 px-3 text-indigo-600">
            <span className="text-lg">⚙️</span>
            <span className="text-xs">Admin</span>
          </Link>
          <Link href="/users" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-indigo-600">
            <span className="text-lg">👥</span>
            <span className="text-xs">Users</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-indigo-600">
            <span className="text-lg">🔧</span>
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
