"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [currentTheme, setCurrentTheme] = useState<'trust-blue' | 'warm-teal'>('trust-blue');
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Apply compact mode
    if (isCompact) {
      document.body.classList.add('kyc-form-compact');
    } else {
      document.body.classList.remove('kyc-form-compact');
    }
  }, [currentTheme, isCompact]);

  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'trust-blue' ? 'warm-teal' : 'trust-blue');
  };

  const toggleCompact = () => {
    setIsCompact(prev => !prev);
  };

  return (
    <div className={`kyc-theme-toggle ${className}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-1 ${currentTheme === 'trust-blue' ? 'active' : ''}`}
          title={`Current theme: ${currentTheme === 'trust-blue' ? 'Trust Blue' : 'Warm Teal'}`}
        >
          <Palette className="w-4 h-4" />
          <span className="hidden sm:inline">
            {currentTheme === 'trust-blue' ? 'Blue' : 'Teal'}
          </span>
        </button>
        
        <button
          onClick={toggleCompact}
          className={`flex items-center gap-1 ${isCompact ? 'active' : ''}`}
          title={`${isCompact ? 'Switch to full form' : 'Switch to compact form'}`}
        >
          {isCompact ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="hidden sm:inline">
            {isCompact ? 'Full' : 'Compact'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
