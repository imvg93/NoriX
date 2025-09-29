"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building, 
  Briefcase, 
  Users, 
  Star, 
  Plus, 
  Eye, 
  User, 
  Bell,
  TrendingUp,
  Clock,
  CheckCircle,
  MapPin,
  DollarSign,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  FileText,
  Bookmark,
  Settings,
  BarChart3,
  X,
  LogOut,
  RefreshCcw
} from 'lucide-react';
import StatsCard from './StatsCard';
import NotificationCard from './NotificationCard';
import { apiService, type JobsResponse, type Job, type ApplicationsResponse } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface JobPosting extends Job {
  jobTitle?: string;
  companyName?: string;
  approvalStatus?: string;
  salaryRange?: string;
  workType?: string;
  applications: number;
  applicants?: Array<{
    applicationId: string;
    studentId: string;
    name: string;
    email: string;
    skills?: string[];
    resumeUrl?: string;
    appliedAt: string;
    status: string;
  }>;
}

interface EmployerApplication {
  _id: string;
  student: {
    name: string;
    email: string;
    skills?: string[];
  };
  job: {
    _id: string;
    title: string;
    company: string;
  };
  status: string;
  appliedDate: string;
  coverLetter?: string;
}

interface TopCandidate {
  _id: string;
  name: string;
  skills: string[];
  rating: number;
  experience: string;
  appliedJobs: number;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
}

interface EmployerHomeProps {
  user: any;
}

