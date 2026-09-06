"use server";

import { getSetting, updateGroupSettings } from "@/lib/settings/config-service";
import { revalidatePath } from "next/cache";

export interface WhatsAppTemplate {
  id: string;
  name: string;
  template_type: "confirm" | "shipped" | "advance" | "review" | "cancelled" | "refund";
  template: string;
  variables: string[];
  is_active: boolean;
  advance_amount?: number;
}

const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "wa-1",
    name: "Order Confirmed & Preparation",
    template_type: "confirm",
    template:
      "Hello {{customer_name}}, thank you for placing Order #{{order_number}} at {{store_name}}!\n\nItems: {{items_summary}}\nTotal COD Due: BDT {{cod_due}}\n\nYour parcel is confirmed and being prepared for delivery.",
    variables: ["customer_name", "order_number", "store_name", "items_summary", "cod_due"],
    is_active: true,
  },
  {
    id: "wa-2",
    name: "Courier Live Tracking Dispatch",
    template_type: "shipped",
    template:
      "Hello {{customer_name}}, your Order #{{order_number}} has been handed over to {{courier_name}}!\n\nConsignment / Tracking ID: {{tracking_id}}\nLive Tracking Link: {{tracking_url}}\n\nPlease keep BDT {{cod_due}} ready for the delivery rider.",
    variables: ["customer_name", "order_number", "courier_name", "tracking_id", "tracking_url", "cod_due"],
    is_active: true,
  },
  {
    id: "wa-3",
    name: "Advance Delivery Fee Request (bKash/Nagad)",
    template_type: "advance",
    template:
      "Hello {{customer_name}}, to confirm delivery of your Order #{{order_number}} (Total BDT {{cod_due}}), please send BDT {{advance_amount}} delivery advance via bKash/Nagad Merchant Number.\n\nRemaining BDT {{remaining_due}} will be Cash on Delivery.",
    variables: ["customer_name", "order_number", "cod_due", "advance_amount", "remaining_due"],
    advance_amount: 120,
    is_active: true,
  },
  {
    id: "wa-4",
    name: "Product Review & Feedback Request",
    template_type: "review",
    template:
      "Hello {{customer_name}}, we hope you loved your beauty products from Order #{{order_number}}! Please share your feedback and unboxing review with us at {{store_name}}.",
    variables: ["customer_name", "order_number", "store_name"],
    is_active: true,
  },
  {
    id: "wa-5",
    name: "Order Cancellation Notice",
    template_type: "cancelled",
    template:
      "Hello {{customer_name}}, we would like to inform you that your Order #{{order_number}} at {{store_name}} has been cancelled.\n\nIf you have any questions or wish to re-order, simply reply to this chat.",
    variables: ["customer_name", "order_number", "store_name"],
    is_active: true,
  },
  {
    id: "wa-6",
    name: "Refund & Return Processed",
    template_type: "refund",
    template:
      "Hello {{customer_name}}, your refund request for Order #{{order_number}} has been approved and processed. Thank you for shopping with {{store_name}}.",
    variables: ["customer_name", "order_number", "store_name"],
    is_active: true,
  },
];

export async function getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  const saved = await getSetting<WhatsAppTemplate[]>("whatsapp", "templates", DEFAULT_WHATSAPP_TEMPLATES);
  if (!saved || saved.length === 0) {
    return DEFAULT_WHATSAPP_TEMPLATES;
  }
  return saved;
}

export async function saveWhatsAppTemplates(templates: WhatsAppTemplate[]): Promise<{ success: boolean; templates: WhatsAppTemplate[] }> {
  await updateGroupSettings("whatsapp", { templates });
  revalidatePath("/admin/communication/whatsapp");
  revalidatePath("/admin/orders");
  return { success: true, templates };
}

export async function resetWhatsAppTemplatesToDefault(): Promise<{ success: boolean; templates: WhatsAppTemplate[] }> {
  await updateGroupSettings("whatsapp", { templates: DEFAULT_WHATSAPP_TEMPLATES });
  revalidatePath("/admin/communication/whatsapp");
  revalidatePath("/admin/orders");
  return { success: true, templates: DEFAULT_WHATSAPP_TEMPLATES };
}
