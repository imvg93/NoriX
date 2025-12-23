"use client";

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { KYCFormData } from '../../../types/kyc';

interface ReviewScreenProps {
  formData: KYCFormData;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  error: string | null;
  submitting: boolean;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  formData,
  onBack,
  onSubmit,
  error,
  submitting
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async () => {
    if (!agreedToTerms) return;
    await onSubmit();
  };

  const getProofLabel = () => {
    if (formData.studentProofType === 'college_id') return 'College ID Card';
    if (formData.studentProofType === 'bonafide') return 'Bonafide Certificate';
    if (formData.studentProofType === 'fee_receipt') return 'Fee Receipt';
    return 'Not selected';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Submit</h2>
      
      <div className="space-y-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <p className="font-medium text-gray-900">{formData.fullName}</p>
            </div>
            <div>
              <span className="text-gray-600">City:</span>
              <p className="font-medium text-gray-900">{formData.city}</p>
            </div>
            <div>
              <span className="text-gray-600">ID Type:</span>
              <p className="font-medium text-gray-900 capitalize">{formData.idType || 'Not selected'}</p>
            </div>
            <div>
              <span className="text-gray-600">Student Proof:</span>
              <p className="font-medium text-gray-900">{getProofLabel()}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Skills:</span>
              <p className="font-medium text-gray-900">{formData.primarySkillCategory || 'Not selected'}</p>
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-5 h-5 text-[#2A8A8C] mt-0.5"
          />
          <span className="text-sm text-gray-700">
            I confirm that the information provided is correct and I agree to Norix verification and payment policies.
          </span>
        </label>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!agreedToTerms || submitting}
          className="px-6 py-2.5 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit for Verification
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};


