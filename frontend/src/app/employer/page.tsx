"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import apiService from "@/services/api";
import { calculateEmployerDashboardStats, normalizeEmployerJob, normalizeEmployerApplication } from "@/utils/employerDataUtils";

const ACCENT = "#2A8A8D";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function EmployerView() {
  const { user, isAuthenticated, loading } = useAuth();
  const isEmployer = user?.userType === "employer";

  const accessState = useMemo(() => {
    if (loading) return "loading";
    if (!isAuthenticated) return "unauth";
    if (!isEmployer) return "wrong-role";
    return "ok";
  }, [isAuthenticated, isEmployer, loading]);

  return (
    <div className="min-h-screen bg-white text-[#0B1221]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 pt-8 pb-20 lg:pt-12 lg:pb-32 space-y-32">
        {accessState === "loading" && (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/70 border border-[#E6E8EE] animate-pulse" />
            ))}
          </div>
        )}

        {accessState === "unauth" && <Unauthenticated />}
        {accessState === "wrong-role" && <WrongRole />}

        {accessState === "ok" && (
          <>
            <HeroSection />
            <EmployerPainSection />
            <NorixControlSystem />
            <HowEmployersUseNorix />
            <UseCasesSection />
            <TrustAndComplianceSection />
            <WhyEmployersChooseNorix />
            <EmployerCTA />
          </>
        )}
      </div>
    </div>
  );
}

