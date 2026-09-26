"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  RefreshCw,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Video,
  Code2,
  Server,
  Globe,
  Layers,
  ShieldCheck,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import type { LiveEventLogEntry, TrackingChannel } from "@/lib/analytics/live-event-logger";

export function LivePayloadInspector() {
  const [logs, setLogs] = useState<LiveEventLogEntry[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    browser_meta: 0,
    server_meta: 0,
    browser_tiktok: 0,
    server_tiktok: 0,
    datalayer_ga4: 0,
    metaDedupMatches: 0,
    tiktokDedupMatches: 0,
    totalDedupMatches: 0,
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [channelFilter, setChannelFilter] = useState<TrackingChannel | "all">("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/live-log");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch live logs", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear the live event stream?")) return;
    try {
      await fetch("/api/analytics/live-log", { method: "DELETE" });
      setLogs([]);
      setStats({
        total: 0,
        browser_meta: 0,
        server_meta: 0,
        browser_tiktok: 0,
        server_tiktok: 0,
        datalayer_ga4: 0,
        metaDedupMatches: 0,
        tiktokDedupMatches: 0,
        totalDedupMatches: 0,
      });
    } catch (err) {
      console.error("Failed to clear logs", err);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (channelFilter !== "all" && log.channel !== channelFilter) return false;
      if (eventFilter !== "all" && log.eventName.toLowerCase() !== eventFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const jsonString = JSON.stringify(log.payload).toLowerCase();
        const matchesEvent = log.eventName.toLowerCase().includes(q);
        const matchesId = log.eventId?.toLowerCase().includes(q);
        const matchesJson = jsonString.includes(q);
        const matchesChannel = log.channelLabel.toLowerCase().includes(q);
        if (!matchesEvent && !matchesId && !matchesJson && !matchesChannel) return false;
      }
      return true;
    });
  }, [logs, channelFilter, eventFilter, searchQuery]);

  const getChannelBadge = (channel: TrackingChannel) => {
    switch (channel) {
      case "browser_meta":
        return {
          icon: <Sparkles className="h-3 w-3 text-blue-600 shrink-0" />,
          label: "Browser Meta (fbq)",
          badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "server_meta":
        return {
          icon: <Server className="h-3 w-3 text-indigo-600 shrink-0" />,
          label: "Server Meta CAPI",
          badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "browser_tiktok":
        return {
          icon: <Video className="h-3 w-3 text-[#ff0050] shrink-0" />,
          label: "Browser TikTok (ttq)",
          badgeClass: "bg-teal-50/60 text-[#164E63] border-teal-200",
        };
      case "server_tiktok":
        return {
          icon: <Server className="h-3 w-3 text-purple-600 shrink-0" />,
          label: "Server TikTok CAPI",
          badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "datalayer_ga4":
        return {
          icon: <Code2 className="h-3 w-3 text-emerald-600 shrink-0" />,
          label: "GA4 DataLayer",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      default:
        return {
          icon: <Activity className="h-3 w-3 text-gray-600 shrink-0" />,
          label: channel,
          badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
        };
    }
  };

  const formatRelativeTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 5) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return new Date(iso).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* 1. Real-Time Channel Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl border border-border p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase">
            <span>Total Events</span>
            <Activity className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <div className="text-xl font-black text-gray-900 mt-1">{stats.total}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Stream buffer (max 200)</div>
        </div>

        <div className="bg-blue-50/50 rounded-2xl border border-blue-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 uppercase">
            <span>Browser Meta</span>
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-900 mt-1">{stats.browser_meta}</div>
          <div className="text-[10px] text-blue-600/80 mt-0.5">Client `fbq` Pixel</div>
        </div>

        <div className="bg-indigo-50/50 rounded-2xl border border-indigo-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 uppercase">
            <span>Server Meta</span>
            <Server className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-indigo-900 mt-1">{stats.server_meta}</div>
          <div className="text-[10px] text-indigo-600/80 mt-0.5">Graph API v21.0 CAPI</div>
        </div>

        <div className="bg-teal-50/60/50 rounded-2xl border border-teal-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#164E63] uppercase">
            <span>Browser TikTok</span>
            <Video className="h-3.5 w-3.5 text-[#1D6474]" />
          </div>
          <div className="text-xl font-black text-pink-900 mt-1">{stats.browser_tiktok}</div>
          <div className="text-[10px] text-[#1D6474]/80 mt-0.5">Client `ttq` Pixel</div>
        </div>

        <div className="bg-purple-50/50 rounded-2xl border border-purple-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 uppercase">
            <span>Server TikTok</span>
            <Server className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-black text-purple-900 mt-1">{stats.server_tiktok}</div>
          <div className="text-[10px] text-purple-600/80 mt-0.5">Events API v1.3</div>
        </div>

        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 uppercase">
            <span>Deduplication</span>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-900 mt-1">{stats.totalDedupMatches}</div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">Matching Event ID Pairs</div>
        </div>
      </div>

      {/* 2. Controls & Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-border p-4 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Beacon Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              autoRefresh
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                autoRefresh ? "bg-emerald-500 animate-ping" : "bg-gray-400"
              }`}
            />
            <span>{autoRefresh ? "Live Polling Active (2s)" : "Polling Paused"}</span>
          </button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="text-xs font-bold rounded-xl h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl h-8"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear Feed
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Channel Select */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as any)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-800 focus:outline-none"
          >
            <option value="all">All Channels ({logs.length})</option>
            <option value="browser_meta">Browser Meta (fbq)</option>
            <option value="server_meta">Server Meta (CAPI)</option>
            <option value="browser_tiktok">Browser TikTok (ttq)</option>
            <option value="server_tiktok">Server TikTok (CAPI)</option>
            <option value="datalayer_ga4">GA4 DataLayer</option>
          </select>

          {/* Event Select */}
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-800 focus:outline-none"
          >
            <option value="all">All Events</option>
            <option value="PageView">PageView</option>
            <option value="ViewContent">ViewContent / view_item</option>
            <option value="AddToCart">AddToCart / add_to_cart</option>
            <option value="InitiateCheckout">InitiateCheckout / begin_checkout</option>
            <option value="AddPaymentInfo">AddPaymentInfo</option>
            <option value="AddShippingInfo">AddShippingInfo</option>
            <option value="Purchase">Purchase / CompletePayment</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event ID, payload..."
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none w-44"
            />
          </div>
        </div>
      </div>

      {/* 3. Event Log Feed Stream */}
      <div className="rounded-3xl border border-border bg-white shadow-card overflow-hidden">
        <div className="border-b border-border bg-gray-50/70 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#1D6474]" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Live Payload Stream ({filteredLogs.length} Events)
            </h3>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">
            Click any row to inspect full JSON payload &amp; parameters
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-teal-50/60 text-[#1D6474] flex items-center justify-center mx-auto">
              <Zap className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">No events in live buffer yet</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Open your storefront in another tab, browse products, click &quot;Add to Cart&quot;, or go to checkout. Every browser pixel, server CAPI, and GA4 event will stream here in real time with complete payload details.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLogs.map((log) => {
              const channelBadge = getChannelBadge(log.channel);
              const isExpanded = expandedLogId === log.id;
              const hasResponseError = log.status === "failed" || log.responseDetails?.error;

              return (
                <div key={log.id} className="transition-colors hover:bg-gray-50/60">
                  {/* Event Summary Bar */}
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <button type="button" className="text-gray-400 p-0.5">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-700" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>

                      {/* Channel Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${channelBadge.badgeClass}`}
                      >
                        {channelBadge.icon}
                        <span>{channelBadge.label}</span>
                      </span>

                      {/* Event Name */}
                      <span className="font-black text-xs text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {log.eventName}
                      </span>

                      {/* Event ID pill */}
                      {log.eventId && (
                        <span className="font-mono text-[11px] text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span className="text-gray-400">ID:</span>
                          <span className="truncate max-w-[140px]">{log.eventId}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {/* Status badge */}
                      {hasResponseError ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          {log.responseDetails?.eventsReceived !== undefined
                            ? `Received (${log.responseDetails.eventsReceived})`
                            : "Dispatched"}
                        </span>
                      )}

                      {/* Trace ID */}
                      {(log.responseDetails?.traceId || log.responseDetails?.requestId) && (
                        <span className="text-[10px] font-mono text-gray-400 hidden sm:inline truncate max-w-[120px]">
                          Trace: {log.responseDetails.traceId || log.responseDetails.requestId}
                        </span>
                      )}

                      {/* Timestamp */}
                      <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                        {formatRelativeTime(log.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Payload Inspector Box */}
                  {isExpanded && (
                    <div className="bg-gray-950 text-gray-200 p-5 mx-4 mb-4 rounded-2xl border border-gray-800 space-y-4 shadow-inner text-xs font-mono">
                      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-4 w-4 text-[#1D6474]" />
                          <span className="text-xs font-bold text-gray-200 font-sans uppercase tracking-wider">
                            Full Dispatched Payload ({log.channelLabel})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(JSON.stringify(log.payload, null, 2), log.id);
                            }}
                            className="bg-gray-900 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-[11px] h-7 rounded-lg"
                          >
                            {copiedId === log.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy JSON
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Breakdown Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans text-xs">
                        <div className="bg-gray-900/90 border border-gray-800 p-3 rounded-xl">
                          <span className="text-gray-400 text-[10px] uppercase font-bold block">
                            Event Name &amp; ID
                          </span>
                          <div className="font-bold text-white mt-0.5">{log.eventName}</div>
                          <div className="text-[11px] font-mono text-pink-400 truncate mt-0.5">
                            {log.eventId || "(None)"}
                          </div>
                        </div>

                        <div className="bg-gray-900/90 border border-gray-800 p-3 rounded-xl">
                          <span className="text-gray-400 text-[10px] uppercase font-bold block">
                            Source Channel
                          </span>
                          <div className="font-bold text-white mt-0.5">{log.channelLabel}</div>
                          <div className="text-[10px] text-gray-400 truncate mt-0.5">
                            {log.sourceUrl || "Storefront"}
                          </div>
                        </div>

                        <div className="bg-gray-900/90 border border-gray-800 p-3 rounded-xl">
                          <span className="text-gray-400 text-[10px] uppercase font-bold block">
                            Platform Status
                          </span>
                          <div className="font-bold text-emerald-400 mt-0.5">
                            {hasResponseError ? "Error Occurred" : "HTTP 200 OK / Dispatched"}
                          </div>
                          {log.responseDetails?.error && (
                            <div className="text-[10px] text-red-400 truncate mt-0.5">
                              {log.responseDetails.error}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Raw JSON Code Viewer */}
                      <div>
                        <span className="text-gray-400 text-[10px] font-sans uppercase font-bold block mb-1.5">
                          Raw JSON Payload:
                        </span>
                        <pre className="bg-black/60 p-4 rounded-xl border border-gray-800/80 text-[11px] overflow-x-auto text-emerald-300 leading-relaxed max-h-96">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
