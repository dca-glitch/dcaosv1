import type { RequestHandler } from "express";
import { failure } from "../utils/responses";

type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = 10;
const GLOBAL_LIMIT =
  Number.parseInt(process.env.API_GLOBAL_RATE_LIMIT ?? "", 10) ||
  (process.env.NODE_ENV === "production" ? 300 : 1500);

const buckets = new Map<string, Bucket>();

function normalizeClientIp(value: string | undefined): string {
  if (!value) {
    return "unknown";
  }

  return value.startsWith("::ffff:") ? value.slice(7) : value;
}

function getRequestPath(req: Parameters<RequestHandler>[0]): string {
  return new URL(req.originalUrl, "http://localhost").pathname;
}

function cleanupExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function getBucket(key: string, now: number): Bucket {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const freshBucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, freshBucket);
    return freshBucket;
  }

  return bucket;
}

function buildRateLimitResponse(retryAfterSeconds: number) {
  return failure("RATE_LIMITED", "Too many requests. Please try again later.", {
    retryAfterSeconds
  });
}

export function createRateLimitMiddleware(): RequestHandler {
  return (req, res, next) => {
    const path = getRequestPath(req);

    // MVP in-memory protection only; production should use a shared store.
    if (path === "/api/v1/health") {
      next();
      return;
    }

    const now = Date.now();
    cleanupExpiredBuckets(now);

    const isLoginRoute = req.method === "POST" && path === "/api/v1/auth/login";
    const limit = isLoginRoute ? LOGIN_LIMIT : GLOBAL_LIMIT;
    const bucketKey = `${isLoginRoute ? "login" : "global"}:${normalizeClientIp(req.ip)}`;
    const bucket = getBucket(bucketKey, now);

    bucket.count += 1;

    if (bucket.count > limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json(buildRateLimitResponse(retryAfterSeconds));
      return;
    }

    next();
  };
}

export const rateLimit = createRateLimitMiddleware();
