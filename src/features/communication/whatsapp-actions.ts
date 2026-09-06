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
    name: "অসম্পূর্ণ চেকআউট রিকভারি (Abandoned Cart Recovery)",
    template_type: "abandoned",
    template:
      "প্রিয় {{customer_name}}, আসসালামু আলাইকুম! 🌸 আপনি {{store_name}}-এ আপনার পছন্দের কিছু প্রোডাক্ট কার্টে রেখে গিয়েছিলেন ({{items_summary}})।\n\nআপনি চাইলে এখনই আপনার অর্ডারটি কনফার্ম করতে পারেন। আপনার সুবিধার্থে আমরা দিচ্ছি দ্রুত হোম ডেলিভারি।\n\nঅর্ডার সম্পূর্ণ করতে ভিজিট করুন: {{checkout_url}}\nযেকোনো প্রশ্ন বা সহযোগিতার জন্য আমাদের মেসেজ দিন। ধন্যবাদ!",
    variables: ["customer_name", "store_name", "items_summary", "checkout_url", "discount_code"],
    is_active: true,
  },
  {
    id: "wa-1",
    name: "অর্ডার কনফার্ম ও পার্সেল প্রস্তুত (Order Confirmed)",
    template_type: "confirm",
    template:
      "প্রিয় {{customer_name}}, {{store_name}}-এ আপনার অর্ডারটির জন্য আন্তরিক ধন্যবাদ! 🌸\n\nঅর্ডার নাম্বার: #{{order_number}}\nপ্রোডাক্ট: {{items_summary}}\nক্যাশ অন ডেলিভারি বিল: ৳{{cod_due}}\n\nআমরা আপনার পার্সেলটি যত্ন সহকারে প্যাক করছি এবং দ্রুততম সময়ে ডেলিভারির জন্য প্রস্তুত করছি। ডেলিভারি রাইডার কল করলে অনুগ্রহ করে রিসিভ করবেন।",
    variables: ["customer_name", "order_number", "store_name", "items_summary", "cod_due"],
    is_active: true,
  },
  {
    id: "wa-2",
    name: "কুরিয়ার লাইভ ট্র্যাকিং ও হ্যান্ডওভার (Dispatched / Shipped)",
    template_type: "shipped",
    template:
      "প্রিয় {{customer_name}}, সুখবর! আপনার অর্ডারটি (#{{order_number}}) কুরিয়ারে হ্যান্ডওভার করা হয়েছে। 🚚\n\nকুরিয়ার: {{courier_name}}\nট্র্যাকিং আইডি: {{tracking_id}}\nলাইভ ট্র্যাকিং লিংক: {{tracking_url}}\nডেলিভারি রাইডারকে প্রদেয় মোট টাকা: ৳{{cod_due}}\n\nরাইডার আপনার ঠিকানায় পৌঁছানোর আগে কল করবেন। যেকোনো প্রয়োজনে আমাদের এই নম্বরে মেসেজ দিন।",
    variables: ["customer_name", "order_number", "courier_name", "tracking_id", "tracking_url", "cod_due"],
    is_active: true,
  },
  {
    id: "wa-3",
    name: "অগ্রিম ডেলিভারি চার্জ অনুরোধ (Advance Delivery Fee)",
    template_type: "advance",
    template:
      "প্রিয় {{customer_name}}, {{store_name}} থেকে শুভেচ্ছা! আপনার অর্ডার #{{order_number}} টি চূড়ান্তভাবে প্রসেসিং করতে ঢাকার বাইরের ডেলিভারি চার্জ বাবদ ৳{{advance_amount}} অগ্রিম প্রদান করার জন্য বিনীত অনুরোধ করছি।\n\nবাকি ৳{{remaining_due}} আপনি পার্সেল হাতে পেয়ে ক্যাশ অন ডেলিভারিতে পরিশোধ করবেন।\n\nবিকাশ/নগদ মার্চেন্ট নম্বরে পেমেন্ট করার পর ট্রানজেকশন আইডি বা স্ক্রিনশট এই চ্যাটে পাঠিয়ে কনফার্ম করুন। ধন্যবাদ!",
    variables: ["customer_name", "order_number", "cod_due", "advance_amount", "remaining_due"],
    advance_amount: 120,
    is_active: true,
  },
  {
    id: "wa-4",
    name: "রিভিউ ও ফিডব্যাক আমন্ত্রণ (Review & Feedback)",
    template_type: "review",
    template:
      "প্রিয় {{customer_name}}, আসসালামু আলাইকুম! আশা করি {{store_name}} থেকে নেওয়া আপনার প্রোডাক্টগুলো হাতে পেয়েছেন এবং ব্যবহার উপভোগ করছেন। ✨\n\nআমাদের প্রোডাক্ট ও সার্ভিসের অভিজ্ঞতা আপনার কেমন লাগলো? আপনার মূল্যবান রিভিউ অথবা একটি সুন্দর ছবি আমাদের সাথে শেয়ার করলে আমরা অনেক আনন্দিত হব!",
    variables: ["customer_name", "order_number", "store_name"],
    is_active: true,
  },
  {
    id: "wa-5",
    name: "অর্ডার বাতিল সংক্রান্ত তথ্য (Order Cancelled)",
    template_type: "cancelled",
    template:
      "প্রিয় {{customer_name}}, আমরা আন্তরিকভাবে দুঃখের সাথে জানাচ্ছি যে আপনার অর্ডারটি (#{{order_number}}) বাতিল করা হয়েছে।\n\nকোনো ভুল বোঝাবুঝি হয়ে থাকলে অথবা পুনরায় অর্ডার করতে চাইলে অনুগ্রহ করে এই চ্যাটে আমাদের জানান। আমরা আপনাকে সাহায্য করতে সবসময় প্রস্তুত।",
    variables: ["customer_name", "order_number", "store_name"],
    is_active: true,
  },
  {
    id: "wa-6",
    name: "রিফান্ড ও রিটার্ন সম্পন্ন (Refund Processed)",
    template_type: "refund",
    template:
      "প্রিয় {{customer_name}}, আপনার অর্ডার #{{order_number}}-এর রিফান্ড সফলভাবে সম্পন্ন হয়েছে। আপনার দেওয়া পেমেন্ট একাউন্টটি অনুগ্রহ করে চেক করে নিন।\n\nযেকোনো সহযোগিতার জন্য আমরা পাশে আছি। {{store_name}}-এর সাথে থাকার জন্য ধন্যবাদ।",
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
