/**
 * Core Domain Models & Type System for Blush & Budget E-Commerce Orders
 * Specifically tailored for high-volume Bangladeshi logistics (SteadFast, Pathao, COD)
 */

export type OrderStatus =
  | "pending"
  | "processing"
  | "on-hold"
  | "completed"
  | "cancelled"
  | "refunded"
  | "failed"
  | "confirmed"
  | "ready_for_pickup"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "returned";

export type PaymentStatus = "pending" | "partially_paid" | "paid" | "failed" | "refunded";


export type CourierProvider = "steadfast" | "pathao" | "redx" | "paperfly" | "sundarban" | "manual";

export type AdvancePaymentMethod = "bkash" | "nagad" | "rocket" | "upay" | "bank_transfer" | "cash";

export type RiskLevel = "low" | "medium" | "high" | "blocked";

export interface AddressSnapshot {
  name: string;
  phone: string;
  email?: string | null;
  division?: string;
  district: string;
  thana: string;
  address: string;
  postal_code?: string | null;
  landmark?: string | null;
}

export interface OrderItemSnapshot {
  id?: string;
  order_id?: string;
  product_id: string;
  variant_id?: string | null;
  product_name_snapshot: string;
  variant_title_snapshot?: string | null;
  sku_snapshot?: string | null;
  image_url_snapshot?: string | null;
  unit_price: number;
  quantity: number;
  total: number;
}

export interface CustomerRiskProfile {
  score: number; // 0 to 100
  risk_level: RiskLevel;
  flags: string[];
  total_orders: number;
  successful_deliveries: number;
  returns_count: number;
  delivery_rate: number; // e.g. 98.5%
  is_blocked: boolean;
  block_reason?: string | null;
  notes?: string;
}

export interface CourierConsignment {
  courier_code: CourierProvider;
  courier_name: string;
  consignment_id: string;
  tracking_code: string;
  tracking_url?: string | null;
  delivery_hub?: string | null;
  booking_status: "booked" | "in_transit" | "delivered" | "returned" | "cancelled" | "failed";
  cod_amount: number;
  booked_at: string;
  raw_response?: Record<string, any>;
}

export interface OrderFinancials {
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  tax_amount: number;
  gross_total: number;
  advance_paid: number;
  amount_to_collect: number; // COD amount due
  payment_status: PaymentStatus;
}

export interface OrderAuditEntry {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string;
  action_type?: "status_change" | "payment_received" | "courier_dispatched" | "item_edited" | "address_updated" | "system";
  created_by?: string | null;
  created_at: string;
}

export interface AdminOrderRow {
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
  advance_paid: number;
  amount_to_collect: number;
  advance_payment_method?: AdvancePaymentMethod | null;
  advance_trx_id?: string | null;
  payment_method: string | null;
  payment_status: PaymentStatus;
  shipping_address_snapshot: AddressSnapshot | null;
  shipping_method: string | null;
  courier_id?: string | null;
  courier_name?: string | null;
  consignment_id: string | null;
  tracking_id?: string | null;
  tracking_code?: string | null;
  tracking_url?: string | null;
  delivery_hub?: string | null;
  fraud_score: number | null;
  risk_flags: string[] | null;
  ip_address: string | null;
  status: OrderStatus;
  public_note: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
  // Relational aggregates
  order_items?: OrderItemSnapshot[];
  order_status_history?: OrderAuditEntry[];
  risk_profile?: CustomerRiskProfile;
}

// ============================================================
// Deterministic Calculation & Helper Engines
// ============================================================

/**
 * Robust Bangladeshi Phone Sanitizer & Validator
 * Converts +88017..., 88017..., 017... -> 017XXXXXXXX
 */
export function sanitizeBdPhoneNumber(rawPhone: string | null | undefined): {
  isValid: boolean;
  sanitized: string;
  formatted: string;
  carrier?: string;
} {
  if (!rawPhone) {
    return { isValid: false, sanitized: "", formatted: "" };
  }

  // Strip all non-numeric characters
  let digits = rawPhone.replace(/\D/g, "");

  // Remove leading 880 or 88 if present
  if (digits.startsWith("880")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("88") && digits.length === 13) {
    digits = digits.slice(2);
  }

  // Ensure standard 11 digits starting with 01
  const isValid = /^01[3-9]\d{8}$/.test(digits);

  // Identify operator
  let carrier = "Unknown";
  if (digits.startsWith("017") || digits.startsWith("013")) carrier = "Grameenphone";
  else if (digits.startsWith("018")) carrier = "Robi";
  else if (digits.startsWith("019") || digits.startsWith("014")) carrier = "Banglalink";
  else if (digits.startsWith("015")) carrier = "Teletalk";
  else if (digits.startsWith("016")) carrier = "Airtel";

  const formatted = isValid
    ? `${digits.slice(0, 5)}-${digits.slice(5, 8)}${digits.slice(8)}`
    : digits;

  return {
    isValid,
    sanitized: digits,
    formatted,
    carrier: isValid ? carrier : undefined,
  };
}

