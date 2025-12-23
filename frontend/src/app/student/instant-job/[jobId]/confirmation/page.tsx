"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CheckCircle,
  MapPin,
  Navigation2,
  Phone,
  Copy,
  ArrowRight,
  Clock,
  User,
  FileText,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';

const JobConfirmationPage = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  const { user } = useAuth();
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    fetchContactInfo();
    fetchJobData();
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
        setContactInfo(data.data.contact);
        setJobData(data.data);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    } finally {
      setLoading(false);
    }
  };

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
        setJobData(data.data);
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const openMaps = (location: { latitude: number; longitude: number }) => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  const openDirections = (location: { latitude: number; longitude: number }) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const url = `https://www.google.com/maps/dir/${position.coords.latitude},${position.coords.longitude}/${location.latitude},${location.longitude}`;
          window.open(url, '_blank');
        },
        () => {
          // Fallback if location permission denied
          const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
          window.open(url, '_blank');
        }
      );
    } else {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A8A8C] via-[#238085] to-[#1d6d71] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!contactInfo || !jobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Job information not found</p>
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

  const workLocation = jobData.jobLocation || contactInfo.location;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A8A8C] via-[#238085] to-[#1d6d71]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg"
          >
            <CheckCircle className="w-12 h-12 text-[#2A8A8C]" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">Job Confirmed!</h1>
          <p className="text-white/90 text-lg">You've been assigned to this job</p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Important Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-yellow-900 mb-1">Come to the Work Location</h3>
                <p className="text-yellow-800 text-sm">
                  Please proceed to the work location shown below. The employer is expecting you there.
                </p>
              </div>
            </div>
          </div>

          {/* Work Location Section - Prominent */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[#2A8A8C] rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Location</h2>
                {jobData.jobLocation?.address && (
                  <p className="text-lg text-gray-700 mb-3">{jobData.jobLocation.address}</p>
                )}
                {workLocation && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => openDirections(workLocation)}
                      className="px-6 py-3 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg"
                    >
                      <Navigation2 className="w-5 h-5" />
                      Get Directions
                    </button>
                    <button
                      onClick={() => openMaps(workLocation)}
                      className="px-6 py-3 bg-white border-2 border-[#2A8A8C] text-[#2A8A8C] hover:bg-[#2A8A8C] hover:text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
                    >
                      <MapPin className="w-5 h-5" />
                      View on Map
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Map Embed */}
            {workLocation && (
              <div className="mt-4 rounded-xl overflow-hidden border-2 border-gray-200">
                <iframe
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDummyKey'}&q=${workLocation.latitude},${workLocation.longitude}`}
                />
              </div>
            )}
          </div>

          {/* Employer Contact */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#2A8A8C]" />
              Employer Contact
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-semibold text-gray-900">{contactInfo.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#2A8A8C]" />
                  Phone:
                </span>
                <div className="flex items-center gap-2">
                  <a 
                    href={`tel:${contactInfo.phone}`}
                    className="text-sm font-semibold text-[#2A8A8C] hover:underline"
                  >
                    {contactInfo.phone}
                  </a>
                  <button
                    onClick={() => copyToClipboard(contactInfo.phone)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy phone number"
                  >
                    <Copy className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Job Details */}
          {jobData.job && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Job Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Job Title:</span>
                  <p className="text-sm font-semibold text-gray-900">{jobData.job.jobTitle || 'Instant Job'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Pay:</span>
                  <p className="text-sm font-semibold text-gray-900">{jobData.job.pay || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Duration:</span>
                  <p className="text-sm font-semibold text-gray-900">{jobData.job.duration || 'N/A'} hours</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <p className="text-sm font-semibold text-green-600 capitalize">Confirmed</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-6 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Next Steps</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#2A8A8C]">1.</span>
                <span>Navigate to the work location using the directions button above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#2A8A8C]">2.</span>
                <span>Once you arrive, tap "I've Arrived" in the manage page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#2A8A8C">3.</span>
                <span>Wait for employer confirmation before starting work</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#2A8A8C]">4.</span>
                <span>Contact the employer if you have any questions</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-white border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push(`/student/instant-job/${jobId}/manage`)}
                className="flex-1 px-6 py-3 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <FileText className="w-5 h-5" />
                Manage Job
              </button>
              {contactInfo.phone && (
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="flex-1 px-6 py-3 bg-white border-2 border-[#2A8A8C] text-[#2A8A8C] hover:bg-[#2A8A8C] hover:text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Call Employer
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Back to Dashboard */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/student')}
            className="text-white/80 hover:text-white text-sm transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobConfirmationPage;

