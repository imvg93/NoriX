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

const isStudentApprovalStatus = (status: unknown): status is Student['approvalStatus'] =>
  status === 'pending' || status === 'approved' || status === 'rejected';

const normalizeStudent = (student: any): Student => ({
  ...student,
  approvalStatus: isStudentApprovalStatus(student?.approvalStatus) ? student.approvalStatus : 'pending',
  rejectionReason: student?.rejectionReason ?? undefined,
});

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

const isEmployerApprovalStatus = (status: unknown): status is Employer['approvalStatus'] =>
  status === 'pending' || status === 'approved' || status === 'rejected';

const normalizeEmployer = (employer: any): Employer => ({
  ...employer,
  approvalStatus: isEmployerApprovalStatus(employer?.approvalStatus) ? employer.approvalStatus : 'pending',
  rejectionReason: employer?.rejectionReason ?? undefined,
});

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

const isJobApprovalStatus = (status: unknown): status is Job['approvalStatus'] =>
  status === 'pending' || status === 'approved' || status === 'rejected';

const normalizeJob = (job: any): Job => ({
  ...job,
  approvalStatus: isJobApprovalStatus(job?.approvalStatus) ? job.approvalStatus : 'pending',
  rejectionReason: job?.rejectionReason ?? undefined,
});

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

const isKYCVerificationStatus = (status: unknown): status is KYCSubmission['verificationStatus'] =>
  status === 'pending' || status === 'in-review' || status === 'approved' || status === 'rejected';

const normalizeKYCSubmission = (submission: any): KYCSubmission => ({
  ...submission,
  verificationStatus: isKYCVerificationStatus(submission?.verificationStatus) ? submission.verificationStatus : 'pending',
  rejectionReason: submission?.rejectionReason ?? undefined,
});

type RecentActivity = {
  id: string;
  message: string;
  timestamp: string;
};

interface AdminOverview {
  totalStudents: number;
  totalEmployers: number;
  totalJobs: number;
  totalApplications: number;
  pendingStudentApprovals: number;
  pendingEmployerApprovals: number;
  pendingJobApprovals: number;
  recentActivity: RecentActivity[];
}

interface AdminData {
  overview: AdminOverview;
  students: Student[];
  employers: Employer[];
  jobs: Job[];
  applications: Application[];
  kycSubmissions: KYCSubmission[];
  kycStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

const defaultAdminData: AdminData = {
  overview: {
    totalStudents: 0,
    totalEmployers: 0,
    totalJobs: 0,
    totalApplications: 0,
    pendingStudentApprovals: 0,
    pendingEmployerApprovals: 0,
    pendingJobApprovals: 0,
    recentActivity: [],
  },
  students: [],
  employers: [],
  jobs: [],
  applications: [],
  kycSubmissions: [],
  kycStats: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  },
};

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

  const [data, setData] = useState<AdminData>(defaultAdminData);

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
        
        const studentsRaw = (studentsResponse as any).data?.users || (studentsResponse as any).users || [];
        const students = studentsRaw.map(normalizeStudent);
        const employersRaw = (employersResponse as any).data?.users || (employersResponse as any).users || [];
        const jobsRaw = (jobsResponse as any).data?.jobs || (jobsResponse as any).jobs || [];
        const kycSubmissionsRaw = (kycResponse as any).data?.kycSubmissions || (kycResponse as any).kycSubmissions || [];
        const employers = employersRaw.map(normalizeEmployer);
        const jobs = jobsRaw.map(normalizeJob);
        const kycSubmissions = kycSubmissionsRaw.map(normalizeKYCSubmission);
        const kycStats = (kycStatsResponse as any).data || kycStatsResponse;
        
        setData({
          overview: {
            totalStudents: stats.users?.students || 0,
            totalEmployers: stats.users?.employers || 0,
            totalJobs: stats.jobs?.total || 0,
            totalApplications: stats.applications?.total || 0,
            pendingStudentApprovals: stats.users?.pendingApprovals || 0,
            pendingEmployerApprovals: employers.filter((e: Employer) => e.approvalStatus === 'pending').length,
            pendingJobApprovals: stats.jobs?.pendingApprovals || 0,
            recentActivity: [],
          },
          students,
          employers,
          jobs,
          applications: [],
          kycSubmissions,
          kycStats: {
            total: kycStats.total || 0,
            pending: kycStats.pending || 0,
            approved: kycStats.approved || 0,
            rejected: kycStats.rejected || 0,
          },
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

          const updatedStudents = prev.students.map((student): Student =>
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

          const updatedEmployers = prev.employers.map((employer): Employer =>
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

          const updatedJobs = prev.jobs.map((job): Job =>
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

          const updatedSubmissions = prev.kycSubmissions.map((kyc): KYCSubmission =>
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

  const statsCards = useMemo(() => ([
    {
      title: 'Total Students',
      value: data.overview.totalStudents,
      icon: Users,
      accent: 'indigo',
      description: data.overview.pendingStudentApprovals ? `${data.overview.pendingStudentApprovals} pending approvals` : 'All clear',
    },
    {
      title: 'Total Employers',
      value: data.overview.totalEmployers,
      icon: Building2,
      accent: 'green',
      description: data.overview.pendingEmployerApprovals ? `${data.overview.pendingEmployerApprovals} pending approvals` : 'All clear',
    },
    {
      title: 'Total Jobs',
      value: data.overview.totalJobs,
      icon: Briefcase,
      accent: 'blue',
      description: data.overview.pendingJobApprovals ? `${data.overview.pendingJobApprovals} pending approvals` : 'All clear',
    },
    {
      title: 'Applications',
      value: data.overview.totalApplications,
      icon: FileText,
      accent: 'purple',
      description: 'Platform-wide applications',
    }
  ]), [data.overview]);

  const StudentSection = () => (
    <section className="space-y-6">
      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
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

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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

  const EmployerSection = () => (
    <section className="space-y-6">
      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
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

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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

  const JobSection = () => (
    <section className="space-y-6">
      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
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

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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

  const KYCSection = () => (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Total KYC', value: data.kycStats.total, icon: Shield, accent: 'blue' },
          { title: 'Pending Review', value: data.kycStats.pending, icon: Clock, accent: 'amber' },
          { title: 'Approved', value: data.kycStats.approved, icon: CheckCircle, accent: 'green' },
          { title: 'Rejected', value: data.kycStats.rejected, icon: XCircle, accent: 'red' }
        ].map((stat) => (
        <motion.div 
            key={stat.title}
            whileHover={{ translateY: -4 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
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
        ))}
            </div>

      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
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

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin Control Center</h1>
              <p className="text-sm text-slate-500 mt-1">Monitor platform metrics, approvals, and KYC from a single view.</p>
            </div>
            <div className="flex gap-3">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((card) => (
              <motion.div
                key={card.title}
                whileHover={{ translateY: -6 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                    <p className={`text-3xl font-semibold text-${card.accent}-600 mt-2`}>{card.value}</p>
                    <p className="text-xs text-gray-400 mt-2">{card.description}</p>
        </div>
                  <div className={`p-3 rounded-xl bg-${card.accent}-50 text-${card.accent}-500`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            ))}
      </div>

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
  );
}