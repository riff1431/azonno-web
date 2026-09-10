/**
 * Comprehensive Input Sanitization & Anti-Injection Utilities
 * Protects against: XSS, SQLi fragments, LFI/Path Traversal, Open-Redirect, and Phishing embeds
 */

/**
 * Validates a redirect URL to prevent Open-Redirect phishing vulnerabilities.
 * Ensures the target is exclusively an internal relative path.
 */
export function validateSafeRedirect(url: string | null | undefined, fallback = "/"): string {
  if (!url || typeof url !== "string") return fallback;

  const trimmed = url.trim();

  // Disallow absolute URLs with protocol (http://, https://, javascript:, data:)
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:")
  ) {
    return fallback;
  }

  // Ensure it begins with a single slash (relative URL)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  // Prevent path traversal sequences inside redirects
  if (trimmed.includes("..") || trimmed.includes("%2e%2e")) {
    return fallback;
  }

  return trimmed;
}

/**
 * Strips dangerous HTML tags, script injections, and executable strings from user-supplied inputs.
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<link\b[^<]*>/gi, "")
    .replace(/<meta\b[^<]*>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^>\s]+/gi, "")
    .replace(/javascript:\s*[^"'>\s]*/gi, "")
    .replace(/data:\s*text\/html[^"'>\s]*/gi, "")
    .trim();
}

/**
 * Strips all HTML tags and leaves clean, plain text.
 * Ideal for search queries, product names, customer names, notes, and addresses.
 */
export function sanitizePlainText(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";
  return sanitizeInput(input)
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&amp;/g, "&")
    .trim();
}

/**
 * Validates and sanitizes a search query string.
 * Strips dangerous SQL syntax keywords and caps query length.
 */
export function sanitizeSearchQuery(query: string | null | undefined, maxLength = 100): string {
  if (!query || typeof query !== "string") return "";

  let cleaned = sanitizePlainText(query);
  
  // Strip common SQL injection comment markers and execution fragments
  cleaned = cleaned
    .replace(/--/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/;/g, "")
    .trim();

  return cleaned.slice(0, maxLength);
}

/**
 * Detects if a string contains Path Traversal (LFI) attempts.
 */
export function isPathTraversal(input: string | null | undefined): boolean {
  if (!input || typeof input !== "string") return false;
  const decoded = decodeURIComponentSafe(input);
  return (
    input.includes("../") ||
    input.includes("..\\") ||
    input.includes("%2e%2e") ||
    decoded.includes("../") ||
    decoded.includes("..\\")
  );
}

function decodeURIComponentSafe(uri: string): string {
  try {
    return decodeURIComponent(uri);
  } catch {
    return uri;
  }
}

/**
 * Validates email formatting strictly.
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
}

/**
 * Validates a Bangladeshi mobile phone number format (+8801... or 01...).
 */
export function isValidBdPhone(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.replace(/[\s-]/g, "");
  const bdPhoneRegex = /^(?:\+8801|8801|01)[3-9]\d{8}$/;
  return bdPhoneRegex.test(cleaned);
}
