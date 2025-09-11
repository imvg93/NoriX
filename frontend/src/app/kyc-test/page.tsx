'use client';

import { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';

export default function SimpleKYCTest() {
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchKYCData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Fetching KYC data...');
      
      // Try direct API call
      const response = await fetch('http://localhost:5000/api/admin/kyc/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 KYC Stats Data:', data);
      
      setKycData(data);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYCData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Simple KYC Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Test</h2>
          <button 
            onClick={fetchKYCData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test KYC API'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {kycData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-green-800 font-semibold text-lg mb-4">✅ KYC Data Retrieved Successfully!</h3>
            <pre className="bg-white p-4 rounded border overflow-auto">
              {JSON.stringify(kycData, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Direct Links</h2>
          <div className="space-y-2">
            <a 
              href="/admin-home" 
              className="block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Go to Admin Home
            </a>
            <a 
              href="/kyc-management" 
              className="block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Go to KYC Management
            </a>
            <a 
              href="/admin-login" 
              className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Admin Login
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Frontend URL:</strong> http://localhost:3000</p>
            <p><strong>Backend URL:</strong> http://localhost:5000</p>
            <p><strong>API Endpoint:</strong> http://localhost:5000/api/admin/kyc/stats</p>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
            <p><strong>Data:</strong> {kycData ? 'Received' : 'Not received'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
