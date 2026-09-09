import { getCouriers, getCourierShipments } from "@/features/logistics/actions";
import { getSteadfastSettings, getPathaoSettings } from "@/features/logistics/courier-settings-actions";
import { CourierListClient } from "@/features/logistics/courier-list-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Delivery Partners — Admin Dashboard",
};

export default async function AdminShippingPage() {
  const [couriers, shipments, steadfastSettings, pathaoSettings] = await Promise.all([
    getCouriers(),
    getCourierShipments(),
    getSteadfastSettings(false),
    getPathaoSettings(false),
  ]);

  // Enrich courier list with real connection status derived from actual saved settings
  const enrichedCouriers = couriers.map((c: any) => {
    if (c.code === "steadfast") {
      const isConnected = !!(steadfastSettings.api_key && steadfastSettings.secret_key);
      return {
        ...c,
        status: isConnected ? "active" : "not_configured",
        config: {
          ...c.config,
          api_key: isConnected ? "configured" : "",
          secret_key: isConnected ? "configured" : "",
        },
      };
    }
    if (c.code === "pathao") {
      const isConnected = !!(pathaoSettings.client_id && pathaoSettings.store_id);
      return {
        ...c,
        status: isConnected ? "active" : "not_configured",
        config: {
          ...c.config,
          client_id: isConnected ? "configured" : "",
          client_secret: isConnected ? "configured" : "",
        },
      };
    }
    return c;
  });

  return <CourierListClient initialCouriers={enrichedCouriers} initialShipments={shipments} />;
}
