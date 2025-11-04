'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { CheckCircle, Clock, XCircle, Eye, Calendar, MapPin, DollarSign, Building, FileText, Heart } from 'lucide-react';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.userType !== 'student') return;

      try {
        setLoading(true);
        
        // Fetch student applications
        const applicationsResponse = await apiService.getStudentApplications();
        setApplications(applicationsResponse.applications || []);
        
        // Extract applied job IDs
        const appliedIds = new Set(
          applicationsResponse.applications?.map((app: any) => 
            app.job?._id || app.jobId?._id || app.jobId
          ).filter(Boolean) || []
        );
        setAppliedJobIds(appliedIds);
        
        // Fetch available jobs
        const jobsResponse = await apiService.getJobs();
        setJobs(jobsResponse.jobs || []);
        
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-indigo-600">{applications.length}</div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {applications.filter(app => app.status === 'applied' || app.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Active Applications</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
          <div className="text-sm text-gray-600">Available Jobs</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {applications.filter(app => app.status === 'approved' || app.status === 'accepted').length}
          </div>
          <div className="text-sm text-gray-600">Approved Applications</div>
        </div>
      </div>

      {/* Applied Jobs Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Your Applied Jobs
            </h3>
            <span className="text-sm text-gray-500">{applications.length} applications</span>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {applications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="mb-4">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h4>
                <p className="text-gray-600 mb-4">
                  You haven't applied for any jobs yet. Start exploring available opportunities!
                </p>
              </div>
              <Link
                href="/jobs"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app._id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {app.job?.title || app.jobId?.jobTitle || 'Unknown Job'}
                      </h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        app.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {app.job?.company || app.jobId?.companyName || 'Unknown Company'}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {app.job?.location || app.jobId?.location || 'Location not specified'}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Applied: {new Date(app.appliedAt || app.appliedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/jobs/${app.job?._id || app.jobId?._id || app.jobId}`}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View Job
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Available Jobs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Available Jobs</h3>
            <Link
              href="/jobs"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All Jobs
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {jobs.slice(0, 5).map((job) => {
            const isApplied = appliedJobIds.has(job._id);
            return (
              <div key={job._id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                      {isApplied && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Applied
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {job.company}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </p>
                    <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {job.salary ? `₹${job.salary}` : 'Salary not specified'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/jobs/${job._id}`}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </Link>
                    {!isApplied && (
                      <Link
                        href={`/jobs/${job._id}`}
                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                      >
                        Apply Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-4">
      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't applied for any jobs yet. Start exploring available opportunities!
          </p>
          <Link
            href="/jobs"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        applications.map((app) => (
          <div key={app._id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {app.job?.title || app.jobId?.jobTitle || 'Unknown Job'}
                  </h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    app.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    app.status === 'approved' ? 'bg-green-100 text-green-800' :
                    app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                  <Building className="w-3 h-3" />
                  {app.job?.company || app.jobId?.companyName || 'Unknown Company'}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3" />
                  {app.job?.location || app.jobId?.location || 'Location not specified'}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Applied: {new Date(app.appliedAt || app.appliedDate).toLocaleDateString()}
                </p>
                {app.coverLetter && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    Cover Letter: {app.coverLetter}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/jobs/${app.job?._id || app.jobId?._id || app.jobId}`}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View Job
                </Link>
              </div>
            </div>
          </div>
        ))
      )}
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
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-gray-500 mb-4">
          <Heart className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Jobs Yet</h3>
          <p className="text-gray-600">You haven't saved any jobs yet. Browse available jobs and save the ones you're interested in!</p>
        </div>
        <Link
          href="/jobs"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Browse Jobs
        </Link>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.name || 'Student'}! Track your applications and find new opportunities.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{applications.length} Applications</p>
                <p className="text-xs text-gray-500">
                  {applications.filter(app => app.status === 'applied' || app.status === 'pending').length} Active
                </p>
              </div>
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
          <Link href="/student/profile" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-indigo-600">
            <span className="text-lg">👤</span>
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
