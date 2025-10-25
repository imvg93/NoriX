"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Building, 
  MapPin, 
  DollarSign, 
  Calendar,
  FileText,
  Users,
  ArrowLeft,
  Send,
  Briefcase,
  Clock,
  Star,
  Eye,
  CheckCircle,
  X
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { kycStatusService } from '../../../services/kycStatusService';

const PostJobPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [kycOK, setKycOK] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    jobTitle: '',
    description: '',
    location: '',
    salaryRange: '',
    workType: 'Full-time',
    skillsRequired: [] as string[],
    applicationDeadline: ''
  });

  // Check employer KYC status and gate job posting
  useEffect(() => {
    const checkKYC = async () => {
      try {
        const status = await kycStatusService.checkKYCStatus();
        setKycOK(status.status === 'approved');
      } catch (e) {
        setKycOK(false);
      }
    };
    checkKYC();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({
      ...prev,
      skillsRequired: skills
    }));
  };

  const addSkillTag = (skill: string) => {
    if (!formData.skillsRequired.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, skill]
      }));
    }
  };

  const removeSkillTag = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const jobData = {
        jobTitle: formData.jobTitle,
        description: formData.description,
        location: formData.location,
        salaryRange: formData.salaryRange,
        workType: formData.workType,
        skillsRequired: formData.skillsRequired,
        applicationDeadline: formData.applicationDeadline
      };

      if (!kycOK) {
        alert('Complete and get your KYC approved before posting jobs');
        setLoading(false);
        return;
      }
      await apiService.createJob(jobData);
      
      alert('Job posted successfully! Your job will stay highlighted until you delete it, helping it stand out to applicants.');
      router.push('/employer-home');
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const commonSkills = [
    'Team Collaboration',
    'Problem Solving',
    'Time Management',
    'Communication',
    'Physical Fitness',
    'Customer Service',
    'Organization',
    'Adaptability',
    'Manual Labor',
    'Reliability',
    'Punctuality',
    'Safety Awareness'
  ];

  // Form validation
  const isFormValid = () => {
    return (
      formData.jobTitle.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.location.trim() !== '' &&
      formData.salaryRange.trim() !== '' &&
      formData.applicationDeadline !== '' &&
      kycOK
    );
  };

  const fillTestData = () => {
    const testJobs = [
      {
        jobTitle: 'Warehouse Worker',
        description: 'Looking for hardworking individuals to join our warehouse team. Responsibilities include package sorting, inventory management, and maintaining warehouse cleanliness. No prior experience required - we provide full training.',
        location: 'Hyderabad, Telangana',
        salaryRange: '₹18,000/month',
        workType: 'Full-time',
        skillsRequired: ['Team Collaboration', 'Physical Fitness', 'Reliability'],
        applicationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        jobTitle: 'Delivery Executive',
        description: 'Join our delivery team and earn daily wages! Deliver packages across the city using our company vehicles. Flexible timing and good incentives for performance.',
        location: 'Bangalore, Karnataka',
        salaryRange: '₹500/day',
        workType: 'Part-time',
        skillsRequired: ['Communication', 'Time Management', 'Reliability'],
        applicationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        jobTitle: 'Restaurant Helper',
        description: 'Assist kitchen staff with food preparation, cleaning, and customer service. Great opportunity for students to earn while learning hospitality skills.',
        location: 'Mumbai, Maharashtra',
        salaryRange: '₹400/day',
        workType: 'Part-time',
        skillsRequired: ['Customer Service', 'Organization', 'Adaptability'],
        applicationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ];

    const randomJob = testJobs[Math.floor(Math.random() * testJobs.length)];
    
    setFormData(prev => ({
      ...prev,
      jobTitle: randomJob.jobTitle,
      description: randomJob.description,
      location: randomJob.location,
      salaryRange: randomJob.salaryRange,
      workType: randomJob.workType,
      skillsRequired: randomJob.skillsRequired,
      applicationDeadline: randomJob.applicationDeadline
    }));
  };

  const JobPreview = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Job Preview</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Job Header */}
            <div className="border-b pb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.jobTitle}</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  <span>Company Name</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{formData.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>{formData.salaryRange}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{formData.workType}</span>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{formData.description}</p>
            </div>

            {/* Skills Required */}
            {formData.skillsRequired.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills Required</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.skillsRequired.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Application Deadline */}
            {formData.applicationDeadline && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Deadline</h3>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(formData.applicationDeadline).toLocaleDateString()}</span>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-2 text-gray-700">
                <div>Email: contact@company.com</div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t">
            <button
              onClick={() => setShowPreview(false)}
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Looks Good - Post Job
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
          <button 
            onClick={fillTestData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Star className="w-4 h-4" />
            Fill Test Data
          </button>
          <button 
            onClick={async () => {
              try {
                const userData = await apiService.getProfile();
                if (userData?._id) {
                  const statusRes = await apiService.getEmployerKYCStatus(userData._id);
                  console.log('Manual KYC check:', statusRes);
                  alert(`KYC Status: ${statusRes?.status || 'Unknown'}`);
                }
              } catch (error) {
                console.error('Manual KYC check error:', error);
                alert('Error checking KYC status');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <CheckCircle className="w-4 h-4" />
            Check KYC
          </button>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold text-gray-900">Post New Job</h2>
          <p className="text-sm text-gray-600">Essential fields only</p>
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
            <Plus className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Post a Job in 2 Minutes</h1>
            <p className="text-orange-100">Only essential fields - no hassle, just results</p>
          </div>
        </div>
      </motion.div>


      {/* KYC Status Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className={`rounded-2xl p-4 border ${
          kycOK 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {kycOK ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <Clock className="w-5 h-5 text-yellow-600" />
          )}
          <div>
            <h3 className={`font-semibold ${kycOK ? 'text-green-800' : 'text-yellow-800'}`}>
              {kycOK ? 'KYC Approved - Ready to Post Jobs' : 'Checking KYC Status...'}
            </h3>
            <p className={`text-sm ${kycOK ? 'text-green-700' : 'text-yellow-700'}`}>
          {kycOK 
            ? 'Your employer verification is complete and you can post jobs.'
            : 'Complete KYC to post jobs.'
          }
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form Validation Debug (only show if form is invalid) */}
      {!isFormValid() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Form Status</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <div>Job Title: {formData.jobTitle.trim() !== '' ? '✅' : '❌'}</div>
                <div>Description: {formData.description.trim() !== '' ? '✅' : '❌'}</div>
                <div>Location: {formData.location.trim() !== '' ? '✅' : '❌'}</div>
                <div>Salary: {formData.salaryRange.trim() !== '' ? '✅' : '❌'}</div>
                <div>Deadline: {formData.applicationDeadline !== '' ? '✅' : '❌'}</div>
                <div>KYC Status: {kycOK ? '✅ Approved' : '❌ Pending'}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Essential Fields Only Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Essential Fields Only */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                required
                placeholder="e.g., Warehouse Worker, Delivery Executive, Restaurant Helper"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Describe the role, responsibilities, and what makes this position suitable for students..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Hyderabad, Remote, On-site"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range *
                </label>
                <input
                  type="text"
                  name="salaryRange"
                  value={formData.salaryRange}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., ₹15,000/month, ₹500/day, ₹200/hour"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Type *
                </label>
                <select
                  name="workType"
                  value={formData.workType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="Part-time">Part-time</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline *
                </label>
                <input
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills Required
              </label>
              <input
                type="text"
                value={formData.skillsRequired.join(', ')}
                onChange={handleSkillsChange}
                placeholder="e.g., Team work, Communication, Physical fitness (comma-separated)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              
              {/* Quick Add Skills */}
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Quick add common skills:</p>
                <div className="flex flex-wrap gap-2">
                  {commonSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkillTag(skill)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Skills Display */}
              {formData.skillsRequired.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Selected skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.skillsRequired.map((skill, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkillTag(skill)}
                          className="hover:text-orange-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Eye className="w-5 h-5" />
              Preview Job
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
              {loading ? 'Posting Job...' : 'Post Job'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </form>
      </motion.div>

      {/* Preview Modal */}
      {showPreview && <JobPreview />}
    </div>
  );
};

export default PostJobPage;