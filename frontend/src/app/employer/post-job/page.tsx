"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  ArrowRight,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  Send,
  CheckCircle,
  Shield,
  X,
  Clock,
  Upload,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Zap
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const ACCENT = "#2A8A8D";

const PostJobPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [kycOK, setKycOK] = useState<boolean>(false);
  const [kycStatus, setKycStatus] = useState<'approved' | 'pending' | 'rejected' | 'not-submitted' | 'suspended'>('pending');
  const [kycMessage, setKycMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    jobTitle: '',
    jobCategory: '',
    workType: 'On-site',
    location: '',
    taskSummary: '',
    skillsRequired: [] as string[],
    expectedDuration: '',
    durationUnit: 'hours',
    submissionType: 'file',
    roleSpecificEligibility: '',
    reason: '',
    allowedApplicantCategory: '',
    paymentType: 'Fixed',
    amount: '',
    urgencyMode: 'scheduled' as 'instant' | 'scheduled', // Job urgency mode
    startTime: '', // For instant jobs
    duration: '' // For instant jobs
  });

  const jobCategories = [
    'Technology',
    'Marketing',
    'Sales',
    'Customer Service',
    'Content Writing',
    'Graphic Design',
    'Data Entry',
    'Teaching',
    'Research',
    'Warehouse',
    'Delivery',
    'Retail',
    'Hospitality',
    'Other'
  ];

  const normalizeStatus = (status?: string | null): 'approved' | 'pending' | 'rejected' | 'not-submitted' | 'suspended' => {
    if (!status) return 'not-submitted';
    const normalized = status.replace(/_/g, '-').toLowerCase();
    if (normalized === 'approved' || normalized === 'pending' || normalized === 'rejected' || normalized === 'not-submitted' || normalized === 'suspended') {
      return normalized as 'approved' | 'pending' | 'rejected' | 'not-submitted' | 'suspended';
    }
    return 'not-submitted';
  };

  // Check employer KYC status
  useEffect(() => {
    const checkKYC = async () => {
      if (!user?._id) return;
      try {
        const res = await apiService.getEmployerKYCStatus(user._id);
        const normalized = normalizeStatus(res?.status || res?.user?.kycStatus);
        setKycStatus(normalized);
        setKycOK(normalized === 'approved');
        switch (normalized) {
          case 'approved':
            setKycMessage('Your KYC is approved. You can post new jobs.');
            break;
          case 'pending':
            setKycMessage('Your KYC is pending approval. You can post jobs once it is approved.');
            break;
          case 'rejected':
            setKycMessage(res?.kyc?.rejectionReason
              ? `Your KYC was rejected. Reason: ${res.kyc.rejectionReason}`
              : 'Your KYC was rejected. Please resubmit the required details.');
            break;
          case 'suspended':
            setKycMessage('Your KYC has been suspended. Please contact support for assistance.');
            break;
          default:
            setKycMessage('Please complete your KYC verification before posting jobs.');
        }
      } catch (e) {
        console.error('❌ Unable to load employer KYC status:', e);
        setKycOK(false);
        setKycStatus('not-submitted');
        setKycMessage('Please complete your KYC verification before posting jobs.');
      }
    };
    checkKYC();
  }, [user?._id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill).slice(0, 5);
    setFormData(prev => ({
      ...prev,
      skillsRequired: skills
    }));
  };

  const addSkillTag = (skill: string) => {
    if (formData.skillsRequired.length < 5 && !formData.skillsRequired.includes(skill)) {
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
      // Map to backend format
      const jobData: any = {
        jobTitle: formData.jobTitle,
        jobCategory: formData.jobCategory,
        description: formData.taskSummary,
        location: formData.workType !== 'Remote' ? formData.location : 'Remote',
        salaryRange: `${formData.paymentType === 'Fixed' ? '₹' : formData.paymentType === 'Hourly' ? '₹/hour' : '₹/month'} ${formData.amount}`,
        workType: formData.workType,
        skillsRequired: formData.skillsRequired,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        genderPreference: formData.allowedApplicantCategory || 'any',
        urgencyMode: formData.urgencyMode
      };

      // Add instant job specific fields
      if (formData.urgencyMode === 'instant') {
        if (!formData.startTime || !formData.duration) {
          alert('Please fill in start time and duration for instant jobs');
          setLoading(false);
          return;
        }
        jobData.startTime = new Date(formData.startTime).toISOString();
        jobData.duration = parseFloat(formData.duration);
        jobData.durationUnit = 'hours';
      }

      if (!kycOK) {
        alert('Complete and get your KYC approved before posting jobs');
        setLoading(false);
        return;
      }
      await apiService.createJob(jobData);
      
      alert('Job posted successfully!');
      
      // Trigger refresh event for employer stats
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('employer-stats-refresh'));
      }
      
      router.push('/employer');
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
    'Customer Service'
  ];

  const steps = [
    { number: 1, title: 'Job Basics', icon: FileText },
    { number: 2, title: 'Requirements', icon: Briefcase },
    { number: 3, title: 'Payment', icon: DollarSign }
  ];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.jobTitle.trim() !== '' && 
               formData.jobCategory !== '' && 
               formData.taskSummary.trim() !== '' &&
               (formData.workType === 'Remote' || formData.location.trim() !== '');
      case 2:
        return true; // Requirements are optional
      case 3:
        return formData.amount.trim() !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isFormValid = () => {
    return (
      formData.jobTitle.trim() !== '' &&
      formData.jobCategory !== '' &&
      formData.taskSummary.trim() !== '' &&
      (formData.workType === 'Remote' || formData.location.trim() !== '') &&
      formData.amount.trim() !== '' &&
      kycOK
    );
  };

  if (!kycOK) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8" style={{ color: ACCENT }} />
            <h1 className="text-2xl font-bold text-gray-900">KYC Verification Required</h1>
          </div>
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
            <p className="text-gray-700 mb-6">{kycMessage}</p>
            <div className="flex flex-col gap-3">
              {(kycStatus === 'rejected' || kycStatus === 'not-submitted') && (
                <Link
                  href="/employer/kyc"
                  className="inline-flex items-center justify-center px-6 py-3 text-white font-semibold transition-all duration-300"
                  style={{ backgroundColor: ACCENT }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#238085'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ACCENT}
                >
                  {kycStatus === 'rejected' ? 'Resubmit KYC' : 'Complete KYC'}
                </Link>
              )}
              {kycStatus === 'pending' && (
                <Link
                  href="/employer/kyc"
                  className="inline-flex items-center justify-center px-6 py-3 border-2 font-semibold transition-all duration-300"
                  style={{ color: ACCENT, borderColor: ACCENT }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F0F9FA';
                    e.currentTarget.style.borderColor = '#238085';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = ACCENT;
                  }}
                >
                  View KYC Status
                </Link>
              )}
              <Link
                href="/employer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/employer"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: ACCENT }}>
            Post a Corporate Job
          </h1>
        </motion.div>

        {/* KYC Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 p-3 rounded-lg mb-6 flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800">KYC Approved - Ready to post jobs</p>
        </motion.div>

        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              const isClickable = currentStep > step.number;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => isClickable && setCurrentStep(step.number)}
                      disabled={!isClickable}
                      className={`relative flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all duration-300 ${
                        isActive
                          ? 'bg-white border-2 scale-110'
                          : isCompleted
                          ? 'bg-white border-2'
                          : 'bg-gray-100 border-2 border-gray-200'
                      } ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}`}
                      style={{
                        borderColor: isActive || isCompleted ? ACCENT : undefined,
                        color: isActive || isCompleted ? ACCENT : '#9CA3AF'
                      }}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" style={{ color: ACCENT }} />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </button>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        isActive ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-0.5 transition-colors duration-300 ${
                        isCompleted ? 'bg-gray-300' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form - Sliding Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <form onSubmit={handleSubmit}>
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait">
                {/* STEP 1: Job Basics */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-gray-200 p-6 rounded-lg"
                  >
                    <h2 className="text-base font-bold text-gray-900 mb-4" style={{ color: ACCENT }}>
                      STEP 1: Job Basics
                    </h2>
              
              {/* Row 1: Title & Category */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Data Entry Specialist"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Category *
                  </label>
                  <select
                    name="jobCategory"
                    value={formData.jobCategory}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Select category</option>
                    {jobCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Job Urgency Mode Selector */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  ⏱ Job Urgency
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  How fast do you need the worker?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.urgencyMode === 'instant' 
                      ? 'border-[#2A8A8D] bg-[#2A8A8D]/5' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="urgencyMode"
                      value="instant"
                      checked={formData.urgencyMode === 'instant'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-[#2A8A8D]" />
                        <span className="font-semibold text-sm text-gray-900">⏱ Instant</span>
                      </div>
                      <p className="text-xs text-gray-600">Available now</p>
                    </div>
                    {formData.urgencyMode === 'instant' && (
                      <CheckCircle className="w-5 h-5 text-[#2A8A8D]" />
                    )}
                  </label>
                  <label className={`relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.urgencyMode === 'scheduled' 
                      ? 'border-[#2A8A8D] bg-[#2A8A8D]/5' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="urgencyMode"
                      value="scheduled"
                      checked={formData.urgencyMode === 'scheduled'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-sm text-gray-900">📅 Scheduled</span>
                      </div>
                      <p className="text-xs text-gray-600">Normal hiring</p>
                    </div>
                    {formData.urgencyMode === 'scheduled' && (
                      <CheckCircle className="w-5 h-5 text-[#2A8A8D]" />
                    )}
                  </label>
                </div>
                {formData.urgencyMode === 'instant' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">
                      ⚠️ Instant jobs are sent to available students nearby. If no one accepts, you can retry, increase pay, or schedule.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Time *
                        </label>
                        <input
                          type="datetime-local"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          min={new Date().toISOString().slice(0, 16)}
                          required={formData.urgencyMode === 'instant'}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Duration (hours) *
                        </label>
                        <input
                          type="number"
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          min="0.5"
                          max="8"
                          step="0.5"
                          required={formData.urgencyMode === 'instant'}
                          placeholder="e.g., 4"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: Work Type & Location */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Work Type *
                  </label>
                  <select
                    name="workType"
                    value={formData.workType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all bg-white"
                  >
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                {formData.workType !== 'Remote' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required={formData.workType !== 'Remote'}
                      placeholder="e.g., Hyderabad"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Task Summary */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Task Summary * <span className="text-gray-500 font-normal text-xs">(300 chars max)</span>
                </label>
                <textarea
                  name="taskSummary"
                  value={formData.taskSummary}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  maxLength={300}
                  placeholder="Brief description of the task..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{formData.taskSummary.length}/300</p>
              </div>
                  </motion.div>
                )}

                {/* STEP 2: Requirements & Rules */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-gray-200 p-6 rounded-lg"
                  >
                    <h2 className="text-base font-bold text-gray-900 mb-4" style={{ color: ACCENT }}>
                      STEP 2: Requirements & Rules
                    </h2>
              
              {/* Skills */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Skill Tags <span className="text-gray-500 font-normal text-xs">(max 5)</span>
                </label>
                <input
                  type="text"
                  value={formData.skillsRequired.join(', ')}
                  onChange={handleSkillsChange}
                  placeholder="e.g., Excel, Communication"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all mb-2"
                />
                {formData.skillsRequired.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skillsRequired.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-lg"
                        style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkillTag(skill)}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Duration & Submission */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Expected Duration
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="expectedDuration"
                      value={formData.expectedDuration}
                      onChange={handleInputChange}
                      placeholder="e.g., 8"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all"
                    />
                    <select
                      name="durationUnit"
                      value={formData.durationUnit}
                      onChange={handleInputChange}
                      className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all bg-white"
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="ongoing">Ongoing</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Submission Type
                  </label>
                  <select
                    name="submissionType"
                    value={formData.submissionType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all bg-white"
                  >
                    <option value="file">File</option>
                    <option value="link">Link</option>
                    <option value="platform">Platform</option>
                  </select>
                </div>
              </div>

              {/* Advanced Section (Collapsed) */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Advanced (optional)
                </button>
                
                {showAdvanced && (
                  <div className="mt-4 space-y-4 pl-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Role-specific Eligibility
                      </label>
                      <input
                        type="text"
                        name="roleSpecificEligibility"
                        value={formData.roleSpecificEligibility}
                        onChange={handleInputChange}
                        placeholder="e.g., Must have valid driver's license"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Reason (safety / physical / facility)
                      </label>
                      <input
                        type="text"
                        name="reason"
                        value={formData.reason}
                        onChange={handleInputChange}
                        placeholder="e.g., Physical work required"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Allowed Applicant Category
                      </label>
                      <select
                        name="allowedApplicantCategory"
                        value={formData.allowedApplicantCategory}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all bg-white"
                      >
                        <option value="">Any</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
                  </motion.div>
                )}

                {/* STEP 3: Payment & Approval */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-gray-200 p-6 rounded-lg"
                  >
                    <h2 className="text-base font-bold text-gray-900 mb-4" style={{ color: ACCENT }}>
                      STEP 3: Payment & Approval
                    </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Payment Type *
                  </label>
                  <select
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all bg-white"
                  >
                    <option value="Fixed">Fixed</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Monthly">Monthly (corporate only)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Amount *
                  </label>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 15000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8D] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Payment is secured and released only after your approval
                </p>
              </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm border-2 font-semibold transition-all duration-300"
                    style={{ color: ACCENT, borderColor: ACCENT }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F0F9FA';
                      e.currentTarget.style.borderColor = '#238085';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = ACCENT;
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>
                )}
                <Link
                  href="/employer"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </Link>
              </div>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: ACCENT }}
                  onMouseEnter={(e) => {
                    if (validateStep(currentStep)) {
                      e.currentTarget.style.backgroundColor = '#238085';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (validateStep(currentStep)) {
                      e.currentTarget.style.backgroundColor = ACCENT;
                    }
                  }}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: ACCENT }}
                  onMouseEnter={(e) => {
                    if (!loading && isFormValid()) {
                      e.currentTarget.style.backgroundColor = '#238085';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && isFormValid()) {
                      e.currentTarget.style.backgroundColor = ACCENT;
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Post Job
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default PostJobPage;
