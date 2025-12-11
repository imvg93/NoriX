"use client";

import { useEffect } from 'react';
import { ChunkErrorHandler } from '../utils/chunkErrorHandler';

/**
 * Client component that sets up global chunk loading error handling.
 * This runs early to catch chunk loading errors before React renders.
 */
export default function ChunkErrorHandlerSetup() {
  useEffect(() => {
    // Set up global error handlers for chunk loading errors
    ChunkErrorHandler.setupGlobalHandler();
    
    // Also handle Next.js specific chunk errors
    if (typeof window !== 'undefined') {
      // Handle script loading errors
      const handleScriptError = (event: ErrorEvent) => {
        const error = event.error || new Error(event.message || 'Unknown error');
        if (
          error.name === 'ChunkLoadError' ||
          event.message?.includes('Loading chunk') ||
          event.message?.includes('ChunkLoadError') ||
          event.message?.includes('timeout')
        ) {
          console.warn('🔄 Chunk loading error detected via script error handler:', error);
          const handled = ChunkErrorHandler.handleChunkError(error);
          if (handled) {
            event.preventDefault();
          }
        }
      };

      window.addEventListener('error', handleScriptError);

      // Handle dynamic import failures
      const originalImport = (window as any).__webpack_require__?.cache;
      
      return () => {
        window.removeEventListener('error', handleScriptError);
      };
    }
  }, []);

  // This component doesn't render anything
  return null;
}