/**
 * Dynamic Financial Calculator
 * Computes Gross Total and Cash on Delivery Amount to Collect
 */
export function calculateOrderFinancials(
  subtotal: number,
  shippingAmount: number = 0,
  discountAmount: number = 0,
  taxAmount: number = 0,
  advancePaid: number = 0
): OrderFinancials {
  const cleanSubtotal = Math.max(0, Number(subtotal) || 0);
  const cleanShipping = Math.max(0, Number(shippingAmount) || 0);
  const cleanDiscount = Math.max(0, Number(discountAmount) || 0);
  const cleanTax = Math.max(0, Number(taxAmount) || 0);
  const cleanAdvance = Math.max(0, Number(advancePaid) || 0);

  const grossTotal = Math.max(0, cleanSubtotal + cleanShipping + cleanTax - cleanDiscount);
  const amountToCollect = Math.max(0, grossTotal - cleanAdvance);

  let paymentStatus: PaymentStatus = "pending";
  if (grossTotal > 0 && cleanAdvance >= grossTotal) {
    paymentStatus = "paid";
  } else if (cleanAdvance > 0 && cleanAdvance < grossTotal) {
    paymentStatus = "partially_paid";
  } else if (grossTotal === 0) {
    paymentStatus = "paid";
  }

  return {
    subtotal: cleanSubtotal,
    shipping_amount: cleanShipping,
    discount_amount: cleanDiscount,
    tax_amount: cleanTax,
    gross_total: grossTotal,
    advance_paid: cleanAdvance,
    amount_to_collect: amountToCollect,
    payment_status: paymentStatus,
  };
}

/**
 * WooCommerce Core Finite State Machine (FSM) Transitions
 * Mirrors standard WooCommerce e-commerce order lifecycle
 */
export const ORDER_FSM_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  // WooCommerce Core States
  "pending": ["processing", "on-hold", "cancelled", "failed"],
  "processing": ["completed", "on-hold", "cancelled"],
  "on-hold": ["processing", "cancelled", "failed"],
  "completed": ["refunded"],
  "cancelled": ["processing"], // Terminal: Re-opening to processing
  "refunded": [],              // Terminal
  "failed": ["processing", "cancelled"],

  // Backward-Compatible Aliases
  "confirmed": ["processing", "completed", "on-hold", "cancelled"],
  "ready_for_pickup": ["completed", "cancelled"],
  "shipped": ["completed", "failed", "refunded"],
  "in_transit": ["completed", "failed"],
  "out_for_delivery": ["completed", "failed"],
  "delivered": ["refunded"],
  "returned": ["refunded", "processing"],
};

/**
 * State Transition Guard
 * Verifies if an order status change is permitted according to WooCommerce FSM
 */
