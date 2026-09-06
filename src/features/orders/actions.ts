"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStoreFeatureSettings } from "@/features/settings/feature-settings-actions";
import { sendSmsNotification } from "@/features/sms/actions";

export interface CreateOrderInput {
  customer: {
    name: string;
    phone: string;
    email?: string;
    district: string;
    thana: string;
    address: string;
    notes?: string;
  };
  items: Array<{
    product_id: string;
    variant_id?: string | null;
    quantity: number;
    name: string;
    price: number;
  }>;
  shipping: {
    method: string;
    amount: number;
  };
  couponCode?: string | null;
  paymentMethod?: string;
}

/**
 * WooCommerce Idempotent Stock Reduction Engine
 * wc_maybe_reduce_stock_levels()
 */
export async function reduceOrderStock(
  orderId: string,
  supabaseAdmin: any,
  providedItems?: any[]
): Promise<boolean> {
  try {
    let items: any[] = providedItems || [];
    if (items.length === 0) {
      const { data: fetchedItems } = await supabaseAdmin
        .from("order_items")
        .select("product_id, variant_id, quantity")
        .eq("order_id", orderId);
      items = fetchedItems || [];
    }

    for (const item of items) {
      if (item.product_id) {
        const { data: prod } = await supabaseAdmin
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .maybeSingle();

        if (prod && typeof prod.stock_quantity === "number") {
          const newQty = Math.max(0, prod.stock_quantity - (item.quantity || 1));
          await supabaseAdmin
            .from("products")
            .update({ stock_quantity: newQty })
            .eq("id", item.product_id);
        }
      }
    }

    return true;
  } catch (err) {
    console.warn("Stock reduction warning:", err);
    return false;
  }
}

/**
 * WooCommerce Idempotent Stock Restoration Engine
 * wc_maybe_increase_stock_levels()
 */
export async function restoreOrderStock(
  orderId: string,
  supabaseAdmin: any,
  providedItems?: any[]
): Promise<boolean> {
  try {
    let items: any[] = providedItems || [];
    if (items.length === 0) {
      const { data: fetchedItems } = await supabaseAdmin
        .from("order_items")
        .select("product_id, variant_id, quantity")
        .eq("order_id", orderId);
      items = fetchedItems || [];
    }

    for (const item of items) {
      if (item.product_id) {
        const { data: prod } = await supabaseAdmin
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .maybeSingle();

        if (prod && typeof prod.stock_quantity === "number") {
          const newQty = prod.stock_quantity + (item.quantity || 1);
          await supabaseAdmin
            .from("products")
            .update({ stock_quantity: newQty })
            .eq("id", item.product_id);
        }
      }
    }

    return true;
  } catch (err) {
    console.warn("Stock restoration warning:", err);
    return false;
  }
}

