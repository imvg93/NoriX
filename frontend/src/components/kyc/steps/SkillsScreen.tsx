"use client";

import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { KYCFormData, WORK_TYPES, SKILL_CATEGORIES, LANGUAGES, AVAILABILITY_DAYS } from '../../../types/kyc';

interface SkillsScreenProps {
  formData: KYCFormData;
  onUpdate: (field: keyof KYCFormData, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SkillsScreen: React.FC<SkillsScreenProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack
}) => {
  const canProceed = !!(
    formData.workTypes.length > 0 && 
    formData.primarySkillCategory && 
    formData.availabilityDays.length > 0
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills & Work Intent</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Work Type (Select max 2) <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {WORK_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.workTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (formData.workTypes.length < 2) {
                        onUpdate('workTypes', [...formData.workTypes, type]);
                      }
                    } else {
                      onUpdate('workTypes', formData.workTypes.filter(t => t !== type));
                    }
                  }}
                  disabled={!formData.workTypes.includes(type) && formData.workTypes.length >= 2}
                  className="w-4 h-4 text-[#2A8A8C]"
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Skill Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.primarySkillCategory}
            onChange={(e) => onUpdate('primarySkillCategory', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8C] focus:border-[#2A8A8C]"
          >
            <option value="">Select skill category</option>
            {SKILL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Languages Known (Multi-select)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <label key={lang} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.languages.includes(lang)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onUpdate('languages', [...formData.languages, lang]);
                    } else {
                      onUpdate('languages', formData.languages.filter(l => l !== lang));
                    }
                  }}
                  className="w-4 h-4 text-[#2A8A8C]"
                />
                <span className="text-sm">{lang}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Availability <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2 mb-4">
            {AVAILABILITY_DAYS.map((day) => (
              <label key={day} className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.availabilityDays.includes(day)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onUpdate('availabilityDays', [...formData.availabilityDays, day]);
                    } else {
                      onUpdate('availabilityDays', formData.availabilityDays.filter(d => d !== day));
                    }
                  }}
                  className="w-4 h-4 text-[#2A8A8C]"
                />
                <span>{day}</span>
              </label>
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hours per day: {formData.hoursPerDay} hours
            </label>
            <input
              type="range"
              min="2"
              max="8"
              value={formData.hoursPerDay}
              onChange={(e) => onUpdate('hoursPerDay', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>2 hrs</span>
              <span>8 hrs</span>
            </div>
          </div>
        </div>
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
          Save & Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


