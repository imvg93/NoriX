"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Briefcase,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  Loader,
  Calendar,
  Wallet,
  TrendingUp,
  FileText,
  Building,
  MapPin,
  User,
  Shield,
  Target,
  Zap,
  Users,
  Star,
  AlertCircle,
  Settings,
  Bell,
  Camera,
  Eye,
  Bookmark,
  BookOpen,
  MessageSquare,
  TrendingDown,
  AlertTriangle,
  Info,
  Upload,
  X
} from 'lucide-react';
import { apiService, type Application } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface StudentDashboardProps {
  user: any;
}

interface EarningsData {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastPayoutDate: string | null;
  pendingAmount: number;
}

interface ReadinessItem {
  label: string;
  completed: boolean;
  href?: string;
  impact: string;
}

interface DashboardState {
  type: 'new' | 'active' | 'earning';
  hasApplications: boolean;
  hasEarnings: boolean;
}

interface Alert {
  id: string;
  type: 'urgent' | 'info' | 'warning';
  message: string;
  action?: string;
  href?: string;
}

// Predefined safe rejection reasons
const SAFE_REJECTION_REASONS: Record<string, string> = {
  'position_filled': 'Position filled',
  'skills_mismatch': 'Skills mismatch',
  'availability_issue': 'Availability issue',
  'location_constraint': 'Location constraint',
  'employer_chose_another': 'Employer chose another candidate',
  'other': 'Not selected'
};

// High demand skills (would come from API)
const HIGH_DEMAND_SKILLS = ['Delivery', 'Support', 'Excel', 'Data Entry', 'Customer Service'];

// Learning resources
const LEARNING_RESOURCES = [
  { title: '15-min Excel basics', impact: 'Unlock more jobs', icon: BookOpen },
  { title: 'Communication tips for interviews', impact: 'Better responses', icon: MessageSquare },
];

