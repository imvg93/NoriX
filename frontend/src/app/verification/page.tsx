'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useVerification from '../../hooks/useVerification';
import VerificationStepper from '../../components/VerificationStepper';
import FileUploader from '../../components/FileUploader';

export default function VerificationPage() {
  const { status, loading, error, uploadId, uploadVideo, requestTrial, refresh } = useVerification();
  
  // Ensure status has safe defaults to prevent errors
  const safeStatus = status || {
    verified: false,
    trial_shift_status: 'not_requested',
    id_doc: { key: null, submitted_at: null, preview_url: null },
    video: { key: null, submitted_at: null, preview_url: null },
    auto_checks: {},
    timeline: ['Not Started']
  };
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [videoDurationSec, setVideoDurationSec] = useState<number | undefined>(undefined);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);

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
    await uploadVideo(file, sha256, videoDurationSec);
  }, [uploadVideo, videoDurationSec]);

  // Webcam capture
  const startRecording = useCallback(async () => {
    setVideoBlobUrl(null);
    recordedChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mr;
    // Live preview
    try {
      if (liveVideoRef.current) {
        (liveVideoRef.current as any).srcObject = stream;
        liveVideoRef.current.muted = true;
        liveVideoRef.current.playsInline = true;
        // play may need to be awaited in some browsers
        const p = liveVideoRef.current.play();
        if (p && typeof (p as Promise<void>).catch === 'function') {
          (p as Promise<void>).catch(() => {});
        }
      }
    } catch {}
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
      // Stop stream and clear live preview
      stream.getTracks().forEach((t) => t.stop());
      if (liveVideoRef.current) {
        try {
          (liveVideoRef.current as any).srcObject = null;
        } catch {}
      }
    };
    mr.start();
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  const uploadRecordedVideo = useCallback(async () => {
    if (!videoBlobUrl) return;
    const resp = await fetch(videoBlobUrl);
    const blob = await resp.blob();
    const file = new File([blob], 'intro.webm', { type: 'video/webm' });
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    await uploadVideo(file, sha256, videoDurationSec);
  }, [videoBlobUrl, uploadVideo, videoDurationSec]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Get Verified</h1>
            <p className="mt-1 text-sm text-gray-600">
              Unlock higher-paying shifts. Review usually in under 24 hours.
            </p>
          </div>
          {!safeStatus?.verified && (
            <a
              href="#steps"
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Start Verification
            </a>
          )}
        </div>
        {/* Status chips */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className={`px-2.5 py-1 rounded-full ${safeStatus?.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {safeStatus?.verified ? 'Verified' : 'Not Verified'}
          </span>
          {safeStatus?.trial_shift_status && (
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              Trial: {safeStatus.trial_shift_status}
            </span>
          )}
          {safeStatus?.rejection_code && (
            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
              Rejected: {safeStatus.rejection_code}
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div id="steps" className="mt-6">
        <VerificationStepper steps={steps} />
      </div>

      {/* Step 1: ID Upload */}
      <section className="mt-8">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Upload your ID</h2>
            {safeStatus?.id_doc?.key && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Received</span>}
          </div>
          <p className="mt-1 text-sm text-gray-600">JPG, PNG, WEBP, HEIC, or PDF. Clear and readable.</p>
          <div className="mt-4">
            <FileUploader
              accept="image/*,application/pdf"
              maxSizeBytes={10 * 1024 * 1024}
              label="Choose ID file"
              onSelected={onPickId}
            />
          </div>
          {safeStatus?.id_doc?.preview_url && (
            <div className="mt-3 text-sm text-green-700">ID received. Processing…</div>
          )}
        </div>
      </section>

      {/* Step 2: Video Capture */}
      <section className="mt-6">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Short introduction video</h2>
            {safeStatus?.video?.key && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Received</span>}
          </div>
          <p className="mt-1 text-sm text-gray-600">30–60 seconds. Introduce yourself and show your face clearly.</p>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {!recording ? (
                <button onClick={startRecording} className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                  Start Recording
                </button>
              ) : (
                <button onClick={stopRecording} className="inline-flex items-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
                  Stop Recording
                </button>
              )}
              {videoBlobUrl && (
                <button onClick={uploadRecordedVideo} className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                  Upload Recording
                </button>
              )}
            </div>
            {/* Live preview while recording */}
            {recording && (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <video ref={liveVideoRef} className="w-full h-auto bg-black rounded-lg" />
              </div>
            )}
            {videoBlobUrl && <video src={videoBlobUrl} controls className="w-full rounded-lg" />}
            <div className="mt-2">
              <FileUploader
                accept="video/*"
                maxSizeBytes={50 * 1024 * 1024}
                label="Or upload a video file"
                onSelected={onPickVideo}
                preview={false}
              />
            </div>
            {safeStatus?.video?.preview_url && (
              <div className="mt-2 text-sm text-green-700">Video received. Processing…</div>
            )}
          </div>
        </div>
      </section>

      {/* Step 3: Status & Trial */}
      <section className="mt-6">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">Status & Trial</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-gray-700">
                <span className="font-medium">Status:</span>{' '}
                {safeStatus?.verified ? 'Verified' : safeStatus?.rejection_code ? 'Rejected' : 'Pending'}
              </div>
              <div className="mt-1 text-gray-700">
                <span className="font-medium">Trial:</span> {safeStatus?.trial_shift_status || 'not_requested'}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-gray-700">
                <span className="font-medium">OCR:</span> {safeStatus?.auto_checks?.ocr_confidence ?? '—'}
              </div>
              <div className="mt-1 text-gray-700">
                <span className="font-medium">Face match:</span> {safeStatus?.auto_checks?.face_match_score ?? '—'}
              </div>
            </div>
          </div>
          {safeStatus?.rejection_code && (
            <div className="mt-3 rounded-lg bg-rose-50 text-rose-700 p-3 text-sm">
              <span className="font-medium">Reason:</span> {safeStatus.rejection_code}. {safeStatus.admin_notes || ''}
            </div>
          )}
          {!safeStatus?.verified && !safeStatus?.rejection_code && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => requestTrial()}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Request Trial Shift
              </button>
              <button
                onClick={() => refresh()}
                className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Refresh Status
              </button>
              <span className="text-xs text-gray-500">One free resubmission within 14 days if rejected.</span>
            </div>
          )}
          {safeStatus?.verified && (
            <div className="mt-4 rounded-lg bg-green-50 text-green-700 p-3 text-sm">
              🎉 You're verified! Start applying for higher-paying shifts.
            </div>
          )}
        </div>
      </section>

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
    </div>
  );
}


