"use client";

import { useState } from "react";
import { MessageSquare, Edit2, Plus, Code, Trash2, X, AlertCircle, RotateCcw } from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { saveSmsTemplate, deleteSmsTemplate, resetSmsTemplatesToDefault, type SmsTemplate } from "@/features/sms/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

const COMMON_VARIABLES = [
  "customer_name",
  "order_number",
  "total",
  "store_name",
  "courier_name",
  "tracking_id",
  "tracking_url",
  "checkout_url",
  "discount_code",
  "advance_amount",
  "coupon_code",
  "store_url",
  "otp_code",
];

interface TemplatesClientProps {
  initialTemplates: SmsTemplate[];
}

export function TemplatesClient({ initialTemplates }: TemplatesClientProps) {
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const [templates, setTemplates] = useState<SmsTemplate[]>(initialTemplates);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("order_created");
  const [templateBody, setTemplateBody] = useState("");
  const [variables, setVariables] = useState<string[]>([]);
  const [error, setError] = useState("");

  const openAddModal = () => {
    setEditingTemplate(null);
    setName("");
    setEventType("order_created");
    setTemplateBody("");
    setVariables(["customer_name", "order_number"]);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (tpl: SmsTemplate) => {
    setEditingTemplate(tpl);
    setName(tpl.name);
    setEventType(tpl.event_type);
    setTemplateBody(tpl.template);
    setVariables(tpl.variables || []);
    setError("");
    setShowModal(true);
  };

  const insertVariable = (varName: string) => {
    const placeholder = `{{${varName}}}`;
    setTemplateBody((prev) => prev + placeholder);
    if (!variables.includes(varName)) {
      setVariables((prev) => [...prev, varName]);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a template title");
      return;
    }
    if (!templateBody.trim()) {
      setError("Please enter the SMS message template");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const updated = await saveSmsTemplate({
        id: editingTemplate?.id,
        name,
        event_type: eventType,
        template: templateBody,
        variables,
      });
      setTemplates(updated);
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to save template");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this SMS template?")) return;
    setDeletingId(id);
    try {
      const updated = await deleteSmsTemplate(id);
      setTemplates(updated);
    } catch (err: any) {
      alert("Failed to delete template: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm("Reset all SMS templates back to natural, humanized Bangla default wording?")) {
      setResetting(true);
      try {
        const res = await resetSmsTemplatesToDefault();
        setTemplates(res.templates);
      } catch (err: any) {
        alert("Failed to reset templates: " + err.message);
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <ModuleHeader
          title={isBn ? "SMS Notification Template  Variable" : "SMS Notification Templates & Dynamic Variables"}
          description={
            isBn
              ? "items Verification, Order , Courier ,  and Delivery for  English   ।"
              : "Manage automated message content for OTP verification, order placements, courier dispatches, abandoned carts, and delivery confirmations in humanized Bangla."
          }
          iconName="MessageSquare"
          backHref="/admin/communication/sms"
        />

        <div className="flex items-center gap-2">
          <Button
            onClick={handleResetDefaults}
            disabled={resetting}
            variant="outline"
            size="sm"
            className="text-xs shrink-0"
          >
            <RotateCcw className={`h-3.5 w-3.5 mr-1 ${resetting ? "animate-spin" : ""}`} />
            {isBn ? "  " : "Reset Defaults"}
          </Button>

          <Button onClick={openAddModal} size="sm" className="text-xs shrink-0">
            <Plus className="h-3.5 w-3.5 mr-1" />
            {isBn ? " Template " : "Create Template"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-3"
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text">{tpl.name}</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-surface-secondary text-primary-700 font-semibold border border-border">
                  {tpl.event_type}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(tpl)}
                  className="text-xs h-7 px-2.5"
                >
                  <Edit2 className="h-3 w-3 mr-1 text-primary-600" />
                  {isBn ? "Edit" : "Edit"}
                </Button>
                <button
                  onClick={() => handleDeleteTemplate(tpl.id)}
                  disabled={deletingId === tpl.id}
                  className="text-text-muted hover:text-red-600 p-1 transition-colors"
                  title={isBn ? "Template Delete" : "Delete template"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-surface-secondary/70 p-3 rounded-xl border border-border font-sans text-xs text-text leading-relaxed">
              &quot;{tpl.template}&quot;
            </div>

            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-text-muted font-medium flex items-center gap-1">
                <Code className="h-3 w-3" />
                {isBn ? "Variable:" : "Variables:"}
              </span>
              {tpl.variables?.map((v: string) => (
                <span
                  key={v}
                  className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px]"
                >
                  {"{{"}
                  {v}
                  {"}}"}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary-600" />
                {editingTemplate
                  ? (isBn ? "SMS Template Edit" : "Edit SMS Template")
                  : (isBn ? " SMS Template " : "Create SMS Notification Template")}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="tpl-name">{isBn ? "Template Name" : "Template Name"}</Label>
                <Input
                  id="tpl-name"
                  placeholder={isBn ? "e.g.:  Order Confirmed" : "e.g. Order Placed Confirmation"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-event">{isBn ? " " : "Event Trigger"}</Label>
                <select
                  id="tpl-event"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none"
                >
                  <option value="order_created">{isBn ? "Order Placed  " : "Order Placed & Confirmed"}</option>
                  <option value="order_shipped">{isBn ? "   " : "Consignment Shipped & Tracking"}</option>
                  <option value="order_delivered">{isBn ? "Delivered Confirmed" : "Order Delivered Confirmation"}</option>
                  <option value="abandoned_cart">{isBn ? "Abandoned Checkout Recovery" : "Abandoned Checkout Recovery"}</option>
                  <option value="order_cancelled">{isBn ? "Order Cancel " : "Order Cancelled Notification"}</option>
                  <option value="advance_requested">{isBn ? " Delivery  " : "Advance Delivery Charge Request"}</option>
                  <option value="review_request">{isBn ? "Reviews   " : "Review & Feedback Request"}</option>
                  <option value="order_otp">{isBn ? "Phone items " : "Phone OTP Verification"}</option>
                  <option value="promotional">{isBn ? "   " : "Promotional Offer & Voucher"}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tpl-body">{isBn ? " Template" : "Message Template"}</Label>
                  <span className="text-[10px] text-text-muted">
                    {templateBody.length} {isBn ? "items " : "chars"} (approx {Math.ceil(templateBody.length / 160) || 1} SMS)
                  </span>
                </div>
                <textarea
                  id="tpl-body"
                  rows={4}
                  placeholder="e.g. Dear {{customer_name}}, your order {{order_number}} is confirmed! Track: {{tracking_url}}"
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white p-3 text-xs text-text focus:border-primary-500 focus:outline-none resize-none font-sans"
                  required
                />
              </div>

              {/* Click to Insert Variables */}
              <div className="space-y-1.5">
                <Label>{isBn ? "  Name Variable Add to Cart:" : "Click to insert dynamic variable:"}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="px-2 py-1 rounded-lg bg-surface-secondary hover:bg-primary-50 hover:text-primary-700 border border-border text-[10px] font-mono transition-colors"
                    >
                      + {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  {isBn ? "Cancel" : "Cancel"}
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting
                    ? (isBn ? "Save ..." : "Saving...")
                    : (isBn ? "Template Save" : "Save Template")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
