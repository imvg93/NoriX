"use client";

import React, { useState } from 'react';
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
  Save,
  Send,
  Briefcase,
  Clock,
  Star
} from 'lucide-react';
import { apiService } from '../../../services/api';

const PostJobPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    description: '',
    requirements: '',
    type: 'Full-time',
    experience: 'Entry Level',
    education: 'Any',
    skills: '',
    benefits: '',
    contactEmail: '',
    contactPhone: '',
    workHours: '',
    shiftType: 'Day',
    immediateStart: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert requirements and skills to arrays
      const requirements = formData.requirements.split(',').map(req => req.trim()).filter(req => req);
      const skills = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);

      const jobData = {
        ...formData,
        requirements,
        skills,
        status: 'active',
        postedDate: new Date().toISOString(),
        category: 'non-it' // Mark as non-IT job
      };

      await apiService.createJob(jobData);
      
      alert('Job posted successfully! Your job will now appear on the student home page.');
      router.push('/employer-home');
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const jobTypes = ['Full-time', 'Part-time', 'Daily Labor', 'Contract', 'Temporary'];
  const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Any'];
  const educationLevels = ['Any', 'High School', 'Bachelor\'s', 'Master\'s', 'No Education Required'];
  const shiftTypes = ['Day', 'Night', 'Rotating', 'Flexible'];
  const workHourOptions = ['8 hours/day', '6 hours/day', '4 hours/day', 'Flexible', 'As needed'];

  const commonRequirements = [
    'Manual Labor',
    'Physical Stamina', 
    'Team Work',
    'Reliability',
    'Punctuality',
    'Communication Skills',
    'Basic Computer Skills',
    'Customer Service',
    'Attention to Detail',
    'Safety Awareness'
  ];

  const commonSkills = [
    'Team Collaboration',
    'Problem Solving',
    'Time Management',
    'Adaptability',
    'Physical Fitness',
    'Communication',
    'Organization',
    'Quality Control'
  ];

  const addRequirement = (req: string) => {
    const currentReqs = formData.requirements.split(',').map(r => r.trim()).filter(r => r);
    if (!currentReqs.includes(req)) {
      setFormData(prev => ({
        ...prev,
        requirements: [...currentReqs, req].join(', ')
      }));
    }
  };

  const addSkill = (skill: string) => {
    const currentSkills = formData.skills.split(',').map(s => s.trim()).filter(s => s);
    if (!currentSkills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...currentSkills, skill].join(', ')
      }));
    }
  };

  const fillTestData = () => {
    const testJobs = [
      {
        title: 'Warehouse Worker',
        company: 'LogiTech Solutions',
        location: 'Hyderabad, Telangana',
        salary: '₹18,000/month',
        description: 'Looking for hardworking individuals to join our warehouse team. Responsibilities include package sorting, inventory management, and maintaining warehouse cleanliness. No prior experience required - we provide full training.',
        requirements: 'Physical fitness, Team work, Reliability, Punctuality',
        skills: 'Team Collaboration, Time Management, Physical Fitness',
        benefits: 'Health insurance, Transportation allowance, Overtime pay, Free lunch',
        contactEmail: 'hr@logitech-solutions.com',
        contactPhone: '+91 98765 43210',
        workHours: '8 hours/day',
        type: 'Full-time',
        experience: 'Entry Level',
        education: 'High School'
      },
      {
        title: 'Delivery Executive',
        company: 'QuickServe Delivery',
        location: 'Bangalore, Karnataka', 
        salary: '₹500/day',
        description: 'Join our delivery team and earn daily wages! Deliver packages across the city using our company vehicles. Flexible timing and good incentives for performance.',
        requirements: 'Valid driving license, Physical stamina, Customer service skills',
        skills: 'Navigation, Communication, Problem Solving',
        benefits: 'Daily payment, Fuel allowance, Performance bonus, Flexible hours',
        contactEmail: 'jobs@quickserve.in',
        contactPhone: '+91 87654 32109',
        workHours: 'Flexible',
        type: 'Part-time',
        experience: 'Entry Level',
        education: 'Any'
      },
      {
        title: 'Restaurant Helper',
        company: 'Spice Garden Restaurant',
        location: 'Mumbai, Maharashtra',
        salary: '₹400/day',
        description: 'Assist kitchen staff with food preparation, cleaning, and customer service. Great opportunity for students to earn while learning hospitality skills.',
        requirements: 'Food safety awareness, Team work, Cleanliness, Reliability',
        skills: 'Customer Service, Organization, Adaptability',
        benefits: 'Free meals, Flexible timing, Tips from customers, Weekend bonuses',
        contactEmail: 'careers@spicegarden.com',
        contactPhone: '+91 76543 21098',
        workHours: '6 hours/day',
        type: 'Part-time',
        experience: 'Entry Level',
        education: 'No Education Required'
      }
    ];

    const randomJob = testJobs[Math.floor(Math.random() * testJobs.length)];
    
    console.log('🧪 Filling test data:', randomJob);
    
    setFormData(prev => {
      const newData = {
        ...prev,
        title: randomJob.title,
        company: randomJob.company,
        location: randomJob.location,
        salary: randomJob.salary,
        description: randomJob.description,
        requirements: randomJob.requirements,
        type: randomJob.type,
        experience: randomJob.experience,
        education: randomJob.education,
        skills: randomJob.skills,
        benefits: randomJob.benefits,
        contactEmail: randomJob.contactEmail,
        contactPhone: randomJob.contactPhone,
        workHours: randomJob.workHours,
        shiftType: 'Day',
        immediateStart: Math.random() > 0.5
      };
      
      console.log('🧪 New form data:', newData);
      return newData;
    });
  };

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
          <button 
            onClick={fillTestData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Star className="w-4 h-4" />
            Fill Test Data
          </button>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold text-gray-900">Post New Job</h2>
          <p className="text-sm text-gray-600">Create a job posting for non-IT and daily labor positions</p>
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
            <h1 className="text-2xl font-bold">Post a New Job</h1>
            <p className="text-orange-100">Fill out the form below to create your job posting for non-IT and daily labor positions</p>
          </div>
        </div>
      </motion.div>

      {/* Job Posting Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-orange-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Warehouse Worker, Housekeeping Staff, Delivery Driver"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Logistics Solutions, CleanPro Services"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
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
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., ₹15,000/month, ₹500/day, ₹200/hour"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Job Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education Required
                </label>
                <select
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {educationLevels.map(edu => (
                    <option key={edu} value={edu}>{edu}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Work Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Hours
                </label>
                <select
                  name="workHours"
                  value={formData.workHours}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select work hours</option>
                  {workHourOptions.map(hours => (
                    <option key={hours} value={hours}>{hours}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift Type
                </label>
                <select
                  name="shiftType"
                  value={formData.shiftType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {shiftTypes.map(shift => (
                    <option key={shift} value={shift}>{shift}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="immediateStart"
                  checked={formData.immediateStart}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Immediate start available
                </label>
              </div>
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
                placeholder="Describe the role, responsibilities, work environment, and what makes this position suitable for students..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Requirements & Skills */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Requirements & Skills
            </h3>
            
            {/* Quick Add Requirements */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Add Common Requirements
              </label>
              <div className="flex flex-wrap gap-2">
                {commonRequirements.map((req) => (
                  <button
                    key={req}
                    type="button"
                    onClick={() => addRequirement(req)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-orange-100 hover:text-orange-700 transition-colors"
                  >
                    + {req}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements *
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="e.g., Manual Labor, Team Work, Physical Stamina (comma-separated)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Separate requirements with commas</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills (Optional)
                </label>
                <textarea
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="e.g., Team collaboration, Problem solving, Communication (comma-separated)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
              </div>
            </div>

            {/* Quick Add Skills */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Add Common Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {commonSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => addSkill(skill)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benefits & Perks (Optional)
            </label>
            <textarea
              name="benefits"
              value={formData.benefits}
              onChange={handleInputChange}
              rows={3}
              placeholder="e.g., Flexible hours, Transportation allowance, Meal provided, Overtime pay, Health benefits..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  required
                  placeholder="hr@company.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
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
    </div>
  );
};

export default PostJobPage;
