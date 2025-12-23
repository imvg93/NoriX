"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, DollarSign, Clock, CheckCircle, XCircle, Zap, Navigation2 } from 'lucide-react';
import { apiService } from '../services/api';

interface InstantJobPingProps {
  job: {
    _id: string;
    jobTitle: string;
    distance: number;
    pay: string;
    duration: number;
    companyName?: string;
    location?: string;
  };
  onAccept: () => void;
  onSkip: () => void;
  onClose: () => void;
}

const InstantJobPing: React.FC<InstantJobPingProps> = ({ job, onAccept, onSkip, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds countdown
  const [accepting, setAccepting] = useState(false);
  const [skipping, setSkipping] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      // Auto-skip when timer expires
      handleSkip();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAccept = async () => {
    if (accepting || skipping) return;
    
    setAccepting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again');
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/instant-jobs/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId: job._id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept job');
      }

      onAccept();
    } catch (error: any) {
      console.error('Error accepting job:', error);
      alert(error.message || 'Failed to accept job. It may have been taken.');
      onClose();
    } finally {
      setAccepting(false);
    }
  };

  const handleSkip = async () => {
    if (accepting || skipping) return;
    setSkipping(true);
    onSkip();
    setTimeout(() => {
      setSkipping(false);
    }, 300);
  };

  const progress = (timeLeft / 30) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md"
        style={{ zIndex: 99999 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
        >
          {/* Elegant Header */}
          <div className="relative bg-gradient-to-r from-[#2A8A8C] via-[#238085] to-[#2A8A8C] p-6">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }} />
            </div>
            
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <Zap className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Instant Job Alert</h3>
                  <p className="text-xs text-white/80">Urgent opportunity nearby</p>
                </div>
              </div>
              
              {/* Circular Countdown Timer */}
              <div className="relative w-16 h-16">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="white"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{timeLeft}</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          </div>

          {/* Job Details - Clean & Spacious */}
          <div className="p-8">
            {/* Job Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
              {job.jobTitle}
            </h2>
            
            {job.companyName && (
              <p className="text-gray-500 text-sm mb-6">{job.companyName}</p>
            )}

            {/* Key Metrics - Clean Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Distance */}
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <div className="w-10 h-10 bg-[#2A8A8C]/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Navigation2 className="w-5 h-5 text-[#2A8A8C]" />
                </div>
                <div className="text-xs text-gray-500 mb-1">Distance</div>
                <div className="text-lg font-bold text-gray-900">{job.distance} km</div>
              </div>

              {/* Pay - Highlighted */}
              <div className="bg-gradient-to-br from-[#2A8A8C]/10 to-[#238085]/10 rounded-xl p-4 text-center border-2 border-[#2A8A8C]/20">
                <div className="w-10 h-10 bg-[#2A8A8C]/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-5 h-5 text-[#2A8A8C]" />
                </div>
                <div className="text-xs text-gray-600 mb-1">Pay</div>
                <div className="text-xl font-bold text-[#2A8A8C]">{job.pay}</div>
              </div>

              {/* Duration */}
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <div className="w-10 h-10 bg-[#2A8A8C]/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-[#2A8A8C]" />
                </div>
                <div className="text-xs text-gray-500 mb-1">Duration</div>
                <div className="text-lg font-bold text-gray-900">{job.duration}h</div>
              </div>
            </div>

            {/* Location */}
            {job.location && (
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-6 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-[#2A8A8C] flex-shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            )}

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6">
              <p className="text-xs text-blue-800 text-center">
                ⚡ Respond quickly to secure this opportunity
              </p>
            </div>
          </div>

          {/* Action Buttons - Clean & Modern */}
          <div className="px-8 pb-8 grid grid-cols-2 gap-4">
            <button
              onClick={handleSkip}
              disabled={accepting || skipping}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            >
              <XCircle className="w-5 h-5" />
              Skip
            </button>
            <button
              onClick={handleAccept}
              disabled={accepting || skipping}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#2A8A8C] to-[#238085] hover:from-[#238085] hover:to-[#1d6d71] text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#2A8A8C]/30"
            >
              {accepting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Accept Now
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstantJobPing;
