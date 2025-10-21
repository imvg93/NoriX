'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LogOut, 
  Home,
  Briefcase,
  Users,
  FileText,
  BarChart3,
  Plus,
  ChevronDown,
  UserCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationDropdown from './NotificationDropdown';

interface LayoutProps {
  children: React.ReactNode;
}


const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Close dropdown when route changes
  useEffect(() => {
    setProfileDropdownOpen(false);
  }, [pathname]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-dropdown-container')) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Don't show layout for login/signup pages, admin pages
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Only show header on main page for authenticated users
  if (isAuthenticated) {
    const handleLogout = () => {
      logout();
      router.push('/login');
    };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/home" className="flex items-center">
                <div className="relative h-8 w-32 sm:h-10 sm:w-40">
                  <img
                    src="/img/norixgreen.png"
                    alt="NoriX logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              </Link>
            </div>

            {/* User Profile Section */}
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              
              {/* Profile Dropdown */}
              <div className="relative profile-dropdown-container">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* User Info */}
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.userType || 'user'}
                    </p>
                  </div>

                  {/* Profile Avatar */}
                  <div className="flex items-center justify-center w-10 h-10 bg-[#32A4A6] text-white rounded-full hover:bg-[#2a8a8c] transition-colors">
                    <span className="text-sm font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  
                  {/* Chevron Down */}
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Animated Dropdown Menu */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#32A4A6] text-white rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold">
                              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {user?.userType || 'user'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          href="/"
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Home className="w-5 h-5" />
                          <span>Home</span>
                        </Link>
                        
                        {user?.userType === 'student' && (
                          <>
                            <Link
                              href="/student/dashboard"
                              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <BarChart3 className="w-5 h-5" />
                              <span>Dashboard</span>
                            </Link>
                            <Link
                              href="/student/jobs"
                              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <Briefcase className="w-5 h-5" />
                              <span>My Jobs</span>
                            </Link>
                            <Link
                              href="/student/approved-applications"
                              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <FileText className="w-5 h-5" />
                              <span>Applications</span>
                            </Link>
                          </>
                        )}
                        
                        {user?.userType === 'employer' && (
                          <>
                            <Link
                              href="/employer"
                              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <BarChart3 className="w-5 h-5" />
                              <span>Dashboard</span>
                            </Link>
                            <Link
                              href="/employer/post-job"
                              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <Plus className="w-5 h-5" />
                              <span>Post Job</span>
                            </Link>
                            <Link
                              href="/employer/applications"
                              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <Users className="w-5 h-5" />
                              <span>Applications</span>
                            </Link>
                          </>
                        )}
                        
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <UserCircle className="w-5 h-5" />
                          <span>Profile Settings</span>
                        </Link>
                        
                        <Link
                          href="/help"
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <HelpCircle className="w-5 h-5" />
                          <span>Help & Support</span>
                        </Link>
                      </div>

                      {/* Logout Button */}
                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-5 h-5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>



      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
  }

  // For unauthenticated users on main page, show simple header
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header for Unauthenticated Users */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="relative h-8 w-32 sm:h-10 sm:w-40">
                  <img
                    src="/img/norixgreen.png"
                    alt="NoriX logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link href="/jobs" className="text-gray-700 hover:text-gray-900 font-medium">
                Jobs
              </Link>
              <Link href="/services" className="text-gray-700 hover:text-gray-900 font-medium">
                Services
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">
                About
              </Link>
              <Link href="/how-it-works" className="text-gray-700 hover:text-gray-900 font-medium">
                How It Works
              </Link>
              <Link href="/careers" className="text-gray-700 hover:text-gray-900 font-medium">
                Careers
              </Link>
              <Link href="/signup" className="text-gray-700 hover:text-gray-900 font-medium">
                Sign up
              </Link>
              <Link href="/login" className="bg-[#32A4A6] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#2a8a8c] transition-colors">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
};

export default Layout;
