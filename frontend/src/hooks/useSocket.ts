"use client";

import { useEffect, useState, useCallback } from 'react';
import socketService from '../services/socketService';

interface SocketStatus {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  socketId?: string;
}

export const useSocket = () => {
  const [socketStatus, setSocketStatus] = useState<SocketStatus>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 10,
  });
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update socket status
  const updateStatus = useCallback(() => {
    if (!isClient) return;
    
    try {
      const status = socketService.getConnectionStatus();
      setSocketStatus({
        isConnected: socketService.isSocketConnected(),
        isConnecting: false, // We'll update this from events
        reconnectAttempts: status.reconnectAttempts,
        maxReconnectAttempts: status.maxReconnectAttempts,
        socketId: status.socketId,
      });
    } catch (error) {
      console.error('Error updating socket status:', error);
    }
  }, [isClient]);

  // Listen for socket events
  useEffect(() => {
    if (!isClient) return;

    const handleSocketConnected = () => {
      setSocketStatus(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
      }));
    };

    const handleSocketDisconnected = () => {
      setSocketStatus(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }));
    };

    const handleSocketReconnecting = () => {
      setSocketStatus(prev => ({
        ...prev,
        isConnecting: true,
      }));
    };

    const handleSocketConnectionError = () => {
      setSocketStatus(prev => ({
        ...prev,
        isConnecting: false,
      }));
    };

    const handleMaxReconnectAttempts = () => {
      setSocketStatus(prev => ({
        ...prev,
        isConnecting: false,
      }));
    };

    // Add event listeners
    window.addEventListener('socketConnected', handleSocketConnected);
    window.addEventListener('socketDisconnected', handleSocketDisconnected);
    window.addEventListener('socketReconnecting', handleSocketReconnecting);
    window.addEventListener('socketConnectionError', handleSocketConnectionError);
    window.addEventListener('socketMaxReconnectAttempts', handleMaxReconnectAttempts);

    // Initial status check
    updateStatus();

    // Cleanup
    return () => {
      window.removeEventListener('socketConnected', handleSocketConnected);
      window.removeEventListener('socketDisconnected', handleSocketDisconnected);
      window.removeEventListener('socketReconnecting', handleSocketReconnecting);
      window.removeEventListener('socketConnectionError', handleSocketConnectionError);
      window.removeEventListener('socketMaxReconnectAttempts', handleMaxReconnectAttempts);
    };
  }, [isClient, updateStatus]);

  // Socket actions
  const reconnect = useCallback(() => {
    if (!isClient) return;
    try {
      socketService.forceReconnect();
    } catch (error) {
      console.error('Error reconnecting socket:', error);
    }
  }, [isClient]);

  const ping = useCallback(() => {
    if (!isClient) return;
    try {
      socketService.ping();
    } catch (error) {
      console.error('Error pinging socket:', error);
    }
  }, [isClient]);

  const checkConnection = useCallback(() => {
    if (!isClient) return;
    try {
      socketService.checkConnection();
      updateStatus();
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  }, [isClient, updateStatus]);

  return {
    ...socketStatus,
    isClient,
    reconnect,
    ping,
    checkConnection,
  };
};
