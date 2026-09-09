import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCardData } from "@/components/storefront/product-card";
import { CategoryDetailClient } from "./category-detail-client";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/json-ld";
import { getBaseUrl } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const baseUrl = getBaseUrl() || "https://blushbudget.com";

  const { data: category } = await supabase
    .from("categories")
    .select("name, seo_title, seo_description, image_url")
    .eq("slug", slug)
    .single();

  if (!category) return { title: "Category Not Found" };

  const title = category.seo_title || `${category.name} in Bangladesh — 100% Authentic | Blush & Budget`;
  const description =
    category.seo_description ||
    `Shop 100% genuine ${category.name} at best prices in Bangladesh. Fast nationwide doorstep delivery & Cash on Delivery from Blush & Budget.`;
  const canonicalUrl = `${baseUrl}/categories/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Blush & Budget",
      images: category.image_url ? [category.image_url] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const baseUrl = getBaseUrl() || "https://blushbudget.com";

  // Fetch Category with slug normalization fallback
  let { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) {
    // Try normalized slug (e.g. "skincare" vs "skin-care", "haircare" vs "hair-care")
    const altSlug = slug.includes("-") ? slug.replace(/-/g, "") : slug.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    const { data: altCat } = await supabase
      .from("categories")
      .select("*")
      .ilike("slug", `%${altSlug}%`)
      .maybeSingle();
    category = altCat;
  }

  if (!category) notFound();

  // Fetch Subcategories (child categories)
  const { data: subcategories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("parent_id", category.id)
    .eq("status", "active");

  const allCategoryIds = [category.id, ...(subcategories || []).map((s) => s.id)];

  // 1. Fetch Products in this category or any of its subcategories via junction table
  const { data: productCategories } = await supabase
    .from("product_categories")
    .select("product_id")
    .in("category_id", allCategoryIds);

  const junctionProductIds = Array.from(new Set((productCategories || []).map((pc) => pc.product_id)));

  // 2. Fetch Products directly matching category_id OR present in junction table
  let prodsQuery = supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      sku,
      regular_price,
      sale_price,
      og_image_url,
      country,
      shipping_class,
      brands (name),
      inventory (available),
      reviews (rating, status)
    `)
    .eq("status", "active")
    .is("deleted_at", null);

  if (junctionProductIds.length > 0) {
    prodsQuery = prodsQuery.in("id", junctionProductIds);
  } else {
    prodsQuery = prodsQuery.or(`name.ilike.%${category.name}%,slug.ilike.%${category.slug}%`);
  }

  let { data: products } = await prodsQuery;

  // Fallback: If still empty, search by category name in product name or category slug
  if (!products || products.length === 0) {
    const { data: fallbackProds } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        sku,
        regular_price,
        sale_price,
        og_image_url,
        country,
        shipping_class,
        brands (name),
        inventory (available),
        reviews (rating, status)
      `)
      .ilike("name", `%${category.name}%`)
      .eq("status", "active")
      .is("deleted_at", null);

    products = fallbackProds || [];
  }

  const productCards: ProductCardData[] = (products || []).map((p: any) => {
    const inv = p.inventory as Array<{ available: number }> | null;
    const isAvailable = inv ? inv.some((i) => i.available > 0) : true;
    const brandData = (Array.isArray(p.brands) ? p.brands[0] : p.brands) as { name: string } | null;

    const approvedReviews = (p.reviews || []).filter((r: any) => r.status === "approved");
    const reviewCount = approvedReviews.length;
    const averageRating =
      reviewCount > 0
        ? Number(
            (
              approvedReviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) /
              reviewCount
            ).toFixed(1)
          )
        : 4.9;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku || null,
      regular_price: p.regular_price,
      sale_price: p.sale_price,
      image_url: p.og_image_url || null,
      brand_name: brandData?.name || null,
      origin_country: p.country || "South Korea",
      country: p.country || "South Korea",
      is_in_stock: isAvailable,
      rating: averageRating,
      review_count: reviewCount > 0 ? reviewCount : undefined,
      is_free_shipping: p.shipping_class === "free_shipping",
      shipping_class: p.shipping_class || null,
    };
  });

  const breadcrumbs = [
    { name: "Home", url: `${baseUrl}` },
    { name: "Categories", url: `${baseUrl}/categories` },
    { name: category.name, url: `${baseUrl}/categories/${category.slug}` },
  ];

  const itemList = productCards.map((p, idx) => ({
    name: p.name,
    url: `${baseUrl}/products/${p.slug}`,
    position: idx + 1,
  }));

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <ItemListJsonLd
        name={`${category.name} Products — Blush & Budget`}
        url={`${baseUrl}/categories/${category.slug}`}
        items={itemList}
      />
      <CategoryDetailClient
        category={category}
        subcategories={subcategories || []}
        productCards={productCards}
      />
    </>
  );
}

