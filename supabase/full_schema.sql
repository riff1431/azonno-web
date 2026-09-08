-- ============================================================
-- ecomXbangladesh — Foundation Migration
-- Phase 1: Auth, RBAC, Catalog, Commerce, Settings
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 1. PROFILES & AUTH
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('guest', 'customer', 'moderator', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.email, ''),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. ROLES & PERMISSIONS
-- ============================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  "group" TEXT NOT NULL,
  description TEXT
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- 3. ADDRESSES
-- ============================================================

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  area TEXT NOT NULL,
  address_line TEXT NOT NULL,
  postal_code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ============================================================
-- 4. MEDIA LIBRARY
-- ============================================================

CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_id TEXT NOT NULL UNIQUE,
  secure_url TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'image' CHECK (resource_type IN ('image', 'video', 'raw')),
  format TEXT,
  width INTEGER,
  height INTEGER,
  bytes BIGINT,
  folder TEXT NOT NULL DEFAULT '',
  alt_text TEXT,
  caption TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_media_folder ON media(folder);
CREATE INDEX idx_media_public_id ON media(public_id);

-- ============================================================
-- 5. CATALOG — Categories
-- ============================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_status ON categories(status);

-- ============================================================
-- 6. CATALOG — Brands
-- ============================================================

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  seo_title TEXT,
  seo_description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_status ON brands(status);

-- ============================================================
-- 7. CATALOG — Product Attributes
-- ============================================================

CREATE TABLE product_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'select',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE attribute_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  slug TEXT NOT NULL,
  color_hex TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(attribute_id, slug)
);

-- ============================================================
-- 8. CATALOG — Products
-- ============================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT,
  barcode TEXT,
  product_type TEXT NOT NULL DEFAULT 'simple' CHECK (product_type IN ('simple', 'variable')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  supplier_id UUID,
  short_description TEXT,
  description TEXT,
  benefits TEXT,
  usage TEXT,
  ingredients_specifications TEXT,
  country TEXT,
  warranty TEXT,
  cost_price NUMERIC(12,2),
  regular_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12,2),
  sale_start TIMESTAMPTZ,
  sale_end TIMESTAMPTZ,
  weight NUMERIC(10,3),
  length NUMERIC(10,2),
  width NUMERIC(10,2),
  height NUMERIC(10,2),
  shipping_class TEXT,
  seo_title TEXT,
  seo_description TEXT,
  canonical_override TEXT,
  og_image_url TEXT,
  is_indexed BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  search_vector TSVECTOR,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_price ON products(regular_price);
CREATE INDEX idx_products_created ON products(created_at DESC);

-- Auto-update search_vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.sku, '') || ' ' ||
    COALESCE(NEW.short_description, '') || ' ' ||
    COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name, sku, short_description, description
  ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Product-Category many-to-many
CREATE TABLE product_categories (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Product-Tag many-to-many
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_tags (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- ============================================================
-- 9. CATALOG — Product Variants
-- ============================================================

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT,
  barcode TEXT,
  cost_price NUMERIC(12,2),
  regular_price NUMERIC(12,2),
  sale_price NUMERIC(12,2),
  sale_start TIMESTAMPTZ,
  sale_end TIMESTAMPTZ,
  weight NUMERIC(10,3),
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);

CREATE TABLE variant_attribute_values (
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  attribute_value_id UUID NOT NULL REFERENCES attribute_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, attribute_value_id)
);

-- ============================================================
-- 10. CATALOG — Product Media
-- ============================================================

CREATE TABLE product_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video', 'document'))
);

CREATE INDEX idx_product_media_product ON product_media(product_id);

-- ============================================================
-- 11. INVENTORY
-- ============================================================

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  on_hand INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  returned INTEGER NOT NULL DEFAULT 0,
  damaged INTEGER NOT NULL DEFAULT 0,
  incoming INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, variant_id)
);

CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_available ON inventory(available);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'adjustment', 'return', 'damage', 'cancellation', 'manual')),
  quantity_change INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_movements_inventory ON inventory_movements(inventory_id);
