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
  Shield
} from 'lucide-react';
import StatsCard from './StatsCard';
import TaskCard from './TaskCard';
import NotificationCard from './NotificationCard';
import { apiService, type JobsResponse, type ApplicationsResponse, type Job, type Application } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import { kycStatusService } from '../services/kycStatusService';

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

const StudentHome: React.FC<StudentHomeProps> = ({ user }) => {
  const router = useRouter();
  const { logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [kycStatus, setKycStatus] = useState<{isCompleted: boolean, status: string}>({isCompleted: false, status: 'not-submitted'});

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
        // Fetch jobs for student dashboard
        const jobsData: JobsResponse = await apiService.getStudentDashboardJobs();
        setJobs(Array.isArray(jobsData.jobs) ? jobsData.jobs : []);
        
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
        
        // Initialize empty arrays for saved jobs, interviews, and notifications
        // TODO: Implement real API calls for these features
        setSavedJobs([]);
        setInterviews([]);
        setNotifications([]);
        
        // Check KYC status
        try {
          const kycStatusData = await kycStatusService.checkKYCStatus();
          setKycStatus({
            isCompleted: kycStatusData.isCompleted,
            status: kycStatusData.status
          });
        } catch (error) {
          console.error('Error checking KYC status:', error);
          // Keep default state if KYC check fails
        }
        
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setErrorMessage(error?.message || 'Failed to load jobs, please try again.');
        // Initialize with empty data instead of fallback mock data
        setJobs([]);
        setAppliedJobs([]);
        setSavedJobs([]);
        setInterviews([]);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Set up real-time updates for job approvals
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Import socket service dynamically
    import('../services/socketService').then(({ socketService }) => {
      socketService.connect(token);
      
      // Listen for job approval notifications using custom events
      const handleJobApproved = (event: any) => {
        console.log('🎉 New job approved:', event.detail);
        // Refresh jobs list to show newly approved job
        apiService.getStudentDashboardJobs().then((jobsData: JobsResponse) => {
          setJobs(jobsData.jobs || []);
        }).catch(console.error);
      };
      
      window.addEventListener('jobApproved', handleJobApproved);

      // Cleanup on unmount
      return () => {
        window.removeEventListener('jobApproved', handleJobApproved);
        socketService.disconnect();
      };
    });
  }, []);

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
      // Prevent duplicate applications locally
      const alreadyApplied = Array.isArray(appliedJobs) && appliedJobs.some(aj => {
        const refId = getJobIdFromRef(aj?.job);
        return refId === jobId;
      });
      if (alreadyApplied) {
        // eslint-disable-next-line no-alert
        alert('You have already applied for this job.');
        return;
      }

      const allowedAvailability = ['weekdays', 'weekends', 'both', 'flexible'];
      let availabilityPreference = typeof user?.availability === 'string' ? user.availability.toLowerCase() : undefined;
      if (!availabilityPreference || !allowedAvailability.includes(availabilityPreference)) {
        availabilityPreference = 'flexible';
      }

      await apiService.applyToJob(jobId, {
        availability: availabilityPreference
      });
      
      // Update applied jobs list
      const job = jobs.find(j => j._id === jobId);
      if (job) {
        setAppliedJobs(prev => [...prev, {
          _id: Date.now().toString(),
          job,
          status: 'applied',
          appliedDate: new Date().toISOString().split('T')[0]
        }]);
      }
      
      // Success toast fallback
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-alert
        alert('Application submitted successfully');
      }
    } catch (error: any) {
      console.error('Error applying to job:', error);
      const friendly = error?.message || 'Failed to submit application. Please try again.';
      // eslint-disable-next-line no-alert
      alert(friendly);
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
            {kycStatus.isCompleted ? (
              <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium cursor-not-allowed opacity-75">
                <Shield className="w-4 h-4" />
                <span className="hidden xs:inline">KYC Verified</span>
                <span className="xs:hidden">Verified</span>
              </div>
            ) : (
              <Link 
                href="/kyc-profile" 
                className="flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium bg-orange-600 text-white hover:bg-orange-700"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden xs:inline">Complete KYC</span>
                <span className="xs:hidden">KYC</span>
              </Link>
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

        {/* Desktop Header */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/home" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            {kycStatus.isCompleted ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium cursor-not-allowed opacity-75">
                <Shield className="w-4 h-4" />
                KYC Verified
              </div>
            ) : (
              <Link 
                href="/kyc-profile" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium bg-orange-600 text-white hover:bg-orange-700"
              >
                <Shield className="w-4 h-4" />
                Complete KYC
              </Link>
            )}
            <button 
              onClick={() => window.history.back()} 
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <h2 className="text-lg font-semibold text-gray-900">Student Dashboard</h2>
              <p className="text-sm text-gray-600">Job Search & Applications</p>
            </div>
            <NotificationDropdown />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
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

      {/* KYC Status Banner - Mobile Optimized */}
      {!kycStatus.isCompleted ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-semibold text-sm sm:text-base">Complete Your KYC Verification</h3>
                <p className="text-orange-100 text-xs sm:text-sm">Verify your identity to access all job opportunities</p>
              </div>
            </div>
            <Link 
              href="/kyc-profile"
              className="bg-white text-orange-600 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors text-sm text-center"
            >
              Complete Now
            </Link>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-semibold text-sm sm:text-base">✅ KYC Verification Complete</h3>
              <p className="text-green-100 text-xs sm:text-sm">Your identity has been verified. You can now access all job opportunities!</p>
            </div>
          </div>
        </motion.div>
      )}

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
          change={interviews.length > 0 ? `Next: ${interviews[0].date}` : 'No upcoming'}
          changeType="neutral"
        />
        <StatsCard
          title="Available Jobs"
          value={jobs.length}
          icon={TrendingUp}
          color="green"
          change={`${filteredJobs.length} match your criteria`}
          changeType="positive"
        />
      </div>

      {/* Featured Non-IT Jobs Section - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-orange-200"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-orange-600 rounded-full">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Featured Non-IT & Daily Labor Jobs</h2>
            <p className="text-xs sm:text-sm text-gray-600">Perfect opportunities for students looking for flexible work</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredJobs
            .filter(job => job.type === 'Daily Labor' || job.type === 'Part-time')
            .slice(0, 3)
            .map((job) => {
              const isApplied = Array.isArray(appliedJobs) ? appliedJobs.some(aj => aj.job._id === job._id) : false;
              const isSaved = Array.isArray(savedJobs) ? savedJobs.some(sj => sj.job._id === job._id) : false;
              
              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base truncate">{job.title}</h3>
                      <p className="text-orange-600 font-medium text-xs sm:text-sm truncate">{job.company}</p>
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
                      <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs truncate">
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
                        className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs font-medium"
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
        
        {filteredJobs.filter(job => job.type === 'Daily Labor' || job.type === 'Part-time').length === 0 && (
          <div className="text-center py-6 sm:py-8">
            <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 text-orange-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No featured jobs available</h3>
            <p className="text-gray-600 text-sm sm:text-base">Check back later for new opportunities!</p>
          </div>
        )}
      </motion.div>

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
          {filteredJobs.length === 0 ? (
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
              
              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 truncate">{job.title}</h3>
                          <p className="text-base sm:text-lg text-blue-600 font-medium truncate">{job.company}</p>
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
                          <span className="truncate">{formatSalaryToINR(job.salary)}</span>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs w-fit">
                          {job.type}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-4 line-clamp-2 text-sm sm:text-base">{job.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.requirements?.slice(0, 3).map((req, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm truncate">
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
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                          >
                            <Plus className="w-4 h-4" />
                            Apply Now
                          </button>
                        )}
                        
                        <Link 
                          href={`/jobs/${job._id}`}
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
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
        {/* Recent Applications - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Applications</h2>
          </div>
          <div className="space-y-3">
            {Array.isArray(appliedJobs) ? appliedJobs.slice(0, 3).map((application) => (
              <div key={application._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{application.job.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">{application.job.company} • {application.job.location}</p>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    application.status === 'accepted' ? 'bg-green-100 text-green-600' :
                    application.status === 'reviewing' ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {application.status}
                  </span>
                  <p className="text-xs text-gray-500">{application.appliedDate}</p>
                </div>
              </div>
            )) : null}
            {Array.isArray(appliedJobs) && appliedJobs.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm sm:text-base">
                No applications yet. Start applying to jobs!
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

      {/* Quick Actions - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
      >
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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
    </div>
  );
};

export default StudentHome;
