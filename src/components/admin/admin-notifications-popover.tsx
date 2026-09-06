"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ShoppingBag,
  CreditCard,
  Package,
  Shield,
  CheckCircle2,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Inbox,
  Volume2,
  VolumeX,
  Laptop,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAdminNotifications,
  type AdminNotification,
} from "@/features/admin/notifications-actions";
import { createClient } from "@/lib/supabase/client";

// Web Audio API Global Context & Unlock Engine
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// Global unlock listener on any user interaction
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener("click", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
}

// 3-Tone High-End Notification Chime: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
function playNotificationChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    const playTone = (freq: number, startOffset: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(vol, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration);
    };

    playTone(523.25, 0.0, 0.22, 0.3);
    playTone(659.25, 0.1, 0.25, 0.35);
    playTone(783.99, 0.22, 0.55, 0.4);
  } catch (e) {
    console.warn("Audio chime error:", e);
  }
}

// Flashing browser tab title for background visibility
let tabTitleTimer: NodeJS.Timeout | null = null;
function flashTabTitle(alertText: string) {
  if (typeof document === "undefined") return;
  const original = document.title || "ecomX Admin";
  if (tabTitleTimer) clearInterval(tabTitleTimer);
  let isAlert = true;
  let ticks = 0;
  tabTitleTimer = setInterval(() => {
    document.title = isAlert ? alertText : original;
    isAlert = !isAlert;
    ticks++;
    if (ticks > 12) {
      if (tabTitleTimer) clearInterval(tabTitleTimer);
      document.title = original;
    }
  }, 900);
}

// Native PC / Desktop Browser Push Notification
function sendDesktopNotification(title: string, body: string, url: string) {
  if (typeof window === "undefined") return;
  flashTabTitle("🔔 (1) NEW ORDER RECEIVED!");

  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      const notif = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: `order-${Date.now()}`,
        requireInteraction: true,
      });
      notif.onclick = () => {
        window.focus();
        window.location.href = url;
      };
    } catch {
      // Fallback
    }
  }
}

