"use client";

import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { KYCFormData } from '../../../types/kyc';
import { ImageUpload } from '../ImageUpload';

interface GovernmentIDScreenProps {
  formData: KYCFormData;
  onUpdate: (field: keyof KYCFormData, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const GovernmentIDScreen: React.FC<GovernmentIDScreenProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack
}) => {
  const canProceed = !!(formData.idType && formData.idFrontUrl);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload a government ID</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select ID Type <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="idType"
                value="aadhaar"
                checked={formData.idType === 'aadhaar'}
                onChange={(e) => onUpdate('idType', e.target.value)}
                className="w-4 h-4 text-[#2A8A8C]"
              />
              <span className="font-medium">Aadhaar Card</span>
            </label>
            <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="idType"
                value="pan"
                checked={formData.idType === 'pan'}
                onChange={(e) => onUpdate('idType', e.target.value)}
                className="w-4 h-4 text-[#2A8A8C]"
              />
              <span className="font-medium">PAN Card</span>
            </label>
          </div>
        </div>

        {formData.idType && (
          <ImageUpload
            label={`Upload ${formData.idType === 'aadhaar' ? 'Aadhaar' : 'PAN'} Card (Front)`}
            currentUrl={formData.idFrontUrl}
            onUpload={(url) => onUpdate('idFrontUrl', url)}
            onDelete={() => onUpdate('idFrontUrl', '')}
            helperText="Masked IDs are allowed. Make sure name is visible."
            documentType={formData.idType}
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
          Upload & Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


