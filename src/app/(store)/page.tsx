import { createClient } from "@/lib/supabase/server";
import { type ProductCardData } from "@/components/storefront/product-card";
import { getHomepageConfig } from "@/features/marketing/homepage-actions";
import { HomepageInteractive } from "./homepage-interactive";

export const metadata = {
  title: "Blush & Budget — 100% Authentic Korean Skincare & Cosmetics in Bangladesh",
  description:
    "Shop 100% genuine skincare, makeup, and haircare from top international and Korean brands in Bangladesh at Blush & Budget with Cash on Delivery nationwide.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const supabase = await createClient();

  // Parallel fetch: active products & admin dynamic layout configuration
  const [{ data: products }, homepageConfig] = await Promise.all([
    supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        regular_price,
        sale_price,
        og_image_url,
        shipping_class,
        brands (name),
        inventory (available),
        reviews (rating, status)
      `)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(16),
    getHomepageConfig(),
  ]);

  // Map to ProductCardData with dynamic review rating calculation
  const productCardItems: ProductCardData[] = (products || []).map((p: any) => {
    const inv = p.inventory;
    const isAvailable = Array.isArray(inv)
      ? (inv.length > 0 ? inv.some((i: any) => Number(i.available) > 0) : true)
      : inv && typeof inv === "object" && "available" in inv
      ? Number((inv as any).available) > 0
      : true;
    const brandData = (Array.isArray(p.brands) ? p.brands[0] : p.brands) as { name: string } | null;

    // Filter approved reviews only
    const approvedReviews = (p.reviews || []).filter(
      (r: any) => r.status === "approved"
    );
    const reviewCount = approvedReviews.length;
    const averageRating =
      reviewCount > 0
        ? Number(
            (
              approvedReviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) /
              reviewCount
            ).toFixed(1)
          )
        : 4.8; // High standard beauty default when new

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      regular_price: p.regular_price,
      sale_price: p.sale_price,
      image_url: p.og_image_url || null,
      brand_name: brandData?.name || null,
      is_in_stock: isAvailable,
      rating: averageRating,
      review_count: reviewCount > 0 ? reviewCount : undefined,
      is_free_shipping: p.shipping_class === "free_shipping",
      shipping_class: p.shipping_class || null,
    };
  });

  return (
    <HomepageInteractive
      products={productCardItems}
      config={homepageConfig}
    />
  );
}
