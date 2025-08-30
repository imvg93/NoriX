'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  userType: 'student' | 'employer' | 'admin';
  isVerified?: boolean;
  college?: string;
  skills?: string[];
  availability?: string;
  companyName?: string;
  businessType?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token and get user data
      validateToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      // Here you would typically make an API call to validate the token
      // For now, we'll just check if it exists
      if (token) {
        // Mock user data - replace with actual API call
        const mockUser: User = {
          _id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          userType: 'student',
          isVerified: true,
          college: 'Hyderabad University',
          skills: ['JavaScript', 'React', 'Node.js'],
          availability: 'Weekends, Evenings'
        };
        setUser(mockUser);
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Here you would make an API call to login
      // For now, we'll simulate a successful login
      const mockUser: User = {
        _id: '1',
        name: 'John Doe',
        email: email,
        userType: 'student',
        isVerified: true,
        college: 'Hyderabad University',
        skills: ['JavaScript', 'React', 'Node.js'],
        availability: 'Weekends, Evenings'
      };
      
      // Store token (mock)
      localStorage.setItem('token', 'mock-jwt-token');
      setUser(mockUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      // Here you would make an API call to register
      // For now, we'll simulate a successful registration
      const mockUser: User = {
        _id: '1',
        name: userData.name,
        email: userData.email,
        userType: userData.userType,
        isVerified: false,
        ...(userData.userType === 'student' && {
          college: userData.college,
          skills: userData.skills ? userData.skills.split(',').map((s: string) => s.trim()) : [],
          availability: userData.availability
        }),
        ...(userData.userType === 'employer' && {
          companyName: userData.companyName,
          businessType: userData.businessType,
          address: userData.address
        })
      };
      
      // Store token (mock)
      localStorage.setItem('token', 'mock-jwt-token');
      setUser(mockUser);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      // Here you would make an API call to update the profile
      // For now, we'll just update the local state
      if (user) {
        setUser({ ...user, ...userData });
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
