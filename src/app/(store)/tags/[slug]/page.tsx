import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type ProductCardData } from "@/components/storefront/product-card";
import { TagDetailClient } from "./tag-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: tag } = await supabase
    .from("tags")
    .select("name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!tag) return { title: "Tag Not Found — Blush & Budget" };

  return {
    title: `${tag.name} Skincare & Beauty Products — Blush & Budget Bangladesh`,
    description: `Shop genuine beauty & skincare products tagged #${tag.name} in Bangladesh with Cash on Delivery from Blush & Budget.`,
  };
}

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch Tag
  let { data: tag } = await supabase
    .from("tags")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!tag) {
    const cleanSlug = slug.replace(/-/g, " ");
    const { data: altTag } = await supabase
      .from("tags")
      .select("id, name, slug")
      .or(`slug.ilike.%${slug}%,name.ilike.%${cleanSlug}%`)
      .maybeSingle();
    tag = altTag;
  }

  if (!tag) notFound();

  // Fetch Products linked to this Tag
  const { data: productTags } = await supabase
    .from("product_tags")
    .select("product_id")
    .eq("tag_id", tag.id);

  const productIds = Array.from(new Set((productTags || []).map((pt) => pt.product_id)));

  let products: any[] = [];
  if (productIds.length > 0) {
    const { data: prods } = await supabase
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
        inventory (available)
      `)
      .in("id", productIds)
      .eq("status", "active")
      .is("deleted_at", null);
    products = prods || [];
  }

  const productCards: ProductCardData[] = products.map((p) => {
    const inv = p.inventory as Array<{ available: number }> | null;
    const isAvailable = inv ? inv.some((i) => i.available > 0) : true;
    const brandData = (Array.isArray(p.brands) ? p.brands[0] : p.brands) as { name: string } | null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      regular_price: p.regular_price,
      sale_price: p.sale_price,
      image_url: p.og_image_url || null,
      brand_name: brandData?.name || null,
      is_in_stock: isAvailable,
      rating: 5.0,
      review_count: 12,
      is_free_shipping: p.shipping_class === "free_shipping",
      shipping_class: p.shipping_class || null,
    };
  });

  return (
    <TagDetailClient
      tag={tag}
      productCards={productCards}
    />
  );
}
