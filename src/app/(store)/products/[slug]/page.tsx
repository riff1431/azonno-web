import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductDetailClient } from "./product-detail-client";
import { getFrequentlyBoughtTogetherBundle } from "@/features/products/combo-actions";
import { getStoreFeatureSettings } from "@/features/settings/feature-settings-actions";
import { getProductReviews } from "@/features/reviews/actions";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getBaseUrl, getShortProductId } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("name, seo_title, seo_description, og_image_url")
    .eq("slug", slug)
    .single();

  if (!product) return { title: "Product Not Found" };

  return {
    title: product.seo_title || `${product.name} — 100% Authentic Online Bangladesh`,
    description:
      product.seo_description ||
      `Buy genuine ${product.name} with fast delivery and Cash on Delivery in Bangladesh from Blush & Budget.`,
    openGraph: {
      images: product.og_image_url ? [product.og_image_url] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const featureSettings = await getStoreFeatureSettings();

  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      brands (id, name, slug),
      inventory (on_hand, available),
      product_variants (*),
      product_media (
        id,
        is_featured,
        position,
        media (secure_url, alt_text)
      )
    `)
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (!product) {
    notFound();
  }

  // Fetch related products, combo bundle, and verified real reviews
  const [{ data: related }, bundleData, productReviews] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, regular_price, sale_price, og_image_url, brands(name)")
      .neq("id", product.id)
      .eq("status", "active")
      .limit(4),
    getFrequentlyBoughtTogetherBundle(product.id),
    getProductReviews(product.id),
  ]);

  const realReviewsCount = productReviews?.length || 0;
  const realAverageRating =
    realReviewsCount > 0
      ? productReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 5), 0) / realReviewsCount
      : 0;

  const baseUrl = getBaseUrl();
  const productUrl = `${baseUrl}/products/${product.slug}`;
  const images = (product.product_media || [])
    .map((pm: any) => pm.media?.secure_url)
    .filter(Boolean);
  if (product.og_image_url && !images.includes(product.og_image_url)) {
    images.unshift(product.og_image_url);
  }

  const breadcrumbItems = [
    { name: "Home", url: `${baseUrl}` },
    { name: "Products", url: `${baseUrl}/products` },
  ];
  if (product.brands) {
    breadcrumbItems.push({
      name: product.brands.name,
      url: `${baseUrl}/products?brand=${product.brands.slug}`,
    });
  }
  breadcrumbItems.push({
    name: product.name,
    url: productUrl,
  });

  return (
    <div className="container-main py-4 sm:py-6 space-y-4">
      {/* Schema.org Structured Data for Google SERP & Merchant Rich Cards */}
      <ProductJsonLd
        name={product.name}
        description={product.description || product.seo_description}
        images={images}
        sku={getShortProductId(product)}
        brandName={product.brands?.name}
        price={Number(product.regular_price || 0)}
        salePrice={product.sale_price ? Number(product.sale_price) : undefined}
        availability={
          ((product.inventory as Array<{ available: number }> || []).some((i) => i.available > 0) || (product.inventory as any)?.available > 0) &&
          (product.status === "active" || product.status === "published")
            ? "InStock"
            : "OutOfStock"
        }
        url={productUrl}
        ratingValue={realReviewsCount > 0 ? Number(realAverageRating.toFixed(1)) : 5.0}
        reviewCount={realReviewsCount > 0 ? realReviewsCount : 1}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      {/* Clean Compact Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted overflow-x-auto no-scrollbar">
        <Link href="/" className="hover:text-text shrink-0 transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
        <Link href="/products" className="hover:text-text shrink-0 transition-colors">
          Products
        </Link>
        {product.brands && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
            <Link
              href={`/products?brand=${product.brands.slug}`}
              className="hover:text-text shrink-0 transition-colors"
            >
              {product.brands.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
        <span className="text-text font-bold truncate max-w-50 sm:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* Product Interactive Client Section */}
      <ProductDetailClient
        product={product}
        relatedProducts={related || []}
        bundleData={bundleData}
        featureSettings={featureSettings}
        initialReviewsCount={realReviewsCount}
        initialAverageRating={realAverageRating}
      />
    </div>
  );
}
