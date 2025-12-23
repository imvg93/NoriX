'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  FileText, 
  Download,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  GraduationCap,
  Building2,
  Save,
  X,
  ArrowLeft,
  Home,
  Star,
  Shield,
  Loader
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
    salaryRange?: string;
  }>;
  documents: Array<{
    type: string;
    fileUrl: string;
  }>;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function StudentProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    college: '',
    skills: [] as string[],
    availability: '',
  });

  useEffect(() => {
    if (!isAuthenticated || !user || user.userType !== 'student') {
      setError('You need to be logged in as a student to view your profile.');
      setLoading(false);
      return;
    }

    if (user._id) {
      fetchProfileData();
    }
  }, [user?._id, isAuthenticated]);

  // Handle query params for auto-editing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      
      if (params.get('edit') === 'true') {
        setEditing(true);
        
        // Scroll to specific section if hash is provided
        if (hash) {
          setTimeout(() => {
            const element = document.querySelector(hash);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 300);
        }
      }
    }
  }, []);

  const fetchProfileData = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`/api/profile/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch profile data (${response.status})`);
      }

      const data = await response.json();
      if (data.student) {
        setProfileData(data);
        setFormData({
          name: data.student.name || '',
          phone: data.student.phone || '',
          address: data.student.address || '',
          college: data.student.college || '',
          skills: data.student.skills || [],
          availability: data.student.availability || '',
        });
      } else {
        setProfileData(data.data || data);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      if (err.name === 'AbortError') {
        setError('Request timeout. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          college: formData.college,
          skills: formData.skills.join(','),
          availability: formData.availability,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update profile' }));
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const responseData = await response.json();
      
      // Extract user data from response (handle different response formats)
      const updatedUserData = responseData.data?.user || responseData.user || responseData;
      
      // Update user context with new data immediately
      if (updateUser) {
        updateUser({
          name: updatedUserData.name || formData.name,
          phone: updatedUserData.phone || formData.phone,
          address: updatedUserData.address || formData.address,
          college: updatedUserData.college || formData.college,
          skills: updatedUserData.skills || formData.skills,
          availability: updatedUserData.availability || formData.availability,
        });
      }
      
      await fetchProfileData();
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert('Failed to save changes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved' || statusLower === 'accepted' || statusLower === 'completed') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
    } else if (statusLower === 'pending' || statusLower === 'applied') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <Clock className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
    } else if (statusLower === 'rejected') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        {status}
      </span>
    );
  };

  const getKYCBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved' || statusLower === 'verified') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3.5 h-3.5 mr-1" />
          Verified
        </span>
      );
    } else if (statusLower === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <Clock className="w-3.5 h-3.5 mr-1" />
          Under Review
        </span>
      );
    } else if (statusLower === 'rejected') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Not Submitted
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-[#2A8A8C] animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProfileData}
            className="px-4 py-2 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { student, workHistory = [], applications = [], documents = [] } = profileData || {};
  const kycStatus = student?.kycStatus || user?.kycStatus || 'not-submitted';
  const needsKYC = kycStatus === 'not-submitted' || !kycStatus;

  if (needsKYC && !loading && !error && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link href="/" className="flex items-center">
                <img src="/img/norixnobg.jpg" alt="NoriX logo" className="h-8 sm:h-10 w-auto" />
              </Link>
              <Link href="/" className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Home className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <div className="text-center max-w-md">
            <Shield className="w-16 h-16 text-[#2A8A8C] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Your KYC Verification</h2>
            <p className="text-sm text-gray-600 mb-6">
              To view your profile, please complete your KYC verification.
            </p>
            <Link
              href="/kyc-profile"
              className="inline-flex items-center px-6 py-3 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-colors font-medium text-sm"
            >
              <FileText className="w-5 h-5 mr-2" />
              Complete KYC Verification
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-sm text-gray-600 mb-4">No profile data available</p>
          <button
            onClick={fetchProfileData}
            className="px-4 py-2 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-colors text-sm"
          >
            Refresh Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link href="/" className="flex items-center">
              <img src="/img/norixnobg.jpg" alt="NoriX logo" className="h-8 sm:h-10 w-auto" />
            </Link>
            <Link href="/" className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Home className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Profile Header - Compact */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2A8A8C]/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#2A8A8C]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">{student.name}</h1>
                <p className="text-xs sm:text-sm text-gray-600">{student.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getKYCBadge(student.kycStatus)}
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Stats - Compact */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 pt-3 border-t border-gray-100">
            <div className="text-center">
              <div className="text-base sm:text-lg font-bold text-[#2A8A8C]">{applications.length}</div>
              <div className="text-xs text-gray-600">Applications</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-lg font-bold text-green-600">{workHistory.length}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-lg font-bold text-purple-600">{documents.length}</div>
              <div className="text-xs text-gray-600">Documents</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-lg font-bold text-blue-600">{student.skills?.length || 0}</div>
              <div className="text-xs text-gray-600">Skills</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Personal Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#2A8A8C]" />
                  Personal Information
                </h3>
              </div>
              
              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8C] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8C] focus:border-transparent"
                      />
                    </div>
                    <div id="location">
                      <label className="block text-xs font-medium text-gray-700 mb-1">College</label>
                      <input
                        type="text"
                        value={formData.college}
                        onChange={(e) => setFormData({...formData, college: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8C] focus:border-transparent"
                      />
                    </div>
                    <div id="availability">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Availability</label>
                      <select
                        value={formData.availability}
                        onChange={(e) => setFormData({...formData, availability: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8C] focus:border-transparent"
                      >
                        <option value="">Select</option>
                        <option value="weekdays">Weekdays</option>
                        <option value="weekends">Weekends</option>
                        <option value="both">Both</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8C] focus:border-transparent resize-none"
                    />
                  </div>
                  <div id="skills">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                    <input
                      type="text"
                      value={formData.skills.join(', ')}
                      onChange={(e) => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                      placeholder="React, Node.js, TypeScript"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8C] focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 px-3 py-2 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-colors text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Save
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: student.name || '',
                          phone: student.phone || '',
                          address: student.address || '',
                          college: student.college || '',
                          skills: student.skills || [],
                          availability: student.availability || '',
                        });
                      }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
                    >
                      <X className="w-3.5 h-3.5 inline mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-500">Email</p>
                      <p className="text-xs sm:text-sm text-gray-900">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-500">Phone</p>
                      <p className="text-xs sm:text-sm text-gray-900">{student.phone}</p>
                    </div>
                  </div>
                  {student.address && (
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500">Address</p>
                        <p className="text-xs sm:text-sm text-gray-900">{student.address}</p>
                      </div>
                    </div>
                  )}
                  {student.college && (
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <GraduationCap className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500">College</p>
                        <p className="text-xs sm:text-sm text-gray-900">{student.college}</p>
                      </div>
                    </div>
                  )}
                  {student.emergencyContact && (
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500">Emergency Contact</p>
                        <p className="text-xs sm:text-sm text-gray-900">{student.emergencyContact.name}</p>
                        <p className="text-xs text-gray-600">{student.emergencyContact.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Skills & Experience */}
            {(student.skills?.length > 0 || student.experience) && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1.5 mb-3">
                  <Briefcase className="w-4 h-4 text-[#2A8A8C]" />
                  Skills & Experience
                </h3>
                {student.skills && student.skills.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {student.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#2A8A8C]/10 text-[#2A8A8C]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {student.experience && (
                  <div>
                    <p className="text-xs text-gray-900 leading-relaxed">{student.experience}</p>
                  </div>
                )}
              </div>
            )}

            {/* Applications */}
            {applications.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1.5 mb-3">
                  <FileText className="w-4 h-4 text-[#2A8A8C]" />
                  Applications ({applications.length})
                </h3>
                <div className="space-y-2">
                  {applications.slice(0, 5).map((app) => (
                    <div key={app._id} className="border border-gray-200 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-0.5">{app.jobTitle}</h4>
                          <p className="text-xs text-gray-600">{app.company}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{formatDate(app.appliedAt)}</p>
                        </div>
                        <div className="ml-2 flex-shrink-0">
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
          <div className="space-y-3 sm:space-y-4">
            {/* Documents */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-3">
                <FileText className="w-4 h-4 text-[#2A8A8C]" />
                Documents ({documents.length})
              </h3>
              {documents.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-500">No documents</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <p className="text-xs font-medium text-gray-900 truncate">{doc.type}</p>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 bg-[#2A8A8C]/10 rounded-lg hover:bg-[#2A8A8C]/20 transition-colors text-[#2A8A8C] flex-shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Work History */}
            {workHistory.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-3">
                  <Star className="w-4 h-4 text-[#2A8A8C]" />
                  Completed ({workHistory.length})
                </h3>
                <div className="space-y-2">
                  {workHistory.slice(0, 3).map((work, index) => (
                    <div key={index} className="border-l-3 border-green-500 pl-2.5 py-2 bg-green-50 rounded-r-lg">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-0.5">{work.jobTitle}</h4>
                      <p className="text-xs text-gray-600 mb-0.5">{work.company}</p>
                      <p className="text-xs text-gray-500">{formatDate(work.completedAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
