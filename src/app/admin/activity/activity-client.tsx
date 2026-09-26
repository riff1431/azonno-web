"use client";

import { useState } from "react";
import { Activity, ShieldCheck, Truck, Ban, Star, Tag, MessageSquare, ShoppingBag, Plus, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { logAdminEvent, type ActivityLogItem } from "@/features/activity/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface ActivityClientProps {
  initialLogs: ActivityLogItem[];
}

const CATEGORY_ICONS: Record<string, any> = {
  Logistics: Truck,
  Security: Ban,
  "Social Proof": Star,
  Marketing: MessageSquare,
  Orders: ShoppingBag,
  Catalog: Tag,
  Settings: ShieldCheck,
};

const CATEGORIES = ["All", "Orders", "Logistics", "Security", "Social Proof", "Marketing", "Catalog", "Settings"];

export function ActivityClient({ initialLogs }: ActivityClientProps) {
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const [logs, setLogs] = useState<ActivityLogItem[]>(initialLogs);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState<ActivityLogItem["category"]>("Security");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const filteredLogs =
    selectedCategory === "All"
      ? logs
      : logs.filter((l) => l.category === selectedCategory);

  const getCategoryLabel = (cat: string) => {
    if (!isBn) return cat;
    switch (cat) {
      case "All": return "All";
      case "Orders": return "Order";
      case "Logistics": return "items  Courier";
      case "Security": return "Security  ";
      case "Social Proof": return "   Reviews";
      case "Marketing": return "Marketing";
      case "Catalog": return "Catalog";
      case "Settings": return "Settings";
      default: return cat;
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action.trim() || !details.trim()) {
      setError(isBn ? "Please  Action and Description   " : "Please fill out both action and description");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await logAdminEvent(action, details, category);
      if (res.success) {
        setLogs((prev) => [
          {
            id: `manual-${Date.now()}`,
            action: action.toUpperCase(),
            details,
            user: "Admin",
            time: isBn ? "" : "Just now",
            category,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setShowModal(false);
        setAction("");
        setDetails("");
      } else {
        setError(res.error || (isBn ? " Save  Failed successfully" : "Failed to save log"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {isBn ? " itemsitems   " : "Administrative Activity & Audit Trail"}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {isBn
              ? ":00 , Courier ,  items, Catalog  and Order   Description।"
              : "Immutable chronicle of staff operations, courier bookings, fraud blacklisting, catalog updates, and order events."}
          </p>
        </div>

        <Button onClick={() => setShowModal(true)} size="sm" className="shrink-0 text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          {isBn ? "  " : "Log Audit Note"}
        </Button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80 border border-border"
            }`}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary-600" />
            {isBn ? "  " : "Live Event Feed"}
          </h2>
          <span className="text-xs text-text-muted">
            {filteredLogs.length} {isBn ? "items " : "events"}
          </span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {filteredLogs.length === 0 ? (
            <p className="text-text-muted text-xs py-4 text-center">
              {isBn ? " :00     Tracking।" : "No audit logs found for this filter."}
            </p>
          ) : (
            filteredLogs.map((log) => {
              const Icon = CATEGORY_ICONS[log.category] || Activity;
              return (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-6 top-1 h-5 w-5 rounded-full border-2 border-white bg-primary-600 text-white flex items-center justify-center shadow-sm">
                    <Icon className="h-2.5 w-2.5" />
                  </div>

                  <div className="rounded-xl border border-border bg-surface-secondary/40 p-4 transition-colors group-hover:border-primary-300 group-hover:bg-surface-secondary/70">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-text">{log.action}</span>
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-white border border-border text-text-muted">
                          {log.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-text-muted font-medium whitespace-nowrap">
                        {log.time}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed mb-2">
                      {log.details}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      <span>
                        {isBn ? ":" : "Actor:"}{" "}
                        <strong className="text-text">{log.user}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Manual Audit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary-600" />
                {isBn ? "Security     Add to Cart" : "Record Security or Operational Audit Note"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleAddLog} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="log-cat">{isBn ? "Category" : "Category"}</Label>
                <select
                  id="log-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none"
                >
                  <option value="Security">{isBn ? "Security  " : "Security & Access"}</option>
                  <option value="Logistics">{isBn ? "items  Courier" : "Logistics & Courier"}</option>
                  <option value="Orders">{isBn ? "Order  " : "Orders & Billing"}</option>
                  <option value="Social Proof">{isBn ? "   Moderation" : "Social Proof & Moderation"}</option>
                  <option value="Marketing">{isBn ? "Marketing  " : "Marketing & Communication"}</option>
                  <option value="Settings">{isBn ? "Settings  " : "Settings & System"}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="log-act">{isBn ? "Action Name" : "Action Title"}</Label>
                <Input
                  id="log-act"
                  placeholder={isBn ? "e.g.: Stock Verification or  Add" : "e.g. Manual Fraud Blacklist or Stock Verification"}
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="log-desc">{isBn ? " Description" : "Detailed Description"}</Label>
                <textarea
                  id="log-desc"
                  rows={3}
                  placeholder={isBn ? "e.g.:   Stock    ..." : "e.g. Manually inspected and cleared Dhaka warehouse inventory..."}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white p-2.5 text-xs text-text focus:border-primary-500 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  {isBn ? "Cancel" : "Cancel"}
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting
                    ? (isBn ? "Save ..." : "Logging...")
                    : (isBn ? "  Save" : "Record Audit Event")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
