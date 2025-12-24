"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader, AlertCircle, Zap, MapPin, Clock, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import { apiService } from '../../../services/api';

interface HistoryJob {
  _id: string;
  jobTitle?: string;
  jobType?: string;
  pay?: string;
  duration?: number;
  status: string;
  createdAt?: string;
  completedAt?: string;
  arrivalStatus?: string;
  completionRequestedAt?: string;
  location?: {
    address?: string;
  };
}

const StudentInstantJobPage = () => {
  const [currentJob, setCurrentJob] = useState<HistoryJob | null>(null);
  const [completedJobs, setCompletedJobs] = useState<HistoryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [requestingCompletion, setRequestingCompletion] = useState(false);
  const [confirmingArrival, setConfirmingArrival] = useState(false);

  const loadJobs = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setError('Please log in to view your instant jobs.');
        return;
      }

      const hist = await apiService.getStudentInstantHistory({ includeActive: true, limit: 50 });
      const allJobs: HistoryJob[] = hist?.data?.jobs || hist?.jobs || [];

      // Separate active and completed jobs
      const activeStatuses = new Set(['locked', 'in_progress', 'dispatching']);
      const completedStatuses = new Set(['completed', 'cancelled', 'expired', 'failed']);

      const active = allJobs.find(j => activeStatuses.has(j.status));
      const completed = allJobs.filter(j => completedStatuses.has(j.status));

      setCurrentJob(active || null);
      setCompletedJobs(completed);
    } catch (err: any) {
      console.error('Error loading instant jobs:', err);
      setError(err.message || 'Unable to load instant jobs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // Auto-refresh every 5 seconds to check for job completion
    const interval = setInterval(() => {
      loadJobs(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen for job completion via Socket.IO
  useEffect(() => {
    if (!currentJob?._id) return;

    const initSocket = async () => {
      try {
        const socketService = (await import('../../../services/socketService')).default;
        const socket = (socketService as any).getSocket?.() || (socketService as any).socket;

        const handleJobCompleted = (data: any) => {
          console.log('🎉 Job completed event received:', data);
          if (data.jobId === currentJob._id) {
            // Show success message
            setTimeout(() => {
              alert('🎉 Congratulations! Job Completed!\n\nThe employer has confirmed your work. Payment has been released and will be in your account soon.\n\nThank you for using NoriX!');
            }, 500);
            // Refresh jobs list
            loadJobs(false);
          }
        };

        if (socket) {
          socket.on('job:completed', handleJobCompleted);
          socket.on('student:job_completed', handleJobCompleted);
          return () => {
            socket.off('job:completed', handleJobCompleted);
            socket.off('student:job_completed', handleJobCompleted);
          };
        }
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    initSocket();
  }, [currentJob?._id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs(false);
  };

  const handleRequestCompletion = async () => {
    if (!currentJob) return;
    
    setRequestingCompletion(true);
    try {
      await (apiService.requestInstantJobCompletion(currentJob._id) as Promise<any>);
      alert('✅ Work completion requested! Waiting for employer approval. You will be notified once confirmed.');
      loadJobs(false);
    } catch (err: any) {
      console.error('Error requesting completion:', err);
      alert(err.response?.data?.message || 'Failed to request completion. Please try again.');
    } finally {
      setRequestingCompletion(false);
    }
  };

  const handleConfirmArrival = async () => {
    if (!currentJob) return;
    
    setConfirmingArrival(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/instant-jobs/${currentJob._id}/confirm-arrival`, {
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

      alert('✅ Arrival confirmed! The employer will be notified.');
      loadJobs(false);
    } catch (err: any) {
      console.error('Error confirming arrival:', err);
      alert(err.message || 'Failed to confirm arrival. Please try again.');
    } finally {
      setConfirmingArrival(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'locked':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'failed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'locked':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      case 'dispatching':
        return 'Finding Match';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-[#2A8A8C] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your instant jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#2A8A8C] text-white flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Instant Jobs</h1>
                <p className="text-sm text-gray-600">Your on-demand work dashboard</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Job Completed Success Message */}
        {currentJob && currentJob.status === 'completed' && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-2xl shadow-lg overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <div className="p-6 sm:p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">🎉 Job Completed!</h2>
                <p className="text-base sm:text-lg text-gray-700 mb-2 font-semibold">
                  Congratulations! The employer has confirmed your work.
                </p>
                <p className="text-gray-600 mb-4">
                  💰 Payment of <span className="font-bold text-green-600">{currentJob.pay}</span> has been released
                </p>
                <div className="bg-white rounded-xl p-4 mb-4 border border-green-200">
                  <h3 className="font-bold text-gray-900 mb-3 text-base">📋 Next Steps:</h3>
                  <ul className="text-sm text-gray-700 space-y-2 text-left max-w-md mx-auto">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Payment will be deposited to your account within 24-48 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Check your email for payment confirmation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Your profile rating has been updated</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Turn on availability for more instant jobs!</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 bg-[#2A8A8C] text-white rounded-xl hover:bg-[#238085] transition-colors font-semibold shadow-md"
                >
                  Close & Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Active Job */}
        {currentJob && currentJob.status !== 'completed' ? (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Active Job
            </h2>
            <div className="bg-white border-2 border-[#2A8A8C] rounded-xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentJob.jobTitle || currentJob.jobType || 'Instant Job'}
                  </h3>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    {currentJob.pay && (
                      <span className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-700">{currentJob.pay}</span>
                      </span>
                    )}
                    {currentJob.duration && (
                      <span className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-blue-700">{currentJob.duration} hours</span>
                      </span>
                    )}
                    {currentJob.location?.address && (
                      <span className="flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-full">
                        <MapPin className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-purple-700 truncate max-w-[200px]">
                          {currentJob.location.address}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(currentJob.status)}`}>
                  {getStatusLabel(currentJob.status)}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                {/* I've Arrived Button - Show when job is locked (assigned) */}
                {currentJob.status === 'locked' && (
                  <button
                    onClick={handleConfirmArrival}
                    disabled={confirmingArrival}
                    className="w-full px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl transition-all font-bold text-lg shadow-lg disabled:opacity-70 flex items-center justify-center gap-3 transform hover:scale-[1.02]"
                  >
                    <MapPin className="w-6 h-6" />
                    {confirmingArrival ? 'Confirming...' : "I've Arrived"}
                  </button>
                )}

                {/* Work Completed Button - Only show for in_progress, always visible, disabled after requested */}
                {currentJob.status === 'in_progress' && (
                  <button
                    onClick={handleRequestCompletion}
                    disabled={requestingCompletion || !!currentJob.completionRequestedAt}
                    className={`w-full px-8 py-4 ${
                      currentJob.completionRequestedAt
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                    } text-white rounded-xl transition-all font-bold text-lg shadow-lg disabled:opacity-70 flex items-center justify-center gap-3 transform hover:scale-[1.02]`}
                  >
                    <CheckCircle className="w-6 h-6" />
                    {currentJob.completionRequestedAt
                      ? '✅ Completion Requested'
                      : requestingCompletion
                        ? 'Requesting...'
                        : 'Work Completed'}
                  </button>
                )}
                
                {/* Status Info */}
                {currentJob.completionRequestedAt && (
                  <div className="w-full bg-yellow-50 border-2 border-yellow-300 rounded-xl px-6 py-3 text-center">
                    <p className="text-sm font-bold text-yellow-900">⏱️ Waiting for Employer Approval</p>
                    <p className="text-xs text-yellow-700 mt-1">The employer will confirm your work completion shortly</p>
                  </div>
                )}

                {currentJob.status === 'locked' && (
                  <div className="w-full bg-blue-50 border-2 border-blue-300 rounded-xl px-6 py-3 text-center">
                    <p className="text-sm font-bold text-blue-900">📍 On Your Way to Job Location</p>
                    <p className="text-xs text-blue-700 mt-1">Tap "I've Arrived" button above when you reach the location</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : !currentJob ? (
          <div className="mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Instant Job</h3>
              <p className="text-sm text-gray-600">
                Turn on your availability to receive instant job pings!
              </p>
            </div>
          </div>
        ) : null}

        {/* Job History */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Job History</h2>
          {completedJobs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No completed jobs yet</p>
              <p className="text-sm text-gray-500 mt-1">Your job history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedJobs.map((job) => (
                <div
                  key={job._id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {job.jobTitle || job.jobType || 'Instant Job'}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        {job.pay && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            {job.pay}
                          </span>
                        )}
                        {job.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            {job.duration} hours
                          </span>
                        )}
                        {job.location?.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="truncate max-w-[200px]">{job.location.address}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(job.status)}`}>
                      {getStatusLabel(job.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      {job.completedAt ? (
                        <span>
                          Completed: {new Date(job.completedAt).toLocaleDateString()} at{' '}
                          {new Date(job.completedAt).toLocaleTimeString()}
                        </span>
                      ) : job.createdAt ? (
                        <span>
                          Created: {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span>No date available</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {(currentJob || completedJobs.length > 0) && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{completedJobs.filter(j => j.status === 'completed').length}</p>
              <p className="text-xs text-gray-600 mt-1">Completed</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{completedJobs.filter(j => j.status === 'cancelled').length}</p>
              <p className="text-xs text-gray-600 mt-1">Cancelled</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{currentJob ? 1 : 0}</p>
              <p className="text-xs text-gray-600 mt-1">Active</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{completedJobs.length + (currentJob ? 1 : 0)}</p>
              <p className="text-xs text-gray-600 mt-1">Total</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentInstantJobPage;
