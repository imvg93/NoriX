"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
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
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Shield,
  Calendar,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';
import { kycStatusService } from '../../../services/kycStatusService';
import RoleProtectedRoute from '../../../components/auth/RoleProtectedRoute';
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
  const [uploading, setUploading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [showCompanyProfile, setShowCompanyProfile] = useState(false);
  const [kycStatus, setKycStatus] = useState<'not_submitted' | 'pending' | 'approved' | 'rejected' | 'suspended'>('not_submitted');
  const [kycMessage, setKycMessage] = useState<string>('');
  const [showKycModal, setShowKycModal] = useState(false);
  const [isKYCApproved, setIsKYCApproved] = useState(false);
  const [kycLoading, setKycLoading] = useState(true);

  const jobId = params.id as string;

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError('');
        
        const jobData = await apiService.getJob(jobId);
        console.log('Job data received:', jobData);
        setJob(jobData);
        
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
        
        if (user?.userType === 'student') {
          try {
            const applications = await apiService.getUserApplications();
            const userApplication = applications.applications?.find(
              (app: any) => {
                const appJobId = typeof app.job === 'object' ? app.job?._id : app.job;
                return appJobId === jobId || app.job === jobId;
              }
            );
            
            if (userApplication) {
              setApplied(true);
              setApplicationStatus(userApplication.status || 'applied');
              setApplicationId(userApplication._id);
            } else {
              setApplied(false);
              setApplicationStatus(null);
              setApplicationId(null);
            }
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
    
    // Set up polling to refresh application status every 5 seconds
    const intervalId = setInterval(() => {
      if (user?.userType === 'student' && jobId) {
        apiService.getUserApplications()
          .then(applications => {
            const userApplication = applications.applications?.find(
              (app: any) => {
                const appJobId = typeof app.job === 'object' ? app.job?._id : app.job;
                return appJobId === jobId || app.job === jobId;
              }
            );
            
            if (userApplication) {
              setApplied(true);
              setApplicationStatus(userApplication.status || 'applied');
              setApplicationId(userApplication._id);
            }
          })
          .catch(err => console.log('Could not refresh application status'));
      }
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(intervalId);
  }, [jobId, user]);

  useEffect(() => {
    const loadKYC = async () => {
      if (!user || user.userType !== 'student') {
        setKycLoading(false);
        return;
      }

      try {
        setKycLoading(true);
        const status = await kycStatusService.forceRefreshKYCStatus();
        console.log('🔍 Job Detail Page - KYC Status:', status);
        console.log('🔍 Job Detail Page - Status value:', status.status);
        console.log('🔍 Job Detail Page - Is Completed:', status.isCompleted);
        
        const finalStatus = status.status || 'not_submitted';
        const isApproved = status.isCompleted || finalStatus === 'approved';
        
        console.log('🔍 Job Detail Page - Final Status:', finalStatus);
        console.log('🔍 Job Detail Page - Is Approved:', isApproved);
        
        setKycStatus(finalStatus);
        setIsKYCApproved(isApproved);
        setKycMessage(kycStatusService.getStatusMessage(status));
      } catch (error: any) {
        console.error("Error loading KYC status:", error);
        setKycStatus('not_submitted');
        setIsKYCApproved(false);
        setKycMessage('Please complete your KYC to apply for jobs.');
      } finally {
        setKycLoading(false);
      }
    };
    loadKYC();
  }, [user]);

  const handleApply = async () => {
    if (!user || user.userType !== 'student') {
      alert('You need to be logged in as a student to apply for jobs.');
      return;
    }

    if (!isKYCApproved && kycStatus !== 'approved') {
      setShowKycModal(true);
      return;
    }

    if (applied) {
      alert('You have already applied for this job');
      return;
    }

    try {
      setUploading(true);
      
      const response = await apiService.applyForJob(jobId);
      
      setApplied(true);
      alert('Application submitted successfully!');
      
      setTimeout(() => {
        router.push('/student/approved-applications');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error applying for job:', err);
      if (err?.message?.toLowerCase().includes('kyc') || err?.status === 403) {
        setShowKycModal(true);
      } else {
        alert(err.message || 'Failed to submit application');
      }
    } finally {
      setUploading(false);
    }
  };

  const formatSalary = (salary: any) => {
    if (!salary) return 'Salary Not Specified';
    if (typeof salary === 'number') {
      return `₹${salary.toLocaleString('en-IN')}`;
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
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#2A8A8C] mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The job you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/jobs')}
            className="px-6 py-3 bg-[#2A8A8C] hover:bg-[#1f6a6c] text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
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
        {/* Hero Header - Clean & Subtle */}
        <div className="bg-gradient-to-br from-[#2A8A8C]/95 via-[#2A8A8C] to-[#2A8A8C]/90 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
            <button
              onClick={navigateBack}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Jobs</span>
            </button>
            
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-5">
                  {job.highlighted && (
                    <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-medium">
                      <Star className="w-3.5 h-3.5 fill-white" />
                      Featured
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 px-2.5 py-1 rounded-lg text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {job.type}
                  </span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl lg:text-4xl font-semibold mb-5 leading-tight text-white">
                  {job.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-white/85">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span className="font-medium text-sm">{job.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{job.location}</span>
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium text-sm">{formatSalary(job.salary)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Posted {formatDate(job.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-[#2A8A8C]/5 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-[#2A8A8C]" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Job Description</h2>
                </div>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                    {job.description || 'No description available.'}
                  </p>
                </div>
              </motion.div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Requirements</h2>
                  </div>
                  <ul className="space-y-2.5">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600 text-[15px] leading-relaxed">{req}</span>
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
                className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Building className="w-4 h-4 text-blue-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">About {company?.name}</h2>
                  </div>
                  <button
                    onClick={() => setShowCompanyProfile(!showCompanyProfile)}
                    className="text-[#2A8A8C] hover:text-[#1f6a6c] font-medium text-sm transition-colors"
                  >
                    {showCompanyProfile ? 'Hide' : 'View More'}
                  </button>
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#2A8A8C]/10 rounded-lg flex items-center justify-center">
                    <Building className="w-7 h-7 text-[#2A8A8C]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">{company?.name}</h3>
                    <p className="text-gray-600 text-sm mt-0.5">{company?.industry}</p>
                    <p className="text-gray-500 text-xs mt-1">{company?.location}</p>
                  </div>
                </div>

                {showCompanyProfile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-gray-100"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Company Description</h4>
                      <p className="text-gray-700 leading-relaxed">{company?.description}</p>
                    </div>

                    {company?.achievements && company.achievements.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 text-sm">Key Achievements</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {company.achievements.map((achievement, index) => (
                            <div key={index} className="flex items-center gap-2 bg-gray-50/50 rounded-lg p-2.5">
                              <Award className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                              <span className="text-gray-600 text-xs">{achievement}</span>
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
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 sticky top-6"
              >
                <h3 className="text-base font-semibold text-gray-900 mb-4">Job Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-[#2A8A8C] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Salary</p>
                      <p className="text-gray-900 font-medium text-sm">{formatSalary(job.salary)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-lg">
                    <MapPin className="w-4 h-4 text-[#2A8A8C] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Location</p>
                      <p className="text-gray-900 font-medium text-sm">{job.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-lg">
                    <Clock className="w-4 h-4 text-[#2A8A8C] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Job Type</p>
                      <p className="text-gray-900 font-medium text-sm">{job.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-lg">
                    <Calendar className="w-4 h-4 text-[#2A8A8C] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Posted</p>
                      <p className="text-gray-900 font-medium text-sm">{formatDate(job.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Apply Section */}
              {user?.userType === 'student' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl p-5 shadow-sm border border-[#2A8A8C]/10"
                >
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Apply for this Job</h3>
                  
                  {applied ? (
                    <div className="text-center py-5">
                      {applicationStatus === 'approved' || applicationStatus === 'accepted' || applicationStatus === 'shortlisted' ? (
                        <>
                          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle className="w-7 h-7 text-green-500" />
                          </div>
                          <p className="text-green-600 font-semibold text-base mb-1">Application Approved! 🎉</p>
                          <p className="text-gray-500 text-xs mb-4">The employer has approved your application.</p>
                          {applicationId && (
                            <Link
                              href={`/student/approved-applications`}
                              className="inline-flex items-center justify-center gap-2 bg-[#2A8A8C] hover:bg-[#1f6a6c] text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              View & Accept Job
                            </Link>
                          )}
                        </>
                      ) : applicationStatus === 'rejected' ? (
                        <>
                          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <AlertCircle className="w-7 h-7 text-red-500" />
                          </div>
                          <p className="text-red-600 font-semibold text-base mb-1">Application Not Selected</p>
                          <p className="text-gray-500 text-xs">This position has been filled by another candidate.</p>
                        </>
                      ) : applicationStatus === 'hired' ? (
                        <>
                          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle className="w-7 h-7 text-green-500" />
                          </div>
                          <p className="text-green-600 font-semibold text-base mb-1">Job Accepted! 🎉</p>
                          <p className="text-gray-500 text-xs">You have accepted this job offer.</p>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-7 h-7 text-blue-500" />
                          </div>
                          <p className="text-blue-600 font-semibold text-base mb-1">Application Submitted!</p>
                          <p className="text-gray-500 text-xs">Status: {applicationStatus || 'Pending'}</p>
                          <p className="text-gray-500 text-xs mt-1">You will hear back from the employer soon.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {kycLoading ? (
                        <button
                          disabled
                          className="w-full bg-gray-100 text-gray-400 py-3 px-5 rounded-lg cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Checking Status...
                        </button>
                      ) : isKYCApproved || kycStatus === 'approved' ? (
                        <button
                          onClick={handleApply}
                          disabled={uploading}
                          className="w-full bg-[#2A8A8C] hover:bg-[#1f6a6c] text-white py-3 px-5 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Apply Now
                            </>
                          )}
                        </button>
                      ) : (
                        <>
                          <Link
                            href="/kyc-profile"
                            className="w-full bg-[#2A8A8C] hover:bg-[#1f6a6c] text-white py-3 px-5 rounded-lg transition-colors duration-200 font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <Shield className="w-4 h-4" />
                            Complete KYC
                          </Link>
                          <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
                            {kycMessage || 'Complete your KYC verification to apply for this job.'}
                          </p>
                        </>
                      )}
                      
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400 text-center">
                          Your profile information will be shared with the employer
                        </p>
                      </div>
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
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                >
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Manage Job</h3>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => router.push(`/employer/applications?jobId=${jobId}`)}
                      className="w-full bg-[#2A8A8C] hover:bg-[#1f6a6c] text-white py-2.5 px-4 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                    >
                      <Eye className="w-4 h-4" />
                      View Applications
                    </button>
                    <button
                      onClick={() => router.push(`/employer/post-job?edit=${jobId}`)}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2.5 px-4 rounded-lg transition-colors duration-200 font-medium text-sm"
                    >
                      Edit Job
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* KYC Modal */}
        {showKycModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">KYC Verification Required</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Complete your verification to apply</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowKycModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-5">
                <p className="text-gray-600 leading-relaxed text-sm">
                  {kycMessage || 'Please complete your KYC (Know Your Customer) verification to apply for jobs. This helps us ensure the security and authenticity of all users.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => {
                    setShowKycModal(false);
                    router.push('/kyc-profile');
                  }}
                  className="flex-1 bg-[#2A8A8C] hover:bg-[#1f6a6c] text-white py-2.5 px-5 rounded-lg transition-colors duration-200 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete KYC
                </button>
                <button
                  onClick={() => setShowKycModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-5 rounded-lg transition-colors font-medium text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </RoleProtectedRoute>
  );
}
