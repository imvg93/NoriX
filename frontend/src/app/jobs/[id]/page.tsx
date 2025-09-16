"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  MapPin,
  DollarSign,
  Calendar,
  Building,
  Users,
  FileText,
  Bookmark,
  Star,
  Plus,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';
import { apiService } from '../../../services/api';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  skills: string[];
  type: string;
  experience: string;
  education: string;
  benefits: string;
  contactEmail: string;
  contactPhone: string;
  postedDate: string;
  status: string;
  employer: {
    _id: string;
    companyName: string;
    email: string;
  };
}

const JobDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const jobData = await apiService.getJob(jobId) as any;
        setJob(jobData.job || jobData);
        
        // Check if user has applied to this job
        const applications = await apiService.getUserApplications() as any;
        const hasAppliedToJob = applications.applications?.some((app: any) => app.job === jobId) || applications.some?.((app: any) => app.job === jobId) || false;
        setHasApplied(hasAppliedToJob);
        
      } catch (error) {
        console.error('Error fetching job details:', error);
        // Fallback to mock data
        setJob({
          _id: jobId,
          title: 'Frontend Developer Intern',
          company: 'TechCorp Inc.',
          location: 'Hyderabad',
          salary: '₹25,000/month',
          description: 'We are looking for a talented frontend developer intern to join our dynamic team. You will work on cutting-edge web applications and learn from experienced developers. This is a great opportunity to gain real-world experience in a fast-paced environment.',
          requirements: ['React', 'JavaScript', 'HTML/CSS', 'Git'],
          skills: ['Team collaboration', 'Problem solving', 'Communication'],
          type: 'Internship',
          experience: 'Entry Level',
          education: 'Bachelor\'s',
          benefits: 'Health insurance, Flexible hours, Remote work options, Professional development',
          contactEmail: 'hr@techcorp.com',
          contactPhone: '+91 98765 43210',
          postedDate: '2024-01-15',
          status: 'active',
          employer: {
            _id: '1',
            companyName: 'TechCorp Inc.',
            email: 'hr@techcorp.com'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const handleApply = async () => {
    try {
      setApplying(true);
      await apiService.applyToJob(jobId, {
        coverLetter: 'I am interested in this position and believe my skills align well with your requirements.',
        resume: 'resume.pdf'
      });
      setHasApplied(true);
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Failed to apply to job. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleSaveJob = () => {
    setIsSaved(!isSaved);
    // Here you would typically save to backend
    alert(isSaved ? 'Job removed from saved jobs' : 'Job saved successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Job not found</h2>
        <p className="text-gray-600">The job you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold text-gray-900">Job Details</h2>
          <p className="text-sm text-gray-600">View and apply for this position</p>
        </div>
      </div>

      {/* Job Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <p className="text-xl text-blue-600 font-medium">{job.company}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveJob}
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">{job.salary}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">Posted {new Date(job.postedDate).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                {job.type}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                {job.experience}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                {job.education}
              </span>
            </div>
          </div>
          
          <div className="lg:w-64">
            {hasApplied ? (
              <div className="flex items-center gap-2 p-4 bg-green-100 text-green-700 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Applied</span>
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applying ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {applying ? 'Applying...' : 'Apply Now'}
              </button>
            )}
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Active position</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Job Description
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">{job.description}</p>
            </div>
          </motion.div>

          {/* Requirements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-600" />
              Requirements
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.requirements.map((req, index) => (
                <span key={index} className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm">
                  {req}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-600" />
                Benefits & Perks
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700">{job.benefits}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Company Information
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">{job.company}</h4>
                <p className="text-sm text-gray-600">{job.location}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{job.contactEmail}</span>
                </div>
                {job.contactPhone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{job.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Job Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Job Type:</span>
                <span className="font-medium">{job.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Experience:</span>
                <span className="font-medium">{job.experience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Education:</span>
                <span className="font-medium">{job.education}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Salary:</span>
                <span className="font-medium">{job.salary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{job.location}</span>
              </div>
            </div>
          </motion.div>

          {/* Similar Jobs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Jobs</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Backend Developer</h4>
                <p className="text-sm text-gray-600">TechCorp Inc.</p>
                <p className="text-xs text-gray-500">₹30,000/month</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">UI/UX Designer</h4>
                <p className="text-sm text-gray-600">Creative Studio</p>
                <p className="text-xs text-gray-500">₹28,000/month</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsPage;
