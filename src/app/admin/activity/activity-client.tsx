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
      case "All": return "সকল";
      case "Orders": return "অর্ডার";
      case "Logistics": return "লজিস্টিকস ও কুরিয়ার";
      case "Security": return "নিরাপত্তা ও অ্যাক্সেস";
      case "Social Proof": return "সোশ্যাল প্রুফ ও রিভিউ";
      case "Marketing": return "মার্কেটিং";
      case "Catalog": return "ক্যাটালগ";
      case "Settings": return "সেটিংস";
      default: return cat;
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action.trim() || !details.trim()) {
      setError(isBn ? "অনুগ্রহ করে অ্যাকশন এবং বিবরণ উভয়ই পূরণ করুন" : "Please fill out both action and description");
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
            time: isBn ? "এইমাত্র" : "Just now",
            category,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setShowModal(false);
        setAction("");
        setDetails("");
      } else {
        setError(res.error || (isBn ? "লগ সংরক্ষণ করতে ব্যর্থ হয়েছে" : "Failed to save log"));
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
            {isBn ? "প্রশাসনিক অ্যাক্টিভিটি ও অডিট ট্রেল" : "Administrative Activity & Audit Trail"}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {isBn
              ? "স্টাফ অপারেশন, কুরিয়ার বুকিং, ফ্রড ব্লকলিস্টিং, ক্যাটালগ আপডেট এবং অর্ডার ইভেন্টের স্থায়ী বিবরণ।"
              : "Immutable chronicle of staff operations, courier bookings, fraud blacklisting, catalog updates, and order events."}
          </p>
        </div>

        <Button onClick={() => setShowModal(true)} size="sm" className="shrink-0 text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          {isBn ? "অডিট নোট লিখুন" : "Log Audit Note"}
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
            {isBn ? "লাইভ ইভেন্ট ফিড" : "Live Event Feed"}
          </h2>
          <span className="text-xs text-text-muted">
            {filteredLogs.length} {isBn ? "টি ইভেন্ট" : "events"}
          </span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {filteredLogs.length === 0 ? (
            <p className="text-text-muted text-xs py-4 text-center">
              {isBn ? "এই ফিল্টারে কোনো অডিট লগ পাওয়া যায়নি।" : "No audit logs found for this filter."}
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
                        {isBn ? "সম্পাদনকারী:" : "Actor:"}{" "}
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
                {isBn ? "সিকিউরিটি বা অপারেশনাল অডিট নোট যোগ করুন" : "Record Security or Operational Audit Note"}
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
                <Label htmlFor="log-cat">{isBn ? "ক্যাটাগরি" : "Category"}</Label>
                <select
                  id="log-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none"
                >
                  <option value="Security">{isBn ? "নিরাপত্তা ও অ্যাক্সেস" : "Security & Access"}</option>
                  <option value="Logistics">{isBn ? "লজিস্টিকস ও কুরিয়ার" : "Logistics & Courier"}</option>
                  <option value="Orders">{isBn ? "অর্ডার ও বিলিং" : "Orders & Billing"}</option>
                  <option value="Social Proof">{isBn ? "সোশ্যাল প্রুফ ও মডারেশন" : "Social Proof & Moderation"}</option>
                  <option value="Marketing">{isBn ? "মার্কেটিং ও বার্তা" : "Marketing & Communication"}</option>
                  <option value="Settings">{isBn ? "সেটিংস ও সিস্টেম" : "Settings & System"}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="log-act">{isBn ? "অ্যাকশন শিরোনাম" : "Action Title"}</Label>
                <Input
                  id="log-act"
                  placeholder={isBn ? "যেমন: স্টক যাচাইকরণ অথবা ব্লক যোগ" : "e.g. Manual Fraud Blacklist or Stock Verification"}
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="log-desc">{isBn ? "বিস্তারিত বিবরণ" : "Detailed Description"}</Label>
                <textarea
                  id="log-desc"
                  rows={3}
                  placeholder={isBn ? "যেমন: ঢাকা ওয়্যারহাউজের স্টক সরেজমিনে পরিদর্শন ও হালনাগাদ..." : "e.g. Manually inspected and cleared Dhaka warehouse inventory..."}
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
                  {isBn ? "বাতিল" : "Cancel"}
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting
                    ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Logging...")
                    : (isBn ? "অডিট ইভেন্ট সংরক্ষণ করুন" : "Record Audit Event")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
