"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Clock, 
  User, 
  DollarSign,
  MapPin,
  CheckCircle,
  AlertCircle,
  Shield,
  FileText,
  Building,
  ChevronRight,
  Calendar,
  Wallet,
  TrendingUp,
  XCircle,
  Loader,
  ArrowRight,
  Play,
  Send,
  Zap,
  Rocket,
  CreditCard,
  Banknote,
  Receipt,
  Percent
} from 'lucide-react';
import { apiService, type JobsResponse, type ApplicationsResponse, type Job, type Application } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface StudentHomeProps {
  user: any;
}

interface EarningsData {
  availableBalance: number;
  pendingEarnings: number;
  lastPayoutDate: string | null;
}

interface ActiveWork {
  online: Application[];
  onSite: Application[];
  corporate: Application[];
}

const INDIAN_CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const formatCurrency = (amount: number): string => {
  return `₹${INDIAN_CURRENCY_FORMATTER.format(amount)}`;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getVerificationBadge = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'approved' || statusLower === 'verified') {
    return {
      text: 'Verified',
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: CheckCircle
    };
  } else if (statusLower === 'pending') {
    return {
      text: 'Pending',
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      icon: Clock
    };
  } else if (statusLower === 'rejected' || statusLower === 'suspended') {
    return {
      text: 'Restricted',
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle
    };
  }
  return {
    text: 'Not Verified',
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: AlertCircle
  };
};

const getNextAction = (application: Application): { text: string; action: string; href?: string } => {
  const status = application.status?.toLowerCase();
  const job = application.job;
  const workType = (job as any)?.workType || job?.type || '';

  if (status === 'accepted' || status === 'approved') {
    if (workType.toLowerCase().includes('remote') || workType.toLowerCase().includes('online')) {
      return { text: 'Submit work', action: 'submit', href: `/work/${application._id}/submit` };
    } else if (workType.toLowerCase().includes('on-site') || workType.toLowerCase().includes('onsite')) {
      return { text: 'View task details', action: 'view', href: `/work/${application._id}` };
    } else {
      return { text: 'Clock in', action: 'clockin', href: `/work/${application._id}/clock-in` };
    }
  } else if (status === 'pending') {
    return { text: 'Awaiting approval', action: 'wait' };
  } else if (status === 'applied') {
    return { text: 'Message employer', action: 'message', href: `/applications/${application._id}` };
  }
  return { text: 'View status', action: 'view', href: `/applications/${application._id}` };
};

