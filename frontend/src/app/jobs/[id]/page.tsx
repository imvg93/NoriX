"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  DollarSign, 
  Building, 
  Star, 
  Award, 
  Users, 
  Upload, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Download
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';
import { kycStatusService } from '../../../services/kycStatusService';
import RoleProtectedRoute from '../../../components/auth/RoleProtectedRoute';
import ResumeUpload from '../../../components/ResumeUpload';
import { useSafeNavigation } from '../../../hooks/useSafeNavigation';

interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: number | string;
  type: string;
  requirements?: string[];
  createdAt: string;
  employer?: string;
  highlighted?: boolean;
}

interface Company {
  name: string;
  logo?: string;
  industry?: string;
  location?: string;
  achievements?: string[];
  description?: string;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { navigateBack } = useSafeNavigation();
  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [resume, setResume] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showCompanyProfile, setShowCompanyProfile] = useState(false);
  const [kycStatus, setKycStatus] = useState<'not_submitted' | 'pending' | 'approved' | 'rejected' | 'suspended'>('not_submitted');
  const [kycMessage, setKycMessage] = useState<string>('');

  const jobId = params.id as string;

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch job details using the API service
        const jobData = await apiService.getJob(jobId);
        console.log('Job data received:', jobData);
        setJob(jobData);
        
        // Mock company data - replace with actual API call
        setCompany({
          name: jobData.company || 'Company Name',
          industry: 'Technology',
          location: jobData.location,
          achievements: [
            'Best Startup 2023',
            'Innovation Award',
            'Top Employer'
          ],
          description: 'We are a leading technology company focused on innovation and growth.'
        });
        
        // Check if user has already applied
        if (user?.userType === 'student') {
          try {
            const applications = await apiService.getUserApplications();
            const hasApplied = applications.applications?.some(
              (app: any) => app.job === jobId || (typeof app.job === 'object' && app.job._id === jobId)
            );
            setApplied(hasApplied || false);
          } catch (err) {
            console.log('Could not check application status');
          }
        }
        
      } catch (err: any) {
        console.error('Error fetching job details:', err);
        setError(err.message || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId, user]);

  // Load KYC status for gating apply button
  useEffect(() => {
    const loadKYC = async () => {
      try {
        if (user?.userType === 'student') {
          const status = await kycStatusService.checkKYCStatus();
          setKycStatus(status.status);
          setKycMessage(kycStatusService.getStatusMessage(status));
        }
      } catch (_) {}
    };
    loadKYC();
  }, [user]);


  const handleApply = async () => {
    if (!user || user.userType !== 'student') {
      alert('You need to be logged in as a student to apply for jobs.');
      return;
    }

    if (applied) {
      alert('You have already applied for this job');
      return;
    }

    if (!resume) {
      alert('Please upload your resume before applying');
      return;
    }

    try {
      setUploading(true);
      
      // Upload resume first
      const formData = new FormData();
      formData.append('resume', resume);
      formData.append('jobId', jobId);
      
      const response = await apiService.applyForJob(jobId, formData);
      
      setApplied(true);
      alert('Application submitted successfully!');
      
      // Optionally redirect to applications page
      setTimeout(() => {
        router.push('/student/approved-applications');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error applying for job:', err);
      alert(err.message || 'Failed to submit application');
    } finally {
      setUploading(false);
    }
  };

  const formatSalary = (salary: any) => {
    if (!salary) return 'Salary Not Specified';
    if (typeof salary === 'number') {
      return `₹${salary.toLocaleString()}`;
    }
    return salary.toString();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The job you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/jobs')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <RoleProtectedRoute allowedRoles={['student', 'employer', 'admin']} allowUnauthenticated={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={navigateBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </button>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Building className="w-5 h-5" />
                    <span className="font-medium">{job.company}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-5 h-5" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-5 h-5" />
                    <span>{job.type}</span>
                  </div>
                </div>
              </div>
              
              {job.highlighted && (
                <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4 fill-current" />
                  Featured
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Job Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>
              </motion.div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Company Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">About {company?.name}</h2>
                  <button
                    onClick={() => setShowCompanyProfile(!showCompanyProfile)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    {showCompanyProfile ? 'Hide Details' : 'View Full Profile'}
                  </button>
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Building className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{company?.name}</h3>
                    <p className="text-gray-600">{company?.industry}</p>
                    <p className="text-gray-500 text-sm">{company?.location}</p>
                  </div>
                </div>

                {showCompanyProfile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Company Description</h4>
                      <p className="text-gray-700">{company?.description}</p>
                    </div>

                    {company?.achievements && company.achievements.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Key Achievements</h4>
                        <div className="space-y-2">
                          {company.achievements.map((achievement, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-yellow-500" />
                              <span className="text-gray-700">{achievement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Details Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
              >
                <h3 className="font-semibold text-gray-900 mb-4">Job Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{formatSalary(job.salary)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{job.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <span className="text-gray-700">Posted {formatDate(job.createdAt)}</span>
                  </div>
                </div>
              </motion.div>

              {/* Apply Section */}
              {user?.userType === 'student' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-900 mb-4">Apply for this Job</h3>
                  
                  {applied ? (
                    <div className="text-center py-4">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-green-600 font-medium">Application Submitted!</p>
                      <p className="text-gray-500 text-sm">You will hear back from the employer soon.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Resume Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Resume *
                        </label>
                        <ResumeUpload
                          onFileSelect={setResume}
                          selectedFile={resume}
                          disabled={uploading}
                        />
                      </div>

                      {/* Apply Button */}
                      <button
                        onClick={handleApply}
                        disabled={!resume || uploading || kycStatus !== 'approved'}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            {kycStatus === 'approved' ? 'Apply Now' : 'Complete KYC to Apply'}
                          </>
                        )}
                      </button>
                      {kycStatus !== 'approved' && (
                        <p className="text-sm text-gray-500 text-center mt-2">{kycMessage || 'Complete your KYC to apply.'}</p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Employer Actions */}
              {user?.userType === 'employer' && job.employer === user._id && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-900 mb-4">Manage Job</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push(`/employer/applications?jobId=${jobId}`)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Applications
                    </button>
                    <button
                      onClick={() => router.push(`/employer/post-job?edit=${jobId}`)}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      Edit Job
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}