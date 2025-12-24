"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  MapPin,
  Navigation2,
  Phone,
  User,
  CheckCircle,
  Clock,
  Loader,
  Copy,
  AlertCircle,
  FileText,
  Bell,
  MessageSquare,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';

const StudentManageInstantJobPage = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  const { user } = useAuth();
  const [jobData, setJobData] = useState<any>(null);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingArrival, setConfirmingArrival] = useState(false);
  const [completingJob, setCompletingJob] = useState(false);
  const [arrivalStatus, setArrivalStatus] = useState<'en_route' | 'arrived' | 'confirmed'>('en_route');
  const [timeElapsed, setTimeElapsed] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!jobId) return;
    loadAllData();
    const interval = setInterval(() => {
      loadAllData();
    }, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  const loadAllData = async () => {
    await Promise.all([fetchJobData(), fetchContactInfo()]);
  };

  // Listen for arrival confirmation and job in progress
  useEffect(() => {
    const initSocket = async () => {
      try {
        const socketService = (await import('../../../../../services/socketService')).default;
        const socket = (socketService as any).getSocket?.() || (socketService as any).socket;

        const handleArrivalConfirmed = (data: any) => {
          if (data.jobId === jobId) {
            console.log('✅ Arrival confirmed, job in progress:', data);
            setArrivalStatus('confirmed');
            fetchJobData();
          }
        };

        const handleJobCompleted = (data: any) => {
          if (data.jobId === jobId) {
            console.log('🎉 Job completed!', data);
            fetchJobData();
            // Show success alert
            setTimeout(() => {
              alert('🎉 Job Completed! Thank you for your work. Payment has been released!');
            }, 500);
          }
        };

        if (socket) {
          socket.on('student:arrival_confirmed', handleArrivalConfirmed);
          socket.on('job:in_progress', handleArrivalConfirmed);
          socket.on('job:completed', handleJobCompleted);
          return () => {
            socket.off('student:arrival_confirmed', handleArrivalConfirmed);
            socket.off('job:in_progress', handleArrivalConfirmed);
            socket.off('job:completed', handleJobCompleted);
          };
        }
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    initSocket();
  }, [jobId]);

  // Timer effect - update elapsed and remaining time
  useEffect(() => {
    if (!jobData?.job) return;

    const updateTimer = () => {
      const job = jobData.job;
      const now = new Date();

      // Calculate elapsed time if job has started
      if (job.startTime && job.status === 'in_progress') {
        const startTime = new Date(job.startTime);
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        setTimeElapsed(`${hours}h ${minutes}m ${seconds}s`);

        // Calculate remaining time
        if (job.duration) {
          const totalSeconds = job.duration * 3600;
          const remaining = Math.max(0, totalSeconds - elapsed);
          const remHours = Math.floor(remaining / 3600);
          const remMinutes = Math.floor((remaining % 3600) / 60);
          const remSeconds = remaining % 60;
          setTimeRemaining(`${remHours}h ${remMinutes}m ${remSeconds}s`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [jobData]);

  const fetchJobData = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      console.log('Fetching job data for jobId:', jobId);
      console.log('API URL:', `${API_BASE_URL}/instant-jobs/${jobId}/status`);

      const response = await fetch(`${API_BASE_URL}/instant-jobs/${jobId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Job data received:', data);
        const instantJob = data.data;
        
        // Set job data from status endpoint with all necessary fields
        setJobData({
          job: {
            _id: instantJob._id,
            jobTitle: instantJob.jobTitle,
            jobType: instantJob.jobType,
            pay: instantJob.pay,
            duration: instantJob.duration,
            arrivalStatus: instantJob.arrivalStatus,
            status: instantJob.status,
            startTime: instantJob.startTime,
            arrivalConfirmedAt: instantJob.arrivalConfirmedAt,
            completionRequestedAt: instantJob.completionRequestedAt
          },
          jobLocation: instantJob.location
        });
        
        if (instantJob.arrivalStatus) {
          setArrivalStatus(instantJob.arrivalStatus);
        }
        
        setError(null);
        setLoading(false);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load job' }));
        console.error('Error response from backend:', errorData);
        setError(errorData.message || 'Job not found or access denied');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error fetching job data:', error);
      setError(error.message || 'Unable to load job data');
      setLoading(false);
    }
  };

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
        
        // Update job data with full details if we have them
        if (data.data) {
          setJobData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };

  const handleConfirmArrival = async () => {
    setConfirmingArrival(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/instant-jobs/${jobId}/confirm-arrival`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          confirmedBy: 'student'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to confirm arrival');
      }

      setArrivalStatus('arrived');
      await fetchJobData();
    } catch (error: any) {
      alert(error.message || 'Failed to confirm arrival');
    } finally {
      setConfirmingArrival(false);
    }
  };

  const handleCompleteJob = async () => {
    if (!confirm('Are you sure you want to mark this job as complete? The employer will need to confirm to release payment.')) {
      return;
    }

    setCompletingJob(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/instant-jobs/${jobId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request completion');
      }

      alert('✅ Work completion requested! Waiting for employer approval. You will be notified once confirmed.');
      await fetchJobData();
    } catch (error: any) {
      alert(error.message || 'Failed to request completion');
    } finally {
      setCompletingJob(false);
    }
  };

  // Update location periodically
  useEffect(() => {
    if (arrivalStatus !== 'confirmed' && user?.userType === 'student') {
      const updateLocation = async () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                const token = localStorage.getItem('token');

                await fetch(`${API_BASE_URL}/users/update-location`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                  })
                });
              } catch (error) {
                console.error('Error updating location:', error);
              }
            },
            (error) => {
              console.error('Error getting location:', error);
            }
          );
        }
      };

      updateLocation();
      const interval = setInterval(updateLocation, 30000);
      return () => clearInterval(interval);
    }
  }, [arrivalStatus, jobId, user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openMaps = (location: { latitude: number; longitude: number }) => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-[#2A8A8C] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !jobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error ? 'Unable to Load Job' : 'Job Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'The instant job you are looking for could not be found or you may not have access to it.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                loadAllData();
              }}
              className="px-6 py-2 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#238085] transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/student/instant-job')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Instant Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2A8A8C;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #238085;
        }
      `}</style>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Instant Job</h1>
          <p className="text-gray-600">{jobData.jobLocation?.address || 'Instant Job'}</p>
        </div>

        {/* Scrollable Content Container with 70vh max height */}
        <div 
          className="overflow-y-auto custom-scrollbar pr-2 pb-8" 
          style={{ 
            maxHeight: '70vh', 
            scrollBehavior: 'smooth'
          }}
        >

        {/* Job Status Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-[#2A8A8C] p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-gray-900">
              {jobData?.job?.jobTitle || jobData?.job?.jobType || 'Instant Job'}
            </h2>
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
              jobData?.job?.status === 'in_progress' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
              jobData?.job?.status === 'locked' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
              jobData?.job?.status === 'completed' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' :
              'bg-gray-100 text-gray-800 border-2 border-gray-300'
            }`}>
              {jobData?.job?.status === 'in_progress' ? '🚀 In Progress' :
               jobData?.job?.status === 'locked' ? '✅ Assigned' :
               jobData?.job?.status === 'completed' ? '🎉 Completed' :
               jobData?.job?.status?.toUpperCase()}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {jobData?.job?.pay && (
              <span className="flex items-center gap-1 bg-green-50 px-3 py-2 rounded-lg text-green-700 font-semibold border border-green-200">
                <DollarSign className="w-4 h-4" />
                {jobData.job.pay}
              </span>
            )}
            {jobData?.job?.duration && (
              <span className="flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg text-blue-700 font-semibold border border-blue-200">
                <Clock className="w-4 h-4" />
                {jobData.job.duration} hours
              </span>
            )}
            {jobData.jobLocation?.address && (
              <span className="flex items-center gap-1 bg-purple-50 px-3 py-2 rounded-lg text-purple-700 font-semibold border border-purple-200">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{jobData.jobLocation.address}</span>
              </span>
            )}
          </div>
        </motion.div>

        {/* Arrival Confirmation Section */}
        {arrivalStatus === 'en_route' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <MapPin className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">Arrival Confirmation</h3>
                <p className="text-yellow-800 mb-4">
                  When you arrive at the job location, please tap the button below to notify the employer.
                </p>
                <button
                  onClick={handleConfirmArrival}
                  disabled={confirmingArrival}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {confirmingArrival ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      I've Arrived
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {arrivalStatus === 'arrived' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border-2 border-blue-400 rounded-xl p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Waiting for Employer Confirmation</h3>
                <p className="text-blue-800">
                  You've confirmed your arrival. Waiting for employer to verify and confirm.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {arrivalStatus === 'confirmed' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border-2 border-green-400 rounded-xl p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2">Arrival Confirmed - Work Started!</h3>
                <p className="text-green-800">
                  Your arrival has been confirmed by the employer. The timer has started. Work well and request completion when done.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Work Completed Button - Always visible when in_progress, disabled after clicked */}
        {jobData?.job?.status === 'in_progress' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <button
              onClick={handleCompleteJob}
              disabled={completingJob || !!jobData?.job?.completionRequestedAt}
              className={`w-full px-6 py-4 ${
                jobData?.job?.completionRequestedAt 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
              } text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              <CheckCircle className="w-6 h-6" />
              {jobData?.job?.completionRequestedAt 
                ? '✅ Completion Requested' 
                : completingJob 
                  ? 'Submitting...' 
                  : 'Work Completed'}
            </button>
            {!jobData?.job?.completionRequestedAt && (
              <p className="text-sm text-gray-600 text-center mt-2">
                ✓ Click when you finish the work (even if before time ends)<br />
                ✓ Employer will review and confirm completion
              </p>
            )}
            {jobData?.job?.completionRequestedAt && (
              <p className="text-sm text-yellow-700 text-center mt-2 font-semibold">
                ⏱️ Waiting for employer to confirm your completion
              </p>
            )}
          </motion.div>
        )}

        {/* Job Completed - Success */}
        {jobData?.job?.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border-2 border-green-400 rounded-xl p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-900 mb-2">🎉 Completed! Thank You!</h3>
                <p className="text-green-800 mb-2">
                  Great work! The employer has confirmed your work completion.
                </p>
                <p className="text-sm text-green-700 font-semibold">
                  💰 Payment has been released and will be in your account soon. Thank you for using NoriX!
                </p>
              </div>
            </div>
          </motion.div>
        )}


        {/* Work Timer - Shows when job is in progress */}
        {jobData?.job?.status === 'in_progress' && jobData?.job?.startTime && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg border-2 border-green-400 p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-7 h-7 text-green-600 animate-pulse" />
              <h2 className="text-xl font-bold text-gray-900">Work In Progress</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <p className="text-xs font-semibold text-gray-600">Time Worked</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{timeElapsed || '0h 0m 0s'}</p>
              </div>
              
              {jobData.job.duration && (
                <div className="bg-white rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <p className="text-xs font-semibold text-gray-600">Time Remaining</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{timeRemaining || '0h 0m 0s'}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
              <p className="text-xs text-gray-600 mb-1">Work Started At</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(jobData.job.startTime).toLocaleString()}
              </p>
            </div>

            {jobData.job.duration && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Expected Completion</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(new Date(jobData.job.startTime).getTime() + jobData.job.duration * 3600000).toLocaleString()}
                </p>
              </div>
            )}

            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800 font-semibold mb-1">
                ✅ You can complete work early!
              </p>
              <p className="text-xs text-green-700">
                Click "Work Completed" button above when you finish - even before the timer ends. Employer will review and confirm.
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Job Location</label>
                  <p className="text-gray-900 mt-1">{jobData.jobLocation?.address}</p>
                  {jobData.jobLocation && (
                    <button
                      onClick={() => openMaps(jobData.jobLocation)}
                      className="mt-2 text-sm text-[#2A8A8C] hover:underline flex items-center gap-1"
                    >
                      <Navigation2 className="w-3 h-3" />
                      Open in Maps
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Employer Contact */}
            {contactInfo && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Employer Contact</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Name</label>
                    <p className="text-lg text-gray-900 mt-1">{contactInfo.name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#2A8A8C]" />
                      Phone
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <a 
                        href={`tel:${contactInfo.phone}`}
                        className="text-lg font-semibold text-[#2A8A8C] hover:underline"
                      >
                        {contactInfo.phone}
                      </a>
                      <button
                        onClick={() => copyToClipboard(contactInfo.phone)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {/* Confirm Arrival Button - Only show when status is locked and not arrived yet */}
                {jobData?.job?.status === 'locked' && arrivalStatus === 'en_route' && (
                  <button
                    onClick={handleConfirmArrival}
                    disabled={confirmingArrival}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MapPin className="w-5 h-5" />
                    {confirmingArrival ? 'Confirming...' : 'I Have Arrived'}
                  </button>
                )}
                
                <button
                  onClick={() => router.push(`/student/instant-job/${jobId}/confirmation`)}
                  className="w-full px-4 py-2 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <MapPin className="w-4 h-4" />
                  View Work Location
                </button>
                {contactInfo?.phone && (
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="w-full px-4 py-2 bg-white border-2 border-[#2A8A8C] text-[#2A8A8C] hover:bg-[#2A8A8C] hover:text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call Employer
                  </a>
                )}
                {jobData.jobLocation && (
                  <button
                    onClick={() => openMaps(jobData.jobLocation)}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Navigation2 className="w-4 h-4" />
                    Get Directions
                  </button>
                )}
                <button
                  onClick={() => router.push(`/student/instant-job/${jobId}/details`)}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-[#2A8A8C] p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-[#2A8A8C]" />
                <h3 className="text-lg font-bold text-gray-900">Job Confirmed</h3>
              </div>
              <p className="text-sm text-gray-600">
                You've been assigned to this job. Contact the employer using the details provided.
              </p>
            </div>
          </div>
        </div>

        </div> {/* End Scrollable Container */}
      </div>
    </div>
  );
};

export default StudentManageInstantJobPage;

