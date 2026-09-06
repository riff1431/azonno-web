import { createClient } from "@/lib/supabase/server";
import { ProductsListingClient } from "./products-listing-client";
import { type ProductCardData } from "@/components/storefront/product-card";
import { getStoreFeatureSettings } from "@/features/settings/feature-settings-actions";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Authentic Skincare & Beauty Catalogue — Blush & Budget",
  description:
    "Explore 100% genuine skincare, cosmetics, sunscreens, and K-Beauty bestsellers imported from authorized distributors.",
};

export default async function ProductsListingPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    sort?: string;
    search?: string;
    min_price?: string;
    max_price?: string;
    skin_type?: string;
    skin_concern?: string;
    key_actives?: string;
    origin?: string;
    in_stock?: string;
  }>;
}) {
  const {
    category,
    brand,
    sort,
    search,
    min_price,
    max_price,
    skin_type,
    skin_concern,
    key_actives,
    origin,
    in_stock,
  } = await searchParams;

  const supabase = await createClient();
  const featureSettings = await getStoreFeatureSettings();

  // Fetch Categories & Brands for filters
  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").eq("status", "active"),
    supabase.from("brands").select("id, name, slug").eq("status", "active"),
  ]);

  // Query products
  let query = supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      sku,
      regular_price,
      sale_price,
      og_image_url,
      skin_type,
      skin_concern,
      key_actives,
      origin_country,
      routine_step,
      shipping_class,
      brands (name),
      inventory (available)
    `)
    .eq("status", "active")
    .is("deleted_at", null);

  if (category) {
    const selectedCat = categories?.find((c) => c.slug === category);
    if (selectedCat) {
      const { data: productIds } = await supabase
        .from("product_categories")
        .select("product_id")
        .eq("category_id", selectedCat.id);

      if (productIds && productIds.length > 0) {
        query = query.in("id", productIds.map((p) => p.product_id));
      } else {
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      }
    } else {
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  if (brand) {
    const selectedBrand = brands?.find((b) => b.slug === brand);
    if (selectedBrand) {
      query = query.eq("brand_id", selectedBrand.id);
    }
  }

  if (skin_type) {
    query = query.contains("skin_type", [skin_type]);
  }

  if (skin_concern) {
    query = query.contains("skin_concern", [skin_concern]);
  }

  if (key_actives) {
    query = query.contains("key_actives", [key_actives]);
  }

  if (origin) {
    query = query.ilike("origin_country", `%${origin}%`);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (min_price) {
    query = query.gte("regular_price", Number(min_price));
  }

  if (max_price) {
    query = query.lte("regular_price", Number(max_price));
  }

  // Sorting
  switch (sort) {
    case "price_asc":
      query = query.order("regular_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("regular_price", { ascending: false });
      break;
    case "popular":
      query = query.order("regular_price", { ascending: false });
      break;
    case "rating":
      query = query.order("created_at", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data: products } = await query;

  const productCardItems: ProductCardData[] = (products || [])
    .map((p: any) => {
      const inv = p.inventory as Array<{ available: number }> | null;
      const isAvailable = inv ? inv.some((i) => i.available > 0) : true;
      const brandData = (Array.isArray(p.brands) ? p.brands[0] : p.brands) as { name: string } | null;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku || null,
        regular_price: p.regular_price,
        sale_price: p.sale_price,
        image_url: p.og_image_url || null,
        brand_name: brandData?.name || null,
        is_in_stock: isAvailable,
        rating: 5.0,
        review_count: 14,
        is_free_shipping: p.shipping_class === "free_shipping",
        shipping_class: p.shipping_class || null,
      };
    })
    .filter((p) => {
      if (in_stock === "true" || in_stock === "1") {
        return p.is_in_stock;
      }
      return true;
    });

  return (
    <div className="container-main py-4 sm:py-6 space-y-5">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/" className="hover:text-text transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" />
        <span className="text-text font-bold">Catalog</span>
      </nav>

      {/* Header Banner */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-text">
          {search
            ? `Search Results for "${search}"`
            : category
            ? `Category: ${category}`
            : brand
            ? `Brand: ${brand}`
            : skin_concern
            ? `Concern: ${skin_concern}`
            : "All Authentic Skincare & Cosmetics"}
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary">
          Certified 100% genuine skincare &amp; cosmetics imported directly from authorized brands.
        </p>
      </div>

      {/* Main Listing Component */}
      <ProductsListingClient
        products={productCardItems}
        categories={categories || []}
        brands={brands || []}
        currentCategory={category}
        currentBrand={brand}
        currentSort={sort}
        currentSearch={search}
        currentMinPrice={min_price}
        currentMaxPrice={max_price}
        currentSkinType={skin_type}
        currentSkinConcern={skin_concern}
        currentKeyActive={key_actives}
        currentOrigin={origin}
        currentInStock={in_stock === "true" || in_stock === "1"}
        enableBeautyFilters={featureSettings.enable_beauty_filters}
      />
    </div>
  );
}
