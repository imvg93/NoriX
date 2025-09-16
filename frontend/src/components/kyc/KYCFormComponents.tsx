"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Calendar,
  ChevronDown,
  HelpCircle,
  FileText
} from 'lucide-react';

// Input Component
interface InputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  help?: string;
  disabled?: boolean;
  maxLength?: number;
  autoComplete?: string;
}

export const KYCInput: React.FC<InputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  help,
  disabled = false,
  maxLength,
  autoComplete
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const togglePassword = () => setShowPassword(!showPassword);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="kyc-form-group">
      <label 
        htmlFor={name}
        className={`kyc-label ${required ? 'kyc-label--required' : ''}`}
      >
        {label}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={`kyc-input ${error ? 'kyc-input--error' : ''} ${isFocused ? 'kyc-focus-visible' : ''}`}
          aria-describedby={error ? `${name}-error` : help ? `${name}-help` : undefined}
          aria-invalid={error ? 'true' : 'false'}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="kyc-error"
            id={`${name}-error`}
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {help && !error && (
        <div className="kyc-small kyc-text-muted mt-1" id={`${name}-help`}>
          {help}
        </div>
      )}
    </div>
  );
};

// Textarea Component
interface TextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  help?: string;
  rows?: number;
  maxLength?: number;
}

export const KYCTextarea: React.FC<TextareaProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  help,
  rows = 4,
  maxLength
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="kyc-form-group">
      <label 
        htmlFor={name}
        className={`kyc-label ${required ? 'kyc-label--required' : ''}`}
      >
        {label}
      </label>
      
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`kyc-textarea ${error ? 'kyc-input--error' : ''} ${isFocused ? 'kyc-focus-visible' : ''}`}
        aria-describedby={error ? `${name}-error` : help ? `${name}-help` : undefined}
        aria-invalid={error ? 'true' : 'false'}
      />

      {maxLength && (
        <div className="kyc-xs kyc-text-muted mt-1 text-right">
          {value.length}/{maxLength}
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="kyc-error"
            id={`${name}-error`}
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {help && !error && (
        <div className="kyc-small kyc-text-muted mt-1" id={`${name}-help`}>
          {help}
        </div>
      )}
    </div>
  );
};

// Select Component
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  help?: string;
  disabled?: boolean;
}

export const KYCSelect: React.FC<SelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required = false,
  error,
  help,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="kyc-form-group">
      <label 
        htmlFor={name}
        className={`kyc-label ${required ? 'kyc-label--required' : ''}`}
      >
        {label}
      </label>
      
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={`kyc-select ${error ? 'kyc-input--error' : ''} ${isFocused ? 'kyc-focus-visible' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex items-center justify-between`}
          aria-describedby={error ? `${name}-error` : help ? `${name}-help` : undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
              role="listbox"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  disabled={option.disabled}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${option.value === value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}`}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="kyc-error"
            id={`${name}-error`}
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {help && !error && (
        <div className="kyc-small kyc-text-muted mt-1" id={`${name}-help`}>
          {help}
        </div>
      )}
    </div>
  );
};

// Date Picker Component
interface DatePickerProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  help?: string;
  minDate?: string;
  maxDate?: string;
}

export const KYCDatePicker: React.FC<DatePickerProps> = ({
  label,
  name,
  value,
  onChange,
  required = false,
  error,
  help,
  minDate,
  maxDate
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="kyc-form-group">
      <label 
        htmlFor={name}
        className={`kyc-label ${required ? 'kyc-label--required' : ''}`}
      >
        {label}
      </label>
      
      <div className="relative">
        <input
          id={name}
          name={name}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          min={minDate}
          max={maxDate}
          className={`kyc-input ${error ? 'kyc-input--error' : ''} ${isFocused ? 'kyc-focus-visible' : ''}`}
          aria-describedby={error ? `${name}-error` : help ? `${name}-help` : undefined}
          aria-invalid={error ? 'true' : 'false'}
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="kyc-error"
            id={`${name}-error`}
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {help && !error && (
        <div className="kyc-small kyc-text-muted mt-1" id={`${name}-help`}>
          {help}
        </div>
      )}
    </div>
  );
};

// File Upload Component
interface FileUploadProps {
  label: string;
  name: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  required?: boolean;
  error?: string;
  help?: string;
  preview?: boolean;
}

export const KYCFileUpload: React.FC<FileUploadProps> = ({
  label,
  name,
  files,
  onChange,
  accept = 'image/*',
  multiple = false,
  maxFiles = 1,
  maxSize = 5,
  required = false,
  error,
  help,
  preview = true
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    setIsUploading(true);
    
    // Validate files
    const validFiles = newFiles.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`);
        return false;
      }
      return true;
    });

    if (multiple) {
      const combinedFiles = [...files, ...validFiles].slice(0, maxFiles);
      onChange(combinedFiles);
    } else {
      onChange(validFiles.slice(0, 1));
    }
    
    setIsUploading(false);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="kyc-form-group">
      <label className={`kyc-label ${required ? 'kyc-label--required' : ''}`}>
        {label}
      </label>

      <div
        className={`kyc-file-upload ${isDragOver ? 'kyc-file-upload--dragover' : ''} ${isUploading ? 'kyc-loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          aria-describedby={error ? `${name}-error` : help ? `${name}-help` : undefined}
        />

        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <div className="kyc-spinner" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
          
          <div className="text-center">
            <p className="kyc-body font-medium text-gray-900">
              {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="kyc-small kyc-text-muted mt-1">
              {accept.includes('image') ? 'PNG, JPG, JPEG up to' : 'Files up to'} {maxSize}MB
            </p>
          </div>

          <button
            type="button"
            className="kyc-btn kyc-btn--secondary kyc-btn--sm"
            onClick={(e) => {
              e.stopPropagation();
              openFileDialog();
            }}
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </button>
        </div>
      </div>

      {/* File Previews */}
      {preview && files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="kyc-small font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="kyc-xs kyc-text-muted">
                  {formatFileSize(file.size)}
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="kyc-error"
            id={`${name}-error`}
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {help && !error && (
        <div className="kyc-small kyc-text-muted mt-1" id={`${name}-help`}>
          {help}
        </div>
      )}
    </div>
  );
};

// Chips Component
interface ChipOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ChipsProps {
  label: string;
  name: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: ChipOption[];
  required?: boolean;
  error?: string;
  help?: string;
  maxSelections?: number;
}

export const KYCChips: React.FC<ChipsProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  error,
  help,
  maxSelections
}) => {
  const toggleChip = (chipValue: string) => {
    if (value.includes(chipValue)) {
      onChange(value.filter(v => v !== chipValue));
    } else if (!maxSelections || value.length < maxSelections) {
      onChange([...value, chipValue]);
    }
  };

  return (
    <div className="kyc-form-group">
      <label className={`kyc-label ${required ? 'kyc-label--required' : ''}`}>
        {label}
        {maxSelections && (
          <span className="kyc-text-muted"> (Select up to {maxSelections})</span>
        )}
      </label>

      <div className="kyc-chips">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => !option.disabled && toggleChip(option.value)}
            disabled={option.disabled}
            className={`kyc-chip ${value.includes(option.value) ? 'kyc-chip--selected' : ''} ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-pressed={value.includes(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="kyc-error"
            id={`${name}-error`}
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {help && !error && (
        <div className="kyc-small kyc-text-muted mt-1" id={`${name}-help`}>
          {help}
        </div>
      )}
    </div>
  );
};

// Radio Group Component
interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  required?: boolean;
  error?: string;
  help?: string;
}

