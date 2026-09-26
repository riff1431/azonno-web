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
          ? "Reviews  for Please  Login ।"
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
          ? (isBn ? "Reviews   for Please  Login ।" : "Please sign in to submit a review.")
          : res.error,
        isError: true,
      });
    } else {
      setReviewMsg({
        text: isBn
          ? "! your Reviews permanently  successfully।"
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
          ? "Question  for Please  Login ।"
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
          ? (isBn ? "Question  for Please   Login ।" : "Please sign in to ask a question.")
          : res.error,
        isError: true,
      });
    } else {
      setQuestionMsg({
        text: isBn
          ? "your Questionitems  successfully!  items  Answer ।"
          : "Your question has been posted! Our team will respond shortly.",
        isError: false,
      });
      setQuestionText("");
      if (res.question) {
        const authorName =
          (Array.isArray(res.question.profiles) ? res.question.profiles[0]?.full_name : res.question.profiles?.full_name) ||
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split("@")[0] ||
          (isBn ? " " : "Customer");
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
          <span>{isBn ? `Customers Reviews (${toBn(reviews.length)})` : `Customer Reviews (${reviews.length})`}</span>
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
          <span>{isBn ? `Question  Answer (${toBn(questions.length)})` : `Questions & Answers (${questions.length})`}</span>
        </button>
      </div>

      {activeSubTab === "reviews" && (
        <div className="space-y-8">
          {/* Write a Review Card - Only for Logged In Users */}
          {checkingAuth ? (
            <div className="h-32 rounded-2xl border border-border bg-gray-50/70 animate-pulse flex items-center justify-center text-xs text-gray-400">
              {isBn ? "Verification  ..." : "Loading verification..."}
            </div>
          ) : !currentUser ? (
            <div className="rounded-3xl border border-teal-100 bg-linear-to-r from-pink-50/70 via-rose-50/30 to-purple-50/40 p-6 sm:p-7 text-center space-y-3.5 shadow-2xs">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xs text-[#1D6474] border border-teal-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm sm:text-base font-black text-gray-900">
                  {isBn ? "Reviews  for Login " : "Sign in to Leave a Review"}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isBn
                    ? "Login  your      ।"
                    : "Sign in to share your genuine experience and helpful feedback."}
                </p>
              </div>
              <div className="pt-1 flex items-center justify-center gap-2.5 flex-wrap">
                <Link
                  href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D6474] hover:bg-[#164E63] text-white px-4 py-2 text-xs font-black shadow-md transition-all active:scale-95"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>{isBn ? "Login " : "Log In to Review"}</span>
                </Link>
                <Link
                  href={`/signup?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 text-xs font-bold transition-all active:scale-95"
                >
                  <span>{isBn ? "" : "Sign Up"}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-teal-100 bg-linear-to-b from-white to-pink-50/20 p-5 space-y-4 text-xs shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-3">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  {isBn ? "your Reviews " : "Write a Review"}
                </h3>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>
                    {isBn ? "Login :" : "Logged in as:"}{" "}
                    <strong className="font-extrabold text-emerald-950">
                      {currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "Customer"}
                    </strong>
                  </span>
                </div>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-3.5">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    {isBn ? "your items  " : "Select Your Rating"}
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
                      {isBn ? `${toBn(rating)}.0 / 5.0` : `${rating}.0 / 5.0`}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {rating === 5
                        ? (isBn ? "— !  " : "— Excellent! Loved it")
                        : rating === 4
                        ? (isBn ? "—  " : "— Very Good")
                        : rating === 3
                        ? (isBn ? "—  " : "— Average")
                        : (isBn ? "—  " : "— Could be better")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    {isBn ? "Reviews Name" : "Review Headline"}
                  </label>
                  <input
                    type="text"
                    placeholder={isBn ? "e.g.:  Texture, Cotton  !" : "e.g. Lightweight texture, leaves skin feeling fresh!"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-[#1D6474] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    {isBn ? "View Details " : "Detailed Review"} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder={isBn ? " Productsitems use  your     ..." : "Share how this product felt and worked for you..."}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white p-3.5 text-sm sm:text-base text-gray-900 focus:border-[#1D6474] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  {reviewMsg && (
                    <div
                      className={`text-sm font-bold rounded-xl px-3 py-1.5 flex items-center gap-1.5 ${
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
                    className="ml-auto bg-[#1D6474] hover:bg-[#164E63] text-white font-black text-sm rounded-xl px-6 py-2.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                    {isBn ? "Reviews  Enter" : "Submit Review"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-text-muted text-sm sm:text-base">
                {isBn ? "  Reviews  । your    !" : "No reviews yet. Be the first to share your experience!"}
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-xs space-y-2.5 text-sm sm:text-base">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < r.rating ? "fill-current" : "stroke-current fill-none text-zinc-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm text-text-muted">
                      {new Date(r.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-gray-900 text-base">
                      {(Array.isArray(r.profiles) ? r.profiles[0]?.full_name : r.profiles?.full_name) ||
                        (Array.isArray(r.profiles) ? r.profiles[0]?.email : r.profiles?.email) ||
                        (isBn ? " " : "Verified Customer")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold border border-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {isBn ? "Verification " : "Verified Purchase"}
                    </span>
                  </div>

                  {r.title && <h4 className="font-bold text-text text-base sm:text-lg">{r.title}</h4>}
                  <p className="text-gray-700 leading-relaxed font-normal">{r.comment}</p>

                  {/* Admin Reply */}
                  {r.admin_reply && (
                    <div className="mt-3 rounded-xl bg-primary-50/70 border border-primary-100 p-3.5 sm:p-4 space-y-1">
                      <span className="font-bold text-sm text-primary-900 block">
                        {isBn ? "   items Answer:" : "Response from Azonno Team:"}
                      </span>
                      <p className="text-sm sm:text-base text-primary-800 leading-relaxed">{r.admin_reply}</p>
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
          <div className="rounded-2xl border border-border bg-surface-secondary/40 p-5 sm:p-6 space-y-3.5 text-sm sm:text-base">
            <h3 className="text-base sm:text-lg font-bold text-text flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary-600" />
              {isBn ? "use     Question ?" : "Have questions about how to use this or its ingredients?"}
            </h3>

            {!currentUser ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-gray-200">
                <span className="text-sm text-gray-700 font-medium">
                  {isBn ? "Question  for Please  your  Login ।" : "Please sign in to your account to ask questions."}
                </span>
                <Link
                  href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-black text-white px-4 py-2 text-sm font-bold shrink-0 shadow-xs active:scale-95"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{isBn ? "Login " : "Sign In"}</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleQuestionSubmit} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder={isBn ? "e.g.: items  Enter use  ?" : "e.g. Can this be used daily?"}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm sm:text-base text-text focus:outline-none"
                />
                <Button type="submit" size="sm" disabled={submittingQuestion} className="text-sm font-semibold px-4 py-2.5">
                  {submittingQuestion ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  {isBn ? "Question " : "Ask"}
                </Button>
              </form>
            )}

            {questionMsg && (
              <span
                className={`text-sm font-semibold block ${
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
                {isBn ? "  Question  ।  Question !" : "No questions asked yet. Ask our team anything!"}
              </div>
            ) : (
              questions.map((q) => {
                const customerName =
                  (Array.isArray(q.profiles) ? q.profiles[0]?.full_name : q.profiles?.full_name) ||
                  (Array.isArray(q.profiles) ? q.profiles[0]?.email : q.profiles?.email) ||
                  (isBn ? " " : "Verified Customer");

                return (
                  <div key={q.id} className="rounded-2xl border border-border bg-white p-5 shadow-xs space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="font-black text-[#1D6474] text-sm bg-teal-50/60 rounded-lg px-2 py-0.5 border border-teal-100">
                        Q
                      </span>
                      <div className="space-y-1 flex-1">
                        <p className="font-bold text-gray-900 text-sm">{q.question}</p>
                        <div className="text-[11px] text-gray-500 flex items-center flex-wrap gap-1.5">
                          <span>{isBn ? "Question " : "Asked by"}</span>
                          <strong className="text-gray-900 font-bold bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                            {customerName}
                          </strong>
                          <span>•</span>
                          <span>{new Date(q.created_at).toLocaleDateString("en-GB")}</span>
                        </div>
                      </div>
                    </div>

                    {q.answers && q.answers.length > 0 ? (
                      <div className="pl-4 border-l-2 border-[#1D6474] space-y-2 mt-2">
                        {q.answers.map((a: any) => (
                          <div key={a.id} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{isBn ? "Answer:" : "Answer:"}</span>
                              {a.is_official && (
                                <span className="rounded-md bg-teal-100/70 text-[#1D6474] border border-teal-200 text-[10px] sm:text-xs font-black px-2 py-0.5">
                                  {isBn ? " Answer" : "Official Answer"}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 leading-relaxed bg-teal-50/60/40 p-3 rounded-xl border border-teal-100/60 font-medium">
                              {a.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic pl-4 border-l-2 border-gray-200">
                        {isBn ? " items Answer ..." : "Awaiting response from our team..."}
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
