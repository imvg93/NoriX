"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  MapPin, 
  Filter, 
  Building, 
  Clock, 
  DollarSign,
  Star,
  Users,
  Calendar,
  Briefcase,
  Eye,
  Heart
} from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Use the Job interface from the API service
interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: number;
  payType?: string;
  type: string;
  category: string;
  status: string;
  employer: string;
  createdAt: string;
  views?: number;
  applicationsCount?: number;
  requirements?: string[];
}

interface JobsResponse {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ApplicationsResponse {
  applications: Array<{
    _id: string;
    job: Job;
    student: string | {
      _id: string;
      name: string;
      email: string;
      phone?: string;
      college?: string;
      skills?: string[];
    };
    employer: string;
    status: string;
    appliedDate: string;
    coverLetter?: string;
    expectedPay?: number;
    availability?: string;
  }>;
}

const JobsPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  // Fetch jobs and applied jobs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch available jobs
        const jobsResponse = await apiService.getJobs() as JobsResponse;
        setJobs(jobsResponse.jobs || []);
        
        // Fetch user's applications to check which jobs they've applied to
        if (isAuthenticated && user?.userType === 'student') {
          try {
            const applicationsResponse = await apiService.getUserApplications() as ApplicationsResponse;
            const appliedJobIds = (applicationsResponse.applications || []).map(app => 
              typeof app.job === 'string' ? app.job : app.job._id
            );
            setAppliedJobs(appliedJobIds);
          } catch (error) {
            console.error('Error fetching applications:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !selectedLocation || job.location.toLowerCase().includes(selectedLocation.toLowerCase());
    const matchesType = !selectedType || job.type === selectedType;
    
    return matchesSearch && matchesLocation && matchesType;
  });

  // Apply for job
  const handleApply = async (jobId: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.userType !== 'student') {
      alert('Only students can apply for jobs');
      return;
    }

    try {
      await apiService.applyForJob(jobId);
      setAppliedJobs(prev => [...prev, jobId]);
      alert('Application submitted successfully!');
    } catch (error: any) {
      console.error('Error applying for job:', error);
      alert(error.message || 'Failed to apply for job');
    }
  };

  // Get unique locations and work types for filters
  const locations = [...new Set(jobs.map(job => job.location))];
  const workTypes = [...new Set(jobs.map(job => job.type))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Available Jobs</h1>
              <p className="text-gray-600">Find your next opportunity</p>
              </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{filteredJobs.length} jobs found</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
              <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
          </div>

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>

            {/* Work Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {workTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Clear Filters */}
              <button
              onClick={() => {
                setSearchTerm('');
                setSelectedLocation('');
                setSelectedType('');
              }}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Clear Filters
              </button>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job, index) => (
              <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Job Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Company Logo */}
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                    <Building className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
                    <p className="text-gray-600">{job.company}</p>
                  </div>
                  </div>
                </div>

              {/* Job Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{job.salary ? `₹${job.salary}` : 'Salary not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{job.type}</span>
                </div>
                {job.category && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span>{job.category}</span>
                  </div>
                )}
                            </div>

              {/* Description */}
              <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>

              {/* Skills */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.slice(0, 3).map((skill, index) => (
                      <span key={index} className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                    {job.requirements.length > 3 && (
                      <span className="text-gray-500 text-xs px-2 py-1">
                        +{job.requirements.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Job Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                  <span>Views: {job.views || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/jobs/${job._id}`)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {isAuthenticated && user?.userType === 'student' ? (
                    appliedJobs.includes(job._id) ? (
                      <span className="px-4 py-2 bg-green-100 text-green-600 rounded-xl text-sm font-medium">
                        Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(job._id)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
                      >
                        Apply Now
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => router.push('/login')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
                    >
                      Login to Apply
                            </button>
                  )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        {/* No Jobs Found */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
        )}
          </div>
    </div>
  );
};

export default JobsPage;