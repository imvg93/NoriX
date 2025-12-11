"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  Bookmark, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Building, 
  TrendingUp,
  Bell,
  ArrowLeft,
  Home,
  Search,
  Star,
  MapPin,
  DollarSign,
  Filter,
  Eye,
  Plus,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Shield,
  AlertCircle
} from 'lucide-react';
import StatsCard from './StatsCard';
import TaskCard from './TaskCard';
import NotificationCard from './NotificationCard';
import { apiService, type JobsResponse, type ApplicationsResponse, type Job, type Application } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

interface AppliedJob {
  _id: string;
  job: Job;
  status: string;
  appliedDate: string;
  notes?: string;
}

interface SavedJob {
  _id: string;
  job: Job;
  savedDate: string;
}

interface Interview {
  _id: string;
  job: Job;
  date: string;
  time: string;
  type: string;
  location: string;
  status: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
}

interface StudentHomeProps {
  user: any;
}

const USD_TO_INR_RATE = 83;
const INDIAN_CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const convertNumberToINR = (value: number) => {
  if (!Number.isFinite(value)) return '';
  const converted = value * USD_TO_INR_RATE;
  if (converted >= 1000) {
    return INDIAN_CURRENCY_FORMATTER.format(Math.round(converted));
  }
  return Number(converted.toFixed(2)).toString();
};

const formatSalaryToINR = (salary?: Job['salary'] | string | null) => {
  if (salary === undefined || salary === null || (typeof salary === 'number' && Number.isNaN(salary))) {
    return 'Salary Not Available';
  }

  if (typeof salary === 'number') {
    const converted = convertNumberToINR(salary);
    return converted ? `₹${converted}` : 'Salary Not Available';
  }

  const normalized = salary.toString().trim();
  if (!normalized) return 'Salary Not Available';

  if (/₹|INR|Rs\.?/i.test(normalized)) {
    return normalized
      .replace(/Rs\.?/gi, '₹')
      .replace(/INR/gi, '₹')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^₹?/, '₹');
  }

  const containsUsdIndicator = /\$|USD/i.test(normalized);
  const numberPattern = /\d{1,3}(?:,\d{3})*(?:\.\d+)?/g;
  const matches = normalized.match(numberPattern);

  if (!matches) {
    return containsUsdIndicator
      ? normalized.replace(/\$|USD/gi, '₹').trim()
      : normalized;
  }

  const converted = normalized.replace(numberPattern, (match) => {
    const numeric = parseFloat(match.replace(/,/g, ''));
    if (Number.isNaN(numeric)) return match;
    const inrValue = convertNumberToINR(numeric);
    return inrValue ? `₹${inrValue}` : match;
  });

  const cleaned = converted
    .replace(/\$|USD/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'Salary Not Available';
};

interface RecentApplication {
  _id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salaryRange: string;
  status: string;
  approvedDate: string;
  appliedDate: string;
  jobId: string;
}

