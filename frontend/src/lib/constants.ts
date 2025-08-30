export const APP_NAME = 'StudentJobs';
export const APP_DESCRIPTION = 'Connecting students with part-time job opportunities';

export const USER_TYPES = {
  STUDENT: 'student',
  EMPLOYER: 'employer',
  ADMIN: 'admin',
} as const;

export const JOB_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CLOSED: 'closed',
  DRAFT: 'draft',
} as const;

export const APPLICATION_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

export const JOB_CATEGORIES = [
  'Technology',
  'Marketing',
  'Sales',
  'Customer Service',
  'Content Writing',
  'Graphic Design',
  'Data Entry',
  'Teaching',
  'Research',
  'Other',
] as const;

export const LOCATIONS = [
  'Hyderabad',
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Chennai',
  'Pune',
  'Kolkata',
  'Remote',
] as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
    VERIFY_OTP: '/api/auth/verify-otp',
  },
  JOBS: {
    LIST: '/api/jobs',
    CREATE: '/api/jobs',
    UPDATE: '/api/jobs/:id',
    DELETE: '/api/jobs/:id',
    APPLY: '/api/jobs/:id/apply',
  },
  APPLICATIONS: {
    LIST: '/api/applications',
    UPDATE: '/api/applications/:id',
  },
  USERS: {
    LIST: '/api/users',
    PROFILE: '/api/users/:id',
    UPDATE: '/api/users/:id',
  },
} as const;
