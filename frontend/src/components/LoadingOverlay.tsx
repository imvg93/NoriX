"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <div className="flex flex-col items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mb-6"
        >
          <Image
            src="/img/norixnobg.jpg"
            alt="NoriX Logo"
            width={120}
            height={120}
            className="w-28 h-28 sm:w-32 sm:h-32"
            priority
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="relative w-48 h-1 bg-gray-200 rounded-full overflow-hidden mb-3">
            <motion.div
              className="absolute h-full bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{
                width: ["0%", "100%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          {message && (
            <p className="text-sm text-gray-600 font-medium">{message}</p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
