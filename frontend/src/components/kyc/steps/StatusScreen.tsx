"use client";

import React from 'react';
import { Clock, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const StatusScreen: React.FC = () => {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
      <div className="mb-8">
        <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification in progress</h2>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <span className="text-2xl">🟡</span>
            <div className="text-left">
              <p className="font-medium text-gray-900">Basic Verified</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="flex items-center justify-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <span className="text-2xl">🟢</span>
            <div className="text-left">
              <p className="font-medium text-gray-900">Student Verified</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-2xl">🔵</span>
            <div className="text-left">
              <p className="font-medium text-gray-900">Payment Ready</p>
              <p className="text-sm text-gray-600">Locked</p>
            </div>
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Verification usually takes 24–48 hours.
        </p>

        <button
          onClick={() => router.push('/student/dashboard')}
          className="w-full sm:w-auto px-8 py-3 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-colors font-semibold"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};


