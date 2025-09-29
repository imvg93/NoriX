"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiService } from '../../../../services/api';
import { Shield, Building, Briefcase, CheckCircle, XCircle, Download, ArrowLeft, Clock } from 'lucide-react';

interface EmployerDetailResponse {
  employer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    businessType?: string;
    address?: string;
    userType: string;
    createdAt?: string;
  };
  jobCount: number;
  kyc: {
    status: {
      state: string;
      canResubmit: boolean;
      rejectionReason?: string;
      statusMessage: string;
    };
    record?: {
      _id: string;
      createdAt: string;
      updatedAt: string;
      verificationStatus: string;
      documents?: Record<string, any>;
    } | null;
  };
}

const EmployerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<EmployerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const payload = await apiService.getEmployerDetails<EmployerDetailResponse>(id);
        setData(payload);
      } catch (err: any) {
        console.error('Failed to fetch employer details:', err);
        setError(err?.message || 'Failed to load employer details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-2">Unable to load employer details</h2>
          <p>{error || 'Please try again later or contact support.'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { employer, jobCount, kyc } = data;
  const kycState = kyc?.status?.state || 'not-submitted';

  const kycStatusPill = kycState === 'approved'
    ? 'bg-green-100 text-green-700'
    : kycState === 'pending'
    ? 'bg-yellow-100 text-yellow-700'
    : kycState === 'rejected'
    ? 'bg-red-100 text-red-700'
    : 'bg-gray-100 text-gray-600';

  const documents = kyc?.record?.documents || {};

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-900">Employer Details</h1>
          <p className="text-sm text-gray-600">Comprehensive employer profile with KYC status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{employer.companyName || 'Company Name N/A'}</h2>
              <p className="text-sm text-gray-500">Employer ID: {employer._id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase text-gray-500">Primary Contact</p>
              <p className="text-sm text-gray-800">{employer.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Email</p>
              <p className="text-sm text-gray-800 break-all">{employer.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Phone</p>
              <p className="text-sm text-gray-800">{employer.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Business Type</p>
              <p className="text-sm text-gray-800">{employer.businessType || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Address</p>
              <p className="text-sm text-gray-800 whitespace-pre-line">{employer.address || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Account Created</p>
              <p className="text-sm text-gray-800">{employer.createdAt ? new Date(employer.createdAt).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Job Summary
          </h3>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-orange-50 text-orange-600">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total jobs posted</p>
              <p className="text-2xl font-semibold text-gray-900">{jobCount}</p>
            </div>
          </div>
          <Link
            href={`/employer/jobs`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm"
          >
            Manage Jobs
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">KYC Status</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${kycStatusPill}`}>
            {kycState.toUpperCase()}
          </span>
        </div>

        <p className="text-sm text-gray-700 whitespace-pre-line">{kyc.status?.statusMessage || 'No KYC submissions yet.'}</p>

        {kyc.status?.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <strong>Rejection Reason:</strong> {kyc.status.rejectionReason}
          </div>
        )}

        {kyc.record ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase text-gray-500">Last Submitted</p>
              <p className="text-sm text-gray-800">{new Date(kyc.record.updatedAt || kyc.record.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Verification Status</p>
              <p className="text-sm text-gray-800 capitalize">{kyc.record.verificationStatus}</p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No KYC record found for this employer.</div>
        )}

        {documents && Object.keys(documents).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">Submitted Documents</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(documents).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{value?.status || 'Uploaded'}</p>
                  </div>
                  {value?.url && (
                    <a
                      href={value.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    >
                      <Download className="w-4 h-4" />
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {kycState === 'approved' ? (
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4" />
              KYC Approved
            </span>
          ) : kycState === 'rejected' ? (
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
              <XCircle className="w-4 h-4" />
              KYC Rejected
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 text-yellow-700 text-sm">
              <Clock className="w-4 h-4" />
              KYC Pending/Not Submitted
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EmployerDetailsPage;
