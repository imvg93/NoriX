"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock,
  MapPin,
  DollarSign,
  User,
  Loader,
  ArrowLeft,
  AlertCircle,
  Phone,
  Navigation2,
  Copy,
  CheckCheck,
  FileText
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';

const ACCENT = "#2A8A8C";

const DispatchStatusPage = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  const { user } = useAuth();
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [locationUpdateCount, setLocationUpdateCount] = useState(0);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const [viewedAt, setViewedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!jobId) return;
    fetchJobStatus();
    const interval = setInterval(fetchJobStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [jobId]);

  // Mark as viewed when confirmed status appears
  useEffect(() => {
    if (jobStatus?.status === 'confirmed' && !hasBeenViewed && user?.userType === 'employer') {
      const markViewed = async () => {
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
          const token = localStorage.getItem('token');

          await fetch(`${API_BASE_URL}/instant-jobs/${jobId}/mark-viewed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              viewedBy: 'employer'
            })
          });

          setHasBeenViewed(true);
          setViewedAt(new Date());
        } catch (error) {
          console.error('Error marking as viewed:', error);
        }
      };

      markViewed();
    }
  }, [jobStatus?.status, jobId, hasBeenViewed, user]);

  // Fetch contact info when confirmed
  useEffect(() => {
    if (jobStatus?.status === 'confirmed') {
      fetchContactInfo();
      // Poll contact info every 30 seconds to get updated location
      const interval = setInterval(() => {
        fetchContactInfo();
        setLocationUpdateCount(prev => prev + 1);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [jobStatus?.status, jobId]);

  // Listen for Socket.IO confirmation event with contact info
  useEffect(() => {
    const socketService = require('../../../../../services/socketService').default;
    const socket = (socketService as any).socket;

    const handleStudentConfirmed = (data: any) => {
      console.log('✅ Student confirmed with contact info:', data);
      if (data.student) {
        setContactInfo({
          name: data.student.name,
          phone: data.student.phone,
          location: data.student.location
        });
      }
    };

    if (socket) {
      socket.on('instant-job-student-confirmed', handleStudentConfirmed);
      return () => {
        socket.off('instant-job-student-confirmed', handleStudentConfirmed);
      };
    }
  }, []);

  const fetchContactInfo = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/instant-jobs/${jobId}/contact-info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContactInfo(data.data.contact);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openMaps = (location: { latitude: number; longitude: number }) => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  const fetchJobStatus = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/instant-jobs/${jobId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJobStatus(data.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching job status:', error);
    }
  };

  const handleConfirm = async (confirm: boolean) => {
    setConfirming(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/instant-jobs/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId,
          confirm
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to confirm');
      }

      await fetchJobStatus();
    } catch (error: any) {
      alert(error.message || 'Failed to confirm');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-[#2A8A8C] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job status...</p>
        </div>
      </div>
    );
  }

  const status = jobStatus?.status || 'searching';
  const lockedStudent = jobStatus?.lockedBy;
  const acceptedStudent = jobStatus?.acceptedBy;
  const lockExpiresAt = jobStatus?.lockExpiresAt ? new Date(jobStatus.lockExpiresAt) : null;
  const currentWave = jobStatus?.currentWave || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/employer')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dispatch Status</h1>
          <p className="text-gray-600">Real-time updates on your instant job</p>
        </div>

        {/* Status Cards */}
        <AnimatePresence mode="wait">
          {(status === 'searching' || status === 'dispatching') && (
            <motion.div
              key="dispatching"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-12 text-center"
            >
              {/* Radar Animation */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <motion.div
                  className="absolute inset-0 border-4 border-[#2A8A8C] rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute inset-0 border-4 border-[#2A8A8C] rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 0, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-12 h-12 text-[#2A8A8C]" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Searching for Workers...</h2>
              <p className="text-gray-600 mb-4">
                Wave {currentWave} of 3 • Notifying available students nearby
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>This may take up to 2 minutes</span>
              </div>
            </motion.div>
          )}

          {status === 'locked' && lockedStudent && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-[#2A8A8C] p-8"
            >
              <div className="text-center mb-6">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-20 h-20 bg-[#2A8A8C] rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <User className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Worker Found!</h2>
                <p className="text-gray-600">Student accepted. Confirm within 90 seconds.</p>
              </div>

              {/* Student Info */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  {lockedStudent.profilePicture ? (
                    <img
                      src={lockedStudent.profilePicture}
                      alt={lockedStudent.name}
                      className="w-16 h-16 rounded-full border-2 border-[#2A8A8C]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#2A8A8C] flex items-center justify-center border-2 border-[#2A8A8C]">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{lockedStudent.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        {lockedStudent.rating || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {lockedStudent.completedJobs || 0} jobs completed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-[#2A8A8C]" />
                    <span className="truncate">{jobStatus?.location?.address || 'Location'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#2A8A8C]" />
                    <span className="font-semibold text-gray-900">{jobStatus?.pay || 'N/A'}</span>
                  </div>
                </div>

                {/* Countdown */}
                {lockExpiresAt && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <CountdownTimer targetTime={lockExpiresAt} />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleConfirm(false)}
                  disabled={confirming}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-gray-300"
                >
                  <XCircle className="w-5 h-5" />
                  Try Another
                </button>
                <button
                  onClick={() => handleConfirm(true)}
                  disabled={confirming}
                  className="px-6 py-3 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                >
                  {confirming ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirm Worker
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {status === 'confirmed' && acceptedStudent && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-[#2A8A8C] p-8"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle className="w-16 h-16 text-[#2A8A8C]" />
                  </motion.div>
                  {/* WhatsApp-like read receipt */}
                  {hasBeenViewed && (
                    <div className="flex items-center gap-1" title={`Viewed ${viewedAt ? `at ${viewedAt.toLocaleTimeString()}` : ''}`}>
                      <CheckCheck className="w-5 h-5 text-[#2A8A8C]" />
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Worker Confirmed!</h2>
                <p className="text-gray-600">{acceptedStudent.name} is assigned to this job.</p>
                {hasBeenViewed && viewedAt && (
                  <p className="text-gray-500 text-xs mt-1">
                    Viewed {viewedAt.toLocaleTimeString()}
                  </p>
                )}
              </div>

              {/* Contact Info Section */}
              {contactInfo && (
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#2A8A8C]" />
                      Contact Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Name:</span>
                        <span className="text-sm font-semibold text-gray-900">{contactInfo.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Phone:</span>
                        <div className="flex items-center gap-2">
                          <a 
                            href={`tel:${contactInfo.phone}`}
                            className="text-sm font-semibold text-[#2A8A8C] hover:underline"
                          >
                            {contactInfo.phone}
                          </a>
                          <button
                            onClick={() => copyToClipboard(contactInfo.phone)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copy phone number"
                          >
                            <Copy className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#2A8A8C]" />
                      Student Location
                      {locationUpdateCount > 0 && (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="ml-auto text-xs text-[#2A8A8C] font-normal flex items-center gap-1"
                        >
                          <Navigation2 className="w-3 h-3" />
                          Updated {locationUpdateCount}x
                        </motion.span>
                      )}
                    </h3>
                    {contactInfo.location ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {contactInfo.location.latitude.toFixed(6)}, {contactInfo.location.longitude.toFixed(6)}
                        </span>
                        <button
                          onClick={() => openMaps(contactInfo.location)}
                          className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-[#2A8A8C] text-white text-xs rounded-lg hover:bg-[#238085] transition-colors"
                        >
                          <Navigation2 className="w-3 h-3" />
                          Open Maps
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Location not available</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push(`/employer/instant-job/${jobId}/manage`)}
                  className="flex-1 px-6 py-3 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-xl font-semibold transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Manage Job
                </button>
                <button
                  onClick={() => router.push(`/employer/instant-job/${jobId}/track`)}
                  className="flex-1 px-6 py-3 bg-white border-2 border-[#2A8A8C] text-[#2A8A8C] hover:bg-[#2A8A8C] hover:text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation2 className="w-5 h-5" />
                  Track Student
                </button>
                <button
                  onClick={() => router.push('/employer')}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {(status === 'failed' || status === 'expired') && (
            <motion.div
              key="failed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center"
            >
              <XCircle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Workers Available</h2>
              <p className="text-gray-600 mb-6">
                No workers accepted right now. Try these options:
              </p>
              <div className="space-y-3 max-w-md mx-auto">
                <button
                  onClick={() => router.push(`/employer/instant-job?retry=${jobId}`)}
                  className="w-full px-6 py-3 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-xl font-semibold transition-colors shadow-md"
                >
                  Increase Pay & Retry
                </button>
                <button
                  onClick={() => router.push('/employer/post-job')}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors border border-gray-300"
                >
                  Schedule for Later
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Countdown Timer Component
const CountdownTimer = ({ targetTime }: { targetTime: Date }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((targetTime.getTime() - Date.now()) / 1000)));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((targetTime.getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime]);

  return (
    <div className="flex items-center justify-center gap-2 text-[#2A8A8C] bg-[#2A8A8C]/10 rounded-lg py-2 px-4">
      <Clock className="w-4 h-4" />
      <span className="font-bold text-lg">{timeLeft}s</span>
      <span className="text-sm">remaining</span>
    </div>
  );
};

export default DispatchStatusPage;
