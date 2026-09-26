"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  Eye,
  Code,
  Columns,
  Maximize2,
  Minimize2,
  Undo,
  Redo,
  Minus,
  Check,
  X,
  FileText,
  HelpCircle,
  ShoppingBag,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { ImageUploadDropzone } from "@/components/shared/image-upload-dropzone";

interface RichArticleEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichArticleEditor({
  value,
  onChange,
  placeholder = "Write your engaging skincare guide or beauty article...",
  minHeight = "400px",
}: RichArticleEditorProps) {
  const [viewMode, setViewMode] = useState<"visual" | "html" | "split">("visual");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals for inserting Links and Images
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkNewTab, setLinkNewTab] = useState(true);

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");

  const visualEditorRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromProps = useRef(false);

  // Sync value into visual editor when value changes externally (e.g. initial load or template load)
  useEffect(() => {
    if (visualEditorRef.current && !isUpdatingFromProps.current) {
      if (visualEditorRef.current.innerHTML !== value) {
        visualEditorRef.current.innerHTML = value || "<p><br></p>";
      }
    }
    isUpdatingFromProps.current = false;
  }, [value]);

  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      isUpdatingFromProps.current = true;
      onChange(visualEditorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (viewMode === "html") return;
    visualEditorRef.current?.focus();
    document.execCommand(command, false, value);
    handleVisualInput();
  };

  const insertHtmlAtCursor = (html: string) => {
    if (viewMode === "html") {
      onChange(value + "\n" + html);
      return;
    }

    visualEditorRef.current?.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const el = document.createElement("div");
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node;
      let lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);

      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else if (visualEditorRef.current) {
      visualEditorRef.current.innerHTML += html;
    }
    handleVisualInput();
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const textToUse = linkText.trim() || linkUrl.trim();
    const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    const html = `<a href="${linkUrl.trim()}"${targetAttr} class="text-[#1D6474] font-bold underline hover:text-[#0E7490]">${textToUse}</a>`;
    insertHtmlAtCursor(html);
    setLinkModalOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleInsertImage = () => {
    if (!imageUrl.trim()) return;
    const alt = imageAlt.trim() || "Skincare Product Guide Illustration";
    const captionHtml = imageCaption.trim()
      ? `<figcaption class="text-center text-xs text-gray-500 mt-1 italic">${imageCaption.trim()}</figcaption>`
      : "";
    const html = `
<figure class="my-6">
  <img src="${imageUrl.trim()}" alt="${alt}" class="w-full max-h-120 object-cover rounded-2xl border border-gray-200 shadow-sm" />
  ${captionHtml}
</figure>
<p></p>`;
    insertHtmlAtCursor(html);
    setImageModalOpen(false);
    setImageUrl("");
    setImageAlt("");
    setImageCaption("");
  };

  const insertBeautyCallout = () => {
    const html = `
<div class="my-6 rounded-2xl bg-teal-50/60/80 border-l-4 border-[#1D6474] p-5 shadow-xs">
  <div class="flex items-center gap-2 text-xs font-black uppercase text-[#1D6474] mb-1">
    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.439a11.955 11.955 0 01-4.5 0m4.5 0a1.5 1.5 0 01-1.5 1.5h-1.5a1.5 1.5 0 01-1.5-1.5m3-13.5a6 6 0 10-6 0c0 2.22 1.206 4.157 3 5.195V12h6v-.555c1.794-1.038 3-2.975 3-5.195z"/></svg>
    <span>Beauty Expert Pro Tip</span>
  </div>
  <p class="text-xs text-gray-800 font-medium leading-relaxed m-0">
    Always apply hyaluronic acid or snail mucin on damp skin before sealing with a barrier repair moisturizer to maximize hydration retention!
  </p>
</div>
<p></p>`;
    insertHtmlAtCursor(html);
  };

  const insertCautionCallout = () => {
    const html = `
<div class="my-6 rounded-2xl bg-amber-50/80 border-l-4 border-amber-500 p-5 shadow-xs">
  <div class="flex items-center gap-2 text-xs font-black uppercase text-amber-700 mb-1">
    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
    <span>Patch Test & Safety Advisory</span>
  </div>
  <p class="text-xs text-amber-950 font-medium leading-relaxed m-0">
    When introducing high-strength active ingredients like <strong>Retinol</strong> or <strong>AHA/BHA Chemical Peels</strong>, always perform a 24-hour patch test behind the ear or wrist before full facial application.
  </p>
</div>
<p></p>`;
    insertHtmlAtCursor(html);
  };

  const insertRoutineStep = (stepNumber: number, stepTitle: string, description: string) => {
    const html = `
<div class="my-4 flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs hover:border-[#1D6474] transition-colors">
  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D6474]/10 text-[#1D6474] font-black text-sm">
    #${stepNumber}
  </div>
  <div class="space-y-1">
    <h4 class="text-sm font-black text-gray-900 m-0">${stepTitle}</h4>
    <p class="text-xs text-gray-600 leading-relaxed m-0">${description}</p>
  </div>
</div>
<p></p>`;
    insertHtmlAtCursor(html);
  };

  // Pre-made Article Templates
  const loadTemplate = (type: "routine" | "ingredient" | "sunscreen") => {
    if (value && value.length > 50) {
      if (!confirm("Replacing current content with selected template. Continue?")) return;
    }

    if (type === "routine") {
      const template = `
<h2>Simple 5-Step Morning Skincare Routine for Everyday Freshness</h2>
<p>Living in humid weather means dealing with excess oil, sweat, and sun exposure. A simple daily routine helps keep skin clean, balanced, and feeling comfortable all day.</p>

<h3>Step-by-Step Daily Morning Routine</h3>

<div class="my-4 flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D6474]/10 text-[#1D6474] font-black text-sm">#1</div>
  <div class="space-y-1">
    <h4 class="text-sm font-black text-gray-900 m-0">Gentle Everyday Cleanser</h4>
    <p class="text-xs text-gray-600 leading-relaxed m-0">Use a gentle gel cleanser to wash away overnight oil and sweat without leaving your skin feeling dry or tight.</p>
  </div>
</div>

<div class="my-4 flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D6474]/10 text-[#1D6474] font-black text-sm">#2</div>
  <div class="space-y-1">
    <h4 class="text-sm font-black text-gray-900 m-0">Hydrating Toner or Essence</h4>
    <p class="text-xs text-gray-600 leading-relaxed m-0">Pat a lightweight layer of Centella or Snail Mucin essence to hydrate and leave skin feeling calm and refreshed.</p>
  </div>
</div>

<div class="my-4 flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D6474]/10 text-[#1D6474] font-black text-sm">#3</div>
  <div class="space-y-1">
    <h4 class="text-sm font-black text-gray-900 m-0">Balancing Serum (Niacinamide)</h4>
    <p class="text-xs text-gray-600 leading-relaxed m-0">Helps balance excess oil and leaves the skin with a smooth, even-looking finish.</p>
  </div>
</div>

<div class="my-4 flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D6474]/10 text-[#1D6474] font-black text-sm">#4</div>
  <div class="space-y-1">
    <h4 class="text-sm font-black text-gray-900 m-0">Lightweight Gel Moisturizer</h4>
    <p class="text-xs text-gray-600 leading-relaxed m-0">Locks in daily moisture with a non-greasy feel that keeps skin soft throughout the day.</p>
  </div>
</div>

<div class="my-4 flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D6474]/10 text-[#1D6474] font-black text-sm">#5</div>
  <div class="space-y-1">
    <h4 class="text-sm font-black text-gray-900 m-0">Daily SPF Sunscreen</h4>
    <p class="text-xs text-gray-600 leading-relaxed m-0">Apply sunscreen evenly to protect against sun rays and keep your complexion bright and fresh.</p>
  </div>
</div>

<div class="my-6 rounded-2xl bg-teal-50/60/80 border-l-4 border-[#1D6474] p-5 shadow-xs">
  <div class="flex items-center gap-2 text-xs font-black uppercase text-[#1D6474] mb-1">
    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.439a11.955 11.955 0 01-4.5 0m4.5 0a1.5 1.5 0 01-1.5 1.5h-1.5a1.5 1.5 0 01-1.5-1.5m3-13.5a6 6 0 10-6 0c0 2.22 1.206 4.157 3 5.195V12h6v-.555c1.794-1.038 3-2.975 3-5.195z"/></svg>
    <span>Daily Skincare Tip</span>
  </div>
  <p class="text-xs text-gray-800 font-medium leading-relaxed m-0">
    Reapply sunscreen every few hours if you spend time outdoors during sunny hours.
  </p>
</div>

<h3>Key Takeaway</h3>
<p>Consistency is more helpful than using too many products at once. Choose simple steps that leave your skin feeling comfortable.</p>
`;
      onChange(template);
      if (visualEditorRef.current) visualEditorRef.current.innerHTML = template;
    } else if (type === "ingredient") {
      const template = `
<h2>Niacinamide vs. Vitamin C: Which Ingredient Fits Your Routine?</h2>
<p>Both Niacinamide (Vitamin B3) and Vitamin C are popular skincare favorites for brightening and maintaining a fresh-looking complexion. Here is a simple look at how each one works.</p>

<h3>1. Understanding Niacinamide (Vitamin B3)</h3>
<p>Niacinamide is a gentle vitamin that helps balance excess oil, smooth texture, and support everyday skin moisture.</p>

<ul>
  <li><strong>Good For:</strong> Balancing oil, smoothing skin texture, and everyday gentle care.</li>
  <li><strong>How to Use:</strong> Suitable for daily use in the morning or evening.</li>
  <li><strong>Texture:</strong> Lightweight and easy to layer with other products.</li>
</ul>

<h3>2. Understanding Vitamin C</h3>
<p>Vitamin C is a trusted antioxidant that helps brighten the complexion and create a fresh, radiant look.</p>

<ul>
  <li><strong>Good For:</strong> Brightening dull-looking skin and evening out sun tan.</li>
  <li><strong>How to Use:</strong> Best used in the morning under sunscreen.</li>
  <li><strong>Storage:</strong> Keep in a cool place away from direct sunlight.</li>
</ul>

<div class="my-6 rounded-2xl bg-teal-50/60/80 border-l-4 border-[#1D6474] p-5 shadow-xs">
  <div class="flex items-center gap-2 text-xs font-black uppercase text-[#1D6474] mb-1">
    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.439a11.955 11.955 0 01-4.5 0m4.5 0a1.5 1.5 0 01-1.5 1.5h-1.5a1.5 1.5 0 01-1.5-1.5m3-13.5a6 6 0 10-6 0c0 2.22 1.206 4.157 3 5.195V12h6v-.555c1.794-1.038 3-2.975 3-5.195z"/></svg>
    <span>Can You Use Both?</span>
  </div>
  <p class="text-xs text-gray-800 font-medium leading-relaxed m-0">
    Yes! You can use Vitamin C in your morning routine under sunscreen and Niacinamide in your evening routine for gentle hydration.
  </p>
</div>
`;
      onChange(template);
      if (visualEditorRef.current) visualEditorRef.current.innerHTML = template;
    }
  };

  return (
    <div
      className={`rounded-3xl border border-gray-200 bg-white shadow-card overflow-hidden transition-all ${
        isFullscreen ? "fixed inset-4 z-50 flex flex-col shadow-2xl" : ""
      }`}
    >
      {/* 1. Quick Template Selector Bar */}
      <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-600 flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-[#1D6474]" /> Quick Templates:
          </span>
          <button
            type="button"
            onClick={() => loadTemplate("routine")}
            className="rounded-lg bg-white border border-gray-200 px-2.5 py-1 font-bold text-gray-700 hover:border-[#1D6474] hover:text-[#1D6474] transition-colors shadow-2xs inline-flex items-center gap-1.5"
          >
            <Sparkles className="h-3 w-3 text-[#1D6474]" /> 5-Step Routine
          </button>
          <button
            type="button"
            onClick={() => loadTemplate("ingredient")}
            className="rounded-lg bg-white border border-gray-200 px-2.5 py-1 font-bold text-gray-700 hover:border-[#1D6474] hover:text-[#1D6474] transition-colors shadow-2xs inline-flex items-center gap-1.5"
          >
            <BookOpen className="h-3 w-3 text-purple-600" /> Ingredient Guide
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-xl bg-gray-200/80 p-0.5 font-bold text-[11px]">
          <button
            type="button"
            onClick={() => setViewMode("visual")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
              viewMode === "visual"
                ? "bg-white text-[#1D6474] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Eye className="h-3 w-3" /> Visual Editor
          </button>
          <button
            type="button"
            onClick={() => setViewMode("html")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
              viewMode === "html"
                ? "bg-white text-[#1D6474] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Code className="h-3 w-3" /> HTML Code
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
              viewMode === "split"
                ? "bg-white text-[#1D6474] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Columns className="h-3 w-3" /> Split Preview
          </button>
        </div>
      </div>

      {/* 2. Rich Formatting Toolbar */}
      <div className="border-b border-gray-200 bg-white p-2.5 flex flex-wrap items-center gap-1 shadow-2xs">
        {/* Headings */}
        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Paragraph Text (<p>)"
            onClick={() => executeCommand("formatBlock", "<p>")}
            className="rounded-lg p-1.5 text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] transition-colors"
          >
            <Pilcrow className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Heading 2 (<h2>)"
            onClick={() => executeCommand("formatBlock", "<h2>")}
            className="rounded-lg p-1.5 text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] font-black text-xs transition-colors flex items-center gap-0.5"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Heading 3 (<h3>)"
            onClick={() => executeCommand("formatBlock", "<h3>")}
            className="rounded-lg p-1.5 text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] font-black text-xs transition-colors flex items-center gap-0.5"
          >
            <Heading3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Heading 4 (<h4>)"
            onClick={() => executeCommand("formatBlock", "<h4>")}
            className="rounded-lg p-1.5 text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] font-black text-xs transition-colors flex items-center gap-0.5"
          >
            <Heading4 className="h-4 w-4" />
          </button>
        </div>

        {/* Text Styling */}
        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Bold (Ctrl+B)"
            onClick={() => executeCommand("bold")}
            className="rounded-lg p-1.5 text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] transition-colors"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Italic (Ctrl+I)"
            onClick={() => executeCommand("italic")}
            className="rounded-lg p-1.5 text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] transition-colors"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Underline (Ctrl+U)"
            onClick={() => executeCommand("underline")}
            className="rounded-lg p-1.5 text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] transition-colors"
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Strikethrough"
            onClick={() => executeCommand("strikeThrough")}
            className="rounded-lg p-1.5 text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] transition-colors"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Bullet List (<ul>)"
            onClick={() => executeCommand("insertUnorderedList")}
            className="rounded-lg p-1.5 text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] transition-colors"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Numbered List (<ol>)"
            onClick={() => executeCommand("insertOrderedList")}
            className="rounded-lg p-1.5 text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] transition-colors"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Blockquote"
            onClick={() => executeCommand("formatBlock", "<blockquote>")}
            className="rounded-lg p-1.5 text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] transition-colors"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Horizontal Divider (<hr>)"
            onClick={() => executeCommand("insertHorizontalRule")}
            className="rounded-lg p-1.5 text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* Insert Media & Links */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Insert Link"
            onClick={() => setLinkModalOpen(true)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] transition-colors"
          >
            <LinkIcon className="h-3.5 w-3.5" /> Link
          </button>
          <button
            type="button"
            title="Insert Image"
            onClick={() => setImageModalOpen(true)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 hover:bg-teal-50/60 hover:text-[#1D6474] transition-colors"
          >
            <ImageIcon className="h-3.5 w-3.5" /> Image
          </button>
        </div>

        {/* Special Beauty Callouts */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={insertBeautyCallout}
            className="flex items-center gap-1 rounded-lg bg-teal-50/60 px-2 py-1 text-xs font-bold text-[#1D6474] hover:bg-teal-100/70 transition-colors border border-teal-200 shadow-2xs"
          >
            <Sparkles className="h-3 w-3" /> + Beauty Tip Box
          </button>
          <button
            type="button"
            onClick={insertCautionCallout}
            className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200 shadow-2xs"
          >
            <AlertCircle className="h-3 w-3" /> + Caution Box
          </button>
        </div>

        {/* Fullscreen Toggle */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Editor"}
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* 3. Link Insertion Modal */}
      {linkModalOpen && (
        <div className="border-b border-teal-100 bg-teal-50/60/70 p-4 animate-in fade-in-0 slide-in-from-top-2 duration-150">
          <div className="max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#1D6474] flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5" /> Insert Hyperlink
              </span>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="url"
                required
                placeholder="https://example.com/..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#1D6474]"
              />
              <input
                type="text"
                placeholder="Link Anchor Text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#1D6474]"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 text-xs text-gray-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                  className="rounded text-[#1D6474] focus:ring-0"
                />
                Open in new tab
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLinkModalOpen(false)}
                  className="text-xs rounded-xl h-7"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleInsertLink}
                  className="bg-[#1D6474] text-white text-xs font-bold rounded-xl h-7"
                >
                  Insert Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Image Insertion Modal */}
      {imageModalOpen && (
        <div className="border-b border-teal-100 bg-teal-50/60/70 p-4 animate-in fade-in-0 slide-in-from-top-2 duration-150">
          <div className="max-w-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#1D6474] flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> Insert Beauty Illustration or Photo
              </span>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <ImageUploadDropzone
                value={imageUrl}
                onChange={setImageUrl}
                folder="blog-inline"
                label="Select or Drag & Drop Image"
                description="Upload an illustration or chart, or paste external image link"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Image Alt Text (for SEO)"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#1D6474]"
                />
                <input
                  type="text"
                  placeholder="Optional Image Caption"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#1D6474]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImageModalOpen(false)}
                className="text-xs rounded-xl h-7"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleInsertImage}
                className="bg-[#1D6474] text-white text-xs font-bold rounded-xl h-7"
              >
                Insert Image
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Editor Content Area */}
      <div
        className={`relative ${isFullscreen ? "flex-1 overflow-y-auto" : ""}`}
        style={{ minHeight }}
      >
        {/* Visual WYSIWYG View */}
        {viewMode === "visual" && (
          <div
            ref={visualEditorRef}
            contentEditable
            onInput={handleVisualInput}
            className="prose prose-pink max-w-none p-6 text-sm text-gray-900 focus:outline-none leading-relaxed min-h-95 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-black [&_h3]:text-gray-800 [&_h3]:mt-5 [&_h3]:mb-2 [&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-gray-800 [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-[#1D6474] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-4"
          />
        )}

        {/* HTML Source Code View */}
        {viewMode === "html" && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={18}
            className="w-full p-6 text-xs font-mono bg-gray-900 text-gray-100 focus:outline-none leading-relaxed resize-none h-full min-h-95"
            placeholder="<p>Enter clean HTML content here...</p>"
          />
        )}

        {/* Split View (Visual + Code or Live Render) */}
        {viewMode === "split" && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 min-h-95">
            {/* Left: Code or Editable Area */}
            <div className="p-4 bg-gray-50 flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">
                HTML Source Editor
              </span>
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 w-full p-4 rounded-xl border border-gray-300 bg-white font-mono text-xs text-gray-900 focus:outline-none focus:border-[#1D6474] resize-none leading-relaxed"
                placeholder="<p>Write HTML...</p>"
              />
            </div>

            {/* Right: Real-time Live Render Preview */}
            <div className="p-6 overflow-y-auto max-h-125 bg-white">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1D6474] mb-3 block">
                Live Storefront Render Preview
              </span>
              <div
                className="prose prose-pink max-w-none text-xs text-gray-900 leading-relaxed [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-gray-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-black [&_h3]:text-gray-800 [&_p]:text-gray-700 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                dangerouslySetInnerHTML={{ __html: value || "<p class='text-gray-400 italic'>Live preview will render here...</p>" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 6. Footer Word & Character Counter */}
      <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-2 flex items-center justify-between text-[11px] text-gray-500 font-medium">
        <div className="flex items-center gap-3">
          <span>
            Words: <strong>{(value || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length}</strong>
          </span>
          <span>
            Characters: <strong>{(value || "").replace(/<[^>]*>/g, "").length}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#1D6474] font-bold">
          <Check className="h-3 w-3" /> Rich Formatting Ready
        </div>
      </div>
    </div>
  );
}
