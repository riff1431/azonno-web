// ============================================================
// Core Database Types — Blush & Budget
// ============================================================

// --- Auth & RBAC ---

export type UserRole = "guest" | "customer" | "moderator" | "admin";

export type PermissionKey =
  | "products.view" | "products.create" | "products.update" | "products.delete"
  | "orders.view" | "orders.update" | "orders.refund"
  | "customers.view" | "customers.update" | "customers.block"
  | "reports.sales" | "reports.profit" | "reports.customers"
  | "media.manage" | "coupons.manage" | "reviews.moderate"
  | "settings.manage" | "integrations.manage" | "roles.manage" | "finance.manage";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  status: "active" | "blocked" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  key: PermissionKey;
  display_name: string;
  group: string;
  description: string | null;
}

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  name: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  address_line: string;
  postal_code: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// --- Catalog ---

export type ProductStatus = "draft" | "active" | "archived";
export type ProductType = "simple" | "variable";

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  children?: Category[];
  products_count?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  products_count?: number;
}

export interface ProductAttribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  sort_order: number;
  created_at: string;
}

export interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  slug: string;
  color_hex: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  barcode: string | null;
  product_type: ProductType;
  status: ProductStatus;
  brand_id: string | null;
  supplier_id: string | null;
  short_description: string | null;
  description: string | null;
  benefits: string | null;
  usage: string | null;
  ingredients_specifications: string | null;
  country: string | null;
  warranty: string | null;
  cost_price: number | null;
  regular_price: number;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  shipping_class: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_override: string | null;
  og_image_url: string | null;
  is_indexed: boolean;
  is_featured: boolean;
  average_rating: number;
  review_count: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined
  brand?: Brand;
  categories?: Category[];
  variants?: ProductVariant[];
  media?: ProductMedia[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  barcode: string | null;
  cost_price: number | null;
  regular_price: number | null;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  weight: number | null;
  image_url: string | null;
  status: "active" | "inactive";
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined
  attribute_values?: (AttributeValue & { attribute?: ProductAttribute })[];
  inventory?: Inventory;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  variant_id: string | null;
  media_id: string;
  position: number;
  is_featured: boolean;
  type: "image" | "video" | "document";
  media?: Media;
}

export interface Inventory {
  id: string;
  product_id: string;
  variant_id: string | null;
  on_hand: number;
  reserved: number;
  available: number;
  sold: number;
  returned: number;
  damaged: number;
  incoming: number;
  low_stock_threshold: number;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  inventory_id: string;
  product_id: string;
  variant_id: string | null;
  type: "purchase" | "sale" | "adjustment" | "return" | "damage" | "cancellation" | "manual";
  quantity_change: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

// --- Media ---

export interface Media {
  id: string;
  public_id: string;
  secure_url: string;
  resource_type: "image" | "video" | "raw";
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  folder: string;
  alt_text: string | null;
  caption: string | null;
  created_by: string | null;
  created_at: string;
  deleted_at: string | null;
}

// --- Commerce ---

export type OrderStatus =
  | "pending" | "confirmed" | "processing" | "packed"
  | "ready_for_pickup" | "shipped" | "in_transit"
  | "out_for_delivery" | "delivered"
  | "cancelled" | "failed"
  | "return_requested" | "returned" | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  is_guest: boolean;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total: number;
  cost_snapshot: Record<string, number> | null;
  payment_method: string | null;
  payment_status: PaymentStatus;
  shipping_address_snapshot: Address | null;
  shipping_method: string | null;
  courier_id: string | null;
  consignment_id: string | null;
  tracking_id: string | null;
  fraud_score: number | null;
  risk_flags: string[] | null;
  ip_address: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  status: OrderStatus;
  public_note: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name_snapshot: string;
  sku_snapshot: string | null;
  unit_price: number;
  unit_cost: number | null;
  quantity: number;
  discount: number;
  tax: number;
  total: number;
  variant_attributes_snapshot: Record<string, string> | null;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

// --- Coupons ---

export type CouponType = "percentage" | "fixed" | "free_shipping";
export type CouponScope = "all" | "product" | "category" | "brand" | "customer";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  max_discount: number | null;
  min_cart_amount: number | null;
  scope: CouponScope;
  scope_ids: string[] | null;
  first_order_only: boolean;
  usage_limit: number | null;
  per_user_limit: number | null;
  usage_count: number;
  starts_at: string | null;
  expires_at: string | null;
  status: "active" | "inactive" | "expired";
  combinable: boolean;
  excluded_product_ids: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// --- Reviews ---

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_item_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  status: "pending" | "approved" | "rejected" | "spam";
  admin_reply: string | null;
  admin_reply_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  user?: Pick<Profile, "full_name" | "avatar_url">;
  media?: Media[];
}

// --- Settings ---

export interface Setting {
  id: string;
  group: string;
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "json";
  created_at: string;
  updated_at: string;
}

// --- Activity Log ---

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined
  user?: Pick<Profile, "full_name" | "email">;
}

// --- Notifications ---

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

// --- Homepage ---

export type HomepageBlockType =
  | "hero_slider" | "product_carousel" | "product_grid"
  | "category_grid" | "brand_carousel" | "countdown_sale"
  | "banner" | "image_text" | "video" | "newsletter" | "custom_html";

export interface HomepageSection {
  id: string;
  block_type: HomepageBlockType;
  title: string | null;
  config: Record<string, unknown>;
  sort_order: number;
  status: "active" | "inactive";
  desktop_visible: boolean;
  mobile_visible: boolean;
  schedule_start: string | null;
  schedule_end: string | null;
  created_at: string;
  updated_at: string;
}

// --- High-Volume Logistics & Orders Domain ---
export * from "./orders";
