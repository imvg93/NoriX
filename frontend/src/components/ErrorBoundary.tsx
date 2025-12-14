"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ChunkErrorHandler } from '../utils/chunkErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isChunkError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a chunk loading error
    const isChunkError = 
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading CSS chunk') ||
      error.message.includes('timeout');
    
    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Handle chunk loading errors specifically
    if (this.state.isChunkError) {
      const handled = ChunkErrorHandler.handleChunkError(error);
      if (handled) {
        console.log('🔄 Chunk error handled, page will reload...');
      }
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state when children prop changes (e.g., route change)
    if (this.state.hasError && prevProps.children !== this.props.children) {
      console.log('🔄 Route changed, resetting error boundary');
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      // Special UI for chunk loading errors
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 max-w-md">
              <div className="text-blue-500 text-6xl mb-4">🔄</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Loading Error
              </h2>
              <p className="text-gray-600 mb-4">
                The application is taking longer than expected to load. This is usually a temporary network issue.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Reloading the page...
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    ChunkErrorHandler.reset();
                    window.location.reload();
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Reload Now
                </button>
                <button
                  onClick={() => {
                    ChunkErrorHandler.reset();
                    window.location.href = '/';
                  }}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        );
      }

      // Generic error UI for other errors
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened.
            </p>
            {this.state.error && (
              <details className="mb-4 text-left max-w-md mx-auto">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Go to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
