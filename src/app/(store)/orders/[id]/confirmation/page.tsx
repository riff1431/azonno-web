import { notFound } from "next/navigation";
import { getOrderById } from "@/features/orders/actions";
import { getMarketingAnalyticsSettings } from "@/features/marketing/meta-actions";
import { PurchaseTracker } from "@/components/analytics/purchase-tracker";
import { OrderConfirmationClient } from "./order-confirmation-client";
import { getShortProductId } from "@/lib/utils";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, marketingSettings] = await Promise.all([
    getOrderById(id),
    getMarketingAnalyticsSettings(),
  ]);

  if (!order) notFound();

  const address = order.shipping_address_snapshot || {};
  const items = order.order_items || [];

  // If status-gated purchase tracking is enabled, suppress browser pixel Purchase on confirmation
  const isStatusGated = marketingSettings.purchase_tracking_mode !== "immediate";
  const suppressBrowserPixel = isStatusGated && marketingSettings.suppress_browser_pixel_on_status_gated !== false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* 1. GA4 DataLayer Purchase Event Dispatcher (with status-gated suppression support) */}
      <PurchaseTracker
        orderData={{
          transaction_id: order.order_number || order.id,
          order_id: order.order_number || order.id,
          value: Number(order.total) || 0,
          currency: "BDT",
          tax: 0,
          shipping: Number(order.shipping_amount) || 0,
          coupon: order.coupon_code || undefined,
          discount: Number(order.discount_amount) || 0,
          payment_type: order.payment_method || "Cash on Delivery",
          suppressMetaPixel: suppressBrowserPixel,
          suppressTikTokPixel: suppressBrowserPixel,
          customer: {
            email: order.customer_email || address.email || undefined,
            phone: order.customer_phone || address.phone || undefined,
            first_name: address.first_name || (order.customer_name ? order.customer_name.split(" ")[0] : undefined),
            last_name: address.last_name || (order.customer_name ? order.customer_name.split(" ").slice(1).join(" ") : undefined),
            external_id: order.customer_id || undefined,
            city: address.city || address.district || "Dhaka",
            state: address.state || address.division || "Dhaka",
            country: address.country || "BD",
            zip: address.zip || address.postal_code || "",
          },
          items: items.map((it: any, idx: number) => ({
            item_id: getShortProductId({ sku: it.sku_snapshot, product_id: it.product_id, id: it.id }),
            item_name: it.product_name_snapshot || "Product",
            price: Number(it.unit_price) || 0,
            quantity: Number(it.quantity) || 1,
            index: idx + 1,
          })),
        }}
      />

      {/* Bilingual Order Confirmation Client */}
      <OrderConfirmationClient order={order} />
    </div>
  );
}