CREATE INDEX idx_movements_created ON inventory_movements(created_at DESC);

-- ============================================================
-- 12. COMMERCE — Coupons
-- ============================================================

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_shipping')),
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(12,2),
  min_cart_amount NUMERIC(12,2),
  scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'product', 'category', 'brand', 'customer')),
  scope_ids UUID[],
  first_order_only BOOLEAN NOT NULL DEFAULT FALSE,
  usage_limit INTEGER,
  per_user_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  combinable BOOLEAN NOT NULL DEFAULT FALSE,
  excluded_product_ids UUID[],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_status ON coupons(status);

CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  order_id UUID,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 13. COMMERCE — Carts
-- ============================================================

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_session ON carts(session_id);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- ============================================================
-- 14. COMMERCE — Orders
-- ============================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id),
  guest_name TEXT,
  guest_phone TEXT,
  guest_email TEXT,
  is_guest BOOLEAN NOT NULL DEFAULT FALSE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_snapshot JSONB,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
  payment_transaction_refs JSONB,
  shipping_address_snapshot JSONB,
  shipping_method TEXT,
  courier_id UUID,
  consignment_id TEXT,
  tracking_id TEXT,
  fraud_score INTEGER,
  risk_flags TEXT[],
  ip_address INET,
  device_info TEXT,
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'on-hold', 'on_hold', 'packed',
    'ready_for_pickup', 'shipped', 'in_transit',
    'out_for_delivery', 'delivered', 'completed',
    'cancelled', 'failed',
    'return_requested', 'returned', 'refunded'
  )),
  public_note TEXT,
  internal_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_phone ON orders(guest_phone);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name_snapshot TEXT NOT NULL,
  sku_snapshot TEXT,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(12,2),
  quantity INTEGER NOT NULL DEFAULT 1,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  variant_attributes_snapshot JSONB
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_history_order ON order_status_history(order_id);

CREATE TABLE order_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 15. PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  method TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  provider_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shipping_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_order_free_shipping NUMERIC(12,2),
  zones TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- 16. REVIEWS & Q&A
-- ============================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  order_item_id UUID REFERENCES order_items(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  admin_reply TEXT,
  admin_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_status ON reviews(status);

CREATE TABLE review_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media(id),
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  answer TEXT NOT NULL,
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 17. WISHLIST
-- ============================================================

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);

-- ============================================================
-- 18. HOMEPAGE SECTIONS
-- ============================================================

CREATE TABLE homepage_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_type TEXT NOT NULL,
  title TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  desktop_visible BOOLEAN NOT NULL DEFAULT TRUE,
  mobile_visible BOOLEAN NOT NULL DEFAULT TRUE,
  schedule_start TIMESTAMPTZ,
  schedule_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 19. SETTINGS
-- ============================================================

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "group" TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("group", key)
);

-- ============================================================
-- 20. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- ============================================================
-- 21. ACTIVITY LOGS
-- ============================================================

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  before_data JSONB,
  after_data JSONB,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_target ON activity_logs(target_type, target_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);

-- ============================================================
-- 22. CMS PAGES
-- ============================================================

CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  featured_image_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  publish_date TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 23. MENUS (Navigation Builder)
-- ============================================================

CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at'
      AND table_schema = 'public'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;
-- ============================================================
-- ecomXbangladesh — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin/moderator
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin_select" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE USING (is_admin());

-- ============================================================
-- ADDRESSES — own data only
-- ============================================================
CREATE POLICY "addresses_select_own" ON addresses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "addresses_insert_own" ON addresses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "addresses_update_own" ON addresses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "addresses_delete_own" ON addresses FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- MEDIA — admin manage, public read
-- ============================================================
CREATE POLICY "media_public_read" ON media FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "media_admin_insert" ON media FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "media_admin_update" ON media FOR UPDATE USING (is_admin());
CREATE POLICY "media_admin_delete" ON media FOR DELETE USING (is_admin());

