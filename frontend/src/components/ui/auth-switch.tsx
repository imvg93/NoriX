'use client';

import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthSwitchProps {
  onSwitch?: (mode: 'login' | 'signup') => void;
  initialMode?: 'login' | 'signup';
  className?: string;
}

export const AuthSwitch: React.FC<AuthSwitchProps> = ({ 
  onSwitch, 
  initialMode = 'login',
  className 
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  const handleSwitch = (newMode: 'login' | 'signup') => {
    if (newMode === mode) return; // Prevent re-render if same mode
    setMode(newMode);
    onSwitch?.(newMode);
  };

  return (
    <div 
      className={cn(
        "relative inline-flex items-center gap-1 p-1 bg-gray-100/80 rounded-full border-2 border-gray-200 shadow-inner",
        className
      )}
      role="tablist"
      aria-label="Authentication mode selector"
    >
      {/* Animated background slider */}
      <motion.div
        className="absolute inset-y-0 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-lg"
        style={{ width: 'calc(50% - 4px)' }}
        initial={false}
        animate={{
          x: mode === 'login' ? 4 : 'calc(100% + 4px)',
         
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          mass: 0.5
        }}
      />

      {/* Login button */}
      <button
        type="button"
        onClick={() => handleSwitch('login')}
        className={cn(
          "relative z-10 px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 min-w-[100px]",
          mode === 'login' 
            ? "text-white shadow-sm" 
            : "text-gray-700 hover:text-indigo-600"
        )}
        role="tab"
        aria-selected={mode === 'login'}
        aria-controls="login-panel"
      >
        Sign In
      </button>

      {/* Sign Up button */}
      <button
        type="button"
        onClick={() => handleSwitch('signup')}
        className={cn(
          "relative z-10 px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 min-w-[100px]",
          mode === 'signup' 
            ? "text-white shadow-sm" 
            : "text-gray-700 hover:text-indigo-600"
        )}
        role="tab"
        aria-selected={mode === 'signup'}
        aria-controls="signup-panel"
      >
        Sign Up
      </button>
    </div>
  );
};

export default AuthSwitch;
