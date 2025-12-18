"use client";

import React from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Briefcase,
  CheckCircle,
  Shield,
  Building,
  ArrowRight
} from 'lucide-react';

const ACCENT = "#2A8A8D";

export interface JobCardProps {
  job: {
    _id: string;
    jobTitle?: string;
    title?: string;
    jobCategory?: string;
    category?: string;
    workType?: string;
    type?: string;
    location?: string;
    salaryRange?: string;
    salary?: number | string;
    payType?: string;
    expectedDuration?: string;
    durationUnit?: string;
    jobType?: 'job' | 'task';
    employerCategory?: 'corporate' | 'local_business' | 'individual';
    companyName?: string;
    company?: string;
    description?: string;
    createdAt?: string;
    highlighted?: boolean;
    status?: string;
    approvalStatus?: string;
  };
  viewerRole?: 'student' | 'employer' | 'admin';
  showActions?: boolean;
  isApplied?: boolean;
  onApply?: () => void;
  className?: string;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  viewerRole = 'student',
  showActions = true,
  isApplied = false,
  onApply,
  className = ''
}) => {
  // Normalize job data
  const jobTitle = job.jobTitle || job.title || 'Untitled Job';
  const category = job.jobCategory || job.category || 'General';
  const workType = job.workType || job.type || 'On-site';
  const location = job.location || '';
  const salaryRange = job.salaryRange || (job.salary ? `₹${job.salary}` : 'Not specified');
  const expectedDuration = job.expectedDuration;
  const durationUnit = job.durationUnit || 'hours';
  
  // Determine job type category
  // Priority: employerCategory > jobType > default
  const jobTypeCategory: 'corporate' | 'local' | 'individual' = 
    job.employerCategory === 'corporate' 
      ? 'corporate'
      : job.employerCategory === 'local_business'
      ? 'local'
      : job.employerCategory === 'individual'
      ? 'individual'
      : job.jobType === 'task'
      ? 'individual'
      : 'corporate'; // Default to corporate for 'job' type

  // Format payment display
  const formatPayment = () => {
    if (salaryRange.includes('/')) return salaryRange;
    if (job.payType) {
      return `${salaryRange}/${job.payType}`;
    }
    return salaryRange;
  };

  // Format duration display
  const formatDuration = () => {
    if (!expectedDuration) return null;
    if (durationUnit === 'ongoing') return 'Ongoing';
    return `${expectedDuration} ${durationUnit}`;
  };

  // Get job type badge label
  const getJobTypeBadge = () => {
    switch (jobTypeCategory) {
      case 'corporate':
        return 'Corporate';
      case 'local':
        return 'Local Business';
      case 'individual':
        return 'Individual';
      default:
        return 'Job';
    }
  };

  // Conditional badges and notes based on job type
  const getConditionalContent = () => {
    switch (jobTypeCategory) {
      case 'corporate':
        return {
          badge: { label: 'Verified Employer', icon: CheckCircle },
          note: 'Payment released after employer approval',
          tone: 'professional'
        };
      case 'local':
        return {
          badge: null,
          note: null,
          tone: 'practical'
        };
      case 'individual':
        return {
          badge: { label: 'Identity verified', icon: Shield },
          note: 'Escrow-protected payment',
          tone: 'simple'
        };
      default:
        return {
          badge: null,
          note: null,
          tone: 'professional'
        };
    }
  };

  const conditionalContent = getConditionalContent();
  const BadgeIcon = conditionalContent.badge?.icon;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-all ${className}`}>
      {/* Header: Badges and Job Type */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Job Type Badge */}
          <span 
            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded"
            style={{ 
              backgroundColor: `${ACCENT}15`,
              color: ACCENT 
            }}
          >
            {getJobTypeBadge()}
          </span>

          {/* Conditional Badge */}
          {conditionalContent.badge && BadgeIcon && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-50 rounded">
              <BadgeIcon className="w-3 h-3" />
              {conditionalContent.badge.label}
            </span>
          )}
        </div>

        {/* Work Type */}
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {workType}
        </span>
      </div>

      {/* Job Title */}
      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
        {jobTitle}
      </h3>

      {/* Category */}
      <div className="mb-4">
        <span className="text-sm text-gray-600">{category}</span>
      </div>

      {/* Core Fields Grid */}
      <div className="space-y-3 mb-4">
        {/* Location (only if applicable) */}
        {location && workType !== 'Remote' && (
          <div className={`flex items-center gap-2 text-sm ${jobTypeCategory === 'local' ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        )}

        {/* Payment */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="font-medium">{formatPayment()}</span>
        </div>

        {/* Expected Duration */}
        {formatDuration() && (
          <div className={`flex items-center gap-2 text-sm ${jobTypeCategory === 'local' ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{formatDuration()}</span>
          </div>
        )}
      </div>

      {/* Conditional Note */}
      {conditionalContent.note && (
        <div className="mb-4 p-2.5 bg-gray-50 border border-gray-100 rounded text-xs text-gray-600">
          {conditionalContent.note}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {viewerRole === 'student' ? (
            isApplied ? (
              <span className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded">
                Applied
              </span>
            ) : (
              <Link
                href={`/jobs/${job._id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded transition-all hover:opacity-90"
                style={{ backgroundColor: ACCENT }}
              >
                View Details
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )
          ) : (
            <Link
              href={`/jobs/${job._id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded transition-all hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              View Details
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default JobCard;