-- ============================================================
-- CATALOG — public read for active, admin full access
-- ============================================================
-- Categories
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (status = 'active');
CREATE POLICY "categories_admin_all" ON categories FOR ALL USING (is_admin());

-- Brands
CREATE POLICY "brands_public_read" ON brands FOR SELECT USING (status = 'active');
CREATE POLICY "brands_admin_all" ON brands FOR ALL USING (is_admin());

-- Product Attributes
CREATE POLICY "attrs_public_read" ON product_attributes FOR SELECT USING (TRUE);
CREATE POLICY "attrs_admin_all" ON product_attributes FOR ALL USING (is_admin());

-- Attribute Values
CREATE POLICY "attr_vals_public_read" ON attribute_values FOR SELECT USING (TRUE);
CREATE POLICY "attr_vals_admin_all" ON attribute_values FOR ALL USING (is_admin());

-- Products
CREATE POLICY "products_public_read" ON products FOR SELECT USING (status = 'active' AND deleted_at IS NULL);
CREATE POLICY "products_admin_all" ON products FOR ALL USING (is_admin());

-- Product Variants
CREATE POLICY "variants_public_read" ON product_variants FOR SELECT USING (
  EXISTS (SELECT 1 FROM products WHERE id = product_variants.product_id AND status = 'active')
);
CREATE POLICY "variants_admin_all" ON product_variants FOR ALL USING (is_admin());

-- Product Categories, Tags, Media
CREATE POLICY "product_cats_public_read" ON product_categories FOR SELECT USING (TRUE);
CREATE POLICY "product_cats_admin_all" ON product_categories FOR ALL USING (is_admin());
CREATE POLICY "product_media_public_read" ON product_media FOR SELECT USING (TRUE);
CREATE POLICY "product_media_admin_all" ON product_media FOR ALL USING (is_admin());
CREATE POLICY "tags_public_read" ON tags FOR SELECT USING (TRUE);
CREATE POLICY "tags_admin_all" ON tags FOR ALL USING (is_admin());
CREATE POLICY "product_tags_public_read" ON product_tags FOR SELECT USING (TRUE);
CREATE POLICY "product_tags_admin_all" ON product_tags FOR ALL USING (is_admin());

-- ============================================================
-- INVENTORY — admin only
-- ============================================================
CREATE POLICY "inventory_admin_all" ON inventory FOR ALL USING (is_admin());
CREATE POLICY "inventory_public_read" ON inventory FOR SELECT USING (TRUE);
CREATE POLICY "movements_admin_all" ON inventory_movements FOR ALL USING (is_admin());

-- ============================================================
-- COUPONS — admin manage, public validate
-- ============================================================
CREATE POLICY "coupons_admin_all" ON coupons FOR ALL USING (is_admin());
CREATE POLICY "coupons_public_active" ON coupons FOR SELECT USING (status = 'active');
CREATE POLICY "coupon_usage_admin_all" ON coupon_usage FOR ALL USING (is_admin());

-- ============================================================
-- CARTS — own data
-- ============================================================
CREATE POLICY "carts_own" ON carts FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "cart_items_own" ON cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM carts WHERE id = cart_items.cart_id AND (user_id = auth.uid() OR user_id IS NULL))
);

-- ============================================================
-- ORDERS — customer reads own, admin full
-- ============================================================
CREATE POLICY "orders_customer_read" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "orders_admin_all" ON orders FOR ALL USING (is_admin());
CREATE POLICY "order_items_customer_read" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
);
CREATE POLICY "order_items_admin_all" ON order_items FOR ALL USING (is_admin());
CREATE POLICY "order_history_customer_read" ON order_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_status_history.order_id AND user_id = auth.uid())
);
CREATE POLICY "order_history_admin_all" ON order_status_history FOR ALL USING (is_admin());
CREATE POLICY "order_notes_admin_all" ON order_notes FOR ALL USING (is_admin());

