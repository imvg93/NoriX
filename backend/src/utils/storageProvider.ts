import crypto from 'crypto';
import { ValidationError } from '../middleware/errorHandler';
import path from 'path';
import fs from 'fs';

type Provider = 's3' | 'supabase' | 'local';

export interface PresignParams {
  key: string;
  contentType?: string;
  expiresInSeconds?: number;
}

export interface PresignedResult {
  url: string;
  method: 'PUT' | 'POST';
  headers?: Record<string, string>;
  provider: Provider;
  key: string;
}

function getProvider(): Provider {
  const p = (process.env.STORAGE_PROVIDER || '').toLowerCase();
  if (p === 's3' || p === 'supabase') return p;
  // Fallback for local dev
  return 'local';
}

export function getBucket(): string {
  const bucket = process.env.STORAGE_BUCKET;
  if (!bucket && getProvider() !== 'local') {
    throw new ValidationError('STORAGE_BUCKET is required');
  }
  return bucket || 'local-dev';
}

export function getSignedUrlExpiry(): number {
  const def = 60 * 60; // 1 hour
  const env = process.env.SIGNED_URL_EXPIRY ? Number(process.env.SIGNED_URL_EXPIRY) : def;
  return Number.isFinite(env) && env > 0 ? env : def;
}

export function sha256Hex(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function getPresignedUploadUrl(params: PresignParams): Promise<PresignedResult> {
  const provider = getProvider();
  const expiresInSeconds = params.expiresInSeconds ?? getSignedUrlExpiry();

  if (provider === 's3') {
    // TODO: Implement AWS S3 presign using @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner
    // Placeholder to keep scaffold working
    throw new ValidationError('S3 presign not configured. Please install AWS SDK and set credentials.');
  }

  if (provider === 'supabase') {
    // TODO: Implement Supabase Storage signed upload URL using service key
    throw new ValidationError('Supabase presign not configured. Please set SUPABASE_* env vars.');
  }

  // Local dev fallback: emulate a presigned upload using server static uploads folder
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const filePath = path.join(uploadsDir, params.key);
  const url = `/uploads/${params.key}?dev_exp=${Date.now() + expiresInSeconds * 1000}`;
  return {
    url,
    method: 'POST',
    provider: 'local',
    key: params.key
  };
}

export async function getPresignedReadUrl(params: { key: string; expiresInSeconds?: number }): Promise<string> {
  const provider = getProvider();
  const expiresInSeconds = params.expiresInSeconds ?? getSignedUrlExpiry();

  if (provider === 's3') {
    // TODO: Implement AWS S3 GET presign
    throw new ValidationError('S3 presign not configured. Please install AWS SDK and set credentials.');
  }

  if (provider === 'supabase') {
    // TODO: Implement Supabase Storage signed URL
    throw new ValidationError('Supabase presign not configured. Please set SUPABASE_* env vars.');
  }

  // Local dev fallback
  return `/uploads/${params.key}?dev_exp=${Date.now() + expiresInSeconds * 1000}`;
}

export function getMaxSizes() {
  const MAX_ID_SIZE = Number(process.env.MAX_ID_SIZE || 10 * 1024 * 1024); // 10MB
  const MAX_VIDEO_SIZE = Number(process.env.MAX_VIDEO_SIZE || 50 * 1024 * 1024); // 50MB
  return { MAX_ID_SIZE, MAX_VIDEO_SIZE };
}


