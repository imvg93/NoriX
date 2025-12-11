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
  Info
} from 'lucide-react';

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [videoDurationSec, setVideoDurationSec] = useState<number | undefined>(undefined);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);

  // Effect to ensure video plays when recording starts
  useEffect(() => {
    if (recording && liveVideoRef.current && streamRef.current) {
      const video = liveVideoRef.current;
      const stream = streamRef.current;
      
      console.log('🎥 useEffect: Ensuring video plays...');
      console.log('Video element:', video);
      console.log('Stream:', stream);
      console.log('Video srcObject:', video.srcObject);
      console.log('Video paused:', video.paused);
      
      // Ensure stream is attached
      if (video.srcObject !== stream) {
        console.log('🔄 Setting srcObject...');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
      }
      
      // Force play immediately
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
            console.log('✅ Video playing successfully');
          } catch (err: any) {
            console.warn('⚠️ Play failed:', err.name, err.message);
            setStreamReady(false);
          }
        }
      };
      
      // Try immediately
      setTimeout(forcePlay, 100);
      
      // Also try after delays
      const timeout1 = setTimeout(forcePlay, 300);
      const timeout2 = setTimeout(forcePlay, 600);
      const timeout3 = setTimeout(forcePlay, 1000);
      
      // Continuous retry if still paused (but less frequent)
      const playInterval = setInterval(() => {
        if (video && video.paused && video.srcObject) {
          console.log('🔄 Retrying play...');
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

  // Steps - all steps remain visible and actionable to reduce friction
  const steps = useMemo(() => {
    const idDone = !!safeStatus?.id_doc?.key;
    const videoDone = !!safeStatus?.video?.key;
    const verified = !!safeStatus?.verified;
    return [
      { title: 'Upload ID', subtitle: 'Image or PDF (≤10MB)', completed: idDone, current: !verified && !idDone },
      { title: 'Short Video', subtitle: '30–60 sec intro', completed: videoDone, current: !verified && idDone && !videoDone },
      { title: 'Review & Trial', subtitle: verified ? 'Verified' : (safeStatus?.trial_shift_status || 'Pending'), completed: verified, current: !verified && idDone && videoDone },
    ];
  }, [safeStatus]);

  const onPickId = useCallback(async (file: File, sha256: string) => {
    await uploadId(file, sha256);
  }, [uploadId]);

  const onPickVideo = useCallback(async (file: File, sha256: string) => {
    try {
      await uploadVideo(file, sha256, videoDurationSec);
      // Show success popup
      setShowSuccessPopup(true);
      setIsRetaking(false);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [uploadVideo, videoDurationSec]);

  // Webcam capture
  const startRecording = useCallback(async () => {
    try {
      setVideoBlobUrl(null);
      recordedChunksRef.current = [];
      setStreamReady(false);
      
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      streamRef.current = stream;
      console.log('✅ Camera stream obtained');
      console.log('Video tracks:', stream.getVideoTracks().length);
      console.log('Audio tracks:', stream.getAudioTracks().length);
      
      // Create MediaRecorder
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mr;
      
      // Set recording state first so video element is rendered
      setRecording(true);
      
      // Wait for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Set up live preview - MUST set srcObject AFTER element is rendered
      if (liveVideoRef.current) {
        const videoElement = liveVideoRef.current;
        console.log('📹 Setting up video element...');
        
        // Clear any existing stream first
        if (videoElement.srcObject) {
          const oldStream = videoElement.srcObject as MediaStream;
          oldStream.getTracks().forEach(track => track.stop());
        }
        
        // Set the new stream
        videoElement.srcObject = stream;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.autoplay = true;
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('webkit-playsinline', 'true');
        
        // Force play with multiple attempts
        const playVideo = async () => {
          try {
            if (videoElement && videoElement.srcObject) {
              videoElement.muted = true; // Ensure muted for autoplay
              await videoElement.play();
              console.log('✅ Video playing successfully');
              setStreamReady(true);
            }
          } catch (err: any) {
            console.warn('⚠️ Play failed:', err.name, err.message);
            setStreamReady(false);
          }
        };
        
        // Try to play immediately
        setTimeout(playVideo, 100);
        
        // Also try when metadata is loaded
        const handleMetadata = () => {
          console.log('📹 Metadata loaded');
          playVideo();
        };
        videoElement.addEventListener('loadedmetadata', handleMetadata, { once: true });
        
        const handleCanPlay = () => {
          console.log('📹 Can play');
          if (videoElement.paused && videoElement.srcObject) {
            playVideo();
          }
        };
        videoElement.addEventListener('canplay', handleCanPlay, { once: true });
        
        // Force play on any user interaction with the video
        const handleVideoClick = () => {
          if (videoElement.paused && videoElement.srcObject) {
            playVideo();
          }
        };
        videoElement.addEventListener('click', handleVideoClick);
      } else {
        console.error('❌ Video element not found!');
      }
      
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoBlobUrl(url);
        const video = document.createElement('video');
        video.src = url;
        video.onloadedmetadata = () => {
          setVideoDurationSec(video.duration || undefined);
        };
        
        // Stop all tracks
        stream.getTracks().forEach((t) => {
          t.stop();
        });
        
        // Clear live preview
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = null;
          liveVideoRef.current.load();
        }
        setStreamReady(false);
        streamRef.current = null;
      };
      
      // Start recording AFTER video is set up
      mr.start(1000); // Record in 1 second chunks
      console.log('🎬 Recording started');
    } catch (error: any) {
      console.error('❌ Error starting recording:', error);
      alert(`Failed to access camera: ${error.message || 'Please check permissions and try again.'}`);
      setRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  const uploadRecordedVideo = useCallback(async () => {
    if (!videoBlobUrl) return;
    try {
      const resp = await fetch(videoBlobUrl);
      const blob = await resp.blob();
      const file = new File([blob], 'intro.webm', { type: 'video/webm' });
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      await uploadVideo(file, sha256, videoDurationSec);
      // Show success popup
      setShowSuccessPopup(true);
      // Clear video blob
      setVideoBlobUrl(null);
      // Reset recording state
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
    // Stop any active media streams
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Video KYC Verification</h1>
              <p className="text-gray-600 mt-1">Complete your verification to unlock premium job opportunities</p>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`mb-8 rounded-xl p-6 ${
          safeStatus?.verified 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' 
            : safeStatus?.rejection_code
            ? 'bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200'
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {safeStatus?.verified ? (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
              ) : safeStatus?.rejection_code ? (
                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-8 h-8 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {safeStatus?.verified 
                    ? 'Verification Complete!' 
                    : safeStatus?.rejection_code 
                    ? 'Verification Rejected' 
                    : 'Verification in Progress'}
                </h2>
                <p className="text-gray-700">
                  {safeStatus?.verified 
                    ? 'You\'re all set! Start applying for higher-paying shifts now.'
                    : safeStatus?.rejection_code 
                    ? `Reason: ${safeStatus.rejection_code}. ${safeStatus.admin_notes || 'Please review and resubmit.'}`
                    : 'Your verification is being reviewed. This usually takes under 24 hours.'}
                </p>
                {safeStatus?.trial_shift_status && safeStatus.trial_shift_status !== 'not_requested' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Trial Status:</span>
                    <span className="px-2.5 py-1 rounded-full bg-white text-sm font-medium text-blue-700">
                      {safeStatus.trial_shift_status}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {safeStatus?.verified ? (
                <span className="px-3 py-1.5 rounded-full bg-green-600 text-white text-sm font-semibold">
                  Verified ✓
                </span>
              ) : safeStatus?.rejection_code ? (
                <span className="px-3 py-1.5 rounded-full bg-red-600 text-white text-sm font-semibold">
                  Rejected
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-sm font-semibold">
                  Pending Review
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <div id="steps" className="mb-8">
          <VerificationStepper steps={steps} />
        </div>

        {/* Step 1: ID Upload */}
        <section className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    safeStatus?.id_doc?.key ? 'bg-green-100' : 'bg-indigo-100'
                  }`}>
                    {safeStatus?.id_doc?.key ? (
                      <FileCheck className="w-5 h-5 text-green-600" />
                    ) : (
                      <Upload className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Step 1: Upload ID Document</h2>
                    <p className="text-sm text-gray-600 mt-0.5">Verify your identity with a government-issued ID</p>
                  </div>
                </div>
                {safeStatus?.id_doc?.key && (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Uploaded
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Accepted formats:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-500">
                      <li>JPG, PNG, WEBP, HEIC, or PDF</li>
                      <li>Maximum file size: 10MB</li>
                      <li>Ensure the document is clear and readable</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 transition-colors">
                <FileUploader
                  accept="image/*,application/pdf"
                  maxSizeBytes={10 * 1024 * 1024}
                  label="Choose ID Document"
                  onSelected={onPickId}
                />
              </div>
              
              {safeStatus?.id_doc?.preview_url && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">ID document received and processing...</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Step 2: Video Upload */}
        <section className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    safeStatus?.video?.key ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    {safeStatus?.video?.key ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Video className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Step 2: Record Introduction Video</h2>
                    <p className="text-sm text-gray-600 mt-0.5">Create a short video introducing yourself</p>
                  </div>
                </div>
                {safeStatus?.video?.key && (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Uploaded
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Video requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-500">
                      <li>Duration: 30-60 seconds</li>
                      <li>Show your face clearly</li>
                      <li>Introduce yourself briefly</li>
                      <li>Maximum file size: 50MB</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recording Controls */}
              <div className="space-y-4">
                {safeStatus?.video?.key && !isRetaking ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-green-900">Video Uploaded Successfully!</p>
                        <p className="text-sm text-green-700">Your video has been submitted for verification.</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleRetake}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera className="w-5 h-5" />
                      Retake Video
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    {!recording ? (
                      <button 
                        onClick={startRecording}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Camera className="w-5 h-5" />
                        Start Recording
                      </button>
                    ) : (
                      <button 
                        onClick={stopRecording}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                      >
                        <XCircle className="w-5 h-5" />
                        Stop Recording
                      </button>
                    )}
                    {videoBlobUrl && (
                      <button 
                        onClick={uploadRecordedVideo}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-5 h-5" />
                        {loading ? 'Uploading...' : 'Upload Recording'}
                      </button>
                    )}
                  </div>
                )}

                {/* Live Preview */}
                {recording && (
                  <div className="rounded-lg overflow-hidden border-2 border-indigo-400 bg-black shadow-lg">
                    <div 
                      className="relative w-full bg-black cursor-pointer" 
                      style={{ 
                        aspectRatio: '16/9', 
                        minHeight: '300px',
                        position: 'relative'
                      }}
                      onClick={async (e) => {
                        // Make entire container clickable to start video
                        e.preventDefault();
                        e.stopPropagation();
                        if (liveVideoRef.current && liveVideoRef.current.srcObject) {
                          try {
                            await liveVideoRef.current.play();
                            setStreamReady(true);
                            console.log('✅ Video started via click');
                          } catch (err) {
                            console.error('Click play failed:', err);
                            // Try again
                            setTimeout(async () => {
                              if (liveVideoRef.current && liveVideoRef.current.srcObject) {
                                try {
                                  await liveVideoRef.current.play();
                                  setStreamReady(true);
                                } catch (e2) {
                                  console.error('Second click attempt failed:', e2);
                                }
                              }
                            }, 100);
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
                          transform: 'scaleX(-1)', // Mirror the video
                          display: 'block',
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#000',
                          zIndex: 1
                        }}
                        onLoadedMetadata={async (e) => {
                          console.log('📹 Video metadata loaded');
                          const video = e.currentTarget;
                          if (video.srcObject && video.paused) {
                            try {
                              video.muted = true;
                              await video.play();
                              setStreamReady(true);
                              console.log('✅ Video playing after metadata');
                            } catch (err) {
                              console.error('Play failed on metadata:', err);
                            }
                          }
                        }}
                        onCanPlay={async (e) => {
                          console.log('📹 Video can play');
                          const video = e.currentTarget;
                          if (video.srcObject && video.paused) {
                            try {
                              video.muted = true;
                              await video.play();
                              setStreamReady(true);
                              console.log('✅ Video playing after canPlay');
                            } catch (err) {
                              console.error('Play failed on canPlay:', err);
                            }
                          }
                        }}
                        onPlay={() => {
                          console.log('✅ Video is now playing');
                          setStreamReady(true);
                        }}
                        onPlaying={() => {
                          console.log('✅ Video is playing');
                          setStreamReady(true);
                        }}
                        onPause={() => {
                          console.log('⏸️ Video paused');
                          setStreamReady(false);
                        }}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const video = e.currentTarget;
                          if (video.srcObject && video.paused) {
                            try {
                              video.muted = true;
                              await video.play();
                              setStreamReady(true);
                              console.log('✅ Video started via click');
                            } catch (err) {
                              console.error('Click play failed:', err);
                            }
                          }
                        }}
                      />
                      {/* Loading indicator if video not playing */}
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
                                console.log('✅ Video started via overlay click');
                              } catch (err) {
                                console.error('Overlay click play failed:', err);
                              }
                            }
                          }}
                        >
                          <div className="text-center text-white">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-sm font-medium">Camera ready</p>
                            <p className="text-xs mt-2 text-gray-300">Click here to start video</p>
                            {liveVideoRef.current?.srcObject && (
                              <p className="text-xs mt-1 text-yellow-300">Stream connected - click to play</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Recording...
                    </div>
                  </div>
                )}

                {/* Recorded Video Preview */}
                {videoBlobUrl && !recording && (
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <video src={videoBlobUrl} controls className="w-full rounded-lg" />
                  </div>
                )}

                {/* Upload Alternative */}
                {(!safeStatus?.video?.key || isRetaking) && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600 mb-3 text-center">or</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-400 transition-colors">
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
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">Video received and processing...</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Step 3: Status & Details */}
        <section className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Info className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Step 3: Verification Status</h2>
                  <p className="text-sm text-gray-600 mt-0.5">Track your verification progress</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Verification Status</h3>
                  </div>
                  <p className="text-lg font-bold text-blue-700">
                    {safeStatus?.verified ? 'Verified' : safeStatus?.rejection_code ? 'Rejected' : 'Pending Review'}
                  </p>
                  {safeStatus?.trial_shift_status && safeStatus.trial_shift_status !== 'not_requested' && (
                    <p className="text-sm text-gray-600 mt-1">
                      Trial: <span className="font-medium">{safeStatus.trial_shift_status}</span>
                    </p>
                  )}
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Auto Checks</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">OCR Confidence:</span>{' '}
                      <span className="text-purple-700">{safeStatus?.auto_checks?.ocr_confidence ?? '—'}</span>
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Face Match:</span>{' '}
                      <span className="text-purple-700">{safeStatus?.auto_checks?.face_match_score ?? '—'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!safeStatus?.verified && !safeStatus?.rejection_code && (
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => requestTrial()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Request Trial Shift
                  </button>
                  <button
                    onClick={() => refresh()}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 mb-1">🎉 Verification Complete!</p>
                    <p className="text-sm text-green-700">You're all set! Start applying for higher-paying shifts now.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSuccessPopup(false)}>
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Video Uploaded Successfully!</h3>
                <p className="text-gray-600 mb-6">
                  Your video has been submitted and is being processed. You will be notified once verification is complete.
                </p>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
