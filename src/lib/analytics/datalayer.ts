/**
 * Professional GA4 & Meta Pixel DataLayer Engine
 *
 * Designed for pristine, clutter-free DataLayer Checker extension inspection:
 * - Clean GA4 Enhanced Ecommerce Schema (`ecommerce: { ... }`)
 * - Normalized Google User-Provided Data (`user_data: { ... }`)
 * - Standard Flat Meta / CAPI / GTM parameters (`content_id`, `contents`, `value`, `currency`, `transaction_id`, etc.)
 * - Recursive payload sanitizer (strips all `undefined`, `null`, and empty values dynamically)
 * - Single-fire deduplication sliding window
 */

import { trackMetaEvent } from "@/components/analytics/meta-pixel";
import { trackTikTokEvent } from "@/components/analytics/tiktok-pixel";

declare global {
  interface Window {
    dataLayer: Record<string, any>[];
    gtag?: (...args: any[]) => void;
  }
}

export interface CustomerData {
  email?: string;
  phone?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  external_id?: string;
  id?: string;
  user_id?: string;
  city?: string;
  district?: string;
  state?: string;
  division?: string;
  country?: string;
  zip?: string;
  postal_code?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  [key: string]: any;
}

export interface GA4Item {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_category4?: string;
  item_category5?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price: number;
  quantity?: number;
}

export interface MetaContentObject {
  id: string;
  quantity: number;
  item_price: number;
  price: number;
  item_name?: string;
  item_category?: string;
  item_brand?: string;
  item_variant?: string;
}

import { getResolvedCustomerIdentity } from "@/lib/analytics/customer-identity";

export const DEFAULT_CURRENCY = "BDT";

/**
 * Normalizes customer parameters into Google User-Provided Data structure.
 */
export function normalizeCustomerData(customer?: CustomerData | Record<string, any>): Record<string, any> | undefined {
  const resolved = getResolvedCustomerIdentity(customer);

  const email = resolved.email || undefined;
  const phone = resolved.phone ? resolved.phone.replace(/[^0-9+]/g, "") : undefined;
  const firstName = resolved.firstName || undefined;
  const lastName = resolved.lastName || undefined;
  const city = resolved.city || undefined;
  const state = resolved.state || undefined;
  const zip = resolved.zip || undefined;
  const country = resolved.country || "BD";
  const externalId = resolved.externalId || undefined;
  const userAgent = resolved.clientUserAgent || (typeof navigator !== "undefined" ? navigator.userAgent : undefined);

  const address: Record<string, any> = {};
  if (firstName) address.first_name = firstName;
  if (lastName) address.last_name = lastName;
  if (city) address.city = city;
  if (state) address.region = state;
  if (zip) address.postal_code = zip;
  if (country) address.country = country;

  const userData: Record<string, any> = {};
  if (email) userData.email = email;
  if (phone) userData.phone_number = phone;
  if (externalId) userData.external_id = externalId;
  if (userAgent) userData.client_user_agent = userAgent;
  if (customer?.client_ip_address) userData.client_ip_address = customer.client_ip_address;
  if (Object.keys(address).length > 0) userData.address = address;

  // Include flat customer identifiers for quick custom GTM variable access
  if (firstName) userData.first_name = firstName;
  if (lastName) userData.last_name = lastName;
  if (city) userData.city = city;
  if (state) userData.state = state;
  if (zip) userData.zip = zip;
  if (country) userData.country = country;

  return Object.keys(userData).length > 0 ? userData : undefined;
}

/**
 * Format an array of GA4Item into standard Meta `contents` array with zero undefined values.
 */
export function formatMetaContents(items: GA4Item[]): MetaContentObject[] {
  return items.map((it) => {
    const content: MetaContentObject = {
      id: String(it.item_id),
      quantity: Number(it.quantity) || 1,
      item_price: Number(it.price) || 0,
      price: Number(it.price) || 0,
    };
    if (it.item_name) content.item_name = it.item_name;
    if (it.item_category) content.item_category = it.item_category;
    if (it.item_brand) content.item_brand = it.item_brand;
    if (it.item_variant) content.item_variant = it.item_variant;
    return content;
  });
}

/**
 * Format an array of GA4Item into clean standard GA4 items payload.
 */
export function formatGA4Items(items: GA4Item[]): Record<string, any>[] {
  return items.map((it, idx) => {
    const item: Record<string, any> = {
      item_id: String(it.item_id),
      item_name: it.item_name || "Product",
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      index: it.index !== undefined ? it.index : idx + 1,
    };
    if (it.item_brand) item.item_brand = it.item_brand;
    if (it.item_category) item.item_category = it.item_category;
    if (it.item_category2) item.item_category2 = it.item_category2;
    if (it.item_category3) item.item_category3 = it.item_category3;
    if (it.item_category4) item.item_category4 = it.item_category4;
    if (it.item_category5) item.item_category5 = it.item_category5;
    if (it.item_variant) item.item_variant = it.item_variant;
    if (it.coupon) item.coupon = it.coupon;
    if (it.discount !== undefined && it.discount > 0) item.discount = it.discount;
    if (it.affiliation) item.affiliation = it.affiliation;
    if (it.item_list_id) item.item_list_id = it.item_list_id;
    if (it.item_list_name) item.item_list_name = it.item_list_name;
    if (it.location_id) item.location_id = it.location_id;
    return item;
  });
}

/**
 * Dynamic Recursive Sanitizer:
 * Recursively strips out all `undefined`, `null`, and empty values.
 * Gives DataLayer Checker extensions a clean, professional, pristine output.
 */
