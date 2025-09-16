'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home, CheckCircle, XCircle, Clock, RefreshCw, Eye, User, Mail, Phone, Calendar, MapPin, GraduationCap, Users, FileText, TrendingUp, Shield, Globe, Star, Award, Zap, ChevronDown, ChevronUp, Menu, X, Download, Filter, Search, MoreVertical, Settings, Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedKYC, setSelectedKYC] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== 'admin') {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.get('/admin/dashboard-data') as any;
      setData(response.data.data);
      
    } catch (err: any) {
      setError(apiService.handleError(err));
    } finally {
      setLoading(false);
    }
  };

  const updateKYCStatus = async (kycId: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      setUpdatingStatus(kycId);
      
      const endpoint = `/admin/kyc/${kycId}/${status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'pending'}`;
      await apiService.put(endpoint, status === 'rejected' ? { reason: 'Rejected by admin' } : {});
      
      // Update the local data immediately for real-time UI update
      if (data) {
        const updatedKYCData = data.kycData.map((kyc: any) => 
          kyc._id === kycId 
            ? { ...kyc, status, verificationStatus: status }
            : kyc
        );
        setData({ ...data, kycData: updatedKYCData });
      }
      
    } catch (err: any) {
      setError(apiService.handleError(err));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const exportStudentData = () => {
    if (!data?.kycData) return;
    
    // Prepare CSV data
    const csvHeaders = [
      'Student Name',
      'Email',
      'Phone',
      'College',
      'Course & Year',
      'Status',
      'Submitted Date',
      'Approved Date',
      'Rejected Date',
      'Rejection Reason',
      'Aadhar Card',
      'College ID',
      'Hours/Week',
      'Available Days',
      'Stay Type',
      'Preferred Job Types',
      'Experience & Skills',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Payroll Consent',
      'Bank Account',
      'IFSC Code',
      'Beneficiary Name',
      'Account Name',
      'Email Verified',
      'Phone Verified',
      'Account Status',
      'Skills'
    ];
    
    const csvData = data.kycData.map((student: any) => [
      student.studentName || '',
      student.studentEmail || '',
      student.studentPhone || '',
      student.college || '',
      student.courseYear || '',
      student.status || student.verificationStatus || '',
      student.submittedAt ? new Date(student.submittedAt).toLocaleDateString() : '',
      student.approvedAt ? new Date(student.approvedAt).toLocaleDateString() : '',
      student.rejectedAt ? new Date(student.rejectedAt).toLocaleDateString() : '',
      student.rejectionReason || '',
      student.documents?.aadharCard ? 'Yes' : 'No',
      student.documents?.collegeIdCard ? 'Yes' : 'No',
      student.availability?.hoursPerWeek || '',
      student.availability?.availableDays?.join(', ') || '',
      student.availability?.stayType || '',
      student.jobPreferences?.preferredJobTypes?.join(', ') || '',
      student.jobPreferences?.experienceSkills || '',
      student.emergencyContact?.name || '',
      student.emergencyContact?.phone || '',
      student.payroll?.consent ? 'Yes' : 'No',
      student.payroll?.bankAccount ? '***' + student.payroll.bankAccount.slice(-4) : '',
      student.payroll?.ifsc || '',
      student.payroll?.beneficiaryName || '',
      student.userDetails?.name || '',
      student.userDetails?.emailVerified ? 'Yes' : 'No',
      student.userDetails?.phoneVerified ? 'Yes' : 'No',
      student.userDetails?.isActive ? 'Active' : 'Inactive',
      student.userDetails?.skills?.join(', ') || ''
    ]);
    
    // Create CSV content
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map((field: any) => `"${field}"`).join(','))
      .join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `student_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'in-review': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in-review': return <RefreshCw className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  // Filter students based on search and status
  const filteredStudents = data?.kycData?.filter((student: any) => {
    const matchesSearch = !searchTerm || 
      student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.college?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (student.status || student.verificationStatus) === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium text-lg">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Clean Professional Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Header */}
          <div className="flex items-center justify-between py-4 lg:hidden">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800">Admin Portal</h1>
                <p className="text-xs text-slate-500">KYC Management</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center py-5">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  Admin Dashboard
                </h1>
                <p className="text-slate-500">Student KYC Verification Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => window.history.back()} 
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <Link 
                href="/admin-home" 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Admin Home
              </Link>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden pb-4 border-t border-slate-200">
              <div className="flex flex-col space-y-2 pt-4">
                <button 
                  onClick={() => window.history.back()} 
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <Link 
                  href="/admin-home" 
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Admin Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-5 h-5 text-red-500 mr-3">⚠️</div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Clean Tab Navigation */}
            <div className="bg-white rounded-lg border border-slate-200 p-1">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
                    activeTab === 'students'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Students ({data.kycData?.length || 0})</span>
                </button>
              </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Clean Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Total Students</p>
                        <p className="text-2xl font-semibold text-slate-800 mt-1">{data.statistics?.users?.students || 0}</p>
                        <p className="text-xs text-emerald-600 mt-1">+12% from last month</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Pending Review</p>
                        <p className="text-2xl font-semibold text-amber-600 mt-1">{data.statistics?.kyc?.pending || 0}</p>
                        <p className="text-xs text-amber-600 mt-1">Needs attention</p>
                      </div>
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Approved</p>
                        <p className="text-2xl font-semibold text-emerald-600 mt-1">{data.statistics?.kyc?.approved || 0}</p>
                        <p className="text-xs text-emerald-600 mt-1">Ready for jobs</p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Approval Rate</p>
                        <p className="text-2xl font-semibold text-blue-600 mt-1">
                          {data.statistics?.kyc?.approvalRate || '0'}%
                        </p>
                        <p className="text-xs text-blue-600 mt-1">Quality maintained</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clean Quick Actions */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setActiveTab('students')}
                      className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-slate-800">Review Students</p>
                        <p className="text-sm text-slate-500">Manage KYC submissions</p>
                      </div>
                    </button>
                    <button 
                      onClick={exportStudentData}
                      className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    >
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Download className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-slate-800">Export Data</p>
                        <p className="text-sm text-slate-500">Download CSV report</p>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-slate-800">Global View</p>
                        <p className="text-sm text-slate-500">International insights</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="space-y-6">
                {/* Clean Search and Filter Bar */}
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search students by name, email, or college..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="in-review">In Review</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Clean Students List */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Student KYC Submissions
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Manage and review student verification documents</p>
                  </div>
                  
                  <div className="divide-y divide-slate-200">
                    {filteredStudents.map((kyc: any, index: number) => (
                      <div key={kyc._id} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="space-y-4">
                          {/* Clean Header Row */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold">
                                {kyc.studentName?.charAt(0) || 'S'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-slate-800">{kyc.studentName}</h4>
                                <p className="text-sm text-slate-600">{kyc.studentEmail}</p>
                                <p className="text-xs text-slate-500">{kyc.college}</p>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 ${getStatusColor(kyc.status || kyc.verificationStatus)}`}>
                              {getStatusIcon(kyc.status || kyc.verificationStatus)}
                              <span>{(kyc.status || kyc.verificationStatus)?.toUpperCase() || 'PENDING'}</span>
                            </div>
                          </div>

                          {/* Clean Information Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                              <GraduationCap className="w-4 h-4 text-slate-400" />
                              <span>{kyc.courseYear}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span>{new Date(kyc.submittedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span>{kyc.availability?.hoursPerWeek || 'N/A'} hrs/week</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span>
                                {kyc.documents?.aadharCard ? '✓' : '✗'} Aadhar
                                {kyc.documents?.collegeIdCard ? ' ✓' : ' ✗'} College ID
                              </span>
                            </div>
                          </div>

                          {/* Clean Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => {
                                setSelectedKYC(kyc);
                                setShowDetails(true);
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateKYCStatus(kyc._id, 'approved')}
                                disabled={updatingStatus === kyc._id}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => updateKYCStatus(kyc._id, 'rejected')}
                                disabled={updatingStatus === kyc._id}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                              <button
                                onClick={() => updateKYCStatus(kyc._id, 'pending')}
                                disabled={updatingStatus === kyc._id}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <Clock className="w-4 h-4" />
                                Pending
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      <AnimatePresence>
        {showDetails && selectedKYC && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Student Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6 space-y-6">
                {/* Student Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      Personal Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Name:</span>
                        <span className="text-slate-800">{selectedKYC.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="text-slate-800">{selectedKYC.studentEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <span className="text-slate-800">{selectedKYC.studentPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">DOB:</span>
                        <span className="text-slate-800">{selectedKYC.dob ? new Date(selectedKYC.dob).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gender:</span>
                        <span className="text-slate-800">{selectedKYC.gender || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      Academic Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">College:</span>
                        <span className="text-slate-800">{selectedKYC.college}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Course & Year:</span>
                        <span className="text-slate-800">{selectedKYC.courseYear}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Stay Type:</span>
                        <span className="text-slate-800">{selectedKYC.availability?.stayType || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hours/Week:</span>
                        <span className="text-slate-800">{selectedKYC.availability?.hoursPerWeek || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Available Days:</span>
                        <span className="text-slate-800">{selectedKYC.availability?.availableDays?.join(', ') || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents Status */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Document Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Aadhar Card:</span>
                      <span className={`text-sm font-medium ${selectedKYC.documents?.aadharCard ? 'text-emerald-600' : 'text-red-600'}`}>
                        {selectedKYC.documents?.aadharCard ? '✓ Uploaded' : '✗ Not Uploaded'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">College ID:</span>
                      <span className={`text-sm font-medium ${selectedKYC.documents?.collegeIdCard ? 'text-emerald-600' : 'text-red-600'}`}>
                        {selectedKYC.documents?.collegeIdCard ? '✓ Uploaded' : '✗ Not Uploaded'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Job Preferences */}
                {selectedKYC.jobPreferences && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Star className="w-4 h-4 text-blue-600" />
                      Job Preferences
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Preferred Job Types:</span>
                        <span className="text-slate-800">{selectedKYC.jobPreferences?.preferredJobTypes?.join(', ') || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Experience & Skills:</span>
                        <span className="text-slate-800">{selectedKYC.jobPreferences?.experienceSkills || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Emergency Contact */}
                {selectedKYC.emergencyContact && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      Emergency Contact
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Name:</span>
                        <span className="text-slate-800">{selectedKYC.emergencyContact?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <span className="text-slate-800">{selectedKYC.emergencyContact?.phone}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payroll Information */}
                {selectedKYC.payroll && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-600" />
                      Payroll Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Consent:</span>
                        <span className={`font-medium ${selectedKYC.payroll?.consent ? 'text-emerald-600' : 'text-red-600'}`}>
                          {selectedKYC.payroll?.consent ? '✓ Given' : '✗ Not Given'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bank Account:</span>
                        <span className="text-slate-800">{selectedKYC.payroll?.bankAccount ? '***' + selectedKYC.payroll.bankAccount.slice(-4) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">IFSC Code:</span>
                        <span className="text-slate-800">{selectedKYC.payroll?.ifsc || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Beneficiary Name:</span>
                        <span className="text-slate-800">{selectedKYC.payroll?.beneficiaryName || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Account Details */}
                {selectedKYC.userDetails && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      User Account Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email Verified:</span>
                        <span className={`font-medium ${selectedKYC.userDetails?.emailVerified ? 'text-emerald-600' : 'text-red-600'}`}>
                          {selectedKYC.userDetails?.emailVerified ? '✓ Verified' : '✗ Not Verified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Phone Verified:</span>
                        <span className={`font-medium ${selectedKYC.userDetails?.phoneVerified ? 'text-emerald-600' : 'text-red-600'}`}>
                          {selectedKYC.userDetails?.phoneVerified ? '✓ Verified' : '✗ Not Verified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Account Status:</span>
                        <span className={`font-medium ${selectedKYC.userDetails?.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {selectedKYC.userDetails?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Skills:</span>
                        <span className="text-slate-800">{selectedKYC.userDetails?.skills?.join(', ') || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submission Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Submission Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Submitted At:</span>
                      <span className="text-slate-800">{new Date(selectedKYC.submittedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 w-fit ${getStatusColor(selectedKYC.status || selectedKYC.verificationStatus)}`}>
                        {getStatusIcon(selectedKYC.status || selectedKYC.verificationStatus)}
                        {(selectedKYC.status || selectedKYC.verificationStatus)?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    {selectedKYC.approvedAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Approved At:</span>
                        <span className="text-slate-800">{new Date(selectedKYC.approvedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedKYC.rejectedAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rejected At:</span>
                        <span className="text-slate-800">{new Date(selectedKYC.rejectedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedKYC.rejectionReason && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rejection Reason:</span>
                        <span className="text-slate-800">{selectedKYC.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Close
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      updateKYCStatus(selectedKYC._id, 'approved');
                      setShowDetails(false);
                    }}
                    disabled={updatingStatus === selectedKYC._id}
                    className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      updateKYCStatus(selectedKYC._id, 'rejected');
                      setShowDetails(false);
                    }}
                    disabled={updatingStatus === selectedKYC._id}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}