-- ============================================================
-- PAYMENTS — admin only
-- ============================================================
CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (is_admin());

-- ============================================================
-- SHIPPING METHODS — public read, admin manage
-- ============================================================
CREATE POLICY "shipping_public_read" ON shipping_methods FOR SELECT USING (status = 'active');
CREATE POLICY "shipping_admin_all" ON shipping_methods FOR ALL USING (is_admin());

-- ============================================================
-- REVIEWS — public read approved, own create, admin moderate
-- ============================================================
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "reviews_own_insert" ON reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_admin_all" ON reviews FOR ALL USING (is_admin());
CREATE POLICY "review_media_public_read" ON review_media FOR SELECT USING (TRUE);
CREATE POLICY "review_media_own_insert" ON review_media FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM reviews WHERE id = review_media.review_id AND user_id = auth.uid())
);

-- Q&A
CREATE POLICY "questions_public_read" ON questions FOR SELECT USING (status = 'published');
CREATE POLICY "questions_own_insert" ON questions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "questions_admin_all" ON questions FOR ALL USING (is_admin());
CREATE POLICY "answers_public_read" ON answers FOR SELECT USING (TRUE);
CREATE POLICY "answers_admin_all" ON answers FOR ALL USING (is_admin());

-- ============================================================
-- WISHLISTS — own data only
-- ============================================================
CREATE POLICY "wishlists_own" ON wishlists FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- HOMEPAGE, PAGES, MENUS — public read, admin manage
-- ============================================================
CREATE POLICY "homepage_public_read" ON homepage_sections FOR SELECT USING (status = 'active');
CREATE POLICY "homepage_admin_all" ON homepage_sections FOR ALL USING (is_admin());
CREATE POLICY "pages_public_read" ON pages FOR SELECT USING (status = 'published');
CREATE POLICY "pages_admin_all" ON pages FOR ALL USING (is_admin());
CREATE POLICY "menus_public_read" ON menus FOR SELECT USING (TRUE);
CREATE POLICY "menus_admin_all" ON menus FOR ALL USING (is_admin());

-- ============================================================
-- SETTINGS — admin only
-- ============================================================
CREATE POLICY "settings_admin_all" ON settings FOR ALL USING (is_admin());

-- ============================================================
-- NOTIFICATIONS — own data
-- ============================================================
CREATE POLICY "notifications_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_own_update" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- ACTIVITY LOGS — admin read only
-- ============================================================
CREATE POLICY "logs_admin_read" ON activity_logs FOR SELECT USING (is_admin());

-- ============================================================
-- ROLES & PERMISSIONS — admin only
-- ============================================================
CREATE POLICY "roles_admin_all" ON roles FOR ALL USING (is_admin());
CREATE POLICY "permissions_admin_read" ON permissions FOR SELECT USING (is_admin());
CREATE POLICY "role_perms_admin_all" ON role_permissions FOR ALL USING (is_admin());
-- ============================================================
-- ecomXbangladesh — Seed Data
-- ============================================================

-- Roles
INSERT INTO roles (name, display_name, description, is_system) VALUES
  ('admin', 'Administrator', 'Full system access', TRUE),
  ('moderator', 'Moderator', 'Limited admin access for content and orders', TRUE),
  ('customer', 'Customer', 'Regular customer', TRUE);

-- Permissions
INSERT INTO permissions (key, display_name, "group") VALUES
  ('products.view', 'View Products', 'Products'),
  ('products.create', 'Create Products', 'Products'),
  ('products.update', 'Update Products', 'Products'),
  ('products.delete', 'Delete Products', 'Products'),
  ('orders.view', 'View Orders', 'Orders'),
  ('orders.update', 'Update Orders', 'Orders'),
  ('orders.refund', 'Process Refunds', 'Orders'),
  ('customers.view', 'View Customers', 'Customers'),
  ('customers.update', 'Update Customers', 'Customers'),
  ('customers.block', 'Block Customers', 'Customers'),
  ('reports.sales', 'View Sales Reports', 'Reports'),
  ('reports.profit', 'View Profit Reports', 'Reports'),
  ('reports.customers', 'View Customer Reports', 'Reports'),
  ('media.manage', 'Manage Media', 'Content'),
  ('coupons.manage', 'Manage Coupons', 'Marketing'),
  ('reviews.moderate', 'Moderate Reviews', 'Content'),
  ('settings.manage', 'Manage Settings', 'Settings'),
  ('integrations.manage', 'Manage Integrations', 'Settings'),
  ('roles.manage', 'Manage Roles', 'Settings'),
  ('finance.manage', 'Manage Finances', 'Finance');

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin';

