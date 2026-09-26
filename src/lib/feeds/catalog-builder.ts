import { createAdminClient } from "@/lib/supabase/admin";
import { getSettingsByGroup } from "@/lib/settings/config-service";
import { getShortProductId } from "@/lib/utils";

export type FeedPlatform = "meta" | "tiktok" | "google";
export type FeedFormat = "xml" | "csv";

export interface ProductFeedItem {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  slug: string;
  description: string;
  regular_price: number;
  sale_price: number | null;
  status: string;
  country: string | null;
  og_image_url: string | null;
  additional_images: string[];
  is_featured: boolean;
  weight: number;
  available_qty: number;
  brand_name: string;
  category_name: string;
  custom_label_0: string; // Origin Country
  custom_label_1: string; // Featured / Best Seller
  custom_label_2: string; // Price Bracket
  custom_label_3: string; // Stock Level
  custom_label_4: string; // Promotion Status
}

/**
 * Strips HTML tags, non-printable characters, and excessive whitespace for clean feed descriptions
 */
function cleanDescription(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
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
 * Determine dynamic price bracket for segmentation & bidding
 */
function getPriceBracket(price: number, currency: string): string {
  if (price < 1000) return `Under 1000 ${currency}`;
  if (price <= 2000) return `1000-2000 ${currency}`;
  if (price <= 3000) return `2000-3000 ${currency}`;
  return `Above 3000 ${currency}`;
}

/**
 * Fetch all active published products with enriched brand, category, media gallery, and inventory data
 */
async function fetchPublishedProducts(): Promise<{
  products: ProductFeedItem[];
  storeName: string;
  currency: string;
  deliveryCharge: number;
}> {
  const [supabase, generalSettings, logisticsSettings] = await Promise.all([
    createAdminClient(),
    getSettingsByGroup("general").catch(() => ({} as Record<string, any>)),
    getSettingsByGroup("logistics").catch(() => ({} as Record<string, any>)),
  ]);

  const defaultStoreName = generalSettings.store_name || "Azonno";
  const defaultCurrency = generalSettings.currency || "BDT";
  const defaultDeliveryCharge = Number(logisticsSettings.inside_dhaka_delivery_fee) || 60;

  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      sku,
      barcode,
      weight,
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
      ),
      product_media (
        position,
        is_featured,
        media (
          secure_url
        )
      ),
      inventory (
        available
      )
    `)
    .or("status.eq.active,status.eq.published")
    .is("deleted_at", null);

  if (error || !products) {
    return {
      products: [],
      storeName: defaultStoreName,
      currency: defaultCurrency,
      deliveryCharge: defaultDeliveryCharge,
    };
  }

  const mapped: ProductFeedItem[] = products.map((p: any) => {
    const brandName = p.brands?.name || defaultStoreName;
    const categoryName = p.categories?.[0]?.name || p.categories?.name || "Skincare & Cosmetics";
    const regularPrice = Number(p.regular_price) || 0;
    const salePrice = p.sale_price && Number(p.sale_price) < regularPrice ? Number(p.sale_price) : null;
    const availableQty = Number(p.inventory?.[0]?.available) || 15;
    const effectivePrice = salePrice || regularPrice;

    // Collect gallery images
    const galleryImages: string[] = [];
    if (Array.isArray(p.product_media)) {
      p.product_media.forEach((pm: any) => {
        const url = pm.media?.secure_url;
        if (url && url !== p.og_image_url && !galleryImages.includes(url)) {
          galleryImages.push(url);
        }
      });
    }

    const countryName = p.country?.trim() || "South Korea";
    const isFeatured = Boolean(p.is_featured);

    return {
      id: p.id,
      sku: getShortProductId(p) || p.sku || p.id.slice(0, 8),
      barcode: p.barcode || null,
      name: p.name,
      slug: p.slug,
      description: cleanDescription(p.description || p.short_description || p.name),
      regular_price: regularPrice,
      sale_price: salePrice,
      status: p.status,
      country: countryName,
      og_image_url: p.og_image_url || (galleryImages[0] ?? null),
      additional_images: galleryImages.slice(0, 10),
      is_featured: isFeatured,
      weight: Number(p.weight) || 0.15,
      available_qty: availableQty,
      brand_name: brandName,
      category_name: categoryName,
      custom_label_0: countryName,
      custom_label_1: isFeatured ? "Featured" : "Standard",
      custom_label_2: getPriceBracket(effectivePrice, defaultCurrency),
      custom_label_3: availableQty > 10 ? "In Stock Ready" : availableQty > 0 ? "Low Stock" : "Out of Stock",
      custom_label_4: salePrice ? "On Sale (Discounted)" : "Regular Price",
    };
  });

  return {
    products: mapped,
    storeName: defaultStoreName,
    currency: defaultCurrency,
    deliveryCharge: defaultDeliveryCharge,
  };
}

/**
 * Build Meta Commerce Manager Catalog (Facebook & Instagram Shop)
 * Complete 22+ Parameter Compliance with RSS 2.0 XML & RFC-4180 CSV
 */
export async function generateMetaFeed(
  baseUrl: string,
  format: FeedFormat = "xml"
): Promise<{ content: string; contentType: string; filename: string }> {
  const { products, storeName, currency, deliveryCharge } = await fetchPublishedProducts();

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
      "additional_image_link",
      "brand",
      "google_product_category",
      "fb_product_category",
      "product_type",
      "item_group_id",
      "gtin",
      "inventory",
      "shipping",
      "custom_label_0",
      "custom_label_1",
      "custom_label_2",
      "custom_label_3",
      "custom_label_4",
    ];

    const rows = products.map((p) => {
      const priceStr = `${p.regular_price.toFixed(2)} ${currency}`;
      const salePriceStr = p.sale_price ? `${p.sale_price.toFixed(2)} ${currency}` : "";
      const productUrl = `${baseUrl}/products/${p.slug}`;
      const imageUrl = p.og_image_url || `${baseUrl}/images/product_placeholder.svg`;
      const additionalImagesStr = p.additional_images.join(",");
      const shippingStr = `BD:Standard:${deliveryCharge.toFixed(2)} ${currency}`;

      return [
        escapeCsv(p.sku),
        escapeCsv(p.name),
        escapeCsv(p.description),
        escapeCsv(p.available_qty > 0 ? "in stock" : "out of stock"),
        escapeCsv("new"),
        escapeCsv(priceStr),
        escapeCsv(salePriceStr),
        escapeCsv(productUrl),
        escapeCsv(imageUrl),
        escapeCsv(additionalImagesStr),
        escapeCsv(p.brand_name),
        escapeCsv("Health & Beauty > Personal Care > Cosmetics > Skin Care"),
        escapeCsv("Health & Beauty > Personal Care > Cosmetics"),
        escapeCsv(`Health & Beauty > ${p.category_name}`),
        escapeCsv(p.id),
        escapeCsv(p.barcode || ""),
        escapeCsv(p.available_qty),
        escapeCsv(shippingStr),
        escapeCsv(p.custom_label_0),
        escapeCsv(p.custom_label_1),
        escapeCsv(p.custom_label_2),
        escapeCsv(p.custom_label_3),
        escapeCsv(p.custom_label_4),
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
      const priceStr = `${p.regular_price.toFixed(2)} ${currency}`;
      const salePriceStr = p.sale_price ? `${p.sale_price.toFixed(2)} ${currency}` : null;
      const productUrl = `${baseUrl}/products/${p.slug}`;
      const imageUrl = p.og_image_url || `${baseUrl}/images/product_placeholder.svg`;
      const additionalImagesXml = p.additional_images
        .map((img) => `      <g:additional_image_link>${img}</g:additional_image_link>`)
        .join("\n");

      return `    <item>
      <g:id>${p.sku}</g:id>
      <g:item_group_id>${p.id}</g:item_group_id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description}]]></g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
