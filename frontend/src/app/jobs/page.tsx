"use client";


import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

import { 
  Search, 
  MapPin, 
  Filter, 
  Building, 
  Clock, 
  IndianRupee,
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


  const salaryRanges: Record<string, string> = {
    "Catering boy / Catering staff": "₹180-260/hr",
    "Waiter / Server": "₹150-230/hr",
    "Barista (coffee shop staff)": "₹180-240/hr",
    "Fast food crew (KFC, McDonald's, Domino's, etc.)": "₹12,000-17,000/mo",
    "Delivery boy (food delivery like Zomato/Swiggy)": "₹22,000-32,000/mo",
    "Dishwasher / Kitchen helper": "₹140-200/hr",
    "Event staff (serving, cleaning, organizing)": "₹800-1,200/shift",
    "Bartender assistant": "₹200-320/hr",
    "Sales associate (mall, clothing store, electronics shop)": "₹14,000-20,000/mo",
    "Cashier": "₹13,000-18,000/mo",
    "Customer service helper": "₹15,000-22,000/mo",
    "Store stocker / Shelf organizer": "₹700-1,000/shift",
    "Promotional staff (handing flyers, samples, etc.)": "₹900-1,400/shift",
    "Mall kiosk helper": "₹12,000-16,000/mo",
    "Courier delivery (Amazon, Flipkart, DTDC, etc.)": "₹18,000-26,000/mo",
    "Warehouse helper": "₹700-1,100/day",
    "Loading/unloading staff": "₹750-1,200/day",
    "Bike/Car driver (with license)": "₹20,000-28,000/mo",
    "Office boy / Peon": "₹12,000-16,000/mo",
    "Part-time tutor (school/college subjects)": "₹400-700/hr",
    "Home tuition teacher": "₹500-900/hr",
    "Library assistant": "₹10,000-14,000/mo",
    "Teaching assistant (for coaching institutes)": "₹15,000-22,000/mo",
    "Construction helper": "₹750-1,200/day",
    "Painter's helper": "₹700-1,100/day",
    "Security guard": "₹14,000-20,000/mo",
    "Housekeeping staff (hotels, offices, apartments)": "₹12,000-17,000/mo",
    "Cleaning boy / Janitor": "₹500-800/shift",
    "Gardener": "₹600-900/day",
    "Event coordinator assistant": "₹1,000-1,600/shift",
    "Wedding helper (decoration, serving, setup)": "₹900-1,400/shift",
    "Ticket checker (cinema, events, exhibitions)": "₹9,000-13,000/mo",
    "Stage setup crew": "₹800-1,300/shift",
    "Data entry (basic, offline)": "₹10,000-15,000/mo",
    "Call center (voice/non-voice, non-tech support)": "₹16,000-24,000/mo",
    "Babysitting / Caretaker": "₹300-500/hr",
    "Pet walking / Pet care": "₹200-350/hr",
    "Delivery of newspapers/milk": "₹6,000-10,000/mo",
    "Packing staff (factories, small industries)": "₹700-1,000/shift"
  };

  const getSalaryRange = (job: string) => salaryRanges[job] ?? "₹500-900/shift";

  const filteredCategories = jobCategories.filter(category => {
    if (selectedCategory && category.id !== selectedCategory) return false;
    if (searchQuery) {
      return category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             category.jobs.some(job => job.toLowerCase().includes(searchQuery.toLowerCase()));

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

            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="relative h-10 w-32">
              <Image
                src="/img/logogreen.png"
                alt="NoriX logo"
                fill
                sizes="128px"
                className="object-contain"
                priority
              />

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

                                  <span>Remote/On-site</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>Flexible</span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center gap-1 text-green-600">
                                <IndianRupee className="w-4 h-4" />
                                <span className="font-semibold">{getSalaryRange(job)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">4.5+</span>

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

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already earning while studying. 
              Find flexible work that fits your schedule.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-white text-green-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Find Jobs
              </Link>
              <Link
                href="/login"
                className="bg-green-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-800 transition-colors border border-green-500"
              >
                Post Jobs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold">NoriX</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting students with flexible work opportunities worldwide.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">For Students</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Find Jobs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Student Resources</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">For Employers</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Post Jobs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Find Talent</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Employer Resources</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety</a></li>
              </ul>

            </div>
        )}
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 NoriX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default JobsPage;