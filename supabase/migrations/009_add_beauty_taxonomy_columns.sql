-- ============================================================
-- Migration 009: Add Beauty Taxonomy Columns to products table
-- Run this in your Supabase SQL Editor:
--   Supabase Dashboard -> SQL Editor -> New Query -> Paste and Run
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS skin_type      TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skin_concern   TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS key_actives    TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS batch_number   TEXT,
  ADD COLUMN IF NOT EXISTS expiry_date    DATE,
  ADD COLUMN IF NOT EXISTS routine_step   INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS origin_country TEXT;

-- Indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_expiry_date  ON public.products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_routine_step ON public.products(routine_step);
CREATE INDEX IF NOT EXISTS idx_products_skin_type    ON public.products USING GIN (skin_type);
CREATE INDEX IF NOT EXISTS idx_products_skin_concern ON public.products USING GIN (skin_concern);
CREATE INDEX IF NOT EXISTS idx_products_key_actives  ON public.products USING GIN (key_actives);

-- Notify PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';
