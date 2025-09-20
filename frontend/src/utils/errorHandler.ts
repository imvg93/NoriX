// Error handling utility for API calls
export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export class ApiErrorHandler {
  /**
   * Handle API errors with user-friendly messages
   */
  static handleError(error: any): ApiError {
    console.error('🚨 API Error:', error);

    // Network errors
    if (!error.response) {
      return {
        message: 'Network error. Please check your internet connection.',
        status: 0
      };
    }

    const { status, data } = error.response;

    // Handle different HTTP status codes
    switch (status) {
      case 400:
        return {
          message: data?.message || 'Invalid request. Please check your input.',
          status,
          details: data
        };
      
      case 401:
        return {
          message: 'Authentication failed. Please login again.',
          status,
          details: data
        };
      
      case 403:
        return {
          message: 'Access denied. You don\'t have permission to perform this action.',
          status,
          details: data
        };
      
      case 404:
        return {
          message: 'Resource not found.',
          status,
          details: data
        };
      
      case 422:
        return {
          message: data?.message || 'Validation error. Please check your input.',
          status,
          details: data
        };
      
      case 500:
        return {
          message: 'Server error. Please try again later.',
          status,
          details: data
        };
      
      default:
        return {
          message: data?.message || 'An unexpected error occurred.',
          status,
          details: data
        };
    }
  }

  /**
   * Show error notification to user
   */
  static showError(error: ApiError, showAlert = true) {
    if (showAlert) {
      alert(`Error: ${error.message}`);
    }
    
    // You can replace this with a toast notification library
    console.error('User Error:', error.message);
  }

  /**
   * Retry failed API calls with exponential backoff
   */
  static async retry<T>(
    apiCall: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries} in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

/**
 * Higher-order function to wrap API calls with error handling
 */
export function withErrorHandling<T extends any[], R>(
  apiFunction: (...args: T) => Promise<R>,
  showAlert = true
) {
  return async (...args: T): Promise<R> => {
    try {
      return await apiFunction(...args);
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      ApiErrorHandler.showError(apiError, showAlert);
      throw apiError;
    }
  };
}

/**
 * Utility to check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  return !!(token && user);
}

/**
 * Utility to get current user from localStorage
 */
export function getCurrentUser(): any | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
}

/**
 * Utility to clear authentication data
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
