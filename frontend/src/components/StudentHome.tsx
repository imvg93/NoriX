"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Briefcase, 
  Bookmark, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Building, 
  TrendingUp,
  Bell,
  ArrowLeft,
  Home,
  Search,
  Star
} from 'lucide-react';
import StatsCard from './StatsCard';
import TaskCard from './TaskCard';
import NotificationCard from './NotificationCard';

interface AppliedJob {
  id: number;
  title: string;
  company: string;
  status: string;
  appliedDate: string;
  location: string;
}

interface SavedJob {
  id: number;
  title: string;
  company: string;
  salary: string;
  location: string;
  postedDate: string;
}

interface Interview {
  id: number;
  company: string;
  position: string;
  date: string;
  time: string;
  type: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
}

interface StudentHomeProps {
  user: any;
}

const StudentHome: React.FC<StudentHomeProps> = ({ user }) => {
  const [data, setData] = useState({
    appliedJobs: [] as AppliedJob[],
    savedJobs: [] as SavedJob[],
    interviews: [] as Interview[],
    notifications: [] as Notification[],
    totalApplied: 0,
    totalSaved: 0,
    upcomingInterviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for job searching student - replace with real API calls later
    setData({
      appliedJobs: [
        { id: 1, title: 'Frontend Developer Intern', company: 'TechCorp Inc.', status: 'pending', appliedDate: '2024-01-15', location: 'Hyderabad' },
        { id: 2, title: 'Data Analyst', company: 'DataFlow Solutions', status: 'reviewing', appliedDate: '2024-01-12', location: 'Remote' },
        { id: 3, title: 'Marketing Assistant', company: 'Growth Marketing Co.', status: 'accepted', appliedDate: '2024-01-10', location: 'Hyderabad' }
      ],
      savedJobs: [
        { id: 1, title: 'Full Stack Developer', company: 'StartupXYZ', salary: '₹25,000/month', location: 'Hyderabad', postedDate: '2024-01-14' },
        { id: 2, title: 'UI/UX Designer', company: 'Creative Studio', salary: '₹30,000/month', location: 'Remote', postedDate: '2024-01-13' },
        { id: 3, title: 'Content Writer', company: 'Digital Media Corp', salary: '₹20,000/month', location: 'Hyderabad', postedDate: '2024-01-12' }
      ],
      interviews: [
        { id: 1, company: 'TechCorp Inc.', position: 'Frontend Developer Intern', date: '2024-01-20', time: '10:00 AM', type: 'Technical' },
        { id: 2, company: 'DataFlow Solutions', position: 'Data Analyst', date: '2024-01-22', time: '2:00 PM', type: 'HR' }
      ],
      notifications: [
        { id: 1, title: 'Application Viewed', message: 'TechCorp Inc. viewed your Frontend Developer application', type: 'info', timestamp: '2 hours ago', isRead: false },
        { id: 2, title: 'Interview Scheduled', message: 'DataFlow Solutions scheduled your interview for Jan 22', type: 'success', timestamp: '1 day ago', isRead: true },
        { id: 3, title: 'New Job Match', message: '5 new jobs match your profile and skills', type: 'info', timestamp: '3 days ago', isRead: true }
      ],
      totalApplied: 15,
      totalSaved: 8,
      upcomingInterviews: 2
    });
    setLoading(false);
  }, []);

  const quickActions = [
    { name: 'Search Jobs', icon: Search, href: '/jobs', color: 'blue' },
    { name: 'My Applications', icon: FileText, href: '/applications', color: 'green' },
    { name: 'Saved Jobs', icon: Bookmark, href: '/saved-jobs', color: 'purple' },
    { name: 'Profile', icon: User, href: '/profile', color: 'orange' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/home" 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold text-gray-900">Student Dashboard</h2>
          <p className="text-sm text-gray-600">Job Search & Applications</p>
        </div>
      </div>

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Briefcase className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hi {user?.name || 'Student'}!</h1>
            <p className="text-blue-100">Ready to find your next opportunity? Here's your job search overview</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Jobs Applied"
          value={data.totalApplied}
          icon={FileText}
          color="blue"
          change="+3 this week"
          changeType="positive"
        />
        <StatsCard
          title="Saved Jobs"
          value={data.totalSaved}
          icon={Bookmark}
          color="purple"
          change="+2 this week"
          changeType="positive"
        />
        <StatsCard
          title="Upcoming Interviews"
          value={data.upcomingInterviews}
          icon={Calendar}
          color="orange"
          change="Next: Jan 20"
          changeType="neutral"
        />
        <StatsCard
          title="Application Rate"
          value="85%"
          icon={TrendingUp}
          color="green"
          change="+5% this month"
          changeType="positive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
          </div>
          <div className="space-y-3">
            {data.appliedJobs.map((job: any) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    job.status === 'accepted' ? 'bg-green-100 text-green-600' :
                    job.status === 'reviewing' ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {job.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{job.appliedDate}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Saved Jobs */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bookmark className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Saved Jobs</h2>
          </div>
          <div className="space-y-3">
            {data.savedJobs.map((job: any) => (
              <div key={job.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.company}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        {job.salary}
                      </span>
                      <span className="text-xs text-gray-500">{job.location}</span>
                    </div>
                  </div>
                  <button className="text-purple-600 hover:text-purple-700">
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Upcoming Interviews */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Interviews</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.interviews.map((interview: any) => (
            <div key={interview.id} className="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div className="flex items-center gap-3 mb-3">
                <Building className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="font-medium text-gray-900">{interview.company}</h3>
                  <p className="text-sm text-gray-600">{interview.position}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{interview.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{interview.time}</span>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  {interview.type} Interview
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
        </div>
        <div className="space-y-3">
          {data.notifications.map((notification: any) => (
            <NotificationCard
              key={notification.id}
              title={notification.title}
              message={notification.message}
              type={notification.type}
              timestamp={notification.timestamp}
              isRead={notification.isRead}
            />
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200 group"
            >
              <div className={`p-3 bg-${action.color}-100 rounded-full group-hover:bg-${action.color}-200 transition-colors`}>
                <action.icon className={`w-6 h-6 text-${action.color}-600`} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 text-center">
                {action.name}
              </span>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Temporary Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link 
            href="/student" 
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
          <Link 
            href="/jobs" 
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Search className="w-4 h-4 mr-2" />
            Browse Jobs
          </Link>
          <Link 
            href="/applications" 
            className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4 mr-2" />
            My Applications
          </Link>
          <Link 
            href="/profile" 
            className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentHome;
