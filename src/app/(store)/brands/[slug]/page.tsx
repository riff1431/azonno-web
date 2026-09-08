import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCardData } from "@/components/storefront/product-card";
import { BrandDetailClient } from "./brand-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: brand } = await supabase
    .from("brands")
    .select("name, seo_title, seo_description")
    .eq("slug", slug)
    .single();

  if (!brand) return { title: "Brand Not Found" };

  return {
    title: brand.seo_title || `${brand.name} Authentic Products — Blush & Budget`,
    description: brand.seo_description || `Shop 100% genuine ${brand.name} products in Bangladesh with cash on delivery.`,
  };
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

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
      inventory (available)
    `)
    .or(`brand_id.eq.${brand.id},name.ilike.%${brand.name}%`)
    .eq("status", "active")
    .is("deleted_at", null);

  const productCards: ProductCardData[] = (products || []).map((p: any) => {
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
      brand_name: brandData?.name || brand.name,
      origin_country: p.country || "South Korea",
      country: p.country || "South Korea",
      is_in_stock: isAvailable,
      rating: 5.0,
      review_count: 14,
      is_free_shipping: p.shipping_class === "free_shipping",
      shipping_class: p.shipping_class || null,
    };
  });

  return (
    <BrandDetailClient
      brand={brand}
      productCards={productCards}
    />
  );
}
