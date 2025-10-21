"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Download, 
  Mail, 
  Phone, 
  Calendar,
  Loader2,
  User,
  MapPin,
  Clock,
  FileText,
  Star
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { apiService } from '../../../../services/api';
import RoleProtectedRoute from '../../../../components/auth/RoleProtectedRoute';
import { useSafeNavigation } from '../../../../hooks/useSafeNavigation';

interface ApplicationDetail {
  _id: string;
  jobId: {
    _id: string;
    jobTitle: string;
    companyName: string;
    location: string;
    salaryRange: string;
  };
  studentId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    skills: string[];
    college?: string;
    availability?: string;
  };
  status: string;
  appliedAt: string;
  coverLetter?: string;
  expectedPay?: number;
  availability?: string;
  resume?: string;
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { navigateBack } = useSafeNavigation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const applicationId = params.id as string;

  useEffect(() => {
    const fetchApplication = async () => {
      if (!user || user.userType !== 'employer' || !applicationId) return;

      try {
        setLoading(true);
        setError('');
        
        console.log('🔍 Fetching application with ID:', applicationId);
        console.log('🔍 Application ID type:', typeof applicationId);
        console.log('🔍 Application ID length:', applicationId.length);
        
        // Check if the ID looks like a job ID (common job IDs in the system)
        const commonJobIds = ['68d7c0a0df0c792ce5ac1133', '68d7bd76df0c792ce5ac10fa', '68d7bd6cdf0c792ce5ac10e7'];
        if (commonJobIds.includes(applicationId)) {
          console.warn('⚠️ This looks like a job ID, not an application ID!');
          setError('This appears to be a job ID, not an application ID. Please check the URL and try again.');
          setLoading(false);
          return;
        }
        
        // Additional check: if the ID looks like a job ID pattern
        if (applicationId.length === 24 && applicationId.match(/^[0-9a-fA-F]{24}$/)) {
          console.warn('⚠️ This ID looks like a MongoDB ObjectId, but might be a job ID');
          // Don't block it, but log a warning
        }
        
        // Fetch application details
        const response = await apiService.getApplication(applicationId);
        console.log('✅ Application fetched successfully:', response);
        
        // Transform Application to ApplicationDetail format
        const applicationDetail: ApplicationDetail = {
          _id: response.application._id,
          jobId: {
            _id: response.application.job._id,
            jobTitle: response.application.job.title,
            companyName: response.application.job.company,
            location: response.application.job.location,
            salaryRange: response.application.job.salary ? `$${response.application.job.salary}${response.application.job.payType ? `/${response.application.job.payType}` : ''}` : 'Not specified'
          },
          studentId: {
            _id: typeof response.application.student === 'object' ? response.application.student._id : '',
            name: typeof response.application.student === 'object' ? response.application.student.name : '',
            email: typeof response.application.student === 'object' ? response.application.student.email : '',
            phone: typeof response.application.student === 'object' ? response.application.student.phone : '',
            skills: typeof response.application.student === 'object' ? response.application.student.skills || [] : [],
            college: typeof response.application.student === 'object' ? response.application.student.college : '',
            availability: response.application.availability || ''
          },
          status: response.application.status,
          appliedAt: response.application.appliedDate,
          coverLetter: response.application.coverLetter || '',
          expectedPay: response.application.expectedPay || 0,
          availability: response.application.availability || ''
        };
        
        setApplication(applicationDetail);
        
      } catch (err: any) {
        console.error('Error fetching application:', err);
        
        // Handle specific error cases
        if (err.message?.includes('Application not found')) {
          setError('Application not found. This application may have been deleted or the ID is incorrect.');
        } else if (err.status === 404 || err.status === 400) {
          setError('Application not found. Please check the application ID.');
        } else if (err.status === 403) {
          setError('You do not have permission to view this application.');
        } else if (err.status === 401) {
          setError('Please log in to view application details.');
        } else {
          setError(err.message || 'Failed to load application details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [user, applicationId]);

  const handleApplicationAction = async (action: 'approve' | 'reject' | 'close') => {
    if (!application) return;

    try {
      setActionLoading(action);
      
      if (action === 'approve') {
        await apiService.approveApplication(application._id);
        alert('Application approved successfully!');
      } else if (action === 'reject') {
        await apiService.rejectApplication(application._id);
        alert('Application rejected.');
      } else if (action === 'close') {
        await apiService.closeApplication(application._id);
        alert('Application closed.');
      }
      
      // Refresh application data
      const response = await apiService.getApplication(applicationId);
      
      // Transform Application to ApplicationDetail format
      const applicationDetail: ApplicationDetail = {
        _id: response.application._id,
        jobId: {
          _id: response.application.job._id,
          jobTitle: response.application.job.title,
          companyName: response.application.job.company,
          location: response.application.job.location,
          salaryRange: response.application.job.salary ? `$${response.application.job.salary}${response.application.job.payType ? `/${response.application.job.payType}` : ''}` : 'Not specified'
        },
        studentId: {
          _id: typeof response.application.student === 'object' ? response.application.student._id : '',
          name: typeof response.application.student === 'object' ? response.application.student.name : '',
          email: typeof response.application.student === 'object' ? response.application.student.email : '',
          phone: typeof response.application.student === 'object' ? response.application.student.phone : '',
          skills: typeof response.application.student === 'object' ? response.application.student.skills || [] : [],
          college: typeof response.application.student === 'object' ? response.application.student.college : '',
          availability: response.application.availability || ''
        },
        status: response.application.status,
        appliedAt: response.application.appliedDate,
        coverLetter: response.application.coverLetter || '',
        expectedPay: response.application.expectedPay || 0,
        availability: response.application.availability || ''
      };
      
      setApplication(applicationDetail);
      
    } catch (error: any) {
      console.error('Error updating application:', error);
      alert(error?.message || 'Failed to update application');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <RoleProtectedRoute allowedRoles={['employer']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </RoleProtectedRoute>
    );
  }

  if (error) {
    return (
      <RoleProtectedRoute allowedRoles={['employer']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="text-red-600 text-lg font-medium mb-2">Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <div className="text-sm text-gray-500 mb-6">
              <p className="mb-2">Possible solutions:</p>
              <ul className="text-left space-y-1">
                <li>• Check if you have any applications</li>
                <li>• Verify the application ID is correct</li>
                <li>• Make sure you're logged in as an employer</li>
                <li>• Try refreshing the applications page</li>
                <li>• If you entered a job ID, go to the job details page instead</li>
              </ul>
            </div>
            <div className="space-x-3">
              <button
                onClick={navigateBack}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Go Back
              </button>
              <button
                onClick={() => router.push('/employer/applications')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View All Applications
              </button>
            </div>
          </div>
        </div>
      </RoleProtectedRoute>
    );
  }

  if (!application) {
    return (
      <RoleProtectedRoute allowedRoles={['employer']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-600 text-lg font-medium mb-2">Application Not Found</div>
            <div className="text-gray-500 mb-4">The application you're looking for doesn't exist.</div>
            <button
              onClick={navigateBack}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </RoleProtectedRoute>
    );
  }

  return (
    <RoleProtectedRoute allowedRoles={['employer']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={navigateBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Application Details</h1>
                  <p className="text-sm text-gray-600">{application.jobId.jobTitle}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  application.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {application.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Job Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h2>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{application.jobId.jobTitle}</h3>
                      <p className="text-gray-600">{application.jobId.companyName}</p>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {application.jobId.location}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Salary:</span> {application.jobId.salaryRange}
                    </div>
                  </div>
                </motion.div>

                {/* Student Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{application.studentId.name}</h3>
                        <p className="text-sm text-gray-600">{application.studentId.email}</p>
                      </div>
                    </div>
                    
                    {application.studentId.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {application.studentId.phone}
                      </div>
                    )}
                    
                    {application.studentId.college && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">College:</span> {application.studentId.college}
                      </div>
                    )}
                    
                    {application.studentId.availability && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Availability:</span> {application.studentId.availability}
                      </div>
                    )}
                    
                    {application.studentId.skills && application.studentId.skills.length > 0 && (
                      <div>
                        <span className="font-medium text-sm text-gray-900">Skills:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {application.studentId.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Cover Letter */}
                {application.coverLetter && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Cover Letter</h2>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
                    </div>
                  </motion.div>
                )}

                {/* Application Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h2>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Applied on {new Date(application.appliedAt).toLocaleDateString()}
                    </div>
                    
                    {application.expectedPay && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Expected Pay:</span> ₹{application.expectedPay}
                      </div>
                    )}
                    
                    {application.availability && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Availability:</span> {application.availability}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                
                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                  
                  {application.status === 'applied' || application.status === 'pending' ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => handleApplicationAction('approve')}
                        disabled={actionLoading === 'approve'}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                      >
                        {actionLoading === 'approve' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Approve Application
                      </button>
                      
                      <button
                        onClick={() => handleApplicationAction('reject')}
                        disabled={actionLoading === 'reject'}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                      >
                        {actionLoading === 'reject' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Reject Application
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p className="text-sm">
                        {application.status === 'accepted' ? 'Application has been approved' : 
                         application.status === 'rejected' ? 'Application has been rejected' : 
                         'Application is closed'}
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Resume */}
                {application.resume && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume</h3>
                    <button
                      onClick={() => window.open(application.resume, '_blank')}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Resume
                    </button>
                  </motion.div>
                )}

                {/* Contact Information */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
                  <div className="space-y-3">
                    <a
                      href={`mailto:${application.studentId.email}`}
                      className="flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {application.studentId.email}
                    </a>
                    
                    {application.studentId.phone && (
                      <a
                        href={`tel:${application.studentId.phone}`}
                        className="flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {application.studentId.phone}
                      </a>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}

