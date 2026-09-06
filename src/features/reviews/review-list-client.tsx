"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, CheckCircle2, XCircle, AlertTriangle, MessageSquare, Reply, X, Loader2, Trash2, ExternalLink, ShieldCheck } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Button } from "@/components/shared/ui/button";
import { moderateReview, deleteReview } from "./actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface ReviewListClientProps {
  initialReviews: any[];
}

export function ReviewListClient({ initialReviews }: ReviewListClientProps) {
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const [reviews, setReviews] = useState(initialReviews);
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>("all");
  const [replyModalReview, setReplyModalReview] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: "approved" | "rejected" | "spam") => {
    const res = await moderateReview(id, newStatus);
    if (res.success && res.review) {
      setReviews(reviews.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isBn ? "আপনি কি এই রিভিউটি মুছে ফেলতে চান?" : "Are you sure you want to delete this review?")) {
      return;
    }
    setDeletingId(id);
    const res = await deleteReview(id);
    if (res.success) {
      setReviews(reviews.filter((r) => r.id !== id));
    }
    setDeletingId(null);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModalReview) return;

    setLoading(true);
    const res = await moderateReview(replyModalReview.id, "approved", replyText);
    if (res.success && res.review) {
      setReviews(
        reviews.map((r) =>
          r.id === replyModalReview.id ? { ...r, status: "approved", admin_reply: replyText } : r
        )
      );
      setReplyModalReview(null);
      setReplyText("");
    }
    setLoading(false);
  };

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    spam: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };

  const filteredReviews = selectedStatusTab === "all"
    ? reviews
    : reviews.filter((r) => r.status === selectedStatusTab);

  const columns: Column<any>[] = [
    {
      key: "product",
      header: isBn ? "পণ্য" : t("column_product"),
      sortable: true,
      cell: (row: any) => (
        <div className="max-w-50">
          {row.products?.slug ? (
            <Link
              href={`/products/${row.products.slug}`}
              target="_blank"
              className="font-bold text-text text-xs line-clamp-1 hover:text-primary-600 hover:underline inline-flex items-center gap-1"
            >
              <span>{row.products?.name || "Product"}</span>
              <ExternalLink className="h-2.5 w-2.5 text-text-muted shrink-0" />
            </Link>
          ) : (
            <span className="font-bold text-text text-xs line-clamp-1">
              {row.products?.name || "Product"}
            </span>
          )}
          <span className="text-[10px] text-text-muted block">
            {isBn ? "ক্রেতা:" : "by"}{" "}
            <strong className="text-gray-800 font-bold">
              {row.profiles?.full_name || row.profiles?.email || (isBn ? "সম্মানিত ক্রেতা" : "Customer")}
            </strong>
          </span>
        </div>
      ),
    },
    {
      key: "rating",
      header: isBn ? "রেটিং" : t("column_rating"),
      sortable: true,
      cell: (row: any) => (
        <div className="flex items-center gap-1 text-amber-400">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < row.rating ? "fill-current" : "stroke-current fill-none text-zinc-300"
              }`}
            />
          ))}
          <span className="text-xs font-bold text-text ml-1">{row.rating}.0</span>
        </div>
      ),
    },
    {
      key: "review",
      header: isBn ? "রিভিউ ও উত্তর" : t("column_description"),
      cell: (row: any) => (
        <div className="max-w-85 text-xs space-y-1">
          {row.title && <p className="font-bold text-text line-clamp-1">{row.title}</p>}
          <p className="text-text-secondary line-clamp-2">{row.comment}</p>
          {row.admin_reply && (
            <span className="text-[10px] text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200 font-medium inline-block mt-0.5">
              {isBn ? "অফিসিয়াল উত্তর:" : "Official Reply:"} &quot;{row.admin_reply}&quot;
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: isBn ? "স্ট্যাটাস" : t("column_status"),
      cell: (row: any) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
            statusColors[row.status] || "bg-zinc-100 text-zinc-600"
          }`}
        >
          {row.status === "approved"
            ? (isBn ? "অনুমোদিত" : "Approved")
            : row.status === "pending"
            ? (isBn ? "পর্যালোচনাধীন" : "Pending")
            : row.status === "rejected"
            ? (isBn ? "প্রত্যাখ্যাত" : "Rejected")
            : (isBn ? "স্প্যাম" : "Spam")}
        </span>
      ),
    },
    {
      key: "actions",
      header: isBn ? "অ্যাকশন" : t("column_actions"),
      cell: (row: any) => (
        <div className="flex items-center gap-1.5">
          {row.status !== "approved" && (
            <button
              onClick={() => handleStatusChange(row.id, "approved")}
              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
              title={isBn ? "অনুমোদন করুন" : t("approve_review")}
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}

          {row.status !== "rejected" && (
            <button
              onClick={() => handleStatusChange(row.id, "rejected")}
              className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition-colors"
              title={isBn ? "প্রত্যাখ্যান করুন" : t("action_reject")}
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => {
              setReplyModalReview(row);
              setReplyText(row.admin_reply || "");
            }}
            className="rounded-lg p-1.5 text-primary-600 hover:bg-primary-50 transition-colors"
            title={isBn ? "উত্তর দিন" : "Reply"}
          >
            <Reply className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleDelete(row.id)}
            disabled={deletingId === row.id}
            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            title={isBn ? "মুছে ফেলুন" : "Delete"}
          >
            {deletingId === row.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">
            {isBn ? "কাস্টমার রিভিউ মডারেশন" : t("review_management")}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            {isBn
              ? "গ্রাহকদের রিভিউ অনুমোদন, প্রত্যাখ্যান, উত্তর প্রদান ও স্প্যাম প্রতিরোধ পরিচালনা করুন।"
              : t("review_desc")}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: "all", label: isBn ? "সকল রিভিউ" : "All Reviews", count: reviews.length },
          { id: "approved", label: isBn ? "অনুমোদিত" : "Approved", count: reviews.filter((r) => r.status === "approved").length },
          { id: "pending", label: isBn ? "পর্যালোচনাধীন" : "Pending", count: reviews.filter((r) => r.status === "pending").length },
          { id: "rejected", label: isBn ? "প্রত্যাখ্যাত" : "Rejected", count: reviews.filter((r) => r.status === "rejected").length },
          { id: "spam", label: isBn ? "স্প্যাম" : "Spam", count: reviews.filter((r) => r.status === "spam").length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedStatusTab(tab.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedStatusTab === tab.id
                ? "bg-primary-600 text-white shadow-xs"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredReviews}
        searchKey="comment"
        searchPlaceholder={isBn ? "রিভিউ বা মন্তব্য খুঁজুন..." : t("search_reviews")}
        emptyMessage={isBn ? "কোনো রিভিউ পাওয়া যায়নি।" : t("no_reviews")}
      />

      {/* Admin Reply Modal */}
      {replyModalReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Reply className="h-5 w-5 text-primary-600" />
                {isBn ? "কাস্টমার রিভিউয়ের উত্তর দিন" : "Reply to Customer Review"}
              </h3>
              <button
                onClick={() => setReplyModalReview(null)}
                className="rounded-lg p-1 text-text-muted hover:bg-surface-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-surface-secondary p-3.5 text-xs space-y-1">
              <span className="font-bold text-text block">{replyModalReview.products?.name}</span>
              <p className="text-text-secondary italic font-medium">&quot;{replyModalReview.comment}&quot;</p>
              <span className="text-[10px] text-text-muted block mt-1">
                {isBn ? "ক্রেতা:" : "Customer:"}{" "}
                {replyModalReview.profiles?.full_name || replyModalReview.profiles?.email || (isBn ? "ক্রেতা" : "Customer")}
              </span>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-text mb-1">
                  {isBn ? "অফিসিয়াল স্টোর উত্তর" : "Official Store Response"}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={
                    isBn
                      ? "আপনার চমৎকার মতামতের জন্য ধন্যবাদ! আমাদের পণ্যটি আপনার ভালো লেগেছে জেনে আমরা আনন্দিত..."
                      : "Thank you for your feedback! We are delighted that you loved this product..."
                  }
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full rounded-xl border border-border p-3 text-xs text-text focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setReplyModalReview(null)}>
                  {isBn ? "বাতিল" : "Cancel"}
                </Button>
                <Button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700 font-bold">
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  {isBn ? "উত্তর প্রকাশ করুন" : "Publish Reply"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
