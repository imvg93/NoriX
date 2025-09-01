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
  LogOut
} from 'lucide-react';
import StatsCard from './StatsCard';
import TaskCard from './TaskCard';
import NotificationCard from './NotificationCard';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  type: string;
  postedDate: string;
  status: string;
  employer: {
    _id: string;
    companyName: string;
    email: string;
  };
}

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

const StudentHome: React.FC<StudentHomeProps> = ({ user }) => {
  const router = useRouter();
  const { logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch jobs
        const jobsData = await apiService.getJobs();
        setJobs(jobsData.jobs || jobsData || []);
        
        // Fetch user applications
        const applicationsData = await apiService.getUserApplications();
        setAppliedJobs(applicationsData.applications || applicationsData || []);
        
        // Mock data for saved jobs, interviews, and notifications (replace with real API calls)
        setSavedJobs([
          {
            _id: '1',
            job: jobsData.jobs?.[0] || jobsData?.[0],
            savedDate: '2024-01-14'
          }
        ]);
        
        setInterviews([
          {
            _id: '1',
            job: jobsData.jobs?.[0] || jobsData?.[0],
            date: '2024-01-20',
            time: '10:00 AM',
            type: 'In-person',
            location: 'Hyderabad',
            status: 'scheduled'
          }
        ]);
        
        setNotifications([
          {
            _id: '1',
            title: 'Application Viewed',
            message: 'Logistics Solutions viewed your Warehouse Worker application',
            type: 'info',
            timestamp: '2 hours ago',
            isRead: false
          },
          {
            _id: '2',
            title: 'Interview Scheduled',
            message: 'CleanPro Services scheduled your interview for Jan 22',
            type: 'success',
            timestamp: '1 day ago',
            isRead: true
          }
        ]);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to mock data if API fails
        setJobs([
          {
            _id: '1',
            title: 'Warehouse Worker',
            company: 'Logistics Solutions',
            location: 'Hyderabad',
            salary: '₹15,000/month',
            description: 'Looking for reliable warehouse workers for loading and unloading goods. Perfect for students looking for part-time work.',
            requirements: ['Manual Labor', 'Team Work', 'Physical Stamina'],
            type: 'Full-time',
            postedDate: '2024-01-15',
            status: 'active',
            employer: {
              _id: '1',
              companyName: 'Logistics Solutions',
              email: 'hr@logistics.com'
            }
          },
          {
            _id: '2',
            title: 'Housekeeping Staff',
            company: 'CleanPro Services',
            location: 'Hyderabad',
            salary: '₹12,000/month',
            description: 'Cleaning and maintenance staff needed for office buildings. Flexible hours available for students.',
            requirements: ['Cleaning', 'Attention to Detail', 'Reliability'],
            type: 'Part-time',
            postedDate: '2024-01-12',
            status: 'active',
            employer: {
              _id: '2',
              companyName: 'CleanPro Services',
              email: 'careers@cleanpro.com'
            }
          },
          {
            _id: '3',
            title: 'Delivery Driver',
            company: 'FastDelivery Co.',
            location: 'Hyderabad',
            salary: '₹18,000/month',
            description: 'Delivery drivers needed for local package delivery. Own vehicle preferred but not required.',
            requirements: ['Driving License', 'Navigation', 'Customer Service'],
            type: 'Full-time',
            postedDate: '2024-01-10',
            status: 'active',
            employer: {
              _id: '3',
              companyName: 'FastDelivery Co.',
              email: 'jobs@fastdelivery.com'
            }
          },
          {
            _id: '4',
            title: 'Daily Labor - Construction',
            company: 'BuildRight Construction',
            location: 'Hyderabad',
            salary: '₹500/day',
            description: 'Daily labor work for construction sites. No experience required, training provided.',
            requirements: ['Physical Stamina', 'Team Work', 'Reliability'],
            type: 'Daily Labor',
            postedDate: '2024-01-08',
            status: 'active',
            employer: {
              _id: '4',
              companyName: 'BuildRight Construction',
              email: 'hr@buildright.com'
            }
          },
          {
            _id: '5',
            title: 'Kitchen Helper',
            company: 'FoodCourt Restaurant',
            location: 'Hyderabad',
            salary: '₹10,000/month',
            description: 'Kitchen helper position available. Learn cooking skills while earning money.',
            requirements: ['Food Safety', 'Team Work', 'Fast Learning'],
            type: 'Part-time',
            postedDate: '2024-01-06',
            status: 'active',
            employer: {
              _id: '5',
              companyName: 'FoodCourt Restaurant',
              email: 'jobs@foodcourt.com'
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      await apiService.applyToJob(jobId, {
        coverLetter: 'I am interested in this position...',
        resume: 'resume.pdf'
      });
      
      // Update applied jobs list
      const job = jobs.find(j => j._id === jobId);
      if (job) {
        setAppliedJobs(prev => [...prev, {
          _id: Date.now().toString(),
          job,
          status: 'pending',
          appliedDate: new Date().toISOString().split('T')[0]
        }]);
      }
      
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Failed to apply to job. Please try again.');
    }
  };

  const handleSaveJob = (jobId: string) => {
    const job = jobs.find(j => j._id === jobId);
    if (job && !savedJobs.find(sj => sj.job._id === jobId)) {
      setSavedJobs(prev => [...prev, {
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/home" 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
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
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Briefcase className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hi {user?.name || 'Student'}!</h1>
            <p className="text-blue-100">Ready to find your next opportunity? Here's your job search overview</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Jobs Applied"
          value={appliedJobs.length}
          icon={FileText}
          color="blue"
          change={`+${appliedJobs.filter(job => new Date(job.appliedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} this week`}
          changeType="positive"
        />
        <StatsCard
          title="Saved Jobs"
          value={savedJobs.length}
          icon={Bookmark}
          color="purple"
          change={`+${savedJobs.filter(job => new Date(job.savedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} this week`}
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

      {/* Featured Non-IT Jobs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-orange-600 rounded-full">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Featured Non-IT & Daily Labor Jobs</h2>
            <p className="text-sm text-gray-600">Perfect opportunities for students looking for flexible work</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs
            .filter(job => job.type === 'Daily Labor' || job.type === 'Part-time')
            .slice(0, 3)
            .map((job) => {
              const isApplied = appliedJobs.some(aj => aj.job._id === job._id);
              const isSaved = savedJobs.some(sj => sj.job._id === job._id);
              
              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl p-4 border border-orange-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                      <p className="text-orange-600 font-medium text-sm">{job.company}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSaveJob(job._id)}
                        className={`p-1 rounded-full transition-colors ${
                          isSaved 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-purple-100 hover:text-purple-600'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{job.salary}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">{job.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {job.requirements.slice(0, 2).map((req, index) => (
                      <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                        {req}
                      </span>
                    ))}
                    {job.requirements.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        +{job.requirements.length - 2} more
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {isApplied ? (
                      <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs">
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
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs"
                    >
                      Details
                    </Link>
                  </div>
                </motion.div>
              );
            })}
        </div>
        
        {filteredJobs.filter(job => job.type === 'Daily Labor' || job.type === 'Part-time').length === 0 && (
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No featured jobs available</h3>
            <p className="text-gray-600">Check back later for new opportunities!</p>
          </div>
        )}
      </motion.div>

      {/* Job Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Find Your Perfect Job</h2>
        </div>
        
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs, companies, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Job Listings */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const isApplied = appliedJobs.some(aj => aj.job._id === job._id);
              const isSaved = savedJobs.some(sj => sj.job._id === job._id);
              
              return (
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
                          <p className="text-lg text-blue-600 font-medium">{job.company}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveJob(job._id)}
                            className={`p-2 rounded-full transition-colors ${
                              isSaved 
                                ? 'bg-purple-100 text-purple-600' 
                                : 'bg-gray-100 text-gray-400 hover:bg-purple-100 hover:text-purple-600'
                            }`}
                          >
                            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{job.salary}</span>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                          {job.type}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.requirements.slice(0, 3).map((req, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {req}
                          </span>
                        ))}
                        {job.requirements.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            +{job.requirements.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 lg:w-48">
                      <div className="text-sm text-gray-500">
                        Posted {new Date(job.postedDate).toLocaleDateString()}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {isApplied ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Applied</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApplyJob(job._id)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            Apply Now
                          </button>
                        )}
                        
                        <Link 
                          href={`/jobs/${job._id}`}
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
          </div>
          <div className="space-y-3">
            {appliedJobs.slice(0, 3).map((application) => (
              <div key={application._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{application.job.title}</h3>
                  <p className="text-sm text-gray-600">{application.job.company} • {application.job.location}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    application.status === 'accepted' ? 'bg-green-100 text-green-600' :
                    application.status === 'reviewing' ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {application.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{application.appliedDate}</p>
                </div>
              </div>
            ))}
            {appliedJobs.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No applications yet. Start applying to jobs!
              </div>
            )}
          </div>
        </motion.div>

        {/* Saved Jobs */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bookmark className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Saved Jobs</h2>
          </div>
          <div className="space-y-3">
            {savedJobs.slice(0, 3).map((savedJob) => (
              <div key={savedJob._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{savedJob.job.title}</h3>
                    <p className="text-sm text-gray-600">{savedJob.job.company}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        {savedJob.job.salary}
                      </span>
                      <span className="text-xs text-gray-500">{savedJob.job.location}</span>
                    </div>
                  </div>
                  <button className="text-purple-600 hover:text-purple-700">
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>
            ))}
            {savedJobs.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No saved jobs yet. Save interesting positions for later!
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Upcoming Interviews */}
      {interviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Interviews</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviews.map((interview) => (
              <div key={interview._id} className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-3 mb-3">
                  <Building className="w-5 h-5 text-orange-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">{interview.job.company}</h3>
                    <p className="text-sm text-gray-600">{interview.job.title}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{interview.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{interview.time}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                    {interview.type} Interview
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
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

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200 group"
            >
              <div className={`p-3 bg-${action.color}-100 rounded-full group-hover:bg-${action.color}-200 transition-colors`}>
                <action.icon className={`w-6 h-6 text-${action.color}-600`} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 text-center">
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
