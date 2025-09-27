'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Building2, 
  Briefcase, 
  FileText, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Shield,
  FileCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { apiService } from '../../services/api';

interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  skills: string[];
  availability: string;
  rating: number;
  completedJobs: number;
  totalEarnings: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason?: string;
}

interface Employer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  businessType: string;
  address: string;
  isVerified: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason?: string;
  postedJobs: number;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  employer: string | { name: string; companyName: string };
  location: string;
  jobType: string;
  pay: number;
  payType: string;
  description: string;
  requirements: string;
  status: 'active' | 'paused' | 'closed' | 'expired' | 'pending';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason?: string;
  applications: number;
}

interface Application {
  _id: string;
  job: Job;
  student: Student;
  employer: string;
  status: 'pending' | 'shortlisted' | 'rejected' | 'hired';
  appliedDate: string;
  coverLetter?: string;
}

interface KYCSubmission {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    userType: string;
  };
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  college: string;
  courseYear: string;
  stayType: string;
  pgDetails?: {
    name: string;
    address: string;
    contact: string;
  };
  hoursPerWeek: number;
  availableDays: string[];
  emergencyContact: {
    name: string;
    phone: string;
  };
  bloodGroup: string;
  preferredJobTypes: string[];
  experienceSkills: string;
  payroll: {
    consent: boolean;
    bankAccount: string;
    ifsc: string;
    beneficiaryName: string;
  };
  verificationStatus: 'pending' | 'in-review' | 'approved' | 'rejected';
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  aadharCard?: string;
  collegeIdCard?: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalReason, setApprovalReason] = useState('');
  const [approvalItemId, setApprovalItemId] = useState('');
  const [approvalItemType, setApprovalItemType] = useState<'student' | 'employer' | 'job' | 'kyc'>('student');
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);

  const [data, setData] = useState({
    overview: {
      totalStudents: 0,
      totalEmployers: 0,
      totalJobs: 0,
      totalApplications: 0,
      pendingStudentApprovals: 0,
      pendingEmployerApprovals: 0,
      pendingJobApprovals: 0,
      recentActivity: []
    },
    students: [] as Student[],
    employers: [] as Employer[],
    jobs: [] as Job[],
    applications: [] as Application[],
    kycSubmissions: [] as KYCSubmission[],
    kycStats: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    }
  });

  // Force mobile view on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        document.body.classList.add('mobile-view');
      } else {
        document.body.classList.remove('mobile-view');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // Fetch real admin statistics
        const statsResponse = await apiService.getAdminStats() as any;
        const stats = statsResponse.data || statsResponse;
        
        // Fetch all data
        const [studentsResponse, employersResponse, jobsResponse, kycResponse, kycStatsResponse] = await Promise.all([
          apiService.getPendingUsers('student'),
          apiService.getPendingUsers('employer'),
          apiService.getPendingJobs(),
          apiService.getKYCSubmissions('all', 1, 50),
          apiService.getKYCStats()
        ]);
        
        const students = (studentsResponse as any).data?.users || (studentsResponse as any).users || [];
        const employers = (employersResponse as any).data?.users || (employersResponse as any).users || [];
        const jobs = (jobsResponse as any).data?.jobs || (jobsResponse as any).jobs || [];
        const kycSubmissions = (kycResponse as any).data?.kycSubmissions || (kycResponse as any).kycSubmissions || [];
        const kycStats = (kycStatsResponse as any).data || kycStatsResponse;
        
        setData({
          overview: {
            totalStudents: stats.users?.students || 0,
            totalEmployers: stats.users?.employers || 0,
            totalJobs: stats.jobs?.total || 0,
            totalApplications: stats.applications?.total || 0,
            pendingStudentApprovals: stats.users?.pendingApprovals || 0,
            pendingEmployerApprovals: employers.filter((e: any) => e.approvalStatus === 'pending').length,
            pendingJobApprovals: stats.jobs?.pendingApprovals || 0,
            recentActivity: []
          },
          students,
          employers,
          jobs,
          applications: [],
          kycSubmissions,
          kycStats
        });
        
      } catch (error) {
        console.error('Error fetching admin data:', error);
        // Keep default data on error
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchAdminData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Helper functions
  const handleApproval = async (itemId: string, type: 'student' | 'employer' | 'job' | 'kyc', action: 'approve' | 'reject', reason?: string) => {
    try {
      if (type === 'student') {
        if (action === 'approve') {
          await apiService.approveUser(itemId);
        } else {
          await apiService.rejectUser(itemId, reason || '');
        }
        setData(prev => {
          const previous = prev.students.find(student => student._id === itemId);
          const prevStatus = previous?.approvalStatus;
          const nextStatus = action === 'approve' ? 'approved' : 'rejected';

          const updatedStudents = prev.students.map(student =>
            student._id === itemId
              ? {
                  ...student,
                  approvalStatus: nextStatus,
                  rejectionReason: action === 'reject' ? reason : undefined,
                }
              : student
          );

          let pendingStudentApprovals = prev.overview.pendingStudentApprovals;
          if (prevStatus !== nextStatus) {
            if (prevStatus === 'pending') pendingStudentApprovals = Math.max(0, pendingStudentApprovals - 1);
            if (nextStatus === 'pending') pendingStudentApprovals += 1;
          }

          return {
            ...prev,
            students: updatedStudents,
            overview: {
              ...prev.overview,
              pendingStudentApprovals,
            },
          };
        });
      } else if (type === 'employer') {
        if (action === 'approve') {
          await apiService.approveUser(itemId);
        } else {
          await apiService.rejectUser(itemId, reason || '');
        }
        setData(prev => {
          const previous = prev.employers.find(employer => employer._id === itemId);
          const prevStatus = previous?.approvalStatus;
          const nextStatus = action === 'approve' ? 'approved' : 'rejected';

          const updatedEmployers = prev.employers.map(employer =>
            employer._id === itemId
              ? {
                  ...employer,
                  approvalStatus: nextStatus,
                  rejectionReason: action === 'reject' ? reason : undefined,
                }
              : employer
          );

          let pendingEmployerApprovals = prev.overview.pendingEmployerApprovals;
          if (prevStatus !== nextStatus) {
            if (prevStatus === 'pending') pendingEmployerApprovals = Math.max(0, pendingEmployerApprovals - 1);
            if (nextStatus === 'pending') pendingEmployerApprovals += 1;
          }

          return {
            ...prev,
            employers: updatedEmployers,
            overview: {
              ...prev.overview,
              pendingEmployerApprovals,
            },
          };
        });
      } else if (type === 'job') {
        if (action === 'approve') {
          await apiService.approveJob(itemId);
        } else {
          await apiService.rejectJob(itemId, reason || '');
        }
        setData(prev => {
          const previous = prev.jobs.find(job => job._id === itemId);
          const prevStatus = previous?.approvalStatus;
          const nextStatus = action === 'approve' ? 'approved' : 'rejected';

          const updatedJobs = prev.jobs.map(job =>
            job._id === itemId
              ? {
                  ...job,
                  approvalStatus: nextStatus,
                  rejectionReason: action === 'reject' ? reason : undefined,
                }
              : job
          );

          let pendingJobApprovals = prev.overview.pendingJobApprovals;
          if (prevStatus !== nextStatus) {
            if (prevStatus === 'pending') pendingJobApprovals = Math.max(0, pendingJobApprovals - 1);
            if (nextStatus === 'pending') pendingJobApprovals += 1;
          }

          return {
            ...prev,
            jobs: updatedJobs,
            overview: {
              ...prev.overview,
              pendingJobApprovals,
            },
          };
        });
      } else if (type === 'kyc') {
        if (action === 'approve') {
          await apiService.approveKYC(itemId);
        } else {
          await apiService.rejectKYC(itemId, reason || '');
        }
        setData(prev => {
          const previous = prev.kycSubmissions.find(kyc => kyc._id === itemId);
          const prevStatus = previous?.verificationStatus;

          const updatedSubmissions = prev.kycSubmissions.map(kyc =>
            kyc._id === itemId
              ? {
                  ...kyc,
                  verificationStatus: action === 'approve' ? 'approved' : 'rejected',
                  rejectionReason: action === 'reject' ? reason : undefined,
                }
              : kyc
          );

          let { pending, approved, rejected } = prev.kycStats;
          const nextStatus = action === 'approve' ? 'approved' : 'rejected';

          if (prevStatus !== nextStatus) {
            if (prevStatus === 'pending') pending = Math.max(0, pending - 1);
            if (prevStatus === 'approved') approved = Math.max(0, approved - 1);
            if (prevStatus === 'rejected') rejected = Math.max(0, rejected - 1);

            if (nextStatus === 'pending') pending += 1;
            if (nextStatus === 'approved') approved += 1;
            if (nextStatus === 'rejected') rejected += 1;
          }

          return {
            ...prev,
            kycSubmissions: updatedSubmissions,
            kycStats: {
              ...prev.kycStats,
              pending,
              approved,
              rejected,
            },
          };
        });
      }
      
      // Show success message
      const successMessage = `${type.charAt(0).toUpperCase() + type.slice(1)} ${action}d successfully!`;
      alert(successMessage);
    } catch (error) {
      console.error('Error handling approval:', error);
      alert(`Failed to ${action} ${type}. Please try again.`);
    }
  };

  const openApprovalModal = (itemId: string, type: 'student' | 'employer' | 'job' | 'kyc', action: 'approve' | 'reject') => {
    setApprovalItemId(itemId);
    setApprovalItemType(type);
    setApprovalAction(action);
    setApprovalReason('');
    setShowApprovalModal(true);
  };

  const openKYCModal = async (kycId: string) => {
    try {
      const response = await apiService.getKYCSubmissionDetails(kycId) as any;
      setSelectedKYC(response.data?.kyc || response.kyc);
      setShowKYCModal(true);
    } catch (error) {
      console.error('Error fetching KYC details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };


  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <motion.div 
          className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-indigo-600">{data.overview.totalStudents}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employers</p>
              <p className="text-3xl font-bold text-green-600">{data.overview.totalEmployers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-3xl font-bold text-blue-600">{data.overview.totalJobs}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-3xl font-bold text-purple-600">{data.overview.totalApplications}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pending Approvals - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Student Approvals</h3>
            <UserCheck className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-yellow-600 mb-2">{data.overview.pendingStudentApprovals}</div>
          <p className="text-sm text-gray-600">Students waiting for approval</p>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Employer Approvals</h3>
            <Building2 className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-yellow-600 mb-2">{data.overview.pendingEmployerApprovals}</div>
          <p className="text-sm text-gray-600">Employers waiting for approval</p>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Job Approvals</h3>
            <Briefcase className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-yellow-600 mb-2">{data.overview.pendingJobApprovals}</div>
          <p className="text-sm text-gray-600">Jobs waiting for approval</p>
        </motion.div>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      {/* Search and Filter - Mobile Optimized */}
      <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">

          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>


      {/* Students - Mobile Cards & Desktop Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Mobile: Card Layout */}
        <div className="sm:hidden">
          <div className="p-3 space-y-2">
            {data.students.map((student) => (
              <motion.div 
                key={student._id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                whileHover={{ backgroundColor: '#f3f4f6' }}
              >
                {/* Header with name and status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{student.name}</div>
                    <div className="text-xs text-gray-500 truncate">{student.email}</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(student.approvalStatus)}`}>
                    {getStatusIcon(student.approvalStatus)}
                    <span className="ml-1">{student.approvalStatus}</span>
                  </span>
                </div>
                
                {/* College */}
                <div className="text-xs text-gray-700 mb-2 truncate">{student.college}</div>
                
                {/* Skills */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {student.skills.slice(0, 2).map((skill, index) => (
                    <span key={index} className="px-1.5 py-0.5 bg-gray-100 text-gray-800 text-[10px] rounded-full">
                      {skill}
                    </span>
                  ))}
                  {student.skills.length > 2 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 text-[10px] rounded-full">
                      +{student.skills.length - 2}
                    </span>
                  )}
                </div>
                
                {/* Footer with date and actions */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{new Date(student.submittedAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openApprovalModal(student._id, 'student', 'approve')}
                      className="p-1 text-green-600 hover:text-green-900 rounded hover:bg-green-50"
                      title="Approve"
                    >
                      <CheckCircle className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => openApprovalModal(student._id, 'student', 'reject')}
                      className="p-1 text-red-600 hover:text-red-900 rounded hover:bg-red-50"
                      title="Reject"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                    <button className="p-1 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50" title="View">
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">

            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">College</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Skills</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.students.map((student) => (
                <motion.tr 
                  key={student._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-indigo-50/30"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.college}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1.5">
                      {student.skills.slice(0, 2).map((skill, index) => (
                        <span key={index} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                      {student.skills.length > 2 && (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{student.skills.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(student.approvalStatus)}`}>
                      {getStatusIcon(student.approvalStatus)}
                      <span className="ml-1">{student.approvalStatus}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(student.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openApprovalModal(student._id, 'student', 'approve')}
                        disabled={student.approvalStatus === 'approved'}
                        className="text-green-600 hover:text-green-800 p-1.5 rounded-lg hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openApprovalModal(student._id, 'student', 'reject')}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );


  const renderEmployers = () => (
    <div className="space-y-6">
      {/* Search and Filter - Mobile Optimized */}
      <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">

          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search employers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>


      {/* Employers - Mobile Cards & Desktop Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Mobile: Card Layout */}
        <div className="sm:hidden">
          <div className="p-3 space-y-2">
            {data.employers.map((employer) => (
              <motion.div 
                key={employer._id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                whileHover={{ backgroundColor: '#f3f4f6' }}
              >
                {/* Header with name and status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{employer.name}</div>
                    <div className="text-xs text-gray-500 truncate">{employer.email}</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(employer.approvalStatus)}`}>
                    {getStatusIcon(employer.approvalStatus)}
                    <span className="ml-1">{employer.approvalStatus}</span>
                  </span>
                </div>
                
                {/* Company info */}
                <div className="text-xs text-gray-700 mb-1 truncate">{employer.companyName}</div>
                <div className="text-xs text-gray-600 mb-2 truncate">{employer.businessType}</div>
                
                {/* Footer with date and actions */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{new Date(employer.submittedAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openApprovalModal(employer._id, 'employer', 'approve')}
                      className="p-1 text-green-600 hover:text-green-900 rounded hover:bg-green-50"
                      title="Approve"
                    >
                      <CheckCircle className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => openApprovalModal(employer._id, 'employer', 'reject')}
                      className="p-1 text-red-600 hover:text-red-900 rounded hover:bg-red-50"
                      title="Reject"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                    <button className="p-1 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50" title="View">
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">

            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.employers.map((employer) => (
                <motion.tr 
                  key={employer._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-emerald-50/30"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{employer.name}</div>
                      <div className="text-sm text-gray-500">{employer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employer.companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employer.businessType}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employer.approvalStatus)}`}>
                      {getStatusIcon(employer.approvalStatus)}
                      <span className="ml-1">{employer.approvalStatus}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(employer.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openApprovalModal(employer._id, 'employer', 'approve')}
                        disabled={employer.approvalStatus === 'approved'}
                        className="text-green-600 hover:text-green-800 p-1.5 rounded-lg hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openApprovalModal(employer._id, 'employer', 'reject')}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );


  const renderJobs = () => (
    <div className="space-y-6">
      {/* Search and Filter - Mobile Optimized */}
      <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">

          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>


      {/* Jobs - Mobile Cards & Desktop Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Mobile: Card Layout */}
        <div className="sm:hidden">
          <div className="p-3 space-y-2">
            {data.jobs.map((job) => (
              <motion.div 
                key={job._id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                whileHover={{ backgroundColor: '#f3f4f6' }}
              >
                {/* Header with title and status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{job.title}</div>
                    <div className="text-xs text-gray-500 truncate">{job.jobType}</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(job.approvalStatus)}`}>
                    {getStatusIcon(job.approvalStatus)}
                    <span className="ml-1">{job.approvalStatus}</span>
                  </span>
                </div>
                
                {/* Company and location */}
                <div className="text-xs text-gray-700 mb-1 truncate">{job.company}</div>
                <div className="text-xs text-gray-600 mb-1 truncate">{job.location}</div>
                <div className="text-xs text-gray-600 mb-2">₹{job.pay}/{job.payType}</div>
                
                {/* Footer with date and actions */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{new Date(job.submittedAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openApprovalModal(job._id, 'job', 'approve')}
                      className="p-1 text-green-600 hover:text-green-900 rounded hover:bg-green-50"
                      title="Approve"
                    >
                      <CheckCircle className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => openApprovalModal(job._id, 'job', 'reject')}
                      className="p-1 text-red-600 hover:text-red-900 rounded hover:bg-red-50"
                      title="Reject"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                    <button className="p-1 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50" title="View">
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">

            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pay</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.jobs.map((job) => (
                <motion.tr 
                  key={job._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-blue-50/30"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500">{job.jobType}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{job.pay}/{job.payType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.approvalStatus)}`}>
                      {getStatusIcon(job.approvalStatus)}
                      <span className="ml-1">{job.approvalStatus}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(job.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openApprovalModal(job._id, 'job', 'approve')}
                        disabled={job.approvalStatus === 'approved'}
                        className="text-green-600 hover:text-green-800 p-1.5 rounded-lg hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openApprovalModal(job._id, 'job', 'reject')}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );


  const renderKYC = () => (
    <div className="space-y-6">
      {/* KYC Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <motion.div 
          className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total KYC</p>
              <p className="text-3xl font-bold text-blue-600">{data.kycStats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600">{data.kycStats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          whileHover={{ scale: 1.02 }}

        >
          <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className={`text-3xl font-semibold text-${stat.accent}-600`}>{stat.value}</p>
            </div>
              <div className={`p-3 rounded-xl bg-${stat.accent}-50 text-${stat.accent}-500`}>
                <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{data.kycStats.rejected}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />

            </div>


      {/* Search and Filter - Mobile Optimized */}
      <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">

          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search KYC submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus-border-transparent bg-white"
              />
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus-border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>


      {/* KYC Submissions - Mobile Cards & Desktop Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Mobile: Card Layout */}
        <div className="sm:hidden">
          <div className="p-3 space-y-2">
            {data.kycSubmissions.map((kyc) => (
              <motion.div 
                key={kyc._id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                whileHover={{ backgroundColor: '#f3f4f6' }}
              >
                {/* Header with name and status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{kyc.fullName}</div>
                    <div className="text-xs text-gray-500 truncate">{kyc.email}</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(kyc.verificationStatus)}`}>
                    {getStatusIcon(kyc.verificationStatus)}
                    <span className="ml-1">{kyc.verificationStatus}</span>
                  </span>
                </div>
                
                {/* College */}
                <div className="text-xs text-gray-700 mb-2 truncate">{kyc.college}</div>
                
                {/* Documents */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {kyc.aadharCard && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] rounded-full">Aadhaar</span>
                  )}
                  {kyc.collegeIdCard && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full">College ID</span>
                  )}
                </div>
                
                {/* Footer with date and actions */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{new Date(kyc.submittedAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openKYCModal(kyc._id)}
                      className="p-1 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50"
                      title="View Details"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    {kyc.verificationStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => openApprovalModal(kyc._id, 'kyc', 'approve')}
                          className="p-1 text-green-600 hover:text-green-900 rounded hover:bg-green-50"
                          title="Approve"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openApprovalModal(kyc._id, 'kyc', 'reject')}
                          className="p-1 text-red-600 hover:text-red-900 rounded hover:bg-red-50"
                          title="Reject"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">

            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">College</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.kycSubmissions.map((kyc) => (
                <motion.tr 
                  key={kyc._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-purple-50/30"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{kyc.fullName}</div>
                      <div className="text-sm text-gray-500">{kyc.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kyc.college}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      {kyc.aadharCard && (
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full">Aadhaar</span>
                      )}
                      {kyc.collegeIdCard && (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">College ID</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(kyc.verificationStatus)}`}>
                      {getStatusIcon(kyc.verificationStatus)}
                      <span className="ml-1">{kyc.verificationStatus}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(kyc.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openKYCModal(kyc._id)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openApprovalModal(kyc._id, 'kyc', 'approve')}
                        disabled={kyc.verificationStatus === 'approved'}
                        className="text-green-600 hover:text-green-800 p-1.5 rounded-lg hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openApprovalModal(kyc._id, 'kyc', 'reject')}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  const ApplicationSection = () => (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Application Tracking</h3>
        <span className="text-sm text-indigo-600">Upcoming Feature</span>
        </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Applications Today', value: data.overview.totalApplications ? Math.floor(data.overview.totalApplications / 10) : 0 },
          { title: 'Active Interviews', value: Math.floor((data.overview.totalApplications || 0) / 20) },
          { title: 'Placements', value: Math.floor((data.overview.totalApplications || 0) / 30) }
        ].map((summary) => (
          <div key={summary.title} className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-xs uppercase text-indigo-500 font-medium">{summary.title}</p>
            <p className="text-2xl font-semibold text-indigo-700 mt-2">{summary.value}</p>
            <p className="text-xs text-indigo-400 mt-1">Auto-derived snapshot</p>
      </div>
        ))}
    </div>
      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
        Real-time application flow is coming soon. You’ll be able to monitor submissions, interviews, and hiring decisions directly here.
      </div>
    </section>
  );

  return (

    <>
      {/* Mobile viewport meta tag */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <div className="min-h-screen bg-gray-50 mobile-dashboard">
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* Mobile Layout */}
          <div className="sm:hidden py-3">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
              >
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 text-sm"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-600">Student Job Portal Management</p>
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between h-16">
            <div className="flex items-center gap-4">

              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Back
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Navigation Tabs - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <nav className="flex overflow-x-auto scrollbar-hide">
            <div className="flex space-x-1 sm:space-x-8 min-w-max">
              {[
                { id: 'overview', name: 'Overview', icon: TrendingUp },
                { id: 'students', name: 'Students', icon: Users },
                { id: 'employers', name: 'Employers', icon: Building2 },
                { id: 'jobs', name: 'Jobs', icon: Briefcase },
                { id: 'kyc', name: 'KYC', icon: Shield },
                { id: 'applications', name: 'Applications', icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">{tab.name}</span>
                  <span className="xs:hidden">{tab.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </nav>

        </div>
                  <div className={`p-3 rounded-xl bg-${card.accent}-50 text-${card.accent}-500`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            ))}
      </div>


      {/* Main Content - Mobile Optimized */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <AnimatePresence mode="wait">

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[{
              title: 'Pending Student Approvals',
              value: data.overview.pendingStudentApprovals,
              icon: UserCheck,
              accent: 'yellow'
            }, {
              title: 'Pending Employers',
              value: data.overview.pendingEmployerApprovals,
              icon: Building2,
              accent: 'amber'
            }, {
              title: 'Pending Jobs',
              value: data.overview.pendingJobApprovals,
              icon: Briefcase,
              accent: 'orange'
            }].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-${item.accent}-50 text-${item.accent}-500`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">{item.title}</p>
                  <p className={`text-2xl font-semibold text-${item.accent}-600 mt-1`}>{item.value}</p>
                  <p className="text-xs text-gray-400 mt-1">Requires admin action</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="space-y-10"
        >
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Student Approvals</h2>
              <StudentSection />
      </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Employer Approvals</h2>
              <EmployerSection />
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Job Postings</h2>
              <JobSection />
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">KYC Verification</h2>
              <KYCSection />
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Applications Snapshot</h2>
              <ApplicationSection />
            </div>
          </div>
        </motion.section>
      </main>

      {/* Approval Modal */}
      <AnimatePresence>
        {showApprovalModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {approvalAction === 'approve' ? 'Approve' : 'Reject'} {approvalItemType}
                </h3>
                
                {approvalAction === 'reject' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for rejection
                    </label>
                    <textarea
                      value={approvalReason}
                      onChange={(e) => setApprovalReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter reason for rejection..."
                    />
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleApproval(approvalItemId, approvalItemType, approvalAction, approvalReason);
                      setShowApprovalModal(false);
                    }}
                    className={`px-4 py-2 text-white rounded-lg transition-colors ${
                      approvalAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KYC Details Modal */}
      <AnimatePresence>
        {showKYCModal && selectedKYC && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">KYC Details</h3>
                  <button
                    onClick={() => setShowKYCModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                        <p className="text-sm text-gray-900">{selectedKYC.fullName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                        <p className="text-sm text-gray-900">{new Date(selectedKYC.dob).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Gender</label>
                        <p className="text-sm text-gray-900">{selectedKYC.gender}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Blood Group</label>
                        <p className="text-sm text-gray-900">{selectedKYC.bloodGroup}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedKYC.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedKYC.phone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-900">{selectedKYC.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Academic Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedKYC.college}</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Course Year</label>
                        <p className="text-sm text-gray-900">{selectedKYC.courseYear}</p>
                      </div>
                    </div>
                  </div>

                  {/* Work Preferences */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Work Preferences</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Hours per Week</label>
                        <p className="text-sm text-gray-900">{selectedKYC.hoursPerWeek} hours</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Available Days</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedKYC.availableDays.map((day, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Preferred Job Types</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedKYC.preferredJobTypes.map((type, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Emergency Contact</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-sm text-gray-900">{selectedKYC.emergencyContact.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-sm text-gray-900">{selectedKYC.emergencyContact.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Documents</h4>
                    <div className="space-y-3">
                      {selectedKYC.aadharCard && (
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-900">Aadhaar Card</span>
                          <a href={selectedKYC.aadharCard} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs">
                            View
                          </a>
                        </div>
                      )}
                      {selectedKYC.collegeIdCard && (
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-900">College ID</span>
                          <a href={selectedKYC.collegeIdCard} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs">
                            View
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedKYC.verificationStatus === 'pending' && (
                  <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
                    <button
                      onClick={() => {
                        setShowKYCModal(false);
                        openApprovalModal(selectedKYC._id, 'kyc', 'reject');
                      }}
                      className="px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setShowKYCModal(false);
                        openApprovalModal(selectedKYC._id, 'kyc', 'approve');
                      }}
                      className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}