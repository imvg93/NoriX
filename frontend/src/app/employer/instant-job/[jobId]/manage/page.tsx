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

  useEffect(() => {
    if (!jobId) return;
    fetchJobData();
    const interval = setInterval(fetchJobData, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  // Listen for student arrival notification
  useEffect(() => {
    const initSocket = async () => {
      try {
        const socketService = (await import('../../../../../services/socketService')).default;
        const socket = (socketService as any).getSocket?.() || (socketService as any).socket;

        const handleStudentArrived = (data: any) => {
          if (data.jobId === jobId) {
            console.log('🔔 Student arrived notification:', data);
            setStudentArrived(true);
            fetchJobData(); // Refresh data
          }
        };

        if (socket) {
          socket.on('student-arrived', handleStudentArrived);
          return () => {
            socket.off('student-arrived', handleStudentArrived);
          };
        }
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    initSocket();
  }, [jobId]);

  const fetchJobData = async () => {
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
        setJobData(data.data);
        setLoading(false);
        if (data.data?.job?.arrivalStatus === 'arrived') {
          setStudentArrived(true);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
      setLoading(false);
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
          confirmedBy: 'employer'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to confirm arrival');
      }

      await fetchJobData();
      setStudentArrived(false);
    } catch (error: any) {
      alert(error.message || 'Failed to confirm arrival');
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
  const arrivalStatus = job.arrivalStatus || 'en_route';

  return (
    <div className="min-h-screen bg-gray-50">
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
          <p className="text-gray-600">{job.jobTitle}</p>
        </div>

        {/* Student Arrived Notification */}
        {studentArrived && arrivalStatus === 'arrived' && (
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
                  {student.name} has marked themselves as arrived at the job location. Please verify and confirm their arrival.
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
                      Confirm Arrival
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
            {/* Student Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Assigned Student</h2>
              
              <div className="flex items-center gap-4 mb-4">
                {student.profilePicture ? (
                  <img
                    src={student.profilePicture}
                    alt={student.name}
                    className="w-16 h-16 rounded-full border-2 border-[#2A8A8C]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#2A8A8C] flex items-center justify-center border-2 border-[#2A8A8C]">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                  <p className="text-sm text-gray-500">Student</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200">
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
              </div>
            </div>

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

            {/* Job Location */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Location</h2>
              <p className="text-gray-700 mb-3">{job.location.address}</p>
              {job.location && (
                <button
                  onClick={() => openMaps(job.location)}
                  className="text-sm text-[#2A8A8C] hover:underline flex items-center gap-1"
                >
                  <Navigation2 className="w-4 h-4" />
                  Open in Maps
                </button>
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

