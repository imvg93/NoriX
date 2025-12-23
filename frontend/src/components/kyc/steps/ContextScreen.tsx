"use client";

import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';

interface ContextScreenProps {
  onNext: () => void;
}

export const ContextScreen: React.FC<ContextScreenProps> = ({ onNext }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
      <div className="mb-8">
        <div className="mx-auto w-20 h-20 bg-[#2A8A8C]/10 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-[#2A8A8C]" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Verify your profile to start earning
        </h1>
        <div className="space-y-2 text-gray-600 text-lg">
          <p>Takes 5–7 minutes.</p>
          <p>Your data is secure and only used for trust & payments.</p>
        </div>
      </div>
      
      <button
        onClick={onNext}
        className="w-full sm:w-auto px-8 py-4 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-colors font-semibold text-lg flex items-center justify-center gap-2 mx-auto"
      >
        Start Verification
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};


