'use client';

import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, X, AlertCircle, Eye, Trash2, Loader2 } from 'lucide-react';

interface DocumentUploadProps {
  label: string;
  description?: string;
  accept?: string; // e.g., "image/*", "application/pdf"
  maxSizeMB?: number;
  currentUrl?: string;
  onUpload: (file: File, url: string) => void;
  onDelete: () => void;
  required?: boolean;
  className?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  description,
  accept = 'image/*,application/pdf',
  maxSizeMB = 5,
  currentUrl,
  onUpload,
  onDelete,
  required = false,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = accept.split(',').map(t => t.trim());
    const isValidType = validTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType + '/');
      }
      return file.type === type;
    });

    if (!isValidType) {
      setError(`Please select a valid file type (${accept})`);
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setError(null);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Upload file
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    // For MVP, we'll store the file and upload it with the form submission
    // Just call onUpload with the file - the parent component will handle FormData
    setIsUploading(true);
    // Simulate a brief upload state for UX
    setTimeout(() => {
      setIsUploading(false);
      onUpload(file, ''); // Empty URL for now, will be set after backend upload
      setError(null);
    }, 300);
  };

  const handleDelete = () => {
    setPreview(null);
    onDelete();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const fakeEvent = {
        target: { files: [file] }
      } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
          ${currentUrl || preview
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-indigo-400'
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
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : currentUrl || preview ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-3">
              {preview || (currentUrl && currentUrl.match(/\.(jpg|jpeg|png|gif)$/i)) ? (
                <img
                  src={currentUrl || preview || ''}
                  alt={label}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <div className="flex gap-2">
              {currentUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(currentUrl, '_blank');
                  }}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            </div>
            
            <p className="text-xs text-green-600 mt-2">Document uploaded successfully</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500">PNG, JPG, PDF up to {maxSizeMB}MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;

