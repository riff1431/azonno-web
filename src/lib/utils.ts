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
export function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "";
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