const StudentHome: React.FC<StudentHomeProps> = ({ user }) => {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [earnings, setEarnings] = useState<EarningsData>({
    availableBalance: user?.totalEarnings || 0,
    pendingEarnings: 0,
    lastPayoutDate: null
  });
  const [kycStatus, setKycStatus] = useState<string>('not_submitted');
  const [activeWork, setActiveWork] = useState<ActiveWork>({
    online: [],
    onSite: [],
    corporate: []
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch applications
        const applicationsData: ApplicationsResponse = await apiService.getUserApplications();
        const allApplications = applicationsData.applications || [];
        setApplications(allApplications);

        // Organize active work by type
        const activeApplications = allApplications.filter(app => {
          const status = app.status?.toLowerCase();
          return status === 'accepted' || status === 'approved' || status === 'pending';
        });

        const organized: ActiveWork = {
          online: [],
          onSite: [],
          corporate: []
        };

        activeApplications.forEach(app => {
          const job = app.job;
          const workType = ((job as any)?.workType || job?.type || '').toLowerCase();
          const company = job?.company || '';

          if (workType.includes('remote') || workType.includes('online')) {
            organized.online.push(app);
          } else if (workType.includes('corporate') || company.toLowerCase().includes('corp')) {
            organized.corporate.push(app);
          } else {
            organized.onSite.push(app);
          }
        });

        setActiveWork(organized);

        // Calculate earnings (placeholder - would need actual earnings API)
        const totalEarnings = user?.totalEarnings || 0;
        const pendingCount = activeApplications.length;
        setEarnings({
          availableBalance: totalEarnings * 0.7, // Placeholder: 70% available
          pendingEarnings: totalEarnings * 0.3, // Placeholder: 30% pending
          lastPayoutDate: null // Would come from API
        });

        // Fetch jobs for discovery section
        try {
          const jobsData: JobsResponse = await apiService.getStudentDashboardJobs(true);
          setJobs(jobsData.jobs || []);
        } catch (error) {
          console.error('Error fetching jobs:', error);
          setJobs([]);
        }

        // Get KYC status
        const kycStatusValue = user?.kycStatus || 'not_submitted';
        setKycStatus(kycStatusValue);
        
      } catch (error: any) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 text-[#2A8A8C] animate-spin" />
      </div>
    );
  }

  const verificationBadge = getVerificationBadge(kycStatus);
  const BadgeIcon = verificationBadge.icon;
  const userSkills = user?.skills || [];
  const primarySkill = userSkills[0] || 'General';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20 space-y-16 sm:space-y-20 lg:space-y-32">
        
        {/* Hero Section - Clean & Animated */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden"
      >
          {/* Subtle gradient blob background */}
          <motion.div
            animate={{
              opacity: [0.02, 0.04, 0.02],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[600px] lg:h-[600px] rounded-full bg-[#2A8A8C]/20 blur-3xl"
          />

        <div className="relative z-10">
            {/* Top Bar - Name & Navigation */}
            <div className="flex items-center justify-between mb-8 sm:mb-12 lg:mb-16">
              {/* Name - Top Left */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user?.name || 'User'} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                  {user?.name || 'Student'}
                </h2>
              </motion.div>
              
              {/* Navigation - Top Right */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex items-center gap-2 sm:gap-4 lg:gap-6"
              >
                <Link href="/jobs" className="hidden sm:inline-block text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Browse Jobs
                </Link>
                <Link href="/student/dashboard" className="hidden lg:inline-block text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
              </motion.div>
            </div>
            
            {/* Main Hero Content */}
            <div className="max-w-4xl">
              {/* Large Headline with Gradient */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
                className="mb-6 sm:mb-8"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-3 sm:mb-4">
                  <span className="text-gray-900">Earn.</span>
                  <br />
                  <span className="bg-gradient-to-r from-[#2A8A8C] via-[#2A8A8C] to-[#1f6a6c] bg-clip-text text-transparent">
                    Work.
                  </span>
                  <br />
                  <span className="text-gray-900">Verified.</span>
                </h1>
            </motion.div>
          
              {/* Descriptive Text */}
              <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl leading-relaxed"
          >
                Transform your skills into income with verified opportunities. Clear earnings, clear work, clear status—all in one place.
              </motion.p>

              {/* Call to Action */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
              >
                <Link
                  href="/jobs"
                  className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm sm:text-base group"
                >
                  Explore Jobs
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/student/instant-job"
                  className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 border border-[#2A8A8C] text-[#2A8A8C] rounded-xl hover:bg-[#2A8A8C] hover:text-white transition-colors font-medium text-sm sm:text-base"
                >
                  Instant Jobs
                  <Zap className="w-4 h-4" />
                </Link>
                <button className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base">
                  <Play className="w-4 h-4" />
                  Watch Intro
                </button>
              </motion.div>
                </div>
                </div>
            </motion.div>

        {/* Section 2: Trust Before Opportunity */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
            {/* Left Side - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Headline */}
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-3 sm:mb-4">
                  <span className="text-gray-900">Trust before</span>
                  <br />
                  <span className="text-[#2A8A8C]">opportunity.</span>
                </h2>
                </div>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-lg">
                Complete your verification once, unlock verified opportunities forever. Employers trust verified students—that's why you get priority access.
              </p>

              {/* Call to Action */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {kycStatus !== 'approved' ? (
                  <Link
                    href="/kyc-profile"
                    className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#2A8A8C] text-white rounded-xl hover:bg-[#1f6a6c] transition-colors font-medium text-sm sm:text-base group"
                  >
                    Complete Verification
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <div className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-green-50 text-green-700 rounded-xl border border-green-200 font-medium text-sm sm:text-base">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Verified & Ready
                </div>
                )}
            </motion.div>

              {/* Trust Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 pt-4 sm:pt-6"
              >
                <div className="space-y-1">
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    className="text-3xl sm:text-4xl font-bold text-gray-900"
                  >
                    100%
                  </motion.div>
                  <div className="text-xs sm:text-sm text-gray-600">Verified Only</div>
                </div>
                <div className="space-y-1">
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    className="text-3xl sm:text-4xl font-bold text-gray-900"
                  >
                    24hrs
                  </motion.div>
                  <div className="text-xs sm:text-sm text-gray-600">Fast Approval</div>
                </div>
            </motion.div>
          </motion.div>
          
            {/* Right Side - Visual/Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative"
            >
              {/* Main Illustration Container */}
              <div className="relative bg-gradient-to-br from-[#2A8A8C]/5 to-[#2A8A8C]/8 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12">

                {/* Verification Badge - Large */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10 flex flex-col items-center justify-center space-y-6"
                >
                  {/* Shield Icon */}
                  <div className="relative">
                    <div className="relative bg-[#2A8A8C] rounded-full p-6 sm:p-8 shadow-lg">
                      <Shield className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-white" />
        </div>
      </div>

                  {/* Verification Status Items */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 w-full max-w-sm">
        <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-gray-100"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900">ID Verified</span>
              </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: "100%" }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.8, duration: 0.8 }}
                          className="h-full bg-green-500 rounded-full"
                        />
              </div>
                    </motion.div>

              <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-gray-100"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#2A8A8C]" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900">Documents</span>
                </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: kycStatus === 'approved' ? "100%" : "75%" }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.9, duration: 0.8 }}
                          className="h-full bg-[#2A8A8C] rounded-full"
                        />
                  </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                      className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-gray-100"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <Building className="w-4 h-4 sm:w-5 sm:h-5 text-[#2A8A8C]" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900">College</span>
                </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: user?.college ? "100%" : "60%" }}
                          viewport={{ once: true }}
                          transition={{ delay: 1, duration: 0.8 }}
                          className="h-full bg-[#2A8A8C] rounded-full"
                        />
          </div>
        </motion.div>

      <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-gray-100"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-[#2A8A8C]" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900">Bank</span>
        </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: "40%" }}
                          viewport={{ once: true }}
                          transition={{ delay: 1.1, duration: 0.8 }}
                          className="h-full bg-[#2A8A8C]/70 rounded-full"
            />
          </div>
                    </motion.div>
        </div>

                  {/* Status Badge */}
          <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="flex flex-col items-center gap-3 sm:gap-4"
                  >
                    <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border text-xs sm:text-sm font-medium ${verificationBadge.color}`}>
                      <BadgeIcon className="w-4 h-4" />
                      {verificationBadge.text}
                    </div>
                    {kycStatus !== 'approved' && (
                      <Link
                        href="/kyc-profile"
                        className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-colors font-medium text-xs sm:text-sm shadow-md hover:shadow-lg group"
                      >
                        Complete KYC Now
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}
          </motion.div>
      </motion.div>
              </div>
            </motion.div>
                    </div>
        </motion.section>

        {/* Section 3: How Students Earn */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative"
        >
          {/* Section Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2A8A8C] text-center mb-8 sm:mb-12 uppercase tracking-wide"
          >
            How Students Earn
          </motion.h2>

          {/* Process Steps Overview - Horizontal Row */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-12 mb-12 sm:mb-16 lg:mb-20"
          >
            {[
              { icon: Shield, label: 'Verify', color: 'text-[#2A8A8C]' },
              { icon: Send, label: 'Apply', color: 'text-[#2A8A8C]' },
              { icon: Briefcase, label: 'Work', color: 'text-[#2A8A8C]' },
              { icon: Wallet, label: 'Get Paid', color: 'text-[#2A8A8C]' }
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center text-center cursor-default"
                >
                  <div className={`mb-2 sm:mb-3 lg:mb-4 ${step.color}`}>
                    <Icon className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16" strokeWidth={1.5} />
                      </div>
                  <span className={`text-sm sm:text-base lg:text-lg font-bold ${step.color}`}>{step.label}</span>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Detailed Process Flow - Vertical Timeline */}
          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-[#2A8A8C]/50 hidden md:block"></div>

            {/* Step 1: Verification */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative mb-12 sm:mb-16 md:mb-20"
            >
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
                <div className="md:text-right">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2A8A8C] mb-3 sm:mb-4">Verification.</h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Complete your profile verification once. Upload your ID, college documents, and bank details. Get verified in 24 hours and unlock access to all verified job opportunities.
                  </p>
                        </div>
                <div className="flex justify-center md:justify-start relative">
                  <div className="absolute left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0 w-1 h-full md:w-full md:h-1 bg-[#2A8A8C]/50 md:hidden"></div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    className="absolute left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0 w-3 h-3 bg-[#2A8A8C] rounded-full border-4 border-white z-10"
                  />
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative z-10 bg-[#2A8A8C] p-4 sm:p-5 lg:p-6 rounded-full shadow-lg"
                  >
                    <Shield className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" strokeWidth={1.5} />
                  </motion.div>
            </div>
      </div>
            </motion.div>

            {/* Step 2: Application */}
        <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="relative mb-16 md:mb-20"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-2 md:order-1 flex justify-center md:justify-end relative">
                  <div className="absolute left-1/2 md:right-0 transform -translate-x-1/2 md:translate-x-0 w-1 h-full md:w-full md:h-1 bg-[#2A8A8C]/50 md:hidden"></div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    className="absolute left-1/2 md:right-0 transform -translate-x-1/2 md:translate-x-0 w-3 h-3 bg-[#2A8A8C] rounded-full border-4 border-white z-10"
                  />
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative z-10 bg-[#2A8A8C] p-6 rounded-full shadow-lg"
                  >
                    <Send className="w-12 h-12 text-white" strokeWidth={1.5} />
                  </motion.div>
          </div>
                <div className="order-1 md:order-2 md:text-left">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2A8A8C] mb-3 sm:mb-4">Application.</h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Browse verified jobs that match your skills and availability. Apply with one click. Employers see your verified profile instantly, giving you priority over unverified applicants.
                  </p>
                    </div>
          </div>
        </motion.div>

            {/* Step 3: Work */}
        <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="relative mb-16 md:mb-20"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="md:text-right">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2A8A8C] mb-3 sm:mb-4">Work.</h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Once approved, start working. Submit deliverables for online jobs, clock in for on-site tasks, or manage your corporate shifts. Track your progress and communicate with employers in real-time.
                  </p>
            </div>
                <div className="flex justify-center md:justify-start relative">
                  <div className="absolute left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0 w-1 h-full md:w-full md:h-1 bg-[#2A8A8C]/50 md:hidden"></div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                    className="absolute left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0 w-3 h-3 bg-[#2A8A8C] rounded-full border-4 border-white z-10"
                  />
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative z-10 bg-[#2A8A8C] p-6 rounded-full shadow-lg"
                  >
                    <Briefcase className="w-12 h-12 text-white" strokeWidth={1.5} />
                  </motion.div>
          </div>
                        </div>
            </motion.div>

            {/* Step 4: Get Paid */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="relative"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-2 md:order-1 flex justify-center md:justify-end relative">
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                    className="absolute left-1/2 md:right-0 transform -translate-x-1/2 md:translate-x-0 w-3 h-3 bg-[#2A8A8C] rounded-full border-4 border-white z-10"
                  />
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative z-10 bg-[#2A8A8C] p-6 rounded-full shadow-lg"
                  >
                    <Wallet className="w-12 h-12 text-white" strokeWidth={1.5} />
                  </motion.div>
                      </div>
                <div className="order-1 md:order-2 md:text-left">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2A8A8C] mb-3 sm:mb-4">Get Paid.</h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Receive payments directly to your verified bank account. Track your earnings in real-time—see available balance, pending payments, and payout history. Get paid on time, every time.
                  </p>
                    </div>
          </div>
        </motion.div>
      </div>
        </motion.section>

        {/* Section 5: Money Clarity - THIS IS WHERE YOU WIN */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative"
        >
          {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              Money Clarity
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Instant payments or it's free. No delays, no hidden fees, no surprises.
            </p>
        </motion.div>

          {/* Three Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-16 mb-12 sm:mb-16">
            {/* Weekly / Task-based Payouts */}
        <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#2A8A8C]/10 mb-2">
                <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-[#2A8A8C]" />
          </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Weekly Payouts</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Get paid every week or after each completed task. No waiting, no delays. Your earnings hit your account automatically.
              </p>
        </motion.div>

            {/* Direct Bank Transfer */}
      <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-50 mb-2">
                <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Direct Bank Transfer</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Money goes straight to your verified bank account. No intermediaries, no delays. Same-day transfers available.
              </p>
      </motion.div>

            {/* No Hidden Cuts */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#2A8A8C]/10 mb-2">
                <Receipt className="w-8 h-8 sm:w-10 sm:h-10 text-[#2A8A8C]" />
                  </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Zero Hidden Fees</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                What you see is what you get. Platform fee: <span className="font-semibold text-gray-900">5%</span>—clearly stated upfront. No surprises, ever.
              </p>
            </motion.div>
                    </div>

          {/* Payment Breakdown Example */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 max-w-2xl mx-auto shadow-sm"
          >
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Payment Breakdown</h3>
            <div className="max-w-md mx-auto space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-200">
                <span className="text-sm sm:text-base text-gray-700">Job Payment</span>
                <span className="text-base sm:text-lg font-semibold text-gray-900">₹10,000</span>
                </div>
              <div className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-200">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Percent className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                  <span className="text-sm sm:text-base text-gray-700">Platform Fee (5%)</span>
                </div>
                <span className="text-sm sm:text-base text-gray-600">- ₹500</span>
              </div>
              <div className="flex items-center justify-between py-3 sm:py-4 pt-3 sm:pt-4">
                <span className="text-base sm:text-lg font-bold text-gray-900">You Receive</span>
                <span className="text-xl sm:text-2xl font-bold text-[#2A8A8C]">₹9,500</span>
            </div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center mt-6 sm:mt-8"
          >
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#2A8A8C] text-white rounded-xl hover:bg-[#1f6a6c] transition-colors font-medium text-sm sm:text-base"
            >
              Verify Bank Account
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </motion.div>
        </motion.section>

        </div>
    </div>
  );
};

export default StudentHome;
