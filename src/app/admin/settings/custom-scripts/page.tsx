import { getCustomScriptsSettings } from "@/features/settings/custom-scripts-actions";
import { CustomScriptsClient } from "./custom-scripts-client";

export const metadata = {
  title: "Header, Body & Footer Scripts & Verification — Admin Dashboard",
  description: "Manage Custom HTML, JavaScript, Meta Tags, and Domain Verification Codes for Head, Body, and Footer.",
};

export const dynamic = "force-dynamic";

export default async function AdminCustomScriptsPage() {
  const initialSettings = await getCustomScriptsSettings();
  return <CustomScriptsClient initialSettings={initialSettings} />;
}
