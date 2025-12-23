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

const StudentManageInstantJobPage = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  const { user } = useAuth();
  const [jobData, setJobData] = useState<any>(null);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingArrival, setConfirmingArrival] = useState(false);
  const [arrivalStatus, setArrivalStatus] = useState<'en_route' | 'arrived' | 'confirmed'>('en_route');

  useEffect(() => {
    if (!jobId) return;
    fetchJobData();
    fetchContactInfo();
    const interval = setInterval(() => {
      fetchJobData();
      fetchContactInfo();
    }, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  // Listen for arrival confirmation
  useEffect(() => {
    const initSocket = async () => {
      try {
        const socketService = (await import('../../../../../services/socketService')).default;
        const socket = (socketService as any).getSocket?.() || (socketService as any).socket;

        const handleArrivalConfirmed = (data: any) => {
          if (data.jobId === jobId) {
            setArrivalStatus('confirmed');
            fetchJobData();
          }
        };

        if (socket) {
          socket.on('arrival-confirmed', handleArrivalConfirmed);
          return () => {
            socket.off('arrival-confirmed', handleArrivalConfirmed);
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
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
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
        setJobData(data.data);
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

  if (!jobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Job not found</p>
          <button
            onClick={() => router.push('/student')}
            className="mt-4 px-6 py-2 bg-[#2A8A8C] text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
          <p className="text-gray-600">{jobData.jobLocation?.address || 'Instant Job'}</p>
        </div>

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
                <h3 className="text-lg font-bold text-green-900 mb-2">Arrival Confirmed!</h3>
                <p className="text-green-800">
                  Your arrival has been confirmed by the employer. You can now proceed with the job.
                </p>
              </div>
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
      </div>
    </div>
  );
};

export default StudentManageInstantJobPage;

