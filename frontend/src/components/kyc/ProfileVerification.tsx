"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  GraduationCap, 
  Home, 
  Upload,
  Heart, 
  Briefcase, 
  CreditCard,
  CheckCircle,
  AlertCircle,
  Save,
  ArrowRight,
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  HelpCircle,
  Info,
  X
} from 'lucide-react';

import {
  KYCInput,
  KYCTextarea,
  KYCSelect,
  KYCDatePicker,
  // KYCFileUpload, // Removed - no longer used
  KYCChips,
  KYCRadioGroup,
  KYCCheckbox,
  KYCProgressBar,
  KYCHelpTooltip
} from './KYCFormComponents';
import ThemeToggle from './ThemeToggle';
import SuccessAnimation from './SuccessAnimation';
import DocumentUpload from './DocumentUpload';
import { kycService, type KYCProfileData } from '../../services/kycService';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Types
interface ProfileData {
  // Basic Info
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  
  // Academic Info
  college: string;
  courseYear: string;
  
  // Stay & Availability
  stayType: string;
  pgName: string;
  pgAddress: string;
  pgContact: string;
  hoursPerWeek: number;
  availableDays: string[];
  
  // Document Uploads
  aadharCard?: string;
  collegeIdCard?: string;
  
  // Emergency & Health
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodGroup: string;
  
  // Work Preferences
  preferredJobTypes: string[];
  experienceSkills: string;
  
  // Payroll (conditional)
  bankConsent: boolean;
  bankAccount: string;
  confirmBankAccount: string;
  ifsc: string;
  beneficiaryName: string;
}

interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  required: boolean;
}

interface ProfileVerificationProps {
  isDisabled?: boolean;
  onFormSubmitted?: () => void;
}