${additionalImagesXml ? `${additionalImagesXml}\n` : ""}\
      <g:brand><![CDATA[${p.brand_name}]]></g:brand>
      <g:condition>new</g:condition>
      <g:availability>${p.available_qty > 0 ? "in stock" : "out of stock"}</g:availability>
      <g:price>${priceStr}</g:price>
      ${salePriceStr ? `<g:sale_price>${salePriceStr}</g:sale_price>\n      ` : ""}\
<g:google_product_category><![CDATA[Health & Beauty > Personal Care > Cosmetics > Skin Care]]></g:google_product_category>
      <g:fb_product_category><![CDATA[Health & Beauty > Personal Care > Cosmetics]]></g:fb_product_category>
      <g:product_type><![CDATA[Health & Beauty > ${p.category_name}]]></g:product_type>
      ${p.barcode ? `<g:gtin>${p.barcode}</g:gtin>\n      ` : ""}\
<g:inventory>${p.available_qty}</g:inventory>
      <g:shipping>
        <g:country>BD</g:country>
        <g:service>Standard Doorstep Delivery</g:service>
        <g:price>${deliveryCharge.toFixed(2)} ${currency}</g:price>
      </g:shipping>
      <g:custom_label_0><![CDATA[${p.custom_label_0}]]></g:custom_label_0>
      <g:custom_label_1><![CDATA[${p.custom_label_1}]]></g:custom_label_1>
      <g:custom_label_2><![CDATA[${p.custom_label_2}]]></g:custom_label_2>
      <g:custom_label_3><![CDATA[${p.custom_label_3}]]></g:custom_label_3>
      <g:custom_label_4><![CDATA[${p.custom_label_4}]]></g:custom_label_4>
    </item>`;
    })
    .join("\n");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${storeName} Meta Product Catalog Feed</title>
    <link>${baseUrl}</link>
    <description>Authentic Products for Meta Commerce &amp; Instagram Shop</description>
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
 * Complete 20+ Parameter Compliance with RSS 2.0 XML & RFC-4180 CSV
 */
export async function generateTikTokFeed(
  baseUrl: string,
  format: FeedFormat = "xml"
): Promise<{ content: string; contentType: string; filename: string }> {
  const { products, storeName, currency } = await fetchPublishedProducts();

  if (format === "csv") {
    const headers = [
      "sku_id",
      "item_group_id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "sale_price",
      "link",
      "image_link",
      "additional_image_link",
      "brand",
      "google_product_category",
      "product_type",
      "mpn",
      "gtin",
      "age_group",
      "gender",
      "custom_label_0",
      "custom_label_1",
      "custom_label_2",
      "custom_label_3",
      "custom_label_4",
    ];

    const rows = products.map((p) => {
      const priceStr = `${p.regular_price.toFixed(2)} ${currency}`;
      const salePriceStr = p.sale_price ? `${p.sale_price.toFixed(2)} ${currency}` : "";
      const productUrl = `${baseUrl}/products/${p.slug}`;
      const imageUrl = p.og_image_url || `${baseUrl}/images/product_placeholder.svg`;
      const additionalImagesStr = p.additional_images.join(",");

      return [
        escapeCsv(p.sku),
        escapeCsv(p.id),
        escapeCsv(p.name),
        escapeCsv(p.description),
        escapeCsv(p.available_qty > 0 ? "in_stock" : "out_of_stock"),
        escapeCsv("new"),
        escapeCsv(priceStr),
        escapeCsv(salePriceStr),
        escapeCsv(productUrl),
        escapeCsv(imageUrl),
        escapeCsv(additionalImagesStr),
        escapeCsv(p.brand_name),
        escapeCsv("Health & Beauty > Personal Care > Cosmetics > Skin Care"),
        escapeCsv(`Health & Beauty > ${p.category_name}`),
        escapeCsv(p.sku),
        escapeCsv(p.barcode || ""),
        escapeCsv("adult"),
        escapeCsv("unisex"),
        escapeCsv("TikTok Showcase"),
        escapeCsv(p.custom_label_0),
        escapeCsv(p.custom_label_2),
        escapeCsv(p.custom_label_3),
        escapeCsv(p.custom_label_4),
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
      const priceStr = `${p.regular_price.toFixed(2)} ${currency}`;
      const salePriceStr = p.sale_price ? `${p.sale_price.toFixed(2)} ${currency}` : null;
      const productUrl = `${baseUrl}/products/${p.slug}`;
      const imageUrl = p.og_image_url || `${baseUrl}/images/product_placeholder.svg`;
      const additionalImagesXml = p.additional_images
        .map((img) => `      <g:additional_image_link>${img}</g:additional_image_link>`)
        .join("\n");

      return `    <item>
      <g:id>${p.sku}</g:id>
      <g:sku_id>${p.sku}</g:sku_id>
      <g:sku>${p.sku}</g:sku>
      <g:item_group_id>${p.id}</g:item_group_id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description}]]></g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
