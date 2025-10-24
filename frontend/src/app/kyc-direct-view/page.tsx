'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Search,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  User,
  CreditCard,
  FileCheck,
  Download,
  Clock
} from 'lucide-react';

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

export default function DirectKYCView() {
  const [kycSubmissions, setKycSubmissions] = useState<KYCSubmission[]>([]);
  const [kycStats, setKycStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);
  const [error, setError] = useState('');

  // Mock data based on your database
  const mockKYCData: KYCSubmission[] = [
    {
      _id: '68b49db25e342b41a185ecc2',
      userId: {
        _id: '68b49db25e342b41a185ecc2',
        name: 'girish veeranki',
        email: 'priya.sharma@example.com',
        phone: '8790373016',
        userType: 'student'
      },
      fullName: 'Priya Sharma',
      dob: '2000-01-15',
      gender: 'Female',
      phone: '8790373016',
      email: 'priya.sharma@example.com',
      address: '789 Tech Park Road, HITEC City, Hyderabad, Telangana 500081',
      college: 'JNTU Hyderabad',
      courseYear: 'B.Com 2nd Year',
      stayType: 'Hostel',
      hoursPerWeek: 15,
      availableDays: ['saturday', 'sunday'],
      emergencyContact: {
        name: 'Rajesh Sharma',
        phone: '9876543210'
      },
      bloodGroup: 'B+',
      preferredJobTypes: ['retail', 'data-entry'],
      experienceSkills: 'Basic computer skills, customer service experience',
      payroll: {
        consent: true,
        bankAccount: '1234567890',
        ifsc: 'SBIN0001234',
        beneficiaryName: 'Priya Sharma'
      },
      verificationStatus: 'in-review',
      submittedAt: '2025-09-10T10:00:00Z',
      aadharCard: 'https://example.com/aadhar1.pdf',
      collegeIdCard: 'https://example.com/collegeid1.pdf'
    },
    {
      _id: '68c171d3a03de5adeb6160c1',
      userId: {
        _id: '68c171d3a03de5adeb6160c1',
        name: 'anandh',
        email: 'wasawi8388@mirarmax.com',
        phone: '8790373016',
        userType: 'student'
      },
      fullName: 'ANANDH KUMAR',
      dob: '2001-05-20',
      gender: 'Male',
      phone: '8790373016',
      email: 'wasawi8388@mirarmax.com',
      address: 'vijayawada',
      college: 'nri institution of technology',
      courseYear: 'btech 4th year',
      stayType: 'Day Scholar',
      hoursPerWeek: 20,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      emergencyContact: {
        name: 'Kumar Reddy',
        phone: '9876543211'
      },
      bloodGroup: 'O+',
      preferredJobTypes: ['delivery'],
      experienceSkills: 'Technical skills, problem solving',
      payroll: {
        consent: true,
        bankAccount: '0987654321',
        ifsc: 'HDFC0005678',
        beneficiaryName: 'ANANDH KUMAR'
      },
      verificationStatus: 'in-review',
      submittedAt: '2025-09-10T11:00:00Z',
      aadharCard: 'https://example.com/aadhar2.pdf',
      collegeIdCard: 'https://example.com/collegeid2.pdf'
    }
  ];

  useEffect(() => {
    // Simulate API call with mock data
    setTimeout(() => {
      setKycSubmissions(mockKYCData);
      setKycStats({
        total: 2,
        pending: 0,
        approved: 0,
        rejected: 0
      });
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in-review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'in-review': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredKYCSubmissions = kycSubmissions.filter(kyc => {
    const matchesSearch = kyc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kyc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kyc.college.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || kyc.verificationStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (kycId: string) => {
    alert(`KYC ${kycId} has been approved! (This is a demo)`);
  };

  const handleReject = (kycId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      alert(`KYC ${kycId} has been rejected with reason: "${reason}" (This is a demo)`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">KYC Management - Direct View</h1>
            <p className="text-gray-600">Complete student KYC details with approval controls</p>
          </div>
          <div className="flex gap-3">
            <a 
              href="/admin/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Admin
            </a>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* KYC Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total KYC</p>
                <p className="text-3xl font-bold text-blue-700">{kycStats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-yellow-50 p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">In Review</p>
                <p className="text-3xl font-bold text-yellow-700">{kycStats.total}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-green-50 p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Approved</p>
                <p className="text-3xl font-bold text-green-700">{kycStats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-red-50 p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejected</p>
                <p className="text-3xl font-bold text-red-700">{kycStats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search KYC submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* KYC Submissions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredKYCSubmissions.map((kyc) => (
                    <motion.tr 
                      key={kyc._id}
                      className="hover:bg-gray-50"
                      whileHover={{ backgroundColor: '#f9fafb' }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{kyc.fullName}</div>
                          <div className="text-sm text-gray-500">{kyc.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kyc.college}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          {kyc.aadharCard && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Aadhaar</span>
                          )}
                          {kyc.collegeIdCard && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">College ID</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(kyc.verificationStatus)}`}>
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
                            onClick={() => setSelectedKYC(kyc)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApprove(kyc._id)}
                            className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(kyc._id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
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
          )}

          {filteredKYCSubmissions.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No KYC submissions found</p>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Debug Information:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Total Submissions:</strong> {kycSubmissions.length}</p>
            <p><strong>Filtered Submissions:</strong> {filteredKYCSubmissions.length}</p>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
          </div>
        </div>
      </div>

      {/* Comprehensive KYC Details Modal */}
      <AnimatePresence>
        {showKYCModal && selectedKYC && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Complete KYC Details</h3>
                      <p className="text-sm text-gray-600">{selectedKYC.fullName} - {selectedKYC.college}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowKYCModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <h4 className="text-lg font-medium text-gray-900">Personal Information</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Full Name</label>
                          <p className="text-sm text-gray-900 font-medium">{selectedKYC.fullName}</p>
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
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Phone className="w-5 h-5 text-green-600" />
                      <h4 className="text-lg font-medium text-gray-900">Contact Information</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
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
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                      <h4 className="text-lg font-medium text-gray-900">Academic Information</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedKYC.college}</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Course Year</label>
                        <p className="text-sm text-gray-900">{selectedKYC.courseYear}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Stay Type</label>
                        <p className="text-sm text-gray-900">{selectedKYC.stayType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Work Preferences */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <h4 className="text-lg font-medium text-gray-900">Work Preferences</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
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
                      <div>
                        <label className="text-sm font-medium text-gray-600">Experience & Skills</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedKYC.experienceSkills}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Phone className="w-5 h-5 text-red-600" />
                      <h4 className="text-lg font-medium text-gray-900">Emergency Contact</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
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

                  {/* Payroll Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-lg font-medium text-gray-900">Payroll Information</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedKYC.payroll.consent} readOnly className="rounded" />
                        <span className="text-sm text-gray-900">Payroll Consent Given</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Bank Account</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedKYC.payroll.bankAccount}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">IFSC Code</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedKYC.payroll.ifsc}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Beneficiary Name</label>
                        <p className="text-sm text-gray-900">{selectedKYC.payroll.beneficiaryName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileCheck className="w-5 h-5 text-green-600" />
                      <h4 className="text-lg font-medium text-gray-900">Documents</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {selectedKYC.aadharCard && (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-900">Aadhaar Card</span>
                          </div>
                          <a 
                            href={selectedKYC.aadharCard} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                          >
                            <Download className="w-3 h-3" />
                            View
                          </a>
                        </div>
                      )}
                      {selectedKYC.collegeIdCard && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-900">College ID Card</span>
                          </div>
                          <a 
                            href={selectedKYC.collegeIdCard} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                          >
                            <Download className="w-3 h-3" />
                            View
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
                  <button
                    onClick={() => {
                      setShowKYCModal(false);
                      handleReject(selectedKYC._id);
                    }}
                    className="px-6 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors font-medium"
                  >
                    Reject KYC
                  </button>
                  <button
                    onClick={() => {
                      setShowKYCModal(false);
                      handleApprove(selectedKYC._id);
                    }}
                    className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Approve KYC
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
