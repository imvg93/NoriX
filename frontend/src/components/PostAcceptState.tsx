"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Loader, Phone, MapPin, Navigation2, Copy, CheckCheck, FileText, Minimize2, Maximize2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PostAcceptStateProps {
  jobId: string;
  status: 'waiting' | 'confirmed' | 'rejected';
  onConfirmed: () => void;
}

interface ContactInfo {
  name: string;
  phone: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  address?: string;
}

const PostAcceptState: React.FC<PostAcceptStateProps> = ({ 
  jobId, 
  status: initialStatus, 
  onConfirmed 
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<'waiting' | 'confirmed' | 'rejected'>(initialStatus);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [locationUpdateCount, setLocationUpdateCount] = useState(0);
  const [arrivalStatus, setArrivalStatus] = useState<'en_route' | 'arrived' | 'confirmed'>('en_route');
  const [confirmingArrival, setConfirmingArrival] = useState(false);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const [viewedAt, setViewedAt] = useState<Date | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  const [timeElapsed, setTimeElapsed] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Update status when prop changes
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  // Poll for status updates and job data
  useEffect(() => {
    const pollStatus = async () => {
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
          const instantJob = data.data;
          
          // Store full job data for timer
          setJobData(instantJob);
          
          // Check job status
          const jobStatus = instantJob?.status || instantJob?.job?.status;

          if (jobStatus === 'confirmed' || jobStatus === 'locked') {
            setStatus('confirmed');
            // Fetch contact info immediately
            fetchContactInfo();
          } else if (jobStatus === 'failed' || jobStatus === 'expired') {
            // Job was rejected or expired
            setStatus('rejected');
          }
          
          // Update arrival status
          if (instantJob.arrivalStatus) {
            setArrivalStatus(instantJob.arrivalStatus);
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    };

    pollStatus(); // Initial fetch
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [jobId, status, onConfirmed]);

  // Fetch contact info when confirmed
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
        // Handle new response structure with jobLocation
        if (data.data?.contact) {
          setContactInfo({
            ...data.data.contact,
            location: data.data.jobLocation || data.data.contact.location
          });
        } else {
          setContactInfo(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };

  // Update location periodically when confirmed
  useEffect(() => {
    if (status === 'confirmed' && user?.userType === 'student') {
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

                setLocationUpdateCount(prev => prev + 1);
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

      // Update immediately and then every 30 seconds
      updateLocation();
      const interval = setInterval(updateLocation, 30000);
      return () => clearInterval(interval);
    }
  }, [status, jobId, user]);

  // Listen for arrival confirmation and job in progress
  useEffect(() => {
    if (status !== 'confirmed') return;

    const socketService = require('../services/socketService').default;
    const socket = (socketService as any).socket;

    const handleArrivalConfirmed = (data: any) => {
      if (data.jobId === jobId) {
        console.log('\n' + '🎉'.repeat(30));
        console.log('🎉 STUDENT POP-UP: EMPLOYER CONFIRMED ARRIVAL!');
        console.log('🎉 WORK HAS STARTED! TIMER BEGINS NOW!');
        console.log('🎉 Data received:', data);
        console.log('🎉'.repeat(30) + '\n');
        
        setArrivalStatus('confirmed');
        
        // Immediately show minimized pop-up if it was closed
        if (isMinimized) {
          console.log('📢 Pop-up is minimized - keeping visible with timer');
        }
        
        // Refresh job data to get startTime
        const pollNow = async () => {
          try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/instant-jobs/${jobId}/status`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
              const result = await response.json();
              console.log('✅ Job data refreshed with startTime:', result.data.startTime);
              setJobData(result.data);
            }
          } catch (error) {
            console.error('Error refreshing job data:', error);
          }
        };
        pollNow();
      }
    };

    if (socket) {
      console.log('🔌 PostAcceptState: Listening for arrival confirmation events...');
      socket.on('arrival-confirmed', handleArrivalConfirmed);
      socket.on('student:arrival_confirmed', handleArrivalConfirmed);
      socket.on('job:in_progress', handleArrivalConfirmed);
      return () => {
        socket.off('arrival-confirmed', handleArrivalConfirmed);
        socket.off('student:arrival_confirmed', handleArrivalConfirmed);
        socket.off('job:in_progress', handleArrivalConfirmed);
      };
    }
  }, [status, jobId, isMinimized]);

  // Timer effect - update elapsed and remaining time
  useEffect(() => {
    if (!jobData || arrivalStatus !== 'confirmed') return;

    const updateTimer = () => {
      const now = new Date();

      // Calculate elapsed time if job has started
      if (jobData.startTime && jobData.status === 'in_progress') {
        const startTime = new Date(jobData.startTime);
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        setTimeElapsed(`${hours}h ${minutes}m ${seconds}s`);

        // Calculate remaining time
        if (jobData.duration) {
          const totalSeconds = jobData.duration * 3600;
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
  }, [jobData, arrivalStatus]);

  // Fetch arrival status and viewed status
  useEffect(() => {
    if (status === 'confirmed') {
      const fetchArrivalStatus = async () => {
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
            if (data.data?.job?.arrivalStatus) {
              setArrivalStatus(data.data.job.arrivalStatus);
            }
            // Check if already viewed
            if (data.data?.job?.confirmationViewedByStudent !== undefined) {
              setHasBeenViewed(data.data.job.confirmationViewedByStudent);
              if (data.data?.job?.confirmationViewedAt?.student) {
                setViewedAt(new Date(data.data.job.confirmationViewedAt.student));
              }
            }
          }
        } catch (error) {
          console.error('Error fetching arrival status:', error);
        }
      };

      fetchArrivalStatus();
      const interval = setInterval(fetchArrivalStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [status, jobId]);

  // Mark as viewed when component mounts (if confirmed)
  useEffect(() => {
    if (status === 'confirmed' && !hasBeenViewed && user?.userType === 'student') {
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
              viewedBy: 'student'
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
  }, [status, jobId, hasBeenViewed, user]);

  const handleConfirmArrival = async () => {
    console.log('\n📍 STUDENT: Tapping "I\'ve Arrived" button...');
    setConfirmingArrival(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      console.log('📡 Sending confirm-arrival request (student) to backend...');
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

      const result = await response.json();
      console.log('✅ Student arrival marked successfully:', result.message);
      console.log('   Status:', result.data?.status);
      console.log('   Arrival Status:', result.data?.arrivalStatus);
      console.log('   Waiting for employer confirmation...');
      
      setArrivalStatus('arrived');
    } catch (error: any) {
      console.error('❌ Error marking arrival:', error);
      alert(error.message || 'Failed to confirm arrival');
    } finally {
      setConfirmingArrival(false);
    }
  };

  // Listen for Socket.IO confirmation event with contact info
  useEffect(() => {
    if (status !== 'waiting') return;

    const socketService = require('../services/socketService').default;
    const socket = (socketService as any).socket;

    const handleConfirmed = (data: any) => {
      console.log('✅ Job confirmed with contact info:', data);
      setStatus('confirmed');
      if (data.employer && data.jobLocation) {
        // Set contact info with job location for navigation
        setContactInfo({
          name: data.employer.name,
          phone: data.employer.phone,
          location: data.jobLocation, // Job location coordinates
          address: data.jobLocation.address || data.employer.address
        });
      } else {
        // Fallback: fetch from API
        fetchContactInfo();
      }
    };

    if (socket) {
      socket.on('instant-job-confirmed', handleConfirmed);
      return () => {
        socket.off('instant-job-confirmed', handleConfirmed);
      };
    }
  }, [status, jobId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const openMaps = (location: { latitude: number; longitude: number }) => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  if (status === 'confirmed') {
    // Minimized view - bottom-right corner
    if (isMinimized) {
      const isWorkInProgress = jobData?.status === 'in_progress' && arrivalStatus === 'confirmed';
      
      return (
        <motion.div
          initial={{ scale: 0, x: 100, y: 100 }}
          animate={{ scale: 1, x: 0, y: 0 }}
          className="fixed bottom-4 right-4 z-[99999]"
          style={{ zIndex: 99999 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            onClick={() => setIsMinimized(false)}
            className={`${
              isWorkInProgress 
                ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                : 'bg-gradient-to-r from-[#2A8A8C] to-[#238085]'
            } text-white rounded-2xl shadow-2xl p-4 cursor-pointer min-w-[280px]`}
          >
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isWorkInProgress ? (
                  <Clock className="w-8 h-8 animate-pulse" />
                ) : (
                  <CheckCircle className="w-8 h-8" />
                )}
              </motion.div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">
                  {isWorkInProgress ? 'Work In Progress' : 'Job Confirmed!'}
                </h3>
                <p className="text-xs text-white/90">
                  {isWorkInProgress ? timeElapsed || '0h 0m 0s' : 'Click to expand'}
                </p>
              </div>
              <Maximize2 className="w-5 h-5" />
            </div>
            {isWorkInProgress && timeRemaining && (
              <div className="text-xs text-white/80">
                ⏱️ {timeRemaining} remaining
              </div>
            )}
          </motion.div>
        </motion.div>
      );
    }

    // Full view - centered modal
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md"
        style={{ zIndex: 99999 }}
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
        >
          {/* Header - Teal gradient */}
          <div className="bg-gradient-to-r from-[#2A8A8C] via-[#238085] to-[#2A8A8C] p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <CheckCircle className="w-8 h-8" />
                </motion.div>
                <h2 className="text-2xl font-bold">Job Confirmed!</h2>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {hasBeenViewed && (
                  <div className="flex items-center gap-1 mr-2" title={`Viewed ${viewedAt ? `at ${viewedAt.toLocaleTimeString()}` : ''}`}>
                    <CheckCheck className="w-5 h-5 text-white/90" />
                  </div>
                )}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Minimize"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
                <button
                  onClick={onConfirmed}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-white/90 text-sm">You have been assigned to this job</p>
            {hasBeenViewed && viewedAt && (
              <p className="text-white/70 text-xs mt-1">
                Viewed {viewedAt.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Contact Info Section */}
          <div className="p-6 space-y-4">
            {contactInfo && (
              <>
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
                    Location
                    {locationUpdateCount > 0 && (
                      <span className="ml-auto text-xs text-[#2A8A8C] font-normal">
                        Updated {locationUpdateCount}x
                      </span>
                    )}
                  </h3>
                  {contactInfo.address && (
                    <p className="text-sm text-gray-700 mb-2">{contactInfo.address}</p>
                  )}
                  {contactInfo.location ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {contactInfo.location.latitude.toFixed(6)}, {contactInfo.location.longitude.toFixed(6)}
                      </span>
                      <button
                        onClick={() => openMaps(contactInfo.location!)}
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

                {/* Rotating Location Indicator */}
                {locationUpdateCount > 0 && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="flex items-center justify-center gap-2 text-xs text-[#2A8A8C]"
                  >
                    <Navigation2 className="w-4 h-4" />
                    <span>Location sharing active</span>
                  </motion.div>
                )}
              </>
            )}

            {/* Arrival Confirmation Barrier */}
            {arrivalStatus === 'en_route' && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Arrival Confirmation Required
                </h4>
                <p className="text-xs text-yellow-800 mb-3">
                  When you arrive at the job location, please confirm your arrival below.
                </p>
                <button
                  onClick={handleConfirmArrival}
                  disabled={confirmingArrival}
                  className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {confirmingArrival ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      I've Arrived
                    </>
                  )}
                </button>
              </div>
            )}

            {arrivalStatus === 'arrived' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-blue-900">Waiting for Employer Confirmation</h4>
                </div>
                <p className="text-xs text-blue-800">
                  You've confirmed your arrival. Waiting for employer to verify and confirm.
                </p>
              </div>
            )}

            {arrivalStatus === 'confirmed' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-400 rounded-xl p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </motion.div>
                  <h4 className="text-base font-bold text-green-900">Work Started! 🎉</h4>
                </div>
                <p className="text-sm text-green-800 mb-4">
                  Employer confirmed your arrival. Timer has started. Work well and complete the job!
                </p>
                
                {/* Timer Display */}
                {jobData?.startTime && jobData?.status === 'in_progress' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="w-4 h-4 text-green-600" />
                          <p className="text-xs font-semibold text-gray-600">Time Worked</p>
                        </div>
                        <p className="text-lg font-bold text-green-600">{timeElapsed || '0h 0m 0s'}</p>
                      </div>
                      
                      {jobData.duration && (
                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <p className="text-xs font-semibold text-gray-600">Remaining</p>
                          </div>
                          <p className="text-lg font-bold text-blue-600">{timeRemaining || '0h 0m 0s'}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Started At</p>
                      <p className="text-xs font-semibold text-gray-900">
                        {new Date(jobData.startTime).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <p className="text-xs text-yellow-800">
                        💡 Tap "Manage Job" when you finish to request completion.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Next Steps */}
            {arrivalStatus !== 'confirmed' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Next Steps:</h4>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>Contact the {user?.userType === 'student' ? 'employer' : 'student'} using the phone number above</li>
                  <li>Navigate to the job location using the map link</li>
                  <li>Arrive on time and confirm your arrival</li>
                </ul>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 space-y-3">
            <button
              onClick={() => {
                router.push(`/student/instant-job/${jobId}/confirmation`);
                onConfirmed();
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#2A8A8C] to-[#238085] hover:from-[#238085] hover:to-[#1d6d71] text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              <MapPin className="w-5 h-5" />
              View Work Location
            </button>
            <button
              onClick={() => {
                router.push(`/student/instant-job/${jobId}/manage`);
                onConfirmed();
              }}
              className="w-full px-6 py-3 bg-white border-2 border-[#2A8A8C] text-[#2A8A8C] hover:bg-[#2A8A8C] hover:text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Manage Job
            </button>
            <button
              onClick={onConfirmed}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (status === 'rejected') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md"
        style={{ zIndex: 99999 }}
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center border border-gray-200"
        >
          <XCircle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Selected</h2>
          <p className="text-gray-600 mb-6">Employer chose another candidate or the lock expired.</p>
          <button
            onClick={onConfirmed}
            className="px-6 py-3 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-xl font-semibold transition-colors"
          >
            Continue Browsing
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md"
      style={{ zIndex: 99999 }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center border border-gray-200"
      >
        {/* Pulse Animation */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <motion.div
            className="absolute inset-0 border-4 border-[#2A8A8C] rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader className="w-12 h-12 text-[#2A8A8C] animate-spin" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for Confirmation</h2>
        <p className="text-gray-600 mb-6">
          Employer is reviewing your profile. This usually takes less than 90 seconds.
        </p>

        {/* Countdown */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-center gap-2 text-[#2A8A8C]">
            <Clock className="w-5 h-5" />
            <span className="text-xl font-bold">Waiting...</span>
            <span className="text-sm text-gray-500">for employer response</span>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          You'll be notified as soon as the employer responds.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default PostAcceptState;
