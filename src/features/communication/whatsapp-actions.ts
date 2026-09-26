"use server";

import { getSetting, updateGroupSettings } from "@/lib/settings/config-service";
import { revalidatePath } from "next/cache";

export interface WhatsAppTemplate {
  id: string;
  name: string;
  template_type: "abandoned" | "confirm" | "shipped" | "advance" | "review" | "cancelled" | "refund";
  template: string;
  variables: string[];
  is_active: boolean;
  advance_amount?: number;
}

const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "wa-0",
    name: "Abandoned Checkout Recovery",
    template_type: "abandoned",
    template:
      " {{customer_name}}, Hello! 🌸  {{store_name}}- your desired  Products    ({{items_summary}})।\n\n   your Orderitems   । your  We    Delivery।\n\nOrder Complete   : {{checkout_url}}\n Question  Add for   Enter। !",
    variables: ["customer_name", "store_name", "items_summary", "checkout_url", "discount_code"],
    is_active: true,
  },
  {
    id: "wa-1",
    name: "Order    ",
    template_type: "confirm",
    template:
      " {{customer_name}}, {{store_name}}- your Orderitems for  ! 🌸\n\nOrder Name: #{{order_number}}\nProducts: {{items_summary}}\nCash  Delivery : ৳{{cod_due}}\n\nWe your items     and   Delivery for  । Delivery    Please  Received ।",
    variables: ["customer_name", "order_number", "store_name", "items_summary", "cod_due"],
    is_active: true,
  },
  {
    id: "wa-2",
    name: "  Tracking  ",
    template_type: "shipped",
    template:
      " {{customer_name}}, ! your Orderitems (#{{order_number}})    successfully। 🚚\n\n: {{courier_name}}\nTracking ID: {{tracking_id}}\n Tracking Link: {{tracking_url}}\nDelivery   Total :00: ৳{{cod_due}}\n\n your Address    ।     Number  Enter।",
    variables: ["customer_name", "order_number", "courier_name", "tracking_id", "tracking_url", "cod_due"],
    is_active: true,
  },
  {
    id: "wa-3",
    name: " Delivery Charge ",
    template_type: "advance",
    template:
      " {{customer_name}}, {{store_name}} from ! your Order #{{order_number}} items permanently Processing    Delivery Charge  ৳{{advance_amount}}    for   ।\n\n ৳{{remaining_due}}     Cash  Delivery  ।\n\n/  Number Payment    ID       । !",
    variables: ["customer_name", "order_number", "cod_due", "advance_amount", "remaining_due"],
    advance_amount: 120,
    is_active: true,
  },
  {
    id: "wa-4",
    name: "Reviews   ",
    template_type: "review",
    template:
      " {{customer_name}}, Hello!   {{store_name}} from  your Products   and use  । ✨\n\n Products    your  ? your Price Reviews or items       We   !",
    variables: ["customer_name", "order_number", "store_name"],
    is_active: true,
  },
  {
    id: "wa-5",
    name: "Order Cancel  ",
    template_type: "cancelled",
    template:
      " {{customer_name}}, We permanently     your Orderitems (#{{order_number}}) Cancel  successfully।\n\n Invalid    or again Order   Please     । We     ।",
    variables: ["customer_name", "order_number", "store_name"],
    is_active: true,
  },
  {
    id: "wa-6",
    name: "Refund  Return Completed",
    template_type: "refund",
    template:
      " {{customer_name}}, your Order #{{order_number}}- Refund permanently Completed successfully। your  Payment items Please    ।\n\n Add for We  । {{store_name}}-   for ।",
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
