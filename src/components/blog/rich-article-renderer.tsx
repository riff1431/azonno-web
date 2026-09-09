"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Tag,
  BookOpen,
  Info,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichArticleRendererProps {
  content: string;
}

type Token =
  | { type: "h1" | "h2" | "h3" | "h4"; text: string }
  | { type: "hr" }
  | { type: "code"; text: string; language?: string }
  | { type: "blockquote"; text: string }
  | { type: "list"; items: { text: string; isNumbered: boolean; number?: string }[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "paragraph"; text: string };

export function RichArticleRenderer({ content }: RichArticleRendererProps) {
  if (!content) return null;

  // Clean raw math symbols like $\rightarrow$ if any
  const normalizedContent = content
    .replace(/\\r\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\$\s*\\rightarrow\s*\$/g, "➔")
    .replace(/\\rightarrow/g, "➔");

  const lines = normalizedContent.split("\n");
  const tokens: Token[] = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Empty line
    if (!line) {
      i++;
      continue;
    }

    // 1. Code Block / Flow diagram (``` ... ```)
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith("```")) {
        i++; // skip closing ```
      }
      tokens.push({
        type: "code",
        language: lang,
        text: codeLines.join("\n"),
      });
      continue;
    }

    // 2. Horizontal Rule (--- or ***)
    if (line === "---" || line === "***" || line === "___") {
      tokens.push({ type: "hr" });
      i++;
      continue;
    }

    // 3. Headings
    if (line.startsWith("# ")) {
      tokens.push({ type: "h1", text: line.replace(/^#\s+/, "") });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      tokens.push({ type: "h2", text: line.replace(/^##\s+/, "") });
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      tokens.push({ type: "h3", text: line.replace(/^###\s+/, "") });
      i++;
      continue;
    }
    if (line.startsWith("#### ")) {
      tokens.push({ type: "h4", text: line.replace(/^####\s+/, "") });
      i++;
      continue;
    }

    // 4. Blockquote (> ...)
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ""));
        i++;
      }
      tokens.push({ type: "blockquote", text: quoteLines.join(" ") });
      continue;
    }

    // 5. Table (| col1 | col2 |)
    if (line.startsWith("|") && line.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCols = tableLines[0]
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean);

        // Skip separator row (|---|---|)
        const rowLines = tableLines.slice(1).filter((l) => !l.replace(/[\s|:-]/g, "").length === false || !l.includes("---"));
        const dataRows = rowLines.map((l) =>
          l
            .split("|")
            .map((c) => c.trim())
            .filter(Boolean)
        );

        tokens.push({
          type: "table",
          headers: headerCols,
          rows: dataRows,
        });
        continue;
      }
    }

    // 6. List Items (- item, * item, 1. item)
    if (line.startsWith("- ") || line.startsWith("* ") || /^\d+\.\s/.test(line)) {
      const listItems: { text: string; isNumbered: boolean; number?: string }[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith("- ") ||
          lines[i].trim().startsWith("* ") ||
          /^\d+\.\s/.test(lines[i].trim()))
      ) {
        const curLine = lines[i].trim();
        const isNum = /^\d+\.\s/.test(curLine);
        const numMatch = curLine.match(/^(\d+)\./);
        const cleanText = curLine.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");

        listItems.push({
          text: cleanText,
          isNumbered: isNum,
          number: numMatch ? numMatch[1] : undefined,
        });
        i++;
      }
      tokens.push({ type: "list", items: listItems });
      continue;
    }

    // 7. Regular Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("- ") &&
      !lines[i].trim().startsWith("* ") &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !(lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) &&
      lines[i].trim() !== "---" &&
      lines[i].trim() !== "***"
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    tokens.push({
      type: "paragraph",
      text: paraLines.join(" "),
    });
  }

  return (
    <div className="rich-article-content space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {tokens.map((token, idx) => {
        switch (token.type) {
          case "h1":
          case "h2": {
            const isSummary =
              token.text.includes("এক নজরে") ||
              token.text.includes("Quick Summary") ||
              token.text.includes("মূল পয়েন্টসমূহ") ||
              token.text.includes("মূল বিষয়সমূহ") ||
              token.text.includes("Key Highlights");
            const isFaq =
              token.text.includes("বহুল জিজ্ঞাসিত প্রশ্ন") ||
              token.text.includes("FAQ") ||
              token.text.includes("প্রশ্নোত্তর") ||
              token.text.includes("হেল্প সেন্টার");

            return (
              <div key={idx} className="mt-8 sm:mt-11 mb-3.5 sm:mb-5 pt-2">
                <h2
                  className={cn(
                    "text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-black text-text tracking-tight flex items-center gap-3 sm:gap-3.5 break-words leading-tight sm:leading-snug",
                    isSummary && "text-pink-700",
                    isFaq && "text-blue-700"
                  )}
                >
                  <span
                    className={cn(
                      "h-5 sm:h-7 w-1.5 sm:w-2 rounded-full shrink-0",
                      isSummary ? "bg-pink-600" : isFaq ? "bg-blue-600" : "bg-primary-600"
                    )}
                  />
                  <span>{renderInlineFormatting(token.text)}</span>
                </h2>
              </div>
            );
          }

          case "h3": {
            const isQuestion = /^\d+\./.test(token.text) || token.text.includes("?");

            if (isQuestion) {
              return (
                <div
                  key={idx}
                  className="mt-6 sm:mt-8 mb-3 rounded-2xl bg-surface-secondary/90 border border-border p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs"
                >
                  <HelpCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-text leading-snug break-words">
                    {renderInlineFormatting(token.text)}
                  </h3>
                </div>
              );
            }

            return (
              <h3
                key={idx}
                className="text-lg sm:text-xl md:text-2xl font-bold text-text mt-7 sm:mt-9 mb-2.5 sm:mb-3 flex items-center gap-2.5 break-words"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-pink-500 shrink-0" />
                <span>{renderInlineFormatting(token.text)}</span>
              </h3>
            );
          }

          case "h4":
            return (
              <h4 key={idx} className="text-base sm:text-lg font-bold text-text mt-5 mb-2 break-words">
                {renderInlineFormatting(token.text)}
              </h4>
            );

          case "hr":
            return (
              <div key={idx} className="my-7 sm:my-10 flex items-center justify-center">
                <div className="h-px w-full bg-linear-to-r from-transparent via-border to-transparent" />
              </div>
            );

          case "code":
            return (
              <div
                key={idx}
                className="my-6 sm:my-7 rounded-2xl border border-pink-200 bg-linear-to-br from-pink-50/90 via-rose-50/50 to-pink-50/80 p-4 sm:p-5.5 shadow-xs max-w-full overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-2.5 text-xs sm:text-sm font-bold text-pink-700 uppercase tracking-wider">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>ধাপভিত্তিক রুটিন ফ্লো (Routine Steps)</span>
                </div>
                <div className="font-mono font-bold text-xs sm:text-[15px] text-text bg-white/95 border border-pink-100/80 p-3.5 sm:p-4.5 rounded-xl shadow-2xs overflow-x-auto whitespace-nowrap sm:whitespace-normal scrollbar-thin leading-relaxed">
                  {token.text}
                </div>
              </div>
            );

          case "blockquote":
            return (
              <div
                key={idx}
                className="my-5 sm:my-6 rounded-2xl border-l-4 border-pink-500 bg-pink-50/60 p-4 sm:p-6 italic text-[15px] sm:text-[17px] md:text-lg text-text-secondary leading-[1.8] break-words shadow-2xs"
              >
                {renderInlineFormatting(token.text)}
              </div>
            );

          case "list":
            return (
              <div key={idx} className="my-3.5 sm:my-5 space-y-2.5 sm:space-y-3.5 pl-0.5">
                {token.items.map((item, lIdx) => (
                  <div key={lIdx} className="flex items-start gap-3 sm:gap-3.5">
                    {item.isNumbered && item.number ? (
                      <span className="flex h-6 w-6 shrink-0 rounded-full bg-pink-100 text-pink-700 text-xs font-bold items-center justify-center mt-0.5 shadow-2xs">
                        {item.number}
                      </span>
                    ) : (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-pink-600 mt-1" />
                    )}
                    <div className="text-[15px] sm:text-[17px] md:text-lg text-text-secondary leading-[1.8] flex-1 break-words">
                      {renderInlineFormatting(item.text)}
                    </div>
                  </div>
                ))}
              </div>
            );

          case "table":
            return (
              <div key={idx} className="my-7 space-y-2 max-w-full">
                <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-xs scrollbar-thin scrollbar-thumb-zinc-300">
                  <table className="w-full min-w-[500px] sm:min-w-[580px] text-left text-[13px] sm:text-[15px] md:text-base">
                    <thead className="bg-surface-secondary/90 border-b border-border">
                      <tr>
                        {token.headers.map((h, hIdx) => (
                          <th
                            key={hIdx}
                            className="px-4 sm:px-5 py-3.5 font-bold text-text uppercase tracking-wider text-xs sm:text-sm"
                          >
                            {renderInlineFormatting(h)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {token.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-pink-50/20 transition-colors">
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className="px-4 sm:px-5 py-3.5 text-text-secondary leading-relaxed break-words"
                            >
                              {renderInlineFormatting(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-text-muted text-right sm:hidden">
                  ← সম্পূর্ণ টেবিলটি দেখতে ডানে-বামে স্ক্রোল করুন →
                </p>
              </div>
            );

          case "paragraph":
          default:
            return (
              <p
                key={idx}
                className="text-[15px] sm:text-[17px] md:text-lg text-text-secondary leading-[1.8] sm:leading-[1.85] mb-4 sm:mb-5 break-words font-normal"
              >
                {renderInlineFormatting(token.text)}
              </p>
            );
        }
      })}
    </div>
  );
}

/**
 * Format inline markdown tokens: **bold**, *italic*, [link](url), `code`
 */
function renderInlineFormatting(text: string): React.ReactNode {
  if (!text) return null;

  // Split by markdown tokens: links [text](url), bold **text**, inline `code`
  const tokenRegex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Link: [label](url)
    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const [_, label, href] = match;
        return (
          <Link
            key={idx}
            href={href}
            className="font-bold text-[#e91e63] underline decoration-pink-300 underline-offset-3 hover:text-pink-800 transition-colors inline-flex items-center gap-0.5 break-words"
          >
            <span>{label}</span>
          </Link>
        );
      }
    }

    // Bold: **text**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const boldContent = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-text">
          {boldContent}
        </strong>
      );
    }

    // Inline code: `text`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const codeContent = part.slice(1, -1);
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-surface-secondary text-pink-700 font-mono text-[11px] sm:text-xs font-semibold border border-border">
          {codeContent}
        </code>
      );
    }

    return part;
  });
}
