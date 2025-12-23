"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, Trash2, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';

interface SelfieCaptureProps {
  currentUrl: string;
  onCapture: (url: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}

export const SelfieCapture: React.FC<SelfieCaptureProps> = ({ currentUrl, onCapture, onDelete, disabled }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      setError(null);
      setVideoReady(false);
      
      // Use simpler constraints for faster camera access
      // Let browser choose optimal settings instead of specifying exact dimensions
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user'
          // Remove specific dimensions - let browser optimize for speed
        },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        
        // Show video immediately when it starts playing
        video.onplaying = () => {
          setVideoReady(true);
        };
        
        // Fallback: if onplaying doesn't fire, check metadata after a short delay
        video.onloadedmetadata = () => {
          // Small delay to ensure video is actually ready to display
          setTimeout(() => {
            if (video.readyState >= 2) { // HAVE_CURRENT_DATA
              setVideoReady(true);
            }
          }, 100);
        };
        
        video.onerror = () => {
          setError('Failed to load camera stream');
          setIsCapturing(false);
        };
        
        // Try to play immediately
        video.play().catch((err) => {
          console.error('Video play error:', err);
          // Still show it if stream is available
          if (video.readyState >= 1) {
            setVideoReady(true);
          }
        });
      }
    } catch (err: any) {
      setError('Failed to access camera. Please allow camera permissions.');
      console.error('Camera error:', err);
      setIsCapturing(false);
      setVideoReady(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
    setVideoReady(false);
    if (videoRef.current) {
      const video = videoRef.current;
      video.srcObject = null;
      video.onloadedmetadata = null;
      video.onplaying = null;
      video.onerror = null;
      video.pause();
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !videoReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Create square crop (1:1 aspect ratio)
    const size = Math.min(video.videoWidth, video.videoHeight);
    const x = (video.videoWidth - size) / 2;
    const y = (video.videoHeight - size) / 2;
    
    // Set canvas to square dimensions
    canvas.width = 640;
    canvas.height = 640;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clear canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw cropped and scaled square image
      ctx.drawImage(
        video,
        x, y, size, size,  // Source rectangle (square crop from center)
        0, 0, canvas.width, canvas.height // Destination rectangle (square canvas)
      );
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const fd = new FormData();
            // Append documentType FIRST (some servers expect text fields before files)
            fd.append('documentType', 'selfie');
            fd.append('document', blob, 'selfie.jpg');
            
            console.log('📤 Sending selfie upload:', {
              hasBlob: !!blob,
              blobSize: blob.size,
              blobType: blob.type,
              formDataFields: ['documentType', 'document']
            });
            
            const res = await apiService.post<any>('/upload/kyc-document', fd as any);
            
            // Backend returns: { success: true, message: "...", data: { url: "...", documentUrl: "..." } }
            // apiService.post wraps it: { data: { success: true, message: "...", data: { ... } } }
            const responseData = (res as any)?.data;
            const url = responseData?.data?.documentUrl || responseData?.data?.url || responseData?.documentUrl || responseData?.url || '';
            
            console.log('Selfie upload response:', { res, responseData, url });
            
            if (url) {
              onCapture(url);
              stopCamera();
            } else {
              throw new Error('Failed to get selfie URL from response');
            }
          } catch (e: any) {
            console.error('Selfie upload error:', e);
            const errorMsg = e?.response?.data?.message || e?.details?.message || e?.message || 'Failed to upload selfie';
            setError(errorMsg);
          }
        }
      }, 'image/jpeg', 0.9);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (currentUrl) {
    return (
      <div className="space-y-3">
        <div className="relative inline-block">
          <img
            src={currentUrl}
            alt="Selfie"
            className="w-64 h-64 object-cover rounded-lg border-2 border-green-300 shadow-sm"
            style={{ aspectRatio: '1/1' }}
          />
          <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={onDelete}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Retake
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {!isCapturing ? (
        <button
          type="button"
          onClick={startCamera}
          disabled={disabled}
          className="w-full py-4 px-6 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Camera className="w-5 h-5" />
          Open Camera
        </button>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center aspect-square">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ 
                transform: 'scaleX(-1)',
                opacity: videoReady ? 1 : 0,
                transition: 'opacity 0.2s',
                backgroundColor: '#000'
              }}
              onLoadedData={() => {
                if (!videoReady && videoRef.current && videoRef.current.readyState !== undefined && videoRef.current.readyState >= 2) {
                  setVideoReady(true);
                }
              }}
              onCanPlay={() => {
                if (!videoReady) {
                  setVideoReady(true);
                }
              }}
            />
            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                  <p className="text-sm">Starting camera...</p>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={capturePhoto}
              disabled={!videoReady}
              className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5 inline mr-2" />
              Capture Photo
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-2">Instructions:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Good lighting</li>
          <li>No cap / mask</li>
          <li>Face clearly visible</li>
        </ul>
      </div>
    </div>
  );
};


