/**
 * Core Domain Models & Type System for Blush & Budget E-Commerce Orders
 * Specifically tailored for high-volume Bangladeshi logistics (SteadFast, Pathao, COD)
 */

import { buildCourierTrackingUrl, getBaseUrl } from "@/lib/utils";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "on-hold"
  | "on_hold"
  | "packed"
  | "ready_for_pickup"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "failed"
  | "return_requested"
  | "returned"
  | "refunded";

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
 * WooCommerce Core & Bangladesh Logistics Finite State Machine (FSM) Transitions
 * Allows flexible, deterministic transitions across order lifecycle
 */
export const ORDER_FSM_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  // 1. Initial Order States
  "pending": ["confirmed", "processing", "on-hold", "cancelled", "failed"],
  "confirmed": ["processing", "packed", "ready_for_pickup", "shipped", "completed", "delivered", "on-hold", "cancelled"],
  "on-hold": ["processing", "confirmed", "cancelled", "failed"],
  "on_hold": ["processing", "confirmed", "cancelled", "failed"],

  // 2. Fulfillment & Packing States
  "processing": ["confirmed", "packed", "ready_for_pickup", "shipped", "completed", "delivered", "on-hold", "cancelled"],
  "packed": ["ready_for_pickup", "shipped", "processing", "cancelled"],
  "ready_for_pickup": ["shipped", "completed", "delivered", "processing", "cancelled"],

  // 3. Logistics & Transit States
  "shipped": ["in_transit", "out_for_delivery", "completed", "delivered", "returned", "failed", "cancelled"],
  "in_transit": ["out_for_delivery", "completed", "delivered", "returned", "failed"],
  "out_for_delivery": ["completed", "delivered", "returned", "failed"],

  // 4. Terminal & Delivery States
  "delivered": ["completed", "refunded", "returned", "processing"],
  "completed": ["delivered", "refunded", "returned", "processing"],
  "cancelled": ["processing", "confirmed"], // Re-opening cancelled order
  "failed": ["processing", "cancelled", "returned"],
  "return_requested": ["returned", "processing", "cancelled"],
  "returned": ["refunded", "processing", "completed"],
  "refunded": ["cancelled"],
};

