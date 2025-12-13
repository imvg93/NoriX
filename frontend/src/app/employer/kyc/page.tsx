"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Building, 
  User, 
  MapPin, 
  FileText, 
  CheckCircle, 
  Clock,
  ArrowLeft,
  Star,
  Send,
  X,
  Shield,
  Upload,
  Globe,
  Mail,
  Phone,
  Briefcase,
  Award,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react';

export default function EmployerKYCPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'not-submitted' | 'pending' | 'approved' | 'rejected'>('not-submitted');
  const [kycRecord, setKycRecord] = useState<any | null>(null);
  
  // Check employer category
  const employerCategory = user?.employerCategory as 'corporate' | 'local_business' | 'individual' | undefined;
  
  // Corporate KYC form data
  const [corporateFormData, setCorporateFormData] = useState({
    fullName: '',
    companyName: '',
    businessRegNo: '',
    companyEmail: '',
    companyPhone: '',
    address: '',
    city: '',
    gstNo: '',
    pan: ''
  });
  
  // Local Business KYC form data
  const [localBusinessFormData, setLocalBusinessFormData] = useState({
    businessName: '',
    businessType: '',
    ownerName: '',
    ownerPhone: '',
    address: '',
    city: ''
  });
  
  // Individual KYC form data
  const [individualFormData, setIndividualFormData] = useState({
    fullName: '',
    aadhaarNumber: ''
  });
  
  const [corporateFiles, setCorporateFiles] = useState<{ idProof: File | null; companyProof: File | null }>({
    idProof: null,
    companyProof: null,
  });
  
  const [localBusinessFiles, setLocalBusinessFiles] = useState<{
    tradeLicense: File | null;
    shopLicense: File | null;
    addressProof: File | null;
    ownerIdProof: File | null;
  }>({
    tradeLicense: null,
    shopLicense: null,
    addressProof: null,
    ownerIdProof: null,
  });
  
  const [individualFiles, setIndividualFiles] = useState<{
    aadhaarFront: File | null;
    aadhaarBack: File | null;
    selfie: File | null;
  }>({
    aadhaarFront: null,
    aadhaarBack: null,
    selfie: null,
  });

  const normalizeStatus = (rawStatus?: string | null): 'not-submitted' | 'pending' | 'approved' | 'rejected' => {
    if (!rawStatus) return 'not-submitted';
    const normalized = rawStatus.replace(/_/g, '-').toLowerCase();
    if (normalized === 'approved' || normalized === 'pending' || normalized === 'rejected' || normalized === 'not-submitted') {
      return normalized as 'not-submitted' | 'pending' | 'approved' | 'rejected';
    }
    return 'not-submitted';
  };

  // Redirect if no employer category is set
  useEffect(() => {
    if (user?.userType === 'employer' && !user?.employerCategory) {
      router.push('/employer');
    }
  }, [user, router]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchStatus = async () => {
      if (!user?._id) {
        if (isMounted) {
          setLoadingStatus(false);
        }
        return;
      }

      if (user.userType !== 'employer') {
        if (isMounted) {
          setLoadingStatus(false);
        }
        return;
      }

      // Check if category is set
      if (!user.employerCategory) {
        if (isMounted) {
          setLoadingStatus(false);
        }
        router.push('/employer');
        return;
      }

      try {
        if (isMounted) {
          setLoadingStatus(true);
        }
        
        // Fetch KYC status based on category
        let res: any;
        if (user.employerCategory === 'corporate') {
          res = await apiService.getEmployerKYCStatus(user._id);
        } else if (user.employerCategory === 'local_business') {
          const response = await apiService.get(`/kyc/local-business/status`);
          res = response.data;
        } else if (user.employerCategory === 'individual') {
          const response = await apiService.get(`/kyc/individual/status`);
          res = response.data;
        } else {
          throw new Error('Invalid employer category');
        }
        
        if (!isMounted) return;
        
        const normalized = normalizeStatus(res?.status || res?.user?.kycStatus);
        setStatus(normalized);
        setKycRecord(res?.kyc || null);
        
        // Only update user if status changed
        if (user.kycStatus !== normalized) {
          updateUser({ kycStatus: normalized as any });
        }

        // Populate form data based on category
        if (res?.kyc) {
          if (user.employerCategory === 'corporate') {
            setCorporateFormData(prev => ({
              ...prev,
              fullName: res.kyc.fullName || res.kyc.authorizedName || prev.fullName,
              companyName: res.kyc.companyName || prev.companyName,
              businessRegNo: res.kyc.businessRegNo || prev.businessRegNo,
              companyEmail: res.kyc.companyEmail || prev.companyEmail,
              companyPhone: res.kyc.companyPhone || prev.companyPhone,
              address: res.kyc.address || prev.address,
              city: res.kyc.city || prev.city,
              gstNo: res.kyc.GSTNumber || res.kyc.gstNo || prev.gstNo,
              pan: res.kyc.PAN || prev.pan,
            }));
          } else if (user.employerCategory === 'local_business') {
            setLocalBusinessFormData(prev => ({
              ...prev,
              businessName: res.kyc.businessName || prev.businessName,
              businessType: res.kyc.businessType || prev.businessType,
              ownerName: res.kyc.ownerName || prev.ownerName,
              ownerPhone: res.kyc.ownerPhone || prev.ownerPhone,
              address: res.kyc.address || prev.address,
              city: res.kyc.city || prev.city,
            }));
          } else if (user.employerCategory === 'individual') {
            setIndividualFormData(prev => ({
              ...prev,
              fullName: res.kyc.fullName || prev.fullName,
              aadhaarNumber: res.kyc.aadhaarNumber || prev.aadhaarNumber,
            }));
          }
        }
      } catch (error: any) {
        console.error('❌ Failed to load employer KYC status:', error);
        if (isMounted) {
          setLoadingStatus(false);
          // Don't show alert if category is not set (will redirect)
          if (!error?.message?.includes('category')) {
            alert(`Failed to load KYC status: ${error?.message || 'Unknown error'}`);
          }
        }
        return;
      } finally {
        if (isMounted) {
          setLoadingStatus(false);
        }
      }
    };

    fetchStatus();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.userType, user?.employerCategory]);

  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const canSubmit = status === 'not-submitted' || status === 'rejected';
  const disableInputs = isApproved || isPending;
  const idProofUrl = kycRecord?.documents?.idProof?.url;
  const companyProofUrl = kycRecord?.documents?.companyProof?.url;

  // Conditional form data references based on employer category
  const formData = employerCategory === 'corporate' ? corporateFormData :
                   employerCategory === 'local_business' ? localBusinessFormData :
                   individualFormData;
  
  const setFormData = employerCategory === 'corporate' ? setCorporateFormData :
                      employerCategory === 'local_business' ? setLocalBusinessFormData :
                      setIndividualFormData;

  // Conditional files references based on employer category
  const files = employerCategory === 'corporate' ? corporateFiles :
                employerCategory === 'local_business' ? localBusinessFiles :
                individualFiles;
  
  const setFiles = employerCategory === 'corporate' ? setCorporateFiles :
                   employerCategory === 'local_business' ? setLocalBusinessFiles :
                   setIndividualFiles;

  // Fill test data function
  const fillTestData = () => {
    if (!canSubmit) return;
    if (employerCategory === 'corporate') {
      setCorporateFormData({
        fullName: 'Rajesh Kumar',
        companyName: 'Tech Solutions Pvt Ltd',
        businessRegNo: 'REG-TS-2024-09',
        companyEmail: 'hr@techsolutions.com',
        companyPhone: '+91 98765 43210',
        address: '123 Business Park, Sector 5',
        city: 'Hyderabad',
        gstNo: '22AAAAA0000A1Z5',
        pan: 'ABCDE1234F'
      });
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (employerCategory === 'corporate') {
      setCorporateFormData(prev => ({
        ...prev,
        [name]: name === 'pan' ? value.toUpperCase() : value
      }));
    } else if (employerCategory === 'local_business') {
      setLocalBusinessFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setIndividualFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (name: 'idProof' | 'companyProof', fileList: FileList | null) => {
    const file = fileList && fileList.length > 0 ? fileList[0] : null;
    setFiles((prev: any) => ({
      ...prev,
      [name]: file,
    }));
  };

  // Submit KYC form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) {
      alert('Unable to submit KYC without a valid employer account.');
      return;
    }

    if (!canSubmit) {
      alert('Your KYC is already submitted. Please wait for the review to complete.');
      return;
    }

    // Add null checks for formData fields
    if (employerCategory === 'corporate' && !(formData as typeof corporateFormData).companyName?.trim()) {
      alert('Company Name is required');
      return;
    }

    try {
      setSubmitting(true);

      const payload = new FormData();
      
      // Handle corporate form data
      if (employerCategory === 'corporate') {
        const corpData = formData as typeof corporateFormData;
        payload.append('companyName', corpData.companyName?.trim() || '');
        if (corpData.fullName?.trim()) payload.append('fullName', corpData.fullName.trim());
        if (corpData.businessRegNo?.trim()) payload.append('businessRegNo', corpData.businessRegNo.trim());
        if (corpData.companyEmail?.trim()) payload.append('companyEmail', corpData.companyEmail.trim());
        if (corpData.companyPhone?.trim()) payload.append('companyPhone', corpData.companyPhone.trim());
        if (corpData.address?.trim()) payload.append('address', corpData.address.trim());
        if (corpData.city?.trim()) payload.append('city', corpData.city.trim());
        if (corpData.gstNo?.trim()) payload.append('gstNo', corpData.gstNo.trim());
        if (corpData.pan?.trim()) payload.append('PAN', corpData.pan.trim());

        const corpFiles = files as typeof corporateFiles;
        if (corpFiles.idProof) {
          payload.append('idProof', corpFiles.idProof, corpFiles.idProof.name);
        }
        if (corpFiles.companyProof) {
          payload.append('companyProof', corpFiles.companyProof, corpFiles.companyProof.name);
        }
      }

      await apiService.submitEmployerKYC(payload);

      alert('✅ KYC submitted successfully! Your status is now "Pending". You will be able to post jobs once approved.');
      setStatus('pending');
      updateUser({ kycStatus: 'pending' as any });
      if (employerCategory === 'corporate') {
        setCorporateFiles({ idProof: null, companyProof: null });
      }
      // Refresh KYC status
      const res = await apiService.getEmployerKYCStatus(user._id);
      const normalized = normalizeStatus(res?.status || res?.user?.kycStatus);
      setStatus(normalized);
      setKycRecord(res?.kyc || null);
    } catch (error: any) {
      console.error('KYC submission error:', error);
      alert(`❌ Failed to submit KYC: ${error?.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingStatus && !kycRecord && status === 'not-submitted') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-sm font-medium text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user is not authenticated or not an employer
  if (!user || user.userType !== 'employer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-sm text-gray-600 mb-6">
              {!user 
                ? 'You need to be logged in to access KYC verification.'
                : 'KYC verification is only available for employers.'}
            </p>
            <Link
              href={user ? '/employer' : '/login'}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium text-sm"
            >
              {user ? 'Go to Dashboard' : 'Log In'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (isPending && kycRecord) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
          <Upload className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Uploaded</span>
        </div>
      );
    }
    if (status === 'rejected' && kycRecord) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
          <Upload className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Updated</span>
        </div>
      );
    }
    if (isApproved) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Verified</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
        <FileText className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-600">Not Submitted</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-4">
              <Link 
                href="/employer"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Back</span>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Business Verification</h1>
                <p className="text-xs text-gray-500 mt-0.5">Complete your company profile</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              {canSubmit && (
                <button 
                  onClick={fillTestData}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Fill Sample</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Simple Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-medium text-gray-800 mb-1">Verify Your Business</h2>
              <p className="text-sm text-gray-600">
                Complete your business verification to unlock all features. Our team will review your submission within 24-48 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Status Alerts - Only show uploaded/updated messages */}
        {isPending && kycRecord && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
            <div className="flex items-start gap-3">
              <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-medium text-blue-800 mb-1">KYC Uploaded</h3>
                <p className="text-sm text-blue-700">Your KYC documents have been successfully uploaded and submitted for review.</p>
              </div>
            </div>
          </div>
        )}
        {status === 'rejected' && kycRecord && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
            <div className="flex items-start gap-3">
              <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-medium text-blue-800 mb-1">KYC Updated</h3>
                <p className="text-sm text-blue-700">Your KYC has been updated. Please update your details and upload the correct documents to resubmit.</p>
              </div>
            </div>
          </div>
        )}

        {/* KYC Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Company Information</h3>
                <p className="text-xs text-gray-500 mt-0.5">Basic details about your organization</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={corporateFormData.companyName}
                  onChange={handleInputChange}
                  required
                  disabled={disableInputs}
                  placeholder="Enter your company's legal name"
                  className={`w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm ${
                    disableInputs 
                      ? 'bg-gray-50 cursor-not-allowed border-gray-200' 
                      : 'bg-white hover:border-gray-400'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Business Registration Number
                </label>
                <input
                  type="text"
                  name="businessRegNo"
                  value={(formData as typeof corporateFormData).businessRegNo || ''}
                  onChange={handleInputChange}
                  disabled={disableInputs}
                  placeholder="MSME / UDYAM / Shop & Establishment ID"
                  className={`w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm ${
                    disableInputs 
                      ? 'bg-gray-50 cursor-not-allowed border-gray-200' 
                      : 'bg-white hover:border-gray-400'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company Email
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={(formData as typeof corporateFormData).companyEmail || ''}
                  onChange={handleInputChange}
                  disabled={disableInputs}
                  placeholder="official@company.com"
                  className={`w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm ${
                    disableInputs 
                      ? 'bg-gray-50 cursor-not-allowed border-gray-200' 
                      : 'bg-white hover:border-gray-400'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="companyPhone"
                  value={(formData as typeof corporateFormData).companyPhone || ''}
                  onChange={handleInputChange}
                  disabled={disableInputs}
                  placeholder="+91 XXXXX XXXXX"
                  className={`w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm ${
                    disableInputs 
                      ? 'bg-gray-50 cursor-not-allowed border-gray-200' 
                      : 'bg-white hover:border-gray-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Authorized Person */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="p-2 bg-teal-50 rounded-lg">
                <User className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Authorized Person</h3>
                <p className="text-xs text-gray-500 mt-0.5">Primary contact person for your business</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name of Authorized Contact
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={(formData as typeof corporateFormData).fullName || ''}
                  onChange={handleInputChange}
                  disabled={disableInputs}
                  placeholder="Owner / HR / Representative"
                  className={`w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm ${
                    disableInputs 
                      ? 'bg-gray-50 cursor-not-allowed border-gray-200' 
                      : 'bg-white hover:border-gray-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Company Location */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="p-2 bg-cyan-50 rounded-lg">
                <MapPin className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Company Location</h3>
                <p className="text-xs text-gray-500 mt-0.5">Physical address of your business</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={(formData as typeof corporateFormData).address || ''}
                  onChange={handleInputChange}
                  disabled={disableInputs}
                  placeholder="Building, Street, Area"
                  className={`w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm ${
                    disableInputs 
                      ? 'bg-gray-50 cursor-not-allowed border-gray-200' 
                      : 'bg-white hover:border-gray-400'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={(formData as typeof corporateFormData).city || ''}
                  onChange={handleInputChange}
                  disabled={disableInputs}
                  placeholder="City"
                  className={`w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm ${
                    disableInputs 
                      ? 'bg-gray-50 cursor-not-allowed border-gray-200' 
                      : 'bg-white hover:border-gray-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Business IDs */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="p-2 bg-sky-50 rounded-lg">
                <FileText className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Business IDs</h3>
                <p className="text-xs text-gray-500 mt-0.5">Optional tax and registration numbers</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gstNo"
                  value={(formData as typeof corporateFormData).gstNo || ''}
                  onChange={handleInputChange}
                  disabled={disableInputs}
                  placeholder="22AAAAA0000A1Z5"
                  className={`w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm ${
                    disableInputs 
                      ? 'bg-gray-50 cursor-not-allowed border-gray-200' 
                      : 'bg-white hover:border-gray-400'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  PAN Number
                </label>
                <input
                  type="text"
                  name="pan"
                  value={(formData as typeof corporateFormData).pan || ''}
                  onChange={handleInputChange}
                  disabled={disableInputs}
                  placeholder="ABCDE1234F"
                  className={`w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm uppercase ${
                    disableInputs 
                      ? 'bg-gray-50 cursor-not-allowed border-gray-200' 
                      : 'bg-white hover:border-gray-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Supporting Documents */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Upload className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Supporting Documents</h3>
                <p className="text-xs text-gray-500 mt-0.5">Upload required verification documents</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Government ID Proof
                  <span className="text-gray-400 font-normal ml-2">(Owner/Authorized Person)</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(event) => handleFileChange('idProof', event.target.files)}
                    disabled={disableInputs}
                    className="hidden"
                    id="idProof"
                  />
                  <label
                    htmlFor="idProof"
                    className={`flex flex-col items-center justify-center w-full px-5 py-6 border border-dashed rounded-lg cursor-pointer transition-all ${
                      disableInputs
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : (employerCategory === 'corporate' && (corporateFiles.idProof || idProofUrl))
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                  >
                    {(employerCategory === 'corporate' && (corporateFiles.idProof || idProofUrl)) ? (
                      <>
                        <CheckCircle className="w-8 h-8 text-blue-500 mb-2" />
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          {corporateFiles.idProof?.name || 'Document uploaded'}
                        </p>
                        {idProofUrl && (
                          <a href={idProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1">
                            View current document
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-xs font-medium text-gray-600 mb-1">Click to upload</p>
                        <p className="text-xs text-gray-500">JPG, PNG or PDF (max 5MB)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Registration Proof
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(event) => handleFileChange('companyProof', event.target.files)}
                    disabled={disableInputs}
                    className="hidden"
                    id="companyProof"
                  />
                  <label
                    htmlFor="companyProof"
                    className={`flex flex-col items-center justify-center w-full px-5 py-6 border border-dashed rounded-lg cursor-pointer transition-all ${
                      disableInputs
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : (employerCategory === 'corporate' && (corporateFiles.companyProof || companyProofUrl))
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                  >
                    {(employerCategory === 'corporate' && (corporateFiles.companyProof || companyProofUrl)) ? (
                      <>
                        <CheckCircle className="w-8 h-8 text-blue-500 mb-2" />
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          {corporateFiles.companyProof?.name || 'Document uploaded'}
                        </p>
                        {companyProofUrl && (
                          <a href={companyProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1">
                            View current document
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-xs font-medium text-gray-600 mb-1">Click to upload</p>
                        <p className="text-xs text-gray-500">JPG, PNG or PDF (max 5MB)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-600">
                Accepted formats: JPG, PNG, or PDF up to 5 MB. Ensure documents are clear and readable.
              </p>
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-0.5">Ready to Submit?</h3>
                  <p className="text-xs text-gray-600">Your verification will be reviewed within 24-48 hours</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Link 
                  href="/employer"
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-center text-sm"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting || (employerCategory === 'corporate' && !(formData as typeof corporateFormData).companyName?.trim()) || !canSubmit}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : isPending && kycRecord ? (
                    <>
                      <Upload className="w-4 h-4" />
                      Uploaded
                    </>
                  ) : status === 'rejected' && kycRecord ? (
                    <>
                      <Upload className="w-4 h-4" />
                      Updated
                    </>
                  ) : isApproved ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Verification
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
