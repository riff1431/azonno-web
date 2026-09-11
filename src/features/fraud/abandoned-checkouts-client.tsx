"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Send,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Loader2,
  MessageCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Zap,
  X,
  Globe,
} from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Button } from "@/components/shared/ui/button";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { formatPrice } from "@/lib/utils";
import { sendSmsNotification } from "@/features/sms/actions";
import { createOrderFromAbandonedLead, getAbandonedCheckouts } from "@/features/fraud/actions";
import { generateWhatsAppAbandonedMessage } from "@/types/orders";
import { getWhatsAppTemplates, type WhatsAppTemplate } from "@/features/communication/whatsapp-actions";
import { BDCourierBadge } from "@/features/fraud/bdcourier-badge";
import { useAdminLang } from "@/lib/admin-lang-context";

interface AbandonedCheckoutsClientProps {
  initialCheckouts: any[];
}

export function AbandonedCheckoutsClient({ initialCheckouts }: AbandonedCheckoutsClientProps) {
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const [checkouts, setCheckouts] = useState(initialCheckouts);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplate[]>([]);

  useEffect(() => {
    getWhatsAppTemplates()
      .then((tpls) => setWaTemplates(tpls))
      .catch((err) => console.warn("Could not load WhatsApp templates:", err));
  }, []);

  // Sync state with server prop
  useEffect(() => {
    setCheckouts(initialCheckouts);
  }, [initialCheckouts]);

  // Real-time live polling (every 2.5 seconds) so leads pop up live as customers type on checkout
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getAbandonedCheckouts();
        setCheckouts((prev) => {
          // Compare if length or latest active lead changed to avoid unnecessary re-renders
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            return data;
          }
          return prev;
        });
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getAbandonedCheckouts();
      setCheckouts(data);
      setFeedback({ text: `Refreshed! Found ${data.length} active incomplete lead(s).` });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ text: "Failed to refresh leads.", isError: true });
    } finally {
      setRefreshing(false);
    }
  };

  const handleConvertToOrder = async (item: any) => {
    setConvertingId(item.id);
    setFeedback(null);

    try {
      const res = await createOrderFromAbandonedLead(item.id, item);
      if (res.success) {
        setCheckouts((prev) => prev.filter((c) => c.id !== item.id));
        setFeedback({
          text: `Incomplete Lead for ${item.customer_name} converted to Order #${res.orderNumber} successfully!`,
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({ text: `Failed to convert: ${res.error}`, isError: true });
      }
    } catch (err: any) {
      setFeedback({ text: `Error: ${err.message}`, isError: true });
    } finally {
      setConvertingId(null);
    }
  };

  const handleSendRecoverySms = async (item: any) => {
    setLoadingId(item.id);
    const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "");
    try {
      await sendSmsNotification({
        recipientPhone: item.customer_phone,
        eventType: "abandoned_cart",
        variables: {
          customer_name: item.customer_name || "সম্মানিত গ্রাহক",
          store_name: "Blush & Budget",
          checkout_url: `${origin}/r/${item.id}`,
          discount_code: "BLUSH5",
        },
      });

      setCheckouts((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, recovery_status: "sms_sent" } : c))
      );
      setFeedback({ text: `Humanized Bangla Recovery SMS dispatched to ${item.customer_phone}!` });
      setTimeout(() => setFeedback(null), 3500);
    } catch {
      setFeedback({ text: "Failed to send SMS.", isError: true });
    }
    setLoadingId(null);
  };

  const columns: Column<any>[] = [
    {
      key: "customer",
      header: isBn ? "কাস্টমার যোগাযোগ" : "Lead Contact",
      sortable: true,
      cell: (row) => {
        const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "");
        const whatsappUrl = generateWhatsAppAbandonedMessage(row, origin, waTemplates);

        return (
          <div className="space-y-1">
            <span className="font-bold text-gray-900 text-xs block">{row.customer_name}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-xs text-gray-700 font-bold">{row.customer_phone}</span>
              {row.customer_phone && row.customer_phone !== "Not Provided" && (
                <>
                  <BDCourierBadge phone={row.customer_phone} />
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Recover via WhatsApp"
                    className="text-emerald-600 hover:text-emerald-700 font-bold"
                  >
                    <WhatsAppIcon className="h-4 w-4 fill-current" />
                  </a>
                  <a
                    href={`tel:${row.customer_phone}`}
                    title="Call Customer"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                </>
              )}
            </div>
            {row.customer_email && (
              <span className="text-[10px] text-gray-400 block">{row.customer_email}</span>
            )}
            {row.ip_address && (
              <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                <Globe className="h-3 w-3 text-zinc-400 shrink-0" />
                <span>IP: {row.ip_address}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "location",
      header: isBn ? "ঠিকানা ও জেলা" : "Location",
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="font-bold text-gray-900 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-[#e91e63]" /> {row.district || "Dhaka City"}
          </span>
          <span className="text-gray-500 text-[11px] block truncate max-w-50" title={row.address}>
            {row.address || "Address captured"}
          </span>
        </div>
      ),
    },
    {
      key: "cart",
      header: isBn ? "কার্টের পণ্য ও মূল্য" : "Products in Cart & Price",
      cell: (row) => (
        <div className="text-xs space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-black text-gray-900 text-sm">
              {formatPrice(row.cart_total)}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">
              ({row.cart_items?.length || 0} item{row.cart_items?.length === 1 ? "" : "s"})
            </span>
          </div>
          <div className="space-y-1">
            {row.cart_items?.map((item: any, idx: number) => {
              const lineTotal = (item.price || 0) * (item.quantity || 1);
              return (
                <div key={idx} className="flex items-center justify-between gap-3 text-[11px] bg-gray-50/80 px-2 py-1 rounded-lg border border-gray-100">
                  <span className="font-medium text-gray-800 truncate max-w-45">
                    <strong className="text-gray-900">{item.quantity}×</strong> {item.name}
                  </span>
                  <span className="font-bold text-gray-900 whitespace-nowrap text-[11px]">
                    ৳{lineTotal} <span className="text-gray-400 font-normal text-[10px]">(৳{item.price})</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: isBn ? "স্ট্যাটাস" : "Status",
      cell: (row) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border ${
            row.recovery_status === "converted"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : row.recovery_status === "sms_sent"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {row.recovery_status.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "actions",
      header: isBn ? "রিকভারি ও অ্যাকশন" : "Recovery & Actions",
      cell: (row) => {
        const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "");
        const whatsappUrl = generateWhatsAppAbandonedMessage(row, origin, waTemplates);

        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              onClick={() => handleConvertToOrder(row)}
              disabled={convertingId === row.id}
              className="bg-[#e91e63] hover:bg-sg-pink-hover text-white text-[11px] font-black rounded-xl h-7 px-2.5 shadow-xs"
              title="Convert Incomplete Lead into a Confirmed Order"
            >
              {convertingId === row.id ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Zap className="h-3 w-3 mr-1" />
              )}
              {isBn ? "অর্ডারে কনভার্ট" : "Create Order"}
            </Button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] h-7 px-2.5 shadow-xs transition-colors"
            >
              <WhatsAppIcon className="h-3.5 w-3.5 fill-white" /> WhatsApp
            </a>

            <Button
              size="sm"
              variant={row.recovery_status === "sms_sent" ? "outline" : "default"}
              disabled={loadingId === row.id}
              onClick={() => handleSendRecoverySms(row)}
              className="text-[11px] font-bold rounded-xl h-7 px-2"
            >
              {loadingId === row.id ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Send className="h-3 w-3 mr-1" />
              )}
              {row.recovery_status === "sms_sent" ? "Resend SMS" : "SMS"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e91e63] animate-pulse" />
            <span className="text-[11px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200 uppercase">
              {isBn ? "লাইভ লিড ক্যাপচার" : "Instant Live Lead Capture"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
            {isBn ? "অসম্পূর্ণ ও পরিত্যক্ত চেকআউট" : "Abandoned & Incomplete Checkouts"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isBn
              ? "গ্রাহক চেকআউটে ফোন, নাম বা ঠিকানা দেওয়ার পর ড্রপ করলে কার্টের সম্পূর্ণ আইটেম সহ রিয়েল-টাইম সংগৃহীত লিড।"
              : "Auto-captured customer leads who typed their phone, name, email, or address on the checkout page with their exact cart products and prices."}
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="text-xs font-bold rounded-xl shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? (isBn ? "রিফ্রেশ হচ্ছে..." : "Refreshing...") : (isBn ? "লিড রিফ্রেশ করুন" : "Refresh Leads")}
        </Button>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl border p-4 text-xs font-bold flex justify-between ${
            feedback.isError
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          } animate-in fade-in-0`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="rounded-3xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={checkouts}
          searchKey="customer_phone"
          searchPlaceholder="Search by phone, name, or location..."
          emptyMessage="No abandoned checkout leads right now."
        />
      </div>
    </div>
  );
}

