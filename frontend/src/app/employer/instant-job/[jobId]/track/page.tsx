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
  FileText
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';

const TrackStudentPage = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  const { user } = useAuth();
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingArrival, setConfirmingArrival] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [jobId]);

  // Listen for real-time location updates
  useEffect(() => {
    const socketService = require('../../../../../services/socketService').default;
    const socket = (socketService as any).getSocket?.() || (socketService as any).socket;

    const handleLocationUpdate = (data: any) => {
      if (data.jobId === jobId) {
        fetchTrackingData(); // Refresh data
      }
    };

    if (socket) {
      socket.on('student-location-updated', handleLocationUpdate);
      socket.on('student-arrived', handleLocationUpdate);
      socket.on('job:in_progress', handleLocationUpdate);
      socket.on('job:completed', handleLocationUpdate);
      return () => {
        socket.off('student-location-updated', handleLocationUpdate);
        socket.off('student-arrived', handleLocationUpdate);
        socket.off('job:in_progress', handleLocationUpdate);
        socket.off('job:completed', handleLocationUpdate);
      };
    }
  }, [jobId]);

  const fetchTrackingData = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/instant-jobs/${jobId}/track-student`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTrackingData(data.data);
          setLoading(false);
        } else {
          console.error('Invalid response format:', data);
          setLoading(false);
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch tracking data' }));
        console.error('Error response:', errorData);
        // 400 likely means not yet confirmed/assigned; show clearer message
        if (response.status === 400) {
          setErrorMessage(errorData.message || 'Tracking is available after the student is accepted/locked.');
        } else if (response.status === 403) {
          setErrorMessage('Access denied for this job.');
        } else {
          setErrorMessage(errorData.message || 'Failed to fetch tracking data');
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setErrorMessage('Unable to load tracking data.');
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

      await fetchTrackingData();
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

  const calculateETA = (studentLocation: any, jobLocation: any) => {
    if (!studentLocation || !jobLocation) return null;
    
    // Simple ETA calculation (assuming average speed of 30 km/h)
    const R = 6371; // Earth's radius in km
    const dLat = (jobLocation.latitude - studentLocation.latitude) * Math.PI / 180;
    const dLon = (jobLocation.longitude - studentLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(studentLocation.latitude * Math.PI / 180) *
      Math.cos(jobLocation.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    
    const avgSpeed = 30; // km/h
    const etaMinutes = Math.round((distance / avgSpeed) * 60);
    return etaMinutes;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-[#2A8A8C] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tracking data...</p>
          {jobId && (
            <p className="text-xs text-gray-400 mt-2">Job ID: {jobId}</p>
          )}
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
          {jobId && <p className="text-xs text-gray-500">Job ID: {jobId}</p>}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setErrorMessage(null);
                setLoading(true);
                fetchTrackingData();
              }}
              className="px-6 py-2 bg-[#2A8A8C] text-white rounded-lg"
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/employer')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load tracking data</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchTrackingData();
            }}
            className="mt-4 px-6 py-2 bg-[#2A8A8C] text-white rounded-lg mr-2"
          >
            Retry
          </button>
          <button
            onClick={() => router.push('/employer')}
            className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!trackingData.student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No student assigned to this job</p>
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

  const { job, student, employer } = trackingData;
  const arrivalStatus = job.arrivalStatus || 'en_route';
  const eta = calculateETA(student.location, job.location);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/employer')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <button
              onClick={() => router.push(`/employer/instant-job/${jobId}/manage`)}
              className="flex items-center gap-2 px-4 py-2 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-lg font-semibold transition-colors"
            >
              <FileText className="w-4 h-4" />
              Manage Job
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Student</h1>
          <p className="text-gray-600">{job.jobTitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Student Info & Status */}
          <div className="lg:col-span-1 space-y-6">
            {/* Student Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
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
                  <p className="text-sm text-gray-500">Assigned Student</p>
                </div>
              </div>

              {/* Contact Info */}
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

            {/* Arrival Status Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Arrival Status</h3>
              
              <div className="space-y-4">
                {/* Status Indicator */}
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
                       arrivalStatus === 'arrived' ? 'Arrived - Pending Confirmation' : 
                       'En Route'}
                    </p>
                    {arrivalStatus === 'confirmed' && job.arrivalConfirmedAt && (
                      <p className="text-xs text-gray-500">
                        Confirmed at {new Date(job.arrivalConfirmedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Distance */}
                {student.distanceToJob !== null && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Distance to Job</p>
                    <p className="text-xl font-bold text-[#2A8A8C]">
                      {student.distanceToJob} km
                    </p>
                  </div>
                )}

                {/* ETA */}
                {eta !== null && arrivalStatus === 'en_route' && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Estimated Time</p>
                    <p className="text-xl font-bold text-gray-900">
                      ~{eta} min
                    </p>
                  </div>
                )}

                {/* Confirmation Barrier */}
                {arrivalStatus === 'arrived' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-3">
                      Student has marked themselves as arrived. Please verify and confirm.
                    </p>
                    <button
                      onClick={handleConfirmArrival}
                      disabled={confirmingArrival}
                      className="w-full px-4 py-2 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {confirmingArrival ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Confirm Arrival
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Job Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-[#2A8A8C]" />
                  <span className="text-gray-700">{job.location.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Pay:</span>
                  <span className="font-semibold text-gray-900">{job.pay}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold text-gray-900">{job.duration} hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Map & Location History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Live Location</h3>
              
              {student.location ? (
                <div className="space-y-4">
                  {/* Map Preview */}
                  <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6d_s6X4cxZG1F8g&origin=${student.location.latitude},${student.location.longitude}&destination=${job.location.latitude},${job.location.longitude}`}
                      allowFullScreen
                    />
                  </div>

                  {/* Location Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Student Location</p>
                      <p className="text-sm font-mono text-gray-900">
                        {student.location.latitude.toFixed(6)}, {student.location.longitude.toFixed(6)}
                      </p>
                      <button
                        onClick={() => openMaps(student.location)}
                        className="mt-2 text-xs text-[#2A8A8C] hover:underline flex items-center gap-1"
                      >
                        <Navigation2 className="w-3 h-3" />
                        Open in Maps
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Job Location</p>
                      <p className="text-sm font-mono text-gray-900">
                        {job.location.latitude.toFixed(6)}, {job.location.longitude.toFixed(6)}
                      </p>
                      <button
                        onClick={() => openMaps(job.location)}
                        className="mt-2 text-xs text-[#2A8A8C] hover:underline flex items-center gap-1"
                      >
                        <Navigation2 className="w-3 h-3" />
                        Open in Maps
                      </button>
                    </div>
                  </div>

                  {/* Last Update */}
                  {job.lastLocationUpdate && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Last updated: {new Date(job.lastLocationUpdate).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Location not available</p>
                </div>
              )}
            </div>

            {/* Location History */}
            {job.locationHistory && job.locationHistory.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Location History</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {job.locationHistory.slice(-10).reverse().map((loc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <span className="font-mono text-gray-700">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </span>
                      <span className="text-gray-500">
                        {new Date(loc.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackStudentPage;