export async function createOrder(input: CreateOrderInput) {
  try {
    const supabaseUserClient = await createClient();
    const { data: authData } = await supabaseUserClient.auth.getUser();
    const user = authData?.user || null;

    const supabaseAdmin = createAdminClient();

    // 0. Validate Genuine Bangladeshi Mobile Number
    const { validateBdPhoneNumber } = await import("@/lib/validation/bangladesh-phone");
    const phoneCheck = validateBdPhoneNumber(input.customer.phone);
    if (!phoneCheck.isValid) {
      return {
        error: phoneCheck.errorMessage || "Please provide a valid 11-digit Bangladeshi mobile number.",
      };
    }
    const verifiedPhone = phoneCheck.cleanPhone;

    // 0.1 Check Blacklist & Blocked Customer Status
    try {
      // Check fraud_profiles_store
      const { data: storeSetting } = await supabaseAdmin
        .from("store_settings")
        .select("value")
        .eq("key", "fraud_profiles_store")
        .maybeSingle();

      if (storeSetting && Array.isArray(storeSetting.value)) {
        const cleanCustomerEmail = (input.customer.email || "").trim().toLowerCase();
        const blacklisted = storeSetting.value.find((fp: any) => {
          if (!fp.is_blacklisted) return false;
          const val = (fp.identifier_value || "").trim().toLowerCase();
          const valDigits = val.replace(/\D/g, "");
          const matchPhone = valDigits === verifiedPhone || val === verifiedPhone;
          const matchEmail = cleanCustomerEmail && val === cleanCustomerEmail;
          return matchPhone || matchEmail;
        });

        if (blacklisted) {
          return {
            error:
              blacklisted.blacklist_reason ||
              "This phone number or email is restricted on our security blacklist. Please contact support.",
          };
        }
      }

      // Check customer_blacklist table if present
      const { data: blockedEntry } = await supabaseAdmin
        .from("customer_blacklist")
        .select("reason")
        .or(`phone.eq.${verifiedPhone},phone.eq.+88${verifiedPhone}`)
        .maybeSingle();

      if (blockedEntry) {
        return {
          error: `This customer contact is restricted: ${blockedEntry.reason || "Blocked"}`,
        };
      }
    } catch (e) {
      console.warn("Fraud check skip on DB error:", e);
    }

    // 1. Calculate and re-verify Subtotal
    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of input.items) {
      let product: any = null;

      // 1. Try finding by ID
      if (item.product_id && item.product_id.length > 5 && !item.product_id.startsWith("prod_")) {
        const { data: pById } = await supabaseAdmin
          .from("products")
          .select("id, name, sku, regular_price, sale_price")
          .eq("id", item.product_id)
          .maybeSingle();
        product = pById;
      }

      // 2. If not found by ID, try finding by name
      if (!product && item.name) {
        const { data: pByName } = await supabaseAdmin
          .from("products")
          .select("id, name, sku, regular_price, sale_price")
          .ilike("name", item.name.trim())
          .maybeSingle();
        product = pByName;
      }

      const activePrice = product
        ? (product.sale_price ?? product.regular_price ?? item.price)
        : item.price;
      const lineTotal = activePrice * (item.quantity || 1);
      subtotal += lineTotal;

      validatedItems.push({
        product_id: product?.id || null,
        variant_id: item.variant_id || null,
        product_name_snapshot: product?.name || item.name,
        sku_snapshot: product?.sku || null,
        unit_price: activePrice,
        quantity: item.quantity || 1,
        total: lineTotal,
      });
    }

    // 2. Validate Coupon & Discount
    let discountAmount = 0;
    let appliedCoupon: any = null;

    if (input.couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", input.couponCode.toUpperCase())
        .eq("status", "active")
        .maybeSingle();

      const now = new Date();
      const isExpired = coupon?.expires_at && new Date(coupon.expires_at) < now;
      const notStarted = coupon?.starts_at && new Date(coupon.starts_at) > now;
      const limitReached = coupon?.usage_limit && (coupon.usage_count || 0) >= coupon.usage_limit;

      if (coupon && !isExpired && !notStarted && !limitReached && (!coupon.min_cart_amount || subtotal >= coupon.min_cart_amount)) {
        appliedCoupon = coupon;
        if (coupon.type === "percentage") {
          const raw = (subtotal * coupon.value) / 100;
          discountAmount = coupon.max_discount ? Math.min(raw, coupon.max_discount) : raw;
        } else if (coupon.type === "fixed") {
          discountAmount = Math.min(coupon.value, subtotal);
        } else if (coupon.type === "free_shipping") {
          // Free shipping handles the delivery fee
        }
      }
    }

    // 3. Shipping Charge
    const isFreeShipping =
      appliedCoupon?.type === "free_shipping" ||
      (input.customer.district.toLowerCase().includes("dhaka") && subtotal >= 2500) ||
      subtotal >= 3500;

    const shippingAmount = isFreeShipping ? 0 : input.shipping.amount;
    const total = Math.max(0, subtotal - discountAmount + shippingAmount);

    // 4. Generate Order Number: ORD-2026-XXXXXX
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `ORD-2026-${randomSuffix}`;

    // 5. Customer Account Association & Automatic Account Creation
    let orderUserId = user?.id || null;
    let autoCreatedAccount: { email: string; tempPassword?: string; isNewUser: boolean } | null = null;

    if (!orderUserId) {
      const customerEmail = (input.customer.email?.trim() || `${verifiedPhone}@customer.blushandbudget.com`).toLowerCase();

      try {
        // Check if user with phone or email already exists in profiles
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id, email, phone")
          .or(`phone.eq.${verifiedPhone},email.eq.${customerEmail}`)
          .maybeSingle();

        if (existingProfile) {
          orderUserId = existingProfile.id;
        } else {
          // Automatically create customer user in Supabase Auth
          const tempPassword = `Blush#${Math.random().toString(36).slice(-6)}!${verifiedPhone.slice(-4)}`;
          const { data: createdAuthUser, error: authCreateErr } = await supabaseAdmin.auth.admin.createUser({
            email: customerEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              full_name: input.customer.name,
              phone: verifiedPhone,
              auto_created: true,
              has_custom_password: false,
            },
          });

          if (!authCreateErr && createdAuthUser?.user) {
            orderUserId = createdAuthUser.user.id;
            await supabaseAdmin.from("profiles").upsert(
              {
                id: orderUserId,
                email: customerEmail,
                full_name: input.customer.name,
                phone: verifiedPhone,
                role: "customer",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );

            autoCreatedAccount = {
              email: customerEmail,
              tempPassword: tempPassword,
              isNewUser: true,
            };
          }
        }
      } catch (authErr) {
        console.warn("Auto account creation warning (proceeding with guest order):", authErr);
      }
    }

    // 6. Initial Status matching WooCommerce (COD -> processing, Online -> pending)
    const selectedMethod = (input.paymentMethod || "cod").toLowerCase();
    const initialStatus = selectedMethod === "cod" ? "processing" : "pending";

    // 7. Insert Order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: orderUserId,
        guest_name: input.customer.name,
        guest_phone: verifiedPhone,
        guest_email: input.customer.email || null,
        is_guest: !orderUserId,
        subtotal,
        discount_amount: discountAmount,
        shipping_amount: shippingAmount,
        tax_amount: 0,
        total,
        payment_method: selectedMethod,
        payment_status: "pending",
        shipping_method: input.shipping.method,
        shipping_address_snapshot: {
          name: input.customer.name,
          phone: verifiedPhone,
          email: input.customer.email || null,
          district: input.customer.district,
          thana: input.customer.thana,
          address: input.customer.address,
        },
        public_note: input.customer.notes || null,
        status: initialStatus,
      })
      .select()
      .single();

    if (orderErr) {
      console.error("Order creation failed:", orderErr);
      return { error: `Failed to place order: ${orderErr.message}` };
    }

    // 7. Insert Order Items
    const itemsToInsert = validatedItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    await supabaseAdmin.from("order_items").insert(itemsToInsert);

    // 8. Reduce Stock for Processing COD Order
    await reduceOrderStock(order.id, supabaseAdmin, itemsToInsert);

    // 9. Insert Initial Status History
    await supabaseAdmin.from("order_status_history").insert({
      order_id: order.id,
      status: initialStatus,
      note: "Order placed via website (Cash on Delivery). Stock reduced.",
      created_by: user?.id || null,
    });


    // 8. Update Coupon Usage if applicable
    if (appliedCoupon) {
      await supabaseAdmin.from("coupon_usage").insert({
        coupon_id: appliedCoupon.id,
        user_id: user?.id || null,
        order_id: order.id,
        discount_amount: discountAmount,
      });

      await supabaseAdmin
        .from("coupons")
        .update({ usage_count: (appliedCoupon.usage_count || 0) + 1 })
        .eq("id", appliedCoupon.id);
    }

    // 9. Automated Transactional SMS Trigger (Admin Controlled)
    const featureSettings = await getStoreFeatureSettings();
    if (featureSettings.enable_order_placed_sms !== false && input.customer.phone) {
      sendSmsNotification({
        recipientPhone: input.customer.phone,
        eventType: "order_created",
        variables: {
          customer_name: input.customer.name,
          order_number: order.order_number,
          total: total.toString(),
          tracking_url: `/account/track?order=${order.order_number}`,
        },
      }).catch((e) => console.error("SMS notification trigger failed:", e));
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      autoCreatedAccount: autoCreatedAccount || null,
      order: {
        ...order,
        order_items: itemsToInsert,
      },
    };
  } catch (err: any) {
    console.error("Unexpected checkout error:", err);
    return { error: err.message || "An unexpected error occurred during checkout" };
  }
}

