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
  Code,
  Hammer,
  BookOpen,
  Scale,
  Settings,
  ArrowRight,
  Star,
  Filter,
  Loader
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
    title: 'Submit Resume',
    description: 'Apply with one click. Employers see your verified profile instantly.'
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
      try {
        if (isAuthenticated && user?.userType === 'student') {
          const status = await kycStatusService.checkKYCStatus();
          setKycStatus(status.status);
        }
      } catch (_) {
        // ignore
      }
    };
    loadKYC();
  }, [isAuthenticated, user]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = [job.title, job.description, job.company]
      .some(value => value?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Category filtering based on job type and category
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 text-[#2A8A8C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-8 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
              Find Your Dream Jobs Today
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Job portal empowers job seekers and employers alike. It serves as a digital marketplace where individuals can explore verified opportunities.
            </p>

            {/* Search Bar and Filters - Combined */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-7xl mx-auto mb-4 sm:mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Job Title & Keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2A8A8C] focus:border-transparent text-sm sm:text-base"
                />
              </div>
              {isAuthenticated && (
                <>
                  <div className="relative sm:w-48">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2A8A8C] focus:border-transparent text-sm sm:text-base bg-white"
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
                    className="sm:w-48 px-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2A8A8C] focus:border-transparent text-sm sm:text-base bg-white"
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
                className="px-6 sm:px-8 py-3 sm:py-4 bg-[#2A8A8C] text-white rounded-xl hover:bg-[#1f6a6c] transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
              >
                Find Your Job
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("");
                    setSelectedLocation("");
                    setSelectedType("");
                  }}
                  className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Popular Categories */}
            <div className="text-sm text-gray-600 mb-0">
              <span className="font-medium">Popular Categories: </span>
              <span className="text-[#2A8A8C]">Product Designer, Developer, Designer</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="pt-4 pb-8 sm:pb-12 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!isAuthenticated ? (
            <div className="text-center py-12 sm:py-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl mx-auto space-y-6"
              >
                <div className="w-20 h-20 bg-[#2A8A8C] rounded-full flex items-center justify-center mx-auto">
                  <Building className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Sign In to Browse Jobs</h2>
                <p className="text-lg text-gray-600">
                  Join thousands of students and employers who are already using NoriX to connect and grow.
                </p>
                <Link
                  href="/login"
                  className="inline-block px-8 py-3 bg-[#2A8A8C] text-white rounded-xl hover:bg-[#1f6a6c] transition-colors font-medium"
                >
                  Sign In
                </Link>
              </motion.div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <p className="text-lg text-gray-600">No jobs found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-[#2A8A8C] font-medium uppercase tracking-wide mb-1">Available Jobs</p>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Available
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
                      className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 transition-all"
                    >
                      {/* Job Header */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          {isRemote ? (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                              Remote
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                              {job.type || 'Full Time'}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{formatDate(job.createdAt)}</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">{job.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                      </div>

                      {/* Job Details - Compact */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <DollarSign className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span>{job.salary ? formatCurrency(job.salary) : 'Not specified'}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">{job.description}</p>

                      {/* Action Button */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        {user?.userType === "student" ? (
                          isApplied ? (
                            <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                              Applied
                            </span>
                          ) : (
                            <Link
                              href={`/jobs/${job._id}`}
                              className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                                kycStatus === 'approved'
                                  ? 'bg-[#2A8A8C] text-white hover:bg-[#1f6a6c]'
                                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              }`}
                            >
                              {kycStatus === 'approved' ? 'Apply' : 'KYC Required'}
                            </Link>
                          )
                        ) : (
                          <Link
                            href={`/jobs/${job._id}`}
                            className="px-3 py-1.5 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-colors text-xs font-medium"
                          >
                            View Details
                          </Link>
                        )}
                        <Link
                          href={`/jobs/${job._id}`}
                          className="text-[#2A8A8C] hover:text-[#1f6a6c] transition-colors text-xs font-medium flex items-center gap-1"
                        >
                          More
                          <ArrowRight className="w-3 h-3" />
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
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8 sm:mb-12"
            >
              <p className="text-sm sm:text-base font-medium text-[#2A8A8C] mb-2 uppercase tracking-wide">Working Process</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">How Does You Apply</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
              {workingProcess.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2, duration: 0.5 }}
                    className="relative text-center"
                  >
                    {index < workingProcess.length - 1 && (
                      <div className="hidden md:block absolute top-12 left-[60%] w-full h-0.5 bg-[#2A8A8C]/30" />
                    )}
                    <div className="relative z-10">
                      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-[#2A8A8C] rounded-full mb-4 sm:mb-6">
                        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#2A8A8C]/20 rounded-full flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-bold text-[#2A8A8C]">{step.number}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{step.title}</h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Trending Categories Section - Moved to Bottom */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 sm:mb-12"
          >
            <p className="text-sm sm:text-base font-medium text-[#2A8A8C] mb-2 uppercase tracking-wide">Trending Categories</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">Explore By Category</h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  onClick={() => setSelectedCategory(category.label)}
                  className={`cursor-pointer p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all ${
                    selectedCategory === category.label
                      ? 'border-[#2A8A8C] bg-[#2A8A8C]/5'
                      : 'border-gray-200 bg-white hover:border-[#2A8A8C]/50'
                  }`}
                >
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-3 sm:mb-4 mx-auto ${category.color}`}>
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 text-center">{category.label}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={() => setSelectedCategory("")}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#2A8A8C] text-white rounded-xl hover:bg-[#1f6a6c] transition-colors font-medium text-sm sm:text-base"
            >
              All Categories
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default JobsPage;