export function AdminNotificationsPopover() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"all" | "orders" | "stock" | "system">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>("default");
  const [liveToast, setLiveToast] = useState<AdminNotification | null>(null);
  const [showPermBanner, setShowPermBanner] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Check desktop notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setDesktopPermission(Notification.permission);
      if (Notification.permission === "default") {
        setShowPermBanner(true);
      }
    }
  }, []);

  const requestDesktopPermission = async () => {
    // Also unlock audio
    getAudioContext();
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Desktop notifications are not supported in this browser.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setDesktopPermission(perm);
      if (perm === "granted") {
        setShowPermBanner(false);
        sendDesktopNotification(
          "🔔 Desktop Alerts Activated!",
          "You will receive instant pop-up notifications on your PC whenever a new order is placed.",
          "/admin/orders"
        );
        playNotificationChime();
      }
    } catch {
      // Ignore
    }
  };

  // Load read status & sound settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ecomx_admin_read_notifs");
      if (saved) {
        setReadIds(new Set(JSON.parse(saved)));
      }
      const savedSound = localStorage.getItem("ecomx_admin_notif_sound");
      if (savedSound !== null) {
        setSoundEnabled(savedSound === "true");
      }
    } catch {}
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("ecomx_admin_notif_sound", String(next));
    } catch {}
    if (next) playNotificationChime();
  };

  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDoneRef = useRef(false);

  // Fetch notifications and trigger alerts for new incoming orders
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/admin/notifications?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Pragma": "no-cache" },
      });
      const result = res.ok ? await res.json() : await getAdminNotifications();
      const currentList: AdminNotification[] = result.notifications || [];

      if (!initialFetchDoneRef.current) {
        // Initial load: record existing IDs without firing chimes
        currentList.forEach((n) => knownIdsRef.current.add(n.id));
        initialFetchDoneRef.current = true;
        setNotifications(currentList);
      } else {
        // Subsequent polling check: detect brand new orders
        const newOrders = currentList.filter(
          (n) => n.type === "order" && !knownIdsRef.current.has(n.id)
        );

        if (newOrders.length > 0) {
          const newest = newOrders[0];
          newOrders.forEach((n) => knownIdsRef.current.add(n.id));

          // 1. Play audio chime
          if (soundEnabled) {
            playNotificationChime();
          }

          // 2. Trigger PC Desktop Web Notification
          sendDesktopNotification(
            newest.title,
            newest.message,
            newest.link || "/admin/orders"
          );

          // 3. Show floating toast
          setLiveToast(newest);
          setTimeout(() => setLiveToast(null), 8000);
        }

        // Update list and populate known IDs
        currentList.forEach((n) => knownIdsRef.current.add(n.id));
        setNotifications(currentList);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // High-frequency polling (every 3 seconds) ensures ultra-fast reaction across all external devices
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Supabase Real-Time WebSocket Channel: Listens for INSTANT New Orders (Sub-second)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-live-orders-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const newOrder = payload.new as any;
          const orderNum = newOrder.order_number || (newOrder.id ? newOrder.id.slice(0, 8).toUpperCase() : "NEW");
          const name = newOrder.shipping_address_snapshot?.name || newOrder.guest_name || newOrder.customer_name || "New Customer";
          const total = newOrder.total ? `৳${Number(newOrder.total).toLocaleString("en-BD")}` : "";
          const method = (newOrder.payment_method || "COD").toUpperCase();
          const notifId = `notif-ord-${newOrder.id || Date.now()}`;

          if (knownIdsRef.current.has(notifId)) return;
          knownIdsRef.current.add(notifId);

          const notif: AdminNotification = {
            id: notifId,
            title: `🛍️ New Order #${orderNum}`,
            message: `${name} placed an order for ${total} via ${method}.`,
            type: "order",
            link: `/admin/orders/${newOrder.id}`,
            createdAt: new Date().toISOString(),
            read: false,
            priority: "high",
          };

          // 1. Insert into notifications list
          setNotifications((prev) => [notif, ...prev.filter((p) => p.id !== notifId)]);

          // 2. Play subtle audio chime
          if (soundEnabled) {
            playNotificationChime();
          }

          // 3. Trigger PC Desktop Web Notification
          sendDesktopNotification(
            `🛍️ New Order #${orderNum} Received!`,
            `${name} • ${total} (${method})`,
            `/admin/orders/${newOrder.id}`
          );

          // 4. Show real-time floating in-app toast
          setLiveToast(notif);
          setTimeout(() => setLiveToast(null), 8000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    try {
      localStorage.setItem("ecomx_admin_read_notifs", JSON.stringify(Array.from(next)));
    } catch {}
  };

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem("ecomx_admin_read_notifs", JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const handleNotificationClick = (notif: AdminNotification) => {
    markAsRead(notif.id);
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleSendTestAlert = () => {
    playNotificationChime();
    sendDesktopNotification(
      "🛍️ New Order #ORD-2026-9821 (Test)",
      "Customer: Tanvir Ahmed • BDT 1,420 (Cash on Delivery)",
      "/admin/orders"
    );
    const testNotif: AdminNotification = {
      id: `test-ord-${Date.now()}`,
      title: "🛍️ New Order #ORD-2026-9821 (Test)",
      message: "Tanvir Ahmed placed an order for BDT 1,420 via COD.",
      type: "order",
      link: "/admin/orders",
      createdAt: new Date().toISOString(),
      read: false,
      priority: "high",
    };
    setNotifications((prev) => [testNotif, ...prev]);
    setLiveToast(testNotif);
    setTimeout(() => setLiveToast(null), 8000);
  };

  // Format relative timestamp
  const formatTime = (isoString: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diff < 60) return "Just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return "Recent";
    }
  };

  // Filter list by tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "orders") return n.type === "order" || n.type === "payment";
    if (activeTab === "stock") return n.type === "stock";
    if (activeTab === "system") return n.type === "security" || n.type === "system";
    return true;
  });

  const getIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-4 w-4 text-primary-600" />;
      case "payment":
        return <CreditCard className="h-4 w-4 text-emerald-600" />;
      case "stock":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "security":
        return <Shield className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBgColor = (type: AdminNotification["type"]) => {
    switch (type) {
      case "order":
        return "bg-primary-50 border-primary-100";
      case "payment":
        return "bg-emerald-50 border-emerald-100";
      case "stock":
        return "bg-amber-50 border-amber-100";
      case "security":
        return "bg-purple-50 border-purple-100";
      default:
        return "bg-blue-50 border-blue-100";
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Bell Button */}
      <button
        id="admin-notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        aria-expanded={isOpen}
        className={cn(
          "relative rounded-lg p-2 transition-all duration-150",
          isOpen
            ? "bg-surface-secondary text-primary-600"
            : "text-text-secondary hover:bg-surface-secondary hover:text-text"
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-gray-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text text-sm">Notifications</span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-danger-100 text-danger-700 font-semibold px-2 py-0.5 text-xs">
                  {unreadCount} new
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 text-xs flex items-center gap-1">
                  <Check className="h-3 w-3" /> All read
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleSound}
                title={soundEnabled ? "Sound alerts enabled. Click to mute." : "Sound alerts muted. Click to enable."}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  soundEnabled
                    ? "text-emerald-700 hover:bg-emerald-50"
                    : "text-gray-400 hover:bg-gray-100"
                )}
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>

              <button
                onClick={fetchNotifications}
                title="Refresh notifications"
                className="rounded-md p-1.5 text-text-muted hover:bg-white hover:text-text transition-colors"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-primary-600")} />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* PC Desktop & Sound Status Banner */}
          <div className="bg-gray-50/90 border-b border-border px-3 py-1.5 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              {desktopPermission === "granted" ? (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                  <Laptop className="h-3 w-3 text-emerald-600" />
                  PC Alerts Active ✓
                </span>
              ) : (
                <button
                  onClick={requestDesktopPermission}
                  className="text-[10px] text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 hover:bg-pink-100 transition-colors cursor-pointer"
                  title="Click to allow Windows / Mac desktop notifications"
                >
                  <Laptop className="h-3 w-3 text-[#e91e63]" />
                  Enable PC Alerts
                </button>
              )}
            </div>

            <button
              onClick={handleSendTestAlert}
              className="text-[10px] text-text-muted hover:text-text font-bold underline cursor-pointer"
              title="Test chime sound and desktop notification"
            >
              Test Alert
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-border bg-white px-3 pt-1.5 gap-1 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-2.5 py-1.5 font-medium rounded-t-md transition-colors border-b-2",
                activeTab === "all"
                  ? "border-primary-600 text-primary-600 bg-primary-50/50"
                  : "border-transparent text-text-muted hover:text-text"
              )}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={cn(
                "px-2.5 py-1.5 font-medium rounded-t-md transition-colors border-b-2",
                activeTab === "orders"
                  ? "border-primary-600 text-primary-600 bg-primary-50/50"
                  : "border-transparent text-text-muted hover:text-text"
              )}
            >
              Orders & Pay
            </button>
            <button
              onClick={() => setActiveTab("stock")}
              className={cn(
                "px-2.5 py-1.5 font-medium rounded-t-md transition-colors border-b-2",
                activeTab === "stock"
                  ? "border-primary-600 text-primary-600 bg-primary-50/50"
                  : "border-transparent text-text-muted hover:text-text"
              )}
            >
              Stock
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={cn(
                "px-2.5 py-1.5 font-medium rounded-t-md transition-colors border-b-2",
                activeTab === "system"
                  ? "border-primary-600 text-primary-600 bg-primary-50/50"
                  : "border-transparent text-text-muted hover:text-text"
              )}
            >
              System
            </button>
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-95 overflow-y-auto divide-y divide-border/60">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary text-text-muted mb-2">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-text">No notifications here</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {activeTab === "all"
                    ? "You're completely up to date!"
                    : "No notifications found in this category."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isRead = readIds.has(notif.id);

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "group relative flex items-start gap-3 p-3 text-left transition-colors cursor-pointer",
                      isRead
                        ? "bg-white hover:bg-gray-50 opacity-80"
                        : "bg-primary-50/20 hover:bg-primary-50/40"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                        getBgColor(notif.type)
                      )}
                    >
                      {getIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={cn(
                            "text-xs font-semibold truncate",
                            isRead ? "text-text" : "text-text font-bold"
                          )}
                        >
                          {notif.title}
                        </p>
                        {notif.priority === "high" && !isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-danger-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-text-muted line-clamp-2 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-text-muted/80 block mt-1">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>

                    {/* Right Action: Mark as read check button */}
                    <div className="absolute right-2.5 top-3 flex items-center">
                      {!isRead ? (
                        <button
                          onClick={(e) => markAsRead(notif.id, e)}
                          title="Mark as read"
                          className="opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-white text-text-muted hover:text-primary-600 transition-all"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-text-muted">
                          Read
                        </span>
                      )}

                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary-600 shrink-0 group-hover:hidden" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Quick Links */}
          <div className="flex items-center justify-between border-t border-border bg-gray-50 px-4 py-2 text-xs">
            <Link
              href="/admin/orders"
              onClick={() => setIsOpen(false)}
              className="font-medium text-text-muted hover:text-primary-600 transition-colors flex items-center gap-1"
            >
              Orders <ChevronRight className="h-3 w-3" />
            </Link>

            <Link
              href="/admin/activity"
              onClick={() => setIsOpen(false)}
              className="font-medium text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
            >
              Activity Audit <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
      {/* Floating Live In-App Toast for Instant New Orders */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-9999 max-w-sm w-full bg-white border border-pink-200 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 fade-in duration-200 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e91e63]/10 text-[#e91e63]">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#e91e63] flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Real-time Alert
              </span>
              <button
                onClick={() => setLiveToast(null)}
                className="text-gray-400 hover:text-gray-600 rounded p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{liveToast.title}</p>
            <p className="text-xs text-gray-600 line-clamp-2 mt-0.5 leading-relaxed">{liveToast.message}</p>
            <div className="mt-2.5 flex items-center gap-2">
              <Link
                href={liveToast.link || "/admin/orders"}
                onClick={() => setLiveToast(null)}
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#e91e63] hover:bg-sg-pink-hover px-3 py-1.5 rounded-lg shadow-sm transition-all"
              >
                View Order <ChevronRight className="h-3 w-3" />
              </Link>
              <button
                onClick={() => setLiveToast(null)}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Notification Enable Banner (Prompt once) */}
      {showPermBanner && (
        <div className="fixed top-4 right-20 z-999 bg-slate-900 text-white rounded-xl shadow-xl px-3.5 py-2 flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-medium text-slate-200">Enable PC Order Alerts & Sound</span>
          </div>
          <button
            onClick={requestDesktopPermission}
            className="text-[11px] font-bold bg-[#e91e63] hover:bg-sg-pink-hover text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Enable Now
          </button>
          <button
            onClick={() => setShowPermBanner(false)}
            className="text-slate-400 hover:text-white p-0.5 rounded"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
