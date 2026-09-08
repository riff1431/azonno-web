-- ============================================================
-- ecomXbangladesh — Order Status Lifecycle & Logistics Migration
-- Phase 10: Expand and standardize orders table status constraints
-- Supports complete WooCommerce core states + Bangladesh logistics lifecycle (SteadFast, Pathao, COD)
-- ============================================================

-- 1. Drop existing restricted check constraint if present
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Add comprehensive check constraint supporting core and logistics statuses
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'pending',          -- Order created / awaiting verification or payment
  'confirmed',        -- Order confirmed via phone/WhatsApp verification
  'processing',       -- Order accepted, stock deducted, in packing/warehouse
  'on-hold',          -- Order on hold (awaiting advance fee or customer callback)
  'on_hold',          -- Alias for on-hold
  'packed',           -- Order packed in box / parcel prepared
  'ready_for_pickup', -- Ready for courier rider pickup
  'shipped',          -- Handed over to courier / in-transit with SteadFast or Pathao
  'in_transit',       -- Parcel moving across courier logistics hubs
  'out_for_delivery', -- Courier rider out for final doorstep delivery
  'delivered',        -- Parcel successfully delivered to customer
  'completed',        -- Order completed, payment collected, transaction closed
  'cancelled',        -- Order cancelled by admin/customer, stock restored
  'failed',           -- Delivery failed or cancelled by courier
  'return_requested', -- Customer requested return
  'returned',         -- Parcel returned to origin (RTO), stock restored
  'refunded'          -- Order refunded, financial reconciliation complete
));

-- 3. Ensure index exists for fast querying by status and created_at
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
