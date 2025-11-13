import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import socketService from '../services/socketService';
import apiService from '../services/api';

type VerificationStatus = {
  verified: boolean;
  trial_shift_status?: 'not_requested' | 'pending' | 'assigned' | 'completed' | 'failed';
  id_doc?: { key?: string; submitted_at?: string | Date | null; preview_url?: string | null };
  video?: { key?: string; submitted_at?: string | Date | null; preview_url?: string | null };
  auto_checks?: { ocr_confidence?: number; face_match_score?: number; duplicate_flag?: boolean; last_checked_at?: string | Date };
  last_reviewed_by?: string | null;
  last_reviewed_at?: string | Date | null;
  rejection_code?: string | null;
  admin_notes?: string;
  timeline?: string[];
};

type UploadResponse = {
  upload: { url: string; method: 'PUT' | 'POST'; headers?: Record<string, string>; provider?: string; key: string };
  id_doc_key?: string;
  id_doc_read_url?: string;
  video_key?: string;
  video_read_url?: string;
};

export function useVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const resp = await apiService.get('/verification/status');
      const data = (resp as any)?.data ?? resp;
      if (mountedRef.current) setStatus(data);
    } catch (e: any) {
      if (mountedRef.current) setError(e.message || 'Failed to load status');
    }
  }, []);

  // Presigned upload helper
  const performUpload = useCallback(async (upload: UploadResponse['upload'], file: File) => {
    const method = upload.method || 'PUT';
    const headers: Record<string, string> = upload.headers || {};
    // Best effort set content type if allowed
    if (!headers['Content-Type']) {
      headers['Content-Type'] = file.type || 'application/octet-stream';
    }
    const res = await fetch(upload.url, {
      method,
      headers,
      body: file,
    });
    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`);
    }
  }, []);

  const uploadId = useCallback(
    async (file: File, sha256: string) => {
      setLoading(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.append('file', file);
        await apiService.post('/verification/upload-id-file', fd as any);
        await fetchStatus();
        return true;
      } catch (e: any) {
        setError(e.message || 'Upload failed');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [performUpload, fetchStatus]
  );

  const uploadVideo = useCallback(
    async (file: File, sha256: string, durationSec?: number) => {
      setLoading(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.append('file', file);
        await apiService.post('/verification/upload-video-file', fd as any);
        await fetchStatus();
        return true;
      } catch (e: any) {
        setError(e.message || 'Upload failed');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [performUpload, fetchStatus]
  );

  const requestTrial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await apiService.post('/verification/request-trial', {});
      await fetchStatus();
      return (json as any)?.data ?? json;
    } catch (e: any) {
      setError(e.message || 'Request failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  // Real-time updates via socket
  useEffect(() => {
    mountedRef.current = true;
    const onUpdate = () => {
      fetchStatus();
    };
    socketService.on('verification:update', onUpdate);
    // Also listen to kyc events as a fallback
    socketService.on('kyc:status:update', onUpdate);
    fetchStatus();
    return () => {
      mountedRef.current = false;
      socketService.off('verification:update', onUpdate);
      socketService.off('kyc:status:update', onUpdate);
    };
  }, [fetchStatus]);

  return {
    loading,
    error,
    status,
    uploadId,
    uploadVideo,
    requestTrial,
    refresh: fetchStatus,
  };
}

export default useVerification;


