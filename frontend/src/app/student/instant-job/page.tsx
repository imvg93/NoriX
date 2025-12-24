"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader, AlertCircle, Zap, MapPin, Clock, CheckCircle, ArrowRight, Calendar, DollarSign } from 'lucide-react';
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
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs(false);
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

        {/* Current Active Job */}
        {currentJob ? (
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
                <Link
                  href={`/student/instant-job/${currentJob._id}/manage`}
                  className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2A8A8C] text-white rounded-xl hover:bg-[#238085] transition-colors font-semibold shadow-md"
                >
                  Manage Job
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Instant Job</h3>
              <p className="text-sm text-gray-600">
                Turn on your availability to receive instant job pings!
              </p>
            </div>
          </div>
        )}

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
