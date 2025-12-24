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
  const [waveNumber, setWaveNumber] = useState<number>(1);

  // Global Socket.IO listener for instant job pings
  useEffect(() => {
    // Only listen if user is a student
    if (!user || user.userType !== 'student') {
      console.log('⚠️ Not a student, skipping instant job ping listener');
      return;
    }

    console.log('🌐 Setting up GLOBAL instant job ping listener for student:', user._id);

    // Get socket instance
    const getSocket = () => {
      return (socketService as any).socket;
    };

    // Handler for instant job ping
    const handleInstantJobPing = (data: any) => {
      console.log('\n' + '='.repeat(80));
      console.log('📨 ✅ GLOBAL LISTENER: INSTANT JOB PING RECEIVED!');
      console.log('='.repeat(80));
      console.log('📦 Ping Data:', JSON.stringify(data, null, 2));
      console.log('🎯 Setting currentPing state to show popup NOW!');
      console.log('='.repeat(80) + '\n');
      
      // Update wave number
      setWaveNumber(data.waveNumber || 1);
      
      // Show the popup immediately - FORCE UPDATE
      const pingData = {
        _id: data.jobId,
        jobTitle: data.jobTitle || 'Instant Job Opportunity',
        distance: data.distance || 0,
        pay: data.pay || 'N/A',
        duration: data.duration || 1,
        companyName: data.companyName,
        location: data.location
      };
      
      console.log('📋 Popup Data:', pingData);
      console.log('🚨 SETTING STATE - POPUP WILL SHOW!');
      
      // Clear any existing ping first
      setCurrentPing(null);
      
      // Then set new ping immediately
      setTimeout(() => {
        setCurrentPing(pingData);
        console.log('✅ State SET - Popup component should render NOW!');
        console.log('   currentPing is now:', pingData);
        
        // Force body to be visible
        if (typeof window !== 'undefined') {
          document.body.style.overflow = 'hidden';
          console.log('🔒 Body scroll locked for popup');
        }
      }, 50);
    };

    // Handler for job confirmed
    const handleJobConfirmed = (data: any) => {
      console.log('✅ GLOBAL LISTENER: Job confirmed:', data);
      setPostAcceptState({
        jobId: data.jobId,
        status: 'confirmed'
      });
      setCurrentPing(null); // Close ping modal
      
      // No auto-redirect - let user stay on the modal and choose their action
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
      if (!sock) {
        console.log('⚠️ GLOBAL: No socket instance available');
        return;
      }
      
      console.log('🔌 GLOBAL: Socket connected, setting up listeners...', {
        socketId: sock.id,
        connected: sock.connected,
        userId: user._id,
        room: `user:${user._id}`
      });
      
      // Remove existing listeners to prevent duplicates
      sock.off('instant-job-ping', handleInstantJobPing);
      sock.off('student:ping', handleInstantJobPing);
      sock.off('instant-job-confirmed', handleJobConfirmed);
      sock.off('instant-job-rejected', handleJobRejected);
      
      // Add listeners with HIGH PRIORITY
      sock.on('instant-job-ping', handleInstantJobPing); // legacy
      sock.on('student:ping', handleInstantJobPing);
      sock.on('instant-job-confirmed', handleJobConfirmed);
      sock.on('instant-job-rejected', handleJobRejected);
      
      console.log('✅ GLOBAL: Socket listeners ACTIVE - Ready to receive instant job pings!');
      console.log('   Listening on room: user:' + user._id);
      console.log('   When employer creates job, popup will show IMMEDIATELY!');
      
      // Test connection by emitting a test event
      sock.emit('ping', { userId: user._id, timestamp: Date.now() });
      
      // Log that we're ready
      console.log('🎯 READY: Student is ONLINE and will receive instant job notifications');
    };

    // Try to setup immediately
    const socket = getSocket();
    if (socket && socket.connected) {
      console.log('✅ GLOBAL: Socket already connected, setting up listeners immediately');
      setupListeners(socket);
    } else {
      console.log('⚠️ GLOBAL: Socket not connected yet, waiting for connection...', {
        hasSocket: !!socket,
        isConnected: socket?.connected
      });
      
      // Listen for socket connection
      const handleConnect = () => {
        console.log('🔌 GLOBAL: Socket connected event received');
        const sock = getSocket();
        if (sock && sock.connected) {
          setupListeners(sock);
        }
      };
      
      // Listen for custom socket connected event
      window.addEventListener('socketConnected', handleConnect);
      
      // Also listen to socket's own connect event
      if (socket) {
        socket.on('connect', handleConnect);
        socket.on('connected', handleConnect);
      }
      
      // Also try periodically
      const retryInterval = setInterval(() => {
        const sock = getSocket();
        if (sock && sock.connected) {
          console.log('✅ GLOBAL: Socket connected via retry, setting up listeners');
          clearInterval(retryInterval);
          setupListeners(sock);
        }
      }, 2000);

      return () => {
        clearInterval(retryInterval);
        window.removeEventListener('socketConnected', handleConnect);
        if (socket) {
          socket.off('connect', handleConnect);
          socket.off('connected', handleConnect);
        }
      };
    }

    // Cleanup
    return () => {
      const sock = getSocket();
      if (sock) {
      sock.off('instant-job-ping', handleInstantJobPing);
      sock.off('student:ping', handleInstantJobPing);
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

  // Debug render
  React.useEffect(() => {
    console.log('🔄 InstantJobPingProvider RENDER:', {
      hasCurrentPing: !!currentPing,
      hasPostAcceptState: !!postAcceptState,
      currentPingData: currentPing,
      isStudent: user?.userType === 'student',
      willShowPopup: !!currentPing && user?.userType === 'student'
    });

    if (currentPing && user?.userType === 'student') {
      console.log('🚨🚨🚨 POPUP SHOULD BE VISIBLE NOW 🚨🚨🚨');
      console.log('   Job:', currentPing.jobTitle);
      console.log('   Pay:', currentPing.pay);
      console.log('   Distance:', currentPing.distance, 'km');
    }
  }, [currentPing, postAcceptState, user]);

  return (
    <InstantJobPingContext.Provider value={{ currentPing, postAcceptState }}>
      {children}
      
      {/* Global Instant Job Ping Modal - ALWAYS RENDERS ON TOP OF EVERYTHING */}
      {currentPing && user?.userType === 'student' && (() => {
        console.log('🎨🎨🎨 RENDERING InstantJobPing POPUP 🎨🎨🎨');
        console.log('   Job Data:', currentPing);
        console.log('   Wave:', waveNumber);
        return (
          <div 
            style={{ 
              position: 'fixed', 
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999999,
              pointerEvents: 'auto'
            }}
          >
            <InstantJobPing
              job={{...currentPing, waveNumber} as any}
              onAccept={handleAccept}
              onSkip={handleSkip}
              onClose={handleSkip}
            />
          </div>
        );
      })()}

      {/* Global Post-Accept State Modal */}
      {postAcceptState && (
        <PostAcceptState
          jobId={postAcceptState.jobId}
          status={postAcceptState.status}
          onConfirmed={() => {
            handleClosePostAccept();
            // No auto-redirect - user controls navigation
          }}
        />
      )}
    </InstantJobPingContext.Provider>
  );
};

