"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  title: string;
  description?: string;
  dueDate?: string;
  status: 'pending' | 'completed' | 'overdue';
  priority?: 'low' | 'medium' | 'high';
  className?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  title,
  description,
  dueDate,
  status,
  priority = 'medium',
  className = '',
}) => {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    completed: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    overdue: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-red-100 text-red-600',
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl border ${config.borderColor} p-4 hover:shadow-md transition-all duration-200 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mb-2">{description}</p>
          )}
          <div className="flex items-center gap-3">
            {dueDate && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {dueDate}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[priority]}`}>
              {priority}
            </span>
          </div>
        </div>
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
