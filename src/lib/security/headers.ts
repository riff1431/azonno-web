/**
 * Production-Grade Security Headers & Content Security Policy (CSP)
 * Protects against: Clickjacking, XSS, MIME sniffing, Protocol downgrades, Phishing embeds
 */

export function getSecurityHeaders(): Record<string, string> {
  const isDev = process.env.NODE_ENV !== "production";

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    // Scripts: self, inline (for Next.js hydration), eval in dev, and external CDNs & analytics
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://*.facebook.net https://analytics.tiktok.com https://*.tiktok.com https://ads.tiktok.com"
      : "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://*.facebook.net https://analytics.tiktok.com https://*.tiktok.com https://ads.tiktok.com",
    // Styles: self, inline (for Tailwind / Radix / emotion), Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Images: self, data URIs, blobs, and trusted CDNs
    "img-src 'self' data: blob: https://images.unsplash.com https://bk.shajgoj.com https://res.cloudinary.com https://*.supabase.co https://pdeooqamevjpkcnaokac.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://*.facebook.com https://analytics.tiktok.com https://*.tiktok.com https://ads.tiktok.com",
    // Fonts: self, data, and Google Fonts
    "font-src 'self' data: https://fonts.gstatic.com",
    // Connect (fetch/XHR/WS): self, Supabase API, Cloudinary, Analytics
    "connect-src 'self' https://*.supabase.co https://pdeooqamevjpkcnaokac.supabase.co wss://*.supabase.co https://api.cloudinary.com https://va.vercel-scripts.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://connect.facebook.net https://www.facebook.com https://*.facebook.com https://analytics.tiktok.com https://*.tiktok.com https://ads.tiktok.com https://business-api.tiktok.com",
    // Media (videos/audio)
    "media-src 'self' https://res.cloudinary.com data: blob:",
    // Frames (strict against iframe phishing)
    "frame-src 'self' https://challenges.cloudflare.com https://*.sslcommerz.com https://*.bkash.com https://www.googletagmanager.com https://www.facebook.com https://*.facebook.com https://analytics.tiktok.com https://*.tiktok.com https://ads.tiktok.com",
    // Object / Embed (prevent flash/java plugin exploits)
    "object-src 'none'",
    // Base URI restriction
    "base-uri 'self'",
    // Form action restriction
    "form-action 'self' https://*.sslcommerz.com https://*.bkash.com https://*.supabase.co",
    // Frame Ancestors (Prevents Clickjacking)
    "frame-ancestors 'none'",
  ];

  const cspHeader = cspDirectives.join("; ");

  return {
    // Content Security Policy
    "Content-Security-Policy": cspHeader,
    // Prevent Clickjacking (framing)
    "X-Frame-Options": "DENY",
    // Prevent MIME-type sniffing
    "X-Content-Type-Options": "nosniff",
    // Referrer Policy: Send full URL for same-origin, origin only for cross-origin HTTPS, none for HTTP
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Strict Transport Security (HSTS): Enforce HTTPS for 2 years including subdomains
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    // Permissions Policy: Restrict risky browser features
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(self)",
    // XSS Filter for legacy browsers
    "X-XSS-Protection": "1; mode=block",
    // DNS Prefetch Control
    "X-DNS-Prefetch-Control": "on",
  };
}
