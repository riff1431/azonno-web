import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "BDT"): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

export function generateOrderNumber(): string {
  const random = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${random}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function calculateDiscountPercentage(
  regularPrice: number,
  salePrice: number
): number {
  if (regularPrice <= 0 || salePrice >= regularPrice) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidBDPhone(phone: string): boolean {
  return /^(?:\+?88)?01[3-9]\d{8}$/.test(phone.replace(/\s|-/g, ""));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Dynamically resolves the live website URL
 * Prioritizes window.location.origin on client, then environment configurations, Vercel/tunnel headers.
 */
export function getBaseUrl(fallback: string = ""): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, "");
  }
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    const url = process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "");
    return url.startsWith("http") ? url : `https://${url}`;
  }
  if (process.env.VERCEL_URL) {
    const url = process.env.VERCEL_URL.replace(/\/$/, "");
    return url.startsWith("http") ? url : `https://${url}`;
  }
  if (process.env.NODE_ENV === "development") {
    return `http://localhost:${process.env.PORT || 3000}`;
  }
  return fallback;
}

/**
 * Asynchronously resolves the live website URL dynamically.
 * Reads incoming HTTP headers (x-forwarded-host / host / x-forwarded-proto) in Server Actions / Routes,
 * window.location on client, and environment configurations with graceful fallbacks.
 */
