"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../services/api';
import { KYCFormData } from '../../types/kyc';
import { ContextScreen } from './steps/ContextScreen';
import { BasicIdentityScreen } from './steps/BasicIdentityScreen';
import { GovernmentIDScreen } from './steps/GovernmentIDScreen';
import { SelfieScreen } from './steps/SelfieScreen';
import { StudentProofScreen } from './steps/StudentProofScreen';
import { SkillsScreen } from './steps/SkillsScreen';
import { ReviewScreen } from './steps/ReviewScreen';
import { StatusScreen } from './steps/StatusScreen';

const initialFormData: KYCFormData = {
  fullName: '',
  dob: '',
  gender: '',
  city: '',
  state: '',
  idType: '',
  idFrontUrl: '',
  selfieUrl: '',
  studentProofType: '',
  studentProofUrl: '',
  workTypes: [],
  primarySkillCategory: '',
  languages: [],
  availabilityDays: [],
  hoursPerDay: 4
};

export default function MultiStepKYCForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<KYCFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const res = await apiService.get('/kyc/student/profile');
        const kyc = (res as any)?.data?.kyc || (res as any)?.kyc;
        if (kyc) {
          setFormData(prev => ({
            ...prev,
            fullName: kyc.fullName || '',
            dob: kyc.dob ? new Date(kyc.dob).toISOString().split('T')[0] : '',
            gender: kyc.gender || '',
            city: kyc.address?.split(',')[0] || '',
            state: kyc.address?.split(',')[1] || '',
            idFrontUrl: kyc.aadharCard || '',
            studentProofUrl: kyc.collegeIdCard || '',
            workTypes: kyc.preferredJobTypes || [],
            languages: [],
            availabilityDays: kyc.availableDays || [],
            hoursPerDay: kyc.hoursPerWeek ? Math.round(kyc.hoursPerWeek / 7) : 4
          }));
        }
      } catch (e) {
        // Ignore - user might not have submitted KYC yet
      }
    };
    loadExistingData();
  }, []);

  const updateFormData = (field: keyof KYCFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 0: return true;
      case 1: return !!(formData.fullName && formData.dob && formData.city && formData.state);
      case 2: return !!(formData.idType && formData.idFrontUrl);
      case 3: return !!formData.selfieUrl;
      case 4: return !!(formData.studentProofType && formData.studentProofUrl);
      case 5: return !!(formData.workTypes.length > 0 && formData.primarySkillCategory && formData.availabilityDays.length > 0);
      case 6: return true; // Review screen handles its own validation
      default: return false;
    }
  };

  const handleNext = () => {
    if (canProceed(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
      setError(null);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setError(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const userRes = await apiService.get('/users/profile');
      const user = (userRes as any)?.user || userRes;
      
      const kycPayload = {
        fullName: formData.fullName,
        dob: new Date(formData.dob),
        gender: formData.gender || undefined,
        phone: user.phone || '',
        email: user.email || '',
        address: `${formData.city}, ${formData.state}`,
        college: user.college || 'Not specified',
        courseYear: 'Not specified',
        stayType: 'home',
        hoursPerWeek: formData.hoursPerDay * 7,
        availableDays: formData.availabilityDays.map(d => {
          if (d === 'Weekdays') return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
          if (d === 'Weekends') return ['saturday', 'sunday'];
          return d.toLowerCase();
        }).flat(),
        aadharCard: formData.idType === 'aadhaar' ? formData.idFrontUrl : (formData.idType === 'pan' ? formData.idFrontUrl : ''),
        collegeIdCard: formData.studentProofType === 'college_id' ? formData.studentProofUrl : 
                      (formData.studentProofType === 'bonafide' ? formData.studentProofUrl :
                      (formData.studentProofType === 'fee_receipt' ? formData.studentProofUrl : '')),
        preferredJobTypes: formData.workTypes,
        experienceSkills: formData.primarySkillCategory + (formData.languages.length > 0 ? ` | Languages: ${formData.languages.join(', ')}` : ''),
        emergencyContact: {
          name: formData.fullName,
          phone: (user.phone && user.phone.length >= 6) ? user.phone : '0000000000' // Provide default if missing
        }
      };

      const res = await apiService.post('/kyc', kycPayload);
      
      if (res) {
        setCurrentStep(7);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (e: any) {
      console.error('KYC submission error:', e);
      setError(e?.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      {currentStep > 0 && currentStep < 7 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of 6
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((currentStep / 6) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-[#2A8A8C] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / 6) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="context"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ContextScreen onNext={handleNext} />
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <BasicIdentityScreen
                formData={formData}
                onUpdate={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
                error={error}
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="id"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GovernmentIDScreen
                formData={formData}
                onUpdate={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="selfie"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SelfieScreen
                formData={formData}
                onUpdate={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="student-proof"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <StudentProofScreen
                formData={formData}
                onUpdate={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SkillsScreen
                formData={formData}
                onUpdate={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {currentStep === 6 && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ReviewScreen
                formData={formData}
                onBack={handleBack}
                onSubmit={handleSubmit}
                error={error}
                submitting={submitting}
              />
            </motion.div>
          )}

          {currentStep === 7 && (
            <motion.div
              key="status"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <StatusScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

