"use client";

import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';

// Job statistics data with Indian prices
const jobStats = {
  'Shop Keeping': {
    dailyEarning: '₹300 - ₹500',
    monthlyEarning: '₹8,000 - ₹12,000',
    workersCount: '2,450'
  },
  'Sales associate': {
    dailyEarning: '₹400 - ₹600',
    monthlyEarning: '₹10,000 - ₹15,000',
    workersCount: '3,200'
  },
  'Restaurant staff': {
    dailyEarning: '₹350 - ₹500',
    monthlyEarning: '₹8,500 - ₹12,500',
    workersCount: '4,100'
  },
  'Food delivery boy': {
    dailyEarning: '₹400 - ₹700',
    monthlyEarning: '₹10,000 - ₹18,000',
    workersCount: '5,800'
  },
  'Office assistant': {
    dailyEarning: '₹500 - ₹800',
    monthlyEarning: '₹12,000 - ₹20,000',
    workersCount: '1,900'
  },
  'Event coordinator': {
    dailyEarning: '₹600 - ₹1,000',
    monthlyEarning: '₹15,000 - ₹25,000',
    workersCount: '850'
  },
  'Event staff': {
    dailyEarning: '₹400 - ₹600',
    monthlyEarning: '₹10,000 - ₹15,000',
    workersCount: '2,100'
  },
  'Event helper': {
    dailyEarning: '₹300 - ₹500',
    monthlyEarning: '₹7,500 - ₹12,000',
    workersCount: '3,400'
  },
  'Library assistant': {
    dailyEarning: '₹400 - ₹600',
    monthlyEarning: '₹10,000 - ₹15,000',
    workersCount: '1,200'
  }
};

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [userJobs, setUserJobs] = useState<any[]>([]);
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [userStats, setUserStats] = useState(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [showKycPendingModal, setShowKycPendingModal] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  const handleJobClick = (jobName: string) => {
    setSelectedJob(jobName);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedJob(null);
  };

  // Fetch KYC status
  useEffect(() => {
    const fetchKycStatus = async () => {
      if (isAuthenticated && user?.userType === 'student') {
        try {
          const { kycStatusService } = await import('@/services/kycStatusService');
          const status = await kycStatusService.checkKYCStatus();
          setKycStatus(status.status);
        } catch (error) {
          console.error('Error fetching KYC status:', error);
        }
      }
    };
    fetchKycStatus();
  }, [isAuthenticated, user]);

  const handleKycClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (kycStatus === 'pending') {
      setShowKycPendingModal(true);
    } else {
      router.push('/kyc-profile');
    }
  };

  // Fetch user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserData();
    }
  }, [isAuthenticated, user]);

  const fetchUserData = async () => {
    setJobsLoading(true);
    try {
      if (user?.userType === 'student') {
        // Fetch student applications
        const applications = await apiService.getStudentApplications();  
        setUserApplications(applications.applications || []);
        
        // Fetch recent jobs for student
        const jobs = await apiService.getJobs();
        setUserJobs(jobs.jobs?.slice(0, 6) || []);
      } else if (user?.userType === 'employer') {
        // Fetch employer jobs
        const jobs = await apiService.getEmployerJobs();
        setUserJobs(jobs.jobs || []);
        
        // Fetch employer applications
        const applications = await apiService.getEmployerApplications();
        setUserApplications(applications.applications || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-20 bg-white overflow-hidden">
        {/* Abstract Shapes Background - Hidden on mobile for better performance */}
        <div className="absolute inset-0 hidden sm:block">
          {/* Left side dark green circle with blue lines */}
          <div className="absolute left-0 top-20 w-64 sm:w-80 lg:w-96 h-64 sm:h-80 lg:h-96 bg-[#32A4A6] rounded-full opacity-20"></div>
          <div className="absolute left-20 sm:left-32 top-32 sm:top-40 w-2 h-24 sm:h-32 bg-blue-500 transform rotate-45"></div>
          <div className="absolute left-28 sm:left-40 top-40 sm:top-48 w-2 h-16 sm:h-24 bg-blue-400 transform rotate-45"></div>
          
          {/* Right side flowing shapes */}
          <div className="absolute right-10 sm:right-20 top-8 sm:top-10 w-24 sm:w-32 h-24 sm:h-32 bg-green-300 rounded-full opacity-30"></div>
          <div className="absolute right-28 sm:right-40 top-24 sm:top-32 w-20 sm:w-24 h-20 sm:h-24 bg-yellow-300 rounded-full opacity-40"></div>
          <div className="absolute right-44 sm:right-60 top-16 sm:top-20 w-12 sm:w-16 h-12 sm:h-16 bg-green-400 rounded-full opacity-50"></div>
          
          {/* Yellow circular outline */}
          <div className="absolute right-24 sm:right-32 top-48 sm:top-60 w-16 sm:w-20 h-16 sm:h-20 border-4 border-yellow-400 rounded-full"></div>
          
          {/* 3x3 dots pattern */}
          <div className="absolute right-60 sm:right-80 top-32 sm:top-40 grid grid-cols-3 gap-1 sm:gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gray-600 rounded-full"></div>
            ))}
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {!loading && (
            <>
              {isAuthenticated && user ? (
                <>
                  {/* Authenticated User Hero */}
                  {user?.userType === 'student' && (
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#32A4A6] mb-6 sm:mb-8 leading-tight">
                      Welcome back, {user?.name}! 🎓
                    </h1>
                  )}
                  {user?.userType === 'employer' && (
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#32A4A6] mb-6 sm:mb-8 leading-tight">
                      Find the best student talent, {user?.name}! 👥
                    </h1>
                  )}
                </>
              ) : (
                <>
                  {/* Unauthenticated User Hero */}
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#32A4A6] mb-6 sm:mb-8 leading-tight">
                    Find trusted student works
                  </h1>
                </>
              )}
            </>
          )}
          {loading && (
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#32A4A6] mb-6 sm:mb-8 leading-tight">
              Find trusted student works
            </h1>
          )}
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="What kind of job are you looking for?"
                className="w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none focus:border-green-500"
              />
              <button className="absolute right-1 sm:right-2 top-1 sm:top-2 bg-[#32A4A6] text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Role-specific Action Buttons */}
          {!loading && isAuthenticated && user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 sm:mb-8">
              {user?.userType === 'student' && (
                <>
                  <Link 
                    href="/student/jobs"
                    className="bg-[#32A4A6] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#2a8a8c] transition-colors text-center"
                  >
                    Browse Jobs
                  </Link>
                  <Link 
                    href="/student/dashboard"
                    className="bg-white border-2 border-[#32A4A6] text-[#32A4A6] px-8 py-3 rounded-lg font-semibold hover:bg-[#32A4A6] hover:text-white transition-colors text-center"
                  >
                    My Dashboard
                  </Link>
                  <button
                    onClick={handleKycClick}
                    className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-center animate-pulse"
                  >
                    Complete KYC
                  </button>
                  
                </>
              )}
              {user?.userType === 'employer' && (
                <>
                  <Link 
                    href="/employer/post-job"
                    className="bg-[#32A4A6] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#2a8a8c] transition-colors text-center"
                  >
                    Post a Job
                  </Link>
                  <Link 
                    href="/employer/dashboard"
                    className="bg-white border-2 border-[#32A4A6] text-[#32A4A6] px-8 py-3 rounded-lg font-semibold hover:bg-[#32A4A6] hover:text-white transition-colors text-center"
                  >
                    My Dashboard
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Service box - Responsive */}
          <div className="inline-block bg-white border-2 border-gray-300 rounded-lg px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8">
            <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Remote work service provided for</p>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded"></div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded"></div>
              <span className="font-semibold text-gray-800 text-sm sm:text-base">Global Companies</span>
            </div>
          </div>
        </div>
      </section>

      {/* User Dashboard Section */}
      {!loading && isAuthenticated && user && (
        <section className="py-8 sm:py-12 bg-gradient-to-r from-[#32A4A6]/5 to-[#32A4A6]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* User Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Profile Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-[#32A4A6] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </div>
                
                {/* User Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome back, {user?.name}! 👋
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {user?.userType === 'student' ? '🎓 Student' : '💼 Employer'} • {user?.email}
                  </p>
                  
                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-[#32A4A6]/10 px-4 py-2 rounded-lg">
                      <span className="text-sm text-gray-600">Applications:</span>
                      <span className="ml-2 font-semibold text-[#32A4A6]">{userApplications.length}</span>
                    </div>
                    <div className="bg-[#32A4A6]/10 px-4 py-2 rounded-lg">
                      <span className="text-sm text-gray-600">Jobs:</span>
                      <span className="ml-2 font-semibold text-[#32A4A6]">{userJobs.length}</span>
                    </div>
                    {user?.userType === 'student' && (
                      <div className="bg-green-100 px-4 py-2 rounded-lg">
                        <span className="text-sm text-gray-600">Active Applications:</span>
                        <span className="ml-2 font-semibold text-green-700">
                          {userApplications.filter((app: any) => app.status === 'pending').length}
                        </span>
                      </div>
                    )}
                    {user?.userType === 'employer' && (
                      <div className="bg-blue-100 px-4 py-2 rounded-lg">
                        <span className="text-sm text-gray-600">Active Jobs:</span>
                        <span className="ml-2 font-semibold text-blue-700">
                          {userJobs.filter((job: any) => job.status === 'active').length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {user?.userType === 'student' && (
                    <>
                      <Link 
                        href="/student/jobs"
                        className="bg-[#32A4A6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2a8a8c] transition-colors text-center"
                      >
                        Browse Jobs
                      </Link>
                      <Link 
                        href="/student/approved-applications"
                        className="bg-white border-2 border-[#32A4A6] text-[#32A4A6] px-6 py-3 rounded-lg font-semibold hover:bg-[#32A4A6] hover:text-white transition-colors text-center"
                      >
                        My Applications
                      </Link>
                    </>
                  )}
                  {user?.userType === 'employer' && (
                    <>
                      <Link 
                        href="/employer/post-job"
                        className="bg-[#32A4A6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2a8a8c] transition-colors text-center"
                      >
                        Post Job
                      </Link>
                      <Link 
                        href="/employer/applications"
                        className="bg-white border-2 border-[#32A4A6] text-[#32A4A6] px-6 py-3 rounded-lg font-semibold hover:bg-[#32A4A6] hover:text-white transition-colors text-center"
                      >
                        Review Applications
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Recent Jobs */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {user?.userType === 'student' ? '💼 Recent Jobs' : '📝 My Posted Jobs'}
                  </h3>
                  <Link 
                    href={user?.userType === 'student' ? '/student/jobs' : '/employer/dashboard'}
                    className="text-[#32A4A6] hover:text-[#2a8a8c] font-medium"
                  >
                    View All
                  </Link>
                </div>
                
                {jobsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#32A4A6]"></div>
                  </div>
                ) : userJobs.length > 0 ? (
                  <div className="space-y-4">
                    {userJobs.slice(0, 3).map((job: any) => (
                      <div key={job._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{job.jobTitle || job.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{job.companyName || job.company}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>📍 {job.location}</span>
                              <span>💰 {job.salaryRange || job.salary}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No jobs found</p>
                    {user?.userType === 'employer' && (
                      <Link 
                        href="/employer/post-job"
                        className="text-[#32A4A6] hover:text-[#2a8a8c] font-medium mt-2 inline-block"
                      >
                        Post your first job
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Applications */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {user?.userType === 'student' ? '📋 My Applications' : '👥 Recent Applications'}
                  </h3>
                  <Link 
                    href={user?.userType === 'student' ? '/student/approved-applications' : '/employer/applications'}
                    className="text-[#32A4A6] hover:text-[#2a8a8c] font-medium"
                  >
                    View All
                  </Link>
                </div>
                
                {jobsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#32A4A6]"></div>
                  </div>
                ) : userApplications.length > 0 ? (
                  <div className="space-y-4">
                    {userApplications.slice(0, 3).map((application: any) => (
                      <div key={application._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {user?.userType === 'student' 
                                ? application.job?.jobTitle || application.job?.title 
                                : application.student?.name || 'Student Application'
                              }
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {user?.userType === 'student' 
                                ? application.job?.companyName || application.job?.company
                                : application.job?.jobTitle || application.job?.title
                              }
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>📅 {new Date(application.appliedAt).toLocaleDateString()}</span>
                              <span>📍 {application.job?.location}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            application.status === 'approved' ? 'bg-green-100 text-green-800' :
                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {application.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>{user?.userType === 'student' ? 'No applications yet' : 'No applications received'}</p>
                    {user?.userType === 'student' && (
                      <Link 
                        href="/student/jobs"
                        className="text-[#32A4A6] hover:text-[#2a8a8c] font-medium mt-2 inline-block"
                      >
                        Browse available jobs
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Job Categories */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                title: 'Technology',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Marketing',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h2z" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Education',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Business',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Creative',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Customer Service',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Remote Work',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                highlighted: false
              },
              {
                title: 'Trending',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                highlighted: false
              }
            ].map((category) => (
              <div key={category.title} className={`flex flex-col items-center p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer ${category.highlighted ? 'bg-blue-50' : ''}`}>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-2 sm:mb-3 ${category.highlighted ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {category.title === 'Technology' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
                    {category.title === 'Marketing' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h2z" />}
                    {category.title === 'Education' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                    {category.title === 'Business' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
                    {category.title === 'Creative' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />}
                    {category.title === 'Customer Service' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
                    {category.title === 'Remote Work' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    {category.title === 'Trending' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">{category.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Sub-categories */}
      <section className="py-6 sm:py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {[
              'Shop Keeping',
              'Sales associate',
              'Restaurant staff',
              'Food delivery boy',
              'Office assistant',
              'Event coordinator',
              'Event staff',
              'Event helper',
              'Event helper',
              'Library assistant'
            ].map((subcategory, idx) => (
              <button 
                key={`${subcategory}-${idx}`} 
                onClick={() => handleJobClick(subcategory)}
                className="px-3 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm sm:text-base cursor-pointer"
              >
                {subcategory}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Essentials for hiring - simplified clean cards */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Hire smarter with NoriX</h2>
            <p className="text-gray-600">Three simple tools to find and manage the right students</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="w-10 h-10 bg-[#32A4A6] text-white rounded-lg flex items-center justify-center mb-3">🏷️</div>
              <h3 className="font-semibold text-gray-900 mb-1">Branded profile</h3>
              <p className="text-sm text-gray-600">Show your culture and stand out to students.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="w-10 h-10 bg-[#32A4A6] text-white rounded-lg flex items-center justify-center mb-3">🔎</div>
              <h3 className="font-semibold text-gray-900 mb-1">Smart filtering</h3>
              <p className="text-sm text-gray-600">Match candidates by skills and availability.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="w-10 h-10 bg-[#32A4A6] text-white rounded-lg flex items-center justify-center mb-3">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-1">Fast hiring</h3>
              <p className="text-sm text-gray-600">Shortlist and message in minutes, not days.</p>
            </div>
          </div>
        </div>
      </section>

       {/* Popular Projects */}
       <section className="py-16 sm:py-20 bg-gradient-to-br from-[#32A4A6]/5 to-[#32A4A6]/10">
         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-12 sm:mb-16">
             <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#32A4A6] mb-4">
               Popular Projects
             </h2>
             <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto">
               Services provided by skilled students for your home and business needs
             </p>
           </div>
           
           <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0">
             <style jsx>{`
               .flex::-webkit-scrollbar {
                 height: 6px;
               }
               .flex::-webkit-scrollbar-track {
                 background: #e5f7f7;
                 border-radius: 3px;
               }
               .flex::-webkit-scrollbar-thumb {
                 background: #32A4A6;
                 border-radius: 3px;
               }
               .flex::-webkit-scrollbar-thumb:hover {
                 background: #2a8a8c;
               }
             `}</style>
             {/* Furniture Assembly */}
             <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0 w-72 sm:w-auto border-2 border-transparent hover:border-[#32A4A6]/30 transform hover:-translate-y-1">
               <div className="h-48 bg-gradient-to-br from-[#32A4A6]/10 to-[#32A4A6]/5 flex items-center justify-center">
                 <div className="text-center">
                   <div className="w-16 h-16 bg-[#32A4A6] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                     <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                     </svg>
                   </div>
                   <p className="text-sm text-[#32A4A6] font-medium">Furniture Assembly</p>
                 </div>
               </div>
               <div className="p-4">
                 <h3 className="font-bold text-gray-900 mb-2">Furniture Assembly</h3>
                 <p className="text-sm text-[#32A4A6] font-semibold">Projects starting at ₹3,500</p>
               </div>
             </div>

             {/* Mount Art or Shelves */}
             <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0 w-72 sm:w-auto border-2 border-transparent hover:border-[#32A4A6]/30 transform hover:-translate-y-1">
               <div className="h-48 bg-gradient-to-br from-[#32A4A6]/10 to-[#32A4A6]/5 flex items-center justify-center">
                 <div className="text-center">
                   <div className="w-16 h-16 bg-[#32A4A6] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                     <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                     </svg>
                   </div>
                   <p className="text-sm text-[#32A4A6] font-medium">Mount Art or Shelves</p>
                 </div>
               </div>
               <div className="p-4">
                 <h3 className="font-bold text-gray-900 mb-2">Mount Art or Shelves</h3>
                 <p className="text-sm text-[#32A4A6] font-semibold">Projects starting at ₹4,500</p>
               </div>
             </div>

             {/* Mount a TV */}
             <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0 w-72 sm:w-auto border-2 border-transparent hover:border-[#32A4A6]/30 transform hover:-translate-y-1">
               <div className="h-48 bg-gradient-to-br from-[#32A4A6]/10 to-[#32A4A6]/5 flex items-center justify-center">
                 <div className="text-center">
                   <div className="w-16 h-16 bg-[#32A4A6] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                     <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                     </svg>
                   </div>
                   <p className="text-sm text-[#32A4A6] font-medium">Mount a TV</p>
                 </div>
               </div>
               <div className="p-4">
                 <h3 className="font-bold text-gray-900 mb-2">Mount a TV</h3>
                 <p className="text-sm text-[#32A4A6] font-semibold">Projects starting at ₹4,800</p>
               </div>
             </div>

             {/* Help Moving */}
             <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0 w-72 sm:w-auto border-2 border-transparent hover:border-[#32A4A6]/30 transform hover:-translate-y-1">
               <div className="h-48 bg-gradient-to-br from-[#32A4A6]/10 to-[#32A4A6]/5 flex items-center justify-center">
                 <div className="text-center">
                   <div className="w-16 h-16 bg-[#32A4A6] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                     <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                     </svg>
                   </div>
                   <p className="text-sm text-[#32A4A6] font-medium">Help Moving</p>
                 </div>
               </div>
               <div className="p-4">
                 <h3 className="font-bold text-gray-900 mb-2">Help Moving</h3>
                 <p className="text-sm text-[#32A4A6] font-semibold">Projects starting at ₹4,700</p>
               </div>
             </div>

             {/* Home & Apartment Cleaning */}
             <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0 w-72 sm:w-auto border-2 border-transparent hover:border-[#32A4A6]/30 transform hover:-translate-y-1">
               <div className="h-48 bg-gradient-to-br from-[#32A4A6]/10 to-[#32A4A6]/5 flex items-center justify-center">
                 <div className="text-center">
                   <div className="w-16 h-16 bg-[#32A4A6] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                     <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <p className="text-sm text-[#32A4A6] font-medium">Home & Apartment Cleaning</p>
                 </div>
               </div>
               <div className="p-4">
                 <h3 className="font-bold text-gray-900 mb-2">Home & Apartment Cleaning</h3>
                 <p className="text-sm text-[#32A4A6] font-semibold">Projects starting at ₹3,500</p>
               </div>
             </div>

             {/* Minor Plumbing Repairs */}
             <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0 w-72 sm:w-auto border-2 border-transparent hover:border-[#32A4A6]/30 transform hover:-translate-y-1">
               <div className="h-48 bg-gradient-to-br from-[#32A4A6]/10 to-[#32A4A6]/5 flex items-center justify-center">
                 <div className="text-center">
                   <div className="w-16 h-16 bg-[#32A4A6] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                     <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                     </svg>
                   </div>
                   <p className="text-sm text-[#32A4A6] font-medium">Minor Plumbing Repairs</p>
                 </div>
               </div>
               <div className="p-4">
                 <h3 className="font-bold text-gray-900 mb-2">Minor Plumbing Repairs</h3>
                 <p className="text-sm text-[#32A4A6] font-semibold">Projects starting at ₹5,200</p>
               </div>
             </div>

             {/* Electrical Help */}
             <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0 w-72 sm:w-auto border-2 border-transparent hover:border-[#32A4A6]/30 transform hover:-translate-y-1">
               <div className="h-48 bg-gradient-to-br from-[#32A4A6]/10 to-[#32A4A6]/5 flex items-center justify-center">
                 <div className="text-center">
                   <div className="w-16 h-16 bg-[#32A4A6] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                     <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                     </svg>
                   </div>
                   <p className="text-sm text-[#32A4A6] font-medium">Electrical Help</p>
                 </div>
               </div>
               <div className="p-4">
                 <h3 className="font-bold text-gray-900 mb-2">Electrical Help</h3>
                 <p className="text-sm text-[#32A4A6] font-semibold">Projects starting at ₹4,800</p>
               </div>
             </div>

             {/* Heavy Lifting */}
             <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0 w-72 sm:w-auto border-2 border-transparent hover:border-[#32A4A6]/30 transform hover:-translate-y-1">
               <div className="h-48 bg-gradient-to-br from-[#32A4A6]/10 to-[#32A4A6]/5 flex items-center justify-center">
                 <div className="text-center">
                   <div className="w-16 h-16 bg-[#32A4A6] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                     <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                     </svg>
                   </div>
                   <p className="text-sm text-[#32A4A6] font-medium">Heavy Lifting</p>
                 </div>
               </div>
               <div className="p-4">
                 <h3 className="font-bold text-gray-900 mb-2">Heavy Lifting</h3>
                 <p className="text-sm text-[#32A4A6] font-semibold">Projects starting at ₹4,300</p>
               </div>
             </div>
           </div>
         </div>
       </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              How it works
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-700 font-bold text-xl">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose</h3>
              <p className="text-gray-600">Select a student by skills and reviews</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-700 font-bold text-xl">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule</h3>
              <p className="text-gray-600">Book as early as today</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-700 font-bold text-xl">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete</h3>
              <p className="text-gray-600">Chat, pay, and review in one place</p>
            </div>
          </div>
        </div>
      </section>

      {/* Get help Today */}
      <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 opacity-30 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-100 opacity-40 rounded-full translate-y-20 -translate-x-20"></div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#32A4A6] mb-6">
              Get help Today
            </h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {/* Retail and Sales */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Sales Associate
            </button>

            {/* Brand Ambassador */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Brand Ambassador
            </button>

            {/* Cashier */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Cashier
            </button>

            {/* Teaching and Tutoring */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              School Tutor
            </button>

            {/* Language Teacher */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Language Teacher
            </button>

            {/* Freelance Tutor */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Freelance Tutor
            </button>

            {/* Delivery and Logistics */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Food Delivery
            </button>

            {/* Warehouse Helper */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Warehouse Helper
            </button>

            {/* Online Delivery */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Online Delivery
            </button>

            {/* Administrative Support */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Receptionist
            </button>

            {/* Data Entry */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Data Entry
            </button>

            {/* Admin Assistant */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Admin Assistant
            </button>

            {/* Library Assistant */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Library Assistant
            </button>

            {/* Customer Service */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Customer Service
            </button>

            {/* Child and Pet Care */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Babysitter
            </button>

            {/* Dog Walker */}
            <button className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Dog Walker
            </button>
          </div>

          <div className="text-left">
            <a href="/services" className="inline-flex items-center text-[#32A4A6] font-medium hover:text-green-800 transition-colors">
              See All Services
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Job Statistics Popup */}
      {showPopup && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
            {/* Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Popup Content */}
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                {selectedJob}
              </h3>
              
              <div className="space-y-4">
                {/* Daily Earning */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Daily Earning</p>
                      <p className="text-lg font-semibold text-green-700">{jobStats[selectedJob as keyof typeof jobStats]?.dailyEarning}</p>
                    </div>
                  </div>
                </div>

                {/* Monthly Earning */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Earning</p>
                      <p className="text-lg font-semibold text-blue-700">{jobStats[selectedJob as keyof typeof jobStats]?.monthlyEarning}</p>
                    </div>
                  </div>
                </div>

                {/* Workers Count */}
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Workers</p>
                      <p className="text-lg font-semibold text-purple-700">{jobStats[selectedJob as keyof typeof jobStats]?.workersCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Pending Modal */}
      {showKycPendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowKycPendingModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Modal Content */}
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">KYC Submitted Successfully! ✅</h3>
              <p className="text-gray-600 mb-6 text-lg">
                You have submitted your KYC. It's pending review. We will update you shortly.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-800">
                    <strong>Status:</strong> Pending Review - Our team is checking your data
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowKycPendingModal(false);
                    router.push('/');
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Go to Home
                </button>
                <button
                  onClick={() => {
                    setShowKycPendingModal(false);
                    router.push('/student/dashboard');
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
