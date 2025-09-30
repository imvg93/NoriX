"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  Mail, 
  Phone,
  Calendar,
  MapPin,
  Building,
  Star,
  User
} from 'lucide-react';
import { apiService } from '../../../services/api';

interface Application {
  _id: string;
  jobId: {
    _id: string;
    jobTitle: string;
    location: string;
    salaryRange: string;
  };
  studentId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    college: string;
    skills: string[];
    rating: number;
    completedJobs: number;
  };
  status: string;
  appliedAt: string;
  coverLetter?: string;
  expectedPay?: number;
  availability?: string;
}

interface Job {
  _id: string;
  jobTitle: string;
  location: string;
  salaryRange: string;
  applications: Application[];
}

interface EmployerDashboardResponse {
  jobs: Job[];
  applications: Application[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

const EmployerApplicationsPage = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Fetch applications data
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);

        const response = await apiService.getEmployerDashboardJobs();
        const rawJobs = Array.isArray(response?.jobs) ? (response.jobs as any[]) : [];

        const jobsWithApplications: Job[] = [];
        const aggregatedApplications: Application[] = [];

        rawJobs.forEach((job: any) => {
          const jobSummary = {
            _id: job._id || job.jobId || '',
            jobTitle: job.title || job.jobTitle || 'Untitled Job',
            location: job.location || 'Not specified',
            salaryRange: job.salaryRange || job.salary || '—',
          };

          const jobApplications: Application[] = Array.isArray(job.applicants)
            ? job.applicants.map((applicant: any) => {
                const studentInfo = applicant.student || applicant.studentDetails || {};

                return {
                  _id: applicant.applicationId || applicant._id || `${jobSummary._id}-${applicant.studentId || 'unknown'}`,
                  jobId: {
                    _id: jobSummary._id,
                    jobTitle: jobSummary.jobTitle,
                    location: jobSummary.location,
                    salaryRange: jobSummary.salaryRange,
                  },
                  studentId: {
                    _id: (studentInfo._id || applicant.studentId || '').toString(),
                    name: studentInfo.name || applicant.name || 'Candidate',
                    email: studentInfo.email || applicant.email || 'N/A',
                    phone: studentInfo.phone || applicant.phone || 'N/A',
                    college: studentInfo.college || applicant.college || 'N/A',
                    skills: Array.isArray(studentInfo.skills) ? studentInfo.skills : Array.isArray(applicant.skills) ? applicant.skills : [],
                    rating: studentInfo.rating || applicant.rating || 0,
                    completedJobs: studentInfo.completedJobs || applicant.completedJobs || 0,
                  },
                  status: applicant.status || 'applied',
                  appliedAt: applicant.appliedAt || applicant.createdAt || new Date().toISOString(),
                  coverLetter: applicant.coverLetter || applicant.summary || '',
                  expectedPay: applicant.expectedPay,
                  availability: applicant.availability,
                };
              })
            : [];

          jobsWithApplications.push({
            ...jobSummary,
            applications: jobApplications,
          });

          aggregatedApplications.push(...jobApplications);
        });

        setJobs(jobsWithApplications);
        setApplications(aggregatedApplications);
      } catch (error) {
        console.error('Error fetching applications:', error);
        setJobs([]);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesJob = selectedJob === 'all' || app.jobId._id === selectedJob;
    const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;
    return matchesJob && matchesStatus;
  });

  // Approve application
  const handleApprove = async (applicationId: string) => {
    try {
      await apiService.approveApplication(applicationId);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app._id === applicationId 
            ? { ...app, status: 'accepted' }
            : app
        )
      );
      
      alert('Application approved successfully!');
    } catch (error: any) {
      console.error('Error approving application:', error);
      alert(error.message || 'Failed to approve application');
    }
  };

  // Reject application
  const handleReject = async (applicationId: string) => {
    try {
      await apiService.rejectApplication(applicationId);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app._id === applicationId 
            ? { ...app, status: 'rejected' }
            : app
        )
      );
      
      alert('Application rejected');
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      alert(error.message || 'Failed to reject application');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-600';
      case 'rejected':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-yellow-100 text-yellow-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      default:
        return Clock;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
              <p className="text-gray-600">Review and manage student applications</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{filteredApplications.length} applications</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Job Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Job</label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Jobs</option>
                {jobs.map(job => (
                  <option key={job._id} value={job._id}>{job.jobTitle}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="applied">Applied</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Stats */}
            <div className="flex items-end">
              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {applications.filter(app => app.status === 'applied').length}
                  </div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {applications.filter(app => app.status === 'accepted').length}
                  </div>
                  <div className="text-sm text-gray-500">Accepted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {applications.filter(app => app.status === 'rejected').length}
                  </div>
                  <div className="text-sm text-gray-500">Rejected</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {filteredApplications.map((application, index) => {
            const StatusIcon = getStatusIcon(application.status);
            
            return (
              <motion.div
                key={application._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {/* Student Avatar */}
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-orange-600" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{application.studentId.name}</h3>
                      <p className="text-gray-600">{application.jobId.jobTitle}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {application.studentId.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {application.studentId.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      <StatusIcon className="w-4 h-4 inline mr-1" />
                      {application.status}
                    </span>
                  </div>
                </div>

                {/* Student Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building className="w-4 h-4" />
                    <span className="text-sm">{application.studentId.college}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Star className="w-4 h-4" />
                    <span className="text-sm">{application.studentId.rating}/5</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{application.studentId.completedJobs} jobs completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Skills */}
                {application.studentId.skills && application.studentId.skills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.studentId.skills.map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {application.expectedPay && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Expected Pay</h4>
                      <p className="text-gray-900">₹{application.expectedPay}</p>
                    </div>
                  )}
                  {application.availability && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Availability</h4>
                      <p className="text-gray-900">{application.availability}</p>
                    </div>
                  )}
                </div>

                {/* Cover Letter */}
                {application.coverLetter && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Cover Letter</h4>
                    <p className="text-gray-600 bg-gray-50 rounded-xl p-4">{application.coverLetter}</p>
                  </div>
                )}

                {/* Actions */}
                {application.status === 'applied' && (
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleApprove(application._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(application._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => router.push(`/students/${application.studentId._id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Profile
                    </button>
                  </div>
                )}

                {application.status !== 'applied' && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <StatusIcon className="w-4 h-4" />
                      <span>
                        Application {application.status} on {new Date(application.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* No Applications Found */}
        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-500">Try adjusting your filters or post more jobs to attract applications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerApplicationsPage;

