import { IUser } from '../models/User';
import { IKYCDocument } from '../models/KYC';

export interface CanonicalKYCStatus {
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  isVerified: boolean;
  submittedAt?: Date;
  verifiedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  canResubmit: boolean;
}

/**
 * Canonical KYC status computation - Single source of truth
 * This function determines the authoritative KYC status based on user and KYC record
 */
export function computeKycStatus(user: IUser, kycRecord?: IKYCDocument | null): CanonicalKYCStatus {
  // Default state - no KYC submitted
  if (!kycRecord) {
    return {
      status: 'not_submitted',
      isVerified: false,
      canResubmit: true
    };
  }

  // Map verification status to canonical status
  const status = kycRecord.verificationStatus;
  
  // Determine if user is verified (only approved KYC makes user verified)
  const isVerified = status === 'approved';
  
  // Determine if user can resubmit (only rejected KYC allows resubmission)
  const canResubmit = status === 'rejected';

  return {
    status,
    isVerified,
    submittedAt: kycRecord.submittedAt,
    verifiedAt: kycRecord.verifiedAt,
    rejectedAt: kycRecord.rejectedAt,
    rejectionReason: kycRecord.rejectionReason,
    canResubmit
  };
}

/**
 * Validate KYC status consistency between user and KYC record
 * Returns true if consistent, false if inconsistent
 */
export function validateKycConsistency(user: IUser, kycRecord?: IKYCDocument | null): boolean {
  const canonicalStatus = computeKycStatus(user, kycRecord);
  
  // Check if user.isVerified matches canonical status
  if (user.isVerified !== canonicalStatus.isVerified) {
    console.warn(`KYC Consistency Check Failed: User ${user.email} - isVerified mismatch`, {
      userIsVerified: user.isVerified,
      canonicalIsVerified: canonicalStatus.isVerified,
      kycStatus: kycRecord?.verificationStatus || 'not_submitted'
    });
    return false;
  }

  // Check if user.kycStatus matches canonical status
  if (user.kycStatus && user.kycStatus !== canonicalStatus.status) {
    console.warn(`KYC Consistency Check Failed: User ${user.email} - kycStatus mismatch`, {
      userKycStatus: user.kycStatus,
      canonicalStatus: canonicalStatus.status,
      kycStatus: kycRecord?.verificationStatus || 'not_submitted'
    });
    return false;
  }

  return true;
}

/**
 * Get status display message for frontend
 */
export function getKycStatusMessage(status: CanonicalKYCStatus): string {
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
