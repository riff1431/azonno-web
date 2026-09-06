import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCardData } from "@/components/storefront/product-card";
import { CategoryDetailClient } from "./category-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, seo_title, seo_description")
    .eq("slug", slug)
    .single();

  if (!category) return { title: "Category Not Found" };

  return {
    title: category.seo_title || `${category.name} — Authentic Online Bangladesh`,
    description: category.seo_description || `Buy authentic ${category.name} online in Bangladesh with Cash on Delivery.`,
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch Category
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!category) notFound();

  // Fetch Subcategories
  const { data: subcategories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("parent_id", category.id)
    .eq("status", "active");

  // Fetch Products in this category
  const { data: productCategories } = await supabase
    .from("product_categories")
    .select("product_id")
    .eq("category_id", category.id);

  const productIds = (productCategories || []).map((pc) => pc.product_id);

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
    <CategoryDetailClient
      category={category}
      subcategories={subcategories || []}
      productCards={productCards}
    />
  );
}