export function sanitizePayload<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};

  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined || val === null || val === "") continue;

    if (Array.isArray(val)) {
      if (val.length === 0) continue;
      const sanitizedArray = val
        .map((v) => (typeof v === "object" && v !== null ? sanitizePayload(v) : v))
        .filter((v) => v !== undefined && v !== null);
      if (sanitizedArray.length > 0) {
        cleaned[key] = sanitizedArray;
      }
    } else if (typeof val === "object") {
      const subCleaned = sanitizePayload(val);
      if (Object.keys(subCleaned).length > 0) {
        cleaned[key] = subCleaned;
      }
    } else {
      cleaned[key] = val;
    }
  }

  return cleaned as T;
}

// In-memory sliding window deduplication cache
const recentDataLayerTimestamps = new Map<string, number>();
const DATALAYER_DEDUP_WINDOW_MS = 1200;

/**
 * Checks if an event is a duplicate within the deduplication window.
 */
export function isDuplicateEvent(payload: Record<string, any>): boolean {
  if (typeof window === "undefined") return false;

  const eventName = payload.event || payload.event_name || "custom_event";

  // Strict persistent deduplication for Purchase / Refund
  if (eventName === "purchase" || eventName === "Purchase") {
    const transactionId = payload.transaction_id || payload.order_id;
    if (transactionId) {
      const storageKey = `ecomx_dedup_purchase_${transactionId}`;
      try {
        if (sessionStorage.getItem(storageKey)) {
          return true;
        }
        sessionStorage.setItem(storageKey, "1");
      } catch {
        // Ignore storage errors
      }
    }
  }

  const contentSignature =
    payload.transaction_id ||
    payload.order_id ||
    payload.content_id ||
    (Array.isArray(payload.content_ids) ? payload.content_ids.join(",") : "") ||
    payload.page_path ||
    payload.search_term ||
    payload.category_name ||
    "";

  const eventFingerprint = `${eventName}::${contentSignature}::${payload.value || 0}`;
  const now = Date.now();
  const lastFiredTime = recentDataLayerTimestamps.get(eventFingerprint);

  if (lastFiredTime && now - lastFiredTime < DATALAYER_DEDUP_WINDOW_MS) {
    return true;
  }

  recentDataLayerTimestamps.set(eventFingerprint, now);

  if (recentDataLayerTimestamps.size > 200) {
    for (const [key, time] of recentDataLayerTimestamps.entries()) {
      if (now - time > 10000) recentDataLayerTimestamps.delete(key);
    }
  }

  return false;
}

/**
 * Pushes raw event or payload to the global dataLayer array cleanly.
 * Automatically clears previous ecommerce state `{ ecommerce: null }` before ecommerce events.
 */
