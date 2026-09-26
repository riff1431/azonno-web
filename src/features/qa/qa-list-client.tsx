"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, MessageSquare, Send, X, Loader2, CheckCircle2, Trash2, ExternalLink } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Button } from "@/components/shared/ui/button";
import { answerQuestion, deleteQuestion } from "./actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface QAListClientProps {
  initialQuestions: any[];
}

export function QAListClient({ initialQuestions }: QAListClientProps) {
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const [questions, setQuestions] = useState(initialQuestions);
  const [activeModalQ, setActiveModalQ] = useState<any | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalQ || !answerText.trim()) return;

    setLoading(true);
    const res = await answerQuestion(activeModalQ.id, answerText);
    if (res.success && res.answer) {
      setQuestions(
        questions.map((q) =>
          q.id === activeModalQ.id
            ? {
                ...q,
                answers: [res.answer],
                status: "published",
              }
            : q
        )
      );
      setActiveModalQ(null);
      setAnswerText("");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isBn ? "Are you sure you want to delete this question?" : "Are you sure you want to delete this question?")) {
      return;
    }
    setDeletingId(id);
    const res = await deleteQuestion(id);
    if (res.success) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
    setDeletingId(null);
  };

  const columns: Column<any>[] = [
    {
      key: "product",
      header: isBn ? "Products" : t("column_product"),
      sortable: true,
      cell: (row: any) => (
        <div className="max-w-50">
          {row.products?.slug ? (
            <Link
              href={`/products/${row.products.slug}`}
              target="_blank"
              className="font-bold text-text text-xs line-clamp-1 hover:text-primary-600 hover:underline inline-flex items-center gap-1"
            >
              <span>{row.products?.name || "Product"}</span>
              <ExternalLink className="h-2.5 w-2.5 text-text-muted shrink-0" />
            </Link>
          ) : (
            <span className="font-bold text-text text-xs line-clamp-1">
              {row.products?.name || "Product"}
            </span>
          )}
          <span className="text-[10px] text-text-muted block">
            {isBn ? "Question from:" : "by"}{" "}
            <strong className="text-gray-800 font-bold">
              {row.profiles?.full_name || row.profiles?.email || (isBn ? " " : "Customer")}
            </strong>
          </span>
        </div>
      ),
    },
    {
      key: "question",
      header: isBn ? "Question   Answer" : t("column_question"),
      cell: (row: any) => (
        <div className="max-w-85 text-xs space-y-1.5">
          <p className="font-semibold text-text">{row.question}</p>
          {row.answers && row.answers.length > 0 && (
            <div className="text-[11px] text-emerald-800 bg-emerald-50/90 p-2 rounded-xl border border-emerald-200 font-medium">
              <span className="font-black text-emerald-900 block mb-0.5">
                {isBn ? " Answer:" : "Official Reply:"}
              </span>
              <span>&quot;{row.answers[0].answer}&quot;</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: isBn ? "Status" : t("column_status"),
      cell: (row: any) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
            row.answers && row.answers.length > 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {row.answers && row.answers.length > 0
            ? (isBn ? "Answer  successfully" : t("question_answered"))
            : (isBn ? "Answer " : t("question_unanswered"))}
        </span>
      ),
    },
    {
      key: "actions",
      header: isBn ? "Action" : t("column_actions"),
      cell: (row: any) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActiveModalQ(row);
              setAnswerText(row.answers?.[0]?.answer || "");
            }}
            className="text-xs font-bold"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1 text-primary-600" />
            {row.answers && row.answers.length > 0
              ? (isBn ? "Answer " : t("action_edit"))
              : (isBn ? "Answer Enter" : t("answer_question"))}
          </Button>

          <button
            onClick={() => handleDelete(row.id)}
            disabled={deletingId === row.id}
            title={isBn ? " " : "Delete Question"}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === row.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">
            {isBn ? "Q&A " : t("qa_management")}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            {isBn
              ? "   Question  Answer Enter   । Answer    Products   ।"
              : t("qa_desc")}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={questions}
        searchKey="question"
        searchPlaceholder={isBn ? "Question Search..." : t("search_table")}
        emptyMessage={isBn ? " Question  Tracking।" : t("no_data")}
      />

      {/* Answer Modal */}
      {activeModalQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary-600" />
                {isBn ? " Answer  " : "Post Official Answer"}
              </h3>
              <button
                onClick={() => setActiveModalQ(null)}
                className="rounded-lg p-1 text-text-muted hover:bg-surface-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-surface-secondary p-3.5 text-xs space-y-1">
              <span className="font-bold text-text block">{activeModalQ.products?.name}</span>
              <p className="text-text-secondary font-medium">
                <strong>Q:</strong> &quot;{activeModalQ.question}&quot;
              </p>
              <span className="text-[10px] text-text-muted block mt-1">
                {isBn ? "Question from:" : "Asked by"}{" "}
                {activeModalQ.profiles?.full_name || activeModalQ.profiles?.email || (isBn ? "" : "Customer")}
              </span>
            </div>

            <form onSubmit={handleSendAnswer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-text mb-1">
                  {isBn ? "  Answer" : "Official Store Answer"}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={
                    isBn
                      ? ",  Productsitems Enter   PM use for added..."
                      : "Yes, this product is gentle and suitable for everyday use..."
                  }
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  className="w-full rounded-xl border border-border p-3 text-xs text-text focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setActiveModalQ(null)}>
                  {isBn ? "Cancel" : "Cancel"}
                </Button>
                <Button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700 font-bold">
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                  {isBn ? "Answer  " : "Publish Official Answer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