/**
 * State Transition Guard
 * Verifies if an order status change is permitted according to WooCommerce & Logistics FSM
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
    "confirmed": "Confirmed (Verified)",
    "processing": "Processing",
    "on-hold": "On Hold",
    "on_hold": "On Hold",
    "packed": "Packed",
    "ready_for_pickup": "Ready for Pickup",
    "shipped": "Shipped / In Transit",
    "in_transit": "In Transit",
    "out_for_delivery": "Out for Delivery",
    "delivered": "Delivered",
    "completed": "Completed (Delivered & Paid)",
    "cancelled": "Cancelled",
    "failed": "Failed (RTO)",
    "return_requested": "Return Requested",
    "returned": "Returned (RTO)",
    "refunded": "Refunded",
  };

  const nextKeys = ORDER_FSM_TRANSITIONS[currentStatus] || [];

  // Current status label
  const options: Array<{ value: OrderStatus; label: string; isReopen?: boolean }> = [
    { value: currentStatus, label: statusLabels[currentStatus] || currentStatus },
  ];

  for (const nextKey of nextKeys) {
    if ((currentStatus === "cancelled" || currentStatus === "failed") && (nextKey === "processing" || nextKey === "confirmed")) {
      options.push({
        value: nextKey,
        label: `Re-open as ${statusLabels[nextKey] || nextKey}`,
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
  templateType: "abandoned" | "confirm" | "shipped" | "advance" | "review" | "cancelled" | "refund",
  customAdvanceAmount: number = 120,
  customTemplates?: Array<{ template_type: string; template: string; advance_amount?: number; is_active?: boolean }>
): string {
  const phone = order.shipping_address_snapshot?.phone || order.guest_phone || order.customer_phone || "";
  const sanitized = sanitizeBdPhoneNumber(phone).sanitized;
  const intlPhone = sanitized ? `88${sanitized}` : "";
  const name = order.shipping_address_snapshot?.name || order.guest_name || order.customer_name || "Customer";
  const orderNum = order.order_number || order.id?.slice(0, 8);
  const items = order.order_items || order.cart_items || [];
  const itemsSummary = items.map((it: any) => `${it.product_name_snapshot || it.name} x${it.quantity}`).join(", ") || "Cosmetics Order";
  const codDue = order.amount_to_collect !== undefined ? order.amount_to_collect : (order.cart_total || order.total || 0);
  const tracking = order.consignment_id || order.tracking_code || order.tracking_id || "";
  const courier = order.courier_name || (tracking.startsWith("PTH") || tracking.startsWith("DE") ? "Pathao Courier" : "SteadFast Courier");
  const baseLiveUrl = getBaseUrl();
  let trackUrl = buildCourierTrackingUrl(courier, tracking, order.tracking_url);
  if (!trackUrl || trackUrl.startsWith("/")) {
    trackUrl = baseLiveUrl ? `${baseLiveUrl}/account/track?order=${orderNum}` : `/account/track?order=${orderNum}`;
  }
  const advanceFee = customAdvanceAmount || 120;
  const remainingDue = Math.max(0, codDue - advanceFee);
  const fallbackCheckoutUrl = order.checkout_url
    ? (order.checkout_url.startsWith("http") ? order.checkout_url : (baseLiveUrl ? `${baseLiveUrl}${order.checkout_url.startsWith("/") ? order.checkout_url : `/${order.checkout_url}`}` : order.checkout_url))
    : (baseLiveUrl ? `${baseLiveUrl}/checkout` : "/checkout");

  // Check if admin defined a custom active template for this type
  const matchedCustom = customTemplates?.find(
    (t) => t.template_type === templateType && t.is_active !== false
  );

  let text = "";

  if (matchedCustom && matchedCustom.template) {
    let customText = matchedCustom.template;
    const feeToUse = matchedCustom.advance_amount || advanceFee;
    const remToUse = Math.max(0, codDue - feeToUse);

    const replacements: Record<string, string> = {
      customer_name: name,
      order_number: String(orderNum),
      store_name: "Blush & Budget",
      items_summary: itemsSummary,
      cod_due: String(codDue),
      courier_name: courier,
      tracking_id: String(tracking),
      tracking_url: trackUrl,
      advance_amount: String(feeToUse),
      remaining_due: String(remToUse),
      checkout_url: fallbackCheckoutUrl,
      discount_code: "BLUSH5",
    };

    for (const [k, v] of Object.entries(replacements)) {
      customText = customText.replaceAll(`{{${k}}}`, v);
    }
    text = customText;
  } else {
    // Standard system default templates (Humanized Bangla with English Order Numbers)
    if (templateType === "abandoned") {
      text = `প্রিয় ${name}, আসসালামু আলাইকুম! 🌸 আপনি Blush & Budget-এ আপনার পছন্দের কিছু প্রোডাক্ট কার্টে রেখে গিয়েছিলেন (${itemsSummary})。\n\nআপনি চাইলে এখনই আপনার অর্ডারটি কনফার্ম করতে পারেন। আপনার সুবিধার্থে আমরা দিচ্ছি দ্রুত হোম ডেলিভারি।\n\nঅর্ডার সম্পূর্ণ করতে ভিজিট করুন: ${fallbackCheckoutUrl}\nযেকোনো প্রশ্ন বা সহযোগিতার জন্য আমাদের মেসেজ দিন। ধন্যবাদ!`;
    } else if (templateType === "confirm") {
      text = `প্রিয় ${name}, Blush & Budget-এ আপনার অর্ডারটির জন্য আন্তরিক ধন্যবাদ! 🌸\n\nঅর্ডার নাম্বার: #${orderNum}\nপ্রোডাক্ট: ${itemsSummary}\nক্যাশ অন ডেলিভারি বিল: ৳${codDue}\n\nআমরা আপনার পার্সেলটি যত্ন সহকারে প্যাক করছি এবং দ্রুততম সময়ে ডেলিভারির জন্য প্রস্তুত করছি। ডেলিভারি রাইডার কল করলে অনুগ্রহ করে রিসিভ করবেন।`;
    } else if (templateType === "shipped") {
      text = `প্রিয় ${name}, সুখবর! আপনার অর্ডারটি (#${orderNum}) কুরিয়ারে হ্যান্ডওভার করা হয়েছে। 🚚\n\nকুরিয়ার: ${courier}\nট্র্যাকিং আইডি: ${tracking}\nলাইভ ট্র্যাকিং লিংক: ${trackUrl}\nডেলিভারি রাইডারকে প্রদেয় মোট টাকা: ৳${codDue}\n\nরাইডার আপনার ঠিকানায় পৌঁছানোর আগে কল করবেন। যেকোনো প্রয়োজনে আমাদের এই নম্বরে মেসেজ দিন।`;
    } else if (templateType === "advance") {
      text = `প্রিয় ${name}, Blush & Budget থেকে শুভেচ্ছা! আপনার অর্ডার #${orderNum} টি চূড়ান্তভাবে প্রসেসিং করতে ঢাকার বাইরের ডেলিভারি চার্জ বাবদ ৳${advanceFee} অগ্রিম প্রদান করার জন্য বিনীত অনুরোধ করছি।\n\nবাকি ৳${remainingDue} আপনি পার্সেল হাতে পেয়ে ক্যাশ অন ডেলিভারিতে পরিশোধ করবেন।\n\nবিকাশ/নগদ মার্চেন্ট নম্বরে পেমেন্ট করার পর ট্রানজেকশন আইডি বা স্ক্রিনশট এই চ্যাটে পাঠিয়ে কনফার্ম করুন। ধন্যবাদ!`;
    } else if (templateType === "review") {
      text = `প্রিয় ${name}, আসসালামু আলাইকুম! আশা করি Blush & Budget থেকে নেওয়া আপনার প্রোডাক্টগুলো হাতে পেয়েছেন এবং ব্যবহার উপভোগ করছেন। ✨\n\nআমাদের প্রোডাক্ট ও সার্ভিসের অভিজ্ঞতা আপনার কেমন লাগলো? আপনার মূল্যবান রিভিউ অথবা একটি সুন্দর ছবি আমাদের সাথে শেয়ার করলে আমরা অনেক আনন্দিত হব!`;
    } else if (templateType === "cancelled") {
      text = `প্রিয় ${name}, আমরা আন্তরিকভাবে দুঃখের সাথে জানাচ্ছি যে আপনার অর্ডারটি (#${orderNum}) বাতিল করা হয়েছে।\n\nকোনো ভুল বোঝাবুঝি হয়ে থাকলে অথবা পুনরায় অর্ডার করতে চাইলে অনুগ্রহ করে এই চ্যাটে আমাদের জানান। আমরা আপনাকে সাহায্য করতে সবসময় প্রস্তুত।`;
    } else if (templateType === "refund") {
      text = `প্রিয় ${name}, আপনার অর্ডার #${orderNum}-এর রিফান্ড সফলভাবে সম্পন্ন হয়েছে। আপনার দেওয়া পেমেন্ট একাউন্টটি অনুগ্রহ করে চেক করে নিন।\n\nযেকোনো সহযোগিতার জন্য আমরা পাশে আছি। Blush & Budget-এর সাথে থাকার জন্য ধন্যবাদ।`;
    }
  }

  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generate Structured WhatsApp recovery link for Incomplete / Abandoned checkouts
 */
export function generateWhatsAppAbandonedMessage(
  lead: any,
  originUrl: string = "",
  customTemplates?: Array<{ template_type: string; template: string; advance_amount?: number; is_active?: boolean }>
): string {
  const base = originUrl || getBaseUrl();
  const cleanBase = base.replace(/\/$/, "");
  const checkoutUrl = lead?.id ? `${cleanBase}/r/${lead.id}` : `${cleanBase}/checkout`;
  return generateWhatsAppOrderMessage(
    {
      ...lead,
      checkout_url: checkoutUrl,
    },
    "abandoned",
    120,
    customTemplates
  );
}



