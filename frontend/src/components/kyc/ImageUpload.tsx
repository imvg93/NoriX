"use client";

import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Eye, Trash2, Loader2 } from 'lucide-react';
import { apiService } from '../../services/api';

interface ImageUploadProps {
  label: string;
  currentUrl: string;
  onUpload: (url: string) => void;
  onDelete: () => void;
  accept?: string;
  disabled?: boolean;
  helperText?: string;
  documentType?: string; // e.g., 'aadhar', 'pan', 'passport', 'driving_license'
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  label, 
  currentUrl, 
  onUpload, 
  onDelete,
  accept = "image/*",
  disabled = false,
  helperText,
  documentType = 'aadhar' // default for backward compatibility
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const fd = new FormData();
      // Append documentType FIRST (some servers expect text fields before files)
      // Map frontend document types to backend expected types
      let backendDocType = documentType === 'aadhaar' ? 'aadhar' : documentType;
      // Map student proof types to backend expected format
      if (documentType === 'college_id') backendDocType = 'college_id_card';
      if (documentType === 'bonafide') backendDocType = 'bonafide_certificate';
      
      fd.append('documentType', backendDocType);
      fd.append('document', file);
      
      console.log('📤 Uploading document:', {
        originalType: documentType,
        backendType: backendDocType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      const res = await apiService.post<any>('/upload/kyc-document', fd as any);
      
      // Backend returns: { success: true, message: "...", data: { url: "...", documentUrl: "..." } }
      // apiService.post wraps it: { data: { success: true, message: "...", data: { ... } } }
      const responseData = (res as any)?.data;
      const url = responseData?.data?.documentUrl || responseData?.data?.url || responseData?.documentUrl || responseData?.url || '';
      
      console.log('Upload response:', { res, responseData, url });
      
      if (url) {
        onUpload(url);
        setPreview(null);
      } else {
        console.error('No URL in response:', responseData);
        throw new Error('Failed to get document URL from response');
      }
    } catch (e: any) {
      console.error('Upload error:', e);
      const errorMsg = e?.response?.data?.message || e?.details?.message || e?.message || 'Upload failed';
      setError(errorMsg);
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = () => {
    if (disabled) return;
    setPreview(null);
    onDelete();
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const displayUrl = currentUrl || preview;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {helperText && (
        <p className="text-xs text-gray-500 mb-2">{helperText}</p>
      )}
      <div
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 
          ${displayUrl 
            ? 'border-green-300 bg-green-50' 
            : 'border-gray-300 hover:border-[#2A8A8C] hover:bg-gray-50'
          }
          ${isUploading || disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || disabled}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center text-center py-4">
            <Loader2 className="w-8 h-8 text-[#2A8A8C] animate-spin mb-2" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : displayUrl ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-3">
              <img
                src={displayUrl}
                alt={label}
                className="w-32 h-40 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
              />
              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(displayUrl, '_blank');
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                <Eye className="w-3 h-3" />
                View
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            </div>
            <p className="text-xs text-green-600 mt-2 font-medium">
              ✓ Uploaded successfully
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              Any image format up to 10MB
            </p>
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};


