"use client";

import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { KYCFormData } from '../../../types/kyc';
import { ImageUpload } from '../ImageUpload';

interface StudentProofScreenProps {
  formData: KYCFormData;
  onUpdate: (field: keyof KYCFormData, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StudentProofScreen: React.FC<StudentProofScreenProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack
}) => {
  const canProceed = !!(formData.studentProofType && formData.studentProofUrl);

  const getProofLabel = () => {
    if (formData.studentProofType === 'college_id') return 'College ID Card';
    if (formData.studentProofType === 'bonafide') return 'Bonafide Certificate';
    if (formData.studentProofType === 'fee_receipt') return 'Fee Receipt';
    return '';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your student status</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Proof Type <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="studentProofType"
                value="college_id"
                checked={formData.studentProofType === 'college_id'}
                onChange={(e) => onUpdate('studentProofType', e.target.value)}
                className="w-4 h-4 text-[#2A8A8C]"
              />
              <span className="font-medium">College ID Card</span>
            </label>
            <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="studentProofType"
                value="bonafide"
                checked={formData.studentProofType === 'bonafide'}
                onChange={(e) => onUpdate('studentProofType', e.target.value)}
                className="w-4 h-4 text-[#2A8A8C]"
              />
              <span className="font-medium">Bonafide Certificate</span>
            </label>
            <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="studentProofType"
                value="fee_receipt"
                checked={formData.studentProofType === 'fee_receipt'}
                onChange={(e) => onUpdate('studentProofType', e.target.value)}
                className="w-4 h-4 text-[#2A8A8C]"
              />
              <span className="font-medium">Fee Receipt</span>
            </label>
          </div>
        </div>

        {formData.studentProofType && (
          <ImageUpload
            label={`Upload ${getProofLabel()}`}
            currentUrl={formData.studentProofUrl}
            onUpload={(url) => onUpdate('studentProofUrl', url)}
            onDelete={() => onUpdate('studentProofUrl', '')}
            accept="image/*,application/pdf"
            helperText="You may blur sensitive details."
            documentType={formData.studentProofType}
          />
        )}
      </div>

      <div className="flex justify-between mt-8">
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
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2.5 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