export async function getOrderById(orderId: string) {
  const supabaseAdmin = createAdminClient();

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        product_name_snapshot,
        sku_snapshot,
        unit_price,
        quantity,
        total
      ),
      order_status_history (
        id,
        status,
        note,
        created_at
      )
    `)
    .eq("id", orderId)
    .single();

  if (error || !order) return null;
  return order;
}

export async function getAdminOrders(statusFilter?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        product_id,
        variant_id,
        product_name_snapshot,
        sku_snapshot,
        unit_price,
        quantity,
        total
      ),
      order_status_history (
        id,
        status,
        note,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to fetch admin orders:", error);
    return [];
  }

  // Enrich with dynamic calculation & risk scoring
  const { computeCustomerRiskProfile, calculateOrderFinancials } = await import("@/types/orders");

  return (data || []).map((order) => {
    const advancePaid = Number(order.advance_paid) || 0;
    const grossTotal = Number(order.total) || 0;
    const financials = calculateOrderFinancials(
      order.subtotal || 0,
      order.shipping_amount || 0,
      order.discount_amount || 0,
      order.tax_amount || 0,
      advancePaid
    );

    const phone = order.shipping_address_snapshot?.phone || order.guest_phone || "";
    const riskProfile = computeCustomerRiskProfile({
      phone,
      district: order.shipping_address_snapshot?.district || "",
      orderTotal: grossTotal,
      advancePaid,
      isBlacklisted: Boolean(order.fraud_score && order.fraud_score < 20),
    });

    return {
      ...order,
      advance_paid: advancePaid,
      amount_to_collect: financials.amount_to_collect,
      payment_status: order.payment_status || financials.payment_status,
      risk_profile: riskProfile,
    };
  });
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  note?: string,
  isOverride: boolean = false,
  overrideReason?: string
) {
  const supabaseAdmin = createAdminClient();
  const supabaseUser = await createClient();
  const { data: authData } = await supabaseUser.auth.getUser();

  // 1. Fetch current order to validate transition invariant
  const { data: currentOrder } = await supabaseAdmin
    .from("orders")
    .select("status, order_number")
    .eq("id", orderId)
    .single();

  if (currentOrder) {
    const { canTransitionOrderStatus } = await import("@/types/orders");
    const check = canTransitionOrderStatus(currentOrder.status as any, newStatus as any, isOverride);
    if (!check.allowed) {
      return { error: check.reason || "Invalid status transition" };
    }
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();

  if (error) return { error: error.message };

  // 2. WooCommerce Idempotent Inventory Synchronization
  try {
    const isNowCancelledOrRefunded = ["cancelled", "refunded", "failed", "returned"].includes(newStatus);
    const isNowActive = ["processing", "confirmed", "on-hold", "completed", "shipped"].includes(newStatus);

    if (isNowCancelledOrRefunded) {
      await restoreOrderStock(orderId, supabaseAdmin);
    } else if (isNowActive) {
      await reduceOrderStock(orderId, supabaseAdmin);
    }
  } catch (invErr) {
    console.warn("Inventory sync warning (non-fatal):", invErr);
  }

  const historyNote = isOverride
    ? `[ADMIN OVERRIDE]: Status manually forced from '${currentOrder?.status || "unknown"}' to '${newStatus}'. Reason: ${overrideReason || "Supervisor manual correction"}`
    : note || `Status updated from ${currentOrder?.status || "unknown"} to ${newStatus}`;

  await supabaseAdmin.from("order_status_history").insert({
    order_id: orderId,
    status: newStatus,
    note: historyNote,
    created_by: authData?.user?.id || null,
  });

  return { success: true, order: data };
}



export async function recordAdvancePayment(params: {
  orderId: string;
  amount: number;
  paymentMethod: "bkash" | "nagad" | "rocket" | "upay" | "bank_transfer" | "cash";
  trxId: string;
  note?: string;
}) {
  const supabaseAdmin = createAdminClient();
  const supabaseUser = await createClient();
  const { data: authData } = await supabaseUser.auth.getUser();

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", params.orderId)
    .single();

  if (fetchErr || !order) {
    return { error: "Order not found" };
  }

  const { calculateOrderFinancials } = await import("@/types/orders");
  const newAdvancePaid = (Number(order.advance_paid) || 0) + params.amount;
  const financials = calculateOrderFinancials(
    order.subtotal || 0,
    order.shipping_amount || 0,
    order.discount_amount || 0,
    order.tax_amount || 0,
    newAdvancePaid
  );

  const { data: updatedOrder, error: updateErr } = await supabaseAdmin
    .from("orders")
    .update({
      advance_paid: newAdvancePaid,
      payment_status: financials.payment_status,
      advance_payment_method: params.paymentMethod,
      advance_trx_id: params.trxId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.orderId)
    .select()
    .single();

  if (updateErr) {
    return { error: updateErr.message };
  }

  await supabaseAdmin.from("order_status_history").insert({
    order_id: params.orderId,
    status: order.status,
    note: `Advance payment received: ৳${params.amount} via ${params.paymentMethod.toUpperCase()} (TrxID: ${params.trxId}). Remaining COD: ৳${financials.amount_to_collect}. ${params.note || ""}`,
    created_by: authData?.user?.id || null,
  });

  return {
    success: true,
    order: {
      ...updatedOrder,
      amount_to_collect: financials.amount_to_collect,
    },
  };
}

export async function updateAdminOrderFull(orderId: string, payload: {
  status?: string;
  note?: string;
  internalNote?: string;
  payment_method?: string;
  payment_status?: string;
  shipping_amount?: number;
  discount_amount?: number;
  total?: number;
  shipping_address_snapshot?: any;
}) {
  const supabaseAdmin = createAdminClient();
  const supabaseUser = await createClient();
  const { data: authData } = await supabaseUser.auth.getUser();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (payload.status) updateData.status = payload.status;
  if (payload.payment_method) updateData.payment_method = payload.payment_method;
  if (payload.payment_status) updateData.payment_status = payload.payment_status;
  if (payload.shipping_amount !== undefined) updateData.shipping_amount = payload.shipping_amount;
  if (payload.discount_amount !== undefined) updateData.discount_amount = payload.discount_amount;
  if (payload.total !== undefined) updateData.total = payload.total;
  if (payload.shipping_address_snapshot) updateData.shipping_address_snapshot = payload.shipping_address_snapshot;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update(updateData)
    .eq("id", orderId)
    .select(`
      *,
      order_items (
        id,
        product_name_snapshot,
        sku_snapshot,
        unit_price,
        quantity,
        total
      ),
      order_status_history (
        id,
        status,
        note,
        created_at
      )
    `)
    .single();

  if (error) return { error: error.message };

  if (payload.status || payload.note) {
    await supabaseAdmin.from("order_status_history").insert({
      order_id: orderId,
      status: payload.status || data.status,
      note: payload.note || `Order modified by admin`,
      created_by: authData?.user?.id || null,
    });

    // Automated Transactional SMS Trigger on Order Shipped (Admin Controlled)
    if (payload.status === "shipped") {
      const featureSettings = await getStoreFeatureSettings();
      const phone = data.guest_phone || data.shipping_address_snapshot?.phone;
      if (featureSettings.enable_order_shipped_sms !== false && phone) {
        sendSmsNotification({
          recipientPhone: phone,
          eventType: "order_shipped",
          variables: {
            customer_name: data.guest_name || data.shipping_address_snapshot?.name || "Customer",
            order_number: data.order_number,
            courier_name: data.courier_name || "SteadFast Courier",
            tracking_id: data.consignment_id || data.tracking_code || data.order_number,
            tracking_url: data.tracking_url || `/account/track?order=${data.order_number}`,
          },
        }).catch((e) => console.error("Dispatch SMS trigger failed:", e));
      }
    }
  }

  return { success: true, order: data };
}

export async function trackOrder(orderNumber: string, phone: string) {
  const supabase = createAdminClient();
  const cleanNumber = orderNumber.trim().toUpperCase();
  const cleanPhone = phone.trim();

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        product_name_snapshot,
        sku_snapshot,
        unit_price,
        quantity,
        total
      ),
      order_status_history (
        id,
        status,
        note,
        created_at
      )
    `)
    .eq("order_number", cleanNumber)
    .or(`guest_phone.eq.${cleanPhone},shipping_address_snapshot->>phone.eq.${cleanPhone}`)
    .maybeSingle();

  if (error || !order) {
    return { error: "No order found matching this Order Number and Phone Number combination." };
  }

  return { order };
}

