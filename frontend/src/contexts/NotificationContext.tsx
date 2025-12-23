"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import socketService, { 
  NotificationData, 
  JobApprovedNotification, 
  JobRejectedNotification, 
  NewApplicationNotification, 
  ApplicationStatusUpdateNotification 
} from '../services/socketService';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  data?: any;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Fetch notifications from API on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE_URL}/notifications/my-notifications?limit=50`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.notifications) {
            const apiNotifications = data.data.notifications.map((notif: any) => ({
              id: notif._id || notif.id,
              type: notif.type || 'system',
              title: notif.message?.includes('accepted') || notif.message?.includes('approved') 
                ? 'Application Accepted! 🎉' 
                : notif.message?.includes('rejected')
                ? 'Application Update'
                : notif.message?.includes('applied')
                ? 'New Application Received 📝'
                : 'Notification',
              message: notif.message || 'You have a new notification',
              timestamp: notif.createdAt ? new Date(notif.createdAt).toISOString() : new Date().toISOString(),
              read: notif.isRead || notif.read || false,
              data: notif.metadata || {}
            }));
            setNotifications(apiNotifications);
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    fetchNotifications();
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        try {
          const parsed = JSON.parse(savedNotifications);
          setNotifications(parsed);
        } catch (error) {
          console.error('Error parsing saved notifications:', error);
        }
      }
    }
  }, []);

  // Save notifications to localStorage whenever notifications change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Setup socket event listeners
  useEffect(() => {
    const handleJobApproved = (data: JobApprovedNotification) => {
      addNotification({
        type: 'job_approved',
        title: 'New Job Available! 🎉',
        message: data.message,
        timestamp: data.timestamp,
        data: data.job
      });
    };

    const handleJobRejected = (data: JobRejectedNotification) => {
      addNotification({
        type: 'job_rejected',
        title: 'Job Rejected ❌',
        message: data.message,
        timestamp: data.timestamp,
        data: data.job
      });
    };

    const handleNewApplication = (data: NewApplicationNotification) => {
      addNotification({
        type: 'new_application',
        title: 'New Application Received 📝',
        message: data.message,
        timestamp: data.timestamp,
        data: data.application
      });
    };

    const handleApplicationStatusUpdate = (data: ApplicationStatusUpdateNotification) => {
      addNotification({
        type: 'application_status_update',
        title: 'Application Status Updated 📋',
        message: data.message,
        timestamp: data.timestamp,
        data: data.application
      });
    };

    const handleConnectionStatus = () => {
      setIsConnected(socketService.isSocketConnected());
    };

    const handleKycStatusUpdate = (data: any) => {
      const status = data?.status;
      const title = status === 'approved' ? 'KYC Approved ✅' : status === 'rejected' ? 'KYC Rejected ❌' : 'KYC Update';
      const message = data?.message || (status === 'approved' ? 'Your KYC has been approved. All features are enabled.' : status === 'rejected' ? 'Your KYC was rejected. Please review and resubmit.' : 'Your KYC status was updated.');
      addNotification({
        type: 'kyc',
        title,
        message,
        timestamp: new Date().toISOString(),
        data
      });
    };

    // Handle new real-time notifications from the notification service
    const handleNewNotification = (data: any) => {
      const notificationType = data.type || 'system';
      let title = '';
      let type = notificationType;

      // Map notification types to titles
      switch (notificationType) {
        case 'application':
          if (data.message?.includes('accepted') || data.message?.includes('approved')) {
            title = 'Application Accepted! 🎉';
          } else if (data.message?.includes('rejected')) {
            title = 'Application Update';
          } else if (data.message?.includes('applied')) {
            title = 'New Application Received 📝';
          } else {
            title = 'Application Update';
          }
          break;
        case 'alert':
          title = 'Alert ⚠️';
          break;
        case 'system':
          title = 'System Notification 🔔';
          break;
        default:
          title = 'Notification';
      }

      addNotification({
        type,
        title,
        message: data.message || 'You have a new notification',
        timestamp: data.createdAt || data.timestamp || new Date().toISOString(),
        data: data.metadata || data
      });
    };

    // Register event listeners
    socketService.onJobApproved(handleJobApproved);
    socketService.onJobRejected(handleJobRejected);
    socketService.onNewApplication(handleNewApplication);
    socketService.onApplicationStatusUpdate(handleApplicationStatusUpdate);
    socketService.on('connect', handleConnectionStatus);
    socketService.on('disconnect', handleConnectionStatus);
    socketService.on('kyc:status:update', handleKycStatusUpdate);
    
    // Listen for new notifications from the notification service
    socketService.on('notification:new', handleNewNotification);
    socketService.on('notification', handleNewNotification);

    // Check initial connection status
    handleConnectionStatus();

    // Cleanup
    return () => {
      socketService.off('job_approved', handleJobApproved);
      socketService.off('job_rejected', handleJobRejected);
      socketService.off('new_application', handleNewApplication);
      socketService.off('application_status_update', handleApplicationStatusUpdate);
      socketService.off('connect', handleConnectionStatus);
      socketService.off('disconnect', handleConnectionStatus);
      socketService.off('kyc:status:update', handleKycStatusUpdate);
      socketService.off('notification:new', handleNewNotification);
      socketService.off('notification', handleNewNotification);
    };
  }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show browser notification if permission is granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.message,
        icon: '/Favicon.ico',
        tag: newNotification.id
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    isConnected
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('Notification permission denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};