const EmployerHome: React.FC<EmployerHomeProps> = ({ user }) => {
  const router = useRouter();
  const { logout } = useAuth();
  const [data, setData] = useState({
    stats: {
      activeJobs: 0,
      totalApplications: 0,
      pendingApprovals: 0,
      hiredStudents: 0
    },
    jobPostings: [] as JobPosting[],
    applications: [] as EmployerApplication[],
    topCandidates: [] as TopCandidate[],
    notifications: [] as Notification[]
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);

  // Fetch data from API
  const fetchData = React.useCallback(async () => {
      try {
        setLoading(true);
        const jobsData: JobsResponse = await apiService.getEmployerDashboardJobs();
        const jobPostings: JobPosting[] = (jobsData.jobs || []).map((job: any) => ({
          ...job,
          _id: job._id || job.jobId,
          jobId: job._id || job.jobId,
          title: job.title || job.jobTitle,
          jobTitle: job.title || job.jobTitle,
          description: job.description || job.jobDescription || '',
          company: job.company || job.companyName || user?.companyName || 'Company',
          companyName: job.companyName || job.company || user?.companyName || 'Company',
          location: job.location || '',
          status: job.status || job.approvalStatus || 'pending',
          approvalStatus: job.approvalStatus || job.status || 'pending',
          createdAt: job.createdAt || new Date().toISOString(),
          salary: job.salaryRange || job.salary || job.payRange || 'N/A',
          salaryRange: job.salaryRange || job.salary || job.payRange || 'N/A',
          type: job.type || job.workType || 'N/A',
          workType: job.workType || job.type || 'N/A',
          applications: typeof job.applicationsCount === 'number' ? job.applicationsCount : (Array.isArray(job.applicants) ? job.applicants.length : 0),
          applicationsCount: typeof job.applicationsCount === 'number' ? job.applicationsCount : (Array.isArray(job.applicants) ? job.applicants.length : 0),
          applicants: Array.isArray(job.applicants) ? job.applicants : [],
          requirements: Array.isArray(job.requirements) ? job.requirements : (Array.isArray(job.skillsRequired) ? job.skillsRequired : []),
          skillsRequired: Array.isArray(job.skillsRequired) ? job.skillsRequired : (Array.isArray(job.requirements) ? job.requirements : []),
        }));
        setData(prev => ({
          ...prev,
          jobPostings
        }));

        const jobIds = new Set(jobPostings.map(jp => jp._id));
        const allApplicants = jobPostings.flatMap((jp) => (jp.applicants || []).map(a => ({
          _id: a.applicationId,
          student: { name: a.name, email: a.email, skills: a.skills || [] },
          job: { _id: jp._id, title: jp.title || 'Job Title', company: jp.company || jp.companyName || 'Company' },
          status: a.status,
          appliedDate: a.appliedAt,
          coverLetter: (a as any).coverLetter || ''
        })));
        const employerApplications: EmployerApplication[] = allApplicants;
        setData(prev => ({
          ...prev,
          applications: employerApplications
        }));

        const activeJobs = jobPostings.filter(job => (job.status === 'active' || job.approvalStatus === 'approved')).length;
        const totalApplications = employerApplications.length;
        const pendingApprovals = jobPostings.filter(job => job.approvalStatus !== 'approved').length;

        setData(prev => ({
          ...prev,
          stats: {
            activeJobs,
            totalApplications,
            pendingApprovals,
            hiredStudents: prev.stats.hiredStudents
          }
        }));

        setData(prev => ({
          ...prev,
          topCandidates: prev.topCandidates,
          notifications: prev.notifications
        }));

      } catch (error) {
        console.error('Error fetching data:', error);
        setData({
          stats: {
            activeJobs: 0,
            totalApplications: 0,
            pendingApprovals: 0,
            hiredStudents: 0
          },
          jobPostings: [],
          applications: [],
          topCandidates: [],
          notifications: []
        });
      } finally {
        setLoading(false);
      }
  }, [user?.companyName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up real-time updates for new applications
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Import socket service dynamically
    import('../services/socketService').then(({ socketService }) => {
      socketService.connect(token);
      
      // Listen for new application notifications using custom events
      const handleNewApplication = (event: any) => {
        console.log('🎉 New application received:', event.detail);
        
        // Refresh applications list to show new application
        apiService.getEmployerApplications().then((applicationsData: ApplicationsResponse) => {
          const employerApplications: EmployerApplication[] = (applicationsData.applications || []).map(app => ({
            _id: app._id,
            student: {
              name: typeof app.student === 'object' ? app.student?.name || 'Unknown Student' : 'Unknown Student',
              email: typeof app.student === 'object' ? app.student?.email || 'unknown@email.com' : 'unknown@email.com',
              skills: typeof app.student === 'object' ? (app.student as any)?.skills || [] : []
            },
            job: {
              _id: typeof app.job === 'object' ? (app.job as any)?._id || (app.job as any)?.jobId || '' : '',
              title: app.job?.title || 'Job Title',
              company: app.job && typeof app.job === 'object'
                ? ((app.job as any)?.company || (app.job as any)?.companyName || 'Company')
                : 'Company'
            },
            status: app.status,
            appliedDate: (app as any).appliedAt || (app as any).appliedDate || '',
            coverLetter: (app as any).coverLetter
          }));
          
          setData(prev => ({
            ...prev,
            applications: employerApplications,
            stats: {
              ...prev.stats,
              totalApplications: applicationsData.applications?.length || 0,
              pendingApprovals: (applicationsData.applications || []).filter(app => app.status === 'pending').length
            }
          }));
        }).catch(console.error);
      };
      
      window.addEventListener('newApplication', handleNewApplication);

      // Cleanup on unmount
      return () => {
        window.removeEventListener('newApplication', handleNewApplication);
        socketService.disconnect();
      };
    });
  }, []);

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = data.jobPostings;
    
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(job => job.status === selectedStatus);
    }
    
    setFilteredJobs(filtered);
  }, [data.jobPostings, searchTerm, selectedStatus]);

  const handleUpdateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      await apiService.updateJobStatus(jobId, newStatus);
      
      // Update local state
      setData(prev => ({
        ...prev,
        jobPostings: prev.jobPostings.map(job => 
          job._id === jobId ? { ...job, status: newStatus } : job
        )
      }));
      
      alert('Job status updated successfully!');
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status. Please try again.');
    }
  };

  const handleVerifyJob = async (jobId: string) => {
    try {
      const jobDetails = await apiService.getJob(jobId);
      const readable = `Job ID: ${jobDetails._id}\nTitle: ${jobDetails.title}\nCompany: ${jobDetails.company}\nStatus: ${jobDetails.status}\nApplications: ${jobDetails.applicationsCount ?? 0}`;
      alert(`✅ Job found in database:\n\n${readable}`);
    } catch (error) {
      console.error('Error verifying job:', error);
      alert('Could not verify this job in the database. Please ensure it exists.');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const quickActions = [
    { name: 'Post New Job', icon: Plus, href: '/employer/post-job', color: 'orange', description: 'Create a new job posting' as const },
    { name: 'View Applications', icon: FileText, href: '/employer/applications', color: 'blue', description: 'Review job applications' as const, count: data.applications.length },
    { name: 'Manage Jobs', icon: Settings, href: '/employer/jobs', color: 'green', description: 'Edit existing job postings' as const, count: data.jobPostings.length },
    { name: 'Refresh Data', icon: RefreshCcw, onClick: fetchData, color: 'gray', description: 'Sync latest jobs and applications' as const },
  ];

  const jobTypes = ['All', 'Full-time', 'Part-time', 'Daily Labor', 'Contract'];
  const statuses = ['All', 'active', 'pending', 'closed'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/home" 
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            <Building className="w-4 h-4" />
            Home
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            Back
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-900">Employer Dashboard</h2>
            <p className="text-sm text-gray-600">Manage your job postings and applications</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Building className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Welcome back, {user?.companyName || 'Employer'}!</h1>
            <p className="text-orange-100">Manage your job postings and find the perfect candidates for your non-IT and daily labor positions</p>
          </div>
          <Link
            href="/employer/post-job"
            className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Post New Job
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Jobs"
          value={data.stats.activeJobs}
          icon={Briefcase}
          color="orange"
          change={`${data.jobPostings.length} total posted`}
          changeType="positive"
        />
        <StatsCard
          title="Total Applications"
          value={data.stats.totalApplications}
          icon={Users}
          color="blue"
          change={`+${data.applications.filter(app => new Date(app.appliedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} this week`}
          changeType="positive"
        />
        <StatsCard
          title="Pending Approvals"
          value={data.stats.pendingApprovals}
          icon={Clock}
          color="orange"
          change="Requires review"
          changeType="neutral"
        />
        <StatsCard
          title="Hired Students"
          value={data.stats.hiredStudents}
          icon={CheckCircle}
          color="green"
          change="+2 this month"
          changeType="positive"
        />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            action.href ? (
              <Link
                key={action.name}
                href={action.href}
                className="group p-4 bg-gray-50 rounded-xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-3 bg-${action.color}-100 rounded-full group-hover:bg-${action.color}-200 transition-colors`}>
                    <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 group-hover:text-orange-700">
                      {action.name}
                    </h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  {typeof (action as any).count === 'number' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                      {(action as any).count}
                    </span>
                  )}
                </div>
              </Link>
            ) : (
              <button
                key={action.name}
                onClick={(action as any).onClick}
                className="text-left group p-4 bg-gray-50 rounded-xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-3 bg-${action.color}-100 rounded-full group-hover:bg-${action.color}-200 transition-colors`}>
                    <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 group-hover:text-orange-700">
                      {action.name}
                    </h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </button>
            )
          ))}
        </div>
      </motion.div>

      {/* Job Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Your Job Postings</h2>
          </div>
          <Link
            href="/employer/post-job"
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Post New Job
          </Link>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs by title, company, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {statuses.map(status => (
                  <option key={status} value={status === 'All' ? '' : status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}

        {/* Job Listings */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">Start by posting your first job to attract candidates</p>
              <Link
                href="/employer/post-job"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Post Your First Job
              </Link>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
                        <p className="text-lg text-orange-600 font-medium">{job.company}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          job.status === 'active' ? 'bg-green-100 text-green-600' : 
                          job.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{job.salaryRange || job.salary || 'N/A'}</span>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                        {job.type || job.workType || 'N/A'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{job.applications} applications</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.requirements?.slice(0, 3).map((req, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {req}
                        </span>
                      ))}
                      {job.requirements && job.requirements.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          +{job.requirements.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Applicants Preview */}
                    {Array.isArray((job as any).applicants) && (job as any).applicants.length > 0 && (
                      <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900">Recent Applicants</h4>
                          <Link href={`/employer/applications/${job._id}`} className="text-xs text-blue-600 hover:text-blue-700">View All</Link>
                        </div>
                        <div className="space-y-2">
                          {(job as any).applicants.slice(0, 3).map((a: any) => (
                            <div key={a.applicationId} className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{a.name}</div>
                                <div className="text-xs text-gray-600">{a.email}</div>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.status === 'accepted' ? 'bg-green-100 text-green-600' : a.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{a.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-3 lg:w-48">
                    <div className="text-sm text-gray-500">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Link 
                        href={`/employer/applications/${job._id}`}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View Applications ({job.applications})
                      </Link>
                      
                      <Link 
                        href={`/employer/jobs/${job._id}/edit`}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Edit Job
                      </Link>

                      <button
                        onClick={() => handleVerifyJob(job._id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Verify Job
                      </button>
                      
                      {job.status === 'active' ? (
                        <button
                          onClick={() => handleUpdateJobStatus(job._id, 'closed')}
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Close Job
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateJobStatus(job._id, 'active')}
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Activate Job
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
            </div>
            <Link
              href="/employer/applications"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {data.applications.slice(0, 3).map((application) => (
              <div key={application._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{application.student.name}</h3>
                  <p className="text-sm text-gray-600">{application.job.title} • {application.job.company}</p>
                  {Array.isArray(application.student.skills) && application.student.skills.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {application.student.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    application.status === 'accepted' ? 'bg-green-100 text-green-600' :
                    application.status === 'reviewing' ? 'bg-blue-100 text-blue-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {application.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{application.appliedDate}</p>
                </div>
              </div>
            ))}
            {data.applications.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No applications yet. Your jobs will appear here when students apply!
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Candidates */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Top Candidates</h2>
          </div>
          <div className="space-y-3">
            {data.topCandidates.map((candidate) => (
              <div key={candidate._id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold">
                      {candidate.name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{candidate.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-orange-500 fill-current" />
                      <span className="text-sm text-gray-600">{candidate.rating}</span>
                      <span className="text-sm text-gray-500">• {candidate.experience} experience</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.map((skill: string, index: number) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Applied to {candidate.appliedJobs} jobs</p>
                </div>
              </div>
            ))}
            {data.topCandidates.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No top candidates yet. Start posting jobs to attract talent!
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Notifications */}
      {data.notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
          </div>
          <div className="space-y-3">
            {data.notifications.map((notification) => (
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
    </div>
  );
};

export default EmployerHome;
