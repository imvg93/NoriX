"use client";

import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { KYCFormData } from '../../../types/kyc';
import { SelfieCapture } from '../SelfieCapture';

interface SelfieScreenProps {
  formData: KYCFormData;
  onUpdate: (field: keyof KYCFormData, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SelfieScreen: React.FC<SelfieScreenProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack
}) => {
  const canProceed = !!formData.selfieUrl;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Take a quick selfie</h2>
      
      <SelfieCapture
        currentUrl={formData.selfieUrl}
        onCapture={(url) => onUpdate('selfieUrl', url)}
        onDelete={() => onUpdate('selfieUrl', '')}
      />

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
          Confirm Selfie
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