export async function getLiveBaseUrl(fallback: string = ""): Promise<string> {
  // 1. Check active server request headers if executing inside a Next.js Server Action or SSR context
  try {
    const { headers } = await import("next/headers");
    const headerStore = await headers();
    const host =
      headerStore.get("x-forwarded-host") ||
      headerStore.get("host") ||
      "";
    const proto =
      headerStore.get("x-forwarded-proto") ||
      (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");

    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      return `${proto}://${host}`.replace(/\/$/, "");
    } else if (host) {
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  } catch {
    // Non-fatal if called outside request context
  }

  // 2. Client browser window
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  // 3. Environment Variables
  const envBase = getBaseUrl(fallback);
  if (envBase) return envBase.replace(/\/$/, "");

  return fallback;
}

/**
 * Ensures any relative path (e.g. "/account/track?order=123") is converted to a complete, absolute live URL.
 */
export async function ensureAbsoluteUrl(urlOrPath: string): Promise<string> {
  if (!urlOrPath) return await getLiveBaseUrl();
  const trimmed = urlOrPath.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const baseUrl = await getLiveBaseUrl();
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Dynamically extracts the base URL from an incoming Next.js Request or NextRequest.
 */
export function getRequestBaseUrl(request: Request | { headers: Headers }): string {
  const headers = request.headers;
  const host =
    headers.get("x-forwarded-host") ||
    headers.get("host") ||
    "";
  const proto =
    headers.get("x-forwarded-proto") ||
    (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");

  if (host) {
    return `${proto}://${host}`;
  }
  return getBaseUrl();
}

/**
 * Dynamically resolves the real client public IP from proxy headers.
 * Supports Cloudflare (CF-Connecting-IP), Vercel, Nginx (X-Real-IP), Akamai (True-Client-IP), and standard X-Forwarded-For.
 */
export function extractClientIp(
  headers: Headers | { get: (key: string) => string | null } | Record<string, any>
): string | undefined {
  if (!headers) return undefined;

  const getHeader = (name: string): string | undefined => {
    if (typeof (headers as any).get === "function") {
      return (headers as any).get(name) || undefined;
    }
    return (headers as any)[name] || (headers as any)[name.toLowerCase()] || undefined;
  };

  const candidateHeaders = [
    "cf-connecting-ip",
    "x-real-ip",
    "true-client-ip",
    "x-client-ip",
    "x-forwarded-for",
    "x-cluster-client-ip",
  ];

  for (const headerName of candidateHeaders) {
    const rawVal = getHeader(headerName);
    if (rawVal) {
      const firstIp = rawVal.split(",")[0]?.trim();
      if (
        firstIp &&
        firstIp !== "unknown" &&
        firstIp !== "null" &&
        firstIp !== "undefined"
      ) {
        return firstIp;
      }
    }
  }

  return undefined;
}

/**
 * Standardizes a product SKU or raw identifier into a clean, human-friendly short ID.
 * - Strips leading '#'
 * - If numeric (e.g. "1", "12", 3), pads with leading zeros to 4 digits ("0001", "0012", "0003")
 * - If already formatted custom string (e.g. "BB-101"), keeps it clean.
 * - If UUID fallback provided without SKU, generates a clean deterministic 4-digit code.
 */
export function formatShortProductId(skuOrId?: string | number | null, fallbackId?: string): string {
  if (!skuOrId && !fallbackId) return "0001";
  const raw =
    skuOrId !== undefined && skuOrId !== null && String(skuOrId).trim() !== ""
      ? String(skuOrId).trim()
      : String(fallbackId || "").trim();

  if (!raw) return "0001";
  const clean = raw.replace(/^#/, "").trim();

  // If pure digits (e.g. "1", "02", "12")
  if (/^\d+$/.test(clean)) {
    return clean.length < 4 ? clean.padStart(4, "0") : clean;
  }

  // If standard UUID (36 chars with hyphens) and no numeric SKU was available
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) {
    const hexSegment = clean.replace(/-/g, "").slice(0, 6);
    const num = (parseInt(hexSegment, 16) % 9000) + 1000;
    return String(num);
  }

  return clean;
}

/**
 * Universal product object resolver for short, human-friendly Product ID / Content ID.
 * Works seamlessly across Product, CartItem, OrderItem, and Catalog Feed objects.
 */
export function getShortProductId(
  product?: { sku?: string | null; sku_snapshot?: string | null; id?: string; product_id?: string } | null
): string {
  if (!product) return "0001";
  const candidate = product.sku || product.sku_snapshot || null;
  const fallback = product.product_id || product.id || undefined;
  return formatShortProductId(candidate, fallback);
}

/**
 * Universal resolver for Courier Public Live Tracking URLs.
 * - Pathao uses: https://merchant.pathao.com/tracking?consignment_id={consignment_id}
 * - Steadfast uses: https://steadfast.com.bd/t/{tracking_code}
 * - Automatically repairs legacy broken URLs (e.g. pathao.com/courier/tracking/?consignment_id=)
 */
export function buildCourierTrackingUrl(
  courier?: string | null,
  consignmentId?: string | null,
  existingUrl?: string | null
): string {
  const cid = (consignmentId || "").trim();
  let rawUrl = (existingUrl || "").trim();
  const cName = (courier || "").toLowerCase();

  // Fix legacy broken Pathao tracking links
  if (rawUrl.includes("pathao.com/courier/tracking")) {
    const extractedCid = rawUrl.match(/consignment_id=([^&]+)/)?.[1] || cid;
    if (extractedCid) {
      return `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(extractedCid)}`;
    }
  }

  const isPathao =
    cName.includes("pathao") ||
    cid.startsWith("PTH") ||
    cid.startsWith("DE") ||
    rawUrl.includes("pathao.com");

  if (isPathao) {
    if (cid) {
      return `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(cid)}`;
    }
    if (rawUrl) {
      return rawUrl.replace("pathao.com/courier/tracking/?consignment_id=", "merchant.pathao.com/tracking?consignment_id=");
    }
    return "";
  }

  const isSteadfast =
    cName.includes("steadfast") ||
    cid.startsWith("SF") ||
    cid.startsWith("TRK") ||
    rawUrl.includes("steadfast.com.bd");

  if (isSteadfast || cid) {
    if (rawUrl && rawUrl.includes("steadfast.com.bd")) {
      return rawUrl;
    }
    if (cid) {
      return `https://steadfast.com.bd/t/${encodeURIComponent(cid)}`;
    }
  }

  return rawUrl;
}

export interface CustomerTrackingLogView {
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
}

/**
 * Transforms internal/technical audit log notes into friendly, customer-facing Bangla/English messages.
 * Strips out internal jargon like "1-Click Dispatch", "Live API", "Stock Reduced", "Webhook", etc.
 */
export function formatCustomerLogEntry(
  entry: { status?: string | null; note?: string | null; courier_name?: string | null },
  language: "bn" | "en" = "bn"
): CustomerTrackingLogView {
  const status = (entry.status || "").toLowerCase().trim();
  const note = (entry.note || "").trim();
  const noteLower = note.toLowerCase();
  const isBn = language === "bn";

  // 1. Out for delivery
  if (noteLower.includes("out for delivery") || status === "out_for_delivery") {
    return {
      title: isBn ? "ডেলিভারি রাইডার পথে আছে" : "Out for Delivery",
      description: isBn
        ? "ডেলিভারি রাইডার আপনার পার্সেলটি নিয়ে বের হয়েছে। অনুগ্রহ করে আপনার মোবাইল সচল রাখুন।"
        : "The delivery rider is on the way to your address with your parcel. Please keep your phone active.",
      badge: isBn ? "রাইডার পথে আছে" : "Out for Delivery",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    };
  }

  // 2. In Transit / Courier hub movement (Live API Sync)
  if (
    noteLower.includes("in transit") ||
    noteLower.includes("in_transit") ||
    noteLower.includes("hub") ||
    (status === "in_transit") ||
    (status === "shipped" && noteLower.includes("live api"))
  ) {
    return {
      title: isBn ? "পার্সেল ট্রানজিটে রয়েছে" : "Parcel In Transit",
      description: isBn
        ? "পার্সেলটি আপনার স্থানীয় ডেলিভারি সেন্টারে পৌঁছানোর জন্য ট্রানজিটে রয়েছে।"
        : "Parcel is in transit to your local delivery hub.",
      badge: isBn ? "ট্রানজিটে আছে" : "In Transit",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    };
  }

  // 3. Shipped / Initial Courier Dispatch Handled
  if (
    noteLower.includes("dispatch") ||
    noteLower.includes("booked with") ||
    noteLower.includes("consignment") ||
    status === "shipped"
  ) {
    const courier = noteLower.includes("pathao")
      ? "Pathao Courier"
      : noteLower.includes("steadfast")
      ? "SteadFast Courier"
      : (entry.courier_name || (isBn ? "কুরিয়ার" : "Courier"));

    const trackMatch = note.match(/Tracking Code:\s*([A-Za-z0-9-_]+)/i) || note.match(/Consignment ID:\s*([A-Za-z0-9-_]+)/i);
    const trackCode = trackMatch ? trackMatch[1] : null;

    return {
      title: isBn ? "কুরিয়ারে হস্তান্তর সম্পন্ন" : "Handed Over to Courier",
      description: isBn
        ? `আপনার পার্সেলটি ${courier}-এ তুলে দেওয়া হয়েছে এবং ডেলিভারির জন্য রওনা হয়েছে।${trackCode ? ` (ট্র্যাকিং কোড: ${trackCode})` : ""}`
        : `Your parcel has been handed over to ${courier} and is now on the way.${trackCode ? ` (Tracking: ${trackCode})` : ""}`,
      badge: isBn ? "ডেলিভারিতে আছে" : "In Transit",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }

  // 4. Delivered
  if (
    noteLower.includes("delivered") ||
    status === "delivered" ||
    status === "completed"
  ) {
    return {
      title: isBn ? "ডেলিভারি সম্পন্ন হয়েছে" : "Delivered Successfully",
      description: isBn
        ? "আপনার পার্সেলটি সফলভাবে ডেলিভারি সম্পন্ন হয়েছে। Blush & Budget-এর সাথে কেনাকাটার জন্য আন্তরিক ধন্যবাদ! 🌸"
        : "Your parcel has been delivered successfully. Thank you for shopping with Blush & Budget!",
      badge: isBn ? "ডেলিভারি সম্পন্ন" : "Delivered",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  // 5. Cancelled
  if (
    noteLower.includes("cancelled") ||
    status === "cancelled"
  ) {
    return {
      title: isBn ? "অর্ডারটি বাতিল করা হয়েছে" : "Order Cancelled",
      description: isBn
        ? "অর্ডারটি বাতিল করা হয়েছে। কোনো প্রশ্ন বা সহায়তার প্রয়োজন হলে আমাদের কাস্টমার সাপোর্টে মেসেজ দিন।"
        : "This order has been cancelled. Please contact customer support if you need assistance.",
      badge: isBn ? "বাতিলকৃত" : "Cancelled",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    };
  }

  // 6. Returned / RTO
  if (
    noteLower.includes("returned") ||
    noteLower.includes("rto") ||
    noteLower.includes("failed") ||
    status === "returned" ||
    status === "failed"
  ) {
    return {
      title: isBn ? "পার্সেল রিটার্ন প্রক্রিয়ায় রয়েছে" : "Parcel Returned",
      description: isBn
        ? "গ্রাহকের সাথে যোগাযোগ সম্ভব না হওয়ায় বা ডেলিভারি ব্যর্থ হওয়ায় পার্সেলটি ফেরত প্রক্রিয়ায় রয়েছে।"
        : "Parcel could not be delivered and is currently being returned to the warehouse.",
      badge: isBn ? "রিটার্ন" : "Returned",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  // 7. Confirmed
  if (
    noteLower.includes("confirmed") ||
    status === "confirmed"
  ) {
    return {
      title: isBn ? "অর্ডার নিশ্চিত করা হয়েছে" : "Order Confirmed",
      description: isBn
        ? "আপনার অর্ডারটি সফলভাবে ভেরিফাই করে কনফার্ম করা হয়েছে।"
        : "Your order has been verified and confirmed.",
      badge: isBn ? "নিশ্চিত হয়েছে" : "Confirmed",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }

  // 8. Processing / Packaging
  if (
    noteLower.includes("processing") ||
    noteLower.includes("packed") ||
    noteLower.includes("packaging") ||
    noteLower.includes("quality check") ||
    status === "processing" ||
    status === "packed" ||
    status === "ready_for_pickup"
  ) {
    return {
      title: isBn ? "প্যাকেজিং ও প্রস্তুতি চলছে" : "Packaging & Quality Check",
      description: isBn
        ? "আপনার অর্ডারের পণ্যগুলো যত্ন সহকারে চেক ও প্যাকেজিং করা হচ্ছে।"
        : "Your items are being carefully inspected and packed for dispatch.",
      badge: isBn ? "প্রসেসিং" : "Processing",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    };
  }

  // 9. Payment Successful / bKash
  if (
    noteLower.includes("bkash") ||
    noteLower.includes("payment") ||
    noteLower.includes("paid")
  ) {
    return {
      title: isBn ? "পেমেন্ট সফলভাবে গৃহীত" : "Payment Received",
      description: isBn
        ? "আপনার অর্ডারের পেমেন্ট সফলভাবে গ্রহণ ও যাচাই করা হয়েছে।"
        : "Payment for your order has been successfully verified.",
      badge: isBn ? "পেইড" : "Paid",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  // 10. Initial Order Placement
  if (
    noteLower.includes("placed") ||
    noteLower.includes("created") ||
    status === "pending"
  ) {
    return {
      title: isBn ? "অর্ডার গ্রহণ করা হয়েছে" : "Order Placed",
      description: isBn
        ? "আমাদের ওয়েবসাইটে আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।"
        : "Your order has been placed successfully on our website.",
      badge: isBn ? "অর্ডার গৃহীত" : "Order Placed",
      badgeColor: "bg-zinc-100 text-zinc-700 border-zinc-200",
    };
  }

  // Clean fallback
  const cleanNote = note
    .replace(/1-Click Dispatch:?/gi, "")
    .replace(/Live API/gi, "")
    .replace(/Stock Reduced\.?/gi, "")
    .replace(/Status Updated From [^.]+ To /gi, "")
    .trim();

  return {
    title: isBn ? "স্ট্যাটাস আপডেট" : "Status Updated",
    description: cleanNote || (isBn ? "আপনার অর্ডারের স্ট্যাটাস আপডেট করা হয়েছে।" : "Your order status has been updated."),
    badge: isBn ? "আপডেট" : "Updated",
    badgeColor: "bg-zinc-50 text-zinc-700 border-zinc-200",
  };
}

/**
 * Returns clean customer-facing order status badge information
 */
export function getCustomerOrderStatusInfo(
  status: string,
  language: "bn" | "en" = "bn"
): { label: string; color: string; desc: string } {
  const isBn = language === "bn";
  const norm = (status || "").toLowerCase().trim();

  switch (norm) {
    case "pending":
      return {
        label: isBn ? "অর্ডার গৃহীত" : "Order Placed",
        color: "bg-amber-50 text-amber-800 border-amber-200",
        desc: isBn ? "আপনার অর্ডারটি গ্রহণ করা হয়েছে এবং পর্যালোচনায় রয়েছে।" : "Your order has been received and is under review.",
      };
    case "confirmed":
      return {
        label: isBn ? "অর্ডার নিশ্চিত" : "Order Confirmed",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        desc: isBn ? "আপনার অর্ডারটি কনফার্ম করা হয়েছে।" : "Your order has been verified and confirmed.",
      };
    case "processing":
    case "packed":
    case "ready_for_pickup":
      return {
        label: isBn ? "প্যাকেজিং চলছে" : "Processing & Packed",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        desc: isBn ? "আপনার পার্সেলটি যত্ন সহকারে প্যাক করা হচ্ছে।" : "Your items are being packed for dispatch.",
      };
    case "shipped":
    case "in_transit":
      return {
        label: isBn ? "ডেলিভারিতে আছে (In Transit)" : "In Transit",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        desc: isBn ? "পার্সেলটি কুরিয়ারে হস্তান্তর করা হয়েছে এবং ডেলিভারির পথে রয়েছে।" : "Parcel has been handed over to courier and is in transit.",
      };
    case "out_for_delivery":
      return {
        label: isBn ? "রাইডার ডেলিভারির পথে" : "Out for Delivery",
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        desc: isBn ? "ডেলিভারি রাইডার আপনার ঠিকানায় পৌঁছানোর জন্য বের হয়েছে।" : "Rider is out for delivery to your location.",
      };
    case "delivered":
    case "completed":
      return {
        label: isBn ? "ডেলিভারি সম্পন্ন ✓" : "Delivered Successfully",
        color: "bg-emerald-50 text-emerald-800 border-emerald-300",
        desc: isBn ? "আপনার পার্সেলটি সফলভাবে ডেলিভারি সম্পন্ন হয়েছে।" : "Parcel has been delivered successfully.",
      };
    case "cancelled":
      return {
        label: isBn ? "অর্ডার বাতিল" : "Cancelled",
        color: "bg-rose-50 text-rose-700 border-rose-200",
        desc: isBn ? "অর্ডারটি বাতিল করা হয়েছে।" : "This order has been cancelled.",
      };
    case "returned":
    case "failed":
      return {
        label: isBn ? "পার্সেল রিটার্ন" : "Returned",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        desc: isBn ? "পার্সেলটি রিটার্ন প্রক্রিয়ায় রয়েছে।" : "Parcel is in return process.",
      };
    case "on-hold":
    case "on_hold":
      return {
        label: isBn ? "যাচাই প্রক্রিয়াধীন" : "Under Verification",
        color: "bg-orange-50 text-orange-700 border-orange-200",
        desc: isBn ? "অর্ডারটি চূড়ান্ত ভেরিফিকেশনের জন্য হোল্ডে রয়েছে।" : "Order is awaiting verification.",
      };
    default:
      return {
        label: isBn ? "প্রসেসিং" : status,
        color: "bg-gray-50 text-gray-700 border-gray-200",
        desc: isBn ? "অর্ডারের কাজ চলছে।" : "Order is being processed.",
      };
  }
}
