import { AuthPreservation } from './authPreservation';

// Utility to handle chunk loading errors
export class ChunkErrorHandler {
  private static retryCount = 0;
  private static maxRetries = 2; // Reduced from 3 to 2
  private static retryDelay = 500; // Reduced from 1000ms to 500ms

  static handleChunkError(error: Error): boolean {
    // Check if it's a chunk loading error
    const isChunkError = 
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading CSS chunk') ||
      error.message.includes('failed');

    if (!isChunkError) {
      return false;
    }

    console.warn(`🔄 Chunk loading error detected (attempt ${this.retryCount + 1}/${this.maxRetries + 1}):`, error);

    // Only handle chunk errors, don't auto-reload for other errors
    if (this.retryCount >= this.maxRetries) {
      console.log('🔄 Max retries reached, showing manual reload option...');
      // Don't auto-reload, let user manually refresh if needed
      return false;
    }

    // Retry loading the chunk with longer delays
    this.retryCount++;
    
    // Use longer delays to avoid aggressive reloading
    const delay = this.retryCount === 1 ? 2000 : this.retryDelay * 2; // Much longer delays
    this.retryWithDelay(delay);
    return true;
  }

  private static retryWithDelay(delay: number = this.retryDelay) {
    setTimeout(() => {
      console.log(`🔄 Attempting to retry chunk load after ${delay}ms...`);
      
      // Try to reload the page gently without losing authentication
      try {
        // Check if user is logged in before reloading
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
          console.log('🔐 User is logged in, preserving authentication during reload...');
          // Use a gentle reload that preserves authentication
          window.location.reload();
        } else {
          console.log('⚠️ No authentication found, skipping auto-reload to prevent logout');
          // Don't reload if user isn't logged in
          return;
        }
      } catch (error) {
        console.error('❌ Error during reload:', error);
        // Don't reload if there's an error
        return;
      }
    }, delay);

    // Increase delay for next retry (exponential backoff)
    this.retryDelay *= 2; // Slower backoff to avoid aggressive reloading
  }

  private static reloadPage() {
    // Use enhanced authentication preservation
    console.log('🔄 Reloading page with enhanced authentication preservation...');
    AuthPreservation.reloadWithAuthPreservation();
  }

  static reset() {
    this.retryCount = 0;
    this.retryDelay = 1000;
  }

  // Global error handler for unhandled chunk errors
  static setupGlobalHandler() {
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections (common with chunk loading errors)
    window.addEventListener('unhandledrejection', (event) => {
      if (this.handleChunkError(new Error(event.reason))) {
        event.preventDefault();
      }
    });

    // Handle general errors
    window.addEventListener('error', (event) => {
      if (event.error && this.handleChunkError(event.error)) {
        event.preventDefault();
      }
    });
  }
}

// Disable automatic global handler setup to prevent unwanted auto-reloads
// The error handler will only be used when explicitly called by ErrorBoundary
if (typeof window !== 'undefined') {
  console.log('🔧 Chunk error handler available but not auto-setup to prevent unwanted reloads');
}
