export type TrackingChannel =
  | "browser_meta"
  | "server_meta"
  | "browser_tiktok"
  | "server_tiktok"
  | "datalayer_ga4";

export interface LiveEventLogEntry {
  id: string;
  timestamp: string;
  channel: TrackingChannel;
  channelLabel: string;
  eventName: string;
  eventId?: string;
  sourceUrl?: string;
  payload: Record<string, any>;
  userDataSummary?: {
    emailHashed?: boolean;
    phoneHashed?: boolean;
    fbp?: string;
    fbc?: string;
    ttp?: string;
    ttclid?: string;
    ip?: string;
    userAgent?: string;
  };
  status: "success" | "pending" | "failed" | "info";
  responseDetails?: {
    httpStatus?: number;
    eventsReceived?: number;
    traceId?: string;
    requestId?: string;
    error?: string;
  };
}

declare global {
  var __LIVE_ANALYTICS_LOGS__: LiveEventLogEntry[] | undefined;
}

const MAX_LOGS = 200;

function getStore(): LiveEventLogEntry[] {
  if (!globalThis.__LIVE_ANALYTICS_LOGS__) {
    globalThis.__LIVE_ANALYTICS_LOGS__ = [];
  }
  return globalThis.__LIVE_ANALYTICS_LOGS__;
}

export function logAnalyticsEvent(entry: Omit<LiveEventLogEntry, "id" | "timestamp" | "channelLabel"> & {
  id?: string;
  timestamp?: string;
  channelLabel?: string;
}): LiveEventLogEntry {
  const store = getStore();

  const channelLabels: Record<TrackingChannel, string> = {
    browser_meta: "Browser Meta Pixel (fbq)",
    server_meta: "Server Meta CAPI (Graph API v21.0)",
    browser_tiktok: "Browser TikTok Pixel (ttq)",
    server_tiktok: "Server TikTok Events API (v1.3)",
    datalayer_ga4: "Google Analytics 4 DataLayer",
  };

  const fullEntry: LiveEventLogEntry = {
    id: entry.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: entry.timestamp || new Date().toISOString(),
    channelLabel: entry.channelLabel || channelLabels[entry.channel] || entry.channel,
    ...entry,
  };

  // Prepend new event to the beginning of the list
  store.unshift(fullEntry);

  // Keep store capped at MAX_LOGS
  if (store.length > MAX_LOGS) {
    store.length = MAX_LOGS;
  }

  return fullEntry;
}

export function getAnalyticsLogs(options?: {
  channel?: TrackingChannel | "all";
  eventName?: string;
  limit?: number;
}) {
  const store = getStore();
  let filtered = store;

  if (options?.channel && options.channel !== "all") {
    filtered = filtered.filter((l) => l.channel === options.channel);
  }

  if (options?.eventName && options.eventName !== "all") {
    filtered = filtered.filter(
      (l) => l.eventName.toLowerCase() === options.eventName?.toLowerCase()
    );
  }

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  const counts = {
    total: store.length,
    browser_meta: store.filter((l) => l.channel === "browser_meta").length,
    server_meta: store.filter((l) => l.channel === "server_meta").length,
    browser_tiktok: store.filter((l) => l.channel === "browser_tiktok").length,
    server_tiktok: store.filter((l) => l.channel === "server_tiktok").length,
    datalayer_ga4: store.filter((l) => l.channel === "datalayer_ga4").length,
  };

  // Calculate deduplication matches (pairs where same eventId exists in both browser and server)
  const eventIds = new Set<string>();
  const browserMetaIds = new Set(
    store.filter((l) => l.channel === "browser_meta" && l.eventId).map((l) => l.eventId!)
  );
  const serverMetaIds = new Set(
    store.filter((l) => l.channel === "server_meta" && l.eventId).map((l) => l.eventId!)
  );
  const browserTikTokIds = new Set(
    store.filter((l) => l.channel === "browser_tiktok" && l.eventId).map((l) => l.eventId!)
  );
  const serverTikTokIds = new Set(
    store.filter((l) => l.channel === "server_tiktok" && l.eventId).map((l) => l.eventId!)
  );

  let metaDedupMatches = 0;
  for (const id of browserMetaIds) {
    if (serverMetaIds.has(id)) metaDedupMatches++;
  }

  let tiktokDedupMatches = 0;
  for (const id of browserTikTokIds) {
    if (serverTikTokIds.has(id)) tiktokDedupMatches++;
  }

  return {
    logs: filtered,
    stats: {
      ...counts,
      metaDedupMatches,
      tiktokDedupMatches,
      totalDedupMatches: metaDedupMatches + tiktokDedupMatches,
    },
  };
}

export function clearAnalyticsLogs() {
  const store = getStore();
  store.length = 0;
  return { success: true, count: 0 };
}
