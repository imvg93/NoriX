import { apiService } from './api';

export interface KYCStatus {
  isCompleted: boolean;
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  notes?: string;
  rejectionReason?: string;
  canResubmit?: boolean;
  message?: string;
}

class KYCStatusService {
  private static instance: KYCStatusService;
  private cache: Map<string, { data: KYCStatus; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  public static getInstance(): KYCStatusService {
    if (!KYCStatusService.instance) {
      KYCStatusService.instance = new KYCStatusService();
    }
    return KYCStatusService.instance;
  }

  // Check if KYC is completed for the current user - SINGLE SOURCE OF TRUTH
  async checkKYCStatus(): Promise<KYCStatus> {
    try {
      // Use the canonical student profile endpoint as single source of truth
      const response = await apiService.get('/kyc/student/profile');
      const data = response.data;
      
      const status: KYCStatus = {
        isCompleted: data.status?.status === 'approved',
        status: data.status?.status || 'not_submitted',
        submittedAt: data.status?.submittedAt,
        verifiedAt: data.status?.verifiedAt,
        rejectedAt: data.status?.rejectedAt,
        notes: data.status?.notes,
        rejectionReason: data.status?.rejectionReason,
        canResubmit: data.status?.canResubmit || false,
        message: data.status?.message
      };

      // Cache the result
      this.cache.set('current_user', { data: status, timestamp: Date.now() });
      
      return status;
    } catch (error: any) {
      console.error('Error checking KYC status:', error);
      
      // If no KYC found, return not-submitted status
      if (error.status === 404 || error.message?.includes('not found')) {
        const status: KYCStatus = {
          isCompleted: false,
          status: 'not_submitted',
          canResubmit: true
        };
        this.cache.set('current_user', { data: status, timestamp: Date.now() });
        return status;
      }
      throw error;
    }
  }

  // Get cached status if available and not expired
  getCachedStatus(): KYCStatus | null {
    const cached = this.cache.get('current_user');
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  // Clear cache (useful for real-time updates)
  clearCache(): void {
    this.cache.clear();
  }

  // Update cache with new status (for real-time updates)
  updateCache(status: KYCStatus): void {
    this.cache.set('current_user', { data: status, timestamp: Date.now() });
  }

  // Get status display message
  getStatusMessage(status: KYCStatus): string {
    if (status.message) {
      return status.message;
    }

    switch (status.status) {
      case 'not_submitted':
        return 'Please complete your KYC details.';
      case 'pending':
        return '⏳ Your KYC is under verification. Please wait.';
      case 'approved':
        return '✅ Your profile is verified. You can now explore and apply for jobs.';
      case 'rejected':
        return `❌ Your KYC was rejected. Please re-submit with proper details.${status.rejectionReason ? ` Reason: ${status.rejectionReason}` : ''}`;
      default:
        return 'KYC status unknown.';
    }
  }

  // Check if user can submit KYC
  canSubmitKYC(status: KYCStatus): boolean {
    return status.status === 'not_submitted' || 
           (status.status === 'rejected' && (status.canResubmit ?? false));
  }

  // Force refresh KYC status (bypasses cache)
  async forceRefreshKYCStatus(): Promise<KYCStatus> {
    try {
      // Clear cache first
      this.clearCache();
      
      // Use the refresh endpoint
      const response = await apiService.post('/kyc/refresh-status');
      const data = response.data;
      
      const status: KYCStatus = {
        isCompleted: data.status?.status === 'approved',
        status: data.status?.status || 'not_submitted',
        submittedAt: data.status?.submittedAt,
        verifiedAt: data.status?.verifiedAt,
        rejectedAt: data.status?.rejectedAt,
        notes: data.status?.notes,
        rejectionReason: data.status?.rejectionReason,
        canResubmit: data.status?.canResubmit || false,
        message: data.status?.message
      };

      // Update cache with fresh data
      this.cache.set('current_user', { data: status, timestamp: Date.now() });
      
      return status;
    } catch (error: any) {
      console.error('Error force refreshing KYC status:', error);
      throw error;
    }
  }

  // Check if user can resubmit KYC
  canResubmitKYC(status: KYCStatus): boolean {
    return status.status === 'rejected' && (status.canResubmit ?? false);
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
      const response = await apiService.get('/kyc/profile');
      return response.data.kyc;
    } catch (error: any) {
      if (error.status === 404) {
        return null; // No KYC profile found
      }
      throw error;
    }
  }
}

export const kycStatusService = KYCStatusService.getInstance();
export default kycStatusService;