${additionalImagesXml ? `${additionalImagesXml}\n` : ""}\
      <g:brand><![CDATA[${p.brand_name}]]></g:brand>
      <g:condition>new</g:condition>
      <g:availability>${p.available_qty > 0 ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${priceStr}</g:price>
      ${salePriceStr ? `<g:sale_price>${salePriceStr}</g:sale_price>\n      ` : ""}\
<g:google_product_category><![CDATA[Health & Beauty > Personal Care > Cosmetics > Skin Care]]></g:google_product_category>
      <g:product_type><![CDATA[Health & Beauty > ${p.category_name}]]></g:product_type>
      <g:mpn>${p.sku}</g:mpn>
      ${p.barcode ? `<g:gtin>${p.barcode}</g:gtin>\n      ` : ""}\
<g:age_group>adult</g:age_group>
      <g:gender>unisex</g:gender>
      <g:custom_label_0><![CDATA[TikTok Showcase]]></g:custom_label_0>
      <g:custom_label_1><![CDATA[${p.custom_label_0}]]></g:custom_label_1>
      <g:custom_label_2><![CDATA[${p.custom_label_2}]]></g:custom_label_2>
      <g:custom_label_3><![CDATA[${p.custom_label_3}]]></g:custom_label_3>
      <g:custom_label_4><![CDATA[${p.custom_label_4}]]></g:custom_label_4>
    </item>`;
    })
    .join("\n");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${storeName} TikTok Product Catalog Feed</title>
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
 * Complete 24+ Parameter Compliance with RSS 2.0 XML & TSV/CSV
 */
export async function generateGoogleFeed(
  baseUrl: string,
  format: FeedFormat = "xml"
): Promise<{ content: string; contentType: string; filename: string }> {
  const { products, storeName, currency, deliveryCharge } = await fetchPublishedProducts();

  if (format === "csv") {
    const headers = [
      "id",
      "mpn",
      "item_group_id",
      "title",
      "description",
      "link",
      "image_link",
      "additional_image_link",
      "availability",
      "price",
      "sale_price",
      "brand",
      "condition",
      "google_product_category",
      "product_type",
      "identifier_exists",
      "gtin",
      "shipping_weight",
      "shipping",
      "adult",
      "gender",
      "age_group",
      "custom_label_0",
      "custom_label_1",
      "custom_label_2",
      "custom_label_3",
      "custom_label_4",
    ];

    const rows = products.map((p) => {
      const priceStr = `${p.regular_price.toFixed(2)} ${currency}`;
      const salePriceStr = p.sale_price ? `${p.sale_price.toFixed(2)} ${currency}` : "";
      const productUrl = `${baseUrl}/products/${p.slug}`;
      const imageUrl = p.og_image_url || `${baseUrl}/images/product_placeholder.svg`;
      const additionalImagesStr = p.additional_images.join(",");
      const shippingStr = `BD:Standard:${deliveryCharge.toFixed(2)} ${currency}`;

      return [
        escapeCsv(p.sku),
        escapeCsv(p.sku),
        escapeCsv(p.id),
        escapeCsv(p.name),
        escapeCsv(p.description),
        escapeCsv(productUrl),
        escapeCsv(imageUrl),
        escapeCsv(additionalImagesStr),
        escapeCsv(p.available_qty > 0 ? "in stock" : "out of stock"),
        escapeCsv(priceStr),
        escapeCsv(salePriceStr),
        escapeCsv(p.brand_name),
        escapeCsv("new"),
        escapeCsv("Health & Beauty > Personal Care > Cosmetics > Skin Care"),
        escapeCsv(`Health & Beauty > ${p.category_name}`),
        escapeCsv(p.barcode ? "yes" : "no"),
        escapeCsv(p.barcode || ""),
        escapeCsv(`${p.weight.toFixed(2)} kg`),
        escapeCsv(shippingStr),
        escapeCsv("no"),
        escapeCsv("unisex"),
        escapeCsv("adult"),
        escapeCsv(p.custom_label_0),
        escapeCsv(p.custom_label_1),
        escapeCsv(p.custom_label_2),
        escapeCsv(p.custom_label_3),
        escapeCsv(p.custom_label_4),
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
      const priceStr = `${p.regular_price.toFixed(2)} ${currency}`;
      const salePriceStr = p.sale_price ? `${p.sale_price.toFixed(2)} ${currency}` : null;
      const productUrl = `${baseUrl}/products/${p.slug}`;
      const imageUrl = p.og_image_url || `${baseUrl}/images/product_placeholder.svg`;
      const additionalImagesXml = p.additional_images
        .map((img) => `      <g:additional_image_link>${img}</g:additional_image_link>`)
        .join("\n");

      return `    <item>
      <g:id>${p.sku}</g:id>
      <g:mpn>${p.sku}</g:mpn>
      <g:item_group_id>${p.id}</g:item_group_id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description}]]></g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