export function pushToDataLayer(payload: Record<string, any>): void {
  if (typeof window === "undefined") return;
  if (typeof window.location !== "undefined" && window.location.pathname.startsWith("/admin")) return;

  if (isDuplicateEvent(payload)) {
    return;
  }

  window.dataLayer = window.dataLayer || [];

  if (payload.ecommerce) {
    window.dataLayer.push({ ecommerce: null });
  }

  const cleanPayload = sanitizePayload(payload);
  window.dataLayer.push(cleanPayload);

  // Record GA4 DataLayer Event to Live Event Logger
  try {
    fetch("/api/analytics/live-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "datalayer_ga4",
        eventName: cleanPayload.event || "datalayer_push",
        eventId: cleanPayload.transaction_id || cleanPayload.order_id || cleanPayload.content_id || undefined,
        sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        payload: cleanPayload,
        status: "success",
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

// ============================================================================
// 1. PageView (GA4: page_view | Meta: PageView)
// ============================================================================
export function trackPageView(pagePath: string, pageTitle?: string, customer?: CustomerData): void {
  if (pagePath.startsWith("/admin")) return;
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return;

  const title = pageTitle || (typeof document !== "undefined" ? document.title : "");
  const location = typeof window !== "undefined" ? window.location.href : "";
  const userData = normalizeCustomerData(customer);
  const eventId = `pv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  pushToDataLayer({
    event: "page_view",
    page_path: pagePath,
    page_title: title,
    page_location: location,
    user_data: userData,
  });

  trackMetaEvent("PageView", {}, customer, eventId);
  trackTikTokEvent("PageView", {}, customer, eventId);
}

// ============================================================================
// 2. ViewContent / ViewItem (GA4: view_item | Meta: ViewContent)
// ============================================================================
export function trackViewContent(
  item: GA4Item,
  currency: string = DEFAULT_CURRENCY,
  customer?: CustomerData
): void {
  const itemPrice = Number(item.price) || 0;
  const quantity = item.quantity || 1;
  const value = itemPrice * quantity;
  const contents = formatMetaContents([item]);
  const formattedItems = formatGA4Items([item]);
  const userData = normalizeCustomerData(customer);
  const eventId = `vc_${item.item_id}_${Date.now()}`;

  pushToDataLayer({
    event: "view_item",
    content_id: item.item_id,
    content_ids: [item.item_id],
    content_name: item.item_name,
    content_type: "product",
    content_category: item.item_category,
    contents,
    item_id: item.item_id,
    item_name: item.item_name,
    item_category: item.item_category,
    item_brand: item.item_brand,
    item_variant: item.item_variant,
    quantity,
    price: itemPrice,
    value,
    currency,
    user_data: userData,
    ecommerce: {
      currency,
      value,
      items: formattedItems,
    },
  });

  trackMetaEvent(
    "ViewContent",
    {
      content_id: item.item_id,
      content_ids: [item.item_id],
      content_name: item.item_name,
      content_type: "product",
      content_category: item.item_category,
      contents,
      value,
      currency,
      num_items: quantity,
    },
    customer,
    eventId
  );

  trackTikTokEvent(
    "ViewContent",
    {
      content_id: item.item_id,
      content_ids: [item.item_id],
      content_name: item.item_name,
      content_type: "product",
      content_category: item.item_category,
      contents: [
        {
          content_id: item.item_id,
          content_name: item.item_name,
          price: itemPrice,
          quantity,
        },
      ],
      value,
      currency,
      quantity,
    },
    customer,
    eventId
  );
}

// ============================================================================
// 3. Search (GA4: search | Meta: Search)
// ============================================================================
export function trackSearch(searchTerm: string, customer?: CustomerData): void {
  if (!searchTerm.trim()) return;
  const userData = normalizeCustomerData(customer);

  pushToDataLayer({
    event: "search",
    search_term: searchTerm.trim(),
    content_category: "Product Search",
    user_data: userData,
  });

  trackMetaEvent(
    "Search",
    {
      search_string: searchTerm.trim(),
      content_category: "Product Search",
    },
    customer
  );

  trackTikTokEvent(
    "Search",
    {
      query: searchTerm.trim(),
      search_string: searchTerm.trim(),
    },
    customer
  );
}

// ============================================================================
// 4. ViewCategory (GA4: view_item_list | Meta: ViewCategory)
// ============================================================================
export function trackViewCategory(
  categoryName: string,
  categoryId?: string,
  items: GA4Item[] = [],
  currency: string = DEFAULT_CURRENCY,
  customer?: CustomerData
): void {
  const formattedItems = items.map((item, idx) => ({
    ...item,
    index: item.index !== undefined ? item.index : idx + 1,
    item_category: categoryName,
    item_list_name: `Category: ${categoryName}`,
    item_list_id: categoryId || `cat_${categoryName.toLowerCase().replace(/\s+/g, "_")}`,
  }));

  const contentIds = items.map((i) => i.item_id);
  const contents = formatMetaContents(formattedItems);
  const totalValue = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1), 0);
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const userData = normalizeCustomerData(customer);

  pushToDataLayer({
    event: "view_category",
    category_name: categoryName,
    category_id: categoryId,
    content_ids: contentIds,
    content_name: categoryName,
    content_type: "product_group",
    content_category: categoryName,
    contents,
    value: totalValue,
    currency,
    user_data: userData,
    ecommerce: {
      item_list_id: categoryId || "category_list",
      item_list_name: `Category: ${categoryName}`,
      items: formatGA4Items(formattedItems),
    },
  });

  trackMetaEvent(
    "ViewCategory",
    {
      content_name: categoryName,
      content_category: categoryName,
      content_type: "product_group",
      content_ids: contentIds,
      contents,
      value: totalValue,
      currency,
      num_items: totalQuantity,
    },
    customer
  );

  trackTikTokEvent(
    "ViewContent",
    {
      content_name: categoryName,
      content_category: categoryName,
      content_type: "product_group",
      content_id: contentIds[0],
      content_ids: contentIds,
      contents: formattedItems.map((it) => ({
        content_id: it.item_id,
        content_name: it.item_name,
        price: Number(it.price) || 0,
        quantity: it.quantity || 1,
      })),
      value: totalValue,
      currency,
      quantity: totalQuantity,
    },
    customer
  );
}

// ============================================================================
// 5. ViewItemList (GA4: view_item_list | Meta: ViewItemList)
// ============================================================================
export function trackViewItemList(
  items: GA4Item[],
  itemListName: string = "Product Catalog",
  itemListId: string = "catalog",
  currency: string = DEFAULT_CURRENCY,
  customer?: CustomerData
): void {
  if (!items || items.length === 0) return;

  const formattedItems = items.map((item, idx) => ({
    ...item,
    index: item.index !== undefined ? item.index : idx + 1,
    item_list_name: itemListName,
    item_list_id: itemListId,
  }));

  const contentIds = items.map((it) => it.item_id);
  const contents = formatMetaContents(formattedItems);
  const totalValue = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1), 0);
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const userData = normalizeCustomerData(customer);

  pushToDataLayer({
    event: "view_item_list",
    item_list_id: itemListId,
    item_list_name: itemListName,
    content_ids: contentIds,
    content_name: itemListName,
    content_type: "product_group",
    contents,
    value: totalValue,
    currency,
    user_data: userData,
    ecommerce: {
      item_list_id: itemListId,
      item_list_name: itemListName,
      items: formatGA4Items(formattedItems),
    },
  });

  trackMetaEvent(
    "ViewItemList",
    {
      content_name: itemListName,
      item_list_name: itemListName,
      content_type: "product_group",
      content_ids: contentIds,
      contents,
      value: totalValue,
      currency,
      num_items: totalQuantity,
    },
    customer
  );

  trackTikTokEvent(
    "ViewContent",
    {
      content_name: itemListName,
      content_type: "product_group",
      content_id: contentIds[0],
      content_ids: contentIds,
      contents: formattedItems.map((it) => ({
        content_id: it.item_id,
        content_name: it.item_name,
        price: Number(it.price) || 0,
        quantity: it.quantity || 1,
      })),
      value: totalValue,
      currency,
      quantity: totalQuantity,
    },
    customer
  );
}

// ============================================================================
// 6. SelectItem (GA4: select_item | Meta: SelectItem)
// ============================================================================
export function trackSelectItem(
  item: GA4Item,
  itemListName: string = "Product Catalog",
  itemListId: string = "catalog",
  currency: string = DEFAULT_CURRENCY,
  customer?: CustomerData
): void {
  const itemPrice = Number(item.price) || 0;
  const quantity = item.quantity || 1;
  const value = itemPrice * quantity;
  const contents = formatMetaContents([item]);
  const formattedItems = formatGA4Items([{ ...item, item_list_name: itemListName, item_list_id: itemListId }]);
  const userData = normalizeCustomerData(customer);

  pushToDataLayer({
    event: "select_item",
    content_id: item.item_id,
    content_name: item.item_name,
    content_category: item.item_category,
    contents,
    item_id: item.item_id,
    item_name: item.item_name,
    item_category: item.item_category,
    item_brand: item.item_brand,
    item_variant: item.item_variant,
    item_list_id: itemListId,
    item_list_name: itemListName,
    quantity,
    price: itemPrice,
    currency,
    user_data: userData,
    ecommerce: {
      item_list_id: itemListId,
      item_list_name: itemListName,
      items: formattedItems,
    },
  });

  trackMetaEvent(
    "SelectItem",
    {
      content_id: item.item_id,
      content_ids: [item.item_id],
      content_name: item.item_name,
      content_category: item.item_category,
      content_type: "product",
      contents,
      value,
      currency,
      num_items: quantity,
    },
    customer
  );

  trackTikTokEvent(
    "ViewContent",
    {
      content_id: item.item_id,
      content_ids: [item.item_id],
      content_name: item.item_name,
      content_category: item.item_category,
      content_type: "product",
      contents: [
        {
          content_id: item.item_id,
          content_name: item.item_name,
          price: itemPrice,
          quantity,
        },
      ],
      value,
      currency,
      quantity,
    },
    customer
  );
}

// ============================================================================
// 7. ViewItem (GA4: view_item | Meta: ViewContent)
// ============================================================================
export function trackViewItem(
  item: GA4Item,
  currency: string = DEFAULT_CURRENCY,
  customer?: CustomerData
): void {
  trackViewContent(item, currency, customer);
}

// ============================================================================
// 8. AddToWishlist (GA4: add_to_wishlist | Meta: AddToWishlist)
// ============================================================================
export function trackAddToWishlist(
  items: GA4Item[],
  value?: number,
  currency: string = DEFAULT_CURRENCY,
  customer?: CustomerData
): void {
  if (!items || items.length === 0) return;

  const totalValue = value !== undefined ? value : items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1), 0);
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const contentIds = items.map((it) => it.item_id);
  const contents = formatMetaContents(items);
  const firstItem = items[0];
  const userData = normalizeCustomerData(customer);

  pushToDataLayer({
    event: "add_to_wishlist",
    content_id: firstItem?.item_id,
    content_ids: contentIds,
    content_name: firstItem?.item_name,
    content_type: "product",
    content_category: firstItem?.item_category,
    contents,
    value: totalValue,
    currency,
    user_data: userData,
    ecommerce: {
      currency,
      value: totalValue,
      items: formatGA4Items(items),
    },
  });

  trackMetaEvent(
    "AddToWishlist",
    {
      content_id: firstItem?.item_id,
      content_ids: contentIds,
      content_name: firstItem?.item_name,
      content_category: firstItem?.item_category,
      content_type: "product",
      contents,
      value: totalValue,
      currency,
      num_items: totalQuantity,
    },
    customer
  );

  trackTikTokEvent(
    "AddToWishlist",
    {
      content_id: firstItem?.item_id,
      content_ids: contentIds,
      content_name: firstItem?.item_name,
      content_category: firstItem?.item_category,
      content_type: "product",
      contents: items.map((it) => ({
        content_id: it.item_id,
        content_name: it.item_name,
        price: Number(it.price) || 0,
        quantity: it.quantity || 1,
      })),
      value: totalValue,
      currency,
      quantity: totalQuantity,
    },
    customer
  );
}

// ============================================================================
// 9. AddToCart (GA4: add_to_cart | Meta: AddToCart)
// ============================================================================
export function trackAddToCart(
  items: GA4Item[],
  value?: number,
  currency: string = DEFAULT_CURRENCY,
  customer?: CustomerData
): void {
  if (!items || items.length === 0) return;

  const totalValue = value !== undefined ? value : items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1), 0);
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const contentIds = items.map((it) => it.item_id);
  const contents = formatMetaContents(items);
  const firstItem = items[0];
  const userData = normalizeCustomerData(customer);
  const eventId = `atc_${firstItem?.item_id || Date.now()}_${Date.now()}`;

  pushToDataLayer({
    event: "add_to_cart",
    content_id: firstItem?.item_id,
    content_ids: contentIds,
    content_name: firstItem?.item_name,
    content_type: "product",
    content_category: firstItem?.item_category,
    contents,
    quantity: totalQuantity,
    price: firstItem?.price,
    value: totalValue,
    currency,
    user_data: userData,
    ecommerce: {
      currency,
      value: totalValue,
      items: formatGA4Items(items),
    },
  });

  trackMetaEvent(
    "AddToCart",
    {
      content_id: firstItem?.item_id,
      content_ids: contentIds,
      content_name: firstItem?.item_name,
      content_category: firstItem?.item_category,
      content_type: "product",
      contents,
      value: totalValue,
      currency,
      num_items: totalQuantity,
    },
    customer,
    eventId
  );

  trackTikTokEvent(
    "AddToCart",
    {
      content_id: firstItem?.item_id,
      content_ids: contentIds,
      content_name: firstItem?.item_name,
      content_type: "product",
      content_category: firstItem?.item_category,
      contents: items.map((it) => ({
        content_id: it.item_id,
        content_name: it.item_name,
        price: Number(it.price) || 0,
        quantity: it.quantity || 1,
      })),
      value: totalValue,
      currency,
      quantity: totalQuantity,
    },
    customer,
    eventId
  );
}

// ============================================================================
// 10. ViewCart (GA4: view_cart | Meta: ViewCart)
// ============================================================================
export function trackViewCart(
  items: GA4Item[],
  value?: number,
  currency: string = DEFAULT_CURRENCY,
  customer?: CustomerData
): void {
  if (!items || items.length === 0) return;

  const totalValue = value !== undefined ? value : items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1), 0);
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const contentIds = items.map((it) => it.item_id);
  const contents = formatMetaContents(items);
  const userData = normalizeCustomerData(customer);
  const eventId = `vc_cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  pushToDataLayer({
    event: "view_cart",
    content_ids: contentIds,
    content_type: "product",
    contents,
    value: totalValue,
    currency,
    num_items: totalQuantity,
    user_data: userData,
    ecommerce: {
      currency,
      value: totalValue,
      items: formatGA4Items(items),
    },
  });

  trackMetaEvent(
    "ViewCart",
    {
      content_id: contentIds[0],
      content_ids: contentIds,
      content_type: "product",
      contents,
      value: totalValue,
      currency,
      num_items: totalQuantity,
    },
    customer,
    eventId
  );

  trackTikTokEvent(
    "ViewCart",
    {
      content_id: contentIds[0],
      content_ids: contentIds,
      content_type: "product",
      contents: items.map((it) => ({
        content_id: it.item_id,
        content_name: it.item_name,
        price: Number(it.price) || 0,
        quantity: it.quantity || 1,
      })),
      value: totalValue,
      currency,
      quantity: totalQuantity,
    },
    customer,
    eventId
  );
}

// ============================================================================
// 11. RemoveFromCart (GA4: remove_from_cart | Meta: RemoveFromCart)
// ============================================================================
export function trackRemoveFromCart(
  items: GA4Item[],
  value?: number,
  currency: string = DEFAULT_CURRENCY,
  customer?: CustomerData
): void {
  if (!items || items.length === 0) return;

  const totalValue = value !== undefined ? value : items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1), 0);
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const contentIds = items.map((it) => it.item_id);
  const contents = formatMetaContents(items);
  const firstItem = items[0];
  const userData = normalizeCustomerData(customer);
  const eventId = `rfc_${firstItem?.item_id || Date.now()}_${Date.now()}`;

  pushToDataLayer({
    event: "remove_from_cart",
    content_id: firstItem?.item_id,
    content_ids: contentIds,
    content_name: firstItem?.item_name,
    content_type: "product",
    contents,
    value: totalValue,
    currency,
    user_data: userData,
    ecommerce: {
      currency,
      value: totalValue,
      items: formatGA4Items(items),
    },
  });

  trackMetaEvent(
    "RemoveFromCart",
    {
      content_id: firstItem?.item_id,
      content_ids: contentIds,
      content_name: firstItem?.item_name,
      content_category: firstItem?.item_category,
      content_type: "product",
      contents,
      value: totalValue,
      currency,
      num_items: totalQuantity,
    },
    customer,
    eventId
  );

  trackTikTokEvent(
    "RemoveFromCart",
    {
      content_id: firstItem?.item_id,
      content_ids: contentIds,
      content_name: firstItem?.item_name,
      content_category: firstItem?.item_category,
      content_type: "product",
      contents: items.map((it) => ({
        content_id: it.item_id,
        content_name: it.item_name,
        price: Number(it.price) || 0,
        quantity: it.quantity || 1,
      })),
      value: totalValue,
      currency,
      quantity: totalQuantity,
    },
    customer,
    eventId
  );
}

// ============================================================================
// 12. InitiateCheckout / BeginCheckout (GA4: begin_checkout | Meta: InitiateCheckout)
// ============================================================================
export interface CheckoutEventParams {
  items: GA4Item[];
  value?: number;
  currency?: string;
  coupon?: string;
  discount?: number;
  customer?: CustomerData;
}

export function trackInitiateCheckout(
  paramsOrItems: CheckoutEventParams | GA4Item[],
  legacyValue?: number,
  legacyCoupon?: string,
  currency: string = DEFAULT_CURRENCY
): void {
  let items: GA4Item[] = [];
  let value: number | undefined;
  let coupon: string | undefined;
  let discount: number | undefined;
  let customer: CustomerData | undefined;
  let curr = currency;

  if (Array.isArray(paramsOrItems)) {
    items = paramsOrItems;
    value = legacyValue;
    coupon = legacyCoupon;
  } else {
    items = paramsOrItems.items || [];
    value = paramsOrItems.value;
    coupon = paramsOrItems.coupon;
    discount = paramsOrItems.discount;
    customer = paramsOrItems.customer;
    curr = paramsOrItems.currency || currency;
  }

  if (items.length === 0) return;

  const totalValue = value !== undefined ? value : items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1), 0);
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const contentIds = items.map((it) => it.item_id);
  const contents = formatMetaContents(items);
  const userData = normalizeCustomerData(customer);
  const eventId = `ic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  pushToDataLayer({
    event: "begin_checkout",
    content_ids: contentIds,
    content_type: "product",
    contents,
    value: totalValue,
    currency: curr,
    coupon,
    discount,
    num_items: totalQuantity,
    user_data: userData,
    ecommerce: {
      currency: curr,
      value: totalValue,
      coupon,
      items: formatGA4Items(items),
    },
  });

  trackMetaEvent(
    "InitiateCheckout",
    {
      content_id: contentIds[0],
      content_ids: contentIds,
      content_type: "product",
      contents,
      value: totalValue,
      currency: curr,
      num_items: totalQuantity,
      coupon,
      discount,
    },
    customer,
    eventId
  );

  trackTikTokEvent(
    "InitiateCheckout",
    {
      content_id: contentIds[0],
      content_ids: contentIds,
      content_type: "product",
      contents: items.map((it) => ({
        content_id: it.item_id,
        content_name: it.item_name,
        price: Number(it.price) || 0,
        quantity: it.quantity || 1,
      })),
      value: totalValue,
      currency: curr,
      quantity: totalQuantity,
      coupon,
    },
    customer,
    eventId
  );
}

export const trackBeginCheckout = trackInitiateCheckout;

// ============================================================================
// 13. AddShippingInfo (GA4: add_shipping_info | Meta: AddShippingInfo)
// ============================================================================
export interface ShippingInfoParams {
  items: GA4Item[];
  value?: number;
  shipping_tier?: string;
  shipping?: number;
  coupon?: string;
  discount?: number;
  currency?: string;
  customer?: CustomerData;
}

export function trackAddShippingInfo(
  paramsOrItems: ShippingInfoParams | GA4Item[],
  legacyValue?: number,
  legacyTier: string = "Standard Delivery",
  legacyCoupon?: string,
  currency: string = DEFAULT_CURRENCY
): void {
  let items: GA4Item[] = [];
  let value: number | undefined;
  let shippingTier = legacyTier;
  let shipping: number | undefined;
  let coupon: string | undefined;
  let discount: number | undefined;
  let customer: CustomerData | undefined;
  let curr = currency;

  if (Array.isArray(paramsOrItems)) {
    items = paramsOrItems;
    value = legacyValue;
    shippingTier = legacyTier;
    coupon = legacyCoupon;
  } else {
    items = paramsOrItems.items || [];
    value = paramsOrItems.value;
    shippingTier = paramsOrItems.shipping_tier || "Standard Delivery";
    shipping = paramsOrItems.shipping;
    coupon = paramsOrItems.coupon;
    discount = paramsOrItems.discount;
    customer = paramsOrItems.customer;
    curr = paramsOrItems.currency || currency;
  }

  if (items.length === 0) return;

  const totalValue = value !== undefined ? value : items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1), 0);
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const contentIds = items.map((it) => it.item_id);
  const contents = formatMetaContents(items);
  const userData = normalizeCustomerData(customer);
  const eventId = `asi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  pushToDataLayer({
    event: "add_shipping_info",
    content_ids: contentIds,
    contents,
    value: totalValue,
    currency: curr,
    shipping,
    shipping_tier: shippingTier,
    coupon,
    discount,
    num_items: totalQuantity,
    user_data: userData,
    ecommerce: {
      currency: curr,
      value: totalValue,
      coupon,
      shipping_tier: shippingTier,
      items: formatGA4Items(items),
    },
  });

  trackMetaEvent(
    "AddShippingInfo",
    {
      content_id: contentIds[0],
      content_ids: contentIds,
      content_type: "product",
      contents,
      value: totalValue,
      currency: curr,
      num_items: totalQuantity,
      shipping_tier: shippingTier,
      shipping,
      coupon,
      discount,
    },
    customer,
    eventId
  );

  trackTikTokEvent(
    "AddShippingInfo",
    {
      content_id: contentIds[0],
      content_ids: contentIds,
      content_type: "product",
      contents: items.map((it) => ({
        content_id: it.item_id,
        content_name: it.item_name,
        price: Number(it.price) || 0,
        quantity: it.quantity || 1,
      })),
      value: totalValue,
      currency: curr,
      quantity: totalQuantity,
      shipping_tier: shippingTier,
    },
    customer,
    eventId
  );
}

