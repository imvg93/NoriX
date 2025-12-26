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

const normalizeStudent = (student: any): Student => {
  // Priority: approvalStatus -> kycStatus -> status -> default to pending
  let approvalStatus: 'pending' | 'approved' | 'rejected' = 'pending';
  
  if (isStudentApprovalStatus(student?.approvalStatus)) {
    approvalStatus = student.approvalStatus;
  } else if (student?.kycStatus === 'approved') {
    approvalStatus = 'approved';
  } else if (student?.kycStatus === 'rejected') {
    approvalStatus = 'rejected';
  } else if (student?.kycStatus === 'pending') {
    approvalStatus = 'pending';
  } else if (student?.status === 'approved') {
    approvalStatus = 'approved';
  } else if (student?.status === 'rejected') {
    approvalStatus = 'rejected';
  } else if (student?.status === 'pending') {
    approvalStatus = 'pending';
  }
  
  return {
    ...student,
    approvalStatus,
    rejectionReason: student?.rejectionReason ?? undefined,
  };
};

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

const normalizeEmployer = (employer: any): Employer => {
  // Priority: approvalStatus -> kycStatus -> status -> default to pending
  let approvalStatus: 'pending' | 'approved' | 'rejected' = 'pending';
  
  if (isEmployerApprovalStatus(employer?.approvalStatus)) {
    approvalStatus = employer.approvalStatus;
  } else if (employer?.kycStatus === 'approved') {
    approvalStatus = 'approved';
  } else if (employer?.kycStatus === 'rejected') {
    approvalStatus = 'rejected';
  } else if (employer?.kycStatus === 'pending') {
    approvalStatus = 'pending';
  } else if (employer?.status === 'approved') {
    approvalStatus = 'approved';
  } else if (employer?.status === 'rejected') {
    approvalStatus = 'rejected';
  } else if (employer?.status === 'pending') {
    approvalStatus = 'pending';
  }
  
  return {
    ...employer,
    approvalStatus,
    rejectionReason: employer?.rejectionReason ?? undefined,
  };
};

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

const ModalOverlay = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-xl">
      {children}
    </div>
  </div>
);