const StudentHome: React.FC<StudentHomeProps> = ({ user }) => {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentApprovedApplications, setRecentApprovedApplications] = useState<RecentApplication[]>([]);
  const [approvedApplicationsWithContact, setApprovedApplicationsWithContact] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [kycStatus, setKycStatus] = useState<{isCompleted: boolean, status: string}>({isCompleted: true, status: 'approved'});
  const [showKycPendingModal, setShowKycPendingModal] = useState(false);

  const handleKycClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (kycStatus.status === 'pending' || kycStatus.status === 'approved') {
      setShowKycPendingModal(true);
    } else {
      router.push('/kyc-profile');
    }
  };

  const getJobIdFromRef = (jobRef: any): string | null => {
    if (!jobRef) return null;
    if (typeof jobRef === 'string') return jobRef;
    if (typeof jobRef === 'object') {
      if (jobRef._id) {
        const val = jobRef._id;
        return typeof val === 'string' ? val : val?.toString?.() ?? null;
      }
      if (jobRef.jobId) {
        const val = jobRef.jobId;
        return typeof val === 'string' ? val : val?.toString?.() ?? null;
      }
      if (typeof jobRef.toString === 'function') {
        const str = jobRef.toString();
        if (str && str !== '[object Object]') {
          return str;
        }
      }
    }
    return null;
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        
        let jobsData: JobsResponse;
        
        // Try enhanced jobs endpoint first (for authenticated students)
        try {
          jobsData = await apiService.getStudentDashboardJobs(true);
          console.log('✅ Fetched jobs from enhanced endpoint:', jobsData.jobs?.length || 0);
        } catch (error: any) {
          console.log('⚠️ Enhanced jobs endpoint failed:', error);
          
          // Check if it's a KYC-related error
          if (error?.status === 403 && error?.data?.kycRequired) {
            const kycStatus = error.data.kycStatus || 'not_submitted';
            setKycStatus({
              isCompleted: false,
              status: kycStatus
            });
            setJobs([]);
            setErrorMessage(error.message || 'Please complete your KYC verification to browse and apply for jobs.');
            console.log(`⚠️ KYC required - status: ${kycStatus}`);
            return; // Don't fallback to regular endpoint if KYC is required
          }
          
          // Fallback to regular jobs endpoint if not KYC-related
          console.log('⚠️ Falling back to regular jobs endpoint');
          jobsData = await apiService.getJobs();
          console.log('✅ Fetched jobs from regular endpoint:', jobsData.jobs?.length || 0);
        }
        
        // KYC check already handled in error handling above
        // Show jobs if we got here successfully
        setJobs(Array.isArray(jobsData.jobs) ? jobsData.jobs : []);
        setKycStatus({
          isCompleted: true,
          status: 'approved'
        });
        setErrorMessage('');
        console.log(`✅ Showing ${jobsData.jobs?.length || 0} jobs - KYC approved`);
        
        // Fetch user applications
        try {
          const applicationsData: ApplicationsResponse = await apiService.getUserApplications();
        console.log('📊 Applications data:', applicationsData); // Debug log
        const applications = applicationsData.applications || [];
        console.log('📊 Processed applications:', applications); // Debug log
        setAppliedJobs(Array.isArray(applications) ? applications : []);
        } catch (appsErr: any) {
          console.error('Error fetching applications:', appsErr);
          setAppliedJobs([]);
          setErrorMessage(prev => prev || 'Unable to fetch your applications right now.');
        }
        
        // Fetch recent approved applications
        try {
          const recentApprovedData = await apiService.getRecentApprovedApplications(5);
          console.log('📊 Recent approved applications:', recentApprovedData);
          setRecentApprovedApplications(Array.isArray(recentApprovedData.applications) ? recentApprovedData.applications : []);
        } catch (error) {
          console.error('Error fetching recent approved applications:', error);
          setRecentApprovedApplications([]);
        }
        
        // Also fetch approved applications with contact details for the new section
        try {
          const approvedWithContactData = await apiService.getApprovedApplicationsWithContact(3);
          console.log('📊 Approved applications with contact:', approvedWithContactData);
          setApprovedApplicationsWithContact(Array.isArray(approvedWithContactData.applications) ? approvedWithContactData.applications : []);
        } catch (error) {
          console.error('Error fetching approved applications with contact:', error);
          setApprovedApplicationsWithContact([]);
        }
        
        // Fetch saved jobs from database
        try {
          const savedJobsData = await apiService.getSavedJobs();
          console.log('📊 Saved jobs data:', savedJobsData);
          setSavedJobs(Array.isArray(savedJobsData.savedJobs) ? savedJobsData.savedJobs : []);
        } catch (error) {
          console.error('Error fetching saved jobs:', error);
          setSavedJobs([]);
        }
        
        // Initialize empty arrays for interviews and notifications
        setInterviews([]);
        setNotifications([]);
        
        // KYC status check removed - always bypassed
        
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setErrorMessage(error?.message || 'Failed to load jobs, please try again.');
        // Initialize with empty data instead of fallback mock data
        setJobs([]);
        setAppliedJobs([]);
        setSavedJobs([]);
        setInterviews([]);
        setNotifications([]);
        setRecentApprovedApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Set up real-time updates for job approvals, application status updates, and KYC approvals
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Import socket service dynamically
    import('../services/socketService').then((module) => {
      const socketService = module.default;
      socketService.ensureConnected(token);

      const handleJobApproved = (event: Event) => {
        const customEvent = event as CustomEvent<{ jobId?: string }>;
        console.log('🎉 New job approved:', customEvent.detail);
        apiService.getStudentDashboardJobs().then((jobsData: JobsResponse) => {
          const responseData = jobsData as any;
          if (!responseData.kycRequired) {
            setJobs(jobsData.jobs || []);
          }
        }).catch(console.error);
      };

      const handleApplicationStatusUpdate = (event: Event) => {
        const customEvent = event as CustomEvent<{ application?: any }>;
        const application = customEvent.detail?.application;
        
        if (application && application.status === 'accepted') {
          console.log('🎉 Application approved:', application);
          
          // Add notification
          addNotification({
            type: 'application_status_update',
            title: 'Application Approved! 🎉',
            message: application.message || `Your application for ${application.jobTitle} at ${application.companyName} has been approved!`,
            timestamp: new Date().toISOString(),
            data: application
          });
          
          // Refresh recent approved applications
          apiService.getRecentApprovedApplications(5).then((data) => {
            setRecentApprovedApplications(Array.isArray(data.applications) ? data.applications : []);
          }).catch(console.error);
        }
      };

      const handleKYCStatusUpdate = (event: Event) => {
        const customEvent = event as CustomEvent<{ status?: any; verificationStatus?: string }>;
        const statusData = customEvent.detail;
        
        console.log('🎉 KYC status updated:', statusData);
        
        // Update KYC status
        if (statusData?.verificationStatus === 'approved') {
          setKycStatus({
            isCompleted: true,
            status: 'approved'
          });
          
          // Show notification
          addNotification({
            type: 'kyc_approved',
            title: 'KYC Approved! 🎉',
            message: 'Your KYC has been approved! You can now view and apply for jobs.',
            timestamp: new Date().toISOString(),
            data: statusData
          });
          
          // Refresh jobs immediately
          apiService.getStudentDashboardJobs().then((jobsData: JobsResponse) => {
            setJobs(Array.isArray(jobsData.jobs) ? jobsData.jobs : []);
          }).catch(console.error);
        }
      };

      const jobListener: EventListener = handleJobApproved;
      const appListener: EventListener = handleApplicationStatusUpdate;
      const kycListener: EventListener = handleKYCStatusUpdate;
      
      window.addEventListener('jobApproved', jobListener);
      window.addEventListener('application_status_update', appListener);
      window.addEventListener('kyc:status:update', kycListener);

      return () => {
        window.removeEventListener('jobApproved', jobListener);
        window.removeEventListener('application_status_update', appListener);
        window.removeEventListener('kyc:status:update', kycListener);
        socketService.disconnect();
      };
    });
  }, [addNotification]);

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = jobs;
    
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedLocation) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }
    
    if (selectedType) {
      filtered = filtered.filter(job => job.type === selectedType);
    }
    
    setFilteredJobs(filtered);
  }, [jobs, searchTerm, selectedLocation, selectedType]);

  const handleApplyJob = async (jobId: string) => {
    try {
      // Validate jobId
      if (!jobId || typeof jobId !== 'string') {
        alert('Invalid job ID. Please try again.');
        return;
      }

      // Prevent duplicate applications locally
      const alreadyApplied = Array.isArray(appliedJobs) && appliedJobs.some(aj => {
        const refId = getJobIdFromRef(aj?.job);
        return refId === jobId;
      });
      if (alreadyApplied) {
        alert('You have already applied for this job.');
        return;
      }

      const allowedAvailability = ['weekdays', 'weekends', 'both', 'flexible'];
      let availabilityPreference = typeof user?.availability === 'string' ? user.availability.toLowerCase() : undefined;
      if (!availabilityPreference || !allowedAvailability.includes(availabilityPreference)) {
        availabilityPreference = 'flexible';
      }

      console.log('📝 Applying to job:', jobId, 'with availability:', availabilityPreference);
      
      const response = await apiService.applyToJob(jobId, {
        availability: availabilityPreference
      });
      
      console.log('✅ Application response:', response);
      
      // Refresh applications from the server to get the latest data
      try {
        const applicationsData: ApplicationsResponse = await apiService.getUserApplications();
        console.log('📊 Refreshed applications data:', applicationsData);
        const applications = applicationsData.applications || [];
        console.log('📊 Processed applications:', applications);
        setAppliedJobs(Array.isArray(applications) ? applications : []);
        console.log('✅ Successfully updated applied jobs state');
      } catch (appsErr: any) {
        console.error('Error refreshing applications:', appsErr);
        // Fallback to local update if refresh fails
        const job = jobs.find(j => j._id === jobId);
        if (job) {
          const newApplication = {
            _id: Date.now().toString(),
            job,
            status: 'pending',
            appliedDate: new Date().toISOString().split('T')[0]
          };
          
          setAppliedJobs(prev => [...prev, newApplication]);
          console.log('✅ Added application to local state (fallback):', newApplication);
        }
      }
      
      // Success notification
      alert('Application submitted successfully! 🎉');
      
    } catch (error: any) {
      console.error('❌ Error applying to job:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        details: error.details
      });
      
      let friendlyMessage = 'Failed to submit application. Please try again.';
      
      if (error.message) {
        friendlyMessage = error.message;
      } else if (error.status === 401) {
        friendlyMessage = 'Please log in again to apply for jobs.';
      } else if (error.status === 403) {
        friendlyMessage = 'You do not have permission to apply for this job.';
      } else if (error.status === 404) {
        friendlyMessage = 'Job not found. It may have been removed.';
      }
      
      alert(friendlyMessage);
    }
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      const job = jobs.find(j => j._id === jobId);
      if (!job) {
        console.error('Job not found:', jobId);
        return;
      }

      // Check if job is already saved
      const isSaved = Array.isArray(savedJobs) && savedJobs.some(sj => {
        const savedJobId = typeof sj.job === 'object' && sj.job !== null ? sj.job._id : sj.job;
        return savedJobId === jobId;
      });

      if (isSaved) {
        // Unsave the job
        try {
          await apiService.unsaveJob(jobId);
          
          // Remove from local state
          setSavedJobs(prev => Array.isArray(prev) 
            ? prev.filter(sj => {
                const savedJobId = typeof sj.job === 'object' && sj.job !== null ? sj.job._id : sj.job;
                return savedJobId !== jobId;
              })
            : []);
          
          // Show notification
          addNotification({
            type: 'application_status_update',
            title: 'Job Unsaved',
            message: `You unsaved ${job.title || 'this job'}`,
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          console.error('Error unsaving job:', error);
          alert(error?.message || 'Failed to unsave job. Please try again.');
        }
      } else {
        // Save the job
        try {
          const response = await apiService.saveJob(jobId);
          const savedJob = response.savedJob;
          
          // Add to local state
          if (savedJob) {
            setSavedJobs(prev => Array.isArray(prev) ? [...prev, savedJob] : [savedJob]);
          } else {
            // Fallback: create saved job object
            setSavedJobs(prev => Array.isArray(prev) ? [...prev, {
              _id: Date.now().toString(),
              job,
              savedDate: new Date().toISOString().split('T')[0]
            }] : [{
              _id: Date.now().toString(),
              job,
              savedDate: new Date().toISOString().split('T')[0]
            }]);
          }
          
          // Show notification
          addNotification({
            type: 'application_status_update',
            title: 'Job Saved',
            message: `You saved ${job.title || 'this job'}`,
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          console.error('Error saving job:', error);
          alert(error?.message || 'Failed to save job. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Error in handleSaveJob:', error);
      alert(error?.message || 'An error occurred. Please try again.');
    }
  };

  const quickActions = [
    { name: 'Get Verified', icon: Shield, href: '/verification', color: 'indigo' },
    { name: 'Search Jobs', icon: Search, href: '/jobs', color: 'blue' },
    { name: 'My Applications', icon: FileText, href: '/applications', color: 'green' },
    { name: 'Approved Applications', icon: CheckCircle, href: '/student/approved-applications', color: 'green' },
    { name: 'Saved Jobs', icon: Bookmark, href: '/saved-jobs', color: 'purple' },
    { name: 'Profile', icon: User, href: '/profile', color: 'orange' }
  ];

  const jobTypes = ['All', 'Full-time', 'Part-time', 'Daily Labor', 'Contract', 'Temporary'];
  const locations = ['All', 'Hyderabad', 'Remote', 'Bangalore', 'Mumbai', 'Delhi'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 space-y-4 sm:space-y-6">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4" />
            <span className="text-sm sm:text-base">{errorMessage || 'Failed to load jobs, please try again.'}</span>
          </div>
        </div>
      )}
      {/* Profile Header Section - Enhanced with Animations */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-5 sm:p-7 shadow-xl border border-blue-100/50"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-20 -right-20 w-64 h-64 bg-blue-300 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-300 rounded-full blur-3xl"
          />
          {/* Decorative Circles */}
          <div className="absolute top-10 right-20 w-32 h-32 border-2 border-blue-200/30 rounded-full"></div>
          <div className="absolute bottom-10 left-20 w-24 h-24 border-2 border-purple-200/30 rounded-full"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 sm:gap-5 flex-1">
              {/* Profile Picture with Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/60 shadow-lg"
                >
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user?.name || 'User'} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600" />
                  )}
                </motion.div>
                {/* Animated Status Indicator */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-green-400 rounded-full border-2 border-white shadow-lg"
                >
                  <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                </motion.div>
              </motion.div>
              
              {/* User Info with Animation */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1 min-w-0"
              >
                <h1 className="text-xl sm:text-3xl font-bold truncate mb-1 text-gray-800">
                  Hi {user?.name || 'Student'}! 👋
                </h1>
                <p className="text-gray-600 text-sm sm:text-base truncate flex items-center gap-2">
                  <span>{user?.email || 'Ready to find your next opportunity?'}</span>
                </p>
              </motion.div>
            </div>
            
            {/* Action Buttons with Hover Effects */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 ml-4"
            >
              <NotificationDropdown />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white/80 hover:bg-white backdrop-blur-sm rounded-xl transition-all text-sm font-medium shadow-md text-gray-700 border border-gray-200/50"
                title="Back to Home"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white/80 hover:bg-white backdrop-blur-sm rounded-xl transition-all text-sm font-medium shadow-md text-gray-700 border border-gray-200/50"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </motion.button>
            </motion.div>
          </div>
          
          {/* Stats Cards - Enhanced Design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6"
          >
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-medium">Jobs Applied</p>
                  <p className="text-2xl font-bold text-gray-900">{Array.isArray(appliedJobs) ? appliedJobs.length : 0}</p>
                </div>
              </div>
              <p className="text-xs text-green-600 font-semibold">
                +{Array.isArray(appliedJobs) ? appliedJobs.filter(job => new Date(job.appliedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length : 0} this week
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-purple-100 rounded-lg">
                  <Bookmark className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-medium">Saved Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{Array.isArray(savedJobs) ? savedJobs.length : 0}</p>
                </div>
              </div>
              <p className="text-xs text-green-600 font-semibold">
                +{Array.isArray(savedJobs) ? savedJobs.filter(job => new Date(job.savedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length : 0} this week
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-orange-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-medium">Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">{interviews.filter(i => i.status === 'scheduled').length}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 font-semibold">
                {interviews.length > 0 && interviews[0]?.date ? `Next: ${interviews[0].date}` : 'No upcoming'}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-medium">Available</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                </div>
              </div>
              <p className="text-xs text-green-600 font-semibold">
                {filteredJobs.length} match criteria
              </p>
            </motion.div>
          </motion.div>
          
          {/* Mobile KYC Button */}
          {!kycStatus.isCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 pt-4 border-t border-gray-200/50"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleKycClick}
                className="flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors text-sm font-semibold shadow-lg text-white"
              >
                <Shield className="w-4 h-4" />
                <span>Complete KYC</span>
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Navigation Header - Mobile Optimized */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4">
        {/* Mobile Header */}
        <div className="flex flex-col space-y-3 sm:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Student Dashboard</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {!kycStatus.isCompleted && (
              <button
                onClick={handleKycClick}
                className="flex items-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium animate-pulse"
              >
                <Shield className="w-4 h-4" />
                Complete KYC
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Approved Applications with Contact Details - First Section */}
      {Array.isArray(approvedApplicationsWithContact) && approvedApplicationsWithContact.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-green-300 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500 rounded-full">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  🎉 Approved Applications with Contact Details
                  <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                    CONTACT AVAILABLE
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">Congratulations! You can now contact these employers directly</p>
              </div>
            </div>
            <Link 
              href="/student/approved-applications"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {approvedApplicationsWithContact.slice(0, 3).map((application) => (
              <motion.div
                key={application._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-green-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              >
                {/* Approved Badge */}
                <div className="absolute top-0 right-0 bg-green-500 text-white px-2 py-1 text-xs font-bold rounded-bl-lg">
                  ✅ APPROVED
                </div>
                
                <div className="flex items-start justify-between mb-3 pt-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base truncate">{application.jobTitle}</h3>
                    <p className="text-green-600 font-semibold text-xs sm:text-sm truncate">{application.companyName}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{application.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span className="truncate font-semibold text-green-600">{formatSalaryToINR(application.salaryRange)}</span>
                  </div>
                </div>
                
                {/* Employer Contact Preview */}
                <div className="bg-green-50 rounded-lg p-2 mb-3">
                  <div className="text-xs text-green-700 font-medium mb-1">Contact Person:</div>
                  <div className="text-xs text-gray-700 truncate">{application.employerContact?.name || 'Not provided'}</div>
                  {application.employerContact?.phone && application.employerContact.phone !== 'Not provided' && (
                    <div className="text-xs text-green-600 truncate">📞 {application.employerContact.phone}</div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link 
                    href="/student/approved-applications"
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-bold shadow-md text-center"
                  >
                    📞 View Contact Details
                  </Link>
                  <Link 
                    href={`/jobs/${application.jobId}`}
                    className="px-3 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-xs text-center font-medium"
                  >
                    View Job
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Job Search Section - Simple Design - Second Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Find Your Perfect Job</h2>
        </div>
        
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs, companies, keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                {jobTypes.map(type => (
                  <option key={type} value={type === 'All' ? '' : type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                {locations.map(location => (
                  <option key={location} value={location === 'All' ? '' : location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Job Listings Section - Redesigned */}
      <div className="mt-6 space-y-4 sm:space-y-6">
        {!kycStatus.isCompleted ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600" />
              </div>
              {kycStatus.status === 'not_submitted' && (
                <>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Complete KYC to get your first job</h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-6 max-w-md mx-auto">
                    Please complete your KYC verification to browse and apply for jobs.
                  </p>
                  <button
                    onClick={handleKycClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm sm:text-base"
                  >
                    <Shield className="w-5 h-5" />
                    Complete KYC Now
                  </button>
                </>
              )}
              {kycStatus.status === 'pending' && (
                <>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Your KYC is Pending Approval</h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-6 max-w-md mx-auto">
                    Your KYC is pending approval. Please wait for admin verification.
                  </p>
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <div className="flex items-center gap-2 justify-center text-blue-700">
                      <Clock className="w-5 h-5" />
                      <span className="text-sm font-medium">Your KYC is under review. Jobs will appear once approved.</span>
                    </div>
                  </div>
                </>
              )}
              {kycStatus.status === 'rejected' && (
                <>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Your KYC was Rejected</h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-6 max-w-md mx-auto">
                    Your KYC was rejected. Please submit your KYC again with correct details.
                  </p>
                  <Link 
                    href="/kyc-profile"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm sm:text-base"
                  >
                    <Shield className="w-5 h-5" />
                    Submit KYC Again
                  </Link>
                </>
              )}
              {kycStatus.status === 'suspended' && (
                <>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Your KYC is Suspended</h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-6 max-w-md mx-auto">
                    Your KYC has been suspended. Contact admin for support.
                  </p>
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                    <div className="flex items-center gap-2 justify-center text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Contact admin to resolve this issue.</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 text-sm">Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job, index) => {
                const isApplied = Array.isArray(appliedJobs)
                  ? appliedJobs.some(aj => getJobIdFromRef(aj?.job) === job._id)
                  : false;

                const isSaved = Array.isArray(savedJobs)
                  ? savedJobs.some(sj => getJobIdFromRef(sj?.job) === job._id)
                  : false;
                
                const isHighlighted = job.highlighted === true;
                
                return (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
                      isHighlighted ? 'border-yellow-400' : 'border-gray-200'
                    }`}
                  >
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{job.title}</h3>
                            {isHighlighted && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-blue-600 truncate">{job.company}</p>
                        </div>
                        <button
                          onClick={() => handleSaveJob(job._id)}
                          className={`p-1.5 rounded transition-colors ${
                            isSaved 
                              ? 'text-purple-600' 
                              : 'text-gray-400 hover:text-purple-600'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      
                      {/* Info Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <DollarSign className="w-3 h-3" />
                          <span className="font-medium text-green-600">{formatSalaryToINR(job.salary)}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          {job.type}
                        </span>
                      </div>
                      
                      {/* Description */}
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                      
                      {/* Requirements */}
                      {job.requirements && job.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {job.requirements.slice(0, 2).map((req, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {req}
                            </span>
                          ))}
                          {job.requirements.length > 2 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              +{job.requirements.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                        {isApplied ? (
                          <div className="flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            <span>Applied</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApplyJob(job._id)}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
                          >
                            Apply Now
                          </button>
                        )}
                        
                        <Link 
                          href={`/jobs/${job._id}`}
                          className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-xs text-center"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
      </div>

      {/* Saved Jobs and All Available Jobs - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Saved Jobs Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-purple-600" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Saved Jobs</h2>
            </div>
            {Array.isArray(savedJobs) && savedJobs.length > 0 && (
              <Link 
                href="/saved-jobs"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View All
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {Array.isArray(savedJobs) && savedJobs.length > 0 ? savedJobs.slice(0, 4).map((savedJob) => (
              <div key={savedJob._id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{savedJob.job?.title || 'Job Title Not Available'}</h3>
                    <p className="text-xs text-gray-600 truncate mt-1">{savedJob.job?.company || 'Company Not Available'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">{savedJob.job?.location || 'Location Not Available'}</span>
                      {savedJob.job?.salary && (
                        <span className="text-xs font-medium text-green-600">{formatSalaryToINR(savedJob.job.salary)}</span>
                      )}
                    </div>
                  </div>
                  <Link 
                    href={`/jobs/${savedJob.job?._id || savedJob.job}`}
                    className="text-purple-600 hover:text-purple-700 flex-shrink-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Bookmark className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No saved jobs yet</p>
                <p className="text-xs mt-1">Save interesting positions for later!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* All Available Jobs Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">All Available Jobs</h2>
            </div>
            {filteredJobs.filter(job => job.highlighted !== true).length > 0 && (
              <Link 
                href="/jobs"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {filteredJobs.filter(job => job.highlighted !== true).length > 0 ? filteredJobs
              .filter(job => job.highlighted !== true)
              .slice(0, 4)
              .map((job) => {
                const isApplied = Array.isArray(appliedJobs) ? appliedJobs.some(aj => getJobIdFromRef(aj?.job) === job._id) : false;
                const isSaved = Array.isArray(savedJobs) ? savedJobs.some(sj => getJobIdFromRef(sj?.job) === job._id) : false;
                
                return (
                  <div key={job._id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 text-sm truncate">{job.title}</h3>
                          {isApplied && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">Applied</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 truncate mb-2">{job.company}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500">{job.location}</span>
                          {job.salary && (
                            <span className="text-xs font-medium text-green-600">{formatSalaryToINR(job.salary)}</span>
                          )}
                          <span className="text-xs text-gray-500">{job.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleSaveJob(job._id)}
                          className={`p-1 rounded transition-colors ${
                            isSaved 
                              ? 'text-purple-600' 
                              : 'text-gray-400 hover:text-purple-600'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                        <Link 
                          href={`/jobs/${job._id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No jobs available</p>
                  <p className="text-xs mt-1">Check back later for new opportunities!</p>
                </div>
              )}
          </div>
        </motion.div>
      </div>

      {/* Upcoming Interviews - Mobile Optimized */}
      {interviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Upcoming Interviews</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {interviews.map((interview) => (
              <div key={interview._id} className="p-3 sm:p-4 bg-orange-50 rounded-lg sm:rounded-xl border border-orange-200">
                <div className="flex items-center gap-3 mb-3">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{interview.job.company}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{interview.job.title}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-600">{interview.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-600">{interview.time}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                    {interview.type} Interview
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Notifications - Mobile Optimized */}
      {notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Notifications</h2>
          </div>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                title={notification.title}
                message={notification.message}
                type={notification.type}
                timestamp={notification.timestamp}
                isRead={notification.isRead}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
      >
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200 group"
            >
              <div className={`p-2 sm:p-3 bg-${action.color}-100 rounded-full group-hover:bg-${action.color}-200 transition-colors`}>
                <action.icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${action.color}-600`} />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-blue-700 text-center">
                {action.name}
              </span>
            </a>
          ))}
        </div>
      </motion.div>

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
              {kycStatus.status === 'approved' ? (
                <>
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Verified Successfully and Approved ✅</h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    Congratulations! Your KYC verification has been approved. You can now access all job opportunities.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 justify-center">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-green-800">
                        <strong>Status:</strong> Approved - Your verification is complete
                      </p>
                    </div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3 justify-center">
                      <svg className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-indigo-900 mb-1">
                          Complete Video KYC Verification
                        </p>
                        <p className="text-sm text-indigo-700">
                          Get verified by Video KYC to unlock more opportunities and priority access to premium job listings.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => {
                        setShowKycPendingModal(false);
                        router.push('/verification');
                      }}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Get Verified by Video KYC
                    </button>
                    <button
                      onClick={() => {
                        setShowKycPendingModal(false);
                        router.push('/kyc-profile');
                      }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      View KYC Status
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
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHome;