export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  isOverride: boolean = false
): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  if (isOverride) {
    return { allowed: true };
  }

  const validNext = ORDER_FSM_TRANSITIONS[currentStatus] ?? [];
  const allowed = validNext.includes(targetStatus);

  if (!allowed) {
    return {
      allowed: false,
      reason: `Cannot transition order directly from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  return { allowed: true };
}

/**
 * Returns available next valid statuses for UI Dropdowns without debug suffixes
 */
export function getAvailableNextStatuses(
  currentStatus: OrderStatus
): Array<{ value: OrderStatus; label: string; isReopen?: boolean }> {
  const statusLabels: Record<string, string> = {
    "pending": "Pending Payment",
    "processing": "Processing",
    "on-hold": "On Hold",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "refunded": "Refunded",
    "failed": "Failed (RTO)",
    "confirmed": "Confirmed",
    "shipped": "Shipped",
    "delivered": "Delivered",
    "returned": "Returned",
    "ready_for_pickup": "Ready for Pickup",
  };

  const nextKeys = ORDER_FSM_TRANSITIONS[currentStatus] || [];

  // Current status label (Clean, no debug suffix like "(Current)")
  const options: Array<{ value: OrderStatus; label: string; isReopen?: boolean }> = [
    { value: currentStatus, label: statusLabels[currentStatus] || currentStatus },
  ];

  for (const nextKey of nextKeys) {
    if (currentStatus === "cancelled" && nextKey === "processing") {
      options.push({
        value: nextKey,
        label: "Re-open as Processing",
        isReopen: true,
      });
    } else {
      options.push({
        value: nextKey,
        label: statusLabels[nextKey] || nextKey,
      });
    }
  }

  return options;
}



/**
 * Intelligent Fraud & Risk Scorer
 * Evaluates phone number history, high delivery zones, and anomaly patterns
 */
export function computeCustomerRiskProfile(params: {
  phone: string;
  district?: string;
  totalOrders?: number;
  successfulDeliveries?: number;
  returnsCount?: number;
  isBlacklisted?: boolean;
  orderTotal?: number;
  advancePaid?: number;
}): CustomerRiskProfile {
  const {
    phone,
    district = "",
    totalOrders = 0,
    successfulDeliveries = 0,
    returnsCount = 0,
    isBlacklisted = false,
    orderTotal = 0,
    advancePaid = 0,
  } = params;

  const flags: string[] = [];
  let score = 95; // Default high trust

  if (isBlacklisted) {
    return {
      score: 0,
      risk_level: "blocked",
      flags: ["Phone/Customer is on Fraud Blocklist"],
      total_orders: totalOrders,
      successful_deliveries: successfulDeliveries,
      returns_count: returnsCount,
      delivery_rate: 0,
      is_blocked: true,
      block_reason: "Manual admin fraud block",
    };
  }

  // Calculate historical delivery rate
  const deliveryRate = totalOrders > 0
    ? Math.round((successfulDeliveries / totalOrders) * 100)
    : 100;

  if (totalOrders > 0) {
    if (deliveryRate < 60) {
      score -= 40;
      flags.push(`Low historical delivery success (${deliveryRate}%)`);
    } else if (deliveryRate < 80) {
      score -= 20;
      flags.push(`Moderate delivery success (${deliveryRate}%)`);
    }
  }

  if (returnsCount >= 2) {
    score -= 25;
    flags.push(`${returnsCount} previous Return-to-Origin (RTO) incidents`);
  }

  // Large COD order without advance payment
  if (orderTotal > 5000 && advancePaid === 0) {
    score -= 15;
    flags.push("High-value COD order (৳5000+) with zero advance payment");
  }

  // Phone sanitization check
  const phoneCheck = sanitizeBdPhoneNumber(phone);
  if (!phoneCheck.isValid) {
    score -= 30;
    flags.push("Invalid or non-standard Bangladeshi phone number format");
  }

  let risk_level: RiskLevel = "low";
  if (score < 40) risk_level = "high";
  else if (score < 75) risk_level = "medium";

  return {
    score: Math.max(0, Math.min(100, score)),
    risk_level,
    flags,
    total_orders: totalOrders,
    successful_deliveries: successfulDeliveries,
    returns_count: returnsCount,
    delivery_rate: deliveryRate,
    is_blocked: false,
  };
}

/**
 * Generate Structured, URI-safe WhatsApp prefilled templates
 */
export function generateWhatsAppOrderMessage(
  order: any,
  templateType: "confirm" | "shipped" | "advance" | "review" | "cancelled" | "refund",
  customAdvanceAmount: number = 120
): string {
  const phone = order.shipping_address_snapshot?.phone || order.guest_phone || "";
  const sanitized = sanitizeBdPhoneNumber(phone).sanitized;
  const intlPhone = sanitized ? `88${sanitized}` : "";
  const name = order.shipping_address_snapshot?.name || order.guest_name || "Customer";
  const orderNum = order.order_number || order.id?.slice(0, 8);
  const items = order.order_items || [];
  const itemsSummary = items.map((it: any) => `${it.product_name_snapshot} x${it.quantity}`).join(", ") || "Cosmetics Order";
  const codDue = order.amount_to_collect !== undefined ? order.amount_to_collect : order.total;

  let text = "";

  if (templateType === "confirm") {
    text = `Hello ${name}, thank you for placing Order #${orderNum} at Blush & Budget!
Items: ${itemsSummary}
Total COD Due: BDT ${codDue}
Your parcel is confirmed and being prepared for delivery.`;
  } else if (templateType === "shipped") {
    const courier = order.courier_name || "SteadFast";
    const tracking = order.consignment_id || order.tracking_code || "Pending";
    const trackUrl = order.tracking_url || `https://steadfast.com.bd/t/${tracking}`;
    text = `Hello ${name}, your Order #${orderNum} has been handed over to ${courier}!
Consignment / Tracking ID: ${tracking}
Live Tracking Link: ${trackUrl}
Please keep BDT ${codDue} ready for the delivery rider.`;
  } else if (templateType === "advance") {
    text = `Hello ${name}, to confirm delivery of your Order #${orderNum} (Total BDT ${codDue}), please send BDT ${customAdvanceAmount} delivery advance via bKash/Nagad Merchant Number. Remaining BDT ${Math.max(0, codDue - customAdvanceAmount)} will be Cash on Delivery.`;
  } else if (templateType === "review") {
    text = `Hello ${name}, we hope you loved your products from Order #${orderNum}! Please share your feedback and review with us.`;
  } else if (templateType === "cancelled") {
    text = `Hello ${name}, we would like to inform you that your Order #${orderNum} has been cancelled. If you have questions or wish to re-order, please reply to this chat.`;
  } else if (templateType === "refund") {
    text = `Hello ${name}, your refund request for Order #${orderNum} has been approved and processed. Thank you for shopping with Blush & Budget.`;
  }

  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`;
}


