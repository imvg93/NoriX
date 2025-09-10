import { apiService } from './api';

export interface KYCStatus {
  isCompleted: boolean;
  status: 'pending' | 'in-review' | 'approved' | 'rejected' | 'not-submitted';
  submittedAt?: string;
  verifiedAt?: string;
  notes?: string;
}

class KYCStatusService {
  // Check if KYC is completed for the current user
  async checkKYCStatus(): Promise<KYCStatus> {
    try {
      const response = await apiService.request('/kyc/status');
      return {
        isCompleted: response.data.status === 'approved',
        status: response.data.status,
        submittedAt: response.data.submittedAt,
        verifiedAt: response.data.verifiedAt,
        notes: response.data.notes
      };
    } catch (error: any) {
      // If no KYC found, return not-submitted status
      if (error.status === 404 || error.message?.includes('not found')) {
        return {
          isCompleted: false,
          status: 'not-submitted'
        };
      }
      throw error;
    }
  }

  // Check if KYC is completed (simple boolean check)
  async isKYCCompleted(): Promise<boolean> {
    try {
      const status = await this.checkKYCStatus();
      return status.isCompleted;
    } catch (error) {
      console.error('Error checking KYC status:', error);
      return false;
    }
  }

  // Get KYC profile data
  async getKYCProfile() {
    try {
      const response = await apiService.request('/kyc/profile');
      return response.data.kyc;
    } catch (error: any) {
      if (error.status === 404) {
        return null; // No KYC profile found
      }
      throw error;
    }
  }
}

export const kycStatusService = new KYCStatusService();
export default kycStatusService;
