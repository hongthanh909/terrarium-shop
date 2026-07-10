type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

function nowMs() {
  return Date.now();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readHeader(headers: any, name: string): string | undefined {
  if (!headers) return undefined;
  if (typeof headers.get === "function") return headers.get(name) ?? undefined;
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export function getClientIpFromHeaders(headers: any): string {
  const forwardedFor = readHeader(headers, "x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return (
    readHeader(headers, "x-real-ip") ||
    readHeader(headers, "cf-connecting-ip") ||
    "unknown"
  );
}

export function buildLoginRateLimitKey(scope: string, email: string, headers: any) {
  return `${scope}:${normalizeEmail(email)}:${getClientIpFromHeaders(headers)}`;
}

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number) {
  const currentTime = nowMs();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= currentTime) {
    buckets.delete(key);
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (entry.count >= maxAttempts) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000)),
    };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

export function recordFailedAttempt(key: string, windowMs: number) {
  const currentTime = nowMs();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= currentTime) {
    buckets.set(key, { count: 1, resetAt: currentTime + windowMs });
    return;
  }

  entry.count += 1;
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}
