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

    // Register event listeners
    socketService.onJobApproved(handleJobApproved);
    socketService.onJobRejected(handleJobRejected);
    socketService.onNewApplication(handleNewApplication);
    socketService.onApplicationStatusUpdate(handleApplicationStatusUpdate);
    socketService.on('connect', handleConnectionStatus);
    socketService.on('disconnect', handleConnectionStatus);

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
        icon: '/img/Favicon.ico',
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
