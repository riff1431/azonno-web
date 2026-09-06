"use client";

import { useState } from "react";
import {
  Printer,
  Save,
  CheckCircle2,
  Building,
  FileText,
  Tag,
  Sliders,
  RotateCcw,
  QrCode,
  Eye,
} from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { Button } from "@/components/shared/ui/button";
import { saveInvoiceSettings, type InvoiceSettings } from "@/features/settings/actions";
import { ImageUploadDropzone } from "@/components/shared/image-upload-dropzone";
import { useAdminLang } from "@/lib/admin-lang-context";

interface InvoiceSettingsClientProps {
  initialSettings: InvoiceSettings;
}

export function InvoiceSettingsClient({ initialSettings }: InvoiceSettingsClientProps) {
  const { t } = useAdminLang();
  const [formData, setFormData] = useState<InvoiceSettings>({
    ...initialSettings,
  });

  const [activeTab, setActiveTab] = useState<"brand" | "invoice" | "thermal" | "defaults">("brand");
  const [previewMode, setPreviewMode] = useState<"invoice" | "thermal">("invoice");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const updateField = (field: keyof InvoiceSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetDefaults = () => {
    if (confirm("Reset all invoice and thermal settings to recommended defaults?")) {
      setFormData({
        invoice_logo_url: "",
        invoice_brand_name: "BLUSH & BUDGET",
        invoice_tagline: "AUTHENTIC BEAUTY & SKINCARE ESSENTIALS",
        invoice_address: "House 42, Road 11, Banani, Dhaka-1213, Bangladesh",
        invoice_email: "",
        invoice_website: typeof window !== "undefined" && window.location?.origin ? window.location.origin : "",
        invoice_tax_id_or_bin: "BIN: 002349182-0101",

        invoice_title: "TAX INVOICE",
        invoice_accent_color: "#e91e63",
        invoice_footer_notes:
          "Thank you for choosing us! All products are 100% genuine and imported directly from verified authorized distributors. For any warranty claims or return assistance, please keep this invoice handy.",
        invoice_authorized_signatory_text: "Authorized Signature",
        invoice_signature_image_url: "",
        invoice_show_qr_code: true,
        invoice_show_barcode: true,
        invoice_show_paid_stamp: true,

        thermal_logo_url: "",
        thermal_header_title: "BLUSH & BUDGET • DISPATCH",
        thermal_return_address: "House 42, Road 11, Banani, Dhaka",
        thermal_sender_phone: "+880 1700-000000",
        thermal_show_item_breakdown: true,
        thermal_show_item_prices: true,
        thermal_instructions:
          "FRAGILE / HANDLE WITH CARE • Please inspect the parcel package before accepting handover.",
        thermal_footer_tagline: "100% Genuine Guaranteed Imports",

        default_print_mode: "invoice",
        default_language: "en",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      await saveInvoiceSettings(formData);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err) {
      console.error("Failed to save invoice settings:", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <ModuleHeader
          title={t("invoice_settings_title")}
          description={t("invoice_settings_desc")}
          icon={Printer}
          isCore
        />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="text-xs font-semibold"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset Defaults
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? t("saving_changes_btn") : t("save_invoice_btn")}
          </Button>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 animate-in fade-in-0">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{t("store_settings_success")}</span>
        </div>
      )}

      {/* Main Grid: Form Controls + Live Interactive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls & Tabs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab("brand");
                setPreviewMode("invoice");
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "brand"
                  ? "bg-white text-primary-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              <span>Branding</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("invoice");
                setPreviewMode("invoice");
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "invoice"
                  ? "bg-white text-primary-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>A4 Invoice</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("thermal");
                setPreviewMode("thermal");
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "thermal"
                  ? "bg-white text-primary-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>4×6 Thermal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("defaults")}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "defaults"
                  ? "bg-white text-primary-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Defaults</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. BRANDING & CONTACT INFO TAB */}
            {activeTab === "brand" && (
              <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-4">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary-600" />
                  Company Identity & Letterhead
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-text mb-1">
                      Custom Invoice Logo URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://your-domain.com/logo.png"
                        value={formData.invoice_logo_url || ""}
                        onChange={(e) => updateField("invoice_logo_url", e.target.value)}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">
                      Leave empty to automatically use your store's default header logo.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-text mb-1">Brand / Store Name</label>
                      <input
                        type="text"
                        value={formData.invoice_brand_name || ""}
                        onChange={(e) => updateField("invoice_brand_name", e.target.value)}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-text mb-1">BIN / Trade License / Tax ID</label>
                      <input
                        type="text"
                        placeholder="BIN: 002349182-0101"
                        value={formData.invoice_tax_id_or_bin || ""}
                        onChange={(e) => updateField("invoice_tax_id_or_bin", e.target.value)}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">Tagline / Subtitle</label>
                    <input
                      type="text"
                      value={formData.invoice_tagline || ""}
                      onChange={(e) => updateField("invoice_tagline", e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">Registered Physical Address</label>
                    <textarea
                      rows={2}
                      value={formData.invoice_address || ""}
                      onChange={(e) => updateField("invoice_address", e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block font-bold text-text mb-1">Support Phone</label>
                      <input
                        type="text"
                        value={formData.invoice_phone || ""}
                        onChange={(e) => updateField("invoice_phone", e.target.value)}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-text mb-1">Support Email</label>
                      <input
                        type="email"
                        value={formData.invoice_email || ""}
                        onChange={(e) => updateField("invoice_email", e.target.value)}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-text mb-1">Official Website</label>
                      <input
                        type="text"
                        value={formData.invoice_website || ""}
                        onChange={(e) => updateField("invoice_website", e.target.value)}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. A4 TAX INVOICE TAB */}
            {activeTab === "invoice" && (
              <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-4">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary-600" />
                  A4 Tax Invoice Layout & Content
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-text mb-1">Invoice Header Title</label>
                      <input
                        type="text"
                        value={formData.invoice_title || ""}
                        onChange={(e) => updateField("invoice_title", e.target.value)}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-text mb-1">Invoice Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.invoice_accent_color || "#e91e63"}
                          onChange={(e) => updateField("invoice_accent_color", e.target.value)}
                          className="h-9 w-12 rounded-lg border border-border cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={formData.invoice_accent_color || "#e91e63"}
                          onChange={(e) => updateField("invoice_accent_color", e.target.value)}
                          className="flex-1 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Terms, Return Policy & Footer Notes
                    </label>
                    <textarea
                      rows={3}
                      value={formData.invoice_footer_notes || ""}
                      onChange={(e) => updateField("invoice_footer_notes", e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-text mb-1">
                        Authorized Signatory Title
                      </label>
                      <input
                        type="text"
                        value={formData.invoice_authorized_signatory_text || ""}
                        onChange={(e) => updateField("invoice_authorized_signatory_text", e.target.value)}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                      />
                    </div>
                    <ImageUploadDropzone
                      label="Digital Signature Image"
                      description="Upload PNG transparent signature for invoice printouts"
                      value={formData.invoice_signature_image_url || ""}
                      onChange={(url) => updateField("invoice_signature_image_url", url)}
                      folder="invoices"
                      previewShape="rounded"
                    />
                  </div>

                  {/* Toggle Features */}
                  <div className="pt-2 border-t border-border space-y-2.5">
                    <span className="font-bold text-text block mb-1">Invoice Feature Toggles</span>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.invoice_show_qr_code !== false}
                        onChange={(e) => updateField("invoice_show_qr_code", e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-medium text-text">
                        Show Live Order Tracking QR Code on Invoice
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.invoice_show_barcode !== false}
                        onChange={(e) => updateField("invoice_show_barcode", e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-medium text-text">
                        Show Scannable Barcode on Invoice Top Header
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.invoice_show_paid_stamp !== false}
                        onChange={(e) => updateField("invoice_show_paid_stamp", e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-medium text-text">
                        Show Payment Status Watermark Badge (e.g. PAID / COD)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 3. 4x6 THERMAL LABEL TAB */}
            {activeTab === "thermal" && (
              <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-4">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary-600" />
                  4×6 POS Thermal Shipping Label Customization
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-text mb-1">
                        Thermal Header Top Banner Text
                      </label>
                      <input
                        type="text"
                        value={formData.thermal_header_title || ""}
                        onChange={(e) => updateField("thermal_header_title", e.target.value)}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-text mb-1">
                        Thermal Return / Sender Phone
                      </label>
                      <input
                        type="text"
                        value={formData.thermal_sender_phone || ""}
                        onChange={(e) => updateField("thermal_sender_phone", e.target.value)}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Return / Shipper Address (Printed on Thermal Label)
                    </label>
                    <input
                      type="text"
                      value={formData.thermal_return_address || ""}
                      onChange={(e) => updateField("thermal_return_address", e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Courier Handling Instructions & Caution Notice
                    </label>
                    <textarea
                      rows={2}
                      value={formData.thermal_instructions || ""}
                      onChange={(e) => updateField("thermal_instructions", e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Thermal Footer Assurance Tagline
                    </label>
                    <input
                      type="text"
                      value={formData.thermal_footer_tagline || ""}
                      onChange={(e) => updateField("thermal_footer_tagline", e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                    />
                  </div>

                  {/* Thermal Toggles */}
                  <div className="pt-2 border-t border-border space-y-2.5">
                    <span className="font-bold text-text block mb-1">Thermal Label Toggles</span>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.thermal_show_item_breakdown !== false}
                        onChange={(e) => updateField("thermal_show_item_breakdown", e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-medium text-text">
                        Print Itemized Products & Quantities on Thermal Slip
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.thermal_show_item_prices !== false}
                        onChange={(e) => updateField("thermal_show_item_prices", e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-medium text-text">
                        Show Total Collectible Amount (COD) in Bold on Thermal Slip
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 4. DEFAULTS & PREFERENCES TAB */}
            {activeTab === "defaults" && (
              <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-4">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary-600" />
                  Default Print Preferences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-text mb-1">
                      Default Print Template
                    </label>
                    <select
                      value={formData.default_print_mode || "invoice"}
                      onChange={(e) => {
                        updateField("default_print_mode", e.target.value);
                        setPreviewMode(e.target.value as any);
                      }}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                    >
                      <option value="invoice">Corporate A4 Tax Invoice</option>
                      <option value="thermal">4×6 Inch POS Thermal Shipping Label</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Default Language
                    </label>
                    <select
                      value={formData.default_language || "en"}
                      onChange={(e) => updateField("default_language", e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                    >
                      <option value="en">English (Default)</option>
                      <option value="bn">Bangla (বাংলা)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
              >
                <Save className="h-4 w-4 mr-1.5" />
                {saving ? t("saving_changes_btn") : t("save_invoice_btn")}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Interactive Preview Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between bg-white border border-border rounded-xl p-2.5 shadow-xs">
            <span className="text-xs font-extrabold text-text flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-primary-600" />
              Live Preview
            </span>
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setPreviewMode("invoice")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  previewMode === "invoice" ? "bg-white text-primary-600 shadow-2xs" : "text-gray-600"
                }`}
              >
                A4 Invoice
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("thermal")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  previewMode === "thermal" ? "bg-white text-primary-600 shadow-2xs" : "text-gray-600"
                }`}
              >
                4×6 Thermal
              </button>
            </div>
          </div>

          {/* PREVIEW CONTAINER */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-inner flex justify-center overflow-hidden">
            {previewMode === "invoice" ? (
              /* A4 Mini Preview */
              <div className="w-full max-w-85 bg-white rounded-lg border border-gray-300 shadow-md p-3.5 text-[9px] text-gray-800 space-y-3 font-sans scale-95 origin-top">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                  <div>
                    {formData.invoice_logo_url ? (
                      <img
                        src={formData.invoice_logo_url}
                        alt="Logo"
                        className="h-6 w-auto object-contain mb-0.5"
                      />
                    ) : (
                      <span className="font-black text-[11px] text-gray-900 tracking-wider block">
                        {formData.invoice_brand_name || "BLUSH & BUDGET"}
                      </span>
                    )}
                    <span className="text-[7.5px] font-bold text-gray-500 uppercase block">
                      {formData.invoice_tagline || "Authentic Skincare"}
                    </span>
                    <span className="text-[7px] text-gray-400 block truncate max-w-35">
                      {formData.invoice_address || "Banani, Dhaka"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className="font-black text-xs block uppercase"
                      style={{ color: formData.invoice_accent_color || "#e91e63" }}
                    >
                      {formData.invoice_title || "TAX INVOICE"}
                    </span>
                    <span className="font-mono text-[8px] font-bold text-gray-500">#ORD-2026-8941</span>
                  </div>
                </div>

                {/* Customer Box */}
                <div className="bg-gray-50 rounded p-2 border border-gray-200 flex justify-between items-center text-[7.5px]">
                  <div>
                    <span className="font-bold text-gray-400 block uppercase">INVOICE TO</span>
                    <span className="font-black text-gray-900">TANVIR HASAN</span>
                    <span className="text-gray-500 block">Dhanmondi 27, Dhaka</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-400 block uppercase">COURIER</span>
                    <span className="font-bold text-gray-800">STEADFAST</span>
                  </div>
                </div>

                {/* Sample Items Table */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-gray-500 border-b border-gray-200 pb-0.5 text-[7px] uppercase">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Total</span>
                  </div>
                  <div className="flex justify-between text-[8px] py-0.5">
                    <span className="truncate max-w-37.5">COSRX Snail Mucin 96% Power Essence</span>
                    <span className="font-mono">1</span>
                    <span className="font-bold">৳1,450</span>
                  </div>
                  <div className="flex justify-between text-[8px] py-0.5">
                    <span className="truncate max-w-37.5">Beauty of Joseon Sun Relief SPF50+</span>
                    <span className="font-mono">1</span>
                    <span className="font-bold">৳1,250</span>
                  </div>
                </div>

                {/* Totals & QR */}
                <div className="border-t border-gray-200 pt-2 flex justify-between items-end">
                  {formData.invoice_show_qr_code ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-9 w-9 bg-gray-900 text-white rounded p-0.5 flex items-center justify-center">
                        <QrCode className="h-7 w-7 text-white" />
                      </div>
                      <span className="text-[6.5px] text-gray-400 font-mono leading-tight">
                        Scan to<br />Track
                      </span>
                    </div>
                  ) : <div />}

                  <div className="text-right space-y-0.5">
                    <div className="text-[7.5px] text-gray-500">Subtotal: ৳2,700</div>
                    <div className="text-[7.5px] text-gray-500">Delivery: ৳60</div>
                    <div
                      className="font-black text-[10px] pt-0.5 border-t border-gray-200"
                      style={{ color: formData.invoice_accent_color || "#e91e63" }}
                    >
                      TOTAL: ৳2,760
                    </div>
                  </div>
                </div>

                {/* Footer Notes */}
                {formData.invoice_footer_notes && (
                  <div className="text-[6.5px] text-gray-400 border-t border-gray-100 pt-1 leading-tight line-clamp-2">
                    {formData.invoice_footer_notes}
                  </div>
                )}
              </div>
            ) : (
              /* 4x6 Thermal Mini Preview */
              <div className="w-full max-w-70 bg-white rounded border-2 border-black p-3 text-[8.5px] text-black space-y-2 font-mono scale-95 origin-top shadow-md">
                {/* Header */}
                <div className="border-b-2 border-black pb-1.5 text-center">
                  <div className="font-black text-[10px] tracking-wider uppercase">
                    {formData.thermal_header_title || "BLUSH & BUDGET • DISPATCH"}
                  </div>
                  <div className="text-[7px] font-bold text-gray-600 truncate">
                    From: {formData.thermal_return_address || "Banani, Dhaka"} • {formData.thermal_sender_phone}
                  </div>
                </div>

                {/* Recipient */}
                <div className="border-b-2 border-black pb-1.5">
                  <div className="text-[7px] font-bold text-gray-500 uppercase">SHIP TO / RECIPIENT:</div>
                  <div className="font-black text-[10px] uppercase">TANVIR HASAN</div>
                  <div className="text-[7.5px] leading-tight font-bold">
                    House 14, Road 7, Dhanmondi, Dhaka
                  </div>
                  <div className="font-bold text-[8px] pt-0.5">01700-112233</div>
                </div>

                {/* COD Big Box */}
                <div className="border-2 border-black rounded p-1.5 text-center bg-gray-50">
                  <span className="text-[7px] font-black uppercase tracking-wider block">
                    CASH ON DELIVERY (COD) DUE:
                  </span>
                  <span className="font-black text-sm block">৳2,760</span>
                </div>

                {/* Items */}
                {formData.thermal_show_item_breakdown && (
                  <div className="border-b-2 border-black pb-1 text-[7px] space-y-0.5">
                    <div className="font-bold uppercase flex justify-between">
                      <span>ITEMS (2 PCS)</span>
                      <span>0.5 KG</span>
                    </div>
                    <div className="truncate">• COSRX Snail Mucin x1</div>
                    <div className="truncate">• BOJ Sunscreen x1</div>
                  </div>
                )}

                {/* Instructions */}
                {formData.thermal_instructions && (
                  <div className="text-[6.5px] text-center font-bold text-gray-700 leading-tight">
                    {formData.thermal_instructions}
                  </div>
                )}

                {/* Barcode Mock */}
                <div className="pt-0.5 text-center">
                  <div className="h-6 w-full bg-linear-to-r from-black via-gray-400 to-black opacity-80 rounded-xs" />
                  <span className="text-[7px] font-bold tracking-widest block pt-0.5">
                    *BB-ORD-8941-SF*
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
