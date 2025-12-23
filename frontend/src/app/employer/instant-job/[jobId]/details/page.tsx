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

const InstantJobDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  const { user } = useAuth();
  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
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
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setLoading(false);
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
            onClick={() => router.push('/employer')}
            className="px-6 py-2 bg-[#2A8A8C] text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { job, student, employer } = jobData;

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
          <p className="text-gray-600">{job?.jobTitle || 'Instant Job'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Job Title</label>
                  <p className="text-lg text-gray-900 mt-1">{job?.jobTitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Pay
                    </label>
                    <p className="text-lg font-semibold text-[#2A8A8C] mt-1">{job?.pay}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Duration
                    </label>
                    <p className="text-lg text-gray-900 mt-1">{job?.duration} hours</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <p className="text-gray-900 mt-1">{job?.location?.address}</p>
                  {job?.location && (
                    <button
                      onClick={() => openMaps(job.location)}
                      className="mt-2 text-sm text-[#2A8A8C] hover:underline flex items-center gap-1"
                    >
                      <Navigation2 className="w-3 h-3" />
                      Open in Maps
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created At
                  </label>
                  <p className="text-gray-900 mt-1">
                    {job?.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                      job?.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      job?.status === 'locked' ? 'bg-yellow-100 text-yellow-800' :
                      job?.status === 'dispatching' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job?.status || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Student */}
            {student && (
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
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {job?.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => router.push(`/employer/instant-job/${jobId}/manage`)}
                      className="w-full px-4 py-2 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Manage Job
                    </button>
                    <button
                      onClick={() => router.push(`/employer/instant-job/${jobId}/track`)}
                      className="w-full px-4 py-2 bg-white border-2 border-[#2A8A8C] text-[#2A8A8C] hover:bg-[#2A8A8C] hover:text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Navigation2 className="w-4 h-4" />
                      Track Student
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Job Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Job Type:</span>
                  <span className="font-semibold text-gray-900">Instant</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold capitalize">{job?.status || 'N/A'}</span>
                </div>
                {job?.acceptedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accepted:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(job.acceptedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstantJobDetailsPage;

