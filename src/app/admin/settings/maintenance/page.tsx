import { getMaintenanceSettings } from "@/features/settings/actions";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { MaintenanceClient } from "./maintenance-client";

export const metadata = {
  title: "Maintenance Mode — Admin Dashboard",
};

export default async function AdminMaintenancePage() {
  const settings = await getMaintenanceSettings();

  return (
    <div className="space-y-6 max-w-4xl">
      <ModuleHeader
        title="Storefront Maintenance Mode"
        description="Temporarily take the public storefront offline during catalog restructuring or scheduled infrastructure maintenance while retaining admin access."
        iconName="Wrench"
        isCore
      />

      <MaintenanceClient initialSettings={settings} />
    </div>
  );
}
