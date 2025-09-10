import { apiService } from './api';

export interface KYCProfileData {
  // Basic Information
  fullName: string;
  dob: string;
  gender?: string;
  phone: string;
  email: string;
  address: string;
  
  // Academic Information
  college: string;
  courseYear: string;
  studentId: string;
  
  // Stay & Availability
  stayType: string;
  pgDetails?: {
    name: string;
    address: string;
    contact: string;
  };
  hoursPerWeek: number;
  availableDays: string[];
  
  // Verification Documents
  govtIdType: string;
  govtIdFiles: string[];
  photoFile: string;
  
  // Emergency Contact
  emergencyContact: {
    name: string;
    phone: string;
  };
  bloodGroup?: string;
  
  // Work Preferences
  preferredJobTypes: string[];
  experienceSkills?: string;
  
  // Payroll Information
  payroll?: {
    consent: boolean;
    bankAccount?: string;
    ifsc?: string;
    beneficiaryName?: string;
  };
}

export interface KYCResponse {
  success: boolean;
  message: string;
  data: {
    kyc?: KYCProfileData;
  };
}

export interface KYCStatusResponse {
  success: boolean;
  message: string;
  data: {
    status: string;
    submittedAt?: string;
    verifiedAt?: string;
    notes?: string;
  };
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    files: string[];
    count: number;
  };
}

class KYCService {
  private baseUrl = '/kyc'; // Use relative path for Next.js rewrites

  // Get KYC profile
  async getProfile(): Promise<KYCResponse> {
    try {
      const response = await apiService.get(`${this.baseUrl}/profile`);
      return response.data;
    } catch (error: any) {
      console.error("KYC fetch error details:", error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch KYC profile');
    }
  }

  // Save KYC profile (draft)
  async saveProfile(data: Partial<KYCProfileData>): Promise<KYCResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/profile`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to save KYC profile');
    }
  }

  // Submit KYC for verification
  async submitProfile(): Promise<KYCResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/submit`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to submit KYC profile');
    }
  }

  // Upload files
  async uploadFiles(files: File[]): Promise<UploadResponse> {
    try {
      console.log('KYC Service - Uploading files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      if (files.length === 0) {
        throw new Error('No files provided for upload');
      }

      const formData = new FormData();
      files.forEach((file, index) => {
        console.log(`Adding file ${index}:`, file.name, file.size, file.type);
        formData.append('files', file);
      });

      console.log('FormData entries:', Array.from(formData.entries()));

      const response = await apiService.post(`${this.baseUrl}/upload`, formData);
      
      console.log('Upload response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Upload error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw new Error(error.response?.data?.message || 'Failed to upload files');
    }
  }

  // Get KYC verification status
  async getStatus(): Promise<KYCStatusResponse> {
    try {
      const response = await apiService.get(`${this.baseUrl}/status`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch KYC status');
    }
  }

  // Delete KYC profile
  async deleteProfile(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete(`${this.baseUrl}/profile`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete KYC profile');
    }
  }
}

export const kycService = new KYCService();
export default kycService;
