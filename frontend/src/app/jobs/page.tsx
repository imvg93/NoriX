"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Search,
  Filter,
  MapPin,
  DollarSign,
  Calendar,
  Bookmark,
  Star,
  Plus,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Briefcase
} from 'lucide-react';
import { apiService, type JobsResponse, type ApplicationsResponse, type Job } from '../../services/api';

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
              const jobsData: JobsResponse = await apiService.getJobs();
      const jobsList = jobsData.jobs || [];
      setJobs(jobsList);
      setFilteredJobs(jobsList);
      
      // Fetch user applications to check which jobs they've applied to
      const applications: ApplicationsResponse = await apiService.getUserApplications();
      const appliedJobIds = applications.applications.map((app) => app.job._id);
      setAppliedJobs(appliedJobIds);
        
      } catch (error) {
        console.error('Error fetching jobs:', error);
        // Fallback to mock data
        const mockJobs: Job[] = [
          {
            _id: '1',
            title: 'Frontend Developer Intern',
            description: 'We are looking for a talented frontend developer intern...',
            company: 'TechCorp Inc.',
            location: 'Hyderabad',
            salary: 25000,
            payType: 'monthly',
            type: 'Internship',
            category: 'Technology',
            status: 'active',
            employer: '1',
            createdAt: '2024-01-15T10:00:00Z',
            views: 100,
            applicationsCount: 15,
            requirements: ['React', 'JavaScript', 'HTML/CSS']
          },
          {
            _id: '2',
            title: 'Data Analyst',
            description: 'Join our data team to analyze and visualize complex datasets...',
            company: 'DataFlow Solutions',
            location: 'Remote',
            salary: 35000,
            payType: 'monthly',
            type: 'Full-time',
            category: 'Analytics',
            status: 'active',
            employer: '2',
            createdAt: '2024-01-12T10:00:00Z',
            views: 120,
            applicationsCount: 18,
            requirements: ['Python', 'SQL', 'Excel']
          },
          {
            _id: '3',
            title: 'Marketing Assistant',
            description: 'Support our marketing team with digital campaigns...',
            company: 'Growth Marketing Co.',
            location: 'Hyderabad',
            salary: 20000,
            payType: 'monthly',
            type: 'Part-time',
            category: 'Marketing',
            status: 'active',
            employer: '3',
            createdAt: '2024-01-10T10:00:00Z',
            views: 80,
            applicationsCount: 12,
            requirements: ['Social Media', 'Content Writing', 'Analytics']
          },
          {
            _id: '4',
            title: 'Backend Developer',
            description: 'Build scalable backend systems and APIs...',
            company: 'TechCorp Inc.',
            location: 'Hyderabad',
            salary: 40000,
            payType: 'monthly',
            type: 'Full-time',
            category: 'Technology',
            status: 'active',
            employer: '1',
            createdAt: '2024-01-08T10:00:00Z',
            views: 200,
            applicationsCount: 35,
            requirements: ['Node.js', 'MongoDB', 'Express']
          },
          {
            _id: '5',
            title: 'UI/UX Designer',
            description: 'Create beautiful and intuitive user interfaces...',
            company: 'Creative Studio',
            location: 'Remote',
            salary: 30000,
            payType: 'monthly',
            type: 'Full-time',
            category: 'Design',
            status: 'active',
            employer: '4',
            createdAt: '2024-01-05T10:00:00Z',
            views: 150,
            applicationsCount: 22,
            requirements: ['Figma', 'Adobe XD', 'Prototyping']
          }
        ];
        setJobs(mockJobs);
        setFilteredJobs(mockJobs);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
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
    
    if (selectedExperience) {
      filtered = filtered.filter(job => job.type === selectedExperience);
    }
    
    setFilteredJobs(filtered);
  }, [jobs, searchTerm, selectedLocation, selectedType, selectedExperience]);

  const handleApplyJob = async (jobId: string) => {
    try {
      await apiService.applyToJob(jobId, {
        coverLetter: 'I am interested in this position...',
        resume: 'resume.pdf'
      });
      
      setAppliedJobs(prev => [...prev, jobId]);
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Failed to apply to job. Please try again.');
    }
  };

  const handleSaveJob = (jobId: string) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(prev => prev.filter(id => id !== jobId));
    } else {
      setSavedJobs(prev => [...prev, jobId]);
    }
  };

  const jobTypes = ['All', 'Full-time', 'Part-time', 'Internship', 'Contract'];
  const locations = ['All', 'Hyderabad', 'Remote', 'Bangalore', 'Mumbai', 'Delhi'];
  const experienceLevels = ['All', 'Entry Level', 'Mid Level', 'Senior Level'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Job</h1>
          <p className="text-gray-600">Browse through thousands of job opportunities</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
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
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
            className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {experienceLevels.map(level => (
                  <option key={level} value={level === 'All' ? '' : level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredJobs.length} of {jobs.length} jobs
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select className="text-sm border border-gray-300 rounded px-2 py-1">
            <option>Latest</option>
            <option>Salary: High to Low</option>
            <option>Salary: Low to High</option>
            <option>Company Name</option>
          </select>
        </div>
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isApplied = appliedJobs.includes(job._id);
            const isSaved = savedJobs.includes(job._id);
            
            return (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
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
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
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
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                        {job.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 lg:w-48">
                    <div className="text-sm text-gray-500">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
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

      {/* Pagination */}
      {filteredJobs.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Previous
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">1</button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">2</button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">3</button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
