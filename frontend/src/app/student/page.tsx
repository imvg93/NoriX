'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const mockData = {
    overview: {
      totalApplications: 12,
      activeApplications: 5,
      savedJobs: 8,
      recentJobs: [
        { id: 1, title: 'Part-time Server', company: 'Pizza Palace', location: 'Hyderabad', salary: '₹200/hour' },
        { id: 2, title: 'Tutor - Mathematics', company: 'Study Center', location: 'Hyderabad', salary: '₹300/hour' },
        { id: 3, title: 'Delivery Partner', company: 'QuickFood', location: 'Hyderabad', salary: '₹150/delivery' }
      ]
    },
    applications: [
      { id: 1, jobTitle: 'Part-time Server', company: 'Pizza Palace', status: 'Applied', date: '2024-01-15' },
      { id: 2, jobTitle: 'Tutor - Mathematics', company: 'Study Center', status: 'Under Review', date: '2024-01-12' },
      { id: 3, jobTitle: 'Delivery Partner', company: 'QuickFood', status: 'Rejected', date: '2024-01-10' },
      { id: 4, jobTitle: 'Sales Assistant', company: 'Fashion Store', status: 'Interview Scheduled', date: '2024-01-08' }
    ],
    savedJobs: [
      { id: 1, title: 'Part-time Server', company: 'Pizza Palace', location: 'Hyderabad', salary: '₹200/hour' },
      { id: 2, title: 'Tutor - Mathematics', company: 'Study Center', location: 'Hyderabad', salary: '₹300/hour' },
      { id: 3, title: 'Delivery Partner', company: 'QuickFood', location: 'Hyderabad', salary: '₹150/delivery' },
      { id: 4, title: 'Sales Assistant', company: 'Fashion Store', location: 'Hyderabad', salary: '₹250/hour' }
    ]
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-indigo-600">{mockData.overview.totalApplications}</div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{mockData.overview.activeApplications}</div>
          <div className="text-sm text-gray-600">Active Applications</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{mockData.overview.savedJobs}</div>
          <div className="text-sm text-gray-600">Saved Jobs</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">₹2,500</div>
          <div className="text-sm text-gray-600">Earned This Month</div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Job Opportunities</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {mockData.overview.recentJobs.map((job) => (
            <div key={job.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                  <p className="text-sm text-gray-600">{job.company}</p>
                  <p className="text-sm text-gray-500">{job.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">{job.salary}</p>
                  <button className="mt-2 text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-4">
      {mockData.applications.map((app) => (
        <div key={app.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{app.jobTitle}</h4>
              <p className="text-sm text-gray-600">{app.company}</p>
              <p className="text-xs text-gray-500">Applied: {app.date}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                app.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                app.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                app.status === 'Interview Scheduled' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {app.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-2xl text-indigo-600">👤</span>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">John Doe</h3>
            <p className="text-gray-600">Computer Science Student</p>
            <p className="text-sm text-gray-500">Hyderabad University</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">john.doe@email.com</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <p className="mt-1 text-sm text-gray-900">+91 98765 43210</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Skills</label>
            <p className="mt-1 text-sm text-gray-900">JavaScript, React, Node.js, Python</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Availability</label>
            <p className="mt-1 text-sm text-gray-900">Weekends, Evenings</p>
          </div>
        </div>

        <button className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
          Edit Profile
        </button>
      </div>
    </div>
  );

  const renderSavedJobs = () => (
    <div className="space-y-4">
      {mockData.savedJobs.map((job) => (
        <div key={job.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
              <p className="text-sm text-gray-600">{job.company}</p>
              <p className="text-sm text-gray-500">{job.location}</p>
              <p className="text-sm font-medium text-green-600">{job.salary}</p>
            </div>
            <div className="flex flex-col space-y-2">
              <button className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">
                Apply Now
              </button>
              <button className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Student Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Link href="/student-home" className="text-indigo-600 hover:text-indigo-700 font-medium">
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
              { id: 'applications', label: 'Applications', icon: '📝' },
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'saved', label: 'Saved Jobs', icon: '❤️' }
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
        {activeTab === 'applications' && renderApplications()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'saved' && renderSavedJobs()}
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
          <Link href="/student" className="flex flex-col items-center py-2 px-3 text-indigo-600">
            <span className="text-lg">📊</span>
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-indigo-600">
            <span className="text-lg">👤</span>
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
