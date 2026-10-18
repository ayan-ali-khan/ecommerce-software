/**
 * In-memory sliding-window rate limiter.
 *
 * Caveat: state lives in this process, so on serverless it is per-instance.
 * Good enough to blunt bots on a small store; swap for Upstash/Redis if needed.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

declare global {
  var __rateLimitBuckets: Map<string, Bucket> | undefined;
}

const buckets: Map<string, Bucket> = globalThis.__rateLimitBuckets ?? new Map();
globalThis.__rateLimitBuckets = buckets;

const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/** Records one attempt against `key`. Returns whether the caller is still under the limit. */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(k);
    }
  }

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  return {
    ok: bucket.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

/** Best-effort client IP (Vercel/proxies set x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}
