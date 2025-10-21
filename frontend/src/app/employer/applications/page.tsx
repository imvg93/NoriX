"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  Mail, 
  Phone, 
  Calendar,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  Star,
  Award,
  GraduationCap,
  MapPin,
  Clock
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';
import RoleProtectedRoute from '../../../components/auth/RoleProtectedRoute';
import { useSafeNavigation } from '../../../hooks/useSafeNavigation';
import type { Application } from '../../../services/api';


function EmployerApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { navigateBack } = useSafeNavigation();

  // Helper function to safely access student properties
  const getStudentProperty = (student: any, property: string) => {
    if (typeof student === 'object' && student) {
      return student[property];
    }
    return undefined;
  };
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  // Get job filter from URL params
  const jobFilter = searchParams.get('job');

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user || user.userType !== 'employer') {
        setError('Please log in as an employer to view applications');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // Set job filter from URL params
        if (jobFilter) {
          setSelectedJob(jobFilter);
        }
        
        const response = await apiService.getEmployerApplications();
        setApplications(response.applications || []);
        
      } catch (err: any) {
        console.error('Error fetching applications:', err);
        
        // Handle specific error types
        if (err.status === 401) {
          setError('Please log in to view your applications');
          // Redirect to login after a short delay
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else if (err.status === 403) {
          setError('You do not have permission to view applications. Please log in as an employer.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else if (err.status === 404) {
          setError('Applications endpoint not found');
        } else if (err.message?.includes('Authentication failed')) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else {
          setError(err.message || 'Failed to load applications');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user, router, jobFilter]);

  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject' | 'close') => {
    try {
      setActionLoading(applicationId);
      
      if (action === 'approve') {
        await apiService.approveApplication(applicationId);
      } else if (action === 'reject') {
        await apiService.rejectApplication(applicationId);
      } else if (action === 'close') {
        // For now, we'll use reject API with a note, but ideally should have a separate close endpoint
        await apiService.rejectApplication(applicationId, 'Application closed without decision');
      }
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app._id === applicationId 
            ? { ...app, status: action === 'approve' ? 'approved' : action === 'close' ? 'closed' : 'rejected' }
            : app
        )
      );
      
      alert(`Application ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      
    } catch (err: any) {
      console.error(`Error ${action}ing application:`, err);
      alert(err.message || `Failed to ${action} application`);
    } finally {
      setActionLoading(null);
    }
  };

  const openApplicationModal = (application: Application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': 
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = !selectedStatus || app.status === selectedStatus;
    const matchesJob = !selectedJob || app.job?._id === selectedJob;
    const matchesSearch = !searchTerm || 
      (getStudentProperty(app.student, 'name')?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      app.job?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (getStudentProperty(app.student, 'college')?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesJob && matchesSearch;
  });

  const uniqueJobs = Array.from(new Set(applications.map(app => app.job?._id).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleProtectedRoute allowedRoles={['employer']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={navigateBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Applications</h1>
                <p className="text-gray-600">
                  Review and manage student applications for your job postings
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                  <span className="font-medium">{applications.length}</span>
                  <span className="ml-1">Total Applications</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, job, or college..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="applied">Applied</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="closed">Closed</option>
              </select>
              
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Jobs</option>
                {uniqueJobs.map(jobId => {
                  const job = applications.find(app => app.job?._id === jobId)?.job;
                  return (
                    <option key={jobId} value={jobId}>
                      {job?.title}
                    </option>
                  );
                })}
              </select>
              
              <button
                onClick={() => {
                  setSelectedStatus('');
                  setSelectedJob('');
                  setSearchTerm('');
                }}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 mb-8"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8"
            >
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Applications</h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => router.push('/login')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Login
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Applications List */}
          <div className="space-y-6">
            {!error && filteredApplications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600">
                  {applications.length === 0 
                    ? 'You haven\'t received any applications yet.' 
                    : 'Try adjusting your search criteria or filters.'}
                </p>
              </motion.div>
            ) : (
              filteredApplications.map((application, index) => (
                <motion.div
                  key={application._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Student Avatar */}
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {getStudentProperty(application.student, 'name')?.charAt(0) || 'S'}
                      </div>
                      
                      {/* Student Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {getStudentProperty(application.student, 'name') || 'Unknown Student'}
                            </h3>
                            <p className="text-gray-600">{application.job?.title}</p>
                          </div>
                          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(application.status)}`}>
                            {application.status === 'applied' ? 'Applied' : 
                             application.status === 'pending' ? 'Pending' :
                             application.status === 'approved' ? 'Approved' :
                             application.status === 'accepted' ? 'Accepted' :
                             application.status === 'rejected' ? 'Rejected' :
                             application.status === 'closed' ? 'Closed' : application.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <GraduationCap className="w-4 h-4" />
                            <span>{getStudentProperty(application.student, 'college') || 'College not specified'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{application.job?.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Applied {formatDate(application.appliedDate)}</span>
                          </div>
                        </div>
                        
                        {/* Skills */}
                        {getStudentProperty(application.student, 'skills') && getStudentProperty(application.student, 'skills').length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {getStudentProperty(application.student, 'skills').slice(0, 4).map((skill: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                {skill}
                              </span>
                            ))}
                            {getStudentProperty(application.student, 'skills').length > 4 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{getStudentProperty(application.student, 'skills').length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Contact Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{getStudentProperty(application.student, 'email')}</span>
                          </div>
                          {getStudentProperty(application.student, 'phone') && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{getStudentProperty(application.student, 'phone')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => openApplicationModal(application)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      
                      {(application as any).resume && (
                        <button
                          onClick={() => window.open((application as any).resume, '_blank')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Resume
                        </button>
                      )}
                      
                      {application.status === 'applied' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApplicationAction(application._id, 'approve')}
                            disabled={actionLoading === application._id}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors text-sm flex items-center gap-1"
                          >
                            {actionLoading === application._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleApplicationAction(application._id, 'reject')}
                            disabled={actionLoading === application._id}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors text-sm flex items-center gap-1"
                          >
                            {actionLoading === application._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            Reject
                          </button>
                          <button
                            onClick={() => handleApplicationAction(application._id, 'close')}
                            disabled={actionLoading === application._id}
                            className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 transition-colors text-sm flex items-center gap-1"
                          >
                            {actionLoading === application._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Application Detail Modal */}
        {showApplicationModal && selectedApplication && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
                  <button
                    onClick={() => setShowApplicationModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Student Info */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {getStudentProperty(selectedApplication.student, 'name')?.charAt(0) || 'S'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {getStudentProperty(selectedApplication.student, 'name')}
                    </h3>
                    <p className="text-gray-600 mb-2">{selectedApplication.job?.title}</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{getStudentProperty(selectedApplication.student, 'email')}</span>
                      </div>
                      {getStudentProperty(selectedApplication.student, 'phone') && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{getStudentProperty(selectedApplication.student, 'phone')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        <span>{getStudentProperty(selectedApplication.student, 'college')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cover Letter */}
                {selectedApplication.coverLetter && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cover Letter</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {getStudentProperty(selectedApplication.student, 'skills') && getStudentProperty(selectedApplication.student, 'skills').length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {getStudentProperty(selectedApplication.student, 'skills').map((skill: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Actions */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  {(selectedApplication as any).resume && (
                    <button
                      onClick={() => window.open((selectedApplication as any).resume, '_blank')}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Resume
                    </button>
                  )}
                  
                  {selectedApplication.status === 'applied' && (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          handleApplicationAction(selectedApplication._id, 'approve');
                          setShowApplicationModal(false);
                        }}
                        className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleApplicationAction(selectedApplication._id, 'reject');
                          setShowApplicationModal(false);
                        }}
                        className="bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          handleApplicationAction(selectedApplication._id, 'close');
                          setShowApplicationModal(false);
                        }}
                        className="bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleProtectedRoute>
  );
}

export default function EmployerApplicationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    }>
      <EmployerApplicationsContent />
    </Suspense>
  );
}