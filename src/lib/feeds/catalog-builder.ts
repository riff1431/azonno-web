import { createAdminClient } from "@/lib/supabase/admin";

export type FeedPlatform = "meta" | "tiktok" | "google";
export type FeedFormat = "xml" | "csv";

interface ProductFeedItem {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  regular_price: number;
  sale_price: number | null;
  status: string;
  country: string | null;
  og_image_url: string | null;
  is_featured: boolean;
  brand_name: string;
  category_name: string;
  additional_images: string[];
}

/**
 * Strips HTML tags and excessive whitespace for clean feed descriptions
 */
function cleanDescription(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[\r\n\t]/g, " ")
    .trim()
    .slice(0, 5000);
}

/**
 * Escapes strings for RFC-4180 compliant CSV output
 */
function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Fetch all active published products with enriched brand, category, and media data
 */
async function fetchPublishedProducts(): Promise<ProductFeedItem[]> {
  const supabase = createAdminClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      sku,
      description,
      short_description,
      regular_price,
      sale_price,
      status,
      country,
      og_image_url,
      is_featured,
      brands (
        name
      ),
      categories (
        name
      )
    `)
    .eq("status", "published");

  if (error || !products) {
    return [];
  }

  return products.map((p: any) => {
    const brandName = p.brands?.name || "Blush & Budget";
    const categoryName = p.categories?.name || "Skincare & Cosmetics";

    return {
      id: p.id,
      sku: p.sku || p.id,
      name: p.name,
      slug: p.slug,
      description: cleanDescription(p.description || p.short_description || p.name),
      regular_price: Number(p.regular_price) || 0,
      sale_price: p.sale_price ? Number(p.sale_price) : null,
      status: p.status,
      country: p.country || "South Korea",
      og_image_url: p.og_image_url || null,
      is_featured: Boolean(p.is_featured),
      brand_name: brandName,
      category_name: categoryName,
      additional_images: [],
    };
  });
}

/**
 * Build Meta Commerce Manager Catalog (Facebook & Instagram Shop)
 */
export async function generateMetaFeed(baseUrl: string, format: FeedFormat = "xml"): Promise<{ content: string; contentType: string; filename: string }> {
  const products = await fetchPublishedProducts();

  if (format === "csv") {
    const headers = [
      "id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "sale_price",
      "link",
      "image_link",
      "brand",
      "google_product_category",
      "fb_product_category",
      "product_type",
      "custom_label_0",
      "custom_label_1",
    ];

    const rows = products.map((p) => {
      const priceStr = `${p.regular_price.toFixed(2)} BDT`;
      const salePriceStr = p.sale_price && p.sale_price < p.regular_price ? `${p.sale_price.toFixed(2)} BDT` : "";
      const productUrl = `${baseUrl}/products/${p.slug}`;
      const imageUrl = p.og_image_url || `${baseUrl}/images/product-placeholder.png`;

      return [
        escapeCsv(p.sku),
        escapeCsv(p.name),
        escapeCsv(p.description),
        escapeCsv(p.status === "published" ? "in stock" : "out of stock"),
        escapeCsv("new"),
        escapeCsv(priceStr),
        escapeCsv(salePriceStr),
        escapeCsv(productUrl),
        escapeCsv(imageUrl),
        escapeCsv(p.brand_name),
        escapeCsv("Health & Beauty > Personal Care > Cosmetics > Skin Care"),
        escapeCsv("Health & Beauty > Personal Care > Cosmetics"),
        escapeCsv(p.category_name),
        escapeCsv(p.country || "Authentic"),
        escapeCsv(p.is_featured ? "Featured" : "Standard"),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    return {
      content: csvContent,
      contentType: "text/csv; charset=utf-8",
      filename: "meta_catalog_feed.csv",
    };
  }

  // XML RSS 2.0 Meta Commerce Format
  const itemsXml = products
    .map((p) => {
      const priceStr = `${p.regular_price.toFixed(2)} BDT`;
      const salePriceStr = p.sale_price && p.sale_price < p.regular_price ? `${p.sale_price.toFixed(2)} BDT` : null;
      const productUrl = `${baseUrl}/products/${p.slug}`;
      const imageUrl = p.og_image_url || `${baseUrl}/images/product-placeholder.png`;

      return `    <item>
      <g:id>${p.sku}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description}]]></g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:brand><![CDATA[${p.brand_name}]]></g:brand>
      <g:condition>new</g:condition>
      <g:availability>${p.status === "published" ? "in stock" : "out of stock"}</g:availability>
      <g:price>${priceStr}</g:price>
      ${salePriceStr ? `<g:sale_price>${salePriceStr}</g:sale_price>\n      ` : ""}<g:google_product_category><![CDATA[Health & Beauty > Personal Care > Cosmetics > Skin Care]]></g:google_product_category>
      <g:fb_product_category><![CDATA[Health & Beauty > Personal Care > Cosmetics]]></g:fb_product_category>
      <g:product_type><![CDATA[${p.category_name}]]></g:product_type>
      <g:custom_label_0><![CDATA[${p.country || "Authentic"}]]></g:custom_label_0>
      <g:custom_label_1><![CDATA[${p.is_featured ? "Featured" : "Standard"}]]></g:custom_label_1>
    </item>`;
    })
    .join("\n");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Blush &amp; Budget Meta Product Catalog Feed</title>
    <link>${baseUrl}</link>
    <description>Authentic Cosmetics &amp; Skincare Products in Bangladesh for Meta Commerce &amp; Instagram Shop</description>
${itemsXml}
  </channel>
</rss>`;

  return {
    content: xmlContent,
    contentType: "application/xml; charset=utf-8",
    filename: "meta_catalog_feed.xml",
  };
}

