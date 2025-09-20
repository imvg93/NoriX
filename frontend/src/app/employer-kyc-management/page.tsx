'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../../services/api';
import ProtectedRoute from '../../components/ProtectedRoute';
import { ArrowLeft } from 'lucide-react';

interface EmployerKYC {
  _id: string;
  employerId: {
    _id: string;
    name: string;
    email: string;
    companyName: string;
    phone: string;
  };
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  authorizedName?: string;
  designation?: string;
  address?: string;
  city?: string;
  GSTNumber?: string;
  PAN?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: Date;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface EmployerKYCStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const EmployerKYCManagement: React.FC = () => {
  const [kycRecords, setKycRecords] = useState<EmployerKYC[]>([]);
  const [stats, setStats] = useState<EmployerKYCStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState<EmployerKYC | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const itemsPerPage = 10;

  // Fetch Employer KYC data
  const fetchEmployerKYCData = async (page = 1) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching employer KYC data...');
      
      const response = await apiService.getAllKYCRecords(filterStatus === 'all' ? undefined : filterStatus, page, itemsPerPage);
      console.log('📊 Employer KYC response:', response);
      
      // Handle different response formats
      const data = (response as any)?.data || response;
      const records = data?.kycRecords || data?.records || [];
      const pagination = data?.pagination || {};
      
      console.log('📊 KYC records found:', records.length);
      
      setKycRecords(records);
      setCurrentPage(pagination.current || page);
      setTotalPages(pagination.total || Math.ceil(records.length / itemsPerPage));
      
      // Calculate stats
      const statsData = {
        total: records.length,
        pending: records.filter((kyc: EmployerKYC) => kyc.status === 'pending').length,
        approved: records.filter((kyc: EmployerKYC) => kyc.status === 'approved').length,
        rejected: records.filter((kyc: EmployerKYC) => kyc.status === 'rejected').length
      };
      
      setStats(statsData);
    } catch (error) {
      console.error('❌ Error fetching employer KYC data:', error);
      alert(`Failed to fetch employer KYC data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle KYC approval/rejection
  const handleKYCApproval = async () => {
    if (!selectedKYC) return;
    
    try {
      setProcessing(true);
      console.log(`🔍 Processing KYC ${approvalAction} for KYC ID: ${selectedKYC._id}`);
      
      if (approvalAction === 'approve') {
        console.log('✅ Approving employer KYC...');
        const response = await apiService.approveEmployerKYC(selectedKYC._id);
        console.log('📊 KYC approval response:', response);
      } else {
        if (!rejectionReason.trim()) {
          alert('Please provide a rejection reason');
          return;
        }
        console.log('❌ Rejecting employer KYC with reason:', rejectionReason);
        const response = await apiService.rejectEmployerKYC(selectedKYC._id, rejectionReason);
        console.log('📊 KYC rejection response:', response);
      }
      
      // Refresh data
      console.log('🔄 Refreshing KYC data...');
      await fetchEmployerKYCData(currentPage);
      
      // Close modal
      setShowApprovalModal(false);
      setSelectedKYC(null);
      setRejectionReason('');
      
      console.log('✅ KYC approval process completed successfully');
      
    } catch (error) {
      console.error('❌ Error processing KYC approval:', error);
      alert(`Failed to process KYC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  // Open approval modal
  const openApprovalModal = (kyc: EmployerKYC, action: 'approve' | 'reject') => {
    setSelectedKYC(kyc);
    setApprovalAction(action);
    setRejectionReason('');
    setShowApprovalModal(true);
  };

  // Filter records based on search and status
  const filteredRecords = kycRecords.filter(kyc => {
    const matchesSearch = 
      kyc.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.employerId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.employerId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (kyc.authorizedName && kyc.authorizedName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || kyc.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchEmployerKYCData(1);
  }, [filterStatus]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchEmployerKYCData(page);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute requiredUserType="admin">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Employer KYC Management</h1>
                <p className="mt-2 text-gray-600">Manage employer verification requests and approvals</p>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total KYC</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6 mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search KYC Records
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by company name, employer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="sm:w-48">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => fetchEmployerKYCData(currentPage)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Refresh
                </button>
              </div>
            </div>
          </motion.div>

          {/* KYC Records Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading KYC records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600">No KYC records found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact Person
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Business Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRecords.map((kyc) => (
                        <tr key={kyc._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{kyc.companyName}</div>
                              <div className="text-sm text-gray-500">{kyc.companyEmail}</div>
                              <div className="text-sm text-gray-500">{kyc.companyPhone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{kyc.authorizedName}</div>
                              <div className="text-sm text-gray-500">{kyc.designation}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {kyc.address && <div>{kyc.address}</div>}
                              {kyc.city && <div>{kyc.city}</div>}
                              {kyc.GSTNumber && <div>GST: {kyc.GSTNumber}</div>}
                              {kyc.PAN && <div>PAN: {kyc.PAN}</div>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(kyc.status)}`}>
                              {kyc.status.charAt(0).toUpperCase() + kyc.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(kyc.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {kyc.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => openApprovalModal(kyc, 'approve')}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => openApprovalModal(kyc, 'reject')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {kyc.status === 'rejected' && kyc.rejectionReason && (
                                <span className="text-red-600 text-xs" title={kyc.rejectionReason}>
                                  Rejected
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing page <span className="font-medium">{currentPage}</span> of{' '}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Approval Modal */}
          {showApprovalModal && selectedKYC && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {approvalAction === 'approve' ? 'Approve' : 'Reject'} KYC Request
                  </h3>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Company: <span className="font-medium">{selectedKYC.companyName}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Contact: <span className="font-medium">{selectedKYC.authorizedName}</span>
                    </p>
                  </div>

                  {approvalAction === 'reject' && (
                    <div className="mb-4">
                      <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason *
                      </label>
                      <textarea
                        id="rejection-reason"
                        rows={3}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a reason for rejection..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowApprovalModal(false)}
                      disabled={processing}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleKYCApproval}
                      disabled={processing || (approvalAction === 'reject' && !rejectionReason.trim())}
                      className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${
                        approvalAction === 'approve'
                          ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      }`}
                    >
                      {processing ? 'Processing...' : (approvalAction === 'approve' ? 'Approve' : 'Reject')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default EmployerKYCManagement;