function HeroSection() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalJobs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivityCount, setRecentActivityCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchEmployerData = async () => {
      // Only fetch if user is authenticated and is an employer
      if (!isAuthenticated || !user || user.userType !== 'employer') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch jobs and applications in parallel with high limits to get all data
        const [jobsResponse, applicationsResponse] = await Promise.all([
          apiService.getEmployerJobsList(1, 10000), // Increased limit to get all jobs
          apiService.getEmployerApplications(undefined, undefined, 1, 10000) // Increased limit to get all applications
        ]);

        console.log('📊 HeroSection - Jobs Response:', jobsResponse);
        console.log('📊 HeroSection - Applications Response:', applicationsResponse);

        // Handle response structure
        const jobs = jobsResponse?.jobs || [];
        const applications = applicationsResponse?.applications || [];

        console.log('📊 HeroSection - Raw Jobs:', jobs);
        console.log('📊 HeroSection - Raw Applications:', applications);

        // Normalize the data
        const normalizedJobs = Array.isArray(jobs) 
          ? jobs.map(normalizeEmployerJob).filter(Boolean)
          : [];
        const normalizedApplications = Array.isArray(applications)
          ? applications.map(normalizeEmployerApplication).filter(Boolean)
          : [];

        console.log('📊 HeroSection - Normalized Jobs Count:', normalizedJobs.length);
        console.log('📊 HeroSection - Normalized Applications Count:', normalizedApplications.length);
        console.log('📊 HeroSection - Sample Normalized Job:', normalizedJobs[0]);
        console.log('📊 HeroSection - Sample Normalized Application:', normalizedApplications[0]);

        // Calculate stats
        const calculatedStats = calculateEmployerDashboardStats(normalizedJobs, normalizedApplications);
        
        console.log('📊 HeroSection - Calculated Stats:', calculatedStats);
        
        // Update state with calculated stats
        setStats({
          activeJobs: calculatedStats.activeJobs || 0,
          totalApplications: calculatedStats.totalApplications || 0,
          pendingApplications: calculatedStats.pendingApplications || 0,
          totalJobs: calculatedStats.totalJobs || 0,
        });

        // Count pending applications for recent activity
        setRecentActivityCount(calculatedStats.pendingApplications || 0);
      } catch (error: any) {
        console.error('❌ Error fetching employer data in HeroSection:', error);
        console.error('❌ Error details:', {
          message: error?.message,
          status: error?.status,
          response: error?.response
        });
        // Set default values on error
        setStats({
          activeJobs: 0,
          totalApplications: 0,
          pendingApplications: 0,
          totalJobs: 0,
        });
        setRecentActivityCount(0);
      } finally {
        setLoading(false);
      }
    };

    // Fetch data immediately if user is ready, otherwise wait
    if (isAuthenticated && user && user.userType === 'employer') {
      fetchEmployerData();
    } else {
      setLoading(false);
    }

    // Set up interval to refresh data every 15 seconds (more frequent for real-time updates)
    const refreshInterval = setInterval(() => {
      if (isAuthenticated && user && user.userType === 'employer') {
        fetchEmployerData();
      }
    }, 15000);

    // Refresh when page becomes visible (user switches back to tab/window)
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && user && user.userType === 'employer') {
        console.log('👁️ Page became visible, refreshing stats...');
        fetchEmployerData();
      }
    };

    // Refresh when window gains focus
    const handleFocus = () => {
      if (isAuthenticated && user && user.userType === 'employer') {
        console.log('🎯 Window gained focus, refreshing stats...');
        fetchEmployerData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, user, refreshKey]);

  // Listen for custom refresh events (triggered when job is posted or application received)
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 Manual refresh triggered');
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('employer-stats-refresh', handleRefresh);
    return () => {
      window.removeEventListener('employer-stats-refresh', handleRefresh);
    };
  }, []);

  const dashboardStats = [
    { 
      label: "Active Jobs", 
      value: loading ? "..." : stats.activeJobs.toString(), 
      change: stats.totalJobs > 0 ? `${stats.totalJobs} total` : "0", 
      href: "/employer" 
    },
    { 
      label: "Applications", 
      value: loading ? "..." : stats.totalApplications.toString(), 
      change: stats.totalApplications > 0 ? "Total" : "0", 
      href: "/employer/applications" 
    },
    { 
      label: "Pending Approval", 
      value: loading ? "..." : stats.pendingApplications.toString(), 
      change: stats.pendingApplications > 0 ? "New" : "0", 
      href: "/employer/applications" 
    },
    { 
      label: "Total Jobs", 
      value: loading ? "..." : stats.totalJobs.toString(), 
      change: stats.activeJobs > 0 ? `${stats.activeJobs} active` : "0", 
      href: "/employer" 
    },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative overflow-hidden"
    >
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Column - Content */}
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8 tracking-tight"
            style={{ color: ACCENT }}
          >
            Student hiring, without operational risk.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl sm:text-2xl text-gray-600 mb-12 leading-relaxed"
          >
            Approve work, control payments, and hire verified students – all from one platform.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-5"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/employer/instant-job"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white transition-all duration-300 shadow-lg"
                style={{ backgroundColor: '#1a1a1a' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Find Worker Now
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/employer/post-job"
                className="inline-flex items-center px-8 py-4 text-base font-semibold text-white transition-all duration-300"
                style={{ backgroundColor: ACCENT }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#238085'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ACCENT}
              >
                Post a Job
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/how-it-works"
                className="inline-flex items-center px-8 py-4 text-base font-semibold bg-transparent border-2 transition-all duration-300"
                style={{ color: ACCENT, borderColor: ACCENT }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F0F9FA';
                  e.currentTarget.style.borderColor = '#238085';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = ACCENT;
                }}
              >
                See how it works
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Column - Dashboard Box */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative"
        >
          <div className="bg-white border border-gray-200 p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Quick Overview</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    // Trigger refresh by dispatching focus event
                    window.dispatchEvent(new Event('focus'));
                  }}
                  className="text-sm font-semibold transition-colors hover:opacity-80 px-2 py-1 rounded hover:bg-gray-100"
                  style={{ color: ACCENT }}
                  title="Refresh stats"
                >
                  ↻ Refresh
                </button>
                <Link 
                  href="/employer/applications"
                  className="text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: ACCENT }}
                >
                  View All →
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {dashboardStats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="group cursor-pointer"
                >
                  <Link href={stat.href} className="block">
                    <div className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <p className="text-xs font-medium text-gray-600 mb-1">{stat.label}</p>
                      <div className="flex items-baseline justify-between">
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <span 
                          className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ 
                            backgroundColor: `${ACCENT}15`,
                            color: ACCENT 
                          }}
                        >
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200">
          <Link
            href="/employer/applications"
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors group relative"
              >
                {recentActivityCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-10"
                  >
                    {recentActivityCount > 9 ? '9+' : recentActivityCount}
                  </motion.div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">Recent Activity</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {loading 
                      ? "Loading..." 
                      : recentActivityCount > 0 
                        ? `${recentActivityCount} application${recentActivityCount !== 1 ? 's' : ''} need${recentActivityCount === 1 ? 's' : ''} review`
                        : "No pending applications"
                    }
                  </p>
                </div>
                <motion.div
                  whileHover={{ x: 5 }}
                  className="text-gray-400 group-hover:text-gray-600"
                >
                  →
                </motion.div>
          </Link>
        </div>
      </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

function EmployerPainSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const painPoints = [
    "Fake or inflated resumes",
    "Students disappearing mid-task",
    "No accountability after assignment",
    "Payment disputes and confusion"
  ];

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl"
    >
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl sm:text-5xl font-bold text-gray-900 mb-12 tracking-tight"
      >
        Why student hiring usually fails
      </motion.h2>
      <motion.ul 
        variants={staggerContainer}
        initial="initial"
        animate={isInView ? "animate" : "initial"}
        className="space-y-6"
      >
        {painPoints.map((point, index) => (
          <motion.li 
            key={index} 
            variants={fadeInUp}
            className="flex items-start gap-4 group"
          >
            <motion.span 
              className="text-red-500 text-2xl font-bold mt-1 flex-shrink-0"
              whileHover={{ scale: 1.2, rotate: 90 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              ×
            </motion.span>
            <span className="text-xl font-medium text-gray-800 group-hover:text-gray-900 transition-colors">{point}</span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.section>
  );
}

function NorixControlSystem() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const controls = [
    {
      title: "Verified Students",
      description: "Identity and profile checks before work starts"
    },
    {
      title: "Approval-First Workflow",
      description: "You approve work before any payment is released"
    },
    {
      title: "Escrow-Based Payments",
      description: "Funds stay protected until completion"
    },
    {
      title: "Role-Based Access",
      description: "Clear separation between employer, student, admin"
    }
  ];

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl"
    >
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl sm:text-5xl font-bold mb-16 tracking-tight"
        style={{ color: ACCENT }}
      >
        How Norix removes the risk
      </motion.h2>
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate={isInView ? "animate" : "initial"}
        className="grid md:grid-cols-2 gap-12"
      >
        {controls.map((control, index) => (
          <motion.div 
            key={index}
            variants={fadeInUp}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="group"
          >
            <h3 className="text-2xl font-bold mb-3 transition-colors" style={{ color: ACCENT }}>
              {control.title}
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">{control.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

function HowEmployersUseNorix() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const steps = [
    {
      step: "01",
      title: "Post work or assign tasks"
    },
    {
      step: "02",
      title: "Verified student completes task"
    },
    {
      step: "03",
      title: "You approve → payment is released"
    }
  ];

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl"
    >
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl sm:text-5xl font-bold mb-16 tracking-tight"
        style={{ color: ACCENT }}
      >
        How Employers Use Norix
      </motion.h2>
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate={isInView ? "animate" : "initial"}
        className="grid md:grid-cols-3 gap-12"
      >
        {steps.map((item, index) => (
          <motion.div 
            key={index}
            variants={fadeInUp}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="group"
          >
            <motion.div 
              className="text-5xl font-bold mb-4 opacity-20 group-hover:opacity-30 transition-opacity"
              style={{ color: ACCENT }}
            >
              {item.step}
            </motion.div>
            <p className="text-xl font-semibold text-gray-900 leading-relaxed">{item.title}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

function UseCasesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const useCases = [
    {
      title: "Temporary operations support",
      description: "Scale your team during peak periods with verified students ready to start immediately."
    },
    {
      title: "Digital marketing assistance",
      description: "Get content creation, social media management, and campaign support from verified marketing students."
    },
    {
      title: "On-site short-term staffing",
      description: "Fill temporary positions with verified students who can work on-site with proper documentation."
    },
    {
      title: "Academic or institutional tasks",
      description: "Hire verified students for research assistance, data entry, or administrative support with full accountability."
    }
  ];

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl"
    >
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl sm:text-5xl font-bold mb-16 tracking-tight"
        style={{ color: ACCENT }}
      >
        Use Cases
      </motion.h2>
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate={isInView ? "animate" : "initial"}
        className="grid md:grid-cols-2 gap-12"
      >
        {useCases.map((useCase, index) => (
          <motion.div 
            key={index}
            variants={fadeInUp}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="group"
          >
            <h3 className="text-xl font-bold mb-4 transition-colors" style={{ color: ACCENT }}>
              {useCase.title}
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">{useCase.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

function TrustAndComplianceSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const trustPoints = [
    {
      title: "KYC-based verification",
      description: "Identity and enrollment checks before work starts. One-time verification, reusable across roles."
    },
    {
      title: "Approval-based payouts",
      description: "You control when payments are released. Funds stay protected until you approve completed work."
    },
    {
      title: "Transparent activity records",
      description: "Workflow actions are logged for accountability. You see what happened, when, and by whom—not continuous monitoring."
    },
    {
      title: "No continuous tracking or privacy abuse",
      description: "We enforce workflow discipline, not surveillance. Activity visibility for accountability, not real-time tracking."
    }
  ];

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight" style={{ color: ACCENT }}>
          Trust & Compliance
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
          Workflow discipline and accountability—not surveillance. You maintain control while ensuring transparency.
        </p>
      </motion.div>
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate={isInView ? "animate" : "initial"}
        className="grid md:grid-cols-2 gap-12"
      >
        {trustPoints.map((point, index) => (
          <motion.div 
            key={index}
            variants={fadeInUp}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="group"
          >
            <h3 className="text-lg font-bold mb-3 transition-colors" style={{ color: ACCENT }}>
              {point.title}
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">{point.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

function WhyEmployersChooseNorix() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const statements = [
    "Built for controlled hiring, not open marketplaces",
    "Designed to reduce disputes, not create them",
    "Payments tied to approval, not promises"
  ];

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl"
    >
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl sm:text-5xl font-bold mb-16 tracking-tight"
        style={{ color: ACCENT }}
      >
        Why Employers Choose Norix
      </motion.h2>
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate={isInView ? "animate" : "initial"}
        className="grid md:grid-cols-3 gap-8"
      >
        {statements.map((statement, index) => (
          <motion.div 
            key={index}
            variants={fadeInUp}
            whileHover={{ y: -5, x: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="border-l-4 pl-6 py-6 group cursor-default"
            style={{ borderColor: ACCENT }}
          >
            <p className="text-xl font-semibold text-gray-900 leading-relaxed group-hover:text-gray-800 transition-colors">
              {statement}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

function EmployerCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="py-20 lg:py-28"
      style={{ backgroundColor: ACCENT }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-12 leading-tight tracking-tight"
        >
          Start hiring verified students — without risk.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/employer/instant-job"
              className="inline-flex items-center gap-2 px-10 py-5 text-lg font-semibold bg-white transition-all duration-300 mb-6 shadow-lg"
              style={{ color: '#1a1a1a', backgroundColor: '#ffffff' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Find Worker Now
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/employer/post-job"
              className="inline-flex items-center px-10 py-5 text-lg font-semibold bg-white transition-all duration-300 mb-6"
              style={{ color: ACCENT }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F9FA'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              Post a Job
            </Link>
          </motion.div>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-base"
          style={{ color: '#E0F4F5' }}
        >
          No long-term commitment. Pay per work.
        </motion.p>
      </div>
    </motion.section>
  );
}

function ControlSummary() {
  return (
    <div className="relative">
      <div className="absolute -left-10 -top-8 h-24 w-24 rounded-3xl border border-[#E6E8EE]" aria-hidden />
      <div className="absolute -right-8 top-10 h-16 w-16 rounded-2xl border border-[#E6E8EE]" aria-hidden />
      <div className="relative rounded-3xl border border-[#E6E8EE] bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#0B1221]">Controls overview</p>
            <p className="text-xs text-[#475569]">Verification, approvals, and payouts in one place</p>
          </div>
          <span
            className="rounded-full bg-[#F0F1FF] px-3 py-1 text-xs font-semibold text-[var(--accent,#4C3DFF)]"
            style={{ "--accent": ACCENT } as CSSProperties}
          >
            Locked
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["Verify", "Approve", "Release"].map((label, idx) => (
            <div
              key={label}
              className={`rounded-2xl border px-4 py-3 text-center text-sm font-semibold ${
                idx === 0 ? "border-[var(--accent,#4C3DFF)] bg-[#F0F1FF]" : "border-[#E6E8EE] bg-[#F6F7FB]"
              }`}
              style={idx === 0 ? ({ "--accent": ACCENT } as CSSProperties) : undefined}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#E6E8EE] bg-[#F6F7FB] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#475569]">
            <span>Student profile</span>
            <span
              className="rounded-full bg-white px-3 py-1 text-[var(--accent,#4C3DFF)]"
              style={{ "--accent": ACCENT } as CSSProperties}
            >
              Verified
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--accent,#4C3DFF)] bg-white text-sm font-semibold text-[var(--accent,#4C3DFF)]"
              style={{ "--accent": ACCENT } as CSSProperties}
            >
              ID
            </div>
            <div className="flex-1 h-1 rounded-full bg-[#E6E8EE]">
              <span
                className="block h-1 w-3/4 rounded-full bg-[var(--accent,#4C3DFF)]"
                style={{ "--accent": ACCENT } as CSSProperties}
              />
            </div>
            <div className="flex h-10 w-24 items-center justify-center rounded-xl border border-[#E6E8EE] bg-white text-[11px] font-semibold text-[#475569]">
              Hold payout
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs text-[#475569]">
            <div className="rounded-xl border border-[#E6E8EE] bg-white px-3 py-2 font-semibold">Audit trail</div>
            <div className="rounded-xl border border-[#E6E8EE] bg-white px-3 py-2 font-semibold">Controls</div>
            <div className="rounded-xl border border-[#E6E8EE] bg-white px-3 py-2 font-semibold">Release</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsStrip() {
  const stats = [
    { label: "Verified candidates", value: "1,240", hint: "ready-to-approve" },
    { label: "Active roles", value: "18", hint: "with approval gates" },
    { label: "Avg. approval time", value: "6h", hint: "last 30 days" },
    { label: "Controlled payouts", value: "98%", hint: "held until milestones" },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-[#E6E8EE] bg-white px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          <p className="text-sm font-semibold text-[#475569]">{stat.label}</p>
          <p className="mt-2 text-3xl font-bold text-[#0B1221]">{stat.value}</p>
          <p className="text-xs text-[#6B7280]">{stat.hint}</p>
        </div>
      ))}
    </section>
  );
}

function OverviewPanels() {
  const panels = [
    {
      title: "Open roles",
      value: "12",
      meta: "High-signal roles",
      items: [
        { label: "Product intern", detail: "4 in shortlist" },
        { label: "Data analyst (PT)", detail: "2 awaiting approval" },
      ],
      cta: { label: "View roles", href: "/employer/dashboard" },
    },
    {
      title: "Applications",
      value: "86",
      meta: "Last 7 days",
      items: [
        { label: "32 verified", detail: "ready to approve" },
        { label: "12 pending", detail: "awaiting documents" },
      ],
      cta: { label: "Review applications", href: "/employer/applications" },
    },
    {
      title: "Payout control",
      value: "98%",
      meta: "Held until milestones",
      items: [
        { label: "7 roles", detail: "using milestone holds" },
        { label: "0 disputes", detail: "this month" },
      ],
      cta: { label: "Manage payouts", href: "/employer/dashboard" },
    },
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {panels.map((panel) => (
        <div key={panel.title} className="rounded-2xl border border-[#E6E8EE] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-[#475569]">{panel.title}</p>
              <p className="text-3xl font-bold text-[#0B1221] mt-1">{panel.value}</p>
              <p className="text-xs text-[#6B7280]">{panel.meta}</p>
            </div>
          </div>
          <div className="space-y-2">
            {panel.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-[#E6E8EE] bg-[#F9FAFB] px-3 py-2">
                <span className="text-sm font-semibold text-[#0B1221]">{item.label}</span>
                <span className="text-xs font-medium text-[#475569]">{item.detail}</span>
              </div>
            ))}
          </div>
          <Link
            href={panel.cta.href}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent,#4C3DFF)] hover:underline"
            style={{ "--accent": ACCENT } as CSSProperties}
          >
            {panel.cta.label}
          </Link>
        </div>
      ))}
    </section>
  );
}

function ControlsGrid() {
  const controls = [
    {
      title: "Verification required",
      body: "ID + enrollment proof before any shortlist.",
    },
    {
      title: "Approval gates",
      body: "No work starts without your explicit approval.",
    },
    {
      title: "Milestone payouts",
      body: "Funds stay locked until deliverables are accepted.",
    },
    {
      title: "Audit + logs",
      body: "Every action recorded for compliance and review.",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#0B1221]">Trust & control</h2>
        <Link
          href="/employer/settings"
          className="text-sm font-semibold text-[var(--accent,#4C3DFF)]"
          style={{ "--accent": ACCENT } as CSSProperties}
        >
          Configure controls
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {controls.map((item) => (
          <div key={item.title} className="rounded-2xl border border-[#E6E8EE] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <p className="text-base font-semibold text-[#0B1221]">{item.title}</p>
            <p className="mt-2 text-sm text-[#475569]">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Workboard() {
  const roles = [
    { title: "Product Intern", status: "Shortlist", meta: "4 verified, 1 pending" },
    { title: "Data Analyst (PT)", status: "Approvals", meta: "2 awaiting approval" },
    { title: "Support Associate", status: "Open", meta: "Shortlist building" },
  ];

  const apps = [
    { name: "Anika Rao", stage: "Awaiting approval", role: "Product Intern" },
    { name: "Louis Kim", stage: "Verified", role: "Data Analyst (PT)" },
    { name: "Mara Singh", stage: "Verified", role: "Support Associate" },
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#E6E8EE] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0B1221]">Roles in flight</h3>
          <Link href="/employer/dashboard" className="text-sm font-semibold text-[var(--accent,#4C3DFF)]" style={{ "--accent": ACCENT } as CSSProperties}>
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role.title} className="rounded-xl border border-[#E6E8EE] bg-[#F9FAFB] px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#0B1221]">{role.title}</p>
                <span className="text-xs font-semibold text-[#475569]">{role.status}</span>
              </div>
              <p className="text-xs text-[#6B7280]">{role.meta}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#E6E8EE] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0B1221]">Applications</h3>
          <Link href="/employer/applications" className="text-sm font-semibold text-[var(--accent,#4C3DFF)]" style={{ "--accent": ACCENT } as CSSProperties}>
            Review
          </Link>
        </div>
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.name} className="rounded-xl border border-[#E6E8EE] bg-[#F9FAFB] px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#0B1221]">{app.name}</p>
                <span className="text-xs font-semibold text-[#475569]">{app.stage}</span>
              </div>
              <p className="text-xs text-[#6B7280]">{app.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pipeline() {
  const steps = [
    { title: "Role defined", detail: "Controls set: verification + milestones" },
    { title: "Verified shortlist", detail: "Only students who passed checks" },
    { title: "Approval", detail: "Employer unlocks start" },
    { title: "Delivery", detail: "Milestones tracked" },
    { title: "Payout release", detail: "Funds move after acceptance" },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#0B1221]">Hiring pipeline</h2>
        <span className="text-sm font-semibold text-[#475569]">Process-first • No surprises</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#E6E8EE] bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <div className="grid gap-0 sm:grid-cols-5">
          {steps.map((step, idx) => (
            <div
              key={step.title}
              className="border-t sm:border-t-0 sm:border-l border-[#E6E8EE] px-4 py-5 first:border-0"
            >
              <div
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F1FF] text-sm font-semibold text-[var(--accent,#4C3DFF)]"
                style={{ "--accent": ACCENT } as CSSProperties}
              >
                {idx + 1}
              </div>
              <p className="mt-3 text-base font-semibold text-[#0B1221]">{step.title}</p>
              <p className="mt-1 text-sm text-[#475569]">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Payouts() {
  return (
    <section className="rounded-2xl border border-[#E6E8EE] bg-white px-5 py-6 shadow-[0_1px_0_rgba(0,0,0,0.03)] space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#0B1221]">Payout control</h2>
        <Link
          href="/employer/dashboard"
          className="text-sm font-semibold text-[var(--accent,#4C3DFF)]"
          style={{ "--accent": ACCENT } as CSSProperties}
        >
          Manage payouts
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "Milestone holds", value: "98%", meta: "held until acceptance" },
          { title: "Disputes", value: "0", meta: "this month" },
          { title: "Avg. release time", value: "4h", meta: "post-approval" },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-[#E6E8EE] bg-[#F9FAFB] px-4 py-3">
            <p className="text-sm font-semibold text-[#475569]">{item.title}</p>
            <p className="text-2xl font-bold text-[#0B1221]">{item.value}</p>
            <p className="text-xs text-[#6B7280]">{item.meta}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Actions() {
  const actions = [
    {
      title: "Post a role",
      body: "Define controls, milestones, and payout rules upfront.",
      href: "/employer/post-job",
      primary: true,
    },
    {
      title: "Review applications",
      body: "Approve or reject verified candidates in one view.",
      href: "/employer/applications",
    },
    {
      title: "Set verification",
      body: "Choose required documents per role before shortlist.",
      href: "/employer/settings",
    },
    {
      title: "Manage payouts",
      body: "Lock funds until milestones are accepted.",
      href: "/employer/dashboard",
    },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-[#0B1221]">Actions</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group rounded-2xl border border-[#E6E8EE] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-colors hover:border-[var(--accent,#4C3DFF)]"
            style={{ "--accent": ACCENT } as CSSProperties}
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-[#0B1221]">{action.title}</p>
              <span className="text-xs font-semibold text-[var(--accent,#4C3DFF)] opacity-0 group-hover:opacity-100 transition-opacity">
                Open →
              </span>
            </div>
            <p className="mt-2 text-sm text-[#475569]">{action.body}</p>
            {action.primary && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--accent,#4C3DFF)] px-3 py-1 text-xs font-semibold text-white">
                Priority
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Unauthenticated() {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative overflow-hidden"
    >
      <div className="max-w-5xl">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8 tracking-tight"
          style={{ color: ACCENT }}
        >
          Student hiring, without operational risk.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl leading-relaxed"
        >
          Approve work, control payments, and hire verified students – all from one platform.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap gap-5 mb-16"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/employer/post-job"
              className="inline-flex items-center px-8 py-4 text-base font-semibold text-white transition-all duration-300"
              style={{ backgroundColor: ACCENT }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#238085'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ACCENT}
            >
              Post a Job
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/how-it-works"
              className="inline-flex items-center px-8 py-4 text-base font-semibold bg-transparent border-2 transition-all duration-300"
              style={{ color: ACCENT, borderColor: ACCENT }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F0F9FA';
                e.currentTarget.style.borderColor = '#238085';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = ACCENT;
              }}
            >
              See how it works
            </Link>
          </motion.div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="pt-12 border-t border-gray-200"
        >
          <p className="text-base text-gray-600 mb-6">Already have an account?</p>
          <div className="flex gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link
          href="/login"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold bg-transparent border-2 transition-all duration-300"
                style={{ color: ACCENT, borderColor: ACCENT }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F0F9FA';
                  e.currentTarget.style.borderColor = '#238085';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = ACCENT;
                }}
        >
          Sign in
        </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link
          href="/signup?role=employer"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold text-gray-700 bg-transparent border-2 border-gray-300 transition-all duration-300"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
        >
          Create employer account
        </Link>
            </motion.div>
      </div>
        </motion.div>
    </div>
    </motion.section>
  );
}

function WrongRole() {
  return (
    <div className="rounded-2xl border border-[#E6E8EE] bg-white p-8 shadow-[0_1px_0_rgba(0,0,0,0.03)] space-y-4">
      <h2 className="text-2xl font-bold text-[#0B1221]">Employer access required</h2>
      <p className="text-sm text-[#475569]">
        This workspace is for employers. Switch to an employer account or contact support for access.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-[var(--accent,#4C3DFF)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3F34CC]"
          style={{ "--accent": ACCENT } as CSSProperties}
        >
          Switch account
        </Link>
        <Link
          href="/help-and-support"
          className="rounded-xl border border-[#E6E8EE] bg-white px-5 py-2.5 text-sm font-semibold text-[#0B1221] hover:bg-[#F6F7FB]"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}

