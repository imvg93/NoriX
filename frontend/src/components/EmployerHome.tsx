"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, 
  Briefcase, 
  Users, 
  Star, 
  Plus, 
  Eye, 
  User, 
  Bell,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import StatsCard from './StatsCard';
import NotificationCard from './NotificationCard';

interface JobPosting {
  id: number;
  title: string;
  status: string;
  applications: number;
  postedDate: string;
}

interface Application {
  id: number;
  student: string;
  job: string;
  status: string;
  appliedDate: string;
}

interface TopCandidate {
  id: number;
  name: string;
  skills: string[];
  rating: number;
  experience: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
}

interface EmployerHomeProps {
  user: any;
}

const EmployerHome: React.FC<EmployerHomeProps> = ({ user }) => {
  const [data, setData] = useState({
    stats: {
      activeJobs: 0,
      totalApplications: 0,
      pendingApprovals: 0,
      hiredStudents: 0
    },
    jobPostings: [] as JobPosting[],
    applications: [] as Application[],
    topCandidates: [] as TopCandidate[],
    notifications: [] as Notification[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - replace with real API calls later
    setData({
      stats: {
        activeJobs: 8,
        totalApplications: 47,
        pendingApprovals: 12,
        hiredStudents: 23
      },
      jobPostings: [
        { id: 1, title: 'Frontend Developer', status: 'active', applications: 15, postedDate: '2024-01-10' },
        { id: 2, title: 'Data Analyst Intern', status: 'pending', applications: 8, postedDate: '2024-01-12' },
        { id: 3, title: 'Marketing Assistant', status: 'active', applications: 12, postedDate: '2024-01-08' }
      ],
      applications: [
        { id: 1, student: 'Sarah Johnson', job: 'Frontend Developer', status: 'pending', appliedDate: '2024-01-14' },
        { id: 2, student: 'Mike Chen', job: 'Data Analyst Intern', status: 'reviewing', appliedDate: '2024-01-13' },
        { id: 3, student: 'Emily Davis', job: 'Marketing Assistant', status: 'accepted', appliedDate: '2024-01-11' }
      ],
      topCandidates: [
        { id: 1, name: 'Alex Thompson', skills: ['React', 'Node.js', 'MongoDB'], rating: 4.8, experience: '2 years' },
        { id: 2, name: 'Priya Sharma', skills: ['Python', 'Data Analysis', 'SQL'], rating: 4.9, experience: '1.5 years' },
        { id: 3, name: 'David Kim', skills: ['Marketing', 'Social Media', 'Analytics'], rating: 4.7, experience: '3 years' }
      ],
      notifications: [
        { id: 1, title: 'New Application Received', message: 'Sarah Johnson applied for Frontend Developer position', type: 'info', timestamp: '2 hours ago', isRead: false },
        { id: 2, title: 'Application Status Updated', message: 'Mike Chen\'s application moved to review phase', type: 'success', timestamp: '4 hours ago', isRead: true },
        { id: 3, title: 'Job Posting Approved', message: 'Data Analyst Intern position is now live', type: 'success', timestamp: '1 day ago', isRead: true }
      ]
    });
    setLoading(false);
  }, []);

  const quickActions = [
    { name: 'Post Job', icon: Plus, href: '/employer/post-job', color: 'orange' },
    { name: 'View Candidates', icon: Eye, href: '/employer/candidates', color: 'blue' },
    { name: 'Manage Profile', icon: User, href: '/employer/profile', color: 'green' },
    { name: 'View Reports', icon: TrendingUp, href: '/employer/reports', color: 'purple' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Building className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hi {user?.companyName || 'Employer'}!</h1>
            <p className="text-orange-100">Here's your hiring overview and latest updates</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Jobs"
          value={data.stats.activeJobs}
          icon={Briefcase}
          color="orange"
          change="+2 this week"
          changeType="positive"
        />
        <StatsCard
          title="Total Applications"
          value={data.stats.totalApplications}
          icon={Users}
          color="blue"
          change="+15 this week"
          changeType="positive"
        />
        <StatsCard
          title="Pending Approvals"
          value={data.stats.pendingApprovals}
          icon={Clock}
          color="orange"
          change="Requires review"
          changeType="neutral"
        />
        <StatsCard
          title="Hired Students"
          value={data.stats.hiredStudents}
          icon={CheckCircle}
          color="green"
          change="+3 this month"
          changeType="positive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Postings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Job Postings</h2>
          </div>
          <div className="space-y-3">
            {data.jobPostings.map((job: any) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.applications} applications</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    job.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {job.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{job.postedDate}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
          </div>
          <div className="space-y-3">
            {data.applications.map((application: any) => (
              <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{application.student}</h3>
                  <p className="text-sm text-gray-600">{application.job}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    application.status === 'accepted' ? 'bg-green-100 text-green-600' :
                    application.status === 'reviewing' ? 'bg-blue-100 text-blue-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {application.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{application.appliedDate}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Candidates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">Top Candidates</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.topCandidates.map((candidate: any) => (
            <div key={candidate.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {candidate.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{candidate.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-orange-500 fill-current" />
                    <span className="text-sm text-gray-600">{candidate.rating}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-gray-600">{candidate.experience} experience</p>
                <div className="flex flex-wrap gap-1">
                  {candidate.skills.map((skill: string, index: number) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
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
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all duration-200 group"
            >
              <div className={`p-3 bg-${action.color}-100 rounded-full group-hover:bg-${action.color}-200 transition-colors`}>
                <action.icon className={`w-6 h-6 text-${action.color}-600`} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700 text-center">
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
          <a 
            href="/employer" 
            className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            <Building className="w-4 h-4 mr-2" />
            Dashboard
          </a>
          <a 
            href="/employer/post-job" 
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post Job
          </a>
          <a 
            href="/employer/candidates" 
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Users className="w-4 h-4 mr-2" />
            View Candidates
          </a>
          <a 
            href="/employer/profile" 
            className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default EmployerHome;
