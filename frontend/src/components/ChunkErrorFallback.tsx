"use client";

import React, { useState, useEffect } from 'react';

interface ChunkErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
}

const ChunkErrorFallback: React.FC<ChunkErrorFallbackProps> = ({ 
  error, 
  onRetry 
}) => {
  const [countdown, setCountdown] = useState(10); // Increased to 10 seconds
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!(token && user));

    // Only auto-reload if user is logged in and after a longer delay
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          
          // Only auto-reload if user is logged in
          if (isLoggedIn) {
            console.log('🔐 User is logged in, auto-reloading while preserving authentication...');
            window.location.reload();
          } else {
            console.log('⚠️ User not logged in, skipping auto-reload to prevent logout');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoggedIn]);

  const handleManualRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Preserve authentication during manual reload
      console.log('🔄 Manual reload while preserving authentication...');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Loading Application...
        </h2>
        
        <p className="text-gray-600 mb-6">
          We're reloading the application to fix a loading issue. This will only take a moment.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            {isLoggedIn ? (
              <>Auto-reloading in {countdown} seconds to fix the issue...</>
            ) : (
              <>Manual reload recommended. You'll stay logged in.</>
            )}
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleManualRetry}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Reload Now
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go to Home
          </button>
        </div>
        
        {error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Technical Details
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default ChunkErrorFallback;