/**
 * Build TikTok Catalog Manager Feed (TikTok Shop & Dynamic Showcase Ads)
 */
export async function generateTikTokFeed(baseUrl: string, format: FeedFormat = "xml"): Promise<{ content: string; contentType: string; filename: string }> {
  const products = await fetchPublishedProducts();

  if (format === "csv") {
    const headers = [
      "sku_id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "sale_price",
      "link",
      "image_link",
      "brand",
      "google_product_category",
      "product_type",
      "custom_label_0",
      "custom_label_1",
    ];

    const rows = products.map((p) => {
      const priceStr = `${p.regular_price.toFixed(2)} BDT`;
      const salePriceStr = p.sale_price && p.sale_price < p.regular_price ? `${p.sale_price.toFixed(2)} BDT` : "";
      const productUrl = `${baseUrl}/products/${p.slug}`;
      const imageUrl = p.og_image_url || `${baseUrl}/images/product-placeholder.png`;

      return [
        escapeCsv(p.sku),
        escapeCsv(p.name),
        escapeCsv(p.description),
        escapeCsv(p.status === "published" ? "in_stock" : "out_of_stock"),
        escapeCsv("new"),
        escapeCsv(priceStr),
        escapeCsv(salePriceStr),
        escapeCsv(productUrl),
        escapeCsv(imageUrl),
        escapeCsv(p.brand_name),
        escapeCsv("Health & Beauty > Personal Care > Cosmetics > Skin Care"),
        escapeCsv(p.category_name),
        escapeCsv("TikTok Showcase"),
        escapeCsv(p.country || "Authentic"),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    return {
      content: csvContent,
      contentType: "text/csv; charset=utf-8",
      filename: "tiktok_catalog_feed.csv",
    };
  }

  // XML RSS 2.0 TikTok Spec
  const itemsXml = products
    .map((p) => {
      const priceStr = `${p.regular_price.toFixed(2)} BDT`;
      const salePriceStr = p.sale_price && p.sale_price < p.regular_price ? `${p.sale_price.toFixed(2)} BDT` : null;
      const productUrl = `${baseUrl}/products/${p.slug}`;
      const imageUrl = p.og_image_url || `${baseUrl}/images/product-placeholder.png`;

      return `    <item>
      <g:id>${p.sku}</g:id>
      <g:sku><![CDATA[${p.sku}]]></g:sku>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description}]]></g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:brand><![CDATA[${p.brand_name}]]></g:brand>
      <g:condition>new</g:condition>
      <g:availability>${p.status === "published" ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${priceStr}</g:price>
      ${salePriceStr ? `<g:sale_price>${salePriceStr}</g:sale_price>\n      ` : ""}<g:google_product_category><![CDATA[Health & Beauty > Personal Care > Cosmetics > Skin Care]]></g:google_product_category>
      <g:product_type><![CDATA[${p.category_name}]]></g:product_type>
      <g:custom_label_0><![CDATA[TikTok Showcase]]></g:custom_label_0>
      <g:custom_label_1><![CDATA[${p.country || "Authentic"}]]></g:custom_label_1>
    </item>`;
    })
    .join("\n");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Blush &amp; Budget TikTok Product Catalog Feed</title>
    <link>${baseUrl}</link>
    <description>TikTok Catalog Manager XML Data Feed for Video Shopping Ads &amp; Dynamic Showcase</description>
${itemsXml}
  </channel>
</rss>`;

  return {
    content: xmlContent,
    contentType: "application/xml; charset=utf-8",
    filename: "tiktok_catalog_feed.xml",
  };
}

/**
 * Build Google Merchant Center Product Feed (Google Shopping & Free Listings)
 */
export async function generateGoogleFeed(baseUrl: string, format: FeedFormat = "xml"): Promise<{ content: string; contentType: string; filename: string }> {
  const products = await fetchPublishedProducts();

  if (format === "csv") {
    const headers = [
      "id",
      "title",
      "description",
      "link",
      "image_link",
      "availability",
      "price",
      "sale_price",
      "brand",
      "condition",
      "google_product_category",
      "product_type",
      "identifier_exists",
      "mpn",
      "custom_label_0",
      "custom_label_1",
    ];

    const rows = products.map((p) => {
      const priceStr = `${p.regular_price.toFixed(2)} BDT`;
      const salePriceStr = p.sale_price && p.sale_price < p.regular_price ? `${p.sale_price.toFixed(2)} BDT` : "";
      const productUrl = `${baseUrl}/products/${p.slug}`;
      const imageUrl = p.og_image_url || `${baseUrl}/images/product-placeholder.png`;

      return [
        escapeCsv(p.sku),
        escapeCsv(p.name),
        escapeCsv(p.description),
        escapeCsv(productUrl),
        escapeCsv(imageUrl),
        escapeCsv(p.status === "published" ? "in stock" : "out of stock"),
        escapeCsv(priceStr),
        escapeCsv(salePriceStr),
        escapeCsv(p.brand_name),
        escapeCsv("new"),
        escapeCsv("Health & Beauty > Personal Care > Cosmetics > Skin Care"),
        escapeCsv(p.category_name),
        escapeCsv("no"),
        escapeCsv(p.sku),
        escapeCsv(p.country || "Authentic"),
        escapeCsv(p.is_featured ? "Featured" : "Standard"),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    return {
      content: csvContent,
      contentType: "text/csv; charset=utf-8",
      filename: "google_merchant_feed.csv",
    };
  }

  // XML RSS 2.0 Google Merchant Center Format
  const itemsXml = products
    .map((p) => {
      const priceStr = `${p.regular_price.toFixed(2)} BDT`;
      const salePriceStr = p.sale_price && p.sale_price < p.regular_price ? `${p.sale_price.toFixed(2)} BDT` : null;
      const productUrl = `${baseUrl}/products/${p.slug}`;
      const imageUrl = p.og_image_url || `${baseUrl}/images/product-placeholder.png`;

      return `    <item>
      <g:id>${p.sku}</g:id>
      <g:mpn><![CDATA[${p.sku}]]></g:mpn>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description}]]></g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:brand><![CDATA[${p.brand_name}]]></g:brand>
      <g:condition>new</g:condition>
      <g:availability>${p.status === "published" ? "in stock" : "out of stock"}</g:availability>
      <g:price>${priceStr}</g:price>
      ${salePriceStr ? `<g:sale_price>${salePriceStr}</g:sale_price>\n      ` : ""}<g:google_product_category><![CDATA[Health & Beauty > Personal Care > Cosmetics > Skin Care]]></g:google_product_category>
      <g:product_type><![CDATA[${p.category_name}]]></g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
      <g:custom_label_0><![CDATA[${p.country || "Authentic"}]]></g:custom_label_0>
      <g:custom_label_1><![CDATA[${p.is_featured ? "Featured" : "Standard"}]]></g:custom_label_1>
    </item>`;
    })
    .join("\n");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Blush &amp; Budget Google Merchant Center Product Feed</title>
    <link>${baseUrl}</link>
    <description>Google Merchant Product XML Data Feed for Shopping and Free Listings</description>
${itemsXml}
  </channel>
</rss>`;

  return {
    content: xmlContent,
    contentType: "application/xml; charset=utf-8",
    filename: "google_merchant_feed.xml",
  };
}
