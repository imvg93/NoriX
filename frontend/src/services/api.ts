// Determine API base URL based on environment
import { ApiErrorHandler, withErrorHandling } from '../utils/errorHandler';

const getApiBaseUrl = () => {
  // Use NEXT_PUBLIC_API_URL if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('🔧 Using NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Detect environment
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('vercel.app')) {
      const railwayUrl = 'https://studentjobs-backend-production.up.railway.app/api';
      console.log('🔧 Vercel deployment detected, using Railway backend:', railwayUrl);
      return railwayUrl;
    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const localUrl = 'http://localhost:5000/api';
      console.log('🔧 Local development detected, using local backend:', localUrl);
      return localUrl;
    }
  }

  // Server-side or fallback
  const fallbackUrl = 'http://localhost:5000/api';
  console.log('🔧 Fallback API URL:', fallbackUrl);
  return fallbackUrl;
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
  highlighted?: boolean;
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
  role: 'user' | 'admin';
  college?: string;
  skills?: string[];
  availability?: string;
  companyName?: string;
  businessType?: string;
  address?: string;
  employerCategory?: 'corporate' | 'local_business' | 'individual';
  isVerified?: boolean;
  emailVerified?: boolean;
  kycStatus?: 'not-submitted' | 'pending' | 'approved' | 'rejected' | null;
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
      
      // Handle non-OK responses
      if (!response.ok) {
        let errorData: any = null;
        let errorText: string = '';
        try {
          errorText = await response.text();
          if (errorText && errorText.trim().length > 0) {
            try {
              const parsed = JSON.parse(errorText);
              // Only set errorData if parsed result is meaningful (not empty object)
              if (parsed && typeof parsed === 'object') {
                const keys = Object.keys(parsed);
                if (keys.length > 0) {
                  // Check if at least one key has a meaningful value
                  const hasMeaningfulValue = keys.some(key => {
                    const val = parsed[key];
                    return val !== null && val !== undefined && val !== '' && 
                           !(Array.isArray(val) && val.length === 0) &&
                           !(typeof val === 'object' && val !== null && Object.keys(val).length === 0);
                  });
                  if (hasMeaningfulValue) {
                    errorData = parsed;
                  }
                }
              } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
                errorData = { message: parsed };
              }
              
              // If parsing didn't yield meaningful data, use text as message
              if (!errorData) {
                errorData = { message: errorText };
              }
            } catch (parseError) {
              // If JSON parse fails, treat errorText as the message
              errorData = { message: errorText };
            }
          }
        } catch (textError) {
          // If text() fails, create a basic error object
          errorData = { message: `HTTP ${response.status} ${response.statusText}` };
        }
        
        // Check if we have meaningful error data to log
        const hasErrorText = errorText && errorText.trim().length > 0;
        let meaningfulErrorData: any = null;
        let hasMeaningfulErrorData = false;
        
        if (errorData && typeof errorData === 'object' && !Array.isArray(errorData)) {
          // Filter out empty/null/undefined values and empty nested objects
          meaningfulErrorData = Object.keys(errorData).reduce((acc: any, key) => {
            const value = errorData[key];
            if (value !== null && value !== undefined && value !== '') {
              if (Array.isArray(value)) {
                if (value.length > 0) acc[key] = value;
              } else if (typeof value === 'object' && value !== null) {
                const objKeys = Object.keys(value);
                if (objKeys.length > 0) {
                  // Check if nested object has meaningful values
                  const hasNestedValues = objKeys.some(k => {
                    const v = value[k];
                    return v !== null && v !== undefined && v !== '' && 
                           !(Array.isArray(v) && v.length === 0) &&
                           !(typeof v === 'object' && v !== null && Object.keys(v).length === 0);
                  });
                  if (hasNestedValues) acc[key] = value;
                }
              } else {
                acc[key] = value;
              }
            }
            return acc;
          }, {});
          
          // Double-check: ensure we have at least one meaningful key
          const meaningfulKeys = Object.keys(meaningfulErrorData || {});
          hasMeaningfulErrorData = meaningfulKeys.length > 0 && 
            meaningfulKeys.some(key => {
              const val = meaningfulErrorData[key];
              return val !== null && val !== undefined && val !== '' && 
                     !(Array.isArray(val) && val.length === 0) &&
                     !(typeof val === 'object' && val !== null && Object.keys(val).length === 0);
            });
        }
        
        // Only log if we have meaningful content - never log empty objects
        if (hasMeaningfulErrorData && meaningfulErrorData) {
          // Build log object with only meaningful data - never include empty objects
          const logData: any = {
            status: response.status,
            statusText: response.statusText
          };
          
          // Only add meaningful properties, filtering out empty values
          const keys = Object.keys(meaningfulErrorData);
          keys.forEach(key => {
            const val = meaningfulErrorData[key];
            // Only add if value is truly meaningful
            if (val !== null && val !== undefined && val !== '') {
              if (Array.isArray(val) && val.length > 0) {
                logData[key] = val;
              } else if (typeof val === 'object' && val !== null) {
                const objKeys = Object.keys(val);
                // Only add if object has at least one non-empty property
                if (objKeys.length > 0 && objKeys.some(k => {
                  const v = val[k];
                  return v !== null && v !== undefined && v !== '';
                })) {
                  logData[key] = val;
                }
              } else {
                // Primitive value that's not empty
                logData[key] = val;
              }
            }
          });
          
          // Only log if we have more than just status/statusText (i.e., actual error data)
          if (Object.keys(logData).length > 2) {
            console.error('🌐 Error response:', logData);
          } else if (hasErrorText) {
            console.error('🌐 Error response:', {
              status: response.status,
              statusText: response.statusText,
              message: errorText.trim()
            });
          } else {
            console.log(`🌐 HTTP ${response.status} ${response.statusText}`);
          }
        } else if (hasErrorText) {
          // Log text if available
          console.error('🌐 Error response:', {
            status: response.status,
            statusText: response.statusText,
            message: errorText.trim()
          });
        } else {
          // Just log status if no meaningful data
          console.log(`🌐 HTTP ${response.status} ${response.statusText}`);
        }
        
        // Handle authentication errors - don't logout automatically, just throw error
        if (response.status === 401) {
          // Don't clear token or redirect - let the calling component handle it
          const errorMessage = errorData?.message || errorData?.error || errorText || 'Authentication failed. Your session may have expired.';
          throw new Error(errorMessage);
        }
        
        // Handle 404 errors gracefully - return a structured error
        // For verification/status endpoint, 404 means student not found, which is OK
        if (response.status === 404) {
          const errorMessage = errorData?.message || errorText || 'Resource not found';
          const err: any = new Error(errorMessage);
          err.status = response.status;
          err.details = errorData || { message: errorMessage };
          // Mark as a "soft" error for verification status - can be handled gracefully
          err.isVerificationNotFound = url.includes('/verification/status');
          err.isStudentNotFound = errorMessage.toLowerCase().includes('student not found');
          throw err;
        }
        
        // Extract error message from various possible formats
        const message =
          errorData?.message ||
          errorData?.error?.message ||
          errorData?.error ||
          (Array.isArray(errorData?.errors) && errorData.errors[0]?.message) ||
          (typeof errorData === 'string' ? errorData : null) ||
          errorText ||
          `HTTP ${response.status} ${response.statusText}`;

        const err: any = new Error(message);
        err.status = response.status;
        err.details = errorData || { message, errorText };
        throw err;
      }

      const responseData = await response.json();
      console.log('🌐 Success response:', responseData);
      
      // Check for any date-related issues in the response
      if (responseData && typeof responseData === 'object') {
        // Fix any undefined date fields
        const fixDates = (obj: any): any => {
          if (Array.isArray(obj)) {
            return obj.map(fixDates);
          } else if (obj && typeof obj === 'object') {
            const fixed: any = {};
            for (const [key, value] of Object.entries(obj)) {
              if (key.includes('Date') || key.includes('At')) {
                // Ensure date fields are properly formatted
                if (value && typeof value === 'string') {
                  try {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                      fixed[key] = value;
                    } else {
                      fixed[key] = new Date().toISOString().split('T')[0];
                    }
                  } catch {
                    fixed[key] = new Date().toISOString().split('T')[0];
                  }
                } else if (!value) {
                  fixed[key] = new Date().toISOString().split('T')[0];
                } else {
                  fixed[key] = value;
                }
              } else {
                fixed[key] = fixDates(value);
              }
            }
            return fixed;
          }
          return obj;
        };
        
        return fixDates(responseData);
      }
      
      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Students (new)
  async getMyStudentProfile() {
    return this.request('/students/me', { method: 'GET' });
  }

  async saveMyStudentProfile(data: {
    name: string;
    phone: string;
    college: string;
    college_email?: string;
    id_doc_url?: string;
    skills?: string[];
    availability?: string[];
  }) {
    return this.request('/students/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async verifyStudent(studentId: string) {
    return this.request(`/students/verify/${studentId}`, { method: 'PUT' });
  }

  async updateEmployerCategory(employerCategory: 'corporate' | 'local_business' | 'individual') {
    return this.request('/users/employer-category', {
      method: 'PUT',
      body: JSON.stringify({ employerCategory })
    });
  }

  async chooseRole(intent: string, employerType: 'corporate' | 'local' | 'individual') {
    return this.request<{ success: boolean; redirectTo: string }>('/users/choose-role', {
      method: 'POST',
      body: JSON.stringify({ intent, employerType })
    });
  }

  async changeEmployerType(employerType: 'corporate' | 'local' | 'individual') {
    return this.request<{ success: boolean; redirectTo: string; newType: string; oldType: string }>('/users/change-employer-type', {
      method: 'PUT',
      body: JSON.stringify({ employerType })
    });
  }
  // Helper to unwrap { data } when present
  private unwrap<T = any>(resp: any): T {
    return (resp && typeof resp === 'object' && 'data' in resp) ? resp.data as T : resp as T;
  }

  private ensureRole<T extends { userType?: string; role?: 'user' | 'admin' }>(user: T): T & { role: 'user' | 'admin' } {
    const resolvedRole: 'user' | 'admin' =
      user?.role === 'admin'
        ? 'admin'
        : user?.role === 'user'
          ? 'user'
          : user?.userType === 'admin'
            ? 'admin'
            : 'user';

    return {
      ...user,
      role: resolvedRole,
    };
  }

  // Mapping helpers to normalize backend → frontend shapes
  private mapEnhancedJobToFrontendJob(raw: any): Job {
    const jobId = raw._id || raw.jobId || '';
    const title = raw.jobTitle || raw.title || '';
    const description = raw.description || raw.jobDescription || '';
    const company = raw.companyName || raw.company || (raw.employerId && typeof raw.employerId === 'object' ? raw.employerId.companyName : '') || '';
    const location = raw.location || raw.jobLocation || '';
    const salaryRange = raw.salaryRange || raw.salary || raw.payRange || '';
    const workType = raw.workType || raw.type || '';
    const applicantsCount = raw.applicationsCount || (Array.isArray(raw.applicants) ? raw.applicants.length : (Array.isArray(raw.applications) ? raw.applications.length : 0));
    const requirements = Array.isArray(raw.skillsRequired) ? raw.skillsRequired : Array.isArray(raw.requirements) ? raw.requirements : [];

    const base: any = {
      _id: jobId,
      title,
      description,
      company,
      location,
      salary: typeof salaryRange === 'string' ? salaryRange : String(salaryRange || ''),
      salaryRange: typeof salaryRange === 'string' ? salaryRange : String(salaryRange || ''),
      type: workType,
      workType,
      category: raw.category || '',
      status: raw.status || 'active',
      approvalStatus: raw.approvalStatus || raw.status || 'pending',
      employer: (typeof raw.employerId === 'object' ? raw.employerId?._id : raw.employerId) || raw.employer || '',
      createdAt: raw.createdAt || new Date().toISOString().split('T')[0],
      applicationsCount: applicantsCount,
      requirements,
      skillsRequired: requirements,
      applicants: raw.applicants || raw.applications || [],
      highlighted: raw.highlighted === true || raw.highlighted === 'true', // Ensure boolean conversion
    };

    return base as Job;
  }

  private mapEnhancedApplicationToFrontend(app: any): Application {
    const jobRaw = app.jobId || app.job || {};
    const studentRaw = app.studentId || app.student || {};
    const mappedJob = this.mapEnhancedJobToFrontendJob(jobRaw);
    const jobId = mappedJob?._id || jobRaw?._id || jobRaw?.jobId || '';
    return {
      _id: app._id,
      job: {
        ...mappedJob,
        _id: jobId,
      },
      student: typeof studentRaw === 'object' ? {
        _id: studentRaw._id,
        name: studentRaw.name,
        email: studentRaw.email,
        phone: studentRaw.phone,
        college: studentRaw.college,
        skills: studentRaw.skills,
      } : studentRaw,
      employer: app.employer || (jobRaw?.employerId?._id || jobRaw?.employerId) || '',
      status: app.status,
      appliedDate: app.appliedAt || app.createdAt || new Date().toISOString().split('T')[0],
      coverLetter: app.coverLetter,
      expectedPay: app.expectedPay,
      availability: app.availability,
    } as Application;
  }

  // Authentication APIs
  async login(email: string, password: string, userType: string): Promise<AuthResponse> {
    console.log('🔐 Login API call:', { email, userType, apiUrl: API_BASE_URL });
    const raw = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, userType }),
    });
    const payload = this.unwrap<AuthResponse>(raw);
    if (payload?.user) {
      payload.user = this.ensureRole(payload.user);
    }
    return payload;
  }

  async loginAuto(email: string, password: string): Promise<AuthResponse> {
    console.log('🔐 Auto-login API call:', { email, apiUrl: API_BASE_URL });
    const raw = await this.request('/auth/login-auto', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const payload = this.unwrap<AuthResponse>(raw);
    if (payload?.user) {
      payload.user = this.ensureRole(payload.user);
    }
    return payload;
  }

  async loginRequestOTP(email: string, userType: string): Promise<{ message: string; email: string; userType: string }> {
    return this.request('/auth/login-request-otp', {
      method: 'POST',
      body: JSON.stringify({ email, userType }),
    });
  }

  async loginVerifyOTP(email: string, userType: string, otp: string): Promise<AuthResponse> {
    const raw = await this.request('/auth/login-verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, userType, otp }),
    });
    const payload = this.unwrap<AuthResponse>(raw);
    if (payload?.user) {
      payload.user = this.ensureRole(payload.user);
    }
    return payload;
  }

  async register(userData: any): Promise<AuthResponse> {
    const raw = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    const payload = this.unwrap<AuthResponse>(raw);
    if (payload?.user) {
      payload.user = this.ensureRole(payload.user);
    }
    return payload;
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

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        skipAuth: true,
      });
    } catch (error) {
      console.error('API logout failed:', error);
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.request<{ user: User }>('/users/profile');
    const user = (response as any)?.user ?? response;
    return this.ensureRole(user as User);
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

  async submitEmployerKYC(payload: FormData | { 
    fullName?: string;
    companyName: string; 
    companyEmail?: string;
    companyPhone?: string;
    businessRegNo?: string;
    authorizedName?: string;
    designation?: string;
    address?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
    gstNo?: string;
    GSTNumber?: string; 
    PAN?: string; 
    documents?: any 
  }) {
    try {
      console.log('📝 Submitting Employer KYC:', payload);
      const body = (typeof FormData !== 'undefined' && payload instanceof FormData)
        ? payload
        : JSON.stringify(payload);

      const res = await this.request<any>(`/kyc/employer`, {
        method: 'POST',
        body,
      });
      const data = res?.data || res;
      console.log('✅ KYC Submission Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Error submitting KYC:', error);
      throw error;
    }
  }

  // Submit Corporate KYC
  async submitCorporateKYC(payload: FormData) {
    try {
      console.log('📝 Submitting Corporate KYC');
      const res = await this.request<any>(`/kyc/employer/corporate`, {
        method: 'POST',
        body: payload,
      });
      const data = res?.data || res;
      console.log('✅ Corporate KYC Submission Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Error submitting Corporate KYC:', error);
      throw error;
    }
  }

  // Submit Local Business KYC
  async submitLocalBusinessKYC(payload: FormData) {
    try {
      console.log('📝 Submitting Local Business KYC');
      const res = await this.request<any>(`/kyc/employer/local-business`, {
        method: 'POST',
        body: payload,
      });
      const data = res?.data || res;
      console.log('✅ Local Business KYC Submission Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Error submitting Local Business KYC:', error);
      throw error;
    }
  }

  // Submit Individual KYC
  async submitIndividualKYC(payload: FormData) {
    try {
      console.log('📝 Submitting Individual KYC');
      const res = await this.request<any>(`/kyc/employer/individual`, {
        method: 'POST',
        body: payload,
      });
      const data = res?.data || res;
      console.log('✅ Individual KYC Submission Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Error submitting Individual KYC:', error);
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

  async getStudentDashboardJobs(showHighlighted = true): Promise<JobsResponse> {
    const queryParams = new URLSearchParams({ showHighlighted: showHighlighted.toString() });
    const raw = await this.request<any>(`/enhanced-jobs/student-dashboard?${queryParams}`);
    const payload = this.unwrap<any>(raw);
    const jobs = Array.isArray(payload?.jobs) ? payload.jobs.map((j: any) => this.mapEnhancedJobToFrontendJob(j)) : [];
    return {
      jobs,
      pagination: {
        page: payload?.pagination?.current || 1,
        limit: 10,
        total: payload?.pagination?.total || jobs.length,
        pages: payload?.pagination?.pages || 1,
      }
    } as unknown as JobsResponse;
  }

  // Get employer jobs list - does NOT call /jobs/:jobId, only fetches list
  async getEmployerJobsList(page = 1, limit = 1000): Promise<JobsResponse> {
    // Backend gets employerId from JWT token, not from URL path
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    const endpoint = `/enhanced-jobs/employer-dashboard?${query.toString()}`;
    console.log('🔍 API: Fetching employer jobs list from:', endpoint);
    const raw = await this.request<any>(endpoint);
    console.log('🔍 API: Raw response:', raw);
    const payload = this.unwrap<any>(raw);
    console.log('🔍 API: Unwrapped payload:', payload);
    // Employer dashboard returns structured jobs with applicants
    const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];
    // Normalize to frontend Job shape while preserving applicants on the object
    const normalized = jobs.map((j: any) => ({
      _id: j.jobId || j._id || '',
      title: j.jobTitle || j.title || '',
      description: j.jobDescription || j.description || '',
      company: j.companyName || j.company || '',
      location: j.location || '',
      status: j.status || 'active',
      approvalStatus: j.approvalStatus || j.status || 'pending',
      createdAt: j.createdAt || new Date().toISOString(),
      salary: j.salaryRange || j.salary || j.payRange || '',
      salaryRange: j.salaryRange || j.salary || j.payRange || '',
      type: j.workType || j.type || '',
      workType: j.workType || j.type || '',
      skillsRequired: Array.isArray(j.skillsRequired) ? j.skillsRequired : (Array.isArray(j.requirements) ? j.requirements : []),
      requirements: Array.isArray(j.skillsRequired) ? j.skillsRequired : (Array.isArray(j.requirements) ? j.requirements : []),
      applicationsCount: Array.isArray(j.applicants) ? j.applicants.length : (typeof j.applicationsCount === 'number' ? j.applicationsCount : 0),
      // pass through additional fields for UI
      applicants: j.applicants || [],
    })) as any[];
    return {
      jobs: normalized as any,
      pagination: {
        page: payload?.pagination?.current || 1,
        limit: payload?.pagination?.limit || limit || 10,
        total: payload?.pagination?.total || normalized.length,
        pages: payload?.pagination?.pages || 1,
      }
    } as unknown as JobsResponse;
  }

  async getEmployerDashboardJobs(employerId: string, page = 1, limit = 1000): Promise<JobsResponse> {
    // This method is kept for backward compatibility but now delegates to getEmployerJobsList
    // The employerId parameter is ignored as backend gets it from JWT token
    return this.getEmployerJobsList(page, limit);
  }

  async applyToJobEnhanced(jobId: string, applicationData: any) {
    return this.request(`/enhanced-jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  async approveApplication(applicationId: string, notes?: string) {
    const body = notes ? JSON.stringify({ notes }) : undefined;
    return this.request(`/enhanced-jobs/applications/${applicationId}/approve`, {
      method: 'PATCH',
      ...(body ? { body } : {}),
    });
  }

  async rejectApplication(applicationId: string, reason?: string) {
    const payload = { reason: reason || 'Application rejected' };
    return this.request(`/enhanced-jobs/applications/${applicationId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async closeApplication(applicationId: string) {
    return this.request(`/enhanced-jobs/applications/${applicationId}/close`, {
      method: 'PATCH',
    });
  }


  async getStudentApplications(status?: string): Promise<ApplicationsResponse> {
    const queryParams = status ? new URLSearchParams({ status }) : '' as any;
    const endpoint = queryParams ? `/enhanced-jobs/applications/student?${queryParams}` : '/enhanced-jobs/applications/student';
    const raw = await this.request<any>(endpoint);
    const payload = this.unwrap<any>(raw);
    const applications = Array.isArray(payload?.applications) ? payload.applications.map((a: any) => this.mapEnhancedApplicationToFrontend(a)) : [];
    return {
      applications,
      pagination: payload?.pagination || { current: 1, pages: 1, total: applications.length },
    } as ApplicationsResponse;
  }

  async getRecentApprovedApplications(limit = 10): Promise<any> {
    const raw = await this.request<any>(`/enhanced-jobs/applications/recent-approved?limit=${limit}`);
    const payload = this.unwrap<any>(raw);
    return {
      applications: Array.isArray(payload?.applications) ? payload.applications : [],
    };
  }

  async getApprovedApplicationsWithContact(limit = 10): Promise<any> {
    const raw = await this.request<any>(`/enhanced-jobs/applications/approved-with-contact?limit=${limit}`);
    const payload = this.unwrap<any>(raw);
    return {
      applications: Array.isArray(payload?.applications) ? payload.applications : [],
    };
  }

  async getEmployerApplications(status?: string, jobId?: string, page = 1, limit = 1000): Promise<ApplicationsResponse> {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (jobId) queryParams.append('jobId', jobId);
    if (page) queryParams.append('page', String(page));
    if (limit) queryParams.append('limit', String(limit));
    const endpoint = queryParams.toString() ? `/enhanced-jobs/applications/employer?${queryParams}` : '/enhanced-jobs/applications/employer';
    const raw = await this.request<any>(endpoint);
    const payload = this.unwrap<any>(raw);
    const applications = Array.isArray(payload?.applications) ? payload.applications.map((a: any) => this.mapEnhancedApplicationToFrontend(a)) : [];
    return {
      applications,
      pagination: payload?.pagination || { current: page, pages: 1, total: applications.length },
    } as ApplicationsResponse;
  }

  // Explicit employer applications fetch - backend gets employerId from JWT token
  async getEmployerApplicationsForEmployer(employerId: string, page = 1, limit = 1000, status?: string): Promise<ApplicationsResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(page));
    queryParams.append('limit', String(limit));
    if (status) queryParams.append('status', status);
    // Backend gets employerId from JWT token, not from query params
    const endpoint = `/enhanced-jobs/applications/employer?${queryParams.toString()}`;
    console.log('🔍 API: Fetching employer applications from:', endpoint);
    const raw = await this.request<any>(endpoint);
    console.log('🔍 API: Raw applications response:', raw);
    const payload = this.unwrap<any>(raw);
    console.log('🔍 API: Unwrapped applications payload:', payload);
    const applications = Array.isArray(payload?.applications) ? payload.applications.map((a: any) => this.mapEnhancedApplicationToFrontend(a)) : [];
    return {
      applications,
      pagination: payload?.pagination || { current: page, pages: 1, total: applications.length },
    } as ApplicationsResponse;
  }

  async getApplication(applicationId: string) {
    try {
      const raw = await this.request<any>(`/applications/${applicationId}`);
      const payload = this.unwrap<any>(raw);
      return {
        application: this.mapEnhancedApplicationToFrontend(payload.application)
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.status === 404 || error.status === 400) {
        throw new Error('Application not found');
      }
      // Re-throw other errors
      throw error;
    }
  }

  // Legacy Job APIs (keeping for backward compatibility)
  async getJobs(filters?: any): Promise<JobsResponse> {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = queryParams ? `/jobs?${queryParams}` : '/jobs';
    const raw = await this.request<any>(endpoint);
    const payload = this.unwrap<any>(raw);
    const jobs = Array.isArray(payload?.jobs) ? payload.jobs.map((j: any) => this.mapEnhancedJobToFrontendJob(j)) : [];
    return {
      jobs,
      pagination: payload?.pagination || { page: 1, limit: 10, total: jobs.length, pages: 1 },
    } as unknown as JobsResponse;
  }

  async getJob(jobId: string) {
    // Add null check to prevent calling API with undefined jobId
    if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
      throw new Error('Invalid job ID provided');
    }
    
    try {
      const raw = await this.request<any>(`/jobs/${jobId}`);
      const payload = this.unwrap<any>(raw);
      return this.mapEnhancedJobToFrontendJob(payload);
    } catch (error: any) {
      // If the specific job endpoint fails due to validation errors, try fetching from jobs list
      if (error.status === 400 && error.message?.includes('Application deadline')) {
        console.log('Job validation error, trying to fetch from jobs list...');
        try {
          // Fallback to fetching all jobs if we have no current user context
          const jobsResponse = await this.getEmployerJobsList(1, 1000);
          const job = jobsResponse.jobs.find((j: any) => j._id === jobId);
          if (job) {
            console.log('Found job in jobs list');
            return job;
          }
        } catch (fallbackError) {
          console.error('Fallback fetch failed:', fallbackError);
        }
      }
      // Re-throw the original error if fallback fails
      throw error;
    }
  }

  async applyForJob(jobId: string, resumeData?: FormData) {
    const headers: Record<string, string> = {};
    
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (!resumeData) {
      headers['Content-Type'] = 'application/json';
    }

    return this.request(`/enhanced-jobs/${jobId}/apply`, {
      method: 'POST',
      headers,
      body: resumeData || undefined,
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
    // Use the new getEmployerJobsList method which doesn't require employerId
    // Backend gets employerId from JWT token
    return this.getEmployerJobsList();
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
      
      // Validate jobId
      if (!jobId || typeof jobId !== 'string') {
        throw new Error('Invalid job ID provided');
      }
      
      // Clean application data
      const cleanApplicationData = {
        jobId: jobId,
        availability: applicationData?.availability || 'flexible',
        ...(applicationData?.coverLetter && { coverLetter: applicationData.coverLetter }),
        ...(applicationData?.expectedPay && { expectedPay: applicationData.expectedPay })
      };
      
      console.log('📝 Clean application data:', cleanApplicationData);
      
      const response = await this.request('/applications', {
        method: 'POST',
        body: JSON.stringify(cleanApplicationData),
      });
      
      console.log('✅ Job application submitted successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error applying to job:', error);
      throw error;
    }
  }


  async getUserApplications(): Promise<ApplicationsResponse> {
    try {
      const raw = await this.request<any>('/applications/my-applications');
      const payload = this.unwrap<any>(raw);
      // Normalize shape if backend uses sendSuccessResponse
      if (payload && payload.applications) {
        return payload as ApplicationsResponse;
      }
      // If backend returns raw array (legacy), wrap it
      if (Array.isArray(payload)) {
        return { applications: payload as any, pagination: { current: 1, pages: 1, total: (payload as any[]).length } } as ApplicationsResponse;
      }
      return { applications: [], pagination: { current: 1, pages: 1, total: 0 } } as ApplicationsResponse;
    } catch (error) {
      console.error('getUserApplications failed:', error);
      // Surface a consistent error to caller
      throw new Error(this.handleError(error));
    }
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

  // Saved Jobs APIs
  async getSavedJobs(): Promise<{ savedJobs: any[] }> {
    try {
      const raw = await this.request<any>('/saved-jobs');
      const payload = this.unwrap<any>(raw);
      return {
        savedJobs: Array.isArray(payload?.savedJobs) ? payload.savedJobs : []
      };
    } catch (error) {
      console.error('getSavedJobs failed:', error);
      return { savedJobs: [] };
    }
  }

  async saveJob(jobId: string): Promise<{ savedJob: any }> {
    try {
      const raw = await this.request<any>(`/saved-jobs/${jobId}`, {
        method: 'POST',
      });
      const payload = this.unwrap<any>(raw);
      return { savedJob: payload?.savedJob || payload };
    } catch (error) {
      console.error('saveJob failed:', error);
      throw error;
    }
  }

  async unsaveJob(jobId: string): Promise<void> {
    try {
      await this.request(`/saved-jobs/${jobId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('unsaveJob failed:', error);
      throw error;
    }
  }

  async checkJobSaved(jobId: string): Promise<{ isSaved: boolean }> {
    try {
      const raw = await this.request<any>(`/saved-jobs/check/${jobId}`);
      const payload = this.unwrap<any>(raw);
      return { isSaved: payload?.isSaved || false };
    } catch (error) {
      console.error('checkJobSaved failed:', error);
      return { isSaved: false };
    }
  }
  async getAllUsers(filters?: any) {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = queryParams ? `/admin/users?${queryParams}` : '/admin/users';
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
    try {
      console.log('⏸️ Suspending user:', id);
      const response = await this.request(`/admin/users/${id}/suspend`, {
        method: 'PATCH',
      });
      console.log('✅ User suspended successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error suspending user:', error);
      throw error;
    }
  }

  async activateUser(id: string) {
    try {
      console.log('▶️ Activating user:', id);
      const response = await this.request(`/admin/users/${id}/activate`, {
        method: 'PATCH',
      });
      console.log('✅ User activated successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error activating user:', error);
      throw error;
    }
  }

  async adminDeleteUser(id: string) {
    try {
      console.log('🗑️ Admin deleting user:', id);
      const response = await this.request(`/admin/users/${id}`, {
        method: 'DELETE',
      });
      console.log('✅ User deleted successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error deleting user as admin:', error);
      throw error;
    }
  }

  async updateUserRoleAdmin(id: string, userType: 'student' | 'employer' | 'admin') {
    try {
      console.log('♻️ Updating user role:', { id, userType });
      const response = await this.request(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ userType }),
      });
      console.log('✅ User role updated successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      throw error;
    }
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
    try {
      console.log('✅ Approving user:', userId);
      const response = await this.request(`/admin/users/${userId}/approve`, {
        method: 'PATCH',
      });
      console.log('✅ User approved successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error approving user:', error);
      throw error;
    }
  }

  async rejectUser(userId: string, reason: string) {
    try {
      console.log('❌ Rejecting user:', userId, 'Reason:', reason);
      const response = await this.request(`/admin/users/${userId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      console.log('✅ User rejected successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error rejecting user:', error);
      throw error;
    }
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

  async getEmployerDetails<T = any>(employerId: string): Promise<T> {
    const raw = await this.request<any>(`/admin/employers/${employerId}/details`);
    return this.unwrap<T>(raw);
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
      const response = await this.request(`/admin/kyc/${kycId}/approve`, {
        method: 'PUT',
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
      const response = await this.request(`/admin/kyc/${kycId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectionReason }),
      });
      console.log('📊 Reject KYC response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error rejecting employer KYC:', error);
      throw error;
    }
  }

  async approveKYC(kycId: string) {
    return this.approveEmployerKYC(kycId);
  }

  async rejectKYC(kycId: string, rejectionReason: string) {
    return this.rejectEmployerKYC(kycId, rejectionReason);
  }

  async suspendKYC(kycId: string, reason?: string) {
    try {
      console.log('⏸️ Suspending KYC:', kycId, 'Reason:', reason);
      const response = await this.request(`/admin/kyc/${kycId}/suspend`, {
        method: 'PATCH',
        body: reason ? JSON.stringify({ reason }) : undefined,
      });
      console.log('✅ KYC suspended successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error suspending KYC:', error);
      throw error;
    }
  }

  // Admin Student Verification APIs
  async getPendingVerifications(page = 1, limit = 10) {
    try {
      console.log('🔍 Fetching pending verifications...');
      const response = await this.request(`/admin/verification/pending?page=${page}&limit=${limit}`, {
        method: 'GET',
      });
      console.log('📊 Pending verifications response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching pending verifications:', error);
      throw error;
    }
  }

  async updateStudentVerification(
    studentId: string,
    action: 'approve' | 'reject' | 'require_trial',
    body: { rejection_code?: string; admin_notes?: string } = {}
  ) {
    try {
      console.log('🔄 Updating student verification:', { studentId, action, body });
      const response = await this.request(`/admin/verification/${studentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, ...body }),
      });
      console.log('✅ Student verification updated:', response);
      return response;
    } catch (error) {
      console.error('❌ Error updating student verification:', error);
      throw error;
    }
  }

  // Job Management APIs (Admin)
  async approveJob(jobId: string) {
    try {
      console.log('✅ Approving job:', jobId);
      console.log('🌐 API Base URL:', API_BASE_URL);
      console.log('🌐 Full endpoint:', `${API_BASE_URL}/admin/jobs/${jobId}/approve`);
      
      const response = await this.request(`/admin/jobs/${jobId}/approve`, {
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
        endpoint: `/admin/jobs/${jobId}/approve`,
        apiUrl: API_BASE_URL
      });
      throw error;
    }
  }

  // Employer Job Management APIs
  async approveEmployerJob(jobId: string) {
    try {
      console.log('✅ Employer approving job:', jobId);
      console.log('🌐 API Base URL:', API_BASE_URL);
      console.log('🌐 Full endpoint:', `${API_BASE_URL}/enhanced-jobs/${jobId}/approve`);
      
      const response = await this.request(`/enhanced-jobs/${jobId}/approve`, {
        method: 'PATCH',
      });
      console.log('📊 Employer approve job response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error employer approving job:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.status,
        details: (error as any)?.details,
        endpoint: `/enhanced-jobs/${jobId}/approve`,
        apiUrl: API_BASE_URL
      });
      throw error;
    }
  }

  async rejectJob(jobId: string, rejectionReason: string) {
    try {
      console.log('❌ Rejecting job:', jobId, 'Reason:', rejectionReason);
      console.log('🌐 API Base URL:', API_BASE_URL);
      console.log('🌐 Full endpoint:', `${API_BASE_URL}/admin/jobs/${jobId}/reject`);
      
      const response = await this.request(`/admin/jobs/${jobId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: rejectionReason }),
      });
      console.log('📊 Reject job response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error rejecting job:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.status,
        details: (error as any)?.details,
        endpoint: `/admin/jobs/${jobId}/reject`,
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

  // ==================== COMPREHENSIVE ADMIN DATA APIs ====================

  // Get comprehensive admin dashboard data
  async getComprehensiveAdminData(params?: {
    userPage?: number;
    userLimit?: number;
    userType?: string;
    userStatus?: string;
    jobPage?: number;
    jobLimit?: number;
    jobStatus?: string;
    jobApprovalStatus?: string;
    appPage?: number;
    appLimit?: number;
    appStatus?: string;
    kycPage?: number;
    kycLimit?: number;
    kycStatus?: string;
  }) {
    try {
      console.log('🔍 Fetching comprehensive admin data...');
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const endpoint = queryParams.toString() 
        ? `/admin/comprehensive-data?${queryParams.toString()}`
        : '/admin/comprehensive-data';
      
      const response = await this.request(endpoint, {
        method: 'GET',
      });
      
      console.log('📊 Comprehensive admin data response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching comprehensive admin data:', error);
      throw error;
    }
  }

  // Get dashboard summary statistics
  async getDashboardSummary() {
    try {
      console.log('📊 Fetching dashboard summary...');
      const response = await this.request('/admin/dashboard-summary', {
        method: 'GET',
      });
      console.log('📊 Dashboard summary response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching dashboard summary:', error);
      throw error;
    }
  }

  // Get all users with filtering and pagination
  async getAllUsersAdmin(params?: {
    page?: number;
    limit?: number;
    userType?: string;
    status?: string;
    search?: string;
  }) {
    try {
      console.log('🔍 Fetching all users for admin...');
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const endpoint = queryParams.toString() 
        ? `/admin/users/all?${queryParams.toString()}`
        : '/admin/users/all';
      
      const response = await this.request(endpoint, {
        method: 'GET',
      });
      
      console.log('📊 All users admin response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching all users for admin:', error);
      throw error;
    }
  }

  // Get all jobs with filtering and pagination
  async getAllJobsAdmin(params?: {
    page?: number;
    limit?: number;
    status?: string;
    approvalStatus?: string;
    search?: string;
  }) {
    try {
      console.log('🔍 Fetching all jobs for admin...');
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const endpoint = queryParams.toString() 
        ? `/admin/jobs/all?${queryParams.toString()}`
        : '/admin/jobs/all';
      
      const response = await this.request(endpoint, {
        method: 'GET',
      });
      
      console.log('📊 All jobs admin response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching all jobs for admin:', error);
      throw error;
    }
  }

  // Get all applications with filtering and pagination
  async getAllApplicationsAdmin(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    try {
      console.log('🔍 Fetching all applications for admin...');
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const endpoint = queryParams.toString() 
        ? `/admin/applications/all?${queryParams.toString()}`
        : '/admin/applications/all';
      
      const response = await this.request(endpoint, {
        method: 'GET',
      });
      
      console.log('📊 All applications admin response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching all applications for admin:', error);
      throw error;
    }
  }

  // Get all KYC records with filtering and pagination
  async getAllKYCAdmin(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    type?: 'student' | 'employer';
  }) {
    try {
      console.log('🔍 Fetching all KYC records for admin...');
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const endpoint = queryParams.toString() 
        ? `/admin/kyc/all?${queryParams.toString()}`
        : '/admin/kyc/all';
      
      const response = await this.request(endpoint, {
        method: 'GET',
      });
      
      console.log('📊 All KYC admin response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching all KYC records for admin:', error);
      throw error;
    }
  }

  // Get all employer KYC types (Corporate, Local Business, Individual)
  async getAllEmployerKYCAdmin(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    type?: 'all' | 'corporate' | 'local_business' | 'individual';
  }) {
    try {
      console.log('🔍 Fetching all employer KYC records for admin...');
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const endpoint = queryParams.toString() 
        ? `/admin/kyc/employers?${queryParams.toString()}`
        : '/admin/kyc/employers';
      
      const response = await this.request(endpoint, {
        method: 'GET',
      });
      
      console.log('📊 All Employer KYC admin response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching all employer KYC records for admin:', error);
      throw error;
    }
  }

  // Approve employer KYC (Corporate, Local Business, or Individual)
  async approveEmployerKYCByType(kycId: string, kycType: 'corporate' | 'local_business' | 'individual', reason?: string) {
    try {
      console.log('✅ Approving employer KYC:', kycId, 'Type:', kycType);
      const response = await this.request(`/admin/kyc/employer/${kycId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ kycType, reason }),
      });
      console.log('📊 Approve Employer KYC response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error approving employer KYC:', error);
      throw error;
    }
  }

  // Reject employer KYC (Corporate, Local Business, or Individual)
  async rejectEmployerKYCByType(kycId: string, kycType: 'corporate' | 'local_business' | 'individual', rejectionReason: string) {
    try {
      console.log('❌ Rejecting employer KYC:', kycId, 'Type:', kycType, 'Reason:', rejectionReason);
      const response = await this.request(`/admin/kyc/employer/${kycId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ kycType, reason: rejectionReason }),
      });
      console.log('📊 Reject Employer KYC response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error rejecting employer KYC:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService;

// Export types for use in components
export type { Job, Application, JobsResponse, ApplicationsResponse, User, AuthResponse };