${additionalImagesXml ? `${additionalImagesXml}\n` : ""}\
      <g:brand><![CDATA[${p.brand_name}]]></g:brand>
      <g:condition>new</g:condition>
      <g:availability>${p.available_qty > 0 ? "in stock" : "out of stock"}</g:availability>
      <g:price>${priceStr}</g:price>
      ${salePriceStr ? `<g:sale_price>${salePriceStr}</g:sale_price>\n      ` : ""}\
<g:google_product_category><![CDATA[Health & Beauty > Personal Care > Cosmetics > Skin Care]]></g:google_product_category>
      <g:product_type><![CDATA[Health & Beauty > ${p.category_name}]]></g:product_type>
      <g:identifier_exists>${p.barcode ? "yes" : "no"}</g:identifier_exists>
      ${p.barcode ? `<g:gtin>${p.barcode}</g:gtin>\n      ` : ""}\
<g:shipping_weight>${p.weight.toFixed(2)} kg</g:shipping_weight>
      <g:shipping>
        <g:country>BD</g:country>
        <g:service>Standard Doorstep Delivery</g:service>
        <g:price>${deliveryCharge.toFixed(2)} ${currency}</g:price>
      </g:shipping>
      <g:adult>no</g:adult>
      <g:gender>unisex</g:gender>
      <g:age_group>adult</g:age_group>
      <g:custom_label_0><![CDATA[${p.custom_label_0}]]></g:custom_label_0>
      <g:custom_label_1><![CDATA[${p.custom_label_1}]]></g:custom_label_1>
      <g:custom_label_2><![CDATA[${p.custom_label_2}]]></g:custom_label_2>
      <g:custom_label_3><![CDATA[${p.custom_label_3}]]></g:custom_label_3>
      <g:custom_label_4><![CDATA[${p.custom_label_4}]]></g:custom_label_4>
    </item>`;
    })
    .join("\n");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${storeName} Google Merchant Center Product Feed</title>
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
