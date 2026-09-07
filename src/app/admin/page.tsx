import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminAnalyticsDashboard from "@/components/admin/admin-analytics-dashboard";
import { getAbandonedCheckouts } from "@/features/fraud/actions";

export const metadata = {
  title: "Store Analytics & Overview — Admin Dashboard",
  description: "Live overview of sales revenue, profit and loss, courier success rates, and catalog inventory.",
};

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  // Fetch complete orders, products with cost_price, inventory, batch & expiry, profiles, returns & leads
  const [ordersRes, productsRes, profilesRes, returnsRes, abandonedCheckouts] =
    await Promise.all([
      supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_id,
            variant_id,
            product_name_snapshot,
            unit_price,
            quantity,
            total
          )
        `)
        .order("created_at", { ascending: false }),
      supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          sku,
          regular_price,
          sale_price,
          cost_price,
          status,
          og_image_url,
          inventory (
            id,
            on_hand,
            reserved,
            available,
            low_stock_threshold
          )
        `),
      supabase.from("profiles").select("id, full_name, email, phone, role, created_at"),
      supabase.from("returns").select("*"),
      getAbandonedCheckouts().catch(() => []),
    ]);

  if (productsRes?.error) {
    console.error("Products query error in /admin:", productsRes.error);
  }
  if (ordersRes?.error) {
    console.error("Orders query error in /admin:", ordersRes.error);
  }

  const orders = ordersRes?.data || [];
  const products = productsRes?.data || [];
  const profiles = profilesRes?.data || [];
  const returns = returnsRes?.data || [];

  return (
    <Suspense>
      <AdminAnalyticsDashboard
        orders={orders}
        products={products}
        profiles={profiles}
        returns={returns}
        abandonedCheckouts={abandonedCheckouts || []}
      />
    </Suspense>
  );
}