-- Assign limited permissions to moderator role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'moderator'
AND p.key IN (
  'products.view', 'products.create', 'products.update',
  'orders.view', 'orders.update',
  'customers.view',
  'media.manage',
  'reviews.moderate',
  'reports.sales'
);

-- Default Settings
INSERT INTO settings ("group", key, value, type) VALUES
  ('general', 'store_name', 'ecomXbangladesh', 'string'),
  ('general', 'store_email', '', 'string'),
  ('general', 'store_phone', '', 'string'),
  ('general', 'store_address', '', 'string'),
  ('general', 'currency', 'BDT', 'string'),
  ('general', 'currency_symbol', '৳', 'string'),
  ('general', 'timezone', 'Asia/Dhaka', 'string'),

  ('checkout', 'guest_checkout_enabled', 'true', 'boolean'),
  ('checkout', 'min_order_amount', '0', 'number'),
  ('checkout', 'cod_enabled', 'true', 'boolean'),
  ('checkout', 'cod_max_amount', '20000', 'number'),

  ('shipping', 'default_shipping_charge', '80', 'number'),
  ('shipping', 'free_shipping_threshold', '2000', 'number'),

  ('inventory', 'track_inventory', 'true', 'boolean'),
  ('inventory', 'allow_backorder', 'false', 'boolean'),
  ('inventory', 'low_stock_threshold', '5', 'number'),

  ('seo', 'meta_title', 'ecomXbangladesh — Premium E-Commerce', 'string'),
  ('seo', 'meta_description', 'Shop authentic products with fast delivery across Bangladesh', 'string'),

  ('media', 'max_upload_size_mb', '10', 'number'),
  ('media', 'allowed_image_formats', '["jpg","jpeg","png","webp","gif"]', 'json'),
  ('media', 'allowed_video_formats', '["mp4","webm"]', 'json'),

  ('notifications', 'order_placed_sms', 'true', 'boolean'),
  ('notifications', 'order_shipped_sms', 'true', 'boolean'),
  ('notifications', 'order_delivered_sms', 'true', 'boolean');

-- Default Shipping Methods
INSERT INTO shipping_methods (name, description, charge, min_order_free_shipping, zones, status, sort_order) VALUES
  ('Standard Delivery', 'Delivery within 3-5 business days', 80, 2000, ARRAY['all'], 'active', 1),
  ('Express Delivery', 'Delivery within 1-2 business days', 150, NULL, ARRAY['Dhaka', 'Chattogram'], 'active', 2);

-- Header Menu
INSERT INTO menus (name, location, items) VALUES
  ('header_menu', 'header', '[
    {"label": "Home", "url": "/", "children": []},
    {"label": "Shop", "url": "/shop", "children": []},
    {"label": "Categories", "url": "/categories", "children": []},
    {"label": "Brands", "url": "/brands", "children": []},
    {"label": "Contact", "url": "/page/contact", "children": []}
  ]'),
  ('footer_menu', 'footer', '[
    {"label": "About Us", "url": "/page/about", "children": []},
    {"label": "Privacy Policy", "url": "/page/privacy-policy", "children": []},
    {"label": "Terms & Conditions", "url": "/page/terms", "children": []},
    {"label": "Return Policy", "url": "/page/return-policy", "children": []},
    {"label": "FAQ", "url": "/page/faq", "children": []}
  ]');
