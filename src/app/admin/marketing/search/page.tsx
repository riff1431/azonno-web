import { createAdminClient } from "@/lib/supabase/admin";
import { getSearchAnalyticsSummary } from "@/lib/analytics/search-analytics-service";
import { SearchAnalyticsClient } from "./search-analytics-client";

export const metadata = {
  title: "Search Analytics & Consumer Demand — Marketing",
  description: "Live real-time analysis of customer skincare queries, catalog coverage, and unfulfilled beauty demand.",
};

export default async function AdminSearchAnalyticsPage() {
  const supabase = createAdminClient();

  // Fetch count of published products and full analytics summary
  const [{ count: publishedProductsCount }, summary] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .is("deleted_at", null),
    getSearchAnalyticsSummary("30d"),
  ]);

  return (
    <SearchAnalyticsClient
      initialSummary={summary}
      publishedProductsCount={publishedProductsCount || 0}
    />
  );
}
