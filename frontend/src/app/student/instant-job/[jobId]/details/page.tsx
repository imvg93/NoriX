"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  User,
  Phone,
  CheckCircle,
  FileText,
  Calendar,
  Building,
  Navigation2,
  Copy
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';

const StudentInstantJobDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  const { user } = useAuth();
  const [jobData, setJobData] = useState<any>(null);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    fetchJobDetails();
    fetchContactInfo();
  }, [jobId]);

  const fetchJobDetails = async () => {
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
        setJobData(data.data);
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#2A8A8C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Job not found</p>
          <button
            onClick={() => router.push('/student')}
            className="px-6 py-2 bg-[#2A8A8C] text-white rounded-lg"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Details</h1>
          <p className="text-gray-600">{jobData.jobLocation?.address || 'Instant Job'}</p>
        </div>

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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Pay
                    </label>
                    <p className="text-lg font-semibold text-[#2A8A8C] mt-1">As discussed</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Duration
                    </label>
                    <p className="text-lg text-gray-900 mt-1">Flexible</p>
                  </div>
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

                  {contactInfo.location && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#2A8A8C]" />
                        Employer Location
                      </label>
                      <p className="text-gray-900 mt-1">
                        {contactInfo.location.latitude.toFixed(6)}, {contactInfo.location.longitude.toFixed(6)}
                      </p>
                      <button
                        onClick={() => openMaps(contactInfo.location)}
                        className="mt-2 text-sm text-[#2A8A8C] hover:underline flex items-center gap-1"
                      >
                        <Navigation2 className="w-3 h-3" />
                        Open in Maps
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/student/instant-job/${jobId}/manage`)}
                  className="w-full px-4 py-2 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Manage Job
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentInstantJobDetailsPage;

