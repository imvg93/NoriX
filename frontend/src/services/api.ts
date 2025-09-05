const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Debug: Log the API base URL
console.log('🔧 API_BASE_URL:', API_BASE_URL);
console.log('🔧 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

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
  student: string;
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

    const { skipAuth, headers: extraHeaders, ...restOptions } = options as any;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...extraHeaders,
      },
      credentials: 'include', // Include cookies for CORS
      ...restOptions,
    };

    try {
      console.log('🌐 Fetch config:', {
        url,
        method: config.method || 'GET',
        headers: config.headers,
        credentials: config.credentials
      });
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch (_) {
          // ignore JSON parse failure
        }
        const message =
          errorData?.message ||
          errorData?.error?.message ||
          (Array.isArray(errorData?.errors) && errorData.errors[0]?.message) ||
          (typeof errorData === 'string' ? errorData : `HTTP error! status: ${response.status}`);

        const err: any = new Error(message);
        err.status = response.status;
        err.details = errorData;
        throw err;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication APIs
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

  async sendOTP(email: string, purpose: 'verification' | 'password-reset' | 'login') {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    });
  }

  async verifyOTP(email: string, otp: string, purpose: 'verification' | 'password-reset' | 'login') {
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
    return this.request<User>('/users/profile');
  }

  // Test API connectivity
  async testConnection() {
    return this.request('/test');
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

  // Job APIs
  async getJobs(filters?: any): Promise<JobsResponse> {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = queryParams ? `/jobs?${queryParams}` : '/jobs';
    return this.request<JobsResponse>(endpoint);
  }

  async getJob(id: string): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`);
  }

  async createJob(jobData: any) {
    return this.request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
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
    return this.request<JobsResponse>('/jobs/employer');
  }

  async updateJobStatus(id: string, status: string) {
    return this.request(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }



  // Application APIs
  async applyToJob(jobId: string, applicationData: any) {
    return this.request('/applications', {
      method: 'POST',
      body: JSON.stringify({
        job: jobId,
        ...applicationData,
      }),
    });
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

  // Verification APIs (Admin)
  async getPendingVerifications() {
    return this.request('/verifications/pending');
  }

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

  // Utility methods
  async healthCheck() {
    return this.request('/health');
  }

  // Error handling
  handleError(error: any): string {
    if (error.message) {
      return error.message;
    }
    if (error.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
      return 'Session expired. Please login again.';
    }
    if (error.status === 403) {
      return 'Access denied. You do not have permission to perform this action.';
    }
    if (error.status === 404) {
      return 'Resource not found.';
    }
    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}

export const apiService = new ApiService();
export default apiService;

// Export types for use in components
export type { Job, Application, JobsResponse, ApplicationsResponse, User, AuthResponse };
