import { getAdminReturns } from "@/features/returns/actions";
import { getStoreFeatureSettings } from "@/features/settings/feature-settings-actions";
import { ReturnsClient } from "./returns-client";

export const metadata = {
  title: "Customer Returns & RMA — Admin Dashboard",
  description: "Manage product returns, inspection workflows, reverse courier pickups, and customer refunds.",
};

export default async function AdminReturnsPage() {
  const [returns, settings] = await Promise.all([
    getAdminReturns(),
    getStoreFeatureSettings(),
  ]);

  return <ReturnsClient initialReturns={returns} initialSettings={settings} />;
}

