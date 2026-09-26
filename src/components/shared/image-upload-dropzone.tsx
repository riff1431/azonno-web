"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  X,
  Image as ImageIcon,
  Loader2,
  Check,
  Link as LinkIcon,
  RefreshCw,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { cn } from "@/lib/utils";

export interface ImageUploadDropzoneProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  previewShape?: "circle" | "rounded" | "banner";
  aspectRatio?: "square" | "banner" | "auto";
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function ImageUploadDropzone({
  value,
  onChange,
  folder = "general",
  label,
  description,
  placeholder = "https://images.unsplash.com/...",
  previewShape = "rounded",
  aspectRatio = "square",
  required = false,
  className,
  disabled = false,
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    // Validate format
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please drop a valid image file (JPG, PNG, WebP, SVG, AVIF).");
      return;
    }

    // 15MB limit
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("File is too large. Maximum allowed size is 15MB.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error || !data.url) {
        throw new Error(data.error || "Failed to upload image.");
      }

      onChange(data.url);
    } catch (err: any) {
      console.error("[ImageUploadDropzone Error]:", err);
      setErrorMessage(err.message || "Upload failed. Please try again or paste URL.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setErrorMessage(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label and Mode Switcher */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] font-bold text-[#1D6474] hover:underline flex items-center gap-1"
          >
            {showUrlInput ? (
              <>
                <UploadCloud className="h-3 w-3" /> Drag &amp; Drop Mode
              </>
            ) : (
              <>
                <LinkIcon className="h-3 w-3" /> Paste Image URL
              </>
            )}
          </button>
        </div>
      )}

      {description && (
        <p className="text-[11px] text-gray-500">{description}</p>
      )}

      {/* Mode A: Direct URL Input */}
      {showUrlInput ? (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="url"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1D6474] shadow-2xs pr-8"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {value && (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-200">
              <img
                src={value}
                alt="Preview"
                className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="text-xs text-gray-600 truncate flex-1 font-mono">{value}</span>
            </div>
          )}
        </div>
      ) : (
        /* Mode B: Drag & Drop Area */
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {value ? (
            /* Active Image Preview Card */
            <div
              className={cn(
                "relative group overflow-hidden border-2 border-gray-200 bg-gray-50/50 transition-all hover:border-[#1D6474]/60 shadow-2xs",
                previewShape === "circle"
                  ? "h-32 w-32 rounded-full mx-auto"
                  : previewShape === "banner"
                  ? "w-full h-44 rounded-2xl"
                  : "w-full max-w-sm h-48 rounded-2xl"
              )}
            >
              <img
                src={value}
                alt="Uploaded photo"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Hover Actions Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/90 hover:bg-white text-gray-900 border-none font-bold text-xs rounded-xl shadow-md h-8 px-3"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRemove}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md h-8 px-3"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Remove
                </Button>
              </div>

              {/* Success Badge */}
              <div className="absolute bottom-2 left-2 rounded-full bg-emerald-500/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-black text-white flex items-center gap-1 shadow-xs">
                <Check className="h-3 w-3" /> Ready
              </div>
            </div>
          ) : (
            /* Empty Dropzone Card */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 text-center",
                isDragging
                  ? "border-[#1D6474] bg-teal-50/60/70 scale-[0.99] shadow-sm"
                  : "border-gray-300 bg-gray-50/60 hover:bg-teal-50/60/30 hover:border-[#1D6474]/60",
                previewShape === "circle" ? "h-36 w-36 rounded-full mx-auto" : "w-full",
                previewShape === "banner" ? "min-h-35" : "min-h-30"
              )}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1D6474]" />
                  <p className="text-xs font-black text-[#1D6474]">Uploading Image...</p>
                  <span className="text-[10px] text-gray-500">Optimizing &amp; storing...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100/70 text-[#1D6474] shadow-2xs">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      <span className="text-[#1D6474] hover:underline">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      JPG, PNG, WebP or SVG (up to 15MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
