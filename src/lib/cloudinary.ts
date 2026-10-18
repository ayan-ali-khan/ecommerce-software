/**
 * Cloudinary server-side signed uploads (Phase 5).
 *
 * Uses the plain REST API (multipart form + SHA-1 signature from node:crypto)
 * so we don't need the Cloudinary SDK. Configuration is read from env on every
 * call (no caching) so edits to .env.local take effect after a dev restart.
 *
 * Degradation: while CLOUDINARY_* vars are empty, isCloudinaryConfigured()
 * returns false and uploadImage() throws CloudinaryNotConfiguredError — the
 * upload route maps that to a 503 so the UI can explain the missing setup.
 */
import { createHash } from 'node:crypto';

const API_BASE = 'https://api.cloudinary.com/v1_1';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

function readConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? '';
  const apiKey = (process.env.CLOUDINARY_API_KEY ?? '').trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET ?? '').trim();
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryConfigured(): boolean {
  return readConfig() !== null;
}

export class CloudinaryNotConfiguredError extends Error {
  constructor() {
    super(
      'Image uploads are not configured (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET).',
    );
    this.name = 'CloudinaryNotConfiguredError';
  }
}

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/** Cloudinary signature: SHA-1 of sorted `key=value` params joined with & + secret. */
function sign(params: Record<string, string>, apiSecret: string): string {
  const query = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return createHash('sha1')
    .update(query + apiSecret)
    .digest('hex');
}

export interface UploadImageOptions {
  /** Original filename (used only to derive the public id / format). */
  filename: string;
  folder?: string;
}

/**
 * Uploads one image buffer to Cloudinary via a signed REST call.
 * Throws CloudinaryNotConfiguredError when env is missing, Error on API failure.
 */
export async function uploadImage(
  bytes: Uint8Array,
  mimeType: string,
  { filename, folder = 'supplement-store/products' }: UploadImageOptions,
): Promise<UploadResult> {
  const config = readConfig();
  if (!config) throw new CloudinaryNotConfiguredError();

  const timestamp = String(Math.floor(Date.now() / 1000));
  // Strip any path/ext from the client filename; Cloudinary derives format from mimeType.
  const baseName =
    filename
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .slice(0, 60) || 'image';
  const folderParams = { folder, public_id: baseName, timestamp };
  const signature = sign(folderParams, config.apiSecret);

  const form = new FormData();
  form.set('api_key', config.apiKey);
  form.set('timestamp', timestamp);
  form.set('folder', folder);
  form.set('public_id', baseName);
  form.set('signature', signature);
  form.set('file', new Blob([bytes as BlobPart], { type: mimeType }), filename);

  const res = await fetch(`${API_BASE}/${config.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });

  const json = (await res.json().catch(() => null)) as {
    secure_url?: string;
    public_id?: string;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
    error?: { message?: string };
  } | null;

  if (!res.ok || !json?.secure_url) {
    throw new Error(json?.error?.message ?? `Cloudinary upload failed (HTTP ${res.status}).`);
  }

  return {
    url: json.secure_url,
    publicId: json.public_id ?? '',
    width: json.width ?? 0,
    height: json.height ?? 0,
    format: json.format ?? '',
    bytes: json.bytes ?? bytes.byteLength,
  };
}

/** Upload constraints enforced by the API route (kept next to the lib for cohesion). */
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const UPLOAD_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;
