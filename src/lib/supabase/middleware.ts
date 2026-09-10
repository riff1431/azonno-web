import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSecurityHeaders } from "@/lib/security/headers";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { validateSafeRedirect } from "@/lib/security/sanitizer";
import { evaluateThreatRequest } from "@/lib/security/bot-filter";

export async function updateSession(request: NextRequest) {
  const securityHeaders = getSecurityHeaders();
  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") || "";

  // 0. Threat & Vulnerability Scanner Blocker (whitelists official Google/Bing/AI crawlers)
  const threatCheck = evaluateThreatRequest(pathname, userAgent);
  if (threatCheck.isThreat) {
    return new NextResponse(
      JSON.stringify({ error: "Access Denied: Forbidden request signature." }),
      { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }

  // 1. Rate Limiting Protection for Auth & Search endpoints
  if (pathname.startsWith("/api/auth") || pathname === "/login" || pathname === "/register") {
    // Only strictly throttle POST submissions (login/signup attempts); allow normal browsing GETs
    const isSubmission = request.method === "POST";
    const maxReqs = isSubmission ? 30 : 200;
    const rateCheck = checkRateLimit(`auth:${clientIp}:${isSubmission ? "post" : "get"}`, {
      intervalMs: 60000,
      maxRequests: maxReqs,
    });
    if (!rateCheck.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many authentication requests. Please try again in 1 minute." }),
        { status: 429, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
  }

  if (pathname.startsWith("/api/search")) {
    const rateCheck = checkRateLimit(`search:${clientIp}`, { intervalMs: 60000, maxRequests: 120 });
    if (!rateCheck.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Search rate limit exceeded. Please slow down." }),
        { status: 429, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-url", request.url);

  // Gracefully handle missing Supabase config (dev without Supabase)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl === "your_supabase_url" ||
    supabaseUrl.includes("your-project.supabase.co") ||
    supabaseAnonKey === "dummy_anon_key"
  ) {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const isAdminRoute = pathname.startsWith("/admin");
  const isAccountRoute =
    pathname.startsWith("/account") &&
    pathname !== "/account/wishlist" &&
    pathname !== "/account/track" &&
    !pathname.startsWith("/account/track");
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";

  // Redirect unauthenticated users from protected routes with safe redirect validation
  if (!user && (isAdminRoute || isAccountRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", validateSafeRedirect(pathname, "/account"));
    const redirectRes = NextResponse.redirect(url);
    Object.entries(securityHeaders).forEach(([k, v]) => redirectRes.headers.set(k, v));
    return redirectRes;
  }

  // Fetch role if user exists
  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role || user.app_metadata?.role || user.user_metadata?.role || "customer";
  }

  const isAdmin = userRole === "admin" || userRole === "moderator";

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    url.pathname = redirectParam
      ? validateSafeRedirect(redirectParam, isAdmin ? "/admin" : "/account")
      : isAdmin
      ? "/admin"
      : "/account";
    url.search = "";
    const redirectRes = NextResponse.redirect(url);
    Object.entries(securityHeaders).forEach(([k, v]) => redirectRes.headers.set(k, v));
    return redirectRes;
  }

  // Master Admin has NO customer account — redirect directly to Admin Dashboard
  if (user && isAdmin && isAccountRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    const redirectRes = NextResponse.redirect(url);
    Object.entries(securityHeaders).forEach(([k, v]) => redirectRes.headers.set(k, v));
    return redirectRes;
  }

  // Admin route protection — check role strictly
  if (user && isAdminRoute) {
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      const redirectRes = NextResponse.redirect(url);
      Object.entries(securityHeaders).forEach(([k, v]) => redirectRes.headers.set(k, v));
      return redirectRes;
    }
  }

  // Attach all security headers to response
  Object.entries(securityHeaders).forEach(([k, v]) => supabaseResponse.headers.set(k, v));

  return supabaseResponse;
}
