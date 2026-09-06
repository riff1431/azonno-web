import { getWhatsAppTemplates } from "@/features/communication/whatsapp-actions";
import { WhatsAppTemplatesClient } from "./whatsapp-templates-client";

export const metadata = {
  title: "WhatsApp Message Templates — Admin Dashboard",
  description: "Customize pre-formatted WhatsApp templates for order confirmation, live tracking, advance payments, and customer reviews.",
};

export default async function AdminWhatsAppTemplatesPage() {
  const templates = await getWhatsAppTemplates();
  return <WhatsAppTemplatesClient initialTemplates={templates} />;
}
