type AnalyticsLivePayload = {
  eventTypes: string[];
  occurredAt: string;
};

type AnalyticsLiveListener = (payload: AnalyticsLivePayload) => void;

const globalAnalytics = globalThis as typeof globalThis & {
  __analyticsLiveListeners?: Set<AnalyticsLiveListener>;
};

const listeners = globalAnalytics.__analyticsLiveListeners || new Set<AnalyticsLiveListener>();
globalAnalytics.__analyticsLiveListeners = listeners;

export function subscribeToAnalytics(listener: AnalyticsLiveListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishAnalyticsUpdate(eventTypes: string[]) {
  const payload = { eventTypes: Array.from(new Set(eventTypes)), occurredAt: new Date().toISOString() };
  for (const listener of listeners) listener(payload);
}
