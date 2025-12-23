"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Building,
  Clock,
  DollarSign,
  Briefcase,
  GraduationCap,
  Settings,
  ArrowRight,
  Star,
  Filter,
  Loader,
  Sparkles
} from "lucide-react";
import { apiService, type JobsResponse, type Job } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { kycStatusService } from "../../services/kycStatusService";

const INDIAN_CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const formatCurrency = (amount: number | string): string => {
  if (typeof amount === 'string') return amount;
  return `₹${INDIAN_CURRENCY_FORMATTER.format(amount)}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const categories = [
  { icon: Clock, label: 'Part Time', color: 'bg-[#2A8A8C]/10 text-[#2A8A8C]' },
  { icon: Briefcase, label: 'Corporate', color: 'bg-[#2A8A8C]/10 text-[#2A8A8C]' },
  { icon: Building, label: 'On-site', color: 'bg-[#2A8A8C]/10 text-[#2A8A8C]' },
  { icon: MapPin, label: 'Local Jobs', color: 'bg-[#2A8A8C]/10 text-[#2A8A8C]' },
  { icon: GraduationCap, label: 'Student Friendly', color: 'bg-[#2A8A8C]/10 text-[#2A8A8C]' },
  { icon: Settings, label: 'Non-IT', color: 'bg-[#2A8A8C]/10 text-[#2A8A8C]' },
];

const workingProcess = [
  {
    number: '01',
    icon: Search,
    title: 'Browse Jobs',
    description: 'Explore verified job opportunities that match your skills and availability.'
  },
  {
    number: '02',
    icon: Briefcase,
    title: 'Apply Instantly',
    description: 'Apply with one click using your verified profile. No resume needed!'
  },
  {
    number: '03',
    icon: GraduationCap,
    title: 'Get Hired',
    description: 'Start working and track your progress. Get paid on time, every time.'
  }
];

const JobsPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [kycStatus, setKycStatus] = useState<'not_submitted' | 'pending' | 'approved' | 'rejected' | 'suspended'>('not_submitted');
  const [kycLoading, setKycLoading] = useState(true);
  const [isKYCApproved, setIsKYCApproved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const jobsResponse = await apiService.getJobs() as JobsResponse;
        setJobs(jobsResponse.jobs || []);

        if (isAuthenticated && user?.userType === "student") {
          try {
            const applicationsResponse = await apiService.getUserApplications();
            const appliedJobIds = (applicationsResponse.applications || []).map(app =>
              typeof app.job === "string" ? app.job : app.job._id
            );
            setAppliedJobs(appliedJobIds);
          } catch (error) {
            console.error("Error fetching applications:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  useEffect(() => {
    const loadKYC = async () => {
      if (!isAuthenticated || user?.userType !== 'student') {
        setKycLoading(false);
        return;
      }

      try {
        setKycLoading(true);
        const status = await kycStatusService.forceRefreshKYCStatus();
        console.log('🔍 Jobs Page - KYC Status:', status);
        console.log('🔍 Jobs Page - Status value:', status.status);
        console.log('🔍 Jobs Page - Is Completed:', status.isCompleted);
        
        const finalStatus = status.status || 'not_submitted';
        const isApproved = status.isCompleted || finalStatus === 'approved';
        
        console.log('🔍 Jobs Page - Final Status:', finalStatus);
        console.log('🔍 Jobs Page - Is Approved:', isApproved);
        
        setKycStatus(finalStatus);
        setIsKYCApproved(isApproved);
      } catch (error: any) {
        console.error("Error loading KYC status:", error);
        setKycStatus('not_submitted');
        setIsKYCApproved(false);
      } finally {
        setKycLoading(false);
      }
    };
    
    loadKYC();
  }, [isAuthenticated, user]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = [job.title, job.description, job.company]
      .some(value => value?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesCategory: boolean = true;
    if (selectedCategory) {
      const categoryLower = selectedCategory.toLowerCase();
      const jobType = ((job as any)?.workType || job.type || '').toLowerCase();
      const jobCategory = (job.category || '').toLowerCase();
      const jobTitle = (job.title || '').toLowerCase();
      
      if (categoryLower === 'part time') {
        matchesCategory = jobType.includes('part') || jobType.includes('part-time');
      } else if (categoryLower === 'corporate') {
        matchesCategory = jobCategory.includes('corporate') || jobType.includes('corporate');
      } else if (categoryLower === 'on-site') {
        matchesCategory = jobType.includes('on-site') || jobType.includes('onsite') || 
                         (!jobType.includes('remote') && !jobType.includes('online'));
      } else if (categoryLower === 'local jobs') {
        matchesCategory = !!(job.location && job.location.length > 0);
      } else if (categoryLower === 'student friendly') {
        matchesCategory = jobType.includes('part') || jobType.includes('student') ||
                         jobCategory.includes('student') || jobCategory.includes('entry');
      } else if (categoryLower === 'non-it') {
        matchesCategory = !jobCategory.includes('software') && !jobCategory.includes('it') && 
                         !jobCategory.includes('developer') && !jobCategory.includes('programming') &&
                         !jobTitle.includes('software') && !jobTitle.includes('developer');
      }
    }
    
    const matchesLocation = !selectedLocation || job.location?.toLowerCase().includes(selectedLocation.toLowerCase());
    const matchesType = !selectedType || job.type === selectedType;
    return matchesSearch && matchesCategory && matchesLocation && matchesType;
  });

  const locations = [...new Set(jobs.map(job => job.location).filter(Boolean))];
  const workTypes = [...new Set(jobs.map(job => job.type).filter(Boolean))];

  const handleSearch = () => {
    // Search is handled by filteredJobs
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="w-10 h-10 text-[#2A8A8C] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Clean & Refined */}
      <section className="bg-gradient-to-br from-[#2A8A8C]/95 via-[#2A8A8C] to-[#2A8A8C]/90 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Find Your Perfect Job Match</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-5 leading-tight">
              Discover Your Next
              <span className="block text-white/90 mt-1.5">Career Opportunity</span>
            </h1>
            
            <p className="text-base sm:text-lg text-white/85 mb-8 max-w-2xl mx-auto leading-relaxed">
              Connect with verified employers and find jobs that match your skills, schedule, and career goals.
            </p>

            {/* Refined Search Bar */}
            <div className="bg-white rounded-xl shadow-lg p-2 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-0 rounded-lg focus:ring-2 focus:ring-[#2A8A8C]/50 focus:outline-none text-gray-900 placeholder-gray-400 text-sm"
                  />
                </div>
                
                {isAuthenticated && (
                  <>
                    <div className="relative sm:w-44">
                      <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-0 rounded-lg focus:ring-2 focus:ring-[#2A8A8C]/50 focus:outline-none text-gray-900 bg-white text-sm appearance-none cursor-pointer"
                      >
                        <option value="">All Locations</option>
                        {locations.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                    
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="sm:w-44 px-4 py-3 border-0 rounded-lg focus:ring-2 focus:ring-[#2A8A8C]/50 focus:outline-none text-gray-900 bg-white text-sm cursor-pointer"
                    >
                      <option value="">All Types</option>
                      {workTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </>
                )}
                
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-[#2A8A8C] hover:bg-[#1f6a6c] text-white rounded-lg transition-colors duration-200 font-semibold text-sm whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  Search
                </button>
                
                {isAuthenticated && (searchTerm || selectedCategory || selectedLocation || selectedType) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("");
                      setSelectedLocation("");
                      setSelectedType("");
                    }}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!isAuthenticated ? (
            <div className="text-center py-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl mx-auto space-y-5"
              >
                <div className="w-20 h-20 bg-[#2A8A8C] rounded-xl flex items-center justify-center mx-auto shadow-md">
                  <Building className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">Sign In to Browse Jobs</h2>
                <p className="text-base text-gray-600">
                  Join thousands of students and employers who are already using NoriX to connect and grow.
                </p>
                <Link
                  href="/login"
                  className="inline-block px-6 py-3 bg-[#2A8A8C] hover:bg-[#1f6a6c] text-white rounded-lg transition-colors duration-200 font-semibold shadow-md hover:shadow-lg"
                >
                  Sign In to Continue
                </Link>
              </motion.div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1.5">No jobs found</h3>
              <p className="text-gray-600 mb-5 text-sm">Try adjusting your search filters</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                  setSelectedLocation("");
                  setSelectedType("");
                }}
                className="px-5 py-2.5 bg-[#2A8A8C] hover:bg-[#1f6a6c] text-white rounded-lg transition-colors font-medium text-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#2A8A8C] uppercase tracking-wide mb-1">Available Jobs</p>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                    {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Found
                  </h2>
                </div>
                {(searchTerm || selectedCategory || selectedLocation || selectedType) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("");
                      setSelectedLocation("");
                      setSelectedType("");
                    }}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredJobs.map((job, index) => {
                  const isApplied = appliedJobs.includes(job._id);
                  const workType = (job as any)?.workType || job.type || '';
                  const isRemote = workType.toLowerCase().includes('remote') || workType.toLowerCase().includes('online');
                  
                  return (
                    <motion.div
                      key={job._id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                      className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-[#2A8A8C]/20 transition-all duration-200 group"
                    >
                      {/* Job Header */}
                      <div className="mb-3.5">
                        <div className="flex items-start justify-between mb-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isRemote ? (
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium">
                                Remote
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                                {workType || job.type || 'Full Time'}
                              </span>
                            )}
                            {job.highlighted && (
                              <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-medium flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                Featured
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">{formatDate(job.createdAt)}</span>
                        </div>
                        
                        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#2A8A8C] transition-colors">
                          {job.title}
                        </h3>
                        
                        <div className="flex items-center gap-1.5 text-gray-600 mb-2.5">
                          <Building className="w-3.5 h-3.5" />
                          <span className="text-sm font-medium">{job.company}</span>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="space-y-2 mb-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{job.location || 'Location not specified'}</span>
                        </div>
                        {job.salary && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                            <DollarSign className="w-3.5 h-3.5 text-[#2A8A8C]" />
                            <span>{formatCurrency(job.salary)}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2rem] leading-relaxed">
                        {job.description || 'No description available.'}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-3.5 border-t border-gray-50">
                        {user?.userType === "student" ? (
                          isApplied ? (
                            <span className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium">
                              ✓ Applied
                            </span>
                          ) : kycLoading ? (
                            <span className="px-3 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-xs font-medium flex items-center gap-1.5">
                              <Loader className="w-3.5 h-3.5 animate-spin" />
                              Loading...
                            </span>
                          ) : isKYCApproved || kycStatus === 'approved' ? (
                            <Link
                              href={`/jobs/${job._id}`}
                              className="px-3 py-1.5 bg-[#2A8A8C] hover:bg-[#1f6a6c] text-white rounded-lg transition-colors duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
                            >
                              Apply Now
                            </Link>
                          ) : (
                            <Link
                              href="/kyc-profile"
                              className="px-3 py-1.5 bg-[#2A8A8C] hover:bg-[#1f6a6c] text-white rounded-lg transition-colors duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
                            >
                              Complete KYC
                            </Link>
                          )
                        ) : (
                          <Link
                            href={`/jobs/${job._id}`}
                            className="px-3 py-1.5 bg-[#2A8A8C] hover:bg-[#1f6a6c] text-white rounded-lg transition-colors duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
                          >
                            View Details
                          </Link>
                        )}
                        
                        <Link
                          href={`/jobs/${job._id}`}
                          className="text-[#2A8A8C] hover:text-[#1f6a6c] transition-colors text-xs font-medium flex items-center gap-1 group"
                        >
                          More
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Working Process Section */}
      {isAuthenticated && (
        <section className="py-12 lg:py-16 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-10"
            >
              <p className="text-xs font-medium text-[#2A8A8C] uppercase tracking-wide mb-2">How It Works</p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">Simple Application Process</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              {workingProcess.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15, duration: 0.5 }}
                    className="relative text-center"
                  >
                    {index < workingProcess.length - 1 && (
                      <div className="hidden md:block absolute top-14 left-[60%] w-full h-0.5 bg-gradient-to-r from-[#2A8A8C]/20 to-transparent" />
                    )}
                    <div className="relative z-10">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2A8A8C] rounded-xl mb-4 shadow-md">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-0.5 -left-0.5 w-8 h-8 bg-[#2A8A8C]/15 rounded-xl flex items-center justify-center">
                        <span className="text-xs font-semibold text-[#2A8A8C]">{step.number}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="py-12 lg:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <p className="text-xs font-medium text-[#2A8A8C] uppercase tracking-wide mb-2">Browse By Category</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">Explore Job Categories</h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.label;
              return (
                <motion.div
                  key={category.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  onClick={() => setSelectedCategory(isSelected ? "" : category.label)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'border-[#2A8A8C] bg-[#2A8A8C]/5 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-[#2A8A8C]/30 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto transition-transform duration-200 ${
                    isSelected ? 'scale-105' : ''
                  } ${category.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-gray-900 text-center">{category.label}</p>
                </motion.div>
              );
            })}
          </div>

          {selectedCategory && (
            <div className="text-center mt-6">
              <button
                onClick={() => setSelectedCategory("")}
                className="px-6 py-2.5 bg-[#2A8A8C] hover:bg-[#1f6a6c] text-white rounded-lg transition-colors duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
              >
                Clear Category Filter
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default JobsPage;