/**
 * Customer Self-Service Order Cancellation
 * Allows customers to cancel pending/un-dispatched orders directly from their account dashboard.
 * Restores product stock automatically and logs to status history.
 */
export async function cancelCustomerOrder(orderId: string, reason?: string) {
  try {
    const supabaseUser = await createClient();
    const { data: authData } = await supabaseUser.auth.getUser();
    const user = authData?.user;

    if (!user) {
      return { error: "You must be signed in to cancel an order." };
    }

    const supabaseAdmin = createAdminClient();

    // Fetch the order and verify ownership
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchErr || !order) {
      return { error: "Order not found or you do not have permission to cancel this order." };
    }

    // Check if order can be cancelled
    const nonCancellableStatuses = [
      "shipped",
      "in_transit",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "returned",
      "refunded",
    ];
    if (nonCancellableStatuses.includes(order.status)) {
      return {
        error: `Order cannot be cancelled because it is already marked as "${order.status}". Please contact our customer support for assistance.`,
      };
    }

    if (order.consignment_id) {
      return {
        error: "This order has already been booked with the courier and cannot be cancelled online. Please contact support immediately.",
      };
    }

    // Restore inventory
    await restoreOrderStock(order.id, supabaseAdmin, order.order_items);

    // Update order status to cancelled
    const cancelNote = reason?.trim()
      ? `Cancelled by customer: ${reason.trim()}`
      : "Cancelled by customer via self-service";

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateErr) {
      return { error: updateErr.message };
    }

    // Insert status history
    await supabaseAdmin.from("order_status_history").insert({
      order_id: order.id,
      status: "cancelled",
      note: cancelNote,
      created_by: user.id,
    });

    // Revalidate paths
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true };
  } catch (err: any) {
    console.error("Cancel order error:", err);
    return { error: err?.message || "An unexpected error occurred while cancelling your order." };
  }
}
