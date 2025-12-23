'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useVerification, { type VerificationStatus } from '../../hooks/useVerification';
import VerificationStepper from '../../components/VerificationStepper';
import FileUploader from '../../components/FileUploader';
import { 
  CheckCircle, 
  Clock, 
  Upload, 
  Video, 
  AlertCircle, 
  RefreshCw,
  Shield,
  FileCheck,
  Camera,
  XCircle,
  Info,
  ArrowLeft,
  Sparkles,
  Lock,
  Eye,
  Play,
  Pause,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Default status used when there is no status from the API yet
const defaultStatus: VerificationStatus = {
  verified: false,
  trial_shift_status: 'not_requested',
  id_doc: { submitted_at: null, preview_url: null },
  video: { submitted_at: null, preview_url: null },
  auto_checks: {},
  timeline: ['Not Started'],
  rejection_code: null,
  admin_notes: '',
};

export default function VerificationPage() {
  const { status, loading, error, uploadId, uploadVideo, deleteVideo, requestTrial, refresh } = useVerification();
  
  // Ensure status has safe defaults to prevent errors
  const safeStatus: VerificationStatus = status || defaultStatus;
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [fillTestDataLoading, setFillTestDataLoading] = useState(false);
  const [fillTestDataError, setFillTestDataError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [videoDurationSec, setVideoDurationSec] = useState<number | undefined>(undefined);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (recording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recording]);

  // Effect to ensure video plays when recording starts
  useEffect(() => {
    if (recording && liveVideoRef.current && streamRef.current) {
      const video = liveVideoRef.current;
      const stream = streamRef.current;
      
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
      }
      
      const forcePlay = async () => {
        if (video && video.srcObject) {
          try {
            video.muted = true;
            video.playsInline = true;
            video.autoplay = true;
            if (video.paused) {
              await video.play();
            }
            setStreamReady(true);
          } catch (err: any) {
            console.warn('⚠️ Play failed:', err.name, err.message);
            setStreamReady(false);
          }
        }
      };
      
      setTimeout(forcePlay, 100);
      const timeout1 = setTimeout(forcePlay, 300);
      const timeout2 = setTimeout(forcePlay, 600);
      const timeout3 = setTimeout(forcePlay, 1000);
      
      const playInterval = setInterval(() => {
        if (video && video.paused && video.srcObject) {
          forcePlay();
        } else if (video && !video.paused) {
          setStreamReady(true);
        }
      }, 2000);
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        clearInterval(playInterval);
      };
    }
  }, [recording]);

  // Steps
  const steps = useMemo(() => {
    const idDone = !!safeStatus?.id_doc?.key;
    const videoDone = !!safeStatus?.video?.key;
    const verified = !!safeStatus?.verified;
    return [
      { title: 'Upload ID', subtitle: 'Image or PDF (≤10MB)', completed: idDone, current: !verified && !idDone },
      { title: 'Record Video', subtitle: '30–60 sec intro', completed: videoDone, current: !verified && idDone && !videoDone },
      { title: 'Review & Verify', subtitle: verified ? 'Verified' : (safeStatus?.trial_shift_status || 'Pending'), completed: verified, current: !verified && idDone && videoDone },
    ];
  }, [safeStatus]);

  const onPickId = useCallback(async (file: File, sha256: string) => {
    await uploadId(file, sha256);
  }, [uploadId]);

  const onPickVideo = useCallback(async (file: File, sha256: string) => {
    try {
      await uploadVideo(file, sha256, videoDurationSec);
      setShowSuccessPopup(true);
      setIsRetaking(false);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [uploadVideo, videoDurationSec]);

  // Helper function to get supported MIME type
  const getSupportedMimeType = useCallback(() => {
    if (typeof window === 'undefined' || !window.MediaRecorder) {
      return '';
    }
    
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
      'video/ogg;codecs=theora,vorbis',
      'video/ogg',
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    // Fallback to default (browser will choose)
    return '';
  }, []);

  // Webcam capture
  const startRecording = useCallback(async () => {
    try {
      // Check if MediaRecorder is supported
      if (typeof window === 'undefined' || !window.MediaRecorder) {
        throw new Error('MediaRecorder API is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      }

      setVideoBlobUrl(null);
      recordedChunksRef.current = [];
      setStreamReady(false);
      setRecordingTime(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      // Get supported MIME type
      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      
      let mr: MediaRecorder;
      try {
        mr = new MediaRecorder(stream, options);
      } catch (err: any) {
        // If that fails, try without options (browser default)
        console.warn('Failed to create MediaRecorder with options, trying default:', err);
        try {
          mr = new MediaRecorder(stream);
        } catch (err2: any) {
          console.error('Failed to create MediaRecorder even without options:', err2);
          stream.getTracks().forEach((t) => t.stop());
          throw new Error('Failed to initialize video recorder. Your browser may not support video recording.');
        }
      }
      
      mediaRecorderRef.current = mr;
      
      setRecording(true);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (liveVideoRef.current) {
        const videoElement = liveVideoRef.current;
        
        if (videoElement.srcObject) {
          const oldStream = videoElement.srcObject as MediaStream;
          oldStream.getTracks().forEach(track => track.stop());
        }
        
        videoElement.srcObject = stream;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.autoplay = true;
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('webkit-playsinline', 'true');
        
        const playVideo = async () => {
          try {
            if (videoElement && videoElement.srcObject) {
              videoElement.muted = true;
              await videoElement.play();
              setStreamReady(true);
            }
          } catch (err: any) {
            console.warn('⚠️ Play failed:', err.name, err.message);
            setStreamReady(false);
          }
        };
        
        setTimeout(playVideo, 100);
        videoElement.addEventListener('loadedmetadata', playVideo, { once: true });
        videoElement.addEventListener('canplay', playVideo, { once: true });
      }
      
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      mr.onstop = () => {
        // Get the MIME type from the MediaRecorder or use default
        const mimeType = mr.mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setVideoBlobUrl(url);
        const video = document.createElement('video');
        video.src = url;
        video.onloadedmetadata = () => {
          setVideoDurationSec(video.duration || undefined);
        };
        
        stream.getTracks().forEach((t) => {
          t.stop();
        });
        
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = null;
          liveVideoRef.current.load();
        }
        setStreamReady(false);
        streamRef.current = null;
      };

      // Handle errors
      mr.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        setRecording(false);
        alert('An error occurred while recording. Please try again.');
      };
      
      // Start recording with chunks every second
      try {
        mr.start(1000);
      } catch (err: any) {
        console.error('Failed to start MediaRecorder:', err);
        // Try starting without time slice
        try {
          mr.start();
        } catch (err2: any) {
          console.error('Failed to start MediaRecorder even without time slice:', err2);
          stream.getTracks().forEach((t) => t.stop());
          setRecording(false);
          throw new Error('Failed to start recording. Your browser may not support video recording. Please try using Chrome, Firefox, or Edge.');
        }
      }
    } catch (error: any) {
      console.error('❌ Error starting recording:', error);
      
      let errorMessage = 'Failed to start recording. ';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera and microphone access and try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera or microphone found. Please connect a device and try again.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Your browser does not support video recording. Please use Chrome, Firefox, or Edge.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera or microphone is already in use by another application.';
      } else {
        errorMessage += error.message || 'Please check permissions and try again.';
      }
      
      alert(errorMessage);
      setRecording(false);
      
      // Clean up any partial setup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = null;
      }
    }
  }, [getSupportedMimeType]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  const uploadRecordedVideo = useCallback(async () => {
    if (!videoBlobUrl) return;
    try {
      const resp = await fetch(videoBlobUrl);
      const blob = await resp.blob();
      
      // Get the actual MIME type from the blob or use MediaRecorder's type
      const mimeType = blob.type || (mediaRecorderRef.current?.mimeType) || 'video/webm';
      const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      
      const file = new File([blob], `intro.${extension}`, { type: mimeType });
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      await uploadVideo(file, sha256, videoDurationSec);
      setShowSuccessPopup(true);
      setVideoBlobUrl(null);
      setRecording(false);
      setIsRetaking(false);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [videoBlobUrl, uploadVideo, videoDurationSec]);

  const handleRetake = useCallback(() => {
    setIsRetaking(true);
    setVideoBlobUrl(null);
    setRecording(false);
    recordedChunksRef.current = [];
    setRecordingTime(0);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fill test data function
  const fillTestData = useCallback(async () => {
    try {
      setFillTestDataLoading(true);
      setFillTestDataError(null);

      // Create a test ID document (simple PNG image)
      const createTestIdFile = async (): Promise<File> => {
        // Create a simple 1x1 PNG image (minimal valid PNG)
        // PNG signature + minimal IHDR chunk
        const pngData = new Uint8Array([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
          0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
          0x49, 0x48, 0x44, 0x52, // "IHDR"
          0x00, 0x00, 0x00, 0x01, // width: 1
          0x00, 0x00, 0x00, 0x01, // height: 1
          0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
          0x1F, 0x15, 0xC4, 0x89, // CRC
          0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
          0x49, 0x44, 0x41, 0x54, // "IDAT"
          0x78, 0x9C, 0x63, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
          0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
        ]);
        
        const blob = new Blob([pngData], { type: 'image/png' });
        const file = new File([blob], 'test-id-document.png', { type: 'image/png' });
        return file;
      };

      // Create a test video file (minimal WebM)
      const createTestVideoFile = async (): Promise<File> => {
        // Create a minimal valid WebM file
        const webmData = new Uint8Array([
          0x1A, 0x45, 0xDF, 0xA3, // EBML header
          0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F,
          0x42, 0x86, 0x81, 0x01, // EBML version
          0x42, 0xF7, 0x81, 0x01, // EBML read version
          0x42, 0xF2, 0x81, 0x04, // EBML max ID length
          0x42, 0xF3, 0x81, 0x08, // EBML max size length
          0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6D, // DocType: "webm"
          0x42, 0x87, 0x81, 0x02, // DocType version
          0x42, 0x85, 0x81, 0x02  // DocType read version
        ]);
        
        const blob = new Blob([webmData], { type: 'video/webm' });
        const file = new File([blob], 'test-video.webm', { type: 'video/webm' });
        return file;
      };

      // Upload test ID document if not already uploaded
      if (!safeStatus?.id_doc?.key) {
        try {
          const testIdFile = await createTestIdFile();
          const buffer = await testIdFile.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
          await uploadId(testIdFile, sha256);
          // Wait a bit before next upload
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.error('Failed to upload test ID:', err);
          // Continue even if ID upload fails
        }
      }

      // Upload test video if not already uploaded
      if (!safeStatus?.video?.key) {
        try {
          const testVideoFile = await createTestVideoFile();
          const buffer = await testVideoFile.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
          await uploadVideo(testVideoFile, sha256, 45); // 45 seconds duration
        } catch (err) {
          console.error('Failed to upload test video:', err);
        }
      }

      // Refresh status after uploads
      await refresh();
    } catch (err: any) {
      console.error('Fill test data error:', err);
      setFillTestDataError(err.message || 'Failed to fill test data');
    } finally {
      setFillTestDataLoading(false);
    }
  }, [safeStatus, uploadId, uploadVideo, refresh]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/student/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2A8A8C] rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Video KYC Verification</h1>
                  <p className="text-sm text-gray-600">Complete your verification to unlock premium opportunities</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fillTestData}
                disabled={fillTestDataLoading || loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Fill test data for testing"
              >
                <Zap className="w-4 h-4" />
                {fillTestDataLoading ? 'Filling...' : 'Fill Test Data'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 rounded-lg p-6 border ${
              safeStatus?.verified 
                ? 'bg-green-50 border-green-200 text-green-900' 
                : safeStatus?.rejection_code
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-[#2A8A8C] border-[#2A8A8C] text-white'
            }`}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-4">
                {safeStatus?.verified ? (
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                ) : safeStatus?.rejection_code ? (
                  <div className="p-3 bg-red-100 rounded-lg">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                ) : (
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">
                    {safeStatus?.verified 
                      ? 'Verification Complete!' 
                      : safeStatus?.rejection_code 
                      ? 'Verification Rejected' 
                      : 'Verification in Progress'}
                  </h2>
                  <p className={`text-lg ${
                    safeStatus?.verified ? 'text-green-800' : 
                    safeStatus?.rejection_code ? 'text-red-800' : 
                    'text-white'
                  }`}>
                    {safeStatus?.verified 
                      ? 'You\'re all set! Start applying for higher-paying shifts now.'
                      : safeStatus?.rejection_code 
                      ? `${safeStatus.rejection_code}. ${safeStatus.admin_notes || 'Please review and resubmit.'}`
                      : 'Your verification is being reviewed. This usually takes under 24 hours.'}
                  </p>
                  {safeStatus?.trial_shift_status && safeStatus.trial_shift_status !== 'not_requested' && (
                    <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                      safeStatus?.verified ? 'bg-green-100' : 
                      safeStatus?.rejection_code ? 'bg-red-100' : 
                      'bg-white/20'
                    }`}>
                      <span className="text-sm font-medium">Trial Status:</span>
                      <span className={`px-2.5 py-1 rounded-md text-sm font-semibold ${
                        safeStatus?.verified ? 'bg-green-200 text-green-800' : 
                        safeStatus?.rejection_code ? 'bg-red-200 text-red-800' : 
                        'bg-white/30 text-white'
                      }`}>
                        {safeStatus.trial_shift_status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {safeStatus?.verified ? (
                  <span className="px-4 py-2 bg-green-200 text-green-800 rounded-lg text-sm font-bold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Verified
                  </span>
                ) : safeStatus?.rejection_code ? (
                  <span className="px-4 py-2 bg-red-200 text-red-800 rounded-lg text-sm font-bold">
                    Rejected
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-bold">
                    Pending Review
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress Stepper */}
        <div id="steps" className="mb-8">
          <VerificationStepper steps={steps} />
        </div>

        {/* Step 1: ID Upload */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#2A8A8C] px-6 py-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    safeStatus?.id_doc?.key ? 'bg-green-500' : 'bg-white/20'
                  }`}>
                    {safeStatus?.id_doc?.key ? (
                      <FileCheck className="w-6 h-6 text-white" />
                    ) : (
                      <Upload className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Step 1: Upload ID Document</h2>
                    <p className="text-white/90 text-sm mt-1">Verify your identity with a government-issued ID</p>
                  </div>
                </div>
                {safeStatus?.id_doc?.key && (
                  <span className="px-4 py-2 bg-white/20 rounded-lg text-white text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Uploaded
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-2 text-gray-900">Accepted formats:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>JPG, PNG, WEBP, HEIC, or PDF</li>
                      <li>Maximum file size: 10MB</li>
                      <li>Ensure the document is clear and readable</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-[#2A8A8C] transition-all bg-gray-50">
                <FileUploader
                  accept="image/*,application/pdf"
                  maxSizeBytes={10 * 1024 * 1024}
                  label="Choose ID Document"
                  onSelected={onPickId}
                />
              </div>
              
              {safeStatus?.id_doc?.preview_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
                >
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-800 font-semibold">ID document received and processing...</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Step 2: Video Upload */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#2A8A8C] px-6 py-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    safeStatus?.video?.key ? 'bg-green-500' : 'bg-white/20'
                  }`}>
                    {safeStatus?.video?.key ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <Video className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Step 2: Record Introduction Video</h2>
                    <p className="text-white/90 text-sm mt-1">Create a short video introducing yourself</p>
                  </div>
                </div>
                {safeStatus?.video?.key && (
                  <span className="px-4 py-2 bg-white/20 rounded-lg text-white text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Uploaded
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-2 text-gray-900">Video requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Duration: 30-60 seconds</li>
                      <li>Show your face clearly</li>
                      <li>Introduce yourself briefly</li>
                      <li>Maximum file size: 50MB</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recording Controls */}
              <div className="space-y-6">
                {safeStatus?.video?.key && !isRetaking ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 p-5 bg-green-50 border border-green-200 rounded-lg flex items-center gap-4">
                      <div className="p-3 bg-green-500 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-green-900 text-lg">Video Uploaded Successfully!</p>
                        <p className="text-sm text-green-700">Your video has been submitted for verification.</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleRetake}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera className="w-5 h-5" />
                      Retake Video
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-4">
                    {!recording ? (
                      <button 
                        onClick={startRecording}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Camera className="w-6 h-6" />
                        Start Recording
                      </button>
                    ) : (
                      <button 
                        onClick={stopRecording}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-bold"
                      >
                        <Pause className="w-6 h-6" />
                        Stop Recording ({formatTime(recordingTime)})
                      </button>
                    )}
                    {videoBlobUrl && (
                      <button 
                        onClick={uploadRecordedVideo}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-6 h-6" />
                        {loading ? 'Uploading...' : 'Upload Recording'}
                      </button>
                    )}
                  </div>
                )}

                {/* Live Preview */}
                {recording && (
                  <div className="rounded-lg overflow-hidden border-2 border-[#2A8A8C] bg-black shadow-lg">
                    <div 
                      className="relative w-full bg-black cursor-pointer" 
                      style={{ 
                        aspectRatio: '16/9', 
                        minHeight: '400px',
                        position: 'relative'
                      }}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (liveVideoRef.current && liveVideoRef.current.srcObject) {
                          try {
                            await liveVideoRef.current.play();
                            setStreamReady(true);
                          } catch (err) {
                            console.error('Click play failed:', err);
                          }
                        }
                      }}
                    >
                      <video 
                        ref={liveVideoRef} 
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                        style={{ 
                          transform: 'scaleX(-1)',
                          display: 'block',
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#000',
                          zIndex: 1
                        }}
                        onLoadedMetadata={async (e) => {
                          const video = e.currentTarget;
                          if (video.srcObject && video.paused) {
                            try {
                              video.muted = true;
                              await video.play();
                              setStreamReady(true);
                            } catch (err) {
                              console.error('Play failed on metadata:', err);
                            }
                          }
                        }}
                        onCanPlay={async (e) => {
                          const video = e.currentTarget;
                          if (video.srcObject && video.paused) {
                            try {
                              video.muted = true;
                              await video.play();
                              setStreamReady(true);
                            } catch (err) {
                              console.error('Play failed on canPlay:', err);
                            }
                          }
                        }}
                        onPlay={() => setStreamReady(true)}
                        onPlaying={() => setStreamReady(true)}
                        onPause={() => setStreamReady(false)}
                      />
                      {(!streamReady || (liveVideoRef.current && liveVideoRef.current.paused)) && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-10 cursor-pointer"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (liveVideoRef.current && liveVideoRef.current.srcObject) {
                              try {
                                liveVideoRef.current.muted = true;
                                await liveVideoRef.current.play();
                                setStreamReady(true);
                              } catch (err) {
                                console.error('Overlay click play failed:', err);
                              }
                            }
                          }}
                        >
                          <div className="text-center text-white">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                            <p className="text-lg font-semibold">Camera ready</p>
                            <p className="text-sm mt-2 text-gray-300">Click here to start video</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-red-500 text-white px-6 py-3 text-center text-base font-bold flex items-center justify-center gap-3">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      Recording... {formatTime(recordingTime)}
                    </div>
                  </div>
                )}

                {/* Recorded Video Preview */}
                {videoBlobUrl && !recording && (
                  <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <video src={videoBlobUrl} controls className="w-full rounded-lg" />
                  </div>
                )}

                {/* Upload Alternative */}
                {(!safeStatus?.video?.key || isRetaking) && (
                  <div className="border-t border-gray-200 pt-6">
                    <p className="text-sm text-gray-600 mb-4 text-center font-medium">or</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#2A8A8C] transition-all bg-gray-50">
                      <FileUploader
                        accept="video/*"
                        maxSizeBytes={50 * 1024 * 1024}
                        label="Upload Video File"
                        onSelected={onPickVideo}
                        preview={false}
                      />
                    </div>
                  </div>
                )}
              </div>

              {safeStatus?.video?.preview_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
                >
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-800 font-semibold">Video received and processing...</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Step 3: Status & Details */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#2A8A8C] px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Step 3: Verification Status</h2>
                  <p className="text-white/90 text-sm mt-1">Track your verification progress</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#2A8A8C] rounded-lg">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Verification Status</h3>
                  </div>
                  <p className="text-2xl font-bold text-[#2A8A8C] mb-2">
                    {safeStatus?.verified ? 'Verified' : safeStatus?.rejection_code ? 'Rejected' : 'Pending Review'}
                  </p>
                  {safeStatus?.trial_shift_status && safeStatus.trial_shift_status !== 'not_requested' && (
                    <p className="text-sm text-gray-600">
                      Trial: <span className="font-semibold">{safeStatus.trial_shift_status}</span>
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#2A8A8C] rounded-lg">
                      <FileCheck className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Auto Checks</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                      <span className="font-semibold">OCR Confidence:</span>{' '}
                      <span className="text-[#2A8A8C] font-bold">{safeStatus?.auto_checks?.ocr_confidence ?? '—'}</span>
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Face Match:</span>{' '}
                      <span className="text-[#2A8A8C] font-bold">{safeStatus?.auto_checks?.face_match_score ?? '—'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!safeStatus?.verified && !safeStatus?.rejection_code && (
                <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => requestTrial()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-all font-semibold"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Request Trial Shift
                  </button>
                  <button
                    onClick={() => refresh()}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Refresh Status
                  </button>
                  <p className="text-xs text-gray-500 ml-auto">
                    One free resubmission within 14 days if rejected
                  </p>
                </div>
              )}

              {safeStatus?.verified && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-5 bg-green-50 border border-green-200 rounded-lg flex items-start gap-4"
                >
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900 text-lg mb-1">Verification Complete!</p>
                    <p className="text-sm text-green-700">You're all set! Start applying for higher-paying shifts now.</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-5 flex items-start gap-3"
          >
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Success Popup */}
        <AnimatePresence>
          {showSuccessPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowSuccessPopup(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-500 mb-6"
                  >
                    <CheckCircle className="h-10 w-10 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Video Uploaded Successfully!</h3>
                  <p className="text-gray-600 mb-6">
                    Your video has been submitted and is being processed. You will be notified once verification is complete.
                  </p>
                  <button
                    onClick={() => setShowSuccessPopup(false)}
                    className="w-full px-6 py-3 bg-[#2A8A8C] text-white rounded-lg hover:bg-[#1f6a6c] transition-all font-semibold"
                  >
                    Got it!
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
