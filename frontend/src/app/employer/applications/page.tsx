"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  Mail, 
  Phone,
  Search,
  Loader2,
  AlertCircle,
  GraduationCap,
  MapPin,
  Clock,
  Briefcase,
  X,
  Filter,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';
import RoleProtectedRoute from '../../../components/auth/RoleProtectedRoute';
import { useSafeNavigation } from '../../../hooks/useSafeNavigation';
import LoadingOverlay from '../../../components/LoadingOverlay';
import type { Application } from '../../../services/api';

const ACCENT = "#2A8A8D";

function EmployerApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { navigateBack } = useSafeNavigation();

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
  const [showFilters, setShowFilters] = useState(false);

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
        
        if (jobFilter) {
          setSelectedJob(jobFilter);
        }
        
        const response = await apiService.getEmployerApplications();
        setApplications(response.applications || []);
        
      } catch (err: any) {
        console.error('Error fetching applications:', err);
        
        if (err.status === 401) {
          setError('Please log in to view your applications');
        } else if (err.status === 403) {
          setError('You do not have permission to view applications. Please log in as an employer.');
        } else if (err.status === 404) {
          setError('Applications endpoint not found');
        } else if (err.message?.includes('Authentication failed')) {
          setError('Your session has expired. Please log in again.');
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
        await apiService.rejectApplication(applicationId, 'Application closed without decision');
      }
      
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
      case 'applied': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      case 'pending': return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
      case 'approved': 
      case 'accepted': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
      case 'rejected': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
      case 'closed': return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = !selectedStatus || app.status === selectedStatus;
    const matchesJob = !selectedJob || app.job?._id === selectedJob;
    const matchesSearch = !searchTerm || 
      (getStudentProperty(app.student, 'name')?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (getStudentProperty(app.student, 'college')?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesJob && matchesSearch;
  });

  const uniqueJobs = Array.from(new Set(applications.map(app => app.job?._id).filter(Boolean)));

  // Calculate stats
  const stats = {
    total: applications.length,
    applied: applications.filter(app => app.status === 'applied').length,
    approved: applications.filter(app => app.status === 'approved' || app.status === 'accepted').length,
    pending: applications.filter(app => app.status === 'pending').length
  };

  if (loading) {
    return <LoadingOverlay message="Loading applications..." />;
  }

  return (
    <RoleProtectedRoute allowedRoles={['employer']}>
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-4 lg:py-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Link
              href="/employer"
              className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900 mb-3 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back</span>
            </Link>
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 tracking-tight" style={{ color: ACCENT }}>
                  Applications
                </h1>
                <p className="text-sm text-gray-600">
                  Review and manage student applications
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div className="p-2.5 bg-gray-50">
                <p className="text-xs text-gray-600 mb-0.5">Total</p>
                <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2.5 bg-blue-50">
                <p className="text-xs text-blue-600 mb-0.5">New</p>
                <p className="text-lg font-bold text-blue-700">{stats.applied}</p>
              </div>
              <div className="p-2.5 bg-yellow-50">
                <p className="text-xs text-yellow-600 mb-0.5">Pending</p>
                <p className="text-lg font-bold text-yellow-700">{stats.pending}</p>
              </div>
              <div className="p-2.5 bg-green-50">
                <p className="text-xs text-green-600 mb-0.5">Approved</p>
                <p className="text-lg font-bold text-green-700">{stats.approved}</p>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <div className="flex flex-col md:flex-row gap-2">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, job, or college..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all"
                />
              </div>
              
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all bg-white min-w-[140px]"
              >
                <option value="">All Status</option>
                <option value="applied">Applied</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="closed">Closed</option>
              </select>
              
              {/* Job Filter */}
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all bg-white min-w-[160px]"
              >
                <option value="">All Jobs</option>
                {uniqueJobs.map(jobId => {
                  const job = applications.find(app => app.job?._id === jobId)?.job;
                  const jobTitle = (job as any)?.title || (job as any)?.jobTitle || 'Unknown Job';
                  return (
                    <option key={jobId} value={jobId}>
                      {jobTitle}
                    </option>
                  );
                })}
              </select>

              {/* Clear Filters */}
              {(selectedStatus || selectedJob || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedStatus('');
                    setSelectedJob('');
                    setSearchTerm('');
                  }}
                  className="px-3 py-2 text-sm border-2 font-semibold transition-all duration-300"
                  style={{ color: ACCENT, borderColor: ACCENT }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F0F9FA';
                    e.currentTarget.style.borderColor = '#238085';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = ACCENT;
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Applications List */}
          <div className="space-y-2">
            {!error && filteredApplications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No applications found</h3>
                <p className="text-sm text-gray-600">
                  {applications.length === 0 
                    ? 'You haven\'t received any applications yet.' 
                    : 'Try adjusting your search criteria or filters.'}
                </p>
              </motion.div>
            ) : (
              filteredApplications.map((application, index) => {
                const statusColors = getStatusColor(application.status);
                const studentName = getStudentProperty(application.student, 'name') || 'Unknown Student';
                const studentEmail = getStudentProperty(application.student, 'email') || '';
                const studentPhone = getStudentProperty(application.student, 'phone') || '';
                const studentCollege = getStudentProperty(application.student, 'college') || '';
                const studentSkills = getStudentProperty(application.student, 'skills') || [];

                return (
                  <motion.div
                    key={application._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-gray-200 p-3 hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Student Info */}
                      <div className="flex items-start gap-3 flex-1">
                        {/* Avatar */}
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: ACCENT }}
                        >
                          {studentName.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-base font-bold text-gray-900 mb-0.5">
                                {studentName}
                              </h3>
                              <p className="text-xs text-gray-600 mb-1">
                                {(application.job as any)?.title || (application.job as any)?.jobTitle || 'Unknown Job'}
                              </p>
                            </div>
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                              {application.status === 'applied' ? 'Applied' : 
                               application.status === 'pending' ? 'Pending' :
                               application.status === 'approved' ? 'Approved' :
                               application.status === 'accepted' ? 'Accepted' :
                               application.status === 'rejected' ? 'Rejected' :
                               application.status === 'closed' ? 'Closed' : application.status}
                            </span>
                          </div>
                          
                          {/* Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                            {studentCollege && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <GraduationCap className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{studentCollege}</span>
                              </div>
                            )}
                            {application.job?.location && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{application.job.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span>Applied {formatDate(application.appliedDate || (application as any).appliedAt || '')}</span>
                            </div>
                          </div>

                          {/* Skills */}
                          {studentSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {studentSkills.slice(0, 4).map((skill: string, idx: number) => (
                                <span 
                                  key={idx} 
                                  className="px-2 py-0.5 text-xs font-medium rounded"
                                  style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                                >
                                  {skill}
                                </span>
                              ))}
                              {studentSkills.length > 4 && (
                                <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                                  +{studentSkills.length - 4} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Contact */}
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            {studentEmail && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span className="truncate">{studentEmail}</span>
                              </div>
                            )}
                            {studentPhone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span>{studentPhone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: Actions */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => openApplicationModal(application)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-300"
                          style={{ backgroundColor: ACCENT }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#238085'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ACCENT}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        
                        {(application as any).resume && (
                          <button
                            onClick={() => window.open((application as any).resume, '_blank')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-2 transition-all duration-300"
                            style={{ color: ACCENT, borderColor: ACCENT }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#F0F9FA';
                              e.currentTarget.style.borderColor = '#238085';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = ACCENT;
                            }}
                          >
                            <Download className="w-3.5 h-3.5" />
                            Resume
                          </button>
                        )}
                        
                        {application.status === 'applied' && (
                          <div className="flex gap-1.5 mt-1">
                            <button
                              onClick={() => handleApplicationAction(application._id, 'approve')}
                              disabled={actionLoading === application._id}
                              className="flex-1 px-2 py-1.5 bg-green-600 text-white text-xs font-semibold rounded transition-all hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
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
                              className="flex-1 px-2 py-1.5 bg-red-600 text-white text-xs font-semibold rounded transition-all hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                              {actionLoading === application._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Application Detail Modal */}
        <AnimatePresence>
          {showApplicationModal && selectedApplication && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
              onClick={() => setShowApplicationModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Application Details</h2>
                    <button
                      onClick={() => setShowApplicationModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Student Info */}
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {getStudentProperty(selectedApplication.student, 'name')?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 mb-0.5">
                        {getStudentProperty(selectedApplication.student, 'name') || 'Unknown Student'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{(selectedApplication.job as any)?.title || (selectedApplication.job as any)?.jobTitle || 'Unknown Job'}</p>
                      <div className="space-y-1.5 text-xs text-gray-600">
                        {getStudentProperty(selectedApplication.student, 'email') && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span>{getStudentProperty(selectedApplication.student, 'email')}</span>
                          </div>
                        )}
                        {getStudentProperty(selectedApplication.student, 'phone') && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{getStudentProperty(selectedApplication.student, 'phone')}</span>
                          </div>
                        )}
                        {getStudentProperty(selectedApplication.student, 'college') && (
                          <div className="flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                            <span>{getStudentProperty(selectedApplication.student, 'college')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  {selectedApplication.coverLetter && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Cover Letter</h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-700 whitespace-pre-wrap text-xs leading-relaxed">{selectedApplication.coverLetter}</p>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {getStudentProperty(selectedApplication.student, 'skills') && 
                   Array.isArray(getStudentProperty(selectedApplication.student, 'skills')) && 
                   getStudentProperty(selectedApplication.student, 'skills').length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {getStudentProperty(selectedApplication.student, 'skills').map((skill: string, idx: number) => (
                          <span 
                            key={idx} 
                            className="px-2.5 py-1 text-xs font-medium rounded"
                            style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    {(selectedApplication as any).resume && (
                      <button
                        onClick={() => window.open((selectedApplication as any).resume, '_blank')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border-2 transition-all duration-300"
                        style={{ color: ACCENT, borderColor: ACCENT }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F0F9FA';
                          e.currentTarget.style.borderColor = '#238085';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = ACCENT;
                        }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Resume
                      </button>
                    )}
                    
                    {selectedApplication.status === 'applied' && (
                      <>
                        <button
                          onClick={() => {
                            handleApplicationAction(selectedApplication._id, 'approve');
                            setShowApplicationModal(false);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded transition-all hover:bg-green-700"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            handleApplicationAction(selectedApplication._id, 'reject');
                            setShowApplicationModal(false);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded transition-all hover:bg-red-700"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RoleProtectedRoute>
  );
}

export default function EmployerApplicationsPage() {
  return (
    <Suspense fallback={<LoadingOverlay message="Loading applications..." />}>
      <EmployerApplicationsContent />
    </Suspense>
  );
}
