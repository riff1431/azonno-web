"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  LogIn,
  UserCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { submitReview, getProductReviews } from "@/features/reviews/actions";
import { askQuestion, getProductQA } from "@/features/qa/actions";
import { useLanguage } from "@/context/language-context";
import { createClient } from "@/lib/supabase/client";

interface ProductReviewsQAProps {
  productId: string;
}

export function ProductReviewsQA({ productId }: ProductReviewsQAProps) {
  const { language, toBn } = useLanguage();
  const isBn = language === "bn";

  const [activeSubTab, setActiveSubTab] = useState<"reviews" | "qa">("reviews");

  // User auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Q&A state
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionMsg, setQuestionMsg] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data?.user || null);
      setCheckingAuth(false);
    });

    getProductReviews(productId).then(setReviews);
    getProductQA(productId).then(setQuestions);
  }, [productId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setReviewMsg({
        text: isBn
          ? "রিভিউ লেখার জন্য অনুগ্রহ করে লগইন করুন।"
          : "Please log in to submit a verified review.",
        isError: true,
      });
      return;
    }

    setSubmittingReview(true);
    setReviewMsg(null);

    const res = await submitReview({
      product_id: productId,
      rating,
      title: title.trim() || undefined,
      comment: comment.trim() || undefined,
    });

    if (res.error) {
      setReviewMsg({
        text: (res as any).requireLogin
          ? (isBn ? "রিভিউ জমা দেওয়ার জন্য অনুগ্রহ করে লগইন করুন।" : "Please sign in to submit a review.")
          : res.error,
        isError: true,
      });
    } else {
      setReviewMsg({
        text: isBn
          ? "ধন্যবাদ! আপনার রিভিউ সফলভাবে প্রকাশিত হয়েছে।"
          : "Thank you! Your review has been published.",
        isError: false,
      });
      setTitle("");
      setComment("");
      if (res.review) {
        setReviews([res.review, ...reviews.filter((r) => r.id !== res.review.id)]);
      }
    }
    setSubmittingReview(false);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    if (!currentUser) {
      setQuestionMsg({
        text: isBn
          ? "প্রশ্ন করার জন্য অনুগ্রহ করে লগইন করুন।"
          : "Please sign in to ask a question.",
        isError: true,
      });
      return;
    }

    setSubmittingQuestion(true);
    setQuestionMsg(null);

    const res = await askQuestion(productId, questionText);
    if (res.error) {
      setQuestionMsg({
        text: (res as any).requireLogin
          ? (isBn ? "প্রশ্ন করার জন্য অনুগ্রহ করে প্রথমে লগইন করুন।" : "Please sign in to ask a question.")
          : res.error,
        isError: true,
      });
    } else {
      setQuestionMsg({
        text: isBn
          ? "আপনার প্রশ্নটি জমা হয়েছে! আমাদের টিম দ্রুত উত্তর দেবে।"
          : "Your question has been posted! Our team will respond shortly.",
        isError: false,
      });
      setQuestionText("");
      if (res.question) {
        const authorName =
          (Array.isArray(res.question.profiles) ? res.question.profiles[0]?.full_name : res.question.profiles?.full_name) ||
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split("@")[0] ||
          (isBn ? "সম্মানিত ক্রেতা" : "Customer");
        setQuestions([
          {
            ...res.question,
            profiles: {
              full_name: authorName,
            },
          },
          ...questions,
        ]);
      }
    }
    setSubmittingQuestion(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs: Reviews vs Q&A */}
      <div className="flex gap-4 border-b border-border pb-2 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveSubTab("reviews")}
          className={`flex items-center gap-1.5 pb-2 transition-colors ${
            activeSubTab === "reviews"
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-text-muted hover:text-text"
          }`}
        >
          <Star className="h-4 w-4 fill-current text-amber-400" />
          <span>{isBn ? `কাস্টমার রিভিউ (${toBn(reviews.length)})` : `Customer Reviews (${reviews.length})`}</span>
        </button>

        <button
          onClick={() => setActiveSubTab("qa")}
          className={`flex items-center gap-1.5 pb-2 transition-colors ${
            activeSubTab === "qa"
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-text-muted hover:text-text"
          }`}
        >
          <MessageSquare className="h-4 w-4 text-primary-600" />
          <span>{isBn ? `প্রশ্ন ও উত্তর (${toBn(questions.length)})` : `Questions & Answers (${questions.length})`}</span>
        </button>
      </div>

      {activeSubTab === "reviews" && (
        <div className="space-y-8">
          {/* Write a Review Card - Only for Logged In Users */}
          {checkingAuth ? (
            <div className="h-32 rounded-2xl border border-border bg-gray-50/70 animate-pulse flex items-center justify-center text-xs text-gray-400">
              {isBn ? "যাচাইকরণ লোড হচ্ছে..." : "Loading verification..."}
            </div>
          ) : !currentUser ? (
            <div className="rounded-3xl border border-pink-100 bg-linear-to-r from-pink-50/70 via-rose-50/30 to-purple-50/40 p-6 sm:p-7 text-center space-y-3.5 shadow-2xs">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xs text-[#e91e63] border border-pink-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm sm:text-base font-black text-gray-900">
                  {isBn ? "রিভিউ লেখার জন্য লগইন করুন" : "Sign in to Leave a Review"}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isBn
                    ? "লগইন করে আপনার বাস্তব অভিজ্ঞতা ও মতামত শেয়ার করুন।"
                    : "Sign in to share your genuine experience and helpful feedback."}
                </p>
              </div>
              <div className="pt-1 flex items-center justify-center gap-2.5 flex-wrap">
                <Link
                  href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#e91e63] hover:bg-pink-700 text-white px-4 py-2 text-xs font-black shadow-md transition-all active:scale-95"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>{isBn ? "লগইন করুন" : "Log In to Review"}</span>
                </Link>
                <Link
                  href={`/signup?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 text-xs font-bold transition-all active:scale-95"
                >
                  <span>{isBn ? "রেজিস্ট্রেশন" : "Sign Up"}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-pink-100 bg-linear-to-b from-white to-pink-50/20 p-5 space-y-4 text-xs shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-100 pb-3">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  {isBn ? "আপনার রিভিউ লিখুন" : "Write a Review"}
                </h3>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>
                    {isBn ? "লগইন আছেন:" : "Logged in as:"}{" "}
                    <strong className="font-extrabold text-emerald-950">
                      {currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "Customer"}
                    </strong>
                  </span>
                </div>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-3.5">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    {isBn ? "আপনার রেটিং নির্বাচন করুন" : "Select Your Rating"}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 text-amber-400 hover:scale-115 transition-transform"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= rating ? "fill-current" : "stroke-current fill-none text-zinc-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-black text-gray-800 text-sm">
                      {isBn ? `${toBn(rating)}.০ / ৫.০` : `${rating}.0 / 5.0`}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {rating === 5
                        ? (isBn ? "— চমৎকার! খুবই সন্তুষ্ট" : "— Excellent! Loved it")
                        : rating === 4
                        ? (isBn ? "— ভালো লেগেছে" : "— Very Good")
                        : rating === 3
                        ? (isBn ? "— মাঝারি মানের" : "— Average")
                        : (isBn ? "— সন্তোষজনক নয়" : "— Could be better")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    {isBn ? "রিভিউ শিরোনাম" : "Review Headline"}
                  </label>
                  <input
                    type="text"
                    placeholder={isBn ? "যেমন: হালকা টেক্সচার, ত্বককে ফ্রেশ রাখে!" : "e.g. Lightweight texture, leaves skin feeling fresh!"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-[#e91e63] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    {isBn ? "বিস্তারিত অভিজ্ঞতা" : "Detailed Review"} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder={isBn ? "এই পণ্যটি ব্যবহার করে আপনার কেমন লেগেছে তা শেয়ার করুন..." : "Share how this product felt and worked for you..."}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-900 focus:border-[#e91e63] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  {reviewMsg && (
                    <div
                      className={`text-xs font-bold rounded-xl px-3 py-1.5 flex items-center gap-1.5 ${
                        reviewMsg.isError
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {reviewMsg.isError ? null : <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                      <span>{reviewMsg.text}</span>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={submittingReview}
                    className="ml-auto bg-[#e91e63] hover:bg-pink-700 text-white font-black text-xs rounded-xl px-5 py-2 shadow-sm transition-all active:scale-95"
                  >
                    {submittingReview ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                    {isBn ? "রিভিউ জমা দিন" : "Submit Review"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-text-muted text-xs">
                {isBn ? "এখনো কোনো রিভিউ দেওয়া হয়নি। আপনার অভিজ্ঞতা প্রথম শেয়ার করুন!" : "No reviews yet. Be the first to share your experience!"}
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-white p-5 shadow-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < r.rating ? "fill-current" : "stroke-current fill-none text-zinc-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] sm:text-xs text-text-muted">
                      {new Date(r.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      {(Array.isArray(r.profiles) ? r.profiles[0]?.full_name : r.profiles?.full_name) ||
                        (Array.isArray(r.profiles) ? r.profiles[0]?.email : r.profiles?.email) ||
                        (isBn ? "ভেরিফায়েড ক্রেতা" : "Verified Customer")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.2 text-[10px] sm:text-xs font-bold border border-emerald-200">
                      <ShieldCheck className="h-3 w-3" />
                      {isBn ? "যাচাইকৃত ক্রয়" : "Verified Purchase"}
                    </span>
                  </div>

                  {r.title && <h4 className="font-bold text-text text-sm sm:text-base">{r.title}</h4>}
                  <p className="text-text-secondary leading-relaxed">{r.comment}</p>

                  {/* Admin Reply */}
                  {r.admin_reply && (
                    <div className="mt-3 rounded-xl bg-primary-50/70 border border-primary-100 p-3 space-y-1">
                      <span className="font-bold text-xs text-primary-900 block">
                        {isBn ? "ব্লাশ অ্যান্ড বাজেট টিমের উত্তর:" : "Response from Blush & Budget Team:"}
                      </span>
                      <p className="text-xs text-primary-800 leading-relaxed">{r.admin_reply}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSubTab === "qa" && (
        <div className="space-y-6">
          {/* Ask Question Form */}
          <div className="rounded-2xl border border-border bg-surface-secondary/40 p-5 space-y-3 text-xs">
            <h3 className="text-sm sm:text-base font-bold text-text flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-primary-600" />
              {isBn ? "ব্যবহার বা উপাদান সম্পর্কে কোনো প্রশ্ন আছে?" : "Have questions about how to use this or its ingredients?"}
            </h3>

            {!currentUser ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-gray-200">
                <span className="text-xs text-gray-600 font-medium">
                  {isBn ? "প্রশ্ন করার জন্য অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন।" : "Please sign in to your account to ask questions."}
                </span>
                <Link
                  href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-black text-white px-4 py-2 text-xs font-bold shrink-0 shadow-xs active:scale-95"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>{isBn ? "লগইন করুন" : "Sign In"}</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleQuestionSubmit} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder={isBn ? "যেমন: এটি কি প্রতিদিন ব্যবহার করা যাবে?" : "e.g. Can this be used daily?"}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                />
                <Button type="submit" size="sm" disabled={submittingQuestion} className="text-xs font-semibold">
                  {submittingQuestion ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                  {isBn ? "প্রশ্ন করুন" : "Ask"}
                </Button>
              </form>
            )}

            {questionMsg && (
              <span
                className={`text-xs font-semibold block ${
                  questionMsg.isError ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {questionMsg.text}
              </span>
            )}
          </div>

          {/* Q&A List */}
          <div className="space-y-3">
            {questions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-text-muted text-xs">
                {isBn ? "এখনো কোনো প্রশ্ন করা হয়নি। নির্দ্বিধায় প্রশ্ন করুন!" : "No questions asked yet. Ask our team anything!"}
              </div>
            ) : (
              questions.map((q) => {
                const customerName =
                  (Array.isArray(q.profiles) ? q.profiles[0]?.full_name : q.profiles?.full_name) ||
                  (Array.isArray(q.profiles) ? q.profiles[0]?.email : q.profiles?.email) ||
                  (isBn ? "সম্মানিত ক্রেতা" : "Verified Customer");

                return (
                  <div key={q.id} className="rounded-2xl border border-border bg-white p-5 shadow-xs space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="font-black text-pink-600 text-sm bg-pink-50 rounded-lg px-2 py-0.5 border border-pink-100">
                        Q
                      </span>
                      <div className="space-y-1 flex-1">
                        <p className="font-bold text-gray-900 text-sm">{q.question}</p>
                        <div className="text-[11px] text-gray-500 flex items-center flex-wrap gap-1.5">
                          <span>{isBn ? "প্রশ্ন করেছেন" : "Asked by"}</span>
                          <strong className="text-gray-900 font-bold bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                            {customerName}
                          </strong>
                          <span>•</span>
                          <span>{new Date(q.created_at).toLocaleDateString("en-GB")}</span>
                        </div>
                      </div>
                    </div>

                    {q.answers && q.answers.length > 0 ? (
                      <div className="pl-4 border-l-2 border-pink-500 space-y-2 mt-2">
                        {q.answers.map((a: any) => (
                          <div key={a.id} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{isBn ? "উত্তর:" : "Answer:"}</span>
                              {a.is_official && (
                                <span className="rounded-md bg-pink-100 text-[#e91e63] border border-pink-200 text-[10px] sm:text-xs font-black px-2 py-0.5">
                                  {isBn ? "অফিসিয়াল উত্তর" : "Official Answer"}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 leading-relaxed bg-pink-50/40 p-3 rounded-xl border border-pink-100/60 font-medium">
                              {a.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic pl-4 border-l-2 border-gray-200">
                        {isBn ? "আমাদের টিমের উত্তরের অপেক্ষায়..." : "Awaiting response from our team..."}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
