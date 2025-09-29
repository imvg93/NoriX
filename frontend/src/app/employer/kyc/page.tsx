"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiService } from '../../../services/api';
import { 
  Building, 
  User, 
  MapPin, 
  FileText, 
  CheckCircle, 
  ArrowLeft,
  Star,
  Send
} from 'lucide-react';

export default function EmployerKYCPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    authorizedName: '',
    designation: '',
    address: '',
    city: '',
    GSTNumber: '',
    PAN: ''
  });

  // Fill test data function
  const fillTestData = () => {
    setFormData({
      companyName: 'Tech Solutions Pvt Ltd',
      companyEmail: 'hr@techsolutions.com',
      companyPhone: '+91 98765 43210',
      authorizedName: 'Rajesh Kumar',
      designation: 'Owner',
      address: '123 Business Park, Sector 5',
      city: 'Hyderabad',
      GSTNumber: '22AAAAA0000A1Z5',
      PAN: 'ABCDE1234F'
    });
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit KYC form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName.trim()) {
      alert('Company Name is required');
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        companyName: formData.companyName,
        companyEmail: formData.companyEmail || undefined,
        companyPhone: formData.companyPhone || undefined,
        authorizedName: formData.authorizedName || undefined,
        designation: formData.designation || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        GSTNumber: formData.GSTNumber || undefined,
        PAN: formData.PAN || undefined
      };

      console.log('Submitting KYC with payload:', payload);
      
      await apiService.submitEmployerKYC(payload);
      
      alert('✅ KYC submitted successfully! Your status is now "Pending". You will be able to post jobs once approved.');
      router.push('/employer-home');
      
    } catch (error: any) {
      console.error('KYC submission error:', error);
      alert(`❌ Failed to submit KYC: ${error?.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/employer-home"
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
              <button 
                onClick={fillTestData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Star className="w-4 h-4" />
                Fill Test Data
              </button>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900">Employer KYC</h1>
              <p className="text-gray-600">Complete your company verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Company Verification Required</h2>
              <p className="text-orange-100">Complete this form to start posting jobs and hiring candidates</p>
            </div>
          </div>
        </div>

        {/* KYC Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your company's legal name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Email
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleInputChange}
                  placeholder="official@company.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleInputChange}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Authorized Person */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Authorized Person</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="authorizedName"
                  value={formData.authorizedName}
                  onChange={handleInputChange}
                  placeholder="Owner / HR / Representative"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation
                </label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select Designation</option>
                  <option value="Owner">Owner</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="Director">Director</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
            </div>
          </div>

          {/* Company Location */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Company Location</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Building, Street, Area"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Business IDs */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Business IDs (Optional)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Number
                </label>
                <input
                  type="text"
                  name="GSTNumber"
                  value={formData.GSTNumber}
                  onChange={handleInputChange}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Number
                </label>
                <input
                  type="text"
                  name="PAN"
                  value={formData.PAN}
                  onChange={handleInputChange}
                  placeholder="ABCDE1234F"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Ready to Submit?</h3>
                  <p className="text-sm text-gray-600">Your KYC will be reviewed by our admin team</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Link 
                  href="/employer-home"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !formData.companyName.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit KYC
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