// Determine API base URL based on environment
import { ApiErrorHandler, withErrorHandling } from '../utils/errorHandler';

const getApiBaseUrl = () => {
  // Check if we're running in browser (client-side)
  if (typeof window !== 'undefined') {
    // If NEXT_PUBLIC_API_URL is set, use it (highest priority)
    if (process.env.NEXT_PUBLIC_API_URL) {
      console.log('🔧 Using NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
      return process.env.NEXT_PUBLIC_API_URL as string;
    }
    
    // Check if we're on Vercel (production deployment)
    if (window.location.hostname.includes('vercel.app')) {
      // For Vercel deployment, use Railway backend
      const railwayUrl = 'https://studentjobs-backend-production.up.railway.app/api';
      console.log('🔧 Vercel deployment detected, using Railway backend:', railwayUrl);
      return railwayUrl;
    }
    
    // For development, check if we're on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const localUrl = 'http://localhost:5000/api';
      console.log('🔧 Local development detected, using local backend:', localUrl);
      return localUrl;
    }
    
    // Default fallback for other environments
    const fallbackUrl = 'http://localhost:5000/api';
    console.log('🔧 Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }
  
  // Server-side rendering fallback
  const ssrUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  console.log('🔧 Server-side rendering, using:', ssrUrl);
  return ssrUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Debug: Log the API base URL
console.log('🔧 API_BASE_URL:', API_BASE_URL);
console.log('🔧 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

// API Response Types
interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: number;
  payType?: string;
  type: string;
  category: string;
  status: string;
  employer: string;
  createdAt: string;
  views?: number;
  applicationsCount?: number;
  requirements?: string[];
}

interface Application {
  _id: string;
  job: Job;
  student: string | {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    college?: string;
    skills?: string[];
  };
  employer: string;
  status: string;
  appliedDate: string;
  coverLetter?: string;
  expectedPay?: number;
  availability?: string;
}

interface JobsResponse {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ApplicationsResponse {
  applications: Application[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  userType: 'student' | 'employer' | 'admin';
  college?: string;
  skills?: string[];
  availability?: string;
  companyName?: string;
  businessType?: string;
  address?: string;
  isVerified?: boolean;
  emailVerified?: boolean;
  createdAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

class ApiService {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { skipAuth?: boolean } = {}
  ): Promise<T> {
    const token = this.getToken();
    const url = `${API_BASE_URL}${endpoint}`;

    console.log('🌐 Making API request to:', url);

    const { skipAuth, headers: extraHeaders, body, ...restOptions } = options as any;

    const config: RequestInit = {
      headers: {
        ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...extraHeaders,
        // Don't set Content-Type for FormData - let browser set it with boundary
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      },
      credentials: 'include', // Include cookies for CORS
      body,
      ...restOptions,
    };

    try {
      console.log('🌐 Fetch config:', {
        url,
        method: config.method || 'GET',
        headers: config.headers,
        credentials: config.credentials,
        body: config.body
      });
      
      const response = await fetch(url, config);
      
      console.log('🌐 Response status:', response.status);
      console.log('🌐 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch (_) {
          // ignore JSON parse failure
        }
        
        // Only log error details if there's actual error data
        if (errorData && Object.keys(errorData).length > 0) {
          console.error('🌐 Error response:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
        } else {
          console.log(`🌐 HTTP ${response.status} ${response.statusText} - no error details`);
        }
        
        // Handle authentication errors
        if (response.status === 401) {
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Redirect to login if not already there
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          
          throw new Error('Authentication failed. Please login again.');
        }
        
        const message =
          errorData?.message ||
          errorData?.error?.message ||
          (Array.isArray(errorData?.errors) && errorData.errors[0]?.message) ||
          (typeof errorData === 'string' ? errorData : `HTTP ${response.status} ${response.statusText}`);

        const err: any = new Error(message);
        err.status = response.status;
        err.details = errorData;
        throw err;
      }

      const responseData = await response.json();
      console.log('🌐 Success response:', responseData);
      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication APIs
  async login(email: string, password: string, userType: string): Promise<AuthResponse> {
    console.log('🔐 Login API call:', { email, userType, apiUrl: API_BASE_URL });
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, userType }),
    });
  }

  async loginAuto(email: string, password: string): Promise<AuthResponse> {
    console.log('🔐 Auto-login API call:', { email, apiUrl: API_BASE_URL });
    return this.request('/auth/login-auto', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async loginRequestOTP(email: string, userType: string): Promise<{ message: string; email: string; userType: string }> {
    return this.request('/auth/login-request-otp', {
      method: 'POST',
      body: JSON.stringify({ email, userType }),
    });
  }

  async loginVerifyOTP(email: string, userType: string, otp: string): Promise<AuthResponse> {
    return this.request('/auth/login-verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, userType, otp }),
    });
  }

  async register(userData: any): Promise<AuthResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async sendOTP(
    email: string,
    purpose: 'verification' | 'password-reset' | 'login' | 'signup',
    userType?: 'student' | 'employer' | 'admin'
  ) {
    const body: any = { email, purpose };
    if (userType) body.userType = userType;
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async verifyOTP(
    email: string,
    otp: string,
    purpose: 'verification' | 'password-reset' | 'login' | 'signup'
  ) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, purpose }),
    });
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  async getProfile(): Promise<User> {
    const response = await this.request<{ user: User }>('/users/profile');
    return response.user;
  }

  // Employer KYC APIs
  async getEmployerKYCStatus(employerId: string): Promise<{ status: string; kyc?: any; user?: any }> {
    try {
      console.log('🔍 Fetching KYC status for employer:', employerId);
      const res = await this.request<any>(`/kyc/employer/${employerId}/status`);
      const data = res?.data || res;
      console.log('📊 KYC Status Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching KYC status:', error);
      throw error;
    }
  }

  async submitEmployerKYC(payload: { 
    companyName: string; 
    companyEmail?: string;
    companyPhone?: string;
    authorizedName?: string;
    designation?: string;
    address?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
    GSTNumber?: string; 
    PAN?: string; 
    documents?: any 
  }) {
    try {
      console.log('📝 Submitting Employer KYC:', payload);
      const res = await this.request<any>(`/kyc/employer`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = res?.data || res;
      console.log('✅ KYC Submission Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Error submitting KYC:', error);
      throw error;
    }
  }

  // Refresh KYC status (useful after submission)
  async refreshEmployerKYCStatus(employerId: string): Promise<{ status: string; kyc?: any; user?: any }> {
    try {
      console.log('🔄 Refreshing KYC status for employer:', employerId);
      // Add a small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.getEmployerKYCStatus(employerId);
    } catch (error) {
      console.error('❌ Error refreshing KYC status:', error);
      throw error;
    }
  }

  async uploadKYCDocument(file: File, documentType: 'aadhar' | 'pan' | 'passport' | 'driving_license') {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    const res = await this.request<any>(`/upload/kyc-document`, {
      method: 'POST',
      body: formData,
    });
    return res?.data || res;
  }

  // Test API connectivity
  async testConnection() {
    return this.request('/test');
  }

  // Generic HTTP methods for KYC service
  async get<T = any>(endpoint: string): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint);
    return { data };
  }

  async post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    });
    return { data };
  }

  async put<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    });
    return { data };
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
    return { data };
  }

  async updateProfile(userData: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Avatar upload failed');
    }

    return response.json();
  }

  // Enhanced Job APIs (using the new enhanced job system)
  async createJob(jobData: any) {
    return this.request('/enhanced-jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async getStudentDashboardJobs(showHighlighted = true) {
    const queryParams = new URLSearchParams({ showHighlighted: showHighlighted.toString() });
    return this.request(`/enhanced-jobs/student-dashboard?${queryParams}`);
  }

  async getEmployerDashboardJobs() {
    return this.request('/enhanced-jobs/employer-dashboard');
  }

  async applyToJobEnhanced(jobId: string, applicationData: any) {
    return this.request(`/enhanced-jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }


  async getStudentApplications(status?: string) {
    const queryParams = status ? new URLSearchParams({ status }) : '';
    const endpoint = queryParams ? `/enhanced-jobs/applications/student?${queryParams}` : '/enhanced-jobs/applications/student';
    return this.request(endpoint);
  }

  async getEmployerApplications(status?: string, jobId?: string): Promise<ApplicationsResponse> {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (jobId) queryParams.append('jobId', jobId);
    const endpoint = queryParams.toString() ? `/enhanced-jobs/applications/employer?${queryParams}` : '/enhanced-jobs/applications/employer';
    return this.request<ApplicationsResponse>(endpoint);
  }

  // Legacy Job APIs (keeping for backward compatibility)
  async getJobs(filters?: any): Promise<JobsResponse> {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = queryParams ? `/jobs?${queryParams}` : '/jobs';
    return this.request<JobsResponse>(endpoint);
  }

  async getJob(jobId: string) {
    return this.request(`/jobs/${jobId}`);
  }

  async applyForJob(jobId: string) {
    return this.request(`/enhanced-jobs/${jobId}/apply`, {
      method: 'POST',
    });
  }

  async approveApplication(applicationId: string) {
    return this.request(`/enhanced-jobs/applications/${applicationId}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectApplication(applicationId: string) {
    return this.request(`/enhanced-jobs/applications/${applicationId}/reject`, {
      method: 'PATCH',
    });
  }

  async updateJob(id: string, jobData: any) {
    return this.request(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  async deleteJob(id: string) {
    return this.request(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  async getEmployerJobs(): Promise<JobsResponse> {
    return this.request<JobsResponse>('/jobs/employer/jobs');
  }

  async updateJobStatus(id: string, status: string) {
    return this.request(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }



  // Application APIs
  async applyToJob(jobId: string, applicationData: any) {
    try {
      console.log('📝 Applying to job:', jobId, applicationData);
      const response = await this.request('/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobId: jobId, // Use jobId instead of job for consistency
          ...applicationData,
        }),
      });
      console.log('✅ Job application submitted successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error applying to job:', error);
      throw error;
    }
  }

  async getUserApplications(): Promise<ApplicationsResponse> {
    return this.request<ApplicationsResponse>('/applications/my-applications');
  }

  async getJobApplications(jobId: string): Promise<ApplicationsResponse> {
    return this.request<ApplicationsResponse>(`/applications/job/${jobId}`);
  }

  async updateApplicationStatus(id: string, status: string, notes?: string) {
    return this.request(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  async withdrawApplication(id: string) {
    return this.request(`/applications/${id}/withdraw`, {
      method: 'PATCH',
    });
  }

  async rateApplication(id: string, rating: number, feedback?: string) {
    return this.request(`/applications/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    });
  }



  // User Management APIs (Admin)
  async getAllUsers(filters?: any) {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = queryParams ? `/users?${queryParams}` : '/users';
    return this.request(endpoint);
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async suspendUser(id: string) {
    return this.request(`/users/${id}/suspend`, {
      method: 'PATCH',
    });
  }

  async activateUser(id: string) {
    return this.request(`/users/${id}/activate`, {
      method: 'PATCH',
    });
  }

  // Admin Dashboard APIs
  async getPendingUsers(userType: 'student' | 'employer') {
    return this.request(`/admin/users/pending?userType=${userType}`);
  }

  async getPendingJobs() {
    return this.request('/admin/jobs/pending');
  }

  async getKYCStats() {
    return this.request('/admin/kyc/stats');
  }

  // User approval methods
  async approveUser(userId: string) {
    return this.request(`/admin/users/${userId}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectUser(userId: string, reason: string) {
    return this.request(`/admin/users/${userId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  // Verification APIs (Admin)
  // Pending verifications removed - no approval needed

  async approveVerification(id: string) {
    return this.request(`/verifications/${id}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectVerification(id: string, reason: string) {
    return this.request(`/verifications/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  // Analytics APIs (Admin)
  async getPlatformStats() {
    return this.request('/analytics/platform');
  }

  async getUserStats() {
    return this.request('/analytics/users');
  }

  async getJobAnalytics() {
    return this.request('/analytics/jobs');
  }

  async getApplicationAnalytics() {
    return this.request('/analytics/applications');
  }

  // Admin Approval APIs
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  // User approval/rejection removed - no approval needed for login/signup


  // KYC Management APIs (Admin)
  async getKYCSubmissions(status = 'all', page = 1, limit = 10) {
    const queryParams = new URLSearchParams({
      status,
      page: page.toString(),
      limit: limit.toString()
    });
    return this.request(`/admin/kyc?${queryParams}`);
  }

  async getKYCSubmissionDetails(kycId: string) {
    return this.request(`/admin/kyc/${kycId}`);
  }

  async approveKYC(kycId: string) {
    return this.request(`/admin/kyc/${kycId}/approve`, {
      method: 'PUT',
    });
  }

  async rejectKYC(kycId: string, reason: string) {
    return this.request(`/admin/kyc/${kycId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  // Employer Job Management APIs (Admin)
  async getAllJobsForAdmin(status?: string, approvalStatus?: string, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (approvalStatus && approvalStatus !== 'all') params.append('approvalStatus', approvalStatus);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      console.log('🔍 Fetching admin jobs with params:', params.toString());
      
      const response = await this.request(`/jobs/admin?${params}`, {
        method: 'GET',
      });
      
      console.log('📊 Admin jobs response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching admin jobs:', error);
      throw error;
    }
  }

  // Employer KYC Management APIs (Admin)
  async getAllKYCRecords(status?: string, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      console.log('🔍 Fetching employer KYC with params:', params.toString());
      
      const response = await this.request(`/kyc/admin/all?${params}`, {
        method: 'GET',
      });
      
      console.log('📊 Employer KYC response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching employer KYC:', error);
      throw error;
    }
  }

  async approveEmployerKYC(kycId: string) {
    try {
      console.log('✅ Approving employer KYC:', kycId);
      const response = await this.request(`/kyc/admin/${kycId}/approve`, {
        method: 'PATCH',
      });
      console.log('📊 Approve KYC response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error approving employer KYC:', error);
      throw error;
    }
  }

  async rejectEmployerKYC(kycId: string, rejectionReason: string) {
    try {
      console.log('❌ Rejecting employer KYC:', kycId, 'Reason:', rejectionReason);
      const response = await this.request(`/kyc/admin/${kycId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason }),
      });
      console.log('📊 Reject KYC response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error rejecting employer KYC:', error);
      throw error;
    }
  }

  // Job Management APIs (Admin)
  async approveJob(jobId: string) {
    try {
      console.log('✅ Approving job:', jobId);
      console.log('🌐 API Base URL:', API_BASE_URL);
      console.log('🌐 Full endpoint:', `${API_BASE_URL}/jobs/${jobId}/approve`);
      
      const response = await this.request(`/jobs/${jobId}/approve`, {
        method: 'PATCH',
      });
      console.log('📊 Approve job response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error approving job:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.status,
        details: (error as any)?.details,
        endpoint: `/jobs/${jobId}/approve`,
        apiUrl: API_BASE_URL
      });
      throw error;
    }
  }

  async rejectJob(jobId: string, rejectionReason: string) {
    try {
      console.log('❌ Rejecting job:', jobId, 'Reason:', rejectionReason);
      console.log('🌐 API Base URL:', API_BASE_URL);
      console.log('🌐 Full endpoint:', `${API_BASE_URL}/jobs/${jobId}/reject`);
      
      const response = await this.request(`/jobs/${jobId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason }),
      });
      console.log('📊 Reject job response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error rejecting job:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.status,
        details: (error as any)?.details,
        endpoint: `/jobs/${jobId}/reject`,
        apiUrl: API_BASE_URL
      });
      throw error;
    }
  }

  // Utility methods
  async healthCheck() {
    return this.request('/health');
  }

  // Error handling
  handleError(error: any): string {
    // Check if error has a specific message
    if (error.message) {
      // Handle specific authentication errors
      if (error.message.includes('Incorrect password')) {
        return 'The password you entered is incorrect. Please check your password and try again.';
      }
      if (error.message.includes('No account found')) {
        return 'No account found with this email address. Please check your email or sign up for a new account.';
      }
      if (error.message.includes('Invalid user type')) {
        return 'Invalid user type for this account. Please try a different user type.';
      }
      if (error.message.includes('Account is deactivated')) {
        return 'Your account has been deactivated. Please contact support for assistance.';
      }
      if (error.message.includes('Invalid email or password')) {
        return 'The email or password you entered is incorrect. Please check and try again.';
      }
      if (error.message.includes('User not found')) {
        return 'No account found with this email address. Please check your email or sign up for a new account.';
      }
      if (error.message.includes('Invalid OTP')) {
        return 'The OTP you entered is incorrect. Please check the 6-digit code sent to your email.';
      }
      if (error.message.includes('OTP expired')) {
        return 'The OTP has expired. Please request a new one.';
      }
      if (error.message.includes('Email not verified')) {
        return 'Please verify your email address before logging in. Check your inbox for a verification email.';
      }
      if (error.message.includes('Account suspended')) {
        return 'Your account has been suspended. Please contact support for assistance.';
      }
      if (error.message.includes('Too many attempts')) {
        return 'Too many login attempts. Please wait a few minutes before trying again.';
      }
      
      // Handle validation errors
      if (error.message.includes('Email is required')) {
        return 'Please enter your email address.';
      }
      if (error.message.includes('Password is required')) {
        return 'Please enter your password.';
      }
      if (error.message.includes('Invalid email format')) {
        return 'Please enter a valid email address (e.g., user@example.com).';
      }
      if (error.message.includes('Password too short')) {
        return 'Password must be at least 6 characters long.';
      }
      
      // Return the original message if it's user-friendly
      return error.message;
    }
    
    // Handle HTTP status codes
    if (error.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
      return 'Your session has expired. Please log in again.';
    }
    if (error.status === 403) {
      return 'You do not have permission to perform this action. Please contact support if you believe this is an error.';
    }
    if (error.status === 404) {
      return 'The requested resource was not found. Please check your request and try again.';
    }
    if (error.status === 422) {
      return 'Please check your input and try again. Some fields may be missing or invalid.';
    }
    if (error.status === 429) {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    if (error.status >= 500) {
      return 'Server error occurred. Please try again in a few moments. If the problem persists, contact support.';
    }
    
    return 'Something went wrong. Please try again or contact support if the problem continues.';
  }

  // Admin Reports APIs
  async getUserStatistics() {
    try {
      console.log('📊 Fetching user statistics...');
      const response = await this.request('/admin/reports/users', {
        method: 'GET',
      });
      console.log('📊 User statistics response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching user statistics:', error);
      throw error;
    }
  }

  async getComprehensiveStatistics() {
    try {
      console.log('📊 Fetching comprehensive statistics...');
      const response = await this.request('/admin/reports/comprehensive', {
        method: 'GET',
      });
      console.log('📊 Comprehensive statistics response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching comprehensive statistics:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService;

// Export types for use in components
export type { Job, Application, JobsResponse, ApplicationsResponse, User, AuthResponse };
