"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Building, 
  BookOpen, 
  Activity, 
  AlertTriangle, 
  Plus, 
  Eye,
  TrendingUp,
  Clock
} from 'lucide-react';
import StatsCard from './StatsCard';
import NotificationCard from './NotificationCard';

interface Activity {
  id: number;
  action: string;
  user: string;
  time: string;
  type: string;
}

interface SystemAlert {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
}

interface AdminHomeProps {
  user: any;
}

const AdminHome: React.FC<AdminHomeProps> = ({ user }) => {
  const [data, setData] = useState({
    stats: {
      totalStudents: 0,
      activeEmployers: 0,
      totalCourses: 0,
      pendingApprovals: 0
    },
    recentActivity: [] as Activity[],
    systemAlerts: [] as SystemAlert[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - replace with real API calls later
    setData({
      stats: {
        totalStudents: 1247,
        activeEmployers: 89,
        totalCourses: 156,
        pendingApprovals: 12
      },
      recentActivity: [
        { id: 1, action: 'New student registration', user: 'John Doe', time: '2 hours ago', type: 'info' },
        { id: 2, action: 'Course uploaded', user: 'Prof. Smith', time: '4 hours ago', type: 'success' },
        { id: 3, action: 'Job posting created', user: 'TechCorp Inc.', time: '1 day ago', type: 'info' }
      ],
      systemAlerts: [
        { id: 1, title: 'Pending Student Verification', message: '5 new student accounts awaiting approval', type: 'warning', timestamp: '1 hour ago', isRead: false },
        { id: 2, title: 'Employer Account Review', message: '3 employer accounts need verification', type: 'warning', timestamp: '3 hours ago', isRead: false },
        { id: 3, title: 'Course Approval Required', message: '2 new courses waiting for admin review', type: 'info', timestamp: '5 hours ago', isRead: true }
      ]
    });
    setLoading(false);
  }, []);

  const quickActions = [
    { name: 'Add Student', icon: Plus, href: '/admin/users/add-student', color: 'blue' },
    { name: 'Add Employer', icon: Building, href: '/admin/users/add-employer', color: 'green' },
    { name: 'Create Course', icon: BookOpen, href: '/admin/courses/create', color: 'purple' },
    { name: 'View Reports', icon: Eye, href: '/admin/reports', color: 'orange' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
        className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome back, Admin!</h1>
            <p className="text-green-100">Here's your system overview and recent activities</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Students"
          value={data.stats.totalStudents.toLocaleString()}
          icon={Users}
          color="blue"
          change="+12 this week"
          changeType="positive"
        />
        <StatsCard
          title="Active Employers"
          value={data.stats.activeEmployers}
          icon={Building}
          color="green"
          change="+3 this week"
          changeType="positive"
        />
        <StatsCard
          title="Total Courses"
          value={data.stats.totalCourses}
          icon={BookOpen}
          color="purple"
          change="+5 this month"
          changeType="positive"
        />
        <StatsCard
          title="Pending Approvals"
          value={data.stats.pendingApprovals}
          icon={AlertTriangle}
          color="orange"
          change="Requires attention"
          changeType="negative"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {data.recentActivity.map((activity: Activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600">by {activity.user}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Alerts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
          </div>
          <div className="space-y-3">
            {data.systemAlerts.map((alert: SystemAlert) => (
              <NotificationCard
                key={alert.id}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                timestamp={alert.timestamp}
                isRead={alert.isRead}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-green-50 hover:border-green-200 border border-transparent transition-all duration-200 group"
            >
              <div className={`p-3 bg-${action.color}-100 rounded-full group-hover:bg-${action.color}-200 transition-colors`}>
                <action.icon className={`w-6 h-6 text-${action.color}-600`} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-green-700 text-center">
                {action.name}
              </span>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Performance Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">System Performance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">98.5%</div>
            <div className="text-sm text-blue-600">Uptime</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">2.3s</div>
            <div className="text-sm text-green-600">Avg Response</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">1,247</div>
            <div className="text-sm text-purple-600">Active Users</div>
          </div>
        </div>
      </motion.div>

      {/* Temporary Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a 
            href="/admin" 
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Shield className="w-4 h-4 mr-2" />
            Dashboard
          </a>
          <a 
            href="/admin/users" 
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Users
          </a>
          <a 
            href="/admin/courses" 
            className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Manage Courses
          </a>
          <a 
            href="/admin/reports" 
            className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Reports
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminHome;
