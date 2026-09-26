"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Phone, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { getHomepageConfig } from "@/features/marketing/homepage-actions";
import { resolveUserAuthEmail } from "@/features/account/actions";
import { type HomepageFullConfig, DEFAULT_HOMEPAGE_CONFIG } from "@/features/marketing/homepage-types";
import { useLanguage } from "@/context/language-context";

export default function LoginForm() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [config, setConfig] = useState<HomepageFullConfig>(DEFAULT_HOMEPAGE_CONFIG);

  useEffect(() => {
    getHomepageConfig().then((data) => {
      if (data) setConfig(data);
    });
  }, []);

  const logoImg = config.headerConfig?.logoImageUrl;
  const brandName = config.headerConfig?.logoText || "Azonno";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg(null);
    setLoading(true);

    try {
      const resolvedEmail = await resolveUserAuthEmail(email);
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? (language === "bn" ? "Invalid Mobile Number/Email  Password। Please  again :00 ।" : "Invalid mobile number/email or password. Please check your credentials and try again.")
            : authError.message
        );
        setLoading(false);
        return;
      }

      // Check role to route intelligently
      let destination = redirectTo;
      if (redirectTo === "/account" && authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        if (profile?.role === "admin" || profile?.role === "moderator") {
          destination = "/admin";
        }
      }

      setSuccessMsg(
        destination === "/admin"
          ? (language === "bn" ? "  Login  successfully! Dashboard with  ..." : "Signed in as Administrator! Opening Admin Dashboard...")
          : (language === "bn" ? "permanently Login successfully! your  with  ..." : "Signed in successfully! Redirecting to your account...")
      );
      setTimeout(() => {
        window.location.href = destination;
      }, 700);
    } catch {
      setError(language === "bn" ? "items   successfully। Please   :00 ।" : "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 bg-gray-50/50">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-gray-200 bg-white p-7 sm:p-9 shadow-xl">
        {/* Brand Logo & Heading */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center justify-center">
            {logoImg ? (
              <img
                src={logoImg}
                alt={brandName}
                className="h-9 sm:h-10 max-h-10 w-auto max-w-45 object-contain"
              />
            ) : (
              <span className="text-2xl font-black text-gray-900 tracking-[0.15em] uppercase font-sans">
                {brandName}
              </span>
            )}
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900">{t("auth", "signInTitle")}</h1>
            <p className="text-xs text-gray-500 mt-1">
              {t("auth", "signInSubtitle")}
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in-0">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-xs font-bold text-gray-800">
              {language === "bn" ? "Mobile Number  Email " : "Mobile Number or Email Address"}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="login-email"
                type="text"
                placeholder={language === "bn" ? "01XXXXXXXXX  name@example.com" : "01XXXXXXXXX or name@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoCapitalize="none"
                autoCorrect="off"
                className="pl-10 h-11 rounded-xl text-sm border-gray-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-xs font-bold text-gray-800">
                {t("auth", "password")}
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-[#1D6474] hover:underline"
              >
                {t("auth", "forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder={language === "bn" ? "your Password " : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10 h-11 rounded-xl text-sm border-gray-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-[#1D6474] hover:bg-[#164E63] text-white font-extrabold text-sm shadow-md transition-all active:scale-95 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {language === "bn" ? "Login ..." : "Signing In..."}
              </>
            ) : (
              <>
                {t("auth", "signInBtn")} <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>

        {/* Footer / Switch */}
        <div className="text-center pt-2 border-t border-gray-100 text-xs text-gray-500">
          <span>{t("auth", "noAccount")} </span>
          <Link
            href={redirectTo !== "/account" ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"}
            className="font-bold text-[#1D6474] hover:underline"
          >
            {t("auth", "createAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}

