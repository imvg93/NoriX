'use client';

import React, { useState } from 'react';
import { Building2, Store, User, X, AlertTriangle, ArrowRight } from 'lucide-react';

type EmployerCategory = 'corporate' | 'local_business' | 'individual';
type EmployerType = 'corporate' | 'local' | 'individual';

interface ChangeTypeModalProps {
  currentType: EmployerCategory;
  onConfirm: (newType: EmployerType) => void;
  onCancel: () => void;
  changing: boolean;
}

const typeOptions = [
  {
    id: 'corporate' as EmployerType,
    category: 'corporate' as EmployerCategory,
    icon: Building2,
    label: 'Corporate Employer',
    description: 'Big & Registered Companies',
    color: 'blue'
  },
  {
    id: 'local' as EmployerType,
    category: 'local_business' as EmployerCategory,
    icon: Store,
    label: 'Local Business',
    description: 'Shops, Small Businesses',
    color: 'purple'
  },
  {
    id: 'individual' as EmployerType,
    category: 'individual' as EmployerCategory,
    icon: User,
    label: 'Individual',
    description: 'Personal Tasks & Gigs',
    color: 'green'
  }
];

const categoryToTypeMap: Record<EmployerCategory, EmployerType> = {
  'corporate': 'corporate',
  'local_business': 'local',
  'individual': 'individual'
};

export default function ChangeTypeModal({ currentType, onConfirm, onCancel, changing }: ChangeTypeModalProps) {
  const [selectedType, setSelectedType] = useState<EmployerType | null>(null);

  const currentTypeValue = categoryToTypeMap[currentType];
  const availableOptions = typeOptions.filter(opt => opt.id !== currentTypeValue);

  const handleConfirm = () => {
    if (selectedType) {
      onConfirm(selectedType);
    }
  };

  const selectedOption = selectedType ? typeOptions.find(opt => opt.id === selectedType) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Change Employer Type</h3>
            <p className="text-sm text-gray-600 mt-1">Select your new employer type</p>
          </div>
          <button
            onClick={onCancel}
            disabled={changing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Warning */}
        <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900 mb-1">Important Notice</p>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>Your current KYC progress will be lost</li>
              <li>You'll need to complete KYC for the new type</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>
        </div>

        {/* Current Type */}
        <div className="mx-6 mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Current Type:</p>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              {typeOptions.find(opt => opt.id === currentTypeValue)?.label}
            </p>
          </div>
        </div>

        {/* New Type Selection */}
        <div className="mx-6 mt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Select New Type:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedType === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedType(option.id)}
                  disabled={changing}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? option.color === 'blue' 
                        ? 'border-blue-500 bg-blue-50'
                        : option.color === 'purple'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      option.color === 'blue' ? 'bg-blue-100' :
                      option.color === 'purple' ? 'bg-purple-100' :
                      'bg-green-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        option.color === 'blue' ? 'text-blue-600' :
                        option.color === 'purple' ? 'text-purple-600' :
                        'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{option.label}</h4>
                      <p className="text-xs text-gray-600">{option.description}</p>
                    </div>
                    {isSelected && (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        option.color === 'blue' ? 'bg-blue-500' :
                        option.color === 'purple' ? 'bg-purple-500' :
                        'bg-green-500'
                      }`}>
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Consequences */}
        {selectedOption && (
          <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Changing to: <span className="capitalize">{selectedOption.label}</span>
            </p>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• You'll be redirected to complete KYC for {selectedOption.label.toLowerCase()}</p>
              <p>• Your previous KYC data will be archived</p>
              <p>• You can start fresh with the new type's requirements</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={changing}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedType || changing}
            className={`px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {changing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Changing...
              </>
            ) : (
              <>
                Change to {selectedOption?.label}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