export const KYCRadioGroup: React.FC<RadioGroupProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  error,
  help
}) => {
  return (
    <div className="kyc-form-group">
      <fieldset>
        <legend className={`kyc-label ${required ? 'kyc-label--required' : ''}`}>
          {label}
        </legend>
        
        <div className="space-y-3 mt-2">
          {options.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                value === option.value 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => !option.disabled && onChange(option.value)}
                disabled={option.disabled}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                aria-describedby={error ? `${name}-error` : help ? `${name}-help` : undefined}
              />
              
              <div className="flex-1">
                <div className="kyc-body font-medium text-gray-900">
                  {option.label}
                </div>
                {option.description && (
                  <div className="kyc-small kyc-text-muted mt-1">
                    {option.description}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="kyc-error"
            id={`${name}-error`}
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {help && !error && (
        <div className="kyc-small kyc-text-muted mt-1" id={`${name}-help`}>
          {help}
        </div>
      )}
    </div>
  );
};

// Checkbox Component
interface CheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  required?: boolean;
  error?: string;
  help?: string;
}

export const KYCCheckbox: React.FC<CheckboxProps> = ({
  label,
  name,
  checked,
  onChange,
  description,
  required = false,
  error,
  help
}) => {
  return (
    <div className="kyc-form-group">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          aria-describedby={error ? `${name}-error` : help ? `${name}-help` : undefined}
          aria-invalid={error ? 'true' : 'false'}
        />
        
        <div className="flex-1">
          <div className={`kyc-body font-medium ${required ? 'kyc-label--required' : ''}`}>
            {label}
          </div>
          {description && (
            <div className="kyc-small kyc-text-muted mt-1">
              {description}
            </div>
          )}
        </div>
      </label>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="kyc-error"
            id={`${name}-error`}
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {help && !error && (
        <div className="kyc-small kyc-text-muted mt-1" id={`${name}-help`}>
          {help}
        </div>
      )}
    </div>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export const KYCProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  label
}) => {
  const percentage = (current / total) * 100;

  return (
    <div className="kyc-progress-container">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="kyc-small font-medium text-gray-700">{label}</span>
          <span className="kyc-small text-gray-500">{current}/{total}</span>
        </div>
      )}
      
      <div className="kyc-progress">
        <motion.div
          className="kyc-progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// Help Tooltip Component
interface HelpTooltipProps {
  content: string;
  children: React.ReactNode;
}

export const KYCHelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="inline-flex items-center gap-1"
      >
        {children}
        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
      </div>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg"
          >
            <div className="text-center">{content}</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
