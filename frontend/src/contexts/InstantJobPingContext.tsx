"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';
import InstantJobPing from '../components/InstantJobPing';
import PostAcceptState from '../components/PostAcceptState';

interface InstantJobPingData {
  _id: string;
  jobTitle: string;
  distance: number;
  pay: string;
  duration: number;
  companyName?: string;
  location?: string;
}

interface PostAcceptStateData {
  jobId: string;
  status: 'waiting' | 'confirmed' | 'rejected';
}

interface InstantJobPingContextType {
  currentPing: InstantJobPingData | null;
  postAcceptState: PostAcceptStateData | null;
}

const InstantJobPingContext = createContext<InstantJobPingContextType>({
  currentPing: null,
  postAcceptState: null,
});

export const useInstantJobPing = () => useContext(InstantJobPingContext);

interface InstantJobPingProviderProps {
  children: ReactNode;
}

export const InstantJobPingProvider: React.FC<InstantJobPingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentPing, setCurrentPing] = useState<InstantJobPingData | null>(null);
  const [postAcceptState, setPostAcceptState] = useState<PostAcceptStateData | null>(null);

  // Global Socket.IO listener for instant job pings
  useEffect(() => {
    // Only listen if user is a student
    if (!user || user.userType !== 'student') {
      return;
    }

    // Only listen if user is available for instant jobs
    if (!(user as any).availableForInstantJobs) {
      console.log('⚠️ Student not available for instant jobs, skipping global ping listener');
      return;
    }

    console.log('🌐 Setting up GLOBAL instant job ping listener for student:', user._id);

    // Get socket instance
    const getSocket = () => {
      return (socketService as any).socket;
    };

    // Handler for instant job ping
    const handleInstantJobPing = (data: any) => {
      console.log('📨 ✅ GLOBAL LISTENER: Received instant job ping:', data);
      console.log('🎯 Showing popup modal now!');
      
      // Show the popup immediately
      setCurrentPing({
        _id: data.jobId,
        jobTitle: data.jobTitle || 'Instant Job Opportunity',
        distance: data.distance || 0,
        pay: data.pay || 'N/A',
        duration: data.duration || 1,
        companyName: data.companyName,
        location: data.location
      });
      
      // Force a re-render to ensure popup shows
      setTimeout(() => {
        console.log('✅ Popup state set, currentPing should be visible');
      }, 100);
    };

    // Handler for job confirmed
    const handleJobConfirmed = (data: any) => {
      console.log('✅ GLOBAL LISTENER: Job confirmed:', data);
      setPostAcceptState({
        jobId: data.jobId,
        status: 'confirmed'
      });
      setCurrentPing(null); // Close ping modal
      
      // Optionally redirect to confirmation page after a short delay
      // This gives time for the PostAcceptState modal to show first
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = `/student/instant-job/${data.jobId}/confirmation`;
        }
      }, 2000); // 2 second delay to show the confirmation modal first
    };

    // Handler for job rejected
    const handleJobRejected = (data: any) => {
      console.log('❌ GLOBAL LISTENER: Job rejected:', data);
      setPostAcceptState({
        jobId: data.jobId,
        status: 'rejected'
      });
      setCurrentPing(null); // Close ping modal
    };

    // Setup listeners when socket connects
    const setupListeners = (sock: any) => {
      if (!sock) return;
      
      console.log('🔌 GLOBAL: Socket connected, setting up listeners...');
      sock.on('instant-job-ping', handleInstantJobPing);
      sock.on('instant-job-confirmed', handleJobConfirmed);
      sock.on('instant-job-rejected', handleJobRejected);
      console.log('✅ GLOBAL: Socket listeners registered');
    };

    // Try to setup immediately
    const socket = getSocket();
    if (socket && socket.connected) {
      setupListeners(socket);
    } else {
      console.log('⚠️ GLOBAL: Socket not connected yet, waiting for connection...');
      
      // Listen for socket connection
      const handleConnect = () => {
        const sock = getSocket();
        if (sock) {
          setupListeners(sock);
        }
      };
      
      // Listen for custom socket connected event
      window.addEventListener('socketConnected', handleConnect);
      
      // Also try periodically
      const retryInterval = setInterval(() => {
        const sock = getSocket();
        if (sock && sock.connected) {
          clearInterval(retryInterval);
          setupListeners(sock);
        }
      }, 2000);

      return () => {
        clearInterval(retryInterval);
        window.removeEventListener('socketConnected', handleConnect);
      };
    }

    // Cleanup
    return () => {
      const sock = getSocket();
      if (sock) {
        sock.off('instant-job-ping', handleInstantJobPing);
        sock.off('instant-job-confirmed', handleJobConfirmed);
        sock.off('instant-job-rejected', handleJobRejected);
      }
    };
  }, [user]);

  // Handle accept
  const handleAccept = async () => {
    if (!currentPing) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again');
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/instant-jobs/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId: currentPing._id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept job');
      }

      // Show post-accept state
      setPostAcceptState({
        jobId: currentPing._id,
        status: 'waiting'
      });
      setCurrentPing(null);
    } catch (error: any) {
      console.error('Error accepting job:', error);
      alert(error.message || 'Failed to accept job. It may have been taken.');
      setCurrentPing(null);
    }
  };

  // Handle skip/close
  const handleSkip = () => {
    setCurrentPing(null);
  };

  // Handle close post-accept state
  const handleClosePostAccept = () => {
    setPostAcceptState(null);
  };

  return (
    <InstantJobPingContext.Provider value={{ currentPing, postAcceptState }}>
      {children}
      
      {/* Global Instant Job Ping Modal - Always on top */}
      {currentPing && (
        <InstantJobPing
          job={currentPing}
          onAccept={handleAccept}
          onSkip={handleSkip}
          onClose={handleSkip}
        />
      )}

      {/* Global Post-Accept State Modal */}
      {postAcceptState && (
        <PostAcceptState
          jobId={postAcceptState.jobId}
          status={postAcceptState.status}
          onConfirmed={() => {
            handleClosePostAccept();
            // Redirect to confirmation page if confirmed
            if (postAcceptState.status === 'confirmed') {
              setTimeout(() => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/student/instant-job/${postAcceptState.jobId}/confirmation`;
                }
              }, 1500);
            }
          }}
        />
      )}
    </InstantJobPingContext.Provider>
  );
};

