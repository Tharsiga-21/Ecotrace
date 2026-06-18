import { Request, Response, NextFunction } from "express";

interface RequestLog {
  timestamps: number[];
}

const ipCache = new Map<string, RequestLog>();
const WINDOW_SIZE_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 60; // 60 requests per window limit

/**
 * Custom memory-efficient sliding window rate limiter
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.headers["x-forwarded-for"] as string || "unknown-ip";
  const now = Date.now();

  let log = ipCache.get(ip);
  if (!log) {
    log = { timestamps: [] };
    ipCache.set(ip, log);
  }

  // Filter timestamps outside the active sliding window
  log.timestamps = log.timestamps.filter(timestamp => now - timestamp < WINDOW_SIZE_MS);

  if (log.timestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({
      error: "Too many requests. Please wait a moment and try again so we can preserve API quotas."
    });
  }

  log.timestamps.push(now);
  next();
}
