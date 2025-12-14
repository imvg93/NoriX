'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { apiService } from '../../../../services/api';
import DocumentUpload from '../../../../components/employer/DocumentUpload';
import { Store, Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function LocalBusinessKYCPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'not-submitted' | 'pending' | 'approved' | 'rejected'>('not-submitted');
  const [kycRecord, setKycRecord] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    address: '',
    city: '',
    pinCode: '',
    locationPin: '', // Simple text input for now
  });

  // Files - only ONE required
  const [files, setFiles] = useState<{
    shopPhoto: File | null;
    businessLicense: File | null;
    ownerIdProof: File | null;
  }>({
    shopPhoto: null,
    businessLicense: null,
    ownerIdProof: null,
  });

  // Redirect if not local business employer
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.userType !== 'employer') {
      router.push('/');
      return;
    }
    if (user.employerCategory !== 'local_business') {
      if (user.employerCategory === 'corporate') {
        router.push('/employer/kyc/corporate');
      } else if (user.employerCategory === 'individual') {
        router.push('/employer/kyc/individual');
      } else {
        router.push('/employer/select-role');
      }
      return;
    }
    setLoading(false);
  }, [user, router]);

  // Load existing KYC data
  useEffect(() => {
    const loadKYC = async () => {
      if (!user?._id || user.employerCategory !== 'local_business') return;

      try {
        const res = await apiService.getEmployerKYCStatus(user._id);
        const kycStatus = res?.status || res?.user?.kycStatus || 'not-submitted';
        const normalizedStatus = kycStatus.replace(/_/g, '-').toLowerCase() as any;
        setStatus(normalizedStatus);
        setKycRecord(res?.kyc || null);

        // Show status modal if pending or approved
        if (normalizedStatus === 'pending' || normalizedStatus === 'approved') {
          setShowStatusModal(true);
        }

        // Pre-fill form if KYC exists
        if (res?.kyc) {
          setFormData({
            businessName: res.kyc.businessName || '',
            businessType: res.kyc.businessType || '',
            ownerName: res.kyc.ownerName || '',
            ownerEmail: res.kyc.ownerEmail || '',
            ownerPhone: res.kyc.ownerPhone || '',
            address: res.kyc.address || '',
            city: res.kyc.city || '',
            pinCode: res.kyc.pinCode || '',
            locationPin: res.kyc.locationPin || '',
          });
        }
      } catch (e) {
        console.error('Error loading KYC:', e);
      }
    };

    loadKYC();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (field: 'shopPhoto' | 'businessLicense' | 'ownerIdProof') => {
    return (file: File, url: string) => {
      setFiles(prev => ({
        ...prev,
        [field]: file
      }));
    };
  };

  const handleFileDelete = (field: 'shopPhoto' | 'businessLicense' | 'ownerIdProof') => {
    return () => {
      setFiles(prev => ({
        ...prev,
        [field]: null
      }));
    };
  };

  const fillTestData = () => {
    if (disableInputs) return;
    
    setFormData({
      businessName: 'Beauty Salon & Spa',
      businessType: 'Salon',
      ownerName: 'Priya Sharma',
      ownerEmail: 'priya@beautysalon.com',
      ownerPhone: '+91 98765 43210',
      address: 'Shop No. 15, Main Street, Near City Mall',
      city: 'Mumbai',
      pinCode: '400001',
      locationPin: 'Near City Mall, Main Street',
    });
  };

  const validateForm = (): boolean => {
    if (!formData.businessName.trim() || formData.businessName.trim().length < 3) {
      setError('Business name is required (minimum 3 characters)');
      return false;
    }
    if (!formData.businessType) {
      setError('Business type is required');
      return false;
    }
    if (!formData.ownerName.trim() || formData.ownerName.trim().length < 3) {
      setError('Owner name is required (minimum 3 characters)');
      return false;
    }
    if (!formData.ownerEmail.trim()) {
      setError('Owner email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.ownerEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.pinCode.trim()) {
      setError('PIN code is required');
      return false;
    }
    // At least ONE proof document required
    if (!files.shopPhoto && !files.businessLicense && !files.ownerIdProof) {
      setError('Please upload at least one proof document (Shop Photo, Business License, or Owner ID)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    if (!user?._id) {
      setError('Unable to submit KYC without a valid employer account.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = new FormData();
      payload.append('businessName', formData.businessName.trim());
      payload.append('businessType', formData.businessType);
      payload.append('ownerName', formData.ownerName.trim());
      payload.append('ownerEmail', formData.ownerEmail.trim().toLowerCase());
      if (formData.ownerPhone.trim()) payload.append('ownerPhone', formData.ownerPhone.trim());
      payload.append('address', formData.address.trim());
      payload.append('city', formData.city.trim());
      if (formData.pinCode.trim()) payload.append('pinCode', formData.pinCode.trim());
      if (formData.locationPin.trim()) payload.append('locationPin', formData.locationPin.trim());

      // Append files (only the ones that are uploaded)
      if (files.shopPhoto) {
        payload.append('shopPhoto', files.shopPhoto);
      }
      if (files.businessLicense) {
        payload.append('businessLicense', files.businessLicense);
      }
      if (files.ownerIdProof) {
        payload.append('ownerIdProof', files.ownerIdProof);
      }

      await apiService.submitLocalBusinessKYC(payload);

      setStatus('pending');
      updateUser({ kycStatus: 'pending' as any });
      setShowSuccessModal(true);

      // Refresh KYC status
      const res = await apiService.getEmployerKYCStatus(user._id);
      const normalized = (res?.status || res?.user?.kycStatus || 'pending').replace(/_/g, '-').toLowerCase();
      setStatus(normalized as any);
      setKycRecord(res?.kyc || null);
    } catch (error: any) {
      console.error('KYC submission error:', error);
      setError(error?.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user || user.userType !== 'employer' || user.employerCategory !== 'local_business') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const canSubmit = status === 'not-submitted' || status === 'rejected';
  const disableInputs = isApproved || isPending;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              KYC Submitted Successfully!
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Your KYC application has been submitted and is now under review. You will be notified once it is approved. You can post jobs once your KYC is approved.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/employer/local');
                }}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal (Pending/Approved) */}
      {showStatusModal && (status === 'pending' || status === 'approved') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                status === 'approved' ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {status === 'approved' ? (
                  <CheckCircle className="w-10 h-10 text-green-600" />
                ) : (
                  <Clock className="w-10 h-10 text-yellow-600" />
                )}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              {status === 'approved' ? 'KYC Approved' : 'KYC Under Review'}
            </h2>
            <p className="text-gray-600 text-center mb-6">
              {status === 'approved' 
                ? 'Your KYC has been approved. You can now post jobs and access all features.'
                : 'Your KYC application is currently under review. You cannot modify your KYC details until the review is complete. You will be notified once it is approved.'}
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  router.push('/employer/local');
                }}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Local Business KYC</h1>
            </div>
            {canSubmit && (
              <button
                type="button"
                onClick={fillTestData}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all border border-gray-300"
              >
                🧪 Fill Test Data
              </button>
            )}
          </div>
          <p className="text-gray-600">Complete your verification to start posting jobs</p>
        </div>

        {/* Status Banner */}
        {status !== 'not-submitted' && (
          <div className={`mb-6 rounded-lg border p-4 ${
            status === 'approved' ? 'bg-green-50 border-green-200' :
            status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {status === 'approved' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : status === 'pending' ? (
                <Clock className="w-5 h-5 text-yellow-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <h3 className={`font-medium ${
                  status === 'approved' ? 'text-green-800' :
                  status === 'pending' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  {status === 'approved' ? 'KYC Approved' :
                   status === 'pending' ? 'KYC Pending Review' :
                   'KYC Rejected'}
                </h3>
                <p className={`text-sm ${
                  status === 'approved' ? 'text-green-700' :
                  status === 'pending' ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {status === 'approved' ? 'Your KYC has been approved. You can now post jobs.' :
                   status === 'pending' ? 'Your KYC is under review. You will be notified once it is approved.' :
                   kycRecord?.rejectionReason ? `Reason: ${kycRecord.rejectionReason}` :
                   'Your KYC was rejected. Please review and resubmit.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* KYC Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                  disabled={disableInputs}
                  minLength={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                  placeholder="Enter your business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  required
                  disabled={disableInputs}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                >
                  <option value="">Select business type</option>
                  <option value="Salon">Salon</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Retail Shop">Retail Shop</option>
                  <option value="Coaching Center">Coaching Center</option>
                  <option value="Local Agency">Local Agency</option>
                  <option value="Small Office">Small Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  required
                  disabled={disableInputs}
                  minLength={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                  placeholder="Owner's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="ownerEmail"
                  value={formData.ownerEmail}
                  onChange={handleInputChange}
                  required
                  disabled={disableInputs}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                  placeholder="owner@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={handleInputChange}
                  disabled={disableInputs}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  disabled={disableInputs}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                  placeholder="Street address, shop location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  disabled={disableInputs}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleInputChange}
                  required
                  disabled={disableInputs}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                  placeholder="123456"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Pin (Optional)
                </label>
                <input
                  type="text"
                  name="locationPin"
                  value={formData.locationPin}
                  onChange={handleInputChange}
                  disabled={disableInputs}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                  placeholder="Enter location coordinates or landmark"
                />
                <p className="text-xs text-gray-500 mt-1">For future map integration</p>
              </div>
            </div>
          </div>

          {/* Proof Documents - Any ONE Required */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Proof Documents</h2>
            <p className="text-sm text-gray-600 mb-4">Upload at least <strong>one</strong> of the following documents:</p>
            
            <div className="space-y-6">
              <DocumentUpload
                label="Shop Photo with Signage"
                description="Photo of your shop/business with visible signage (recommended for fastest approval)"
                accept="image/*"
                maxSizeMB={5}
                currentUrl={kycRecord?.documents?.shopPhotoUrl}
                onUpload={handleFileUpload('shopPhoto')}
                onDelete={handleFileDelete('shopPhoto')}
              />

              <DocumentUpload
                label="Business License"
                description="Upload your business license or trade license"
                accept="image/*,application/pdf"
                maxSizeMB={5}
                currentUrl={kycRecord?.documents?.businessLicenseUrl}
                onUpload={handleFileUpload('businessLicense')}
                onDelete={handleFileDelete('businessLicense')}
              />

              <DocumentUpload
                label="Owner ID Proof"
                description="Upload owner's ID proof (Aadhaar, PAN, Passport, or Driving License)"
                accept="image/*,application/pdf"
                maxSizeMB={5}
                currentUrl={kycRecord?.documents?.ownerIdProofUrl}
                onUpload={handleFileUpload('ownerIdProof')}
                onDelete={handleFileDelete('ownerIdProof')}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              Skip for Now
            </Link>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit KYC'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
