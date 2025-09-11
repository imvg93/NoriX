"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileImage, 
  CheckCircle, 
  X, 
  AlertCircle,
  Eye,
  Trash2,
  Loader2
} from 'lucide-react';
import { apiService } from '../../services/api';

interface DocumentUploadProps {
  documentType: 'aadhar' | 'college-id';
  label: string;
  description: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
  onDelete: () => void;
  className?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documentType,
  label,
  description,
  currentUrl,
  onUpload,
  onDelete,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      console.log('🔍 Frontend Upload - Starting upload:', {
        documentType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await apiService.post('/kyc/upload-document', formData);
      
      console.log('🔍 Frontend Upload - Response received:', response.data);
      
      if (response.data.success && response.data.data.documentUrl) {
        console.log('✅ Frontend Upload - Upload successful:', response.data.data.documentUrl);
        onUpload(response.data.data.documentUrl);
        setPreview(null);
        // Show success message
        setError(null);
      } else {
        console.error('❌ Frontend Upload - No documentUrl in response');
        throw new Error('Image not uploaded. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Frontend Upload Error:', error);
      // Use the specific error message from the backend
      const errorMessage = error.message || 'Image not uploaded. Please try again.';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUrl) return;

    try {
      await apiService.delete(`/kyc/document/${documentType}`);
      onDelete();
      setPreview(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      setError(error.message || 'Delete failed. Please try again.');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect({ target: { files: [file] } } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`document-upload ${className}`}>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
          ${currentUrl || preview 
            ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Uploading document...
              </p>
            </motion.div>
          ) : currentUrl || preview ? (
            <motion.div
              key="uploaded"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className="relative mb-3">
                <img
                  src={currentUrl || preview || ''}
                  alt={label}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(currentUrl || preview || '', '_blank');
                  }}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
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
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
              
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Document uploaded successfully
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default DocumentUpload;
