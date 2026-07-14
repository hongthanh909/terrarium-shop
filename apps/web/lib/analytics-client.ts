export const ANALYTICS_CONSENT_KEY = "terrarium-analytics-consent";

export type AnalyticsEventType =
  | "PAGE_VIEW"
  | "PRODUCT_VIEW"
  | "SEARCH"
  | "ADD_TO_CART"
  | "REMOVE_FROM_CART"
  | "BEGIN_CHECKOUT"
  | "PURCHASE"
  | "CHAT_OPEN"
  | "CHAT_MESSAGE_SENT"
  | "LOGIN"
  | "REGISTER"
  | "HEARTBEAT"
  | "SESSION_END";

type AnalyticsMetadata = Record<string, string | number | boolean>;

export interface AnalyticsEventInput {
  type: AnalyticsEventType;
  path?: string;
  productId?: string;
  searchTerm?: string;
  durationMs?: number;
  metadata?: AnalyticsMetadata;
}
const VISITOR_KEY = "terrarium-analytics-visitor";
const SESSION_KEY = "terrarium-analytics-session";
const SESSION_IDLE_MS = 30 * 60 * 1000;
const FLUSH_DELAY_MS = 100;
const MAX_BATCH_SIZE = 20;

type SessionState = { id: string; lastActivityAt: number; entryPath: string };
type QueuedEvent = AnalyticsEventInput & { eventKey: string };

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function randomId() {
  return crypto.randomUUID();
}

function analyticsAllowed() {
  return typeof window !== "undefined" && localStorage.getItem(ANALYTICS_CONSENT_KEY) !== "denied";
}

function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = randomId();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getSession(): SessionState {
  const now = Date.now();
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const current = JSON.parse(raw) as SessionState;
      if (current.id && now - current.lastActivityAt < SESSION_IDLE_MS) {
        const next = { ...current, lastActivityAt: now };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
        return next;
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  const next = { id: randomId(), lastActivityAt: now, entryPath: window.location.pathname };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

function sessionContext(session: SessionState) {
  const params = new URLSearchParams(window.location.search);
  return {
    entryPath: session.entryPath,
    referrer: document.referrer || undefined,
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
  };
}

function buildPayload(events: QueuedEvent[]) {
  const session = getSession();
  return {
    anonymousId: getVisitorId(),
    sessionKey: session.id,
    session: sessionContext(session),
    events: events.map((event) => ({
      ...event,
      path: (event.path || window.location.pathname).slice(0, 500),
    })),
  };
}

function transmit(events: QueuedEvent[], beacon = false) {
  if (!events.length || !analyticsAllowed()) return;
  const body = JSON.stringify(buildPayload(events));
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/events", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => undefined);
}

export function flushAnalytics(beacon = false) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  const events = queue.splice(0, MAX_BATCH_SIZE);
  transmit(events, beacon);
  if (queue.length) flushAnalytics(beacon);
}

export function trackEvent(input: AnalyticsEventInput) {
  if (!analyticsAllowed()) return;
  queue.push({ ...input, eventKey: randomId() });
  if (queue.length >= MAX_BATCH_SIZE) {
    flushAnalytics();
    return;
  }
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => flushAnalytics(), FLUSH_DELAY_MS);
}

export function getAnalyticsContext() {
  if (!analyticsAllowed()) return undefined;
  const session = getSession();
  return { anonymousId: getVisitorId(), sessionKey: session.id };
}

export function setAnalyticsConsent(granted: boolean) {
  localStorage.setItem(ANALYTICS_CONSENT_KEY, granted ? "granted" : "denied");
  if (!granted) {
    queue = [];
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = null;
  }
  window.dispatchEvent(new CustomEvent("analytics-consent-changed", { detail: granted }));
}
