'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useVerification from '../../hooks/useVerification';
import VerificationStepper from '../../components/VerificationStepper';
import FileUploader from '../../components/FileUploader';

export default function VerificationPage() {
  const { status, loading, error, uploadId, uploadVideo, requestTrial, refresh } = useVerification();
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [videoDurationSec, setVideoDurationSec] = useState<number | undefined>(undefined);

  // Steps
  const steps = useMemo(() => {
    const idDone = !!status?.id_doc?.key;
    const videoDone = !!status?.video?.key;
    const verified = !!status?.verified;
    return [
      { title: 'Upload ID', subtitle: 'Image or PDF (≤10MB)', completed: idDone, current: !idDone },
      { title: 'Short Video', subtitle: '30–60 sec intro', completed: videoDone, current: idDone && !videoDone },
      {
        title: 'Status & Trial',
        subtitle: verified ? 'Verified' : (status?.trial_shift_status ? `Trial: ${status.trial_shift_status}` : 'Pending review'),
        completed: verified,
        current: idDone && videoDone && !verified,
      },
    ];
  }, [status]);

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
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };
    mr.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoBlobUrl(url);
      // Infer duration
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        setVideoDurationSec(video.duration || undefined);
      };
      stream.getTracks().forEach((t) => t.stop());
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
    // Compute hash
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    await uploadVideo(file, sha256, videoDurationSec);
  }, [videoBlobUrl, uploadVideo, videoDurationSec]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-gray-900">Verification Center</h1>
      <p className="mt-1 text-sm text-gray-600">Get verified to unlock higher-paying shifts. Usually reviewed in &lt;24 hours.</p>

      <div className="mt-6">
        <VerificationStepper steps={steps} />
      </div>

      {/* Step 1: ID Upload */}
      <section className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Step 1: Upload your ID</h2>
        <p className="mt-1 text-sm text-gray-600">Accepted: JPG, PNG, WEBP, HEIC, or PDF. Make sure details are clear.</p>
        <div className="mt-3">
          <FileUploader
            accept="image/*,application/pdf"
            maxSizeBytes={10 * 1024 * 1024}
            label="Choose ID file"
            onSelected={onPickId}
          />
        </div>
        {status?.id_doc?.preview_url && (
          <p className="mt-2 text-sm text-green-700">ID received. Processing…</p>
        )}
      </section>

      {/* Step 2: Video Capture */}
      <section className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Step 2: Record a short video</h2>
        <p className="mt-1 text-sm text-gray-600">30–60 seconds. Introduce yourself and show your face clearly.</p>
        <div className="mt-3 flex flex-col gap-3">
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
          {videoBlobUrl && (
            <video src={videoBlobUrl} controls className="w-full rounded-md" />
          )}
          <div className="mt-2">
            <FileUploader
              accept="video/*"
              maxSizeBytes={50 * 1024 * 1024}
              label="Or upload a video file"
              onSelected={onPickVideo}
              preview={false}
            />
          </div>
          {status?.video?.preview_url && (
            <p className="mt-2 text-sm text-green-700">Video received. Processing…</p>
          )}
        </div>
      </section>

      {/* Step 3: Status & Trial */}
      <section className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Step 3: Status & Trial Shift</h2>
        <div className="mt-2 rounded-lg bg-gray-50 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <p><span className="font-medium">Status:</span> {status?.verified ? 'Verified' : status?.rejection_code ? 'Rejected' : 'Pending'}</p>
            <p><span className="font-medium">Trial:</span> {status?.trial_shift_status || 'not_requested'}</p>
            {status?.auto_checks && (
              <>
                <p><span className="font-medium">OCR:</span> {status.auto_checks.ocr_confidence ?? '—'}</p>
                <p><span className="font-medium">Face match:</span> {status.auto_checks.face_match_score ?? '—'}</p>
              </>
            )}
            {status?.rejection_code && (
              <p className="sm:col-span-2 text-rose-700"><span className="font-medium">Reason:</span> {status.rejection_code}. {status.admin_notes}</p>
            )}
          </div>
          {!status?.verified && !status?.rejection_code && (
            <div className="mt-3">
              <button
                onClick={() => requestTrial()}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Request Trial Shift
              </button>
              <p className="mt-2 text-xs text-gray-600">One free resubmission within 14 days if rejected.</p>
            </div>
          )}
        </div>
      </section>

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
    </div>
  );
}