interface ApprovalModalProps {
  isOpen: boolean;
  action: 'approve' | 'reject';
  itemType: 'student' | 'employer' | 'job' | 'kyc';
  currentReason: string;
  onChangeReason: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const ApprovalModal = ({
  isOpen,
  action,
  itemType,
  currentReason,
  onChangeReason,
  onClose,
  onSubmit,
}: ApprovalModalProps) => {
  if (!isOpen) return null;

  const titleMap: Record<string, string> = {
    student: 'Student',
    employer: 'Employer',
    job: 'Job Posting',
    kyc: 'Student KYC',
  };

  const title = `${action === 'approve' ? 'Approve' : 'Reject'} ${titleMap[itemType] ?? 'Item'}`;

  return (
    <ModalOverlay>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {action === 'reject' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Reason for rejection</label>
            <textarea
              value={currentReason}
              onChange={(event) => onChangeReason(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              placeholder="Share the reason for rejection"
            />
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {action === 'approve' ? 'Confirm approval' : 'Confirm rejection'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

interface KYCModalProps {
  isOpen: boolean;
  kyc: KYCSubmission;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

const KYCModal = ({ isOpen, kyc, onClose, onApprove, onReject }: KYCModalProps) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <div className="max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">KYC Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 space-y-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-900">Student</p>
            <p>{kyc.fullName}</p>
            <p>{kyc.email}</p>
            <p>{kyc.phone}</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">College & Course</p>
            <p>{kyc.college}</p>
            <p>{kyc.courseYear}</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Preferred Job Types</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {kyc.preferredJobTypes?.map((jobType) => (
                <span key={jobType} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                  {jobType}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-900">Documents</p>
            <div className="mt-2 space-y-2">
              {kyc.aadharCard && (
                <a
                  href={kyc.aadharCard}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  <FileText className="h-4 w-4" />
                  Aadhar card
                </a>
              )}
              {kyc.collegeIdCard && (
                <a
                  href={kyc.collegeIdCard}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  <FileText className="h-4 w-4" />
                  College ID
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4 border-t pt-4">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Optional rejection reason"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => onReject(reason)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Reject
            </button>
            <button
              onClick={onApprove}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
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
  const [activeTab, setActiveTab] = useState('overview');

  const [data, setData] = useState<AdminData>(defaultAdminData);

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
        
        // Fetch all real data from live MongoDB (comprehensive)
        const [studentsResponse, employersResponse, jobsResponse, kycResponse, kycStatsResponse] = await Promise.all([
          apiService.getAllUsers({ userType: 'student', page: 1, limit: 1000 }) as any,
          apiService.getAllUsers({ userType: 'employer', page: 1, limit: 1000 }) as any,
          apiService.getAllJobsForAdmin('all', 'all', 1, 1000) as any,
          apiService.getKYCSubmissions('all', 1, 1000) as any,
          apiService.getKYCStats() as any
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
      console.log(`🔄 Starting ${action} for ${type} with ID:`, itemId);
      
      if (type === 'student') {
        if (action === 'approve') {
          const response = await apiService.approveUser(itemId);
          console.log('✅ Approval API response:', response);
        } else {
          const response = await apiService.rejectUser(itemId, reason || '');
          console.log('✅ Rejection API response:', response);
        }
        
        // Wait a moment for backend to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh the specific user data from server
        try {
          console.log('🔄 Refreshing student data from server...');
          const usersResponse = await apiService.getAllUsers({ userType: 'student', page: 1, limit: 1000 }) as any;
          console.log('📦 Raw API response:', usersResponse);
          
          const studentsRaw = usersResponse.data?.users || usersResponse.users || [];
          console.log(`📊 Found ${studentsRaw.length} students in response`);
          
          const students = studentsRaw.map(normalizeStudent);
          const updatedStudent = students.find((s: Student) => s._id === itemId);
          
          console.log('🔍 Updated student data:', updatedStudent ? {
            id: updatedStudent._id,
            name: updatedStudent.name,
            approvalStatus: updatedStudent.approvalStatus,
            kycStatus: studentsRaw.find((s: any) => s._id === itemId)?.kycStatus,
            status: studentsRaw.find((s: any) => s._id === itemId)?.status
          } : 'Student not found');
          
          if (updatedStudent) {
            setData(prev => {
              const updatedStudents = prev.students.map((student): Student =>
                student._id === itemId ? updatedStudent : student
              );
              
              const pendingStudentApprovals = updatedStudents.filter(s => s.approvalStatus === 'pending').length;
              
              console.log('✅ Updating UI with new status:', updatedStudent.approvalStatus);
              
              return {
                ...prev,
                students: updatedStudents,
                overview: {
                  ...prev.overview,
                  pendingStudentApprovals,
                },
              };
            });
          } else {
            console.error('❌ Updated student not found in response');
            throw new Error('Student not found in refresh response');
          }
        } catch (refreshError) {
          console.error('❌ Error refreshing student data:', refreshError);
          // Fallback to optimistic update
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
        }
      } else if (type === 'employer') {
        if (action === 'approve') {
          const response = await apiService.approveUser(itemId);
          console.log('✅ Approval API response:', response);
        } else {
          const response = await apiService.rejectUser(itemId, reason || '');
          console.log('✅ Rejection API response:', response);
        }
        
        // Wait a moment for backend to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh the specific user data from server
        try {
          console.log('🔄 Refreshing employer data from server...');
          const usersResponse = await apiService.getAllUsers({ userType: 'employer', page: 1, limit: 1000 }) as any;
          console.log('📦 Raw API response:', usersResponse);
          
          const employersRaw = usersResponse.data?.users || usersResponse.users || [];
          console.log(`📊 Found ${employersRaw.length} employers in response`);
          
          const employers = employersRaw.map(normalizeEmployer);
          const updatedEmployer = employers.find((e: Employer) => e._id === itemId);
          
          console.log('🔍 Updated employer data:', updatedEmployer ? {
            id: updatedEmployer._id,
            name: updatedEmployer.name,
            approvalStatus: updatedEmployer.approvalStatus,
            kycStatus: employersRaw.find((e: any) => e._id === itemId)?.kycStatus,
            status: employersRaw.find((e: any) => e._id === itemId)?.status
          } : 'Employer not found');
          
          if (updatedEmployer) {
            setData(prev => {
              const updatedEmployers = prev.employers.map((employer): Employer =>
                employer._id === itemId ? updatedEmployer : employer
              );
              
              const pendingEmployerApprovals = updatedEmployers.filter(e => e.approvalStatus === 'pending').length;
              
              console.log('✅ Updating UI with new status:', updatedEmployer.approvalStatus);
              
              return {
                ...prev,
                employers: updatedEmployers,
                overview: {
                  ...prev.overview,
                  pendingEmployerApprovals,
                },
              };
            });
          } else {
            console.error('❌ Updated employer not found in response');
            throw new Error('Employer not found in refresh response');
          }
        } catch (refreshError) {
          console.error('❌ Error refreshing employer data:', refreshError);
          // Fallback to optimistic update
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
        }
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

  const renderOverview = () => (
    <section className="space-y-6">
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
            <h3 className="text-lg font-semibold text-gray-900">Recent Job Posts</h3>
            <Briefcase className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-yellow-600 mb-2">{data.overview.recentPosts || data.overview.pendingJobApprovals || 0}</div>
          <p className="text-sm text-gray-600">Recent job posts (auto-approved)</p>
        </motion.div>
      </div>
    </section>
  );

  const renderStudents = () => (
    <section className="space-y-6">
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
    <section className="space-y-6">
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
    <section className="space-y-6">
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
                    {/* Jobs are auto-approved - no approval buttons needed */}
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
                      {/* Jobs are auto-approved - no approval buttons needed */}
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


  const renderApplications = () => (
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
        Real-time application flow is coming soon. You'll be able to monitor submissions, interviews, and hiring decisions directly here.
      </div>
    </section>
  );

  const renderKYC = () => (
    <section className="space-y-6">
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
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{data.kycStats.rejected}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600">{data.kycStats.approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage approvals, job listings, and KYC verifications</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow">
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                <Download className="w-4 h-4" />
                Export Report
              </button>
        </div>
      </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'students', label: 'Students' },
              { key: 'employers', label: 'Employers' },
              { key: 'jobs', label: 'Jobs' },
              { key: 'applications', label: 'Applications' },
              { key: 'kyc', label: 'KYC Verification' },
              ].map((tab) => (
                <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-2 rounded-xl border transition-colors text-sm font-medium ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                </button>
              ))}
            </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading admin data...</p>
                </div>
                </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'students' && renderStudents()}
            {activeTab === 'employers' && renderEmployers()}
            {activeTab === 'jobs' && renderJobs()}
            {activeTab === 'applications' && renderApplications()}
            {activeTab === 'kyc' && renderKYC()}
          </>
        )}
      </main>

        {showApprovalModal && (
        <ApprovalModal
          isOpen={showApprovalModal}
          itemType={approvalItemType}
          action={approvalAction}
          currentReason={approvalReason}
          onChangeReason={setApprovalReason}
          onClose={() => {
            setShowApprovalModal(false);
            setApprovalReason('');
          }}
          onSubmit={() => {
                      handleApproval(approvalItemId, approvalItemType, approvalAction, approvalReason);
                      setShowApprovalModal(false);
            setApprovalReason('');
          }}
        />
      )}

        {showKYCModal && selectedKYC && (
        <KYCModal
          isOpen={showKYCModal}
          onClose={() => setShowKYCModal(false)}
          kyc={selectedKYC}
          onApprove={() => {
                        setShowKYCModal(false);
            handleApproval(selectedKYC._id, 'kyc', 'approve');
          }}
          onReject={(reason) => {
                        setShowKYCModal(false);
            handleApproval(selectedKYC._id, 'kyc', 'reject', reason);
          }}
        />
                )}
              </div>
  );
}