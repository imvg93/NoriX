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
  LogOut,
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
  const { logout } = useAuth();
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
    if (kycStatus.status === 'pending') {
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
        
        // Initialize empty arrays for saved jobs, interviews, and notifications
        // TODO: Implement real API calls for these features
        setSavedJobs([]);
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
      
      // Update applied jobs list
      const job = jobs.find(j => j._id === jobId);
      if (job) {
        const newApplication = {
          _id: Date.now().toString(),
          job,
          status: 'applied',
          appliedDate: new Date().toISOString().split('T')[0]
        };
        
        setAppliedJobs(prev => [...prev, newApplication]);
        console.log('✅ Added application to local state:', newApplication);
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

  const handleSaveJob = (jobId: string) => {
    const job = jobs.find(j => j._id === jobId);
    if (job && Array.isArray(savedJobs) && !savedJobs.find(sj => sj.job._id === jobId)) {
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
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const quickActions = [
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
      {/* Navigation Header - Mobile Optimized */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4">
        {/* Mobile Header */}
        <div className="flex flex-col space-y-3 sm:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Student Dashboard</h2>
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xs:inline">Logout</span>
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link 
              href="/home" 
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            {!kycStatus.isCompleted && (
              <button
                onClick={handleKycClick}
                className="flex items-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium animate-pulse"
              >
                <Shield className="w-4 h-4" />
                Complete KYC
              </button>
            )}
            <button 
              onClick={() => window.history.back()} 
              className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Welcome Banner - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-white/20 rounded-full">
            <Briefcase className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold truncate">Hi {user?.name || 'Student'}!</h1>
            <p className="text-blue-100 text-sm sm:text-base">Ready to find your next opportunity? Here's your job search overview</p>
          </div>
        </div>
      </motion.div>

      {/* KYC Status Banner Removed - No longer needed */}

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Jobs Applied"
          value={Array.isArray(appliedJobs) ? appliedJobs.length : 0}
          icon={FileText}
          color="blue"
          change={`+${Array.isArray(appliedJobs) ? appliedJobs.filter(job => new Date(job.appliedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length : 0} this week`}
          changeType="positive"
        />
        <StatsCard
          title="Saved Jobs"
          value={Array.isArray(savedJobs) ? savedJobs.length : 0}
          icon={Bookmark}
          color="purple"
          change={`+${Array.isArray(savedJobs) ? savedJobs.filter(job => new Date(job.savedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length : 0} this week`}
          changeType="positive"
        />
        <StatsCard
          title="Upcoming Interviews"
          value={interviews.filter(i => i.status === 'scheduled').length}
          icon={Calendar}
          color="orange"
          change={interviews.length > 0 && interviews[0]?.date ? `Next: ${interviews[0].date}` : 'No upcoming'}
          changeType="neutral"
        />
        <StatsCard
          title="Available Jobs"
          value={jobs.length}
          icon={TrendingUp}
          color="green"
          change={`${jobs.filter(job => job.highlighted === true).length} featured • ${filteredJobs.length} match criteria`}
          changeType="positive"
        />
      </div>

      {/* Highlighted Jobs Section - Mobile Optimized */}
      {jobs.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-yellow-300 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-yellow-500 rounded-full">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                ⭐ Featured & Highlighted Jobs
                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-semibold">
                  HOT
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">Premium opportunities with highlighted visibility</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredJobs
              .filter(job => job.highlighted === true)
              .slice(0, 6)
              .map((job) => {
              const isApplied = Array.isArray(appliedJobs) ? appliedJobs.some(aj => aj.job._id === job._id) : false;
              const isSaved = Array.isArray(savedJobs) ? savedJobs.some(sj => sj.job._id === job._id) : false;
              
              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-yellow-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                >
                  {/* Highlighted Badge */}
                  <div className="absolute top-0 right-0 bg-yellow-500 text-white px-2 py-1 text-xs font-bold rounded-bl-lg">
                    ⭐ FEATURED
                  </div>
                  
                  <div className="flex items-start justify-between mb-3 pt-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base truncate">{job.title}</h3>
                      <p className="text-yellow-600 font-semibold text-xs sm:text-sm truncate">{job.company}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleSaveJob(job._id)}
                        className={`p-1 rounded-full transition-colors ${
                          isSaved 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-purple-100 hover:text-purple-600'
                        }`}
                      >
                        <Bookmark className={`w-3 h-3 sm:w-4 sm:h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span className="truncate font-semibold text-green-600">{formatSalaryToINR(job.salary)}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-xs sm:text-sm mb-3 line-clamp-2">{job.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {job.requirements?.slice(0, 2).map((req, index) => (
                      <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs truncate font-medium">
                        {req}
                      </span>
                    ))}
                    {job.requirements && job.requirements.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        +{job.requirements.length - 2} more
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    {isApplied ? (
                      <div className="flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        <span>Applied</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApplyJob(job._id)}
                        className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-xs font-bold shadow-md"
                      >
                        ⚡ Apply Now
                      </button>
                    )}
                    <Link 
                      href={`/jobs/${job._id}`}
                      className="px-3 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors text-xs text-center font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </motion.div>
              );
            })}
        </div>
        
          {filteredJobs.filter(job => job.highlighted === true).length === 0 && (
            <div className="text-center py-6 sm:py-8">
              <Star className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No highlighted jobs available</h3>
              <p className="text-gray-600 text-sm sm:text-base">Check back later for featured opportunities!</p>
            </div>
          )}
        </motion.div>
      ) : null}

      {/* Regular Jobs Section - Mobile Optimized */}
      {filteredJobs.filter(job => job.highlighted !== true).length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-600 rounded-full">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">All Available Jobs</h2>
              <p className="text-xs sm:text-sm text-gray-600">Browse through all job opportunities</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredJobs
              .filter(job => job.highlighted !== true)
              .slice(0, 6)
              .map((job) => {
              const isApplied = Array.isArray(appliedJobs) ? appliedJobs.some(aj => aj.job._id === job._id) : false;
              const isSaved = Array.isArray(savedJobs) ? savedJobs.some(sj => sj.job._id === job._id) : false;
              
              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base truncate">{job.title}</h3>
                      <p className="text-blue-600 font-medium text-xs sm:text-sm truncate">{job.company}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleSaveJob(job._id)}
                        className={`p-1 rounded-full transition-colors ${
                          isSaved 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-purple-100 hover:text-purple-600'
                        }`}
                      >
                        <Bookmark className={`w-3 h-3 sm:w-4 sm:h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span className="truncate">{formatSalaryToINR(job.salary)}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-xs sm:text-sm mb-3 line-clamp-2">{job.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {job.requirements?.slice(0, 2).map((req, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs truncate">
                        {req}
                      </span>
                    ))}
                    {job.requirements && job.requirements.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        +{job.requirements.length - 2} more
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    {isApplied ? (
                      <div className="flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs">
                        <CheckCircle className="w-3 h-3" />
                        <span>Applied</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApplyJob(job._id)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                      >
                        Apply Now
                      </button>
                    )}
                    <Link 
                      href={`/jobs/${job._id}`}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs text-center"
                    >
                      Details
                    </Link>
                  </div>
                </motion.div>
              );
            })}
        </div>
        
          {filteredJobs.filter(job => job.highlighted !== true).length > 6 && (
            <div className="text-center mt-4">
              <Link 
                href="/jobs"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                View All Jobs
              </Link>
            </div>
          )}
        </motion.div>
      ) : null}

      {/* Job Search Section - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Find Your Perfect Job</h2>
        </div>
        
        {/* Search Bar - Mobile Optimized */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search jobs, companies, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
          >
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Filters - Mobile Optimized */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Job Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {jobTypes.map(type => (
                  <option key={type} value={type === 'All' ? '' : type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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

        {/* Job Listings - Mobile Optimized */}
        <div className="space-y-3 sm:space-y-4">

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

            <div className="text-center py-6 sm:py-8">
              <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 text-sm sm:text-base">Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            filteredJobs.map((job) => {
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
                  className={`border rounded-lg sm:rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow relative ${
                    isHighlighted 
                      ? 'border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg' 
                      : 'border-gray-200'
                  }`}
                >
                  {/* Highlighted Badge */}
                  {isHighlighted && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                      ⭐ FEATURED
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-lg sm:text-xl font-semibold mb-1 truncate ${
                            isHighlighted ? 'text-gray-900' : 'text-gray-900'
                          }`}>
                            {job.title}
                            {isHighlighted && <span className="ml-2 text-yellow-600">🔥</span>}
                          </h3>
                          <p className={`text-base sm:text-lg font-medium truncate ${
                            isHighlighted ? 'text-yellow-600' : 'text-blue-600'
                          }`}>
                            {job.company}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <button
                            onClick={() => handleSaveJob(job._id)}
                            className={`p-2 rounded-full transition-colors ${
                              isSaved 
                                ? 'bg-purple-100 text-purple-600' 
                                : 'bg-gray-100 text-gray-400 hover:bg-purple-100 hover:text-purple-600'
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${isSaved ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className={`truncate ${isHighlighted ? 'font-semibold text-green-600' : ''}`}>
                            {formatSalaryToINR(job.salary)}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs w-fit ${
                          isHighlighted 
                            ? 'bg-yellow-100 text-yellow-800 font-semibold' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {job.type}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-4 line-clamp-2 text-sm sm:text-base">{job.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.requirements?.slice(0, 3).map((req, index) => (
                          <span key={index} className={`px-3 py-1 rounded-full text-xs sm:text-sm truncate ${
                            isHighlighted 
                              ? 'bg-yellow-100 text-yellow-800 font-medium' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {req}
                          </span>
                        ))}
                        {job.requirements && job.requirements.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm">
                            +{job.requirements.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="text-xs sm:text-sm text-gray-500">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                        {isHighlighted && <span className="ml-2 text-yellow-600 font-semibold">• Featured Job</span>}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        {isApplied ? (
                          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Applied</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApplyJob(job._id)}
                            className={`flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm sm:text-base ${
                              isHighlighted 
                                ? 'bg-yellow-500 hover:bg-yellow-600 shadow-md' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                            {isHighlighted ? '⚡ Apply Now' : 'Apply Now'}
                          </button>
                        )}
                        
                        <Link 
                          href={`/jobs/${job._id}`}
                          className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm sm:text-base ${
                            isHighlighted 
                              ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Approved Applications - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Approved Applications</h2>
            </div>
            {Array.isArray(recentApprovedApplications) && recentApprovedApplications.length > 0 && (
              <Link 
                href="/student/approved-applications"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                View All
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {Array.isArray(recentApprovedApplications) && recentApprovedApplications.length > 0 ? recentApprovedApplications.slice(0, 3).map((application) => (
              <div key={application._id} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{application.jobTitle}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{application.companyName} • {application.location}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        ✓ Approved
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(application.approvedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push(`/jobs/${application.jobId}`)}
                    className="text-green-600 hover:text-green-700 flex-shrink-0"
                  >
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-4 text-gray-500 text-sm sm:text-base">
                No approved applications yet. Keep applying!
              </div>
            )}
          </div>
        </motion.div>

        {/* Saved Jobs - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Saved Jobs</h2>
          </div>
          <div className="space-y-3">
            {Array.isArray(savedJobs) ? savedJobs.slice(0, 3).map((savedJob) => (
              <div key={savedJob._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{savedJob.job?.title || 'Job Title Not Available'}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{savedJob.job?.company || 'Company Not Available'}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-2">
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full w-fit">
                        {formatSalaryToINR(savedJob.job?.salary)}
                      </span>
                      <span className="text-xs text-gray-500 truncate">{savedJob.job?.location || 'Location Not Available'}</span>
                    </div>
                  </div>
                  <button className="text-purple-600 hover:text-purple-700 flex-shrink-0">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  </button>
                </div>
              </div>
            )) : null}
            {Array.isArray(savedJobs) && savedJobs.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm sm:text-base">
                No saved jobs yet. Save interesting positions for later!
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

      {/* Approved Applications with Contact Details - Mobile Optimized */}
      {Array.isArray(approvedApplicationsWithContact) && approvedApplicationsWithContact.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
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
    </div>
  );
};

export default StudentHome;
