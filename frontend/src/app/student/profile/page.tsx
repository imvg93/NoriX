'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Award, 
  FileText, 
  Download,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  GraduationCap,
  Building2,
  Clock as ClockIcon,
  Save,
  X,
  ArrowLeft,
  Home,
  Star,
  TrendingUp,
  Target
} from 'lucide-react';
import Link from 'next/link';

interface ProfileData {
  student: {
    name: string;
    email: string;
    phone: string;
    kycStatus: string;
    role: string;
    skills: string[];
    experience: string;
    college?: string;
    availability?: string;
    dob?: string;
    gender?: string;
    address?: string;
    courseYear?: string;
    hoursPerWeek?: number;
    preferredJobTypes?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
    };
  };
  workHistory: Array<{
    jobTitle: string;
    company: string;
    status: string;
    completedAt: string;
  }>;
  applications: Array<{
    _id: string;
    jobTitle: string;
    company: string;
    location: string;
    status: string;
    appliedAt: string;
    coverLetter?: string;
    expectedPay?: number;
    salaryRange?: string;
  }>;
  documents: Array<{
    type: string;
    fileUrl: string;
  }>;
}

export default function StudentProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Edit mode states
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form data states
  const [personalForm, setPersonalForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    gender: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });
  
  const [professionalForm, setProfessionalForm] = useState({
    skills: [] as string[],
    experience: '',
    availability: '',
    college: '',
    courseYear: '',
    hoursPerWeek: '',
    preferredJobTypes: [] as string[]
  });

  // Hide scrollbar effect - must be called before any conditional returns
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      html::-webkit-scrollbar,
      body::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      html {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      body {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Remove style when component unmounts
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    if (!isAuthenticated || !user) {
      setError('You need to be logged in to view your profile.');
      setLoading(false);
      return;
    }

    if (user.userType !== 'student') {
      setError('This page is only accessible to students.');
      setLoading(false);
      return;
    }

    if (user._id) {
      fetchProfileData();
    }
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, isAuthenticated]);

  const fetchProfileData = async () => {
    if (!user?._id) {
      console.log('⚠️ No user ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found');
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching profile for user:', user._id);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`/api/profile/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Error response:', errorData);
        
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
          setLoading(false);
          return;
        }
        throw new Error(errorData.error || `Failed to fetch profile data (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Profile data received:', {
        hasStudent: !!data.student,
        hasApplications: Array.isArray(data.applications),
        hasWorkHistory: Array.isArray(data.workHistory),
        hasDocuments: Array.isArray(data.documents)
      });

      if (data.student) {
        setProfileData(data);
        // Initialize form data
        setPersonalForm({
          name: data.student.name || '',
          email: data.student.email || '',
          phone: data.student.phone || '',
          address: data.student.address || '',
          dob: data.student.dob || '',
          gender: data.student.gender || '',
          emergencyContactName: data.student.emergencyContact?.name || '',
          emergencyContactPhone: data.student.emergencyContact?.phone || ''
        });
        setProfessionalForm({
          skills: data.student.skills || [],
          experience: data.student.experience || '',
          availability: data.student.availability || '',
          college: data.student.college || '',
          courseYear: data.student.courseYear || '',
          hoursPerWeek: data.student.hoursPerWeek?.toString() || '',
          preferredJobTypes: data.student.preferredJobTypes || []
        });
      } else {
        setProfileData(data.data || data);
      }
    } catch (err: any) {
      console.error('❌ Error fetching profile:', err);
      if (err.name === 'AbortError') {
        setError('Request timeout. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonal = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: personalForm.name,
          address: personalForm.address,
          phone: personalForm.phone
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update profile' }));
        throw new Error(errorData.error || 'Failed to update profile');
      }

      await fetchProfileData();
      setEditingPersonal(false);
      
      // Show success message
      alert('Personal information updated successfully!');
    } catch (err: any) {
      console.error('Error saving personal info:', err);
      alert('Failed to save changes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfessional = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          college: professionalForm.college,
          skills: professionalForm.skills.join(','),
          availability: professionalForm.availability,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update profile' }));
        throw new Error(errorData.error || 'Failed to update profile');
      }

      await fetchProfileData();
      setEditingProfessional(false);
      
      // Show success message
      alert('Professional information updated successfully!');
    } catch (err: any) {
      console.error('Error saving professional info:', err);
      alert('Failed to save changes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved' || statusLower === 'accepted' || statusLower === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
    } else if (statusLower === 'pending' || statusLower === 'applied') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
    } else if (statusLower === 'rejected') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        {status}
      </span>
    );
  };

  const getKYCBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved' || statusLower === 'verified') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-4 h-4 mr-1" />
          Verified
        </span>
      );
    } else if (statusLower === 'pending') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-4 h-4 mr-1" />
          Under Review
        </span>
      );
    } else if (statusLower === 'rejected') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="w-4 h-4 mr-1" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        Not Submitted
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">Loading profile...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">This may take a few seconds</p>
          <button
            onClick={() => {
              setLoading(false);
              setError('Loading cancelled. Please refresh the page.');
            }}
            className="mt-4 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <XCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchProfileData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { student, workHistory = [], applications = [], documents = [] } = profileData || {};

  // Check if KYC is not submitted - check both from profileData and user context
  const kycStatus = student?.kycStatus || user?.kycStatus || 'not-submitted';
  const needsKYC = kycStatus === 'not-submitted' || !kycStatus;

  // Show KYC completion message if KYC not submitted (but only if we have user data)
  if (needsKYC && !loading && !error && user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header with Back, Home, and Centered Logo */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Left: Back button */}
              <div className="flex items-center">
                <button
                  onClick={() => router.back()}
                  className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors active:scale-95"
                  title="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Center: Logo */}
              <div className="flex-1 flex justify-center px-2 sm:px-0">
                <Link href="/" className="flex items-center">
                  <img
                    src="/img/norixnobg.jpg"
                    alt="NoriX logo"
                    className="h-9 sm:h-10 w-auto object-contain"
                  />
                </Link>
              </div>

              {/* Right: Home button */}
              <div className="flex items-center">
                <Link
                  href="/"
                  className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors active:scale-95"
                  title="Home"
                >
                  <Home className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* KYC Completion Message */}
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <div className="text-center max-w-md">
            <div className="text-indigo-600 dark:text-indigo-400 mb-4">
              <FileText className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Complete Your KYC Verification</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              To view your profile, please complete your KYC (Know Your Customer) verification. This helps us ensure the security and authenticity of all users.
            </p>
            <Link
              href="/kyc-verification"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <FileText className="w-5 h-5 mr-2" />
              Complete KYC Verification
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!student && !loading && !error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No profile data available</p>
          <button
            onClick={fetchProfileData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Refresh Profile
          </button>
        </div>
      </div>
    );
  }

  // Safety check - ensure student exists before rendering profile
  if (!student) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Back, Home, and Centered Logo */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Back button */}
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors active:scale-95"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Center: Logo */}
            <div className="flex-1 flex justify-center px-2 sm:px-0">
              <Link href="/" className="flex items-center">
                <img
                  src="/img/norixnobg.jpg"
                  alt="NoriX logo"
                  className="h-9 sm:h-10 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Right: Home button */}
            <div className="flex items-center">
              <Link
                href="/"
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors active:scale-95"
                title="Home"
              >
                <Home className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{student.name}</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">{student.role}</p>
                {student.college && (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1.5 sm:mt-1 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{student.college}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex justify-center sm:justify-end">
                {getKYCBadge(student.kycStatus)}
              </div>
              <button
                onClick={() => setEditingPersonal(true)}
                className="inline-flex items-center justify-center px-4 py-2 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95"
              >
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm">Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{applications.length}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">Applications</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{workHistory.length}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">Completed Jobs</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{documents.length}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">Documents</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{student.skills?.length || 0}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">Skills</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Personal Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-lg">Personal Information</span>
                </h3>
                {!editingPersonal && (
                  <button
                    onClick={() => setEditingPersonal(true)}
                    className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 px-2 py-1 sm:px-0 sm:py-0 rounded sm:rounded-none hover:bg-indigo-50 dark:hover:bg-indigo-900/20 sm:hover:bg-transparent transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                )}
              </div>
              
              <div className="p-4 sm:p-6">
                {editingPersonal ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Name</label>
                        <input
                          type="text"
                          value={personalForm.name}
                          onChange={(e) => setPersonalForm({...personalForm, name: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Email</label>
                        <input
                          type="email"
                          value={personalForm.email}
                          disabled
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Phone</label>
                        <input
                          type="tel"
                          value={personalForm.phone}
                          onChange={(e) => setPersonalForm({...personalForm, phone: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Date of Birth</label>
                        <input
                          type="date"
                          value={personalForm.dob}
                          onChange={(e) => setPersonalForm({...personalForm, dob: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Gender</label>
                        <select
                          value={personalForm.gender}
                          onChange={(e) => setPersonalForm({...personalForm, gender: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Emergency Contact Name</label>
                        <input
                          type="text"
                          value={personalForm.emergencyContactName}
                          onChange={(e) => setPersonalForm({...personalForm, emergencyContactName: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Address</label>
                      <textarea
                        value={personalForm.address}
                        onChange={(e) => setPersonalForm({...personalForm, address: e.target.value})}
                        rows={3}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        value={personalForm.emergencyContactPhone}
                        onChange={(e) => setPersonalForm({...personalForm, emergencyContactPhone: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                      <button
                        onClick={handleSavePersonal}
                        disabled={saving}
                        className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base font-medium flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span className="text-xs sm:text-sm">Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span className="text-xs sm:text-sm">Save Changes</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPersonal(false);
                          setPersonalForm({
                            name: student.name || '',
                            email: student.email || '',
                            phone: student.phone || '',
                            address: student.address || '',
                            dob: student.dob || '',
                            gender: student.gender || '',
                            emergencyContactName: student.emergencyContact?.name || '',
                            emergencyContactPhone: student.emergencyContact?.phone || ''
                          });
                        }}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base font-medium active:scale-95"
                      >
                        <X className="w-4 h-4 inline mr-1.5 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white break-words">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white break-words">{student.phone}</p>
                        </div>
                      </div>
                      {student.dob && (
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</p>
                            <p className="text-sm sm:text-base text-gray-900 dark:text-white">{student.dob}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      {student.gender && (
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Gender</p>
                            <p className="text-sm sm:text-base text-gray-900 dark:text-white capitalize">{student.gender}</p>
                          </div>
                        </div>
                      )}
                      {student.address && (
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                            <p className="text-sm sm:text-base text-gray-900 dark:text-white break-words">{student.address}</p>
                          </div>
                        </div>
                      )}
                      {student.emergencyContact && (
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Emergency Contact</p>
                            <p className="text-sm sm:text-base text-gray-900 dark:text-white break-words">{student.emergencyContact.name}</p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{student.emergencyContact.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-lg">Professional Information</span>
                </h3>
                {!editingProfessional && (
                  <button
                    onClick={() => setEditingProfessional(true)}
                    className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 px-2 py-1 sm:px-0 sm:py-0 rounded sm:rounded-none hover:bg-indigo-50 dark:hover:bg-indigo-900/20 sm:hover:bg-transparent transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                )}
              </div>
              
              <div className="p-4 sm:p-6">
                {editingProfessional ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">College</label>
                        <input
                          type="text"
                          value={professionalForm.college}
                          onChange={(e) => setProfessionalForm({...professionalForm, college: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Course Year</label>
                        <input
                          type="text"
                          value={professionalForm.courseYear}
                          onChange={(e) => setProfessionalForm({...professionalForm, courseYear: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Availability</label>
                        <select
                          value={professionalForm.availability}
                          onChange={(e) => setProfessionalForm({...professionalForm, availability: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Select</option>
                          <option value="weekdays">Weekdays</option>
                          <option value="weekends">Weekends</option>
                          <option value="both">Both</option>
                          <option value="flexible">Flexible</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Hours Per Week</label>
                        <input
                          type="number"
                          value={professionalForm.hoursPerWeek}
                          onChange={(e) => setProfessionalForm({...professionalForm, hoursPerWeek: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Skills (comma separated)</label>
                      <input
                        type="text"
                        value={professionalForm.skills.join(', ')}
                        onChange={(e) => setProfessionalForm({...professionalForm, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                        placeholder="React, Node.js, TypeScript"
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Experience</label>
                      <textarea
                        value={professionalForm.experience}
                        onChange={(e) => setProfessionalForm({...professionalForm, experience: e.target.value})}
                        rows={4}
                        placeholder="Describe your work experience and skills..."
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                      <button
                        onClick={handleSaveProfessional}
                        disabled={saving}
                        className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base font-medium flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span className="text-xs sm:text-sm">Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span className="text-xs sm:text-sm">Save Changes</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingProfessional(false);
                          setProfessionalForm({
                            skills: student.skills || [],
                            experience: student.experience || '',
                            availability: student.availability || '',
                            college: student.college || '',
                            courseYear: student.courseYear || '',
                            hoursPerWeek: student.hoursPerWeek?.toString() || '',
                            preferredJobTypes: student.preferredJobTypes || []
                          });
                        }}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base font-medium active:scale-95"
                      >
                        <X className="w-4 h-4 inline mr-1.5 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {student.skills && student.skills.length > 0 && (
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {student.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {student.experience && (
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Experience
                        </p>
                        <p className="text-sm sm:text-base text-gray-900 dark:text-white leading-relaxed">{student.experience}</p>
                      </div>
                    )}
                    
                    {student.availability && (
                      <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                        <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Availability</p>
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium capitalize">{student.availability}</p>
                        </div>
                      </div>
                    )}
                    
                    {student.preferredJobTypes && student.preferredJobTypes.length > 0 && (
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Preferred Job Types
                        </p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {student.preferredJobTypes.map((type, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 capitalize"
                            >
                              {type.replace('-', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Work History */}
            {workHistory.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-lg">Work History / Completed Projects</span>
                  </h3>
                </div>
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {workHistory.map((work, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-3 sm:pl-4 py-2.5 sm:py-3 bg-green-50 dark:bg-green-900/20 rounded-r-lg">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 break-words">{work.jobTitle}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1.5 sm:mb-2">
                            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="break-words">{work.company}</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Completed: {new Date(work.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="self-start sm:self-auto">
                          {getStatusBadge(work.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Job Applications */}
            {applications.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-lg">Job Applications</span>
                  </h3>
                </div>
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {applications.map((app) => (
                    <div key={app._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2 break-words">{app.jobTitle}</h4>
                          <div className="space-y-1 text-xs sm:text-sm">
                            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="break-words">{app.company}</span>
                            </p>
                            <p className="text-gray-500 dark:text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="break-words">{app.location}</span>
                            </p>
                            <p className="text-gray-500 dark:text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              Applied: {new Date(app.appliedAt).toLocaleDateString()}
                            </p>
                            {app.salaryRange && (
                              <p className="text-gray-500 dark:text-gray-500 break-words">
                                Salary: {app.salaryRange}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="self-start sm:self-auto sm:ml-4 mt-1 sm:mt-0">
                          {getStatusBadge(app.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Documents */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-lg">Documents</span>
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                {documents.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No documents uploaded</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 sm:space-y-3">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">{doc.type}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Document</p>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-indigo-600 dark:text-indigo-400 flex-shrink-0 active:scale-95"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Empty States */}
            {workHistory.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
                <Award className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">No work history yet</p>
                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">Start applying to build your portfolio</p>
              </div>
            )}

            {applications.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">No applications yet</p>
                <Link href="/jobs" className="inline-block mt-2 sm:mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm font-medium active:scale-95">
                  Browse Jobs
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
