"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Calendar,
  ArrowLeft,
  Eye,
  DollarSign,
  Clock,
  User,
  Briefcase
} from 'lucide-react';
import { apiService } from '../../../services/api';

interface ApprovedApplication {
  _id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salaryRange: string;
  workType: string;
  description: string;
  status: string;
  approvedDate: string;
  appliedDate: string;
  jobId: string;
  employerContact: {
    name: string;
    companyName: string;
    phone: string;
    address: string;
    email: string;
    businessType: string;
  };
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ApprovedApplicationsPage = () => {
  const router = useRouter();
  const [applications, setApplications] = useState<ApprovedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchApprovedApplications = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await apiService.getApprovedApplicationsWithContact(20);
        setApplications(response.applications || []);
      } catch (err: any) {
        console.error('Error fetching approved applications:', err);
        setError(err.message || 'Failed to load approved applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedApplications();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A8A8C] mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading approved applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-3 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Approved Applications</h1>
              <p className="text-sm text-gray-600 mt-1">{applications.length} approved {applications.length === 1 ? 'application' : 'applications'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Applications List */}
        {applications.length === 0 && !error ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">No approved applications yet</h3>
            <p className="text-sm text-gray-500 mb-4">Keep applying to jobs! Once employers approve your applications, you'll see their contact details here.</p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-colors text-sm"
            >
              <Briefcase className="w-4 h-4" />
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {applications.map((application, index) => (
              <motion.div
                key={application._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-[#2A8A8C] flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900 text-base line-clamp-1">{application.jobTitle}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{application.companyName}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {application.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {application.workType}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-[#2A8A8C]/10 text-[#2A8A8C] rounded-full text-xs font-medium whitespace-nowrap">
                    Approved
                  </span>
                </div>

                {/* Job Details - Compact */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-600 mb-0.5">Salary</p>
                    <p className="text-sm font-medium text-gray-900">{application.salaryRange}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-600 mb-0.5">Approved</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(application.approvedDate)}</p>
                  </div>
                </div>

                {/* Employer Contact - Compact */}
                <div className="bg-[#2A8A8C]/5 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <User className="w-3.5 h-3.5 text-[#2A8A8C]" />
                    <h4 className="text-xs font-semibold text-[#2A8A8C] uppercase tracking-wide">Contact Details</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">{application.employerContact.name}</span>
                    </div>
                    
                    {application.employerContact.phone !== 'Not provided' && (
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <a 
                          href={`tel:${application.employerContact.phone}`}
                          className="text-[#2A8A8C] hover:text-[#1f6a6c] hover:underline"
                        >
                          {application.employerContact.phone}
                        </a>
                      </div>
                    )}
                    
                    {application.employerContact.email !== 'Not provided' && (
                      <div className="flex items-center gap-2 text-xs">
                        <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <a 
                          href={`mailto:${application.employerContact.email}`}
                          className="text-[#2A8A8C] hover:text-[#1f6a6c] hover:underline truncate"
                        >
                          {application.employerContact.email}
                        </a>
                      </div>
                    )}
                    
                    {application.employerContact.address !== 'Not provided' && (
                      <div className="flex items-start gap-2 text-xs">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 line-clamp-2">{application.employerContact.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => router.push(`/jobs/${application.jobId}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-colors text-xs font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Job
                  </button>
                  
                  {application.employerContact.phone !== 'Not provided' && (
                    <a
                      href={`tel:${application.employerContact.phone}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  )}
                  
                  {application.employerContact.email !== 'Not provided' && (
                    <a
                      href={`mailto:${application.employerContact.email}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovedApplicationsPage;
