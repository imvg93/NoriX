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
  Star,
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approved applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Approved Applications</h1>
              <p className="text-gray-600">Congratulations! Here are your approved job applications with employer contact details</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{applications.length} approved applications</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Applications List */}
        <div className="space-y-6">
          {applications.map((application, index) => (
            <motion.div
              key={application._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{application.jobTitle}</h3>
                    <p className="text-gray-600 font-medium">{application.companyName}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {application.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {application.workType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Approved
                  </span>
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Salary Range</h4>
                  <p className="text-gray-900 font-semibold">{application.salaryRange}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Approved Date</h4>
                  <p className="text-gray-900">{new Date(application.approvedDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Job Description */}
              {application.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Job Description</h4>
                  <p className="text-gray-600 bg-gray-50 rounded-xl p-4">{application.description}</p>
                </div>
              )}

              {/* Employer Contact Details */}
              <div className="bg-green-50 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-green-600" />
                  <h4 className="text-lg font-semibold text-green-800">Employer Contact Details</h4>
                  <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                    Available after approval
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Contact Person</p>
                        <p className="font-medium text-gray-900">{application.employerContact.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Company</p>
                        <p className="font-medium text-gray-900">{application.employerContact.companyName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Phone Number</p>
                        <p className="font-medium text-gray-900">
                          {application.employerContact.phone !== 'Not provided' ? (
                            <a 
                              href={`tel:${application.employerContact.phone}`}
                              className="text-green-600 hover:text-green-700 underline"
                            >
                              {application.employerContact.phone}
                            </a>
                          ) : (
                            <span className="text-gray-500">Not provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">
                          {application.employerContact.email !== 'Not provided' ? (
                            <a 
                              href={`mailto:${application.employerContact.email}`}
                              className="text-green-600 hover:text-green-700 underline"
                            >
                              {application.employerContact.email}
                            </a>
                          ) : (
                            <span className="text-gray-500">Not provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium text-gray-900">{application.employerContact.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Business Type</p>
                        <p className="font-medium text-gray-900">{application.employerContact.businessType}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => router.push(`/jobs/${application.jobId}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Job Details
                </button>
                
                {application.employerContact.phone !== 'Not provided' && (
                  <a
                    href={`tel:${application.employerContact.phone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Call Employer
                  </a>
                )}
                
                {application.employerContact.email !== 'Not provided' && (
                  <a
                    href={`mailto:${application.employerContact.email}`}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Email Employer
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* No Applications Found */}
        {applications.length === 0 && !error && (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No approved applications yet</h3>
            <p className="text-gray-500 mb-6">Keep applying to jobs! Once employers approve your applications, you'll see their contact details here.</p>
            <button
              onClick={() => router.push('/student-home')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Briefcase className="w-5 h-5" />
              Browse Jobs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovedApplicationsPage;
