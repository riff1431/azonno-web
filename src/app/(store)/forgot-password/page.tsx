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
          ? "items   successfully। Please   :00 ।"
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
            {language === "bn" ? "Password Reset " : "Reset your password"}
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
                {language === "bn" ? "your Email  " : "Check your email"}
              </h2>
              <p className="text-sm text-text-secondary">
                {language === "bn"
                  ? `We your Email (${email}) Password Reset  । box or    ।`
                  : `We sent a password reset link to ${email}. Please check your inbox and spam folder.`}
              </p>
              <Link href="/login">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  {language === "bn" ? "Login  " : "Back to Sign In"}
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
                    {language === "bn" ? "Mobile Number  Email " : "Mobile Number or Email Address"}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <Input
                      id="email"
                      type="text"
                      placeholder={language === "bn" ? "01XXXXXXXXX  you@example.com" : "01XXXXXXXXX or you@example.com"}
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    {language === "bn"
                      ? "your   added Mobile Number  Emailitems , We Password Reset   ।"
                      : "Enter the mobile number or email associated with your account to reset your password."}
                  </p>
                </div>

                <Button type="submit" className="w-full bg-[#1D6474] hover:bg-[#164E63] text-white font-bold" size="lg" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {language === "bn" ? "Reset  " : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-text-secondary">
                {language === "bn" ? "Password  ? " : "Remember your password? "}
                <Link href="/login" className="font-bold text-[#1D6474] hover:underline">
                  {language === "bn" ? "Login " : "Sign in"}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

