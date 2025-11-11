"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { requestNotificationPermission } from './NotificationContext';
import { AuthPreservation } from '../utils/authPreservation';
import { apiService } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  userType: 'student' | 'employer' | 'admin';
  role: 'user' | 'admin';
  companyName?: string;
  company?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  kycStatus?: 'not-submitted' | 'pending' | 'approved' | 'rejected' | null;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  refreshToken: () => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const resolveUserRole = (user?: { userType?: 'student' | 'employer' | 'admin'; role?: 'user' | 'admin' }): 'user' | 'admin' => {
  if (user?.role === 'admin') {
    return 'admin';
  }
  if (user?.role === 'user') {
    return 'user';
  }
  return user?.userType === 'admin' ? 'admin' : 'user';
};

const normalizeUserWithRole = <T extends { userType?: 'student' | 'employer' | 'admin'; role?: 'user' | 'admin' }>(user: T): T & { role: 'user' | 'admin' } => {
  return {
    ...user,
    role: resolveUserRole(user),
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Token validation function
  const validateToken = async (authToken: string): Promise<boolean> => {
    try {
      console.log('🔍 Validating token...');
      
      const API_URL  = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('🔍 Token validation response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Token validation response:', data);
        
        if (data.success && data.user) {
          console.log('✅ Token is valid for user:', data.user.name);
          return true;
        }
      }
      
      console.log('❌ Token validation failed');
      return false;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return false;
    }
  };

  // Initialize authentication on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🔍 Initializing authentication...');
        
        // Check if we're in browser environment
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        
        // Load saved authentication data
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        
        if (savedUser && savedToken) {
          try {
            const parsedUser = JSON.parse(savedUser);
            const normalizedUser = normalizeUserWithRole(parsedUser);
            console.log('🔍 Found saved user:', normalizedUser.name);
            
            // Validate the token
            const isValid = await validateToken(savedToken);
            
            if (isValid) {
              setUser(normalizedUser as User);
              setToken(savedToken);
              console.log('✅ Authentication restored successfully');
              
              // Start authentication backup for future reloads
              AuthPreservation.startAuthBackup();

              if (parsedUser.role !== normalizedUser.role) {
                localStorage.setItem('user', JSON.stringify(normalizedUser));
              }
            } else {
              console.log('❌ Invalid token, clearing storage');
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              AuthPreservation.clearBackup();
            }
          } catch (error) {
            console.error('❌ Error parsing saved user data:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            AuthPreservation.clearBackup();
          }
        } else {
          // Try to restore from backup
          const backupAuth = AuthPreservation.restoreAuth();
          if (backupAuth) {
            console.log('🔍 Restoring authentication from backup');
            const normalizedUser = normalizeUserWithRole(backupAuth.user);
            setUser(normalizedUser as User);
            setToken(backupAuth.token);
            
            // Save to normal storage
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            localStorage.setItem('token', backupAuth.token);
            
            // Start authentication backup
            AuthPreservation.startAuthBackup();
          } else {
            console.log('ℹ️ No saved authentication found');
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (userData: User, authToken: string) => {
    const normalizedUser = normalizeUserWithRole(userData);
    console.log('✅ User logged in:', normalizedUser.name);
    setUser(normalizedUser);
    setToken(authToken);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      localStorage.setItem('token', authToken);
    }

    // Connect to socket with new token
    socketService.reconnectWithToken(authToken);

    // Request notification permission
    await requestNotificationPermission();
  };

  const logout = () => {
    console.log('👋 User logged out');
    setUser(null);
    setToken(null);
    
    apiService.logout().catch((error) => {
      console.warn('Failed to clear server session during logout:', error);
    });

    // Clear localStorage and backup
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      AuthPreservation.clearBackup();
      AuthPreservation.stopAuthBackup();
    }

    // Disconnect socket
    socketService.disconnect();
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log('🔄 Refreshing token...');
      
      if (typeof window === 'undefined') return false;
      
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.log('❌ No token to refresh');
        return false;
      }
      
      const isValid = await validateToken(currentToken);
      if (isValid) {
        console.log('✅ Token refreshed successfully');
        return true;
      } else {
        console.log('❌ Token refresh failed, logging out');
        logout();
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      logout();
      return false;
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) {
        return prev;
      }

      const merged = normalizeUserWithRole({ ...prev, ...updates }) as User;
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(merged));
      }

      return merged;
    });
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    token,
    loading,
    refreshToken,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to create a mock user session for testing
export const createMockEmployerSession = () => {
  const mockUser: User = {
    _id: 'mock-employer-123',
    name: 'Test Employer',
    email: 'employer@test.com',
    userType: 'employer',
    role: 'user',
    companyName: 'Test Company',
    company: 'Test Company'
  };
  
  const mockToken = 'mock-token-' + Date.now();
  
  localStorage.setItem('user', JSON.stringify(mockUser));
  localStorage.setItem('token', mockToken);
  
  return { user: mockUser, token: mockToken };
};

export default AuthContext;