const INDIAN_CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const formatCurrency = (amount: number): string => {
  return `₹${INDIAN_CURRENCY_FORMATTER.format(amount)}`;
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Calculate job match strength (without skills, includes profile picture)
const calculateJobMatchStrength = (user: any): { score: number; breakdown: Array<{ label: string; status: 'strong' | 'partial' | 'missing'; icon: any; href?: string }> } => {
  const hasAvailability = !!user?.availability;
  const hasLocation = !!(user?.address || user?.college);
  const hasProfilePicture = !!user?.profilePicture;
  
  const breakdown: Array<{ label: string; status: 'strong' | 'partial' | 'missing'; icon: any; href?: string }> = [
    {
      label: 'Profile Picture',
      status: hasProfilePicture ? 'strong' as const : 'missing' as const,
      icon: Camera,
      href: !hasProfilePicture ? '/student/profile?edit=true#photo' : undefined
    },
    {
      label: 'Availability',
      status: hasAvailability ? 'strong' as const : (user?.availability ? 'partial' as const : 'missing' as const),
      icon: Calendar,
      href: !hasAvailability ? '/student/profile?edit=true#availability' : undefined
    },
    {
      label: 'Location',
      status: hasLocation ? 'strong' as const : 'missing' as const,
      icon: MapPin,
      href: !hasLocation ? '/student/profile?edit=true#location' : undefined
    }
  ];
  
  const strongCount = breakdown.filter(b => b.status === 'strong').length;
  const partialCount = breakdown.filter(b => b.status === 'partial').length;
  const score = breakdown.length > 0 ? Math.round((strongCount * 100 + partialCount * 50) / breakdown.length) : 0;
  
  return { score, breakdown };
};

// Calculate readiness score - updates dynamically based on user data
const calculateReadiness = (user: any): { score: number; items: ReadinessItem[] } => {
  const items: ReadinessItem[] = [];
  
  // Check current state of each item
  const hasSkills = user?.skills && Array.isArray(user.skills) && user.skills.length > 0;
  const hasAvailability = !!user?.availability;
  const hasLocation = !!(user?.address || user?.college);
  const isVerified = user?.kycStatus === 'approved' || user?.isVerified;
  const hasPhoto = !!user?.profilePicture;
  
  // Only add incomplete items to the list
  if (!hasSkills) {
    items.push({
      label: 'Skills added',
      completed: false,
      href: '/student/profile?edit=true#skills',
      impact: 'Unlock skill-based jobs'
    });
  }
  
  if (!hasAvailability) {
    items.push({
      label: 'Availability',
      completed: false,
      href: '/student/profile?edit=true#availability',
      impact: 'Unlock on-site jobs'
    });
  }
  
  if (!hasLocation) {
    items.push({
      label: 'Location',
      completed: false,
      href: '/student/profile?edit=true#location',
      impact: 'Show local opportunities'
    });
  }
  
  if (!isVerified) {
    items.push({
      label: 'Verification',
      completed: false,
      href: '/kyc-profile',
      impact: 'Apply for verified employers'
    });
  }
  
  if (!hasPhoto) {
    items.push({
      label: 'Profile Photo',
      completed: false,
      href: '/student/profile?edit=true#photo',
      impact: '40% more responses'
    });
  }
  
  // Calculate score based on all 5 items (even if some are completed)
  const totalItems = 5;
  const completedCount = (hasSkills ? 1 : 0) + 
                         (hasAvailability ? 1 : 0) + 
                         (hasLocation ? 1 : 0) + 
                         (isVerified ? 1 : 0) + 
                         (hasPhoto ? 1 : 0);
  const score = Math.round((completedCount / totalItems) * 100);
  
  return { score, items };
};

// Calculate response rate
const calculateResponseRate = (applications: Application[]): { sent: number; responses: number; rate: number } => {
  const sent = applications.length;
  const responses = applications.filter(app => {
    const status = app.status?.toLowerCase();
    return status === 'accepted' || status === 'approved' || status === 'shortlisted' || status === 'rejected';
  }).length;
  const rate = sent > 0 ? Math.round((responses / sent) * 100) : 0;
  return { sent, responses, rate };
};

// Get status badge configuration
const getStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase();
  
  if (statusLower === 'applied' || statusLower === 'pending') {
    return {
      text: 'Applied',
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      dotColor: 'bg-yellow-500'
    };
  } else if (statusLower === 'accepted' || statusLower === 'approved' || statusLower === 'shortlisted') {
    return {
      text: 'Shortlisted',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      dotColor: 'bg-blue-500'
    };
  } else if (statusLower === 'hired' || statusLower === 'completed') {
    return {
      text: 'Hired',
      color: 'bg-green-50 text-green-700 border-green-200',
      dotColor: 'bg-green-500'
    };
  } else if (statusLower === 'rejected' || statusLower === 'closed') {
    return {
      text: 'Not selected',
      color: 'bg-gray-50 text-gray-600 border-gray-200',
      dotColor: 'bg-gray-400'
    };
  }
  
  return {
    text: 'Applied',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    dotColor: 'bg-yellow-500'
  };
};

const getRejectionReason = (application: Application): string | null => {
  if (application.status?.toLowerCase() !== 'rejected') return null;
  
  const notes = (application as any).employerNotes || '';
  if (!notes) return SAFE_REJECTION_REASONS['other'];
  
  const notesLower = notes.toLowerCase();
  for (const [key, value] of Object.entries(SAFE_REJECTION_REASONS)) {
    const keyLower = key.toLowerCase().replace(/_/g, ' ');
    const valueLower = value.toLowerCase();
    if (notesLower.includes(keyLower) || notesLower.includes(valueLower)) {
      return value;
    }
  }
  
  return SAFE_REJECTION_REASONS['other'];
};

const getDashboardState = (applications: Application[], earnings: number): DashboardState => {
  const hasApplications = applications.length > 0;
  const hasEarnings = earnings > 0;
  
  if (hasEarnings) {
    return { type: 'earning', hasApplications, hasEarnings };
  } else if (hasApplications) {
    return { type: 'active', hasApplications, hasEarnings };
  } else {
    return { type: 'new', hasApplications, hasEarnings };
  }
};

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user: userProp }) => {
  const router = useRouter();
  const { updateUser, user: userFromContext } = useAuth();
  
  // Use user from context if available (more up-to-date), otherwise use prop
  // This ensures the dashboard updates when user data changes in context
  const user = userFromContext || userProp;
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: user?.totalEarnings || 0,
    thisMonthEarnings: 0,
    lastPayoutDate: null,
    pendingAmount: 0
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Handle successful upload
  const handleUploadSuccess = async (data: any) => {
    console.log('✅ Upload success:', data);
    
    // Extract profile picture URL from response (handle different response formats)
    const profilePictureUrl = data.data?.profilePicture || 
                             data.profilePicture || 
                             data.data?.avatarUrls?.original ||
                             data.avatarUrls?.original ||
                             data.data?.avatarUrls?.medium ||
                             data.avatarUrls?.medium;
    
    if (profilePictureUrl) {
      // Update user context immediately
      if (updateUser) {
        updateUser({ profilePicture: profilePictureUrl } as any);
      }
      setPhotoPreview(null); // Clear preview since we have the real URL
      console.log('✅ Profile picture updated in context:', profilePictureUrl);
      
      // Also update localStorage user if it exists
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          userObj.profilePicture = profilePictureUrl;
          localStorage.setItem('user', JSON.stringify(userObj));
        }
      } catch (e) {
        console.warn('Could not update localStorage user:', e);
      }
    } else {
      // Fallback: refresh page if we can't extract URL
      console.warn('⚠️ Could not extract profile picture URL, refreshing page');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const applicationsData = await apiService.getUserApplications();
        const allApplications = applicationsData.applications || [];
        
        // Debug: Log application structure
        if (allApplications.length > 0) {
          console.log('Sample application:', allApplications[0]);
        }
        
        setApplications(allApplications);

        const totalEarnings = user?.totalEarnings || 0;
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthApps = allApplications.filter(app => {
          const status = app.status?.toLowerCase();
          const appliedDate = app.appliedDate ? new Date(app.appliedDate) : null;
          return (status === 'hired' || status === 'completed') && 
                 appliedDate && appliedDate >= startOfMonth;
        });
        
        const thisMonthEarnings = thisMonthApps.length * 1000;
        
        // Pending amount should only be for hired/completed jobs that haven't been paid yet
        // For now, we'll use a placeholder calculation - this should come from actual payment data
        const pendingApps = allApplications.filter(app => {
          const status = app.status?.toLowerCase();
          // Only count hired/completed jobs as pending payment
          return status === 'hired' || status === 'completed';
        });
        // Placeholder: pending amount calculation (should come from actual payment system)
        const pendingAmount = 0; // Will be calculated from actual payment records
        
        setEarnings({
          totalEarnings,
          thisMonthEarnings,
          lastPayoutDate: null,
          pendingAmount
        });

        // Generate alerts (max 3)
        const generatedAlerts: Alert[] = [];
        const urgentApps = allApplications.filter(app => {
          const status = app.status?.toLowerCase();
          return status === 'accepted' || status === 'approved' || status === 'shortlisted';
        });
        if (urgentApps.length > 0 && generatedAlerts.length < 3) {
          generatedAlerts.push({
            id: '1',
            type: 'info',
            message: `${urgentApps.length} employer${urgentApps.length > 1 ? 's' : ''} replied`,
            action: 'View',
            href: '/student/approved-applications'
          });
        }
        setAlerts(generatedAlerts.slice(0, 3));
        
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredApplications = applications.filter(app => {
    const status = app.status?.toLowerCase();
    
    if (filter === 'active') {
      return status === 'applied' || status === 'pending' || 
             status === 'accepted' || status === 'approved' || 
             status === 'shortlisted';
    } else if (filter === 'closed') {
      return status === 'rejected' || status === 'closed' || 
             status === 'hired' || status === 'completed';
    }
    
    return true;
  });

  const getJobData = (application: Application): any => {
    // Check multiple possible fields where job data might be
    const app = application as any;
    return app.job || app.jobId || (app.job && typeof app.job === 'object' ? app.job : null);
  };

  const getJobTitle = (application: Application): string => {
    const job = getJobData(application);
    if (job && typeof job === 'object') {
      return job.title || job.jobTitle || job.jobTitle || 'Unknown Job';
    }
    // Fallback: check if jobId is a string (unpopulated)
    if (typeof (application as any).jobId === 'string') {
      return 'Job';
    }
    return 'Unknown Job';
  };

  const getEmployerName = (application: Application): string => {
    const job = getJobData(application);
    if (job && typeof job === 'object') {
      return job.company || job.companyName || job.employerName || 'Unknown Employer';
    }
    // Check employer field directly
    const employer = (application as any).employer;
    if (employer && typeof employer === 'object') {
      return employer.companyName || employer.name || 'Unknown Employer';
    }
    return 'Unknown Employer';
  };

  const getJobLocation = (application: Application): string | null => {
    const job = getJobData(application);
    if (job && typeof job === 'object') {
      return job.location || null;
    }
    return null;
  };

  const getJobId = (application: Application): string => {
    const job = getJobData(application);
    if (job && typeof job === 'object') {
      return job._id || job.id || '';
    }
    // If jobId is a string, return it directly
    if (typeof (application as any).jobId === 'string') {
      return (application as any).jobId;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-6 h-6 text-[#2A8A8C] animate-spin" />
      </div>
    );
  }

  // Calculate readiness score - this will automatically update when user prop changes
  const readiness = calculateReadiness(user);
  
  // Calculate job match strength (without skills)
  const matchStrength = calculateJobMatchStrength(user);
  
  const responseRate = calculateResponseRate(applications);
  const dashboardState = getDashboardState(applications, earnings.totalEarnings);
  const activeApplicationsCount = applications.filter(app => {
    const status = app.status?.toLowerCase();
    return status === 'applied' || status === 'pending' || 
           status === 'accepted' || status === 'approved' || status === 'shortlisted';
  }).length;

  // Determine next best action
  const getNextBestAction = (): { message: string; action: string; href: string; icon: any } | null => {
    // Priority order: Profile Photo > Availability > Skills > Location > Verification > Apply to jobs
    if (!user?.profilePicture) {
      return {
        message: 'Upload your profile photo',
        action: 'Add Photo',
        href: '/student/profile?edit=true#photo',
        icon: Camera
      };
    }
    if (!user?.availability) {
      return {
        message: 'Set your availability',
        action: 'Add Availability',
        href: '/student/profile?edit=true#availability',
        icon: Calendar
      };
    }
    if (!user?.skills || user.skills.length === 0) {
      return {
        message: 'Add your skills',
        action: 'Add Skills',
        href: '/student/profile?edit=true#skills',
        icon: Briefcase
      };
    }
    if (!user?.address && !user?.college) {
      return {
        message: 'Add your location',
        action: 'Add Location',
        href: '/student/profile?edit=true#location',
        icon: MapPin
      };
    }
    if (user?.kycStatus !== 'approved' && !user?.isVerified) {
      return {
        message: 'Complete verification',
        action: 'Verify Now',
        href: '/kyc-profile',
        icon: Shield
      };
    }
    if (applications.length < 3) {
      return {
        message: 'Apply to more jobs',
        action: 'Browse Jobs',
        href: '/jobs',
        icon: ArrowRight
      };
    }
    return null;
  };

  const nextBestAction = getNextBestAction();

  // Get user skills for skill demand comparison
  const userSkills = user?.skills || [];
  const missingSkills = HIGH_DEMAND_SKILLS.filter(skill => 
    !userSkills.some((us: string) => us.toLowerCase().includes(skill.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        
        {/* Profile Header - Clean & Subtle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="bg-white rounded-lg border border-gray-200/60 p-4 sm:p-5">
            <div className="flex items-center gap-4">
              {/* Profile Picture with Upload */}
              <div className="relative">
                <label htmlFor="profile-photo-upload" className="cursor-pointer group">
                  {user?.profilePicture || photoPreview ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 relative">
                      <img 
                        src={photoPreview || user?.profilePicture} 
                        alt={user?.name || 'Profile'} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploadingPhoto ? (
                          <Loader className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0 group-hover:bg-gray-200 transition-colors relative">
                      {uploadingPhoto ? (
                        <Loader className="w-6 h-6 text-gray-400 animate-spin" />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  )}
                </label>
                <input
                  id="profile-photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    // Validate file size (5MB max)
                    if (file.size > 5 * 1024 * 1024) {
                      alert('File size must be less than 5MB');
                      e.target.value = ''; // Reset input
                      return;
                    }
                    
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                      alert('Please select an image file');
                      e.target.value = ''; // Reset input
                      return;
                    }
                    
                    // Preview
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPhotoPreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                    
                    // Upload
                    try {
                      setUploadingPhoto(true);
                      const formData = new FormData();
                      formData.append('avatar', file);
                      
                      const token = localStorage.getItem('token');
                      if (!token) {
                        throw new Error('Not authenticated. Please log in again.');
                      }
                      
                      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                      // Try /api/users/upload-avatar first
                      const uploadUrl = `${API_BASE_URL}/users/upload-avatar`;
                      console.log('📤 Uploading profile picture to:', uploadUrl);
                      console.log('📤 File details:', { name: file.name, size: file.size, type: file.type });
                      
                      const response = await fetch(uploadUrl, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          // Don't set Content-Type for FormData - browser will set it with boundary
                        },
                        credentials: 'include',
                        body: formData,
                      });
                      
                      console.log('📤 Upload response status:', response.status);
                      console.log('📤 Upload response headers:', Object.fromEntries(response.headers.entries()));
                      
                      const responseText = await response.text();
                      console.log('📤 Upload response text:', responseText);
                      
                      if (!response.ok) {
                        let errorData;
                        try {
                          errorData = JSON.parse(responseText);
                        } catch {
                          errorData = { error: responseText || 'Upload failed' };
                        }
                        console.error('❌ Upload error:', errorData);
                        
                        // Try alternative endpoint if first one fails
                        if (response.status === 404 || response.status === 500) {
                          console.log('⚠️ First endpoint failed, trying alternative...');
                          const altFormData = new FormData();
                          altFormData.append('avatar', file);
                          const altUrl = `${API_BASE_URL}/upload/avatar`;
                          
                          const altResponse = await fetch(altUrl, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                            },
                            credentials: 'include',
                            body: altFormData,
                          });
                          
                          const altResponseText = await altResponse.text();
                          console.log('📤 Alt upload response status:', altResponse.status);
                          console.log('📤 Alt upload response text:', altResponseText);
                          
                          if (!altResponse.ok) {
                            let altErrorData;
                            try {
                              altErrorData = JSON.parse(altResponseText);
                            } catch {
                              altErrorData = { error: altResponseText || 'Upload failed' };
                            }
                            console.error('❌ Upload error (both endpoints):', altErrorData);
                            throw new Error(altErrorData.error || altErrorData.message || `Upload failed: ${altResponse.status}`);
                          }
                          
                          const altData = JSON.parse(altResponseText);
                          await handleUploadSuccess(altData);
                          return;
                        }
                        
                        throw new Error(errorData.error || errorData.message || `Upload failed: ${response.status}`);
                      }
                      
                      let data;
                      try {
                        data = JSON.parse(responseText);
                      } catch {
                        throw new Error('Invalid response from server');
                      }
                      await handleUploadSuccess(data);
                    } catch (error: any) {
                      console.error('❌ Error uploading photo:', error);
                      alert(`Failed to upload photo: ${error.message || 'Please try again.'}`);
                      setPhotoPreview(null);
                      e.target.value = ''; // Reset input
                    } finally {
                      setUploadingPhoto(false);
                    }
                  }}
                  disabled={uploadingPhoto}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{user?.name || 'Student'}</h1>
                <p className="text-sm text-gray-500 truncate">{user?.email || ''}</p>
                {!user?.profilePicture && !photoPreview && (
                  <label htmlFor="profile-photo-upload" className="text-xs text-[#2A8A8C] hover:underline mt-1 cursor-pointer inline-block">
                    Add profile photo
                  </label>
                )}
              </div>
              <Link
                href="/jobs"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-lg transition-colors text-sm font-medium"
              >
                Find Jobs
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Alerts & Deadlines - Clean, Max 3 */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6 space-y-2"
          >
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-lg border ${
                  alert.type === 'urgent' 
                    ? 'border-red-200 bg-red-50/50' 
                    : alert.type === 'warning'
                    ? 'border-yellow-200 bg-yellow-50/50'
                    : 'border-blue-200 bg-blue-50/50'
                } p-3 flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  {alert.type === 'urgent' ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-600" />
                  )}
                  <span className={`text-sm ${
                    alert.type === 'urgent' ? 'text-red-900' : 'text-gray-700'
                  }`}>
                    {alert.message}
                  </span>
                </div>
                {alert.href && (
                  <Link
                    href={alert.href}
                    className="text-xs text-[#2A8A8C] hover:underline font-medium"
                  >
                    {alert.action} →
                  </Link>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Visual Hero Metric - Job Match Strength */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">Job Match Strength</h2>
                <p className="text-xs text-gray-500">Your profile completeness score</p>
              </div>
              <div className="text-right">
                <div className="text-4xl sm:text-5xl font-bold text-[#2A8A8C] mb-1">{matchStrength.score}%</div>
                <div className="text-xs text-gray-500">
                  {matchStrength.score === 100 ? 'Perfect match!' : `${100 - matchStrength.score}% to go`}
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${matchStrength.score}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-[#2A8A8C] to-[#238085] rounded-full"
                />
              </div>
            </div>

            {/* Quick breakdown */}
            <div className="grid grid-cols-3 gap-3">
              {matchStrength.breakdown.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-center gap-2">
                    {item.status === 'strong' ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span className="text-sm text-gray-700 truncate">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Next Best Action Card */}
        {nextBestAction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6"
          >
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-[#2A8A8C]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const Icon = nextBestAction.icon;
                      return <Icon className="w-5 h-5 text-[#2A8A8C]" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">To increase your chances today, do this →</p>
                    <p className="text-base font-semibold text-gray-900">{nextBestAction.message}</p>
                  </div>
                </div>
                <Link
                  href={nextBestAction.href}
                  className="px-4 py-2 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex items-center gap-1.5"
                >
                  {nextBestAction.action}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Secondary Stats - Clean Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Active Applications</div>
              <div className="text-xl sm:text-2xl font-semibold text-gray-900">{activeApplicationsCount}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Total Earnings</div>
              <div className="text-xl sm:text-2xl font-semibold text-[#2A8A8C]">
                {formatCurrency(earnings.totalEarnings)}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">This Month</div>
              <div className="text-xl sm:text-2xl font-semibold text-gray-900">
                {formatCurrency(earnings.thisMonthEarnings)}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Pending</div>
              <div className="text-xl sm:text-2xl font-semibold text-gray-900">
                {formatCurrency(earnings.pendingAmount)}
              </div>
            </div>
          </div>
        </motion.div>


        {/* Response Rate Indicator */}
        {applications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mb-6"
          >
            <div className="bg-gray-50 rounded-lg border border-gray-200/60 p-4 sm:p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Application Performance</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Applications sent</div>
                  <div className="text-lg font-semibold text-gray-900">{responseRate.sent}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Employer responses</div>
                  <div className="text-lg font-semibold text-gray-900">{responseRate.responses}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Response rate</div>
                  <div className="text-lg font-semibold text-[#2A8A8C]">{responseRate.rate}%</div>
                </div>
              </div>
              {!user?.profilePicture && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                  💡 Students with photos get 2× responses
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Skill Demand vs Supply */}
        {userSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mb-6"
          >
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Skill Demand Insights</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">High demand:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {HIGH_DEMAND_SKILLS.slice(0, 3).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {missingSkills.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-600">
                      Adding "{missingSkills[0]}" increases matches by 42%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Verification Impact Card */}
        {!user?.isVerified && user?.kycStatus !== 'approved' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="mb-6"
          >
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[#2A8A8C] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Verified students get:</h3>
                  <ul className="text-xs text-gray-700 space-y-1 mb-3">
                    <li>+30% employer trust</li>
                    <li>Faster shortlisting</li>
                  </ul>
                  <Link
                    href="/kyc-profile"
                    className="inline-flex items-center gap-1.5 text-sm text-[#2A8A8C] hover:underline font-medium"
                  >
                    Verify identity (2 mins) →
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Availability Heatmap */}
        {user?.availability && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="mb-6"
          >
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Weekly Availability</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1.5">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                    const isAvailable = user.availability === 'both' || 
                                      (user.availability === 'weekdays' && index < 5) ||
                                      (user.availability === 'weekends' && index >= 5) ||
                                      user.availability === 'flexible';
                    return (
                      <div key={day} className="text-center">
                        <div className={`text-xs mb-1 ${isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
                          {day}
                        </div>
                        <div className={`h-8 rounded ${
                          isAvailable 
                            ? 'bg-[#2A8A8C]/20 border border-[#2A8A8C]/30' 
                            : 'bg-gray-100 border border-gray-200'
                        }`} />
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Peak hiring hours: 6–9 PM
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Employer Interaction Signals */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="mb-6"
        >
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Activity</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <span>2 employers viewed your profile today</span>
              </div>
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-gray-400" />
                <span>1 employer saved your profile</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Learning / Upskill Slot */}
        {dashboardState.type === 'new' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="mb-6"
          >
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Quick Learning</h3>
              <div className="space-y-2">
                {LEARNING_RESOURCES.map((resource, index) => {
                  const Icon = resource.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors">
                      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">{resource.title}</div>
                        <div className="text-xs text-gray-500">{resource.impact}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Applications Section */}
        <motion.div
          id="applications"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
          className="mb-6"
        >
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Applications</h2>
              {applications.length > 0 && (
                <div className="flex gap-1.5">
                  {(['all', 'active', 'closed'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        filter === f
                          ? 'bg-[#2A8A8C] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">
                  {filter === 'active' 
                    ? "You don't have any active applications."
                    : filter === 'closed'
                    ? "You don't have any closed applications."
                    : "You haven't applied for any jobs yet."}
                </p>
                {filter === 'all' && (
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Browse Jobs
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredApplications.map((application) => {
                  const statusBadge = getStatusBadge(application.status || 'applied');
                  const rejectionReason = getRejectionReason(application);
                  const jobId = getJobId(application);
                  const canAccept = (application.status?.toLowerCase() === 'approved' || 
                                   application.status?.toLowerCase() === 'accepted' || 
                                   application.status?.toLowerCase() === 'shortlisted') &&
                                   application.status?.toLowerCase() !== 'hired';
                  
                  return (
                    <div
                      key={application._id}
                      className="block p-3 rounded-lg border border-gray-200/60 hover:border-[#2A8A8C]/40 hover:bg-gray-50/50 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={jobId ? `/jobs/${jobId}` : '#'}
                          className="flex-1 min-w-0"
                        >
                          <h3 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-[#2A8A8C] transition-colors truncate">
                            {getJobTitle(application)}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{getEmployerName(application)}</span>
                            {getJobLocation(application) && (
                              <>
                                <span>•</span>
                                <span>{getJobLocation(application)}</span>
                              </>
                            )}
                          </div>
                          {rejectionReason && (
                            <div className="mt-1 text-xs text-gray-500">
                              Reason: {rejectionReason}
                            </div>
                          )}
                        </Link>
                        <div className="flex items-center gap-2">
                          {canAccept && (
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  await apiService.acceptJobOffer(application._id);
                                  alert('Job offer accepted successfully!');
                                  // Refresh applications list
                                  const applicationsData = await apiService.getUserApplications();
                                  setApplications(applicationsData.applications || []);
                                  // Scroll to applications section
                                  setTimeout(() => {
                                    const applicationsSection = document.getElementById('applications');
                                    if (applicationsSection) {
                                      applicationsSection.scrollIntoView({ behavior: 'smooth' });
                                    }
                                  }, 100);
                                } catch (err: any) {
                                  console.error('Error accepting job:', err);
                                  alert(err.message || 'Failed to accept job offer');
                                }
                              }}
                              className="px-2.5 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                            >
                              Accept
                            </button>
                          )}
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium ${statusBadge.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`} />
                            {statusBadge.text}
                          </div>
                          <Link href={jobId ? `/jobs/${jobId}` : '#'}>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#2A8A8C] transition-colors flex-shrink-0" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Earnings Summary - Clean */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1 }}
        >
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Earnings Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Lifetime</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(earnings.totalEarnings)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">This Month</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(earnings.thisMonthEarnings)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Last Payout</div>
                <div className="text-sm font-medium text-gray-900">
                  {earnings.lastPayoutDate ? formatDate(earnings.lastPayoutDate) : 'Never'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Pending</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(earnings.pendingAmount)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default StudentDashboard;
