"use client";

import { useState } from "react";
import {
  PhoneCall,
  Save,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Eye,
  Send,
  MessageSquare,
  Check,
  Tag,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { Button } from "@/components/shared/ui/button";
import {
  saveWhatsAppTemplates,
  resetWhatsAppTemplatesToDefault,
  type WhatsAppTemplate,
} from "@/features/communication/whatsapp-actions";

interface WhatsAppTemplatesClientProps {
  initialTemplates: WhatsAppTemplate[];
}

const AVAILABLE_VARIABLES = [
  { key: "customer_name", label: "Customer Name", example: "Tanvir Ahmed" },
  { key: "order_number", label: "Order ID", example: "ORD-84219" },
  { key: "store_name", label: "Store Brand Name", example: "Blush & Budget" },
  { key: "items_summary", label: "Items Summary", example: "COSRX Snail Mucin 96% x1, BOJ Sun Relief x1" },
  { key: "cod_due", label: "COD Amount Due (BDT)", example: "2,760" },
  { key: "courier_name", label: "Courier Name", example: "SteadFast Courier" },
  { key: "tracking_id", label: "Tracking / Consignment ID", example: "SF-8921094" },
  { key: "tracking_url", label: "Live Tracking Link", example: "https://steadfast.com.bd/t/SF-8921094" },
  { key: "checkout_url", label: "Direct Checkout Recovery URL", example: "https://blushandbudget.com/checkout" },
  { key: "discount_code", label: "Discount Promo Code", example: "BLUSH5" },
  { key: "advance_amount", label: "Advance Fee (BDT)", example: "120" },
  { key: "remaining_due", label: "Remaining COD Due (BDT)", example: "2,640" },
];

export function WhatsAppTemplatesClient({ initialTemplates }: WhatsAppTemplatesClientProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(initialTemplates);
  const [selectedId, setSelectedId] = useState<string>(initialTemplates[0]?.id || "wa-0");
  const [testPhone, setTestPhone] = useState<string>("01700000000");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === selectedId) || templates[0];

  const updateSelectedField = (field: keyof WhatsAppTemplate, value: any) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === selectedId ? { ...t, [field]: value } : t))
    );
  };

  const insertVariable = (varKey: string) => {
    const placeholder = `{{${varKey}}}`;
    const current = selectedTemplate.template || "";
    updateSelectedField("template", current + placeholder);
  };

  const getSimulatedMessage = (templateText: string) => {
    let msg = templateText;
    const sampleData: Record<string, string> = {
      customer_name: "Tanvir Ahmed",
      order_number: "ORD-84219",
      store_name: "Blush & Budget",
      items_summary: "COSRX Snail Mucin 96% x1, BOJ Sun Relief x1",
      cod_due: "2,760",
      courier_name: "SteadFast Courier",
      tracking_id: "SF-8921094",
      tracking_url: "https://steadfast.com.bd/t/SF-8921094",
      checkout_url: "https://blushandbudget.com/checkout",
      discount_code: "BLUSH5",
      advance_amount: String(selectedTemplate.advance_amount || 120),
      remaining_due: String(2760 - (selectedTemplate.advance_amount || 120)),
    };

    for (const [k, v] of Object.entries(sampleData)) {
      msg = msg.replaceAll(`{{${k}}}`, v);
    }
    return msg;
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(false);
    try {
      await saveWhatsAppTemplates(templates);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err) {
      alert("Failed to save templates. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Reset all WhatsApp templates back to default humanized Bangla wording?")) {
      setSaving(true);
      try {
        const res = await resetWhatsAppTemplatesToDefault();
        setTemplates(res.templates);
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 4000);
      } finally {
        setSaving(false);
      }
    }
  };

  const simulatedText = getSimulatedMessage(selectedTemplate.template);
  const testWaUrl = `https://wa.me/88${testPhone.replace(/\D/g, "")}?text=${encodeURIComponent(simulatedText)}`;

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <ModuleHeader
          title="WhatsApp 1-Click Message Templates"
          description="Customize the humanized Bangla text, dynamic tags, advance delivery amounts, and status triggers for all WhatsApp actions in order and abandoned cart management."
          icon={PhoneCall}
          backHref="/admin/communication/notifications"
        />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={saving}
            className="text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset Defaults
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving Changes..." : "Save All Templates"}
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 animate-in fade-in-0">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>WhatsApp templates successfully saved! Active templates are now live in Orders & Customer views.</span>
        </div>
      )}

      {/* Main Grid: Left Tabs & Editor | Right Live WhatsApp Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Template List Selector (4 Cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              {templates.length} Pre-Formatted Actions
            </span>
            <span className="text-[10px] text-text-muted">Click to edit</span>
          </div>

          <div className="space-y-2">
            {templates.map((tpl, idx) => {
              const isSelected = tpl.id === selectedId;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedId(tpl.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/20"
                      : "border-border bg-white hover:bg-surface-secondary/60"
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-surface-secondary text-text-muted"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-text truncate">{tpl.name}</p>
                      {tpl.is_active ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-text-muted truncate mt-0.5 font-mono">
                      Type: {tpl.template_type}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor & Live Preview (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-5">
            {/* Editor Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-text">{selectedTemplate.name}</h3>
                <p className="text-[11px] text-text-muted">
                  Used for 1-click customer messaging when handling orders.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={selectedTemplate.is_active}
                  onChange={(e) => updateSelectedField("is_active", e.target.checked)}
                  className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <span className="font-semibold text-text">Enable this template</span>
              </label>
            </div>

            {/* If Advance Fee Template, show custom Advance Amount field */}
            {selectedTemplate.template_type === "advance" && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                <label className="block font-bold text-amber-900">
                  Default Advance Delivery Charge (BDT)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-40">
                    <span className="absolute left-3 top-2.5 text-text-muted font-bold">৳</span>
                    <input
                      type="number"
                      value={selectedTemplate.advance_amount || 120}
                      onChange={(e) =>
                        updateSelectedField("advance_amount", Number(e.target.value) || 0)
                      }
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-text focus:outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-amber-800">
                    This amount is automatically deducted from COD total in the template.
                  </span>
                </div>
              </div>
            )}

            {/* Template Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text">Message Template Text</label>
                <span className="text-[11px] text-text-muted font-mono">
                  {selectedTemplate.template.length} characters
                </span>
              </div>

              <textarea
                rows={6}
                value={selectedTemplate.template}
                onChange={(e) => updateSelectedField("template", e.target.value)}
                placeholder="Enter your WhatsApp message..."
                className="w-full rounded-xl border border-border bg-white p-3.5 text-xs text-text font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
              />
            </div>

            {/* Insert Dynamic Variables */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary-600" />
                Insert Dynamic Tag Variables (Click to Add)
              </label>

              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="px-2.5 py-1 rounded-lg bg-surface-secondary border border-border text-[11px] font-mono font-medium text-text hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors"
                    title={`Example: ${v.example}`}
                  >
                    + {`{{${v.key}}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Simulated WhatsApp Bubble Preview */}
          <div className="rounded-2xl border border-emerald-100 bg-linear-to-b from-[#e5ddd5]/30 to-[#e5ddd5]/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-800">
                  Live WhatsApp Message Preview (Customer Perspective)
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Simulated Output
              </span>
            </div>

            {/* Chat Bubble */}
            <div className="max-w-lg ml-auto bg-white rounded-2xl rounded-tr-xs p-4 shadow-sm border border-gray-200/80 space-y-2">
              <div className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">
                {simulatedText}
              </div>
              <div className="text-[10px] text-gray-400 text-right font-medium">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Delivered ✓✓
              </div>
            </div>

            {/* Test Send to Phone */}
            <div className="pt-2 border-t border-gray-300/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-600 font-medium">Test Send to Phone:</span>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-32 px-2.5 py-1 rounded-lg border border-gray-300 bg-white text-xs font-mono"
                />
              </div>

              <a
                href={testWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <Send className="h-3 w-3" />
                Open in WhatsApp Web
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
