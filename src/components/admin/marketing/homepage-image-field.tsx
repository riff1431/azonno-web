"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  X,
  Image as ImageIcon,
  Loader2,
  Link as LinkIcon,
  Trash2,
  Sparkles,
  Info,
  Check,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { cn } from "@/lib/utils";

export interface HomepageImageFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  recommendedSize?: string;
  aspectRatioLabel?: string;
  folder?: string;
  placeholder?: string;
  className?: string;
  previewHeightClass?: string;
}

export function HomepageImageField({
  value,
  onChange,
  label = "Banner Image",
  recommendedSize = "600 x 600 px",
  aspectRatioLabel = "1:1 Square",
  folder = "homepage",
  placeholder = "https://...",
  className,
  previewHeightClass = "h-14 w-14",
}: HomepageImageFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPG, PNG, WebP, SVG, AVIF).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("Image file exceeds the 15MB upload limit.");
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
      setErrorMessage(err.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Label and Recommended Size Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
          <ImageIcon className="h-3 w-3 text-[#1D6474]" />
          {label}
        </label>

        <div className="flex items-center gap-1.5">
          {recommendedSize && (
            <span
              className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50/60 text-[#1D6474] border border-teal-200 shadow-2xs"
              title={`Recommended Resolution: ${recommendedSize} (${aspectRatioLabel})`}
            >
              <Info className="h-2.5 w-2.5" />
              <span>{recommendedSize}</span>
              {aspectRatioLabel && <span className="opacity-70">({aspectRatioLabel})</span>}
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[10px] font-bold text-gray-500 hover:text-gray-900 underline ml-1"
          >
            {showUrlInput ? "Upload File" : "Paste URL"}
          </button>
        </div>
      </div>

      {/* Upload Controls / URL Input */}
      {showUrlInput ? (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#1D6474]"
          />
          {value && (
            <div className="relative group shrink-0">
              <img
                src={value}
                alt="Preview"
                className={cn("object-cover rounded-lg border border-gray-200 shadow-2xs", previewHeightClass)}
              />
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {/* Direct File Picker Dropzone Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUploadFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl border border-dashed transition-all cursor-pointer select-none text-xs",
              isDragging
                ? "border-[#1D6474] bg-teal-50/60 text-[#1D6474]"
                : "border-gray-300 bg-gray-50/70 hover:bg-gray-100/80 text-gray-600",
              isUploading && "pointer-events-none opacity-60"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1D6474] shrink-0" />
              ) : (
                <UploadCloud className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              )}
              <span className="truncate font-medium text-[11px]">
                {isUploading
                  ? "Uploading to CDN..."
                  : value
                  ? value.split("/").pop() || "Image Selected"
                  : "Click or Drop Image to Upload"}
              </span>
            </div>

            <span className="text-[10px] font-bold text-gray-400 shrink-0 uppercase tracking-wider ml-2">
              Browse
            </span>
          </div>

          {/* Thumbnail Preview */}
          {value && (
            <div className="relative group shrink-0">
              <img
                src={value}
                alt="Preview"
                className={cn("object-cover rounded-lg border border-gray-200 shadow-2xs", previewHeightClass)}
              />
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Feedback */}
      {errorMessage && (
        <p className="text-[10px] font-bold text-red-600 animate-in fade-in-0">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
