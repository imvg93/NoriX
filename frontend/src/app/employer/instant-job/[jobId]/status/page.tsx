"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  Mail,
  GraduationCap,
  Briefcase
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
  const [cancelling, setCancelling] = useState(false);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [locationUpdateCount, setLocationUpdateCount] = useState(0);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const [viewedAt, setViewedAt] = useState<Date | null>(null);
  const [studentLocation, setStudentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const redirectingRef = useRef(false);

  const fetchStudentTracking = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/instant-jobs/${jobId}/track-student`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.student?.currentLocation) {
          setStudentLocation(data.data.student.currentLocation);
        }
      }
    } catch (error) {
      console.error('Error fetching student tracking:', error);
    }
  };

  // Redirect to manage page when status becomes confirmed (polling fallback)
  useEffect(() => {
    console.log('🔍 Redirect useEffect triggered:', {
      status: jobStatus?.status,
      userType: user?.userType,
      redirecting: redirectingRef.current,
      jobId
    });
    
    if (jobStatus?.status === 'confirmed' && user?.userType === 'employer' && !redirectingRef.current) {
      console.log('✅ Job confirmed via polling - FORCE REDIRECTING NOW!');
      redirectingRef.current = true; // Prevent multiple redirects
      
      // Redirect IMMEDIATELY - no delay
      console.log('🚀 FORCE REDIRECT (from polling)');
      window.location.href = `/employer/instant-job/${jobId}/manage`;
    }
  }, [jobStatus?.status, jobId, user]);

  useEffect(() => {
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      console.error('❌ Invalid jobId in useEffect:', jobId);
      return;
    }
    
    // Don't poll if already confirmed - redirect will happen via socket
    if (jobStatus?.status === 'confirmed') {
      console.log('✅ Job is confirmed - stopping polling');
      return;
    }
    
    // Don't poll if confirming - wait for socket event
    if (confirming) {
      console.log('⏳ Confirming in progress - waiting for socket event');
      return;
    }
    
    fetchJobStatus();
    const interval = setInterval(fetchJobStatus, 2000); // Poll every 2 seconds
    
    return () => clearInterval(interval);
  }, [jobId, jobStatus?.status, confirming]);

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

  // Listen for Socket.IO events
  useEffect(() => {
    const socketService = require('../../../../../services/socketService').default;
    const socket = (socketService as any).socket;

    // Handle when student accepts (locks job)
    const handleStudentAccepted = (data: any) => {
      console.log('📨 Student accepted job:', data);
      // Refresh job status to show locked state
      fetchJobStatus();
    };

    // Handle when student is confirmed (after employer confirms)
    const handleStudentConfirmed = (data: any) => {
      console.log('✅ Student confirmed with contact info:', data);
      if (data.student) {
        setContactInfo({
          name: data.student.name,
          phone: data.student.phone,
          location: data.student.location
        });
        // Set student location if available
        if (data.student.currentLocation) {
          setStudentLocation(data.student.currentLocation);
        }
      }
      // Refresh job status and fetch tracking
      fetchJobStatus();
      fetchStudentTracking();
    };

    if (socket) {
      socket.on('instant-job-student-accepted', handleStudentAccepted);
      socket.on('instant-job-student-confirmed', handleStudentConfirmed);
      socket.on('job:locked', handleStudentAccepted);
      socket.on('job:in_progress', () => fetchJobStatus());
      socket.on('job:completed', () => fetchJobStatus());
      socket.on('job:cancelled', () => fetchJobStatus());
      socket.on('job:expired', () => fetchJobStatus());
      return () => {
        socket.off('instant-job-student-accepted', handleStudentAccepted);
        socket.off('instant-job-student-confirmed', handleStudentConfirmed);
        socket.off('job:locked', handleStudentAccepted);
        socket.off('job:in_progress', () => fetchJobStatus());
        socket.off('job:completed', () => fetchJobStatus());
        socket.off('job:cancelled', () => fetchJobStatus());
        socket.off('job:expired', () => fetchJobStatus());
      };
    }
  }, [jobId]);

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
        setContactInfo(data.data);
        // Set student location if available
        if (data.data?.studentLocation) {
          setStudentLocation(data.data.studentLocation);
        }
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
        console.log('📊 Job status fetched:', {
          status: data.data?.status,
          hasAcceptedBy: !!data.data?.acceptedBy,
          fullData: data.data
        });
        setJobStatus(data.data);
        setLoading(false);
        
        // If status is confirmed, trigger redirect check immediately
        if (data.data?.status === 'confirmed' && !redirectingRef.current) {
          console.log('🎯 Status is confirmed - triggering redirect check');
          redirectingRef.current = true;
          setTimeout(() => {
            console.log('🚀 AUTO REDIRECT from fetchJobStatus');
            window.location.href = `/employer/instant-job/${jobId}/manage`;
          }, 500);
        }
        
        // Return status for use in handleConfirm
        return data.data?.status;
      }
    } catch (error) {
      console.error('Error fetching job status:', error);
    }
    return null;
  };

  const handleConfirm = async (confirm: boolean) => {
    console.log('\n' + '🎯'.repeat(40));
    console.log('🎯 EMPLOYER CONFIRMING:', confirm ? 'CONFIRM' : 'REJECT');
    console.log('🎯'.repeat(40) + '\n');
    
    setConfirming(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      console.log('📤 Sending confirmation request to backend...');
      const response = await fetch(`${API_BASE_URL}/instant-jobs/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId,
          action: confirm ? 'confirm' : 'reject'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to confirm');
      }

      // Get response data to check status
      const responseData = await response.json();
      console.log('✅ Backend response received:', responseData);
      
      // If confirmed, wait for socket event OR redirect after timeout
      if (confirm) {
        console.log('⏳ Waiting for socket event to trigger redirect...');
        console.log('   If socket event doesn\'t arrive, will redirect in 3 seconds');
        
        // Backup redirect in case socket event doesn't arrive
        setTimeout(() => {
          if (!redirectingRef.current) {
            console.warn('⚠️ Socket event timeout - forcing redirect as backup');
            redirectingRef.current = true;
            window.location.href = `/employer/instant-job/${jobId}/manage`;
          }
        }, 3000);
      } else {
        // Rejected - refresh status and wait for new student
        console.log('❌ Rejected - searching for next worker');
        console.log('   Backend will dispatch to more students');
        console.log('   Waiting for next student to accept...');
        
        await fetchJobStatus();
        setConfirming(false);
        
        // Clear the current locked student from UI
        setJobStatus((prev: any) => ({
          ...prev,
          status: 'dispatching',
          lockedBy: null,
          lockExpiresAt: null
        }));
      }
    } catch (error: any) {
      console.error('❌ Error confirming:', error);
      alert(error.message || 'Failed to confirm');
      setConfirming(false);
    }
  };

  const handleCancelJob = async () => {
    if (!jobId) return;
    const isLocked = status === 'locked' || status === 'in_progress';
    const warning = isLocked
      ? 'Cancelling now will incur a 25% fee. Do you want to proceed?'
      : 'Cancel search? (no penalty)';
    if (!window.confirm(warning)) return;
    setCancelling(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/instant-jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel job');
      }
      router.push('/employer');
    } catch (error: any) {
      alert(error.message || 'Failed to cancel job');
    } finally {
      setCancelling(false);
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
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleCancelJob}
                  disabled={cancelling}
                  className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Search (no penalty)'}
                </button>
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
                    <h3 className="text-xl font-bold text-gray-900">{lockedStudent.name || 'Student'}</h3>
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

                {/* Student Contact Information */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  {lockedStudent.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-[#2A8A8C]" />
                      <span className="text-gray-700">{lockedStudent.email}</span>
                    </div>
                  )}
                  {lockedStudent.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-[#2A8A8C]" />
                      <a href={`tel:${lockedStudent.phone}`} className="text-[#2A8A8C] hover:underline">
                        {lockedStudent.phone}
                      </a>
                    </div>
                  )}
                  {lockedStudent.college && (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-[#2A8A8C]" />
                      <span className="text-gray-700">{lockedStudent.college}</span>
                      {lockedStudent.courseYear && (
                        <span className="text-gray-500">• Year {lockedStudent.courseYear}</span>
                      )}
                    </div>
                  )}
                  {lockedStudent.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-[#2A8A8C]" />
                      <span className="text-gray-700">{lockedStudent.address}</span>
                    </div>
                  )}
                  {lockedStudent.skills && Array.isArray(lockedStudent.skills) && lockedStudent.skills.length > 0 && (
                    <div className="flex items-start gap-2 text-sm pt-2">
                      <Briefcase className="w-4 h-4 text-[#2A8A8C] mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {lockedStudent.skills.map((skill: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-[#2A8A8C]/10 text-[#2A8A8C] rounded-md text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-200 mt-4">
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
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="text-sm text-red-700 font-semibold mb-2">Cancel job?</div>
                <p className="text-sm text-red-700 mb-3">Cancelling after lock will incur a 25% fee. Proceed only if you cannot continue.</p>
                <button
                  onClick={handleCancelJob}
                  disabled={cancelling}
                  className="w-full px-4 py-3 bg-white text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Job (25% penalty)'}
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
                        <span className="text-sm font-semibold text-gray-900">{contactInfo.contact?.name || contactInfo.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Phone:</span>
                        <div className="flex items-center gap-2">
                          <a 
                            href={`tel:${contactInfo.contact?.phone || contactInfo.phone}`}
                            className="text-sm font-semibold text-[#2A8A8C] hover:underline"
                          >
                            {contactInfo.contact?.phone || contactInfo.phone}
                          </a>
                          <button
                            onClick={() => copyToClipboard(contactInfo.contact?.phone || contactInfo.phone)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copy phone number"
                          >
                            <Copy className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Student Location Tracking */}
                  {studentLocation && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Navigation2 className="w-4 h-4 text-[#2A8A8C]" />
                        Student Location
                        <span className="ml-auto text-xs text-[#2A8A8C] font-normal animate-pulse">
                          Live
                        </span>
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Coordinates:</span>
                          <span className="text-xs font-mono text-gray-700">
                            {studentLocation.latitude.toFixed(6)}, {studentLocation.longitude.toFixed(6)}
                          </span>
                        </div>
                        <button
                          onClick={() => openMaps(studentLocation)}
                          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-[#2A8A8C] text-white text-sm rounded-lg hover:bg-[#238085] transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                          Track on Map
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Student Location Tracking */}
                  {studentLocation && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Navigation2 className="w-4 h-4 text-[#2A8A8C]" />
                        Student Location
                        <span className="ml-auto text-xs text-[#2A8A8C] font-normal animate-pulse">
                          Live
                        </span>
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Coordinates:</span>
                          <span className="text-xs font-mono text-gray-700">
                            {studentLocation.latitude.toFixed(6)}, {studentLocation.longitude.toFixed(6)}
                          </span>
                        </div>
                        <button
                          onClick={() => openMaps(studentLocation)}
                          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-[#2A8A8C] text-white text-sm rounded-lg hover:bg-[#238085] transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                          Track on Map
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    console.log('🚀 FORCE REDIRECT - Button clicked');
                    redirectingRef.current = true;
                    window.location.href = `/employer/instant-job/${jobId}/manage`;
                  }}
                  className="flex-1 px-6 py-3 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-xl font-semibold transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  View Student Profile & Tracker
                </button>
              </div>
              
              {/* Debug Info */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                <p className="font-semibold text-yellow-900 mb-1">Debug Info:</p>
                <p>Status: {status}</p>
                <p>Redirecting Flag: {redirectingRef.current ? 'Yes' : 'No'}</p>
                <p>Job ID: {jobId}</p>
                <p>Has Accepted Student: {acceptedStudent ? 'Yes' : 'No'}</p>
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