const ProfileVerification: React.FC<ProfileVerificationProps> = ({ isDisabled = false, onFormSubmitted }) => {
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<ProfileData>({
    fullName: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    college: '',
    courseYear: '',
    stayType: '',
    pgName: '',
    pgAddress: '',
    pgContact: '',
    hoursPerWeek: 20,
    availableDays: [],
    aadharCard: '',
    collegeIdCard: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: '',
    preferredJobTypes: [],
    experienceSkills: '',
    bankConsent: false,
    bankAccount: '',
    confirmBankAccount: '',
    ifsc: '',
    beneficiaryName: ''
  });

  const [errors, setErrors] = useState<Partial<ProfileData>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDummyData, setShowDummyData] = useState(false);

  // Fill dummy data for testing
  const fillDummyData = () => {
    const dummyDataSets = [
      {
        fullName: 'Rajesh Kumar',
        dob: '2000-05-15',
        gender: 'male',
        phone: '+1 234 567 8900',
        email: 'rajesh.kumar@example.com',
        address: '123 Main Street, Sector 5, Hyderabad, Telangana 500001',
             college: 'Osmania University',
             courseYear: 'B.Tech 3rd Year',
        stayType: 'pg',
        pgName: 'Green Valley PG',
        pgAddress: '456 Park Avenue, Near Metro Station, Hyderabad',
        pgContact: '+1 234 567 8901',
        hoursPerWeek: 25,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        // govtIdType: 'aadhaar',
        // govtIdFiles: [],
        // photoFile: [],
        emergencyContactName: 'Suresh Kumar',
        emergencyContactPhone: '+1 234 567 8902',
        bloodGroup: 'O+',
        preferredJobTypes: ['warehouse', 'delivery', 'housekeeping'],
        experienceSkills: 'Previous experience in warehouse work and delivery services. Good communication skills and reliable.',
        bankConsent: true,
        bankAccount: '1234567890123456',
        confirmBankAccount: '1234567890123456',
        ifsc: 'SBIN0001234',
        beneficiaryName: 'Rajesh Kumar'
      },
      {
        fullName: 'Priya Sharma',
        dob: '2001-08-22',
        gender: 'female',
        phone: '+1 234 567 8903',
        email: 'priya.sharma@example.com',
        address: '789 Tech Park Road, HITEC City, Hyderabad, Telangana 500081',
             college: 'JNTU Hyderabad',
             courseYear: 'B.Com 2nd Year',
        stayType: 'home',
        pgName: '',
        pgAddress: '',
        pgContact: '',
        hoursPerWeek: 15,
        availableDays: ['saturday', 'sunday'],
        // govtIdType: 'passport',
        // govtIdFiles: [],
        // photoFile: [],
        emergencyContactName: 'Ravi Sharma',
        emergencyContactPhone: '+1 234 567 8904',
        bloodGroup: 'A+',
        preferredJobTypes: ['retail', 'data-entry'],
        experienceSkills: 'Good at data entry and customer service. Fluent in English and Hindi.',
        bankConsent: false,
        bankAccount: '',
        confirmBankAccount: '',
        ifsc: '',
        beneficiaryName: ''
      }
    ];

    // Randomly select one dummy dataset
    const randomData = dummyDataSets[Math.floor(Math.random() * dummyDataSets.length)];
    setFormData(randomData);
    setShowDummyData(true);
  };

  // Clear dummy data
  const clearDummyData = () => {
    setFormData({
      fullName: '',
      dob: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      college: '',
      courseYear: '',
      stayType: '',
      pgName: '',
      pgAddress: '',
      pgContact: '',
      hoursPerWeek: 20,
      availableDays: [],
      // govtIdType: '',
      // govtIdFiles: [],
      // photoFile: [],
      emergencyContactName: '',
      emergencyContactPhone: '',
      bloodGroup: '',
      preferredJobTypes: [],
      experienceSkills: '',
      bankConsent: false,
      bankAccount: '',
      confirmBankAccount: '',
      ifsc: '',
      beneficiaryName: ''
    });
    setShowDummyData(false);
  };

  // Back navigation handler
  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to home page if no history
      window.location.href = '/';
    }
  };

  // Sections configuration - Document Upload moved to last position
  const sections: Section[] = [
    { id: 'basic', title: 'Basic Information', icon: User, completed: false, required: true },
    { id: 'academic', title: 'Academic Details', icon: GraduationCap, completed: false, required: true },
    { id: 'stay', title: 'Stay & Availability', icon: Home, completed: false, required: true },
    { id: 'emergency', title: 'Emergency Contact', icon: Heart, completed: false, required: true },
    { id: 'preferences', title: 'Work Preferences', icon: Briefcase, completed: false, required: false },
    { id: 'payroll', title: 'Payroll Details', icon: CreditCard, completed: false, required: false },
    { id: 'documents', title: 'Documents Upload', icon: Upload, completed: false, required: true }
  ];

  // Options
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  const stayTypeOptions = [
    { value: 'home', label: 'At Home', description: 'Living with family' },
    { value: 'pg', label: 'In a PG', description: 'Paying Guest accommodation' }
  ];

  const jobTypeOptions = [
    { value: 'warehouse', label: 'Warehouse Work' },
    { value: 'delivery', label: 'Delivery Driver' },
    { value: 'housekeeping', label: 'Housekeeping' },
    { value: 'construction', label: 'Construction' },
    { value: 'kitchen', label: 'Kitchen Helper' },
    { value: 'retail', label: 'Retail Sales' },
    { value: 'security', label: 'Security Guard' },
    { value: 'data-entry', label: 'Data Entry' }
  ];

  const dayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  // const govtIdOptions = [ // Removed - no longer used
  //   { value: 'aadhaar', label: 'Aadhaar Card' },
  //   { value: 'passport', label: 'Passport' },
  //   { value: 'voter-id', label: 'Voter ID' },
  //   { value: 'driving-license', label: 'Driving License' }
  // ];

  const bloodGroupOptions = [
    { value: '', label: 'Select Blood Group' },
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  // Auto-save functionality (silent)
  const autoSave = useCallback(async () => {
    try {
      // Convert form data to API format
      const apiData: Partial<KYCProfileData> = {
        fullName: formData.fullName,
        dob: formData.dob,
        gender: formData.gender || undefined,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        college: formData.college,
        courseYear: formData.courseYear,
        stayType: formData.stayType as 'home' | 'pg',
        pgDetails: formData.stayType === 'pg' ? {
          name: formData.pgName,
          address: formData.pgAddress,
          contact: formData.pgContact
        } : undefined,
        hoursPerWeek: formData.hoursPerWeek,
        availableDays: formData.availableDays,
        // govtIdType: formData.govtIdType as any,
        // govtIdFiles: formData.govtIdFiles.filter(f => typeof f === 'string'), // Only save URLs, not File objects
        // photoFile: typeof formData.photoFile[0] === 'string' ? formData.photoFile[0] : '',
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone
        },
        bloodGroup: formData.bloodGroup || undefined,
        preferredJobTypes: formData.preferredJobTypes,
        experienceSkills: formData.experienceSkills || undefined,
        payroll: formData.bankConsent ? {
          consent: true,
          bankAccount: formData.bankAccount,
          ifsc: formData.ifsc,
          beneficiaryName: formData.beneficiaryName
        } : undefined
      };

      await kycService.saveProfile(apiData);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [formData]);

  // Load existing KYC data
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const response = await kycService.getProfile();
        if (response.data.kyc) {
          const kyc = response.data.kyc;
          setFormData({
            fullName: kyc.fullName || '',
            dob: kyc.dob ? new Date(kyc.dob).toISOString().split('T')[0] : '',
            gender: kyc.gender || '',
            phone: kyc.phone || '',
            email: kyc.email || '',
            address: kyc.address || '',
            college: kyc.college || '',
            courseYear: kyc.courseYear || '',
            stayType: kyc.stayType || '',
            pgName: kyc.pgDetails?.name || '',
            pgAddress: kyc.pgDetails?.address || '',
            pgContact: kyc.pgDetails?.contact || '',
            hoursPerWeek: kyc.hoursPerWeek || 20,
            availableDays: kyc.availableDays || [],
            // govtIdType: kyc.govtIdType || '',
            // govtIdFiles: kyc.govtIdFiles || [],
            // photoFile: kyc.photoFile ? [kyc.photoFile] : [],
            emergencyContactName: kyc.emergencyContact?.name || '',
            emergencyContactPhone: kyc.emergencyContact?.phone || '',
            bloodGroup: kyc.bloodGroup || '',
            preferredJobTypes: kyc.preferredJobTypes || [],
            experienceSkills: kyc.experienceSkills || '',
            bankConsent: kyc.payroll?.consent || false,
            bankAccount: kyc.payroll?.bankAccount || '',
            confirmBankAccount: kyc.payroll?.bankAccount || '',
            ifsc: kyc.payroll?.ifsc || '',
            beneficiaryName: kyc.payroll?.beneficiaryName || ''
          });
        }
      } catch (error) {
        console.log('No existing KYC data found');
      }
    };

    loadExistingData();
  }, []);

  // Keyboard shortcut for testing (Ctrl/Cmd + D)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        if (showDummyData) {
          clearDummyData();
        } else {
          fillDummyData();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDummyData]);

  // Auto-save on form changes (silent)
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave();
    }, 1500); // Slightly faster auto-save

    return () => clearTimeout(timer);
  }, [formData, autoSave]);

  // Validation functions
  const validateField = (name: keyof ProfileData, value: any): string => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Please enter your full name';
        if (/\d/.test(value)) return 'Name should not contain numbers';
        if (value.trim().length < 2) return 'Name must be at least 2 characters long';
        return '';
      
      case 'dob':
        if (!value) return 'Please select your date of birth';
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        if (age < 16) return 'You must be at least 16 years old to register';
        if (age > 100) return 'Please enter a valid date of birth';
        return '';
      
      case 'phone':
        if (!value) return 'Please enter your phone number';
        // More flexible phone validation - accepts international formats
        const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
        if (!/^(\+?[1-9]\d{1,14})$/.test(cleanPhone)) {
          return 'Please enter a valid phone number (e.g., +1 234 567 8900 or 9876543210)';
        }
        if (cleanPhone.length < 10 || cleanPhone.length > 15) {
          return 'Phone number should be between 10-15 digits';
        }
        return '';
      
      case 'email':
        if (!value) return 'Please enter your email address';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address (e.g., user@example.com)';
        }
        return '';
      
      case 'address':
        if (!value.trim()) return 'Please enter your complete address';
        if (value.trim().length < 10) return 'Please provide a more detailed address';
        return '';
      
      case 'college':
        if (!value.trim()) return 'Please enter your college/university name';
        if (value.trim().length < 3) return 'Please enter a valid college/university name';
        return '';
      
      case 'courseYear':
        if (!value.trim()) return 'Please enter your course and year (e.g., B.Tech 3rd Year)';
        return '';
      
      case 'stayType':
        if (!value) return 'Please select where you are staying';
        return '';
      
      case 'hoursPerWeek':
        if (!value || value < 1) return 'Please enter how many hours you can work per week';
        if (value > 40) return 'Maximum 40 hours per week allowed';
        return '';
      
      case 'availableDays':
        if (!value || value.length === 0) return 'Please select at least one day you are available';
        return '';
      
      case 'emergencyContactName':
        if (!value.trim()) return 'Please enter emergency contact name';
        if (value.trim().length < 2) return 'Please enter a valid name';
        return '';
      
      case 'emergencyContactPhone':
        if (!value) return 'Please enter emergency contact phone number';
        // More flexible phone validation - accepts international formats
        const cleanEmergencyPhone = value.replace(/[\s\-\(\)]/g, '');
        if (!/^(\+?[1-9]\d{1,14})$/.test(cleanEmergencyPhone)) {
          return 'Please enter a valid phone number (e.g., +1 234 567 8900 or 9876543210)';
        }
        if (cleanEmergencyPhone.length < 10 || cleanEmergencyPhone.length > 15) {
          return 'Phone number should be between 10-15 digits';
        }
        return '';
      
      case 'bloodGroup':
        if (!value) return 'Please select your blood group';
        return '';
      
      case 'preferredJobTypes':
        if (!value || value.length === 0) return 'Please select at least one job type you are interested in';
        return '';
      
      case 'bankAccount':
        if (!value) return 'Please enter your bank account number';
        if (!/^\d{9,18}$/.test(value.replace(/\s/g, ''))) {
          return 'Please enter a valid bank account number (9-18 digits)';
        }
        return '';
      
      case 'confirmBankAccount':
        if (!value) return 'Please confirm your bank account number';
        if (value !== formData.bankAccount) return 'Bank account numbers do not match';
        return '';
      
      case 'ifsc':
        if (!value) return 'Please enter your IFSC code';
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.toUpperCase())) {
          return 'Please enter a valid IFSC code (e.g., SBIN0001234)';
        }
        return '';
      
      case 'beneficiaryName':
        if (!value.trim()) return 'Please enter the beneficiary name';
        if (value.trim().length < 2) return 'Please enter a valid beneficiary name';
        return '';
      
      // case 'govtIdType': // Removed - no longer used
      //   if (!value) return 'Please select a government ID type';
      //   return '';
      
      // case 'govtIdFiles':
      //   if (!value || value.length === 0) return 'Please upload your government ID';
      //   return '';
      
      // case 'photoFile':
      //   if (!value || value.length === 0) return 'Please upload your passport photo';
      //   return '';
      
      case 'emergencyContactName':
        if (!value.trim()) return 'Emergency contact name is required';
        return '';
      
      case 'emergencyContactPhone':
        if (!value) return 'Emergency contact phone is required';
        if (!/^\+?[\d\s-()]+$/.test(value)) return 'Invalid phone number format';
        return '';
      
      case 'bankAccount':
        if (formData.bankConsent && !value) return 'Bank account number is required';
        if (value && !/^\d+$/.test(value)) return 'Account number should contain only digits';
        return '';
      
      case 'confirmBankAccount':
        if (formData.bankConsent && !value) return 'Please confirm your bank account number';
        if (value !== formData.bankAccount) return 'Account numbers do not match';
        return '';
      
      case 'ifsc':
        if (formData.bankConsent && !value) return 'IFSC code is required';
        if (value && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) return 'Invalid IFSC code format';
        return '';
      
      default:
        return '';
    }
  };

  const validateSection = (sectionId: string): boolean => {
    const sectionErrors: Record<string, string> = {};
    let isValid = true;

    switch (sectionId) {
      case 'basic':
        ['fullName', 'dob', 'phone', 'email', 'address'].forEach(field => {
          const error = validateField(field as keyof ProfileData, formData[field as keyof ProfileData]);
          if (error) {
            sectionErrors[field as keyof ProfileData] = error;
            isValid = false;
          }
        });
        break;
      
      case 'academic':
        ['college', 'courseYear'].forEach(field => {
          const error = validateField(field as keyof ProfileData, formData[field as keyof ProfileData]);
          if (error) {
            sectionErrors[field as keyof ProfileData] = error;
            isValid = false;
          }
        });
        break;
      
      case 'stay':
        ['stayType', 'hoursPerWeek'].forEach(field => {
          const error = validateField(field as keyof ProfileData, formData[field as keyof ProfileData]);
          if (error) {
            sectionErrors[field as keyof ProfileData] = error;
            isValid = false;
          }
        });
        if (formData.stayType === 'pg') {
          ['pgName', 'pgAddress', 'pgContact'].forEach(field => {
            const error = validateField(field as keyof ProfileData, formData[field as keyof ProfileData]);
            if (error) {
              sectionErrors[field as keyof ProfileData] = error;
              isValid = false;
            }
          });
        }
        break;
      
      case 'documents':
        // Documents are optional but if provided, they should be valid URLs
        if (formData.aadharCard && !formData.aadharCard.startsWith('http')) {
          sectionErrors.aadharCard = 'Invalid Aadhaar card URL';
          isValid = false;
        }
        if (formData.collegeIdCard && !formData.collegeIdCard.startsWith('http')) {
          sectionErrors.collegeIdCard = 'Invalid College ID card URL';
          isValid = false;
        }
        break;
      
      case 'emergency':
        ['emergencyContactName', 'emergencyContactPhone'].forEach(field => {
          const error = validateField(field as keyof ProfileData, formData[field as keyof ProfileData]);
          if (error) {
            sectionErrors[field as keyof ProfileData] = error;
            isValid = false;
          }
        });
        break;
      
      case 'payroll':
        if (formData.bankConsent) {
          ['bankAccount', 'confirmBankAccount', 'ifsc', 'beneficiaryName'].forEach(field => {
            const error = validateField(field as keyof ProfileData, formData[field as keyof ProfileData]);
            if (error) {
              sectionErrors[field as keyof ProfileData] = error;
              isValid = false;
            }
          });
        }
        break;
    }

    setErrors(prev => ({ ...prev, ...sectionErrors }));
    return isValid;
  };

  // Update form data
  const updateField = (field: keyof ProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Navigation
  const goToNextSection = () => {
    if (validateSection(sections[currentSection].id)) {
      setCurrentSection(prev => Math.min(prev + 1, sections.length - 1));
    }
  };

  const goToPreviousSection = () => {
    setCurrentSection(prev => Math.max(prev - 1, 0));
  };

  const goToSection = (index: number) => {
    if (index <= currentSection || sections[index].completed) {
      setCurrentSection(index);
    }
  };

  // Test function for debugging
  const testKYCConnection = async () => {
    try {
      // First check if user is authenticated
      const token = localStorage.getItem('token');
      console.log('Auth token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        alert('No authentication token found. Please login first.');
        return;
      }

      // Test basic API connectivity
      const testResponse = await apiService.testConnection();
      console.log('Basic API test:', testResponse);
      
      // Test KYC specific endpoint
      const response = await kycService.getProfile();
      console.log('KYC connection test successful:', response);
      alert('KYC connection working!');
    } catch (error) {
      console.error('KYC connection test failed:', error);
      console.error('Error details:', {
        message: (error as any).message,
        status: (error as any).status,
        details: (error as any).details
      });
      alert(`KYC connection failed: ${(error as any).message}`);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Validate all sections
    let allValid = true;
    sections.forEach(section => {
      if (section.required && !validateSection(section.id)) {
        allValid = false;
      }
    });

    if (!allValid) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Transform form data to match backend schema
      const kycData = {
        // Basic Information
        fullName: formData.fullName,
        dob: formData.dob, // Keep as string for API
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        
        // Academic Information
        college: formData.college,
        courseYear: formData.courseYear,
        
        // Stay & Availability
        stayType: formData.stayType,
        pgDetails: formData.stayType === 'pg' ? {
          name: formData.pgName,
          address: formData.pgAddress,
          contact: formData.pgContact
        } : undefined,
        hoursPerWeek: formData.hoursPerWeek,
        availableDays: formData.availableDays,
        
        // Verification Documents (Removed)
        // govtIdType: formData.govtIdType,
        // govtIdFiles: formData.govtIdFiles, // Will be updated with URLs after upload
        // photoFile: formData.photoFile[0] || '', // Single file URL
        
        // Emergency Contact
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone
        },
        bloodGroup: formData.bloodGroup,
        
        // Work Preferences
        preferredJobTypes: formData.preferredJobTypes,
        experienceSkills: formData.experienceSkills,
        
        // Payroll Information
        payroll: formData.bankConsent ? {
          consent: true,
          bankAccount: formData.bankAccount,
          ifsc: formData.ifsc,
          beneficiaryName: formData.beneficiaryName
        } : {
          consent: false
        }
      };

      // File uploads removed - no longer needed
      // const govtIdFiles = formData.govtIdFiles.filter(f => f instanceof File);
      // const photoFiles = formData.photoFile.filter(f => f instanceof File);
      
      // console.log('File upload debug:', {
      //   govtIdFiles: govtIdFiles.length,
      //   photoFiles: photoFiles.length,
      //   govtIdFilesData: formData.govtIdFiles,
      //   photoFilesData: formData.photoFile
      // });
      
      // // Only upload if there are actual File objects
      // if (govtIdFiles.length > 0 || photoFiles.length > 0) {
      //   const filesToUpload = [...govtIdFiles, ...photoFiles];
      //   console.log('Uploading files:', filesToUpload.map(f => f.name));
      //   
      //   try {
      //     const uploadResponse = await kycService.uploadFiles(filesToUpload);
      //     console.log('Upload response:', uploadResponse);
      //     
      //     // Update KYC data with uploaded file URLs
      //     const govtIdUrls = uploadResponse.data.files.slice(0, govtIdFiles.length);
      //     const photoUrl = uploadResponse.data.files[govtIdFiles.length];
      //     
      //     // Combine existing URLs with new ones
      //     const existingGovtIdUrls = formData.govtIdFiles.filter(f => typeof f === 'string');
      //     kycData.govtIdFiles = [...existingGovtIdUrls, ...govtIdUrls];
      //     kycData.photoFile = photoUrl;
      //   } catch (uploadError) {
      //     console.error('File upload failed:', uploadError);
      //     throw new Error(`File upload failed: ${uploadError.message}`);
      //   }
      // } else {
      //   // Use existing URLs if no new files to upload
      //   kycData.govtIdFiles = formData.govtIdFiles.filter(f => typeof f === 'string');
      //   kycData.photoFile = formData.photoFile.find(f => typeof f === 'string') || '';
      //   console.log('No files to upload, using existing URLs:', {
      //     govtIdFiles: kycData.govtIdFiles,
      //     photoFile: kycData.photoFile
      //   });
      // }

      // Save the complete KYC profile
      await kycService.saveProfile(kycData);
      
      // Submit for verification
      await kycService.submitProfile();
      
      // Show success animation
      setShowSuccess(true);
      
      // Call the callback to notify parent component
      if (onFormSubmitted) {
        setTimeout(() => {
          onFormSubmitted();
        }, 2000); // Wait for success animation to complete
      }
    } catch (error: any) {
      console.error('Submission failed:', error);
      alert(`Failed to submit: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render section content
  const renderSection = () => {
    const section = sections[currentSection];
    
    switch (section.id) {
      case 'basic':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="kyc-section-header">
              <User className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="kyc-section-title">Basic Information</h2>
                <p className="kyc-section-subtitle">Tell us about yourself</p>
              </div>
            </div>

            <div className="kyc-form-row kyc-form-row--2">
              <KYCInput
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={(value) => updateField('fullName', value)}
                placeholder="Enter your full name as per official records"
                required
                error={errors.fullName}
                help="Use the same name as on your government ID"
                disabled={isDisabled}
              />
              
              <KYCDatePicker
                label="Date of Birth"
                name="dob"
                value={formData.dob}
                onChange={(value) => updateField('dob', value)}
                required
                error={errors.dob}
                maxDate={new Date().toISOString().split('T')[0]}
                help="You must be at least 16 years old"
              />
            </div>

            <div className="kyc-form-row kyc-form-row--2">
              <KYCSelect
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={(value) => updateField('gender', value)}
                options={genderOptions}
                placeholder="Select gender"
                help="Optional field"
              />
              
              <KYCInput
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(value) => updateField('phone', value)}
                placeholder="+1 234 567 8900"
                required
                error={errors.phone}
                help="Include country code (e.g., +1 for US, +91 for India)"
              />
            </div>

            <KYCInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={(value) => updateField('email', value)}
              placeholder="your.email@example.com"
              required
              error={errors.email}
              help="We'll use this for important updates"
            />

            <KYCTextarea
              label="Current Address"
              name="address"
              value={formData.address}
              onChange={(value) => updateField('address', value)}
              placeholder="Enter your complete current address"
              required
              error={errors.address}
              rows={3}
              help="Include house number, street, city, state, and PIN code"
            />
          </motion.div>
        );

      case 'academic':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="kyc-section-header">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <div>
                <h2 className="kyc-section-title">Academic Details</h2>
                <p className="kyc-section-subtitle">Your educational background</p>
              </div>
            </div>

            <KYCInput
              label="College/University"
              name="college"
              value={formData.college}
              onChange={(value) => updateField('college', value)}
              placeholder="Enter your college or university name"
              required
              error={errors.college}
            />

            <div className="kyc-form-row kyc-form-row--2">
              <KYCInput
                label="Course & Year"
                name="courseYear"
                value={formData.courseYear}
                onChange={(value) => updateField('courseYear', value)}
                placeholder="e.g., B.Tech 3rd Year"
                required
                error={errors.courseYear}
                help="e.g., B.Tech 3rd Year, B.Com 2nd Year"
              />
              
            </div>
          </motion.div>
        );

      case 'stay':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="kyc-section-header">
              <Home className="w-4 h-4 text-blue-600" />
              <div>
                <h2 className="kyc-section-title">Stay & Availability</h2>
                <p className="kyc-section-subtitle">Where you're staying and your availability</p>
              </div>
            </div>

            <KYCRadioGroup
              label="Where are you staying?"
              name="stayType"
              value={formData.stayType}
              onChange={(value) => updateField('stayType', value)}
              options={stayTypeOptions}
              required
              error={errors.stayType}
            />

            <AnimatePresence>
              {formData.stayType === 'pg' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 p-4 bg-gray-50 rounded-lg"
                >
                  <h3 className="kyc-h3">PG Details</h3>
                  
                  <KYCInput
                    label="PG Name"
                    name="pgName"
                    value={formData.pgName}
                    onChange={(value) => updateField('pgName', value)}
                    placeholder="Enter PG name"
                    required
                    error={errors.pgName}
                  />
                  
                  <KYCTextarea
                    label="PG Address"
                    name="pgAddress"
                    value={formData.pgAddress}
                    onChange={(value) => updateField('pgAddress', value)}
                    placeholder="Enter PG address"
                    required
                    error={errors.pgAddress}
                    rows={2}
                  />
                  
                  <KYCInput
                    label="PG Contact Number"
                    name="pgContact"
                    type="tel"
                    value={formData.pgContact}
                    onChange={(value) => updateField('pgContact', value)}
                    placeholder="PG contact number"
                    required
                    error={errors.pgContact}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div>
                <label className="kyc-label kyc-label--required">
                  Hours per week available
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={formData.hoursPerWeek}
                    onChange={(e) => updateField('hoursPerWeek', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="kyc-body font-medium min-w-[3rem] text-center">
                    {formData.hoursPerWeek}h
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 hours</span>
                  <span>40 hours</span>
                </div>
              </div>

              <KYCChips
                label="Available Days"
                name="availableDays"
                value={formData.availableDays}
                onChange={(value) => updateField('availableDays', value)}
                options={dayOptions}
                help="Select all days you're available"
                maxSelections={7}
              />
            </div>
          </motion.div>
        );

      case 'emergency':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="kyc-section-header">
              <Heart className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="kyc-section-title">Emergency Contact</h2>
                <p className="kyc-section-subtitle">Someone we can contact in case of emergency</p>
              </div>
            </div>

            <div className="kyc-form-row kyc-form-row--2">
              <KYCInput
                label="Emergency Contact Name"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(value) => updateField('emergencyContactName', value)}
                placeholder="Enter contact person's name"
                required
                error={errors.emergencyContactName}
              />
              
              <KYCInput
                label="Emergency Contact Phone"
                name="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(value) => updateField('emergencyContactPhone', value)}
                placeholder="+1 234 567 8900"
                required
                error={errors.emergencyContactPhone}
              />
            </div>

            <KYCSelect
              label="Blood Group"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={(value) => updateField('bloodGroup', value)}
              options={bloodGroupOptions}
              placeholder="Select blood group"
              help="Optional - helps in medical emergencies"
            />
          </motion.div>
        );

      case 'preferences':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="kyc-section-header">
              <Briefcase className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="kyc-section-title">Work Preferences</h2>
                <p className="kyc-section-subtitle">Tell us about your work preferences and skills</p>
              </div>
            </div>

            <KYCChips
              label="Preferred Job Types"
              name="preferredJobTypes"
              value={formData.preferredJobTypes}
              onChange={(value) => updateField('preferredJobTypes', value)}
              options={jobTypeOptions}
              help="Select job types you're interested in"
              maxSelections={5}
            />

            <KYCTextarea
              label="Experience & Skills"
              name="experienceSkills"
              value={formData.experienceSkills}
              onChange={(value) => updateField('experienceSkills', value)}
              placeholder="Briefly describe your relevant experience and skills..."
              rows={4}
              maxLength={500}
              help="Optional - helps us match you with better opportunities"
            />
          </motion.div>
        );

      case 'payroll':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="kyc-section-header">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="kyc-section-title">Payroll Details</h2>
                <p className="kyc-section-subtitle">Bank account details for salary payments</p>
              </div>
            </div>

            <KYCCheckbox
              label="I consent to provide bank details for salary payments"
              name="bankConsent"
              checked={formData.bankConsent}
              onChange={(checked) => updateField('bankConsent', checked)}
              description="We will only collect bank details after you're selected for a job"
              required
            />

            <AnimatePresence>
              {formData.bankConsent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="kyc-form-row kyc-form-row--2">
                    <KYCInput
                      label="Bank Account Number"
                      name="bankAccount"
                      type="text"
                      value={formData.bankAccount}
                      onChange={(value) => updateField('bankAccount', value)}
                      placeholder="Enter account number"
                      required
                      error={errors.bankAccount}
                      help="Account number only (no spaces or special characters)"
                    />
                    
                    <KYCInput
                      label="Confirm Account Number"
                      name="confirmBankAccount"
                      type="text"
                      value={formData.confirmBankAccount}
                      onChange={(value) => updateField('confirmBankAccount', value)}
                      placeholder="Re-enter account number"
                      required
                      error={errors.confirmBankAccount}
                    />
                  </div>

                  <div className="kyc-form-row kyc-form-row--2">
                    <div>
                      <KYCHelpTooltip content="IFSC is an 11-character code that identifies your bank branch. You can find it on your bank statement or passbook.">
                        <label className="kyc-label kyc-label--required">
                          IFSC Code
                        </label>
                      </KYCHelpTooltip>
                      <input
                        type="text"
                        value={formData.ifsc}
                        onChange={(e) => updateField('ifsc', e.target.value.toUpperCase())}
                        placeholder="e.g., SBIN0001234"
                        className={`kyc-input ${errors.ifsc ? 'kyc-input--error' : ''}`}
                        maxLength={11}
                        required
                      />
                      {errors.ifsc && (
                        <div className="kyc-error">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.ifsc}</span>
                        </div>
                      )}
                    </div>
                    
                    <KYCInput
                      label="Beneficiary Name"
                      name="beneficiaryName"
                      value={formData.beneficiaryName}
                      onChange={(value) => updateField('beneficiaryName', value)}
                      placeholder="Account holder name"
                      required
                      error={errors.beneficiaryName}
                      help="Name as per bank records"
                    />
                  </div>

                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <p className="kyc-xs text-yellow-800">
                        <strong>Note:</strong> Bank details are collected only after job selection and consent. 
                        We use secure encryption for all financial data.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );

      case 'documents':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="kyc-section-header">
              <Upload className="w-4 h-4 text-blue-600" />
              <div>
                <h2 className="kyc-section-title">Documents Upload</h2>
                <p className="kyc-section-subtitle">Upload your Aadhaar card and College ID for verification</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DocumentUpload
                documentType="aadhar"
                label="Aadhaar Card"
                description="Upload a clear photo of your Aadhaar card (front side)"
                currentUrl={formData.aadharCard}
                onUpload={(url) => updateField('aadharCard', url)}
                onDelete={() => updateField('aadharCard', '')}
              />

              <DocumentUpload
                documentType="college-id"
                label="College ID Card"
                description="Upload a clear photo of your College ID card"
                currentUrl={formData.collegeIdCard}
                onUpload={(url) => updateField('collegeIdCard', url)}
                onDelete={() => updateField('collegeIdCard', '')}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Document Upload Guidelines:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Ensure documents are clear and readable</li>
                    <li>• Supported formats: JPG, PNG, GIF (max 5MB)</li>
                    <li>• Documents are stored securely and privately</li>
                    <li>• You can replace documents anytime before submission</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isDisabled && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
            <div className="text-green-600 text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">KYC Already Completed</h3>
            <p className="text-gray-600 mb-4">Your KYC verification has already been submitted and approved.</p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
      
      <div className={`${isDisabled ? 'pointer-events-none opacity-50' : ''}`}>
      {/* Theme Toggle */}
      <ThemeToggle />
      
      {/* Success Animation */}
      <SuccessAnimation 
        isVisible={showSuccess} 
        onComplete={() => setShowSuccess(false)} 
      />
      
      {/* Mobile Floating Back Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={handleBackNavigation}
          className="kyc-back-button-mobile flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="kyc-container">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackNavigation}
                className="kyc-back-button flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              
              <div>
                <h1 className="kyc-h1">Profile Verification</h1>
                <p className="kyc-text-muted">Complete your profile to start applying for jobs</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Test Connection Button */}
              <button
                onClick={testKYCConnection}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors border border-blue-300"
                title="Test KYC connection"
              >
                <span className="text-xs">🔗</span>
                <span className="hidden sm:inline">Test</span>
              </button>
              
              {/* Dummy Data Button for Testing */}
              <div className="flex items-center gap-1">
                {!showDummyData ? (
                  <button
                    onClick={fillDummyData}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors border border-yellow-300"
                    title="Fill with dummy data for testing"
                  >
                    <span className="text-xs">🧪</span>
                    <span className="hidden sm:inline">Fill Data</span>
                  </button>
                ) : (
                  <button
                    onClick={clearDummyData}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors border border-red-300"
                    title="Clear dummy data"
                  >
                    <span className="text-xs">🗑️</span>
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>
              
              {/* Auto-save happens silently in background */}
            </div>
          </div>
        </div>
      </div>

      <div className="kyc-container py-8">
        {/* Dummy Data Alert */}
        {showDummyData && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">🧪</span>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Test Mode Active</h3>
                  <p className="text-xs text-yellow-700">Dummy data loaded for testing. Press <kbd className="px-1 py-0.5 bg-yellow-200 rounded text-xs">Ctrl+D</kbd> or click "Clear Data" to remove.</p>
                </div>
              </div>
              <button
                onClick={clearDummyData}
                className="text-yellow-600 hover:text-yellow-800 transition-colors"
                title="Clear dummy data"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <KYCProgressBar
            current={currentSection + 1}
            total={sections.length}
            label="Profile Completion"
          />
        </div>

        {/* Section Navigation */}
        <div className="mb-8">
          {/* Mobile - Horizontal Scroll */}
          <div className="md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => goToSection(index)}
                  disabled={index > currentSection && !section.completed}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap min-w-fit ${
                    index === currentSection
                      ? 'bg-blue-600 text-white'
                      : index < currentSection || section.completed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <section.icon className="w-3 h-3" />
                  <span>{section.title.split(' ')[0]}</span>
                  {section.completed && <CheckCircle className="w-3 h-3" />}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              Section {currentSection + 1} of {sections.length}: {sections[currentSection].title}
            </div>
          </div>

          {/* Desktop - Full Layout */}
          <div className="hidden md:block">
            <div className="flex flex-wrap gap-2">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => goToSection(index)}
                  disabled={index > currentSection && !section.completed}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    index === currentSection
                      ? 'bg-blue-600 text-white'
                      : index < currentSection || section.completed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  <span>{section.title}</span>
                  {section.completed && <CheckCircle className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="kyc-card">
          {renderSection()}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 space-y-4">
          {/* Mobile Layout - Stacked */}
          <div className="flex flex-col gap-3 md:hidden">
            {/* Primary Action */}
            {currentSection === sections.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isDisabled}
                className="kyc-btn kyc-btn--primary w-full"
              >
                {isSubmitting ? (
                  <>
                    <div className="kyc-spinner" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Verification
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={goToNextSection}
                className="kyc-btn kyc-btn--primary w-full"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            
            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={goToPreviousSection}
                disabled={currentSection === 0}
                className="kyc-btn kyc-btn--secondary text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              
              <button
                onClick={autoSave}
                className="kyc-btn kyc-btn--ghost text-sm"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save Draft</span>
                <span className="sm:hidden">Save</span>
              </button>
            </div>
            
            {/* Back to Dashboard */}
            <button
              onClick={handleBackNavigation}
              className="kyc-btn kyc-btn--ghost w-full text-sm"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>

          {/* Desktop Layout - Side by Side */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex gap-3">
              <button
                onClick={handleBackNavigation}
                className="kyc-btn kyc-btn--ghost"
                title="Go back to previous page"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              
              <button
                onClick={goToPreviousSection}
                disabled={currentSection === 0}
                className="kyc-btn kyc-btn--secondary"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Section
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={autoSave}
                className="kyc-btn kyc-btn--ghost"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>

              {currentSection === sections.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isDisabled}
                  className="kyc-btn kyc-btn--primary"
                >
                  {isSubmitting ? (
                    <>
                      <div className="kyc-spinner" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Verification
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={goToNextSection}
                  className="kyc-btn kyc-btn--primary"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProfileVerification;
