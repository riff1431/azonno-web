"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { resolveUserAuthEmail } from "@/features/account/actions";
import { useLanguage } from "@/context/language-context";

export default function ForgotPasswordPage() {
  const { language, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const resolvedEmail = await resolveUserAuthEmail(email);
      const supabase = createClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        resolvedEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError(
        language === "bn"
          ? "একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-pink-50/40 via-white to-pink-50/30 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-black text-gray-900 tracking-[0.15em] uppercase font-sans">
              Blush &amp; Budget
            </span>
          </Link>
          <p className="mt-2 text-sm text-text-secondary">
            {language === "bn" ? "পাসওয়ার্ড রিসেট করুন" : "Reset your password"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-white p-8 shadow-card">
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-text">
                {language === "bn" ? "আপনার ইমেইল চেক করুন" : "Check your email"}
              </h2>
              <p className="text-sm text-text-secondary">
                {language === "bn"
                  ? `আমরা আপনার ইমেইলে (${email}) পাসওয়ার্ড রিসেটের লিঙ্ক পাঠিয়েছি। ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।`
                  : `We sent a password reset link to ${email}. Please check your inbox and spam folder.`}
              </p>
              <Link href="/login">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  {language === "bn" ? "লগইন পেজে ফিরুন" : "Back to Sign In"}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleReset} className="space-y-5">
                {error && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">
                    {language === "bn" ? "মোবাইল নম্বর বা ইমেইল অ্যাড্রেস" : "Mobile Number or Email Address"}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <Input
                      id="email"
                      type="text"
                      placeholder={language === "bn" ? "০১XXXXXXXXX বা you@example.com" : "01XXXXXXXXX or you@example.com"}
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    {language === "bn"
                      ? "আপনার অ্যাকাউন্টের সাথে যুক্ত মোবাইল নম্বর বা ইমেইলটি লিখুন, আমরা পাসওয়ার্ড রিসেট করার ব্যবস্থা করব।"
                      : "Enter the mobile number or email associated with your account to reset your password."}
                  </p>
                </div>

                <Button type="submit" className="w-full bg-[#e91e63] hover:bg-pink-600 text-white font-bold" size="lg" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {language === "bn" ? "রিসেট লিঙ্ক পাঠান" : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-text-secondary">
                {language === "bn" ? "পাসওয়ার্ড মনে পড়েছে? " : "Remember your password? "}
                <Link href="/login" className="font-bold text-[#e91e63] hover:underline">
                  {language === "bn" ? "লগইন করুন" : "Sign in"}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

