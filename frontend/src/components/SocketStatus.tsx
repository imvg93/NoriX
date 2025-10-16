"use client";

import React from 'react';
import { useSocket } from '../hooks/useSocket';

interface SocketStatusProps {
  showDetails?: boolean;
  className?: string;
}

const SocketStatus: React.FC<SocketStatusProps> = ({ 
  showDetails = false, 
  className = "" 
}) => {
  const {
    isConnected,
    isConnecting,
    reconnectAttempts,
    maxReconnectAttempts,
    socketId,
    isClient,
    reconnect,
    ping,
    checkConnection,
  } = useSocket();

  // Don't render on server side to avoid hydration mismatches
  if (!isClient) {
    return null;
  }

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div 
          className={`w-3 h-3 rounded-full ${
            isConnected 
              ? 'bg-green-500' 
              : isConnecting 
                ? 'bg-yellow-500 animate-pulse' 
                : 'bg-red-500'
          }`}
          title={isConnected ? 'Connected' : isConnecting ? 'Reconnecting...' : 'Disconnected'}
        />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Connected' : isConnecting ? 'Reconnecting...' : 'Disconnected'}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-lg shadow border ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Socket Connection Status</h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div 
            className={`w-4 h-4 rounded-full ${
              isConnected 
                ? 'bg-green-500' 
                : isConnecting 
                  ? 'bg-yellow-500 animate-pulse' 
                  : 'bg-red-500'
            }`}
          />
          <span className="font-medium">
            Status: {isConnected ? 'Connected' : isConnecting ? 'Reconnecting...' : 'Disconnected'}
          </span>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <div>Socket ID: {socketId || 'N/A'}</div>
          <div>Reconnect Attempts: {reconnectAttempts}/{maxReconnectAttempts}</div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={checkConnection}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
          >
            Check Status
          </button>
          
          <button
            onClick={reconnect}
            disabled={isConnecting}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isConnecting ? 'Reconnecting...' : 'Reconnect'}
          </button>
          
          <button
            onClick={ping}
            disabled={!isConnected}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Ping Server
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocketStatus;