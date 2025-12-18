'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Eye, ExternalLink, GraduationCap, Building2, Store, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Role = 'student' | 'individual' | 'corporate' | 'local';

interface RoleOption {
  value: Role;
  label: string;
  icon: React.ReactNode;
  route: string;
  description: string;
}

const roleOptions: RoleOption[] = [
  {
    value: 'student',
    label: 'Student',
    icon: <GraduationCap className="w-4 h-4" />,
    route: '/student',
    description: 'View complete student page with dashboard and job listings'
  },
  {
    value: 'individual',
    label: 'Individual Employer',
    icon: <User className="w-4 h-4" />,
    route: '/employer',
    description: 'View complete individual employer dashboard'
  },
  {
    value: 'corporate',
    label: 'Corporate Employer',
    icon: <Building2 className="w-4 h-4" />,
    route: '/employer',
    description: 'View complete corporate employer dashboard'
  },
  {
    value: 'local',
    label: 'Local Business',
    icon: <Store className="w-4 h-4" />,
    route: '/employer',
    description: 'View complete local business dashboard'
  },
];

export default function RoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, login } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = async (role: RoleOption) => {
    setSwitching(true);
    setSelectedRole(role.value);
    setIsOpen(false);
    
    try {
      // Call API to switch role in database
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (token) {
        const response = await fetch(`${API_URL}/auth/switch-role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role: role.value })
        });

        if (response.ok) {
          const data = await response.json();
          const responseData = data.data || data;
          
          // Update token in storage
          if (responseData.token) {
            localStorage.setItem('token', responseData.token);
            sessionStorage.setItem('token', responseData.token);
          }

          // Update user in auth context
          if (responseData.user && login) {
            // Map the user data to match the User interface
            const updatedUser = {
              _id: responseData.user._id,
              name: responseData.user.name,
              email: responseData.user.email,
              phone: responseData.user.phone,
              userType: responseData.user.role === 'student' ? 'student' : 'employer',
              role: 'admin' as const,
              companyName: responseData.user.companyName,
              employerCategory: responseData.user.role === 'individual' ? 'individual' : 
                               responseData.user.role === 'corporate' ? 'corporate' : 
                               responseData.user.role === 'local' ? 'local_business' : undefined,
              isActive: responseData.user.isActive,
              emailVerified: responseData.user.emailVerified,
              kycStatus: responseData.user.kycStatus,
              college: responseData.user.college,
              skills: responseData.user.skills,
              availability: responseData.user.availability,
              businessType: responseData.user.businessType,
              address: responseData.user.address,
              onboardingCompleted: responseData.user.onboardingCompleted
            };
            
            login(updatedUser as any, responseData.token);
          }

          console.log('✅ Role switched successfully:', role.value);
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to switch role:', errorText);
          alert('Failed to switch role. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Error switching role:', error);
      alert('Error switching role. Please try again.');
    } finally {
      setSwitching(false);
    }
    
    // Store selected role in localStorage for persistence
    localStorage.setItem('adminPreviewRole', role.value);
    
    // Always open in new tab with updated role
    window.open(role.route, '_blank');
  };

  // Load persisted role on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('adminPreviewRole') as Role | null;
    if (savedRole && roleOptions.some(opt => opt.value === savedRole)) {
      setSelectedRole(savedRole);
    }
  }, []);

  const selectedOption = selectedRole 
    ? roleOptions.find(opt => opt.value === selectedRole)
    : null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Role Switcher"
      >
        <Eye className="w-4 h-4" />
        <span className="text-sm font-medium">
          {switching ? 'Switching...' : (selectedOption ? `View as ${selectedOption.label}` : 'View as Role')}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-2 bg-indigo-50 border-b border-indigo-100">
            <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">
              Preview Role Views
            </p>
            <p className="text-xs text-indigo-700 mt-1">
              Click to open complete page in new tab
            </p>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {roleOptions.map((role) => (
              <div
                key={role.value}
                className="group"
              >
                <div
                  onClick={() => handleRoleSelect(role)}
                  className="flex items-start gap-3 p-3 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className={`mt-0.5 ${role.value === selectedRole ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}`}>
                    {role.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {role.label}
                      </p>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {role.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              💡 All pages open in new tabs automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

