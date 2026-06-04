import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Simple in‑memory rate limiter for API endpoints.
 * Stores counters per IP address for a configurable window.
 *
 * Usage example (in a route handler):
 *   const { allowed, retryAfter } = checkRateLimit(req, 5, 15 * 60 * 1000);
 *   if (!allowed) {
 *     res.setHeader('Retry-After', String(retryAfter));
 *     return res.status(429).json({ error: 'Too many requests', retryAfter });
 *   }
 */
export interface RateCheckResult {
  allowed: boolean;
  retryAfter?: number;
}

// Map ip → { count, resetAt }
const rateMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Checks the rate limit for a given IP.
 * @param ip - Client IP address.
 * @param maxRequests - Maximum allowed requests within the window.
 * @param windowMs - Time window in milliseconds.
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000
): RateCheckResult {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}
