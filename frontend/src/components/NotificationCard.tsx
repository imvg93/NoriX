"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface NotificationCardProps {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead?: boolean;
  className?: string;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  title,
  message,
  type,
  timestamp,
  isRead = false,
  className = '',
}) => {
  const typeConfig = {
    info: {
      icon: Info,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    success: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    error: {
      icon: Bell,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl border ${config.borderColor} p-4 hover:shadow-md transition-all duration-200 ${
        !isRead ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-medium text-gray-900 ${!isRead ? 'font-semibold' : ''}`}>
              {title}
            </h3>
            <span className="text-xs text-gray-500">{timestamp}</span>
          </div>
          <p className="text-sm text-gray-600">{message}</p>
          {!isRead && (
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationCard;