// ============================================================================
// 14. AddPaymentInfo (GA4: add_payment_info | Meta: AddPaymentInfo)
// ============================================================================
export interface PaymentInfoParams {
  items: GA4Item[];
  value?: number;
  payment_type?: string;
  coupon?: string;
  discount?: number;
  currency?: string;
  customer?: CustomerData;
}

export function trackAddPaymentInfo(
  paramsOrItems: PaymentInfoParams | GA4Item[],
  legacyValue?: number,
  legacyPaymentType: string = "Cash on Delivery",
  legacyCoupon?: string,
  currency: string = DEFAULT_CURRENCY
): void {
  let items: GA4Item[] = [];
  let value: number | undefined;
  let paymentType = legacyPaymentType;
  let coupon: string | undefined;
  let discount: number | undefined;
  let customer: CustomerData | undefined;
  let curr = currency;

  if (Array.isArray(paramsOrItems)) {
    items = paramsOrItems;
    value = legacyValue;
    paymentType = legacyPaymentType;
    coupon = legacyCoupon;
  } else {
    items = paramsOrItems.items || [];
    value = paramsOrItems.value;
    paymentType = paramsOrItems.payment_type || "Cash on Delivery";
    coupon = paramsOrItems.coupon;
    discount = paramsOrItems.discount;
    customer = paramsOrItems.customer;
    curr = paramsOrItems.currency || currency;
  }

  if (items.length === 0) return;

  const totalValue = value !== undefined ? value : items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1), 0);
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const contentIds = items.map((it) => it.item_id);
  const contents = formatMetaContents(items);
  const userData = normalizeCustomerData(customer);
  const eventId = `api_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  pushToDataLayer({
    event: "add_payment_info",
    content_ids: contentIds,
    contents,
    value: totalValue,
    currency: curr,
    payment_type: paymentType,
    coupon,
    discount,
    num_items: totalQuantity,
    user_data: userData,
    ecommerce: {
      currency: curr,
      value: totalValue,
      coupon,
      payment_type: paymentType,
      items: formatGA4Items(items),
    },
  });

  trackMetaEvent(
    "AddPaymentInfo",
    {
      content_id: contentIds[0],
      content_ids: contentIds,
      content_type: "product",
      contents,
      value: totalValue,
      currency: curr,
      num_items: totalQuantity,
      payment_type: paymentType,
      coupon,
      discount,
    },
    customer,
    eventId
  );

  trackTikTokEvent(
    "AddPaymentInfo",
    {
      content_id: contentIds[0],
      content_ids: contentIds,
      content_type: "product",
      contents: items.map((it) => ({
        content_id: it.item_id,
        content_name: it.item_name,
        price: Number(it.price) || 0,
        quantity: it.quantity || 1,
      })),
      value: totalValue,
      currency: curr,
      quantity: totalQuantity,
      payment_type: paymentType,
    },
    customer,
    eventId
  );
}

export interface PurchaseEventParams {
  transaction_id: string;
  order_id?: string;
  value: number;
  tax?: number;
  shipping?: number;
  currency?: string;
  coupon?: string;
  discount?: number;
  payment_type?: string;
  customer?: CustomerData;
  items: GA4Item[];
  suppressMetaPixel?: boolean;
  suppressTikTokPixel?: boolean;
}

export function trackPurchase(params: PurchaseEventParams): void {
  if (!params.transaction_id || !params.items || params.items.length === 0) return;

  const curr = (params.currency || DEFAULT_CURRENCY).trim().toUpperCase();
  const totalVal = Number(params.value) || 0;
  const contentIds = params.items.map((it) => it.item_id);
  const contents = formatMetaContents(params.items);
  const totalQuantity = params.items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const userData = normalizeCustomerData(params.customer);
  const txId = params.transaction_id || params.order_id;
  const eventId = `order_${txId}`;

  pushToDataLayer({
    event: "purchase",
    transaction_id: txId,
    order_id: txId,
    value: totalVal,
    currency: curr,
    tax: params.tax !== undefined ? Number(params.tax) : 0,
    shipping: params.shipping !== undefined ? Number(params.shipping) : 0,
    coupon: params.coupon,
    discount: params.discount !== undefined ? Number(params.discount) : 0,
    payment_type: params.payment_type || "Cash on Delivery",
    content_ids: contentIds,
    content_type: "product",
    contents,
    num_items: totalQuantity,
    user_data: userData,
    ecommerce: {
      transaction_id: txId,
      value: totalVal,
      tax: params.tax !== undefined ? Number(params.tax) : 0,
      shipping: params.shipping !== undefined ? Number(params.shipping) : 0,
      currency: curr,
      coupon: params.coupon,
      discount: params.discount !== undefined ? Number(params.discount) : 0,
      payment_type: params.payment_type || "Cash on Delivery",
      items: formatGA4Items(params.items),
    },
  });

  if (!params.suppressMetaPixel) {
    trackMetaEvent(
      "Purchase",
      {
        content_id: contentIds[0],
        content_ids: contentIds,
        content_type: "product",
        contents,
        currency: curr,
        value: totalVal,
        num_items: totalQuantity,
        order_id: txId,
        transaction_id: txId,
        payment_type: params.payment_type || "Cash on Delivery",
        shipping: params.shipping,
        tax: params.tax,
        coupon: params.coupon,
        discount: params.discount,
      },
      params.customer,
      eventId
    );
  }

  if (!params.suppressTikTokPixel) {
    trackTikTokEvent(
      "CompletePayment",
      {
        content_id: contentIds[0],
        content_ids: contentIds,
        content_type: "product",
        contents: params.items.map((it) => ({
          content_id: it.item_id,
          content_name: it.item_name,
          price: Number(it.price) || 0,
          quantity: it.quantity || 1,
        })),
        currency: curr,
        value: params.value,
        quantity: totalQuantity,
        order_id: txId,
        payment_type: params.payment_type || "Cash on Delivery",
        coupon: params.coupon,
      },
      params.customer,
      eventId
    );
  }
}

// ============================================================================
// 16. Refund (GA4: refund | Meta: Refund)
// ============================================================================
export interface RefundEventParams {
  transaction_id: string;
  order_id?: string;
  value?: number;
  currency?: string;
  customer?: CustomerData;
  items?: GA4Item[];
}

export function trackRefund(params: RefundEventParams): void {
  if (!params.transaction_id && !params.order_id) return;

  const txId = params.transaction_id || params.order_id;
  const curr = params.currency || DEFAULT_CURRENCY;
  const items = params.items || [];
  const contents = items.length > 0 ? formatMetaContents(items) : undefined;
  const contentIds = items.map((i) => i.item_id);
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const userData = normalizeCustomerData(params.customer);

  pushToDataLayer({
    event: "refund",
    transaction_id: txId,
    order_id: txId,
    value: params.value,
    currency: curr,
    contents,
    user_data: userData,
    ecommerce: {
      transaction_id: txId,
      value: params.value,
      currency: curr,
      items: items.length > 0 ? formatGA4Items(items) : undefined,
    },
  });

  trackMetaEvent("Refund", {
    order_id: txId,
    value: params.value,
    currency: curr,
    content_type: items.length > 0 ? "product" : undefined,
    content_ids: contentIds.length > 0 ? contentIds : undefined,
    contents,
    num_items: items.length > 0 ? totalQuantity : undefined,
  });

  trackTikTokEvent("Refund", {
    order_id: txId,
    value: params.value,
    currency: curr,
  }, params.customer);
}

// ============================================================================
// 17. CancelOrder (GA4: cancel_order | Meta: CancelOrder)
// ============================================================================
export function trackCancelOrder(
  orderId: string,
  reason?: string,
  value?: number,
  currency: string = DEFAULT_CURRENCY,
  customer?: CustomerData
): void {
  if (!orderId) return;
  const userData = normalizeCustomerData(customer);

  pushToDataLayer({
    event: "cancel_order",
    order_id: orderId,
    transaction_id: orderId,
    reason,
    value,
    currency,
    user_data: userData,
  });

  trackMetaEvent("CancelOrder", {
    order_id: orderId,
    reason,
    value,
    currency,
  });
}

// ============================================================================
// 18. CompleteRegistration / SignUp (GA4: sign_up | Meta: CompleteRegistration)
// ============================================================================
export function trackCompleteRegistration(
  method: string = "email",
  status: string = "success",
  customer?: CustomerData
): void {
  const userData = normalizeCustomerData(customer);

  pushToDataLayer({
    event: "sign_up",
    method,
    status,
    user_data: userData,
  });

  trackMetaEvent("CompleteRegistration", {
    content_name: method,
    status,
  });

  trackTikTokEvent("CompleteRegistration", {
    content_name: method,
    status,
  }, customer);
}

export const trackSignUp = trackCompleteRegistration;

// ============================================================================
// 19. Lead / GenerateLead (GA4: generate_lead | Meta: Lead)
// ============================================================================
export function trackLead(
  leadType: string = "checkout_capture",
  value?: number,
  currency: string = DEFAULT_CURRENCY,
  customer?: CustomerData
): void {
  const userData = normalizeCustomerData(customer);

  pushToDataLayer({
    event: "generate_lead",
    lead_type: leadType,
    value,
    currency,
    user_data: userData,
  });

  trackMetaEvent("Lead", {
    content_name: leadType,
    content_category: "Lead Generation",
    value,
    currency,
  });

  trackTikTokEvent("SubmitForm", {
    content_name: leadType,
    content_category: "Lead Generation",
    value,
    currency,
  }, customer);
}

export const trackGenerateLead = trackLead;

// ============================================================================
// 20. Contact (GA4: contact | Meta: Contact)
// ============================================================================
export function trackContact(
  contactMethod: string = "phone",
  target?: string,
  customer?: CustomerData
): void {
  const userData = normalizeCustomerData(customer);

  pushToDataLayer({
    event: "contact",
    contact_method: contactMethod,
    contact_target: target,
    user_data: userData,
  });

  trackMetaEvent("Contact", {
    content_name: contactMethod,
  });

  trackTikTokEvent("Contact", {
    content_name: contactMethod,
  }, customer);
}

// ============================================================================
// 21. Subscribe (GA4: subscribe | Meta: Subscribe)
// ============================================================================
export function trackSubscribe(
  subscriptionType: string = "newsletter",
  target?: string,
  customer?: CustomerData
): void {
  const userData = normalizeCustomerData(customer);

  pushToDataLayer({
    event: "subscribe",
    subscription_type: subscriptionType,
    target,
    user_data: userData,
  });

  trackMetaEvent("Subscribe", {
    content_name: subscriptionType,
  });

  trackTikTokEvent("Subscribe", {
    content_name: subscriptionType,
  }, customer);
}

// ============================================================================
// 22. SubmitApplication (GA4: submit_application | Meta: SubmitApplication)
// ============================================================================
export function trackSubmitApplication(
  applicationName: string = "routine_finder",
  applicationId?: string,
  customer?: CustomerData
): void {
  const userData = normalizeCustomerData(customer);

  pushToDataLayer({
    event: "submit_application",
    application_name: applicationName,
    application_id: applicationId,
    user_data: userData,
  });

  trackMetaEvent("SubmitApplication", {
    content_name: applicationName,
  });

  trackTikTokEvent("SubmitForm", {
    content_name: applicationName,
  }, customer);
}

// ============================================================================
// 23. Schedule (GA4: schedule | Meta: Schedule)
// ============================================================================
export function trackSchedule(
  scheduleType: string = "routine_finder",
  appointmentTime?: string,
  customer?: CustomerData
): void {
  const userData = normalizeCustomerData(customer);

  pushToDataLayer({
    event: "schedule",
    schedule_type: scheduleType,
    appointment_time: appointmentTime,
    user_data: userData,
  });

  trackMetaEvent("Schedule", {
    content_name: scheduleType,
  });

  trackTikTokEvent("Schedule", {
    content_name: scheduleType,
  }, customer);
}

// ============================================================================
// 24. StartTrial (GA4: start_trial | Meta: StartTrial)
// ============================================================================
export function trackStartTrial(
  trialName: string = "skin_routine_quiz",
  trialType: string = "beauty_assessment",
  customer?: CustomerData
): void {
  const userData = normalizeCustomerData(customer);

  pushToDataLayer({
    event: "start_trial",
    trial_name: trialName,
    trial_type: trialType,
    user_data: userData,
  });

  trackMetaEvent("StartTrial", {
    content_name: trialName,
  });

  trackTikTokEvent("StartTrial", {
    content_name: trialName,
  }, customer);
}

// ============================================================================
// PascalCase and camelCase Aliases for 100% Backwards Compatibility
// ============================================================================
export const PageView = trackPageView;
export const ViewContent = trackViewContent;
export const Search = trackSearch;
export const ViewCategory = trackViewCategory;
export const ViewItemList = trackViewItemList;
export const SelectItem = trackSelectItem;
export const ViewItem = trackViewItem;
export const AddToWishlist = trackAddToWishlist;
export const AddToCart = trackAddToCart;
export const ViewCart = trackViewCart;
export const RemoveFromCart = trackRemoveFromCart;
export const InitiateCheckout = trackInitiateCheckout;
export const AddPaymentInfo = trackAddPaymentInfo;
export const AddShippingInfo = trackAddShippingInfo;
export const Purchase = trackPurchase;
export const Refund = trackRefund;
export const CancelOrder = trackCancelOrder;
export const CompleteRegistration = trackCompleteRegistration;
export const Lead = trackLead;
export const Contact = trackContact;
export const Subscribe = trackSubscribe;
export const SubmitApplication = trackSubmitApplication;
export const Schedule = trackSchedule;
export const StartTrial = trackStartTrial;
