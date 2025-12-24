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
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';

const ManageInstantJobPage = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  const { user } = useAuth();
  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingArrival, setConfirmingArrival] = useState(false);
  const [studentArrived, setStudentArrived] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!jobId) return;
    console.log('🔄 Starting job data polling for job:', jobId);
    fetchJobData();
    // Poll more frequently to catch updates faster
    const interval = setInterval(fetchJobData, 3000); // Every 3 seconds
    return () => clearInterval(interval);
  }, [jobId]);

  // Listen for student arrival notification and job in progress
  useEffect(() => {
    const initSocket = async () => {
      try {
        const socketService = (await import('../../../../../services/socketService')).default;
        const socket = (socketService as any).getSocket?.() || (socketService as any).socket;

        if (!socket) {
          console.error('❌ EMPLOYER: Socket not available!');
          return;
        }

        console.log('\n' + '🔌'.repeat(40));
        console.log('🔌 EMPLOYER: Initializing socket listeners');
        console.log('🔌 Job ID:', jobId);
        console.log('🔌 Socket connected:', socket.connected);
        console.log('🔌 Socket ID:', socket.id);
        console.log('🔌'.repeat(40) + '\n');
        
        setSocketConnected(socket.connected);
        
        // Listen for connection changes
        socket.on('connect', () => {
          console.log('✅ EMPLOYER: Socket connected!');
          setSocketConnected(true);
        });
        socket.on('disconnect', () => {
          console.log('❌ EMPLOYER: Socket disconnected!');
          setSocketConnected(false);
        });

        const handleStudentArrived = (data: any) => {
          console.log('\n' + '🔔'.repeat(50));
          console.log('🔔🔔🔔 EMPLOYER: STUDENT ARRIVED EVENT RECEIVED! 🔔🔔🔔');
          console.log('🔔 Data:', JSON.stringify(data, null, 2));
          console.log('🔔 Expected jobId:', jobId);
          console.log('🔔 Received jobId:', data.jobId);
          console.log('🔔 Match:', data.jobId === jobId);
          console.log('🔔'.repeat(50) + '\n');
          
          if (data.jobId === jobId) {
            console.log('✅ JobId matches! Showing arrival banner...');
            setStudentArrived(true);
            fetchJobData(); // Refresh data
          } else {
            console.log('❌ JobId does NOT match. Ignoring event.');
          }
        };

        const handleJobInProgress = (data: any) => {
          console.log('\n' + '✅'.repeat(50));
          console.log('✅✅✅ EMPLOYER: JOB IN PROGRESS EVENT RECEIVED! ✅✅✅');
          console.log('✅ Data:', JSON.stringify(data, null, 2));
          console.log('✅'.repeat(50) + '\n');
          
          if (data.jobId === jobId) {
            console.log('✅ Hiding arrival banner, showing timer...');
            setStudentArrived(false);
            fetchJobData(); // Refresh to show timer
          }
        };

        // Test that socket is receiving events
        socket.onAny((eventName: string, ...args: any[]) => {
          console.log('📡 EMPLOYER: Received socket event:', eventName, args);
        });

        console.log('📋 EMPLOYER: Registering event listeners...');
        socket.on('student-arrived', handleStudentArrived);
        socket.on('job:in_progress', handleJobInProgress);
        socket.on('employer:arrival_confirmed', handleJobInProgress);
        console.log('✅ EMPLOYER: Event listeners registered!');
        console.log('   - student-arrived');
        console.log('   - job:in_progress');
        console.log('   - employer:arrival_confirmed');

        return () => {
          console.log('🧹 EMPLOYER: Cleaning up socket listeners');
          socket.offAny();
          socket.off('student-arrived', handleStudentArrived);
          socket.off('job:in_progress', handleJobInProgress);
          socket.off('employer:arrival_confirmed', handleJobInProgress);
        };
      } catch (error) {
        console.error('❌ Error initializing socket:', error);
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

      // Fetch both tracking data and contact info
      const [trackResponse, contactResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/instant-jobs/${jobId}/track-student`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/instant-jobs/${jobId}/contact-info`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (trackResponse.ok) {
        const trackData = await trackResponse.json();
        let jobData = trackData.data;
        
        console.log('\n📦 EMPLOYER: Received tracking data:', {
          jobId: jobData?.job?._id,
          jobStatus: jobData?.job?.status,
          arrivalStatus: jobData?.job?.arrivalStatus,
          arrivalConfirmedBy: jobData?.job?.arrivalConfirmedBy,
          startTime: jobData?.job?.startTime,
          studentName: jobData?.student?.name
        });
        
        // Merge contact info if available
        if (contactResponse.ok) {
          const contactData = await contactResponse.json();
          jobData.contactInfo = contactData.data;
        }
        
        setJobData(jobData);
        setLoading(false);
        
        // Only show "Student Arrived" banner if:
        // 1. Student marked arrival (arrivalStatus = 'arrived')
        // 2. Student confirmed (not employer)
        // 3. Job is still 'locked' (not 'in_progress' yet)
        const arrivalStatus = jobData?.job?.arrivalStatus;
        const arrivalConfirmedBy = (jobData?.job as any)?.arrivalConfirmedBy;
        const jobStatus = jobData?.job?.status;
        const shouldShowArrival = 
          arrivalStatus === 'arrived' && 
          arrivalConfirmedBy === 'student' && 
          jobStatus === 'locked';
        
        console.log('📊 EMPLOYER: Arrival Banner Logic:', {
          arrivalStatus,
          arrivalConfirmedBy,
          jobStatus,
          shouldShowArrival,
          willShowBanner: !!shouldShowArrival
        });
        
        setStudentArrived(!!shouldShowArrival);
      } else {
        setErrorMessage(trackResponse.status === 403 ? 'Access denied for this job.' : 'Failed to load job.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
      setErrorMessage('Unable to load job data.');
      setLoading(false);
    }
  };

  const handleConfirmArrival = async () => {
    console.log('\n🔵 Employer tapping Confirm Arrival button...');
    setConfirmingArrival(true);
    setStudentArrived(false); // Immediately hide banner
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      console.log('📡 Sending confirm-arrival request to backend...');
      const response = await fetch(`${API_BASE_URL}/instant-jobs/${jobId}/confirm-arrival`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          confirmedBy: 'employer'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to confirm arrival');
      }

      const result = await response.json();
      console.log('✅ Arrival confirmed successfully:', result);
      console.log('   Status:', result.data?.status);
      console.log('   Start Time:', result.data?.startTime);
      
      // Wait a moment for backend to update, then refresh
      setTimeout(async () => {
        await fetchJobData();
        console.log('✅ Job data refreshed after confirmation');
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Error confirming arrival:', error);
      alert(error.message || 'Failed to confirm arrival');
      setStudentArrived(true); // Show banner again if error
    } finally {
      setConfirmingArrival(false);
    }
  };

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

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 mb-2">{errorMessage}</p>
          <button
            onClick={() => router.push('/employer')}
            className="mt-4 px-6 py-2 bg-[#2A8A8C] text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!jobData || !jobData.student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No student assigned</p>
          <button
            onClick={() => router.push('/employer')}
            className="mt-4 px-6 py-2 bg-[#2A8A8C] text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { job, student } = jobData;
  const arrivalStatus = job?.arrivalStatus || 'en_route';
  const studentLocation = student?.currentLocation;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back</span>
            </button>
            <button
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                fetchJobData();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
            >
              <Clock className="w-4 h-4" />
              Refresh Status
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Instant Job</h1>
          <p className="text-gray-600">{job.jobTitle}</p>
          {/* Debug Info */}
          <div className="mt-2 flex items-center gap-4 text-xs">
            <span className="text-gray-500">
              Status: <span className="font-semibold">{job.status}</span> | 
              Arrival: <span className="font-semibold">{arrivalStatus}</span> | 
              Confirmed By: <span className="font-semibold">{(job as any)?.arrivalConfirmedBy || 'none'}</span>
            </span>
            <span className={`flex items-center gap-1 px-2 py-1 rounded ${socketConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'} ${socketConnected ? 'animate-pulse' : ''}`}></span>
              {socketConnected ? 'Live Updates' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Student Arrived Notification - Only show if job is locked and student confirmed */}
        {studentArrived && job.status === 'locked' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Bell className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">Student Has Arrived!</h3>
                <p className="text-yellow-800 mb-4">
                  {student.name} has marked themselves as arrived at the job location. Please verify and confirm their arrival to start the work timer.
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
                      Confirm Arrival & Start Work
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Profile - Complete Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Student Profile</h2>
              
              <div className="flex items-center gap-4 mb-6">
                {student.profilePicture ? (
                  <img
                    src={student.profilePicture}
                    alt={student.name}
                    className="w-20 h-20 rounded-full border-2 border-[#2A8A8C]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#2A8A8C] flex items-center justify-center border-2 border-[#2A8A8C]">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    {student.rating && (
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        {student.rating}
                      </span>
                    )}
                    {student.completedJobs !== undefined && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {student.completedJobs} jobs
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                {student.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#2A8A8C]" />
                      Email
                    </span>
                    <div className="flex items-center gap-2">
                      <a 
                        href={`mailto:${student.email}`}
                        className="text-sm font-semibold text-[#2A8A8C] hover:underline"
                      >
                        {student.email}
                      </a>
                      <button
                        onClick={() => copyToClipboard(student.email)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#2A8A8C]" />
                      Phone
                    </span>
                    <div className="flex items-center gap-2">
                      <a 
                        href={`tel:${student.phone}`}
                        className="text-sm font-semibold text-[#2A8A8C] hover:underline"
                      >
                        {student.phone}
                      </a>
                      <button
                        onClick={() => copyToClipboard(student.phone)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
                {student.college && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">College</span>
                    <span className="text-sm font-semibold text-gray-900">{student.college}</span>
                  </div>
                )}
                {student.skills && Array.isArray(student.skills) && student.skills.length > 0 && (
                  <div className="pt-2">
                    <span className="text-sm text-gray-600 block mb-2">Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {student.skills.map((skill: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-[#2A8A8C]/10 text-[#2A8A8C] rounded-md text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Student Location Tracker */}
            {student.currentLocation && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Navigation2 className="w-5 h-5 text-[#2A8A8C]" />
                  Live Location Tracker
                  <span className="ml-auto text-xs text-[#2A8A8C] font-normal animate-pulse">
                    Live
                  </span>
                </h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Current Location</span>
                      <span className="text-xs font-mono text-gray-700">
                        {student.currentLocation.latitude.toFixed(6)}, {student.currentLocation.longitude.toFixed(6)}
                      </span>
                    </div>
                    <button
                      onClick={() => openMaps(student.currentLocation)}
                      className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-[#2A8A8C] text-white text-sm rounded-lg hover:bg-[#238085] transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      Track on Map
                    </button>
                  </div>
                  {jobData?.jobLocation && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">Job Location</span>
                        <span className="text-xs font-mono text-gray-700">
                          {jobData.jobLocation.latitude.toFixed(6)}, {jobData.jobLocation.longitude.toFixed(6)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{jobData.jobLocation.address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Arrival Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Arrival Status</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {arrivalStatus === 'confirmed' ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : arrivalStatus === 'arrived' ? (
                    <Clock className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <Navigation2 className="w-6 h-6 text-[#2A8A8C] animate-spin" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">
                      {arrivalStatus === 'confirmed' ? 'Arrival Confirmed' : 
                       arrivalStatus === 'arrived' ? 'Student Arrived - Pending Confirmation' : 
                       'En Route'}
                    </p>
                    {arrivalStatus === 'confirmed' && job.arrivalConfirmedAt && (
                      <p className="text-xs text-gray-500">
                        Confirmed at {new Date(job.arrivalConfirmedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>

                {student.distanceToJob !== null && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Distance to Job</p>
                    <p className="text-xl font-bold text-[#2A8A8C]">
                      {student.distanceToJob} km
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Work Timer - Shows when job is in progress */}
            {job.status === 'in_progress' && job.startTime && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg border-2 border-green-400 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-900">Work In Progress</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <p className="text-xs font-semibold text-gray-600">Time Elapsed</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{timeElapsed || '0h 0m 0s'}</p>
                  </div>
                  
                  {job.duration && (
                    <div className="bg-white rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <p className="text-xs font-semibold text-gray-600">Time Remaining</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{timeRemaining || '0h 0m 0s'}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Started at</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(job.startTime).toLocaleString()}
                  </p>
                </div>

                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    💡 The student will request completion when done. You will need to confirm.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Job Location */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Location</h2>
              {job?.location?.address ? (
                <>
                  <p className="text-gray-700 mb-3">{job.location.address}</p>
                  <button
                    onClick={() => job.location && openMaps(job.location)}
                    className="text-sm text-[#2A8A8C] hover:underline flex items-center gap-1"
                  >
                    <Navigation2 className="w-4 h-4" />
                    Open in Maps
                  </button>
                </>
              ) : (
                <p className="text-gray-500 text-sm">Location not available.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/employer/instant-job/${jobId}/track`)}
                  className="w-full px-4 py-2 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation2 className="w-4 h-4" />
                  Track Student
                </button>
                <button
                  onClick={() => router.push(`/employer/instant-job/${jobId}/details`)}
                  className="w-full px-4 py-2 bg-white border-2 border-[#2A8A8C] text-[#2A8A8C] hover:bg-[#2A8A8C] hover:text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Details
                </button>
                {student.phone && (
                  <a
                    href={`tel:${student.phone}`}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call Student
                  </a>
                )}
              </div>
            </div>

            {/* Job Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Job Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pay:</span>
                  <span className="font-semibold text-gray-900">{job.pay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold text-gray-900">{job.duration} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold capitalize">{job.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageInstantJobPage;

