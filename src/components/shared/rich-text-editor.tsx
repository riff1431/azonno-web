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
  ListChecks,
  CheckSquare,
  Sparkles,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Minus,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Maximize2,
  Minimize2,
  Undo,
  Redo,
  Upload,
  Layers,
  Globe,
  X,
  Check,
  Search,
  Loader2,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Eye,
  Table as TableIcon,
  Palette,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoreGalleryImages, type GalleryImageItem } from "@/features/media/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = "Write rich product description, formulation, and texture...",
  minHeight = "200px",
}: RichTextEditorProps) {
  const { lang } = useAdminLang();
  const isBn = lang === "bn";

  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromProps = useRef(false);

  const [activeFormats, setActiveFormats] = useState<{ [key: string]: boolean }>({});

  // Modals & Dropdown Popups
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);

  // Link state
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkNewTab, setLinkNewTab] = useState(true);

  // Image Inserter state (3 tabs: Upload, Website Library, URL)
  const [imageTab, setImageTab] = useState<"upload" | "library" | "url">("upload");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageAltInput, setImageAltInput] = useState("");
  const [imageCaptionInput, setImageCaptionInput] = useState("");
  const [imageAlignment, setImageAlignment] = useState<"center" | "full" | "left" | "right">("center");

  // Media library state
  const [galleryImages, setGalleryImages] = useState<GalleryImageItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallerySearch, setGallerySearch] = useState("");
  const [selectedGalleryUrl, setSelectedGalleryUrl] = useState("");

  // Sync content into editable div when value changes externally (not during user typing)
  useEffect(() => {
    if (editorRef.current && !isHtmlMode && !isUpdatingFromProps.current) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isUpdatingFromProps.current = false;
  }, [value, isHtmlMode]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingFromProps.current = true;
      const html = editorRef.current.innerHTML;
      const cleanVal = html === "<p><br></p>" || html === "<br>" ? "" : html;
      onChange(cleanVal);
      checkActiveFormats();
    }
  };

  const execCommand = (command: string, arg: string | undefined = undefined) => {
    if (isHtmlMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  const checkActiveFormats = () => {
    if (isHtmlMode || typeof document === "undefined") return;
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyFull: document.queryCommandState("justifyFull"),
      });
    } catch {
      // safe fallback
    }
  };

  // Safe HTML inserter at cursor or append
  const insertHtmlAtCursor = (html: string) => {
    if (isHtmlMode) {
      onChange((value || "") + "\n" + html);
      return;
    }

    editorRef.current?.focus();
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
    } else if (editorRef.current) {
      editorRef.current.innerHTML += html;
    }
    handleInput();
  };

  // 1. Fetch Store Gallery images when switching to 'library' tab
  const loadGalleryImages = async (searchQuery = "") => {
    setGalleryLoading(true);
    try {
      const items = await getStoreGalleryImages(searchQuery);
      setGalleryImages(items);
    } catch (err) {
      console.error("Failed to load gallery images:", err);
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    if (imageModalOpen && imageTab === "library" && galleryImages.length === 0) {
      loadGalleryImages();
    }
  }, [imageModalOpen, imageTab]);

  // 2. Direct Device File Upload Handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "products");

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setUploadedPreviewUrl(data.url);
        if (!imageAltInput) {
          setImageAltInput(file.name.replace(/\.[^/.]+$/, ""));
        }
      } else {
        alert(data.error || "Failed to upload image. Please try again.");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Error uploading image to server.");
    } finally {
      setUploadingImage(false);
    }
  };

  // 3. Confirm Insert Image into Editor
  const handleConfirmInsertImage = () => {
    let finalUrl = "";
    if (imageTab === "upload") {
      finalUrl = uploadedPreviewUrl;
    } else if (imageTab === "library") {
      finalUrl = selectedGalleryUrl;
    } else {
      finalUrl = imageUrlInput.trim();
    }

    if (!finalUrl) {
      alert(isBn ? "Please upload an image or select।" : "Please upload or select an image first.");
      return;
    }

    const alt = imageAltInput.trim() || "Product Image";
    const caption = imageCaptionInput.trim();

    let alignClass = "my-4 mx-auto block max-w-full";
    if (imageAlignment === "full") {
      alignClass = "my-4 w-full block";
    } else if (imageAlignment === "left") {
      alignClass = "my-4 float-left mr-4 max-w-[50%]";
    } else if (imageAlignment === "right") {
      alignClass = "my-4 float-right ml-4 max-w-[50%]";
    }

    const captionHtml = caption
      ? `<figcaption class="text-center text-xs text-gray-500 mt-1.5 italic font-medium">${caption}</figcaption>`
      : "";

    const html = `
<figure class="my-4 inline-block ${imageAlignment === 'full' ? 'w-full' : ''}">
  <img src="${finalUrl}" alt="${alt}" class="${alignClass} rounded-2xl border border-gray-200/90 shadow-sm object-cover" />
  ${captionHtml}
</figure>
<p></p>`;

    insertHtmlAtCursor(html);

    // Reset & Close
    setImageModalOpen(false);
    setUploadedPreviewUrl("");
    setImageUrlInput("");
    setImageAltInput("");
    setImageCaptionInput("");
    setSelectedGalleryUrl("");
  };

  // 4. Link Insertion
  const handleConfirmInsertLink = () => {
    if (!linkUrl.trim()) return;
    const textToUse = linkText.trim() || linkUrl.trim();
    const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    const html = `<a href="${linkUrl.trim()}"${targetAttr} class="text-[#1D6474] font-bold underline hover:text-[#0E7490]">${textToUse}</a>`;
    insertHtmlAtCursor(html);
    setLinkModalOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  // 5. Readymade List Insertions
  const insertListStyle = (styleType: "checkbox" | "checkmark" | "stars" | "step_pills" | "ordered" | "unordered") => {
    setListMenuOpen(false);
    if (styleType === "unordered") {
      execCommand("insertUnorderedList");
      return;
    }
    if (styleType === "ordered") {
      execCommand("insertOrderedList");
      return;
    }

    if (styleType === "checkmark") {
      const html = `
<ul class="my-3 space-y-2 list-none pl-0">
  <li class="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-800">
    <span class="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black shrink-0">✓</span>
    <span>${isBn ? "100% Premium Cotton  harmful pure combed cotton weave" : "100% natural & paraben-free formulation"}</span>
  </li>
  <li class="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-800">
    <span class="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black shrink-0">✓</span>
    <span>${isBn ? "72 Hours premium     items " : "72-hour intense hydration & glass skin glow"}</span>
  </li>
  <li class="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-800">
    <span class="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black shrink-0">✓</span>
    <span>${isBn ? "   Cotton use for Add" : "Gentle and suitable for sensitive skin"}</span>
  </li>
</ul>
<p></p>`;
      insertHtmlAtCursor(html);
    } else if (styleType === "checkbox") {
      const html = `
<ul class="my-3 space-y-2 list-none pl-0">
  <li class="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-gray-800">
    <input type="checkbox" checked readOnly class="h-4 w-4 rounded text-[#1D6474] focus:ring-[#1D6474] border-gray-300 pointer-events-none" />
    <span>${isBn ? "-  - (   )" : "Oil-free & non-comedogenic texture"}</span>
  </li>
  <li class="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-gray-800">
    <input type="checkbox" checked readOnly class="h-4 w-4 rounded text-[#1D6474] focus:ring-[#1D6474] border-gray-300 pointer-events-none" />
    <span>${isBn ? "Cotton        " : "Helps support a more even-looking skin tone"}</span>
  </li>
  <li class="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-gray-800">
    <input type="checkbox" class="h-4 w-4 rounded text-[#1D6474] focus:ring-[#1D6474] border-gray-300 pointer-events-none" />
    <span>${isBn ? "All Sizes (S to XXL) for Add (,   )" : "Suitable for all skin types (Oily, Dry, Combination)"}</span>
  </li>
</ul>
<p></p>`;
      insertHtmlAtCursor(html);
    } else if (styleType === "stars") {
      const html = `
<ul class="my-3 space-y-2 list-none pl-0">
  <li class="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-800">
    <span class="text-amber-500 text-base shrink-0">✨</span>
    <span><strong>${isBn ? " :" : "Key Feature:"}</strong> ${isBn ? "  items weave" : "Korean gentle hydrating formula"}</span>
  </li>
  <li class="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-800">
    <span class="text-amber-500 text-base shrink-0">⭐</span>
    <span><strong>${isBn ? ":" : "Visible Results:"}</strong> ${isBn ? "Rules use    " : "Leaves skin feeling soft, fresh, and comfortable"}</span>
  </li>
  <li class="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-800">
    <span class="text-amber-500 text-base shrink-0">✨</span>
    <span><strong>${isBn ? "Texture:" : "Texture:"}</strong> ${isBn ? " :00    Cotton  " : "Lightweight watery gel that absorbs instantly"}</span>
  </li>
</ul>
<p></p>`;
      insertHtmlAtCursor(html);
    } else if (styleType === "step_pills") {
      const html = `
<div class="my-4 space-y-2.5">
  <div class="flex items-start gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-200/80">
    <span class="h-6 w-6 rounded-full bg-teal-100/70 text-[#1D6474] font-black text-xs flex items-center justify-center shrink-0">1</span>
    <span class="text-xs text-gray-800 font-medium leading-relaxed">${isBn ? "        ।" : "Cleanse face with gentle face wash and pat dry."}</span>
  </div>
  <div class="flex items-start gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-200/80">
    <span class="h-6 w-6 rounded-full bg-teal-100/70 text-[#1D6474] font-black text-xs flex items-center justify-center shrink-0">2</span>
    <span class="text-xs text-gray-800 font-medium leading-relaxed">${isBn ? "2-3 :00 Oxford Shirt   with      ।" : "Apply 2-3 drops evenly across forehead and cheeks."}</span>
  </div>
  <div class="flex items-start gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-200/80">
    <span class="h-6 w-6 rounded-full bg-teal-100/70 text-[#1D6474] font-black text-xs flex items-center justify-center shrink-0">3</span>
    <span class="text-xs text-gray-800 font-medium leading-relaxed">${isBn ? "  for Enter   PM  use ।" : "Use daily morning and night for daily hydration and fresh comfort."}</span>
  </div>
</div>
<p></p>`;
      insertHtmlAtCursor(html);
    }
  };

  // 6. Readymade Design Templates
  const insertTemplateBlock = (templateType: string) => {
    setTemplateMenuOpen(false);

    if (templateType === "benefits_card") {
      const html = `
<div class="my-5 rounded-3xl bg-teal-50/60/50 border border-teal-200/80 p-5 shadow-xs">
  <h4 class="text-sm font-black text-[#1D6474] flex items-center gap-2 mb-3">
    <span>✨</span> ${isBn ? " items  :" : "Why You\'ll Like It:"}
  </h4>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
    <div class="p-3 bg-white rounded-2xl border border-teal-100 flex items-start gap-2 shadow-2xs">
      <span class="text-emerald-600 font-bold">✓</span>
      <div>
        <strong class="block text-gray-900 font-bold">${isBn ? "premium " : "Deep Hydration"}</strong>
        <span class="text-gray-600">${isBn ? "Cotton premium    ।" : "Locks moisture deep in skin layers."}</span>
      </div>
    </div>
    <div class="p-3 bg-white rounded-2xl border border-teal-100 flex items-start gap-2 shadow-2xs">
      <span class="text-emerald-600 font-bold">✓</span>
      <div>
        <strong class="block text-gray-900 font-bold">${isBn ? "  " : "Radiant Glow"}</strong>
        <span class="text-gray-600">${isBn ? "     ।" : "Revitalizes dull complexions."}</span>
      </div>
    </div>
    <div class="p-3 bg-white rounded-2xl border border-teal-100 flex items-start gap-2 shadow-2xs">
      <span class="text-emerald-600 font-bold">✓</span>
      <div>
        <strong class="block text-gray-900 font-bold">${isBn ? " " : "Barrier Defense"}</strong>
        <span class="text-gray-600">${isBn ? "Enter   for Add।" : "Designed for comfortable daily barrier care."}</span>
      </div>
    </div>
    <div class="p-3 bg-white rounded-2xl border border-teal-100 flex items-start gap-2 shadow-2xs">
      <span class="text-emerald-600 font-bold">✓</span>
      <div>
        <strong class="block text-gray-900 font-bold">${isBn ? "- " : "Fast Absorbing"}</strong>
        <span class="text-gray-600">${isBn ? "   OFF   ।" : "Non-sticky, lightweight finish."}</span>
      </div>
    </div>
  </div>
</div>
<p></p>`;
      insertHtmlAtCursor(html);
    } else if (templateType === "pro_tip") {
      const html = `
<div class="my-5 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 border-l-4 border-[#1D6474] p-4 shadow-xs">
  <div class="flex items-center gap-2 text-xs font-black uppercase text-[#1D6474] mb-1">
    <span>💡</span>
    <span>${isBn ? "items   items" : "Beauty Expert Pro Tip"}</span>
  </div>
  <p class="text-xs text-gray-800 font-medium leading-relaxed m-0">
    ${isBn
      ? "  Cotton Oxford Shirt   use     !      Invalid ।"
      : "Always apply hydrating serum or essence onto slightly damp skin to maximize absorption and seal with moisturizer to keep skin soft and hydrated."}
  </p>
</div>
<p></p>`;
      insertHtmlAtCursor(html);
    } else if (templateType === "spec_table") {
      const html = `
<div class="my-5 overflow-x-auto">
  <table class="w-full text-xs text-left border-collapse rounded-2xl overflow-hidden border border-gray-200">
    <thead class="bg-gray-100/80 text-gray-800 uppercase font-black text-[11px]">
      <tr>
        <th class="p-3 border-b border-gray-200">${isBn ? " / :00" : "Feature / Specification"}</th>
        <th class="p-3 border-b border-gray-200">${isBn ? "Description  " : "Details"}</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200 bg-white">
      <tr class="hover:bg-gray-50/50">
        <td class="p-3 font-bold text-gray-900">${isBn ? "Products Quantity / " : "Net Weight / Volume"}</td>
        <td class="p-3 text-gray-700">50ml / 1.69 fl. oz.</td>
      </tr>
      <tr class="hover:bg-gray-50/50 bg-gray-50/30">
        <td class="p-3 font-bold text-gray-900">${isBn ? "added  :00" : "Suitable Skin Type"}</td>
        <td class="p-3 text-gray-700">${isBn ? ",   All  Cotton" : "All Skin Types (Oily, Sensitive, Normal & Combination)"}</td>
      </tr>
      <tr class="hover:bg-gray-50/50">
        <td class="p-3 font-bold text-gray-900">${isBn ? " " : "Country of Origin"}</td>
        <td class="p-3 text-gray-700">South Korea (100% Authentic Import)</td>
      </tr>
      <tr class="hover:bg-gray-50/50 bg-gray-50/30">
        <td class="p-3 font-bold text-gray-900">${isBn ? "use " : "Usage Timing"}</td>
        <td class="p-3 text-gray-700">${isBn ? "Enter   PM (Day & Night Routine)" : "Daily Day & Night Routine"}</td>
      </tr>
    </tbody>
  </table>
</div>
<p></p>`;
      insertHtmlAtCursor(html);
    } else if (templateType === "guarantee_banner") {
      const html = `
<div class="my-5 flex items-center gap-4 rounded-3xl bg-emerald-50 border border-emerald-200 p-4 sm:p-5 shadow-xs">
  <div class="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 font-black text-xl shadow-xs">
    🛡️
  </div>
  <div class="space-y-1">
    <h4 class="text-sm font-black text-emerald-950 m-0">
      ${isBn ? "100% items  Original Brand itemsitems items" : "100% Authentic & Original Brand Guarantee"}
    </h4>
    <p class="text-xs text-emerald-800 font-medium leading-relaxed m-0">
      ${isBn
        ? "We       from Products  ।  Types   Erroradded Products   100%  items!"
        : "Directly imported from verified brand manufacturers. Backed by our 100% money-back authenticity guarantee."}
    </p>
  </div>
</div>
<p></p>`;
      insertHtmlAtCursor(html);
    } else if (templateType === "caution_alert") {
      const html = `
<div class="my-5 rounded-2xl bg-amber-50/80 border-l-4 border-amber-500 p-4 shadow-xs">
  <div class="flex items-center gap-2 text-xs font-black uppercase text-amber-900 mb-1">
    <span>⚠️</span>
    <span>${isBn ? "   Test " : "Safety Advisory & Patch Test"}</span>
  </div>
  <p class="text-xs text-amber-950 font-medium leading-relaxed m-0">
    ${isBn
      ? "   Products  use      24 Hours  Test   ।     Clean    ।"
      : "Perform a 24-hour patch test behind the ear or on wrist before first use. Avoid direct contact with eyes."}
  </p>
</div>
<p></p>`;
      insertHtmlAtCursor(html);
    } else if (templateType === "faq_box") {
      const html = `
<div class="my-5 space-y-3">
  <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
    <h5 class="text-xs sm:text-sm font-black text-gray-900 mb-1 flex items-center gap-1.5">
      <span class="text-[#1D6474] font-black">Q:</span> ${isBn ? "items   (Sensitive) Cotton use  ?" : "Is this safe for sensitive skin?"}
    </h5>
    <p class="text-xs text-gray-600 leading-relaxed pl-4 m-0 border-l-2 border-teal-200">
      ${isBn ? ", items     and Enter use for Add।" : "Yes, it contains gentle ingredients suitable for everyday use."}
    </p>
  </div>
  <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
    <h5 class="text-xs sm:text-sm font-black text-gray-900 mb-1 flex items-center gap-1.5">
      <span class="text-[#1D6474] font-black">Q:</span> ${isBn ? "use  Cotton   ?" : "How does it feel after use?"}
    </h5>
    <p class="text-xs text-gray-600 leading-relaxed pl-4 m-0 border-l-2 border-teal-200">
      ${isBn ? "use  Cotton ,     ।" : "Leaves skin feeling soft, refreshed, and comfortable right away."}
    </p>
  </div>
</div>
<p></p>`;
      insertHtmlAtCursor(html);
    }
  };

  return (
    <div className={cn("space-y-1.5 w-full relative", isFullscreen && "fixed inset-0 z-50 bg-white p-6 flex flex-col")}>
      {/* Top Header Label & HTML Toggle */}
      {label && !isFullscreen && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700">{label}</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsHtmlMode(!isHtmlMode)}
              className={cn(
                "flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-colors",
                isHtmlMode
                  ? "bg-[#111827] text-white border-[#111827]"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              )}
            >
              {isHtmlMode ? (
                <>
                  <Eye className="h-3 w-3 text-pink-400" />
                  <span>{isBn ? "  (Visual)" : "Visual Mode"}</span>
                </>
              ) : (
                <>
                  <FileCode className="h-3 w-3 text-[#1D6474]" />
                  <span>{isBn ? "items  (</>)" : "Edit HTML (</>)"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Editor Wrapper */}
      <div
        className={cn(
          "rounded-2xl border border-gray-200 bg-white shadow-2xs focus-within:border-[#1D6474] focus-within:ring-2 focus-within:ring-[#1D6474]/10 transition-all flex flex-col",
          isFullscreen ? "flex-1 border-0 shadow-none ring-0" : "overflow-hidden"
        )}
      >
        {/* Rich Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 bg-gray-50/90 p-2 text-gray-700 select-none">
          {/* 1. Readymade Design Templates Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setTemplateMenuOpen(!templateMenuOpen);
                setListMenuOpen(false);
                setColorMenuOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#1D6474]/10 hover:bg-[#1D6474]/20 text-[#1D6474] px-2.5 py-1 text-xs font-black border border-teal-200/80 transition-all shadow-2xs cursor-pointer"
              title="Insert Ready-made Product Design Blocks"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#1D6474]" />
              <span>{isBn ? " " : "Templates"}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Templates Popover */}
            {templateMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-40 w-72 rounded-2xl bg-white border border-gray-200 p-2 shadow-2xl space-y-1 animate-in fade-in zoom-in-95">
                <span className="text-[10px] font-black uppercase text-gray-400 px-2 py-1 block">
                  {isBn ? "    " : "Select Pre-Built Block"}
                </span>

                <button
                  type="button"
                  onClick={() => insertTemplateBlock("benefits_card")}
                  className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 text-gray-800 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <span className="p-1 rounded-lg bg-teal-100/70 text-[#1D6474]">✨</span>
                  <div>
                    <span className="block font-bold">{isBn ? "   " : "Key Benefits Grid"}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{isBn ? "4-items   " : "4-item styled benefits card"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => insertTemplateBlock("pro_tip")}
                  className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 text-gray-800 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <span className="p-1 rounded-lg bg-amber-100 text-amber-700">💡</span>
                  <div>
                    <span className="block font-bold">{isBn ? "items -items " : "Beauty Pro-Tip Box"}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{isBn ? "  " : "Gradient callout alert"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => insertTemplateBlock("spec_table")}
                  className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 text-gray-800 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <span className="p-1 rounded-lg bg-blue-100 text-blue-700">📊</span>
                  <div>
                    <span className="block font-bold">{isBn ? "   " : "Product Specs Table"}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{isBn ? "  " : "Responsive specifications table"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => insertTemplateBlock("guarantee_banner")}
                  className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 text-gray-800 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">🛡️</span>
                  <div>
                    <span className="block font-bold">{isBn ? "100% Authentic  items " : "100% Original Guarantee"}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{isBn ? "   " : "Trust badge & guarantee banner"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => insertTemplateBlock("caution_alert")}
                  className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 text-gray-800 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <span className="p-1 rounded-lg bg-amber-100 text-amber-700">⚠️</span>
                  <div>
                    <span className="block font-bold">{isBn ? " Test   items" : "Safety & Patch Test Box"}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{isBn ? "use " : "Advisory alert box"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => insertTemplateBlock("faq_box")}
                  className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 text-gray-800 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <span className="p-1 rounded-lg bg-purple-100 text-purple-700">❓</span>
                  <div>
                    <span className="block font-bold">{isBn ? " Q&A (FAQ)" : "Product Q&A / FAQ"}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{isBn ? "Question  Answer  " : "Q&A accordion style block"}</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 2. Readymade List Styles Dropdown Button */}
          <div className="relative border-r border-gray-200 pr-1 mr-0.5">
            <button
              type="button"
              onClick={() => {
                setListMenuOpen(!listMenuOpen);
                setTemplateMenuOpen(false);
                setColorMenuOpen(false);
              }}
              className="flex items-center gap-1 rounded-xl bg-white hover:bg-gray-100 text-gray-800 px-2 py-1 text-xs font-bold border border-gray-200 transition-colors shadow-2xs cursor-pointer"
              title="Choose Bullet, Number, or Checkbox List Styles"
            >
              <ListChecks className="h-3.5 w-3.5 text-emerald-600" />
              <span>{isBn ? " :00" : "Lists"}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* List Styles Popover */}
            {listMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-40 w-64 rounded-2xl bg-white border border-gray-200 p-2 shadow-2xl space-y-1 animate-in fade-in zoom-in-95">
                <span className="text-[10px] font-black uppercase text-gray-400 px-2 py-1 block">
                  {isBn ? "   :00  " : "Select List Format"}
                </span>

                <button
                  type="button"
                  onClick={() => insertListStyle("checkmark")}
                  className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 text-gray-800 text-xs font-bold flex items-center gap-2"
                >
                  <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center shrink-0">✓</span>
                  <div>
                    <span className="block font-bold">{isBn ? " items " : "Checkmark List"}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{isBn ? "   for " : "Ideal for benefits & perks"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => insertListStyle("checkbox")}
                  className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 text-gray-800 text-xs font-bold flex items-center gap-2"
                >
                  <CheckSquare className="h-4 w-4 text-[#1D6474] shrink-0" />
                  <div>
                    <span className="block font-bold">{isBn ? "box  :00" : "Checkbox Style"}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{isBn ? " box box" : "Modern checkbox style items"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => insertListStyle("step_pills")}
                  className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 text-gray-800 text-xs font-bold flex items-center gap-2"
                >
                  <span className="h-5 w-5 rounded-full bg-teal-100/70 text-[#1D6474] text-xs font-black flex items-center justify-center shrink-0">#1</span>
                  <div>
                    <span className="block font-bold">{isBn ? "  Number  (#1, #2)" : "Numbered Step Cards"}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{isBn ? "use for " : "Step 1, Step 2, Step 3"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => insertListStyle("stars")}
                  className="w-full text-left p-2 rounded-xl hover:bg-amber-50 text-gray-800 text-xs font-bold flex items-center gap-2"
                >
                  <span className="text-amber-500 text-sm">✨</span>
                  <div>
                    <span className="block font-bold">{isBn ? ":00 /  " : "Sparkle & Star Bullet"}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{isBn ? "  " : "Highlighting star bullet points"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => insertListStyle("unordered")}
                  className="w-full text-left p-2 rounded-xl hover:bg-gray-100 text-gray-800 text-xs font-bold flex items-center gap-2"
                >
                  <List className="h-4 w-4 text-gray-600 shrink-0" />
                  <div>
                    <span className="block font-bold">{isBn ? "   (•)" : "Standard Bullet List (•)"}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => insertListStyle("ordered")}
                  className="w-full text-left p-2 rounded-xl hover:bg-gray-100 text-gray-800 text-xs font-bold flex items-center gap-2"
                >
                  <ListOrdered className="h-4 w-4 text-gray-600 shrink-0" />
                  <div>
                    <span className="block font-bold">{isBn ? "   (1, 2, 3)" : "Standard Numbered List (1, 2, 3)"}</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 3. Headings */}
          <div className="flex items-center border-r border-gray-200 pr-1 mr-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => execCommand("formatBlock", "<h2>")}
              title="Heading 2"
              className="rounded-lg p-1.5 text-xs font-black hover:bg-white hover:text-[#1D6474] transition-colors"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => execCommand("formatBlock", "<h3>")}
              title="Heading 3"
              className="rounded-lg p-1.5 text-xs font-bold hover:bg-white hover:text-[#1D6474] transition-colors"
            >
              H3
            </button>
            <button
              type="button"
              onClick={() => execCommand("formatBlock", "<p>")}
              title="Normal Paragraph"
              className="rounded-lg p-1.5 text-xs font-medium hover:bg-white hover:text-[#1D6474] transition-colors"
            >
              P
            </button>
          </div>

          {/* 4. Text Styles (B, I, U, S) */}
          <div className="flex items-center border-r border-gray-200 pr-1 mr-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => execCommand("bold")}
              title="Bold (Ctrl+B)"
              className={cn(
                "rounded-lg p-1.5 hover:bg-white transition-colors",
                activeFormats.bold ? "bg-teal-100/70 text-[#1D6474]" : "hover:text-[#1D6474]"
              )}
            >
              <Bold className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => execCommand("italic")}
              title="Italic (Ctrl+I)"
              className={cn(
                "rounded-lg p-1.5 hover:bg-white transition-colors",
                activeFormats.italic ? "bg-teal-100/70 text-[#1D6474]" : "hover:text-[#1D6474]"
              )}
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand("underline")}
              title="Underline (Ctrl+U)"
              className={cn(
                "rounded-lg p-1.5 hover:bg-white transition-colors",
                activeFormats.underline ? "bg-teal-100/70 text-[#1D6474]" : "hover:text-[#1D6474]"
              )}
            >
              <Underline className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand("strikeThrough")}
              title="Strikethrough"
              className={cn(
                "rounded-lg p-1.5 hover:bg-white transition-colors",
                activeFormats.strikeThrough ? "bg-teal-100/70 text-[#1D6474]" : "hover:text-[#1D6474]"
              )}
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 5. Alignment */}
          <div className="flex items-center border-r border-gray-200 pr-1 mr-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => execCommand("justifyLeft")}
              title="Align Left"
              className={cn("rounded-lg p-1.5 hover:bg-white transition-colors", activeFormats.justifyLeft ? "bg-teal-100/70 text-[#1D6474]" : "")}
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand("justifyCenter")}
              title="Align Center"
              className={cn("rounded-lg p-1.5 hover:bg-white transition-colors", activeFormats.justifyCenter ? "bg-teal-100/70 text-[#1D6474]" : "")}
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand("justifyRight")}
              title="Align Right"
              className={cn("rounded-lg p-1.5 hover:bg-white transition-colors", activeFormats.justifyRight ? "bg-teal-100/70 text-[#1D6474]" : "")}
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 6. Media & Links (Advanced Image Inserter) */}
          <div className="flex items-center border-r border-gray-200 pr-1 mr-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setImageModalOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-white hover:bg-teal-50/60 hover:text-[#1D6474] px-2 py-1 text-xs font-bold text-gray-800 border border-gray-200 shadow-2xs transition-colors cursor-pointer"
              title="Upload Image from Device or Select from Website"
            >
              <ImageIcon className="h-3.5 w-3.5 text-[#1D6474]" />
              <span>{isBn ? " / " : "Image"}</span>
            </button>

            <button
              type="button"
              onClick={() => setLinkModalOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-white hover:bg-blue-50 hover:text-blue-700 px-2 py-1 text-xs font-bold text-gray-800 border border-gray-200 shadow-2xs transition-colors cursor-pointer"
              title="Insert Link"
            >
              <LinkIcon className="h-3.5 w-3.5 text-blue-600" />
              <span>{isBn ? "Link" : "Link"}</span>
            </button>
          </div>

          {/* 7. Quote, Divider & Clear */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => execCommand("formatBlock", "<blockquote>")}
              title="Quote Block"
              className="rounded-lg p-1.5 hover:bg-white hover:text-[#1D6474] transition-colors"
            >
              <Quote className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand("insertHorizontalRule")}
              title="Horizontal Divider"
              className="rounded-lg p-1.5 hover:bg-white hover:text-[#1D6474] transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand("removeFormat")}
              title="Clear Formatting"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-red-500 transition-colors"
            >
              <RemoveFormatting className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 8. Right Mode Toggle & Fullscreen */}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => execCommand("undo")}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
            >
              <Undo className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand("redo")}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
            >
              <Redo className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsHtmlMode(!isHtmlMode)}
              className="text-[10px] font-mono font-bold text-gray-500 hover:text-[#1D6474] px-2 py-0.5 rounded-lg border border-gray-200 bg-white"
            >
              {isHtmlMode ? "Visual View" : "</> HTML"}
            </button>
          </div>
        </div>

        {/* Editor Body */}
        {isHtmlMode ? (
          <div className="relative bg-zinc-950 flex-1">
            <div className="absolute right-3 top-3 rounded-lg bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400 z-10">
              HTML SOURCE MODE
            </div>
            <textarea
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="<p>Enter raw HTML markup here...</p>"
              style={{ minHeight: isFullscreen ? "100%" : minHeight }}
              className="w-full h-full bg-zinc-950 p-4 font-mono text-xs text-emerald-400 focus:outline-none resize-y leading-relaxed"
            />
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyUp={checkActiveFormats}
            onMouseUp={checkActiveFormats}
            style={{ minHeight: isFullscreen ? "calc(100vh - 120px)" : minHeight }}
            data-placeholder={placeholder}
            className={cn(
              "prose prose-sm prose-pink max-w-none p-4 sm:p-5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-0 overflow-y-auto leading-relaxed flex-1",
              "empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none",
              "[&_h1]:text-xl [&_h1]:font-black [&_h1]:text-gray-900 [&_h1]:mb-2",
              "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mb-2",
              "[&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mb-1.5",
              "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2",
              "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2",
              "[&_li]:mb-1",
              "[&_img]:rounded-2xl [&_img]:my-3 [&_img]:max-w-full [&_img]:border [&_img]:border-gray-200/90 [&_img]:shadow-sm",
              "[&_blockquote]:border-l-4 [&_blockquote]:border-[#1D6474] [&_blockquote]:pl-3.5 [&_blockquote]:italic [&_blockquote]:my-3 [&_blockquote]:text-gray-600",
              "[&_a]:text-[#1D6474] [&_a]:underline [&_a]:font-bold",
              "[&_table]:w-full [&_table]:border-collapse [&_table]:my-3",
              "[&_th]:border [&_th]:border-gray-200 [&_th]:p-2 [&_th]:bg-gray-50 [&_th]:font-bold",
              "[&_td]:border [&_td]:border-gray-200 [&_td]:p-2"
            )}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADVANCED MULTI-SOURCE IMAGE INSERTER MODAL                                */}
      {/* ========================================================================= */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50/60 rounded-2xl text-[#1D6474] border border-teal-100">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-gray-900">
                    {isBn ? " /  added " : "Insert Image into Content"}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    {isBn ? " from     from  " : "Upload from device or select from website library"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs (Upload vs Library vs URL) */}
            <div className="flex items-center rounded-2xl bg-gray-100 p-1 text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => setImageTab("upload")}
                className={cn(
                  "flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  imageTab === "upload" ? "bg-white text-[#1D6474] shadow-xs" : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{isBn ? " from " : "Upload from Device"}</span>
              </button>
              <button
                type="button"
                onClick={() => setImageTab("library")}
                className={cn(
                  "flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  imageTab === "library" ? "bg-white text-[#1D6474] shadow-xs" : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{isBn ? " " : "Store Library"}</span>
              </button>
              <button
                type="button"
                onClick={() => setImageTab("url")}
                className={cn(
                  "flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  imageTab === "url" ? "bg-white text-[#1D6474] shadow-xs" : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{isBn ? " Link (URL)" : "Image URL"}</span>
              </button>
            </div>

            {/* TAB 1: UPLOAD FROM DEVICE */}
            {imageTab === "upload" && (
              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-[#1D6474] rounded-3xl p-6 bg-gray-50/60 hover:bg-teal-50/60/20 cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2 text-gray-500 py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-[#1D6474]" />
                      <span className="text-xs font-bold">{isBn ? "  ..." : "Uploading image..."}</span>
                    </div>
                  ) : uploadedPreviewUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={uploadedPreviewUrl}
                        alt="Uploaded preview"
                        className="max-h-40 rounded-2xl border border-gray-200 object-cover shadow-sm"
                      />
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> {isBn ? "permanently  Completed successfully" : "Upload Complete"}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">{isBn ? "     " : "Click to replace file"}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="p-3 bg-teal-100/70/70 text-[#1D6474] rounded-2xl">
                        <Upload className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-black text-gray-800">
                        {isBn ? "       " : "Click to choose image or drag & drop"}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">
                        JPG, PNG, WebP, GIF, SVG ( 15 )
                      </span>
                    </div>
                  )}
                </label>
              </div>
            )}

            {/* TAB 2: SELECT FROM WEBSITE GALLERY */}
            {imageTab === "library" && (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={gallerySearch}
                    onChange={(e) => {
                      setGallerySearch(e.target.value);
                      loadGalleryImages(e.target.value);
                    }}
                    placeholder={isBn ? "  Search..." : "Search store gallery images..."}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1D6474]/10 focus:border-[#1D6474]"
                  />
                </div>

                {/* Gallery Grid */}
                <div className="max-h-56 overflow-y-auto border border-gray-200/80 rounded-2xl p-2 bg-gray-50/50">
                  {galleryLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                      <Loader2 className="h-6 w-6 animate-spin text-[#1D6474]" />
                      <span className="text-xs font-bold">{isBn ? "  ..." : "Loading store media..."}</span>
                    </div>
                  ) : galleryImages.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {galleryImages.map((img) => {
                        const isSelected = selectedGalleryUrl === img.url;
                        return (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => {
                              setSelectedGalleryUrl(img.url);
                              setImageAltInput(img.title || "Product image");
                            }}
                            className={cn(
                              "relative group rounded-xl overflow-hidden border-2 transition-all aspect-square bg-white shadow-2xs cursor-pointer",
                              isSelected ? "border-[#1D6474] ring-2 ring-[#1D6474]/20" : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <img
                              src={img.url}
                              alt={img.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#1D6474]/20 flex items-center justify-center">
                                <span className="h-6 w-6 rounded-full bg-[#1D6474] text-white flex items-center justify-center font-bold text-xs shadow-md">
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-gray-400 text-xs">
                      {isBn ? "   Tracking।" : "No images found in store library."}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ENTER URL */}
            {imageTab === "url" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    {isBn ? " Link / :" : "Image Source URL:"}
                  </label>
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/... or https://..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1D6474]/10 focus:border-[#1D6474]"
                  />
                </div>
                {imageUrlInput.trim() && (
                  <div className="flex justify-center p-2 bg-gray-50 rounded-2xl border border-gray-200">
                    <img
                      src={imageUrlInput.trim()}
                      alt="URL preview"
                      className="max-h-36 rounded-xl object-contain"
                      onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Common Image Settings (Alt text, Caption, Alignment) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {isBn ? " Description (Alt Text):" : "Image Alt Text (SEO):"}
                </label>
                <input
                  type="text"
                  value={imageAltInput}
                  onChange={(e) => setImageAltInput(e.target.value)}
                  placeholder={isBn ? "Products Name  " : "Product or texture description"}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1D6474]/10 focus:border-[#1D6474]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {isBn ? "   ():" : "Image Caption (Optional):"}
                </label>
                <input
                  type="text"
                  value={imageCaptionInput}
                  onChange={(e) => setImageCaptionInput(e.target.value)}
                  placeholder={isBn ? "e.g.: use ..." : "e.g. 7-Day visible texture result"}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1D6474]/10 focus:border-[#1D6474]"
                />
              </div>
            </div>

            {/* Image Alignment Selector */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="font-bold text-gray-700">{isBn ? "  / Size:" : "Alignment & Display:"}</span>
              <div className="flex items-center rounded-xl bg-gray-100 p-0.5 font-bold text-[11px]">
                <button
                  type="button"
                  onClick={() => setImageAlignment("center")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all",
                    imageAlignment === "center" ? "bg-white text-[#1D6474] shadow-xs" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {isBn ? " (Center)" : "Center"}
                </button>
                <button
                  type="button"
                  onClick={() => setImageAlignment("full")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all",
                    imageAlignment === "full" ? "bg-white text-[#1D6474] shadow-xs" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {isBn ? "  (Full)" : "Full Width"}
                </button>
                <button
                  type="button"
                  onClick={() => setImageAlignment("left")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all",
                    imageAlignment === "left" ? "bg-white text-[#1D6474] shadow-xs" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {isBn ? " (Left)" : "Float Left"}
                </button>
                <button
                  type="button"
                  onClick={() => setImageAlignment("right")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all",
                    imageAlignment === "right" ? "bg-white text-[#1D6474] shadow-xs" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {isBn ? " (Right)" : "Float Right"}
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {isBn ? "Cancel" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmInsertImage}
                disabled={
                  (imageTab === "upload" && !uploadedPreviewUrl) ||
                  (imageTab === "library" && !selectedGalleryUrl) ||
                  (imageTab === "url" && !imageUrlInput.trim())
                }
                className="px-5 py-2 rounded-xl bg-[#1D6474] hover:bg-[#164E63] text-white text-xs font-black shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>{isBn ? "  " : "Insert Image"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HYPERLINK INSERTER MODAL                                                  */}
      {/* ========================================================================= */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-md p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900">{isBn ? "Link added " : "Insert Hyperlink"}</h4>
                  <p className="text-xs text-gray-500 font-medium">{isBn ? "  Products " : "Web destination URL"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">{isBn ? "Link :" : "Destination URL:"}</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://... or /products/..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">{isBn ? "Link  ():" : "Link Display Text (Optional):"}</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder={isBn ? "e.g.: Complete Catalog View" : "e.g. View full catalog"}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 pt-1">
                <input
                  type="checkbox"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span>{isBn ? "    (Open in new tab)" : "Open in new browser tab"}</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {isBn ? "Cancel" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmInsertLink}
                disabled={!linkUrl.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {isBn ? "Link  " : "Insert Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
