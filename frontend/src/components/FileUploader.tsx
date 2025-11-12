import React, { useCallback, useMemo, useRef, useState } from 'react';

export interface FileUploaderProps {
  accept: string;
  maxSizeBytes: number;
  label: string;
  onSelected: (file: File, sha256: string) => Promise<void> | void;
  largeFileThresholdBytes?: number; // default 10MB
  preview?: boolean;
}

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export default function FileUploader({
  accept,
  maxSizeBytes,
  label,
  onSelected,
  largeFileThresholdBytes = 10 * 1024 * 1024,
  preview = true,
}: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onPick = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > maxSizeBytes) {
        throw new Error(`File too large. Max ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB`);
      }
      if (preview && file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setFileUrl(url);
      } else {
        setFileUrl(null);
      }

      setBusy(true);
      const hash = await sha256Hex(file);
      await onSelected(file, hash);
    } catch (err: any) {
      setError(err.message || 'Selection failed');
    } finally {
      setBusy(false);
    }
  }, [maxSizeBytes, onSelected, preview]);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-900">{label}</label>
      <div className="mt-2 flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onPick}
          className="block w-full text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-white hover:file:bg-indigo-700 focus:outline-none"
        />
      </div>
      {busy && <p className="mt-2 text-sm text-indigo-700 animate-pulse">Uploading…</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {preview && fileUrl && (
        <div className="mt-3">
          <img src={fileUrl} alt="Preview" className="max-h-48 rounded-md object-contain" />
        </div>
      )}
      {largeFileThresholdBytes && (
        <p className="mt-2 text-xs text-gray-500">
          Files over {(largeFileThresholdBytes / (1024 * 1024)).toFixed(0)}MB will use resumable upload (TODO).
        </p>
      )}
    </div>
  );
}


