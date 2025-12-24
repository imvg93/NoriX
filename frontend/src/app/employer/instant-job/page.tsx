"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  MapPin, 
  DollarSign, 
  Clock, 
  Navigation,
  ArrowRight,
  Loader,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const ACCENT = "#2A8A8C";

const JOB_TYPES = [
  { id: 'delivery', label: 'Delivery', icon: '🚚' },
  { id: 'data-entry', label: 'Data Entry', icon: '⌨️' },
  { id: 'warehouse', label: 'Warehouse', icon: '📦' },
  { id: 'retail', label: 'Retail', icon: '🛍️' },
  { id: 'hospitality', label: 'Hospitality', icon: '🍽️' },
  { id: 'event', label: 'Event Help', icon: '🎉' },
  { id: 'packaging', label: 'Packaging', icon: '📋' },
  { id: 'other', label: 'Other', icon: '⚡' }
];

const InstantJobPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    jobType: '',
    jobTitle: '',
    location: '',
    locationLat: 0,
    locationLon: 0,
    radius: 5,
    pay: '',
    duration: 4,
    skillsRequired: [] as string[]
  });

  // Auto-fetch user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          const address = data.display_name || 
                         `${data.address?.city || data.address?.town || data.address?.village || 'Unknown'}, ${data.address?.state || ''}`.trim();

          setFormData(prev => ({
            ...prev,
            locationLat: lat,
            locationLon: lon,
            location: address
          }));
          setLocationError(null);
        } catch (error) {
          // If reverse geocoding fails, use coordinates
          setFormData(prev => ({
            ...prev,
            locationLat: lat,
            locationLon: lon,
            location: `${lat.toFixed(4)}, ${lon.toFixed(4)}`
          }));
        }
        setLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('Could not get your location. Please allow location access.');
        setLocationLoading(false);
      },
      { 
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 0
      }
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleJobTypeSelect = (jobTypeId: string) => {
    const jobType = JOB_TYPES.find(t => t.id === jobTypeId);
    setFormData(prev => ({
      ...prev,
      jobType: jobTypeId,
      jobTitle: jobType?.label || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.jobType || !formData.pay || !formData.duration) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.locationLat || !formData.locationLon) {
      alert('Please allow location access to create instant jobs');
      return;
    }

    if (formData.duration > 8) {
      alert('Instant jobs must be 8 hours or less');
      return;
    }

    setLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/instant-jobs/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobType: formData.jobType,
          jobTitle: formData.jobTitle,
          location: formData.location,
          locationLat: formData.locationLat,
          locationLon: formData.locationLon,
          radius: formData.radius,
          pay: formData.pay,
          duration: formData.duration,
          durationUnit: 'hours',
          skillsRequired: formData.skillsRequired
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create instant job');
      }

      const data = await response.json();
      console.log('✅ Job created response:', data);
      
      // Get jobId from response (could be _id or jobId)
      const jobId = data.data?.jobId || data.data?._id || data.data?.id;
      
      console.log('📋 Extracted jobId:', jobId);
      console.log('📋 Full data structure:', JSON.stringify(data, null, 2));
      
      if (!jobId) {
        console.error('❌ No jobId in response:', data);
        setLoading(false);
        alert('Job created but failed to get job ID. Please check your jobs list.');
        return;
      }
      
      // Keep loading animation visible for at least 2 seconds to show radar animation
      // Then navigate to dispatch status screen
      setTimeout(() => {
        console.log('🚀 Navigating to status page:', `/employer/instant-job/${jobId}/status`);
        router.push(`/employer/instant-job/${jobId}/status`);
        // Don't set loading to false here - let the navigation handle it
      }, 2000); // 2 second delay to show animation
      
    } catch (error: any) {
      console.error('Error creating instant job:', error);
      setLoading(false);
      alert(error.message || 'Failed to create instant job');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay with Radar Animation */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-sm"
            style={{ zIndex: 9999 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 sm:p-12 text-center max-w-md mx-4"
            >
              {/* Radar Animation */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <motion.div
                  className="absolute inset-0 border-4 border-[#2A8A8C] rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute inset-0 border-4 border-[#2A8A8C] rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 0, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                />
                <motion.div
                  className="absolute inset-0 border-4 border-[#2A8A8C] rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 360]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Zap className="w-12 h-12 text-[#2A8A8C]" />
                  </motion.div>
                </div>
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-gray-900 mb-2"
              >
                Creating Job...
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 mb-4"
              >
                Setting up your instant job and preparing to notify workers
              </motion.p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="w-4 h-4" />
                </motion.div>
                <span>Please wait</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#2A8A8C] rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Find Worker Now</h1>
              <p className="text-gray-600 text-sm mt-1">On-demand student workforce</p>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Instant jobs are sent to available students nearby.</p>
                <p>If no one accepts, you can retry, increase pay, or schedule.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Command Panel */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: loading ? 0.5 : 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 space-y-6 ${loading ? 'pointer-events-none' : ''}`}
        >
          {/* Job Type Grid */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Job Type *</label>
            <div className="grid grid-cols-4 gap-3">
              {JOB_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleJobTypeSelect(type.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.jobType === type.id
                      ? 'border-[#2A8A8C] bg-[#2A8A8C]/10 scale-105 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs font-medium text-gray-900">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Location - Auto-fetched */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <MapPin className="w-4 h-4 inline mr-1 text-[#2A8A8C]" />
                Location *
              </label>
              {locationLoading ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <Loader className="w-4 h-4 text-[#2A8A8C] animate-spin" />
                  <span className="text-sm text-gray-600">Getting your location...</span>
                </div>
              ) : locationError ? (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{locationError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="text-xs text-red-600 underline mt-1"
                  >
                    Retry location access
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-900 font-medium">{formData.location}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Location detected automatically</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <Navigation className="w-4 h-4 inline mr-1 text-[#2A8A8C]" />
                Search Radius
              </label>
              <select
                name="radius"
                value={formData.radius}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8C] focus:border-transparent text-gray-900"
              >
                <option value="3">3 km</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="15">15 km</option>
              </select>
            </div>
          </div>

          {/* Pay + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1 text-[#2A8A8C]" />
                Pay *
              </label>
              <input
                type="text"
                name="pay"
                value={formData.pay}
                onChange={handleInputChange}
                required
                placeholder="e.g., ₹500"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8C] focus:border-transparent text-gray-900 placeholder-gray-400 text-lg font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <Clock className="w-4 h-4 inline mr-1 text-[#2A8A8C]" />
                Duration (hours) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                min="0.5"
                max="8"
                step="0.5"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8C] focus:border-transparent text-gray-900 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Start Time - Always Now */}
          <div className="bg-[#2A8A8C]/10 border border-[#2A8A8C]/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#2A8A8C]" />
              <div>
                <div className="font-semibold text-gray-900">Start Time: Now</div>
                <div className="text-xs text-gray-600">Workers will be notified immediately</div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <motion.button
            type="submit"
            disabled={loading || locationLoading || !formData.locationLat}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-[#2A8A8C] hover:bg-[#238085] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Find Worker Now
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
};

export default InstantJobPage;
