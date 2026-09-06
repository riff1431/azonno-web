-- ==============================================================================
-- Migration: 008_add_free_shipping_to_products.sql
-- Description: Indexes shipping_class on products and ensures free delivery
--              support per product.
-- ==============================================================================

-- 1. Ensure index on shipping_class for rapid promotional filtering
CREATE INDEX IF NOT EXISTS idx_products_shipping_class ON public.products(shipping_class);

-- 2. Optional boolean column for explicit flag redundancy
ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS is_free_shipping BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_is_free_shipping ON public.products(is_free_shipping) WHERE is_free_shipping = TRUE;
