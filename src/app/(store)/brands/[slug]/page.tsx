import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCardData } from "@/components/storefront/product-card";
import { BrandDetailClient } from "./brand-detail-client";
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

  const { data: brand } = await supabase
    .from("brands")
    .select("name, seo_title, seo_description, logo_url")
    .eq("slug", slug)
    .single();

  if (!brand) return { title: "Brand Not Found" };

  const title = brand.seo_title || `${brand.name} in Bangladesh — 100% Authentic | Blush & Budget`;
  const description =
    brand.seo_description ||
    `Shop 100% genuine ${brand.name} skincare and cosmetics in Bangladesh with fast nationwide doorstep delivery & cash on delivery from Blush & Budget.`;
  const canonicalUrl = `${baseUrl}/brands/${slug}`;

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
      images: brand.logo_url ? [brand.logo_url] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const baseUrl = getBaseUrl() || "https://blushbudget.com";

  // Fetch Brand with slug fallback
  let { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!brand) {
    const cleanSlug = slug.replace(/-/g, "");
    const { data: altBrand } = await supabase
      .from("brands")
      .select("*")
      .or(`slug.ilike.%${slug}%,slug.ilike.%${cleanSlug}%`)
      .maybeSingle();
    brand = altBrand;
  }

  if (!brand) notFound();

  // Fetch Products by Brand (by brand_id OR brand name match)
  const { data: products } = await supabase
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
    .or(`brand_id.eq.${brand.id},name.ilike.%${brand.name}%`)
    .eq("status", "active")
    .is("deleted_at", null);

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
      brand_name: brandData?.name || brand.name,
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
    { name: "Brands", url: `${baseUrl}/brands` },
    { name: brand.name, url: `${baseUrl}/brands/${brand.slug}` },
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
        name={`${brand.name} Products — Blush & Budget`}
        url={`${baseUrl}/brands/${brand.slug}`}
        items={itemList}
      />
      <BrandDetailClient
        brand={brand}
        productCards={productCards}
      />
    </>
  );
}

