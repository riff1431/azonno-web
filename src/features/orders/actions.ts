"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStoreFeatureSettings } from "@/features/settings/feature-settings-actions";
import { sendSmsNotification } from "@/features/sms/actions";
import { generateOrderNumber, extractClientIp, getShortProductId, buildCourierTrackingUrl, getLiveBaseUrl, ensureAbsoluteUrl } from "@/lib/utils";
import { isModuleEnabled } from "@/lib/settings/config-service";
import { markLeadConverted } from "@/features/fraud/actions";

export interface CreateOrderInput {
  customer: {
    name: string;
    phone: string;
    email?: string;
    division?: string;
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
        sku_snapshot: getShortProductId(product),
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

    // 4. Generate Short, Random, Non-Serial Order Number (e.g. ORD-84219)
    let orderNumber = generateOrderNumber();
    let collisionCheck = 0;
    while (collisionCheck < 5) {
      const { data: existing } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("order_number", orderNumber)
        .maybeSingle();
      if (!existing) break;
      orderNumber = generateOrderNumber();
      collisionCheck++;
    }

    // 5. Customer Account Association & Automatic Account Creation
    let orderUserId = user?.id || null;
    let autoCreatedAccount: { email: string; tempPassword?: string; isNewUser: boolean } | null = null;

    if (!orderUserId) {
      const customerEmail = (input.customer.email?.trim() || `${verifiedPhone}@customer.blushbudget.com`).toLowerCase();
      const standardPassword = `Blush@${verifiedPhone.slice(-6)}`;

      try {
        // 1. Check if user with phone or email already exists in profiles
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id, email, phone, full_name")
          .or(`phone.eq.${verifiedPhone},phone.eq.+88${verifiedPhone},email.eq.${customerEmail}`)
          .maybeSingle();

        if (existingProfile) {
          orderUserId = existingProfile.id;
          
          // Get actual primary email from Auth user
          const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(existingProfile.id);
          const primaryEmail = authUserData?.user?.email || existingProfile.email || customerEmail;

          // Always synchronize standard password so client signInWithPassword succeeds immediately
          await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
            password: standardPassword,
            user_metadata: {
              ...(authUserData?.user?.user_metadata || {}),
              full_name: input.customer.name,
              phone: verifiedPhone,
            },
          });

          // Update profile with newest details
          await supabaseAdmin.from("profiles").update({
            full_name: input.customer.name,
            phone: verifiedPhone,
            ...(input.customer.email?.trim() ? { email: input.customer.email.trim().toLowerCase() } : {}),
            updated_at: new Date().toISOString(),
          }).eq("id", orderUserId);

          autoCreatedAccount = {
            email: primaryEmail,
            tempPassword: standardPassword,
            isNewUser: false,
          };
        } else {
          // 2. Check if user exists in auth.users by email or phone
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const foundUser = listData?.users?.find(
            (u: any) =>
              u.email?.toLowerCase() === customerEmail ||
              u.phone === verifiedPhone ||
              u.phone === `+88${verifiedPhone}` ||
              u.user_metadata?.phone === verifiedPhone ||
              u.user_metadata?.phone === `+88${verifiedPhone}` ||
              (u.email && u.email.startsWith(verifiedPhone + "@"))
          );

          if (foundUser) {
            orderUserId = foundUser.id;
            await supabaseAdmin.auth.admin.updateUserById(foundUser.id, {
              password: standardPassword,
              user_metadata: {
                ...(foundUser.user_metadata || {}),
                full_name: input.customer.name,
                phone: verifiedPhone,
              },
            });

            await supabaseAdmin.from("profiles").upsert(
              {
                id: orderUserId,
                email: foundUser.email || customerEmail,
                full_name: input.customer.name,
                phone: verifiedPhone,
                role: "customer",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );

            autoCreatedAccount = {
              email: foundUser.email || customerEmail,
              tempPassword: standardPassword,
              isNewUser: false,
            };
          } else {
            // 3. Automatically create new customer user in Supabase Auth
            const { data: createdAuthUser, error: authCreateErr } = await supabaseAdmin.auth.admin.createUser({
              email: customerEmail,
              password: standardPassword,
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
                tempPassword: standardPassword,
                isNewUser: true,
              };
            }
          }
        }
      } catch (authErr) {
        console.warn("Auto account creation warning (proceeding with order):", authErr);
      }
    }

    // Retroactively link all previous unlinked guest orders placed with this phone number to the customer account
    if (orderUserId && verifiedPhone) {
      try {
        await supabaseAdmin
          .from("orders")
          .update({ user_id: orderUserId, is_guest: false })
          .or(`guest_phone.eq.${verifiedPhone},guest_phone.eq.+88${verifiedPhone}`)
          .is("user_id", null);
      } catch (linkErr) {
        console.warn("Retroactive order linking warning:", linkErr);
      }
    }

    // 0.2 Capture First-Party Marketing Cookies & Network Identifiers for EMQ 9.0+
    let trackingMetadata: Record<string, string | undefined> = {};
    try {
      const { headers, cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const headerStore = await headers();

      const fbp = cookieStore.get("_fbp")?.value;
      const fbc = cookieStore.get("_fbc")?.value;
      const ttp = cookieStore.get("_ttp")?.value;
      const ttclid = cookieStore.get("_ttclid")?.value;
      const fbclid = cookieStore.get("fbclid")?.value;
      const clientIp = extractClientIp(headerStore);
      const clientUa = headerStore.get("user-agent") || undefined;

      trackingMetadata = {
        fbp: fbp || undefined,
        fbc: fbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined),
        ttp: ttp || undefined,
        ttclid: ttclid || undefined,
        ip_address: clientIp,
        user_agent: clientUa,
      };
    } catch {
      // Non-fatal if running in context without request headers
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
          division: input.customer.division || "Dhaka",
          district: input.customer.district,
          thana: input.customer.thana,
          address: input.customer.address,
          ...trackingMetadata,
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

    // 8. Reduce Stock for Confirmed COD Orders (Online orders will reduce upon verified payment)
    if (selectedMethod === "cod") {
      await reduceOrderStock(order.id, supabaseAdmin, itemsToInsert);
    }

    // 9. Insert Initial Status History
    await supabaseAdmin.from("order_status_history").insert({
      order_id: order.id,
      status: initialStatus,
      note:
        selectedMethod === "cod"
          ? "Order placed via website (Cash on Delivery). Stock reduced."
          : `Order checkout initiated via website (${selectedMethod.toUpperCase()}). Awaiting customer online payment confirmation.`,
      created_by: user?.id || null,
    });

    // 9.1 Auto-save customer address to addresses table & sync profile for 1-click future checkouts
    if (orderUserId) {
      try {
        await supabaseAdmin.from("profiles").update({
          phone: verifiedPhone,
          full_name: input.customer.name,
          updated_at: new Date().toISOString(),
        }).eq("id", orderUserId);

        const { data: existingAddresses } = await supabaseAdmin
          .from("addresses")
          .select("id")
          .eq("user_id", orderUserId)
          .limit(1);

        if (!existingAddresses || existingAddresses.length === 0) {
          await supabaseAdmin.from("addresses").insert({
            user_id: orderUserId,
            name: input.customer.name,
            phone: verifiedPhone,
            division: input.customer.division || "Dhaka",
            district: input.customer.district || "Dhaka City",
            thana: input.customer.thana || "Gulshan",
            area: input.customer.thana || "Gulshan",
            address_line: input.customer.address,
            is_default: true,
          });
        } else {
          await supabaseAdmin.from("addresses").update({
            name: input.customer.name,
            phone: verifiedPhone,
            division: input.customer.division || "Dhaka",
            district: input.customer.district || "Dhaka City",
            thana: input.customer.thana || "Gulshan",
            area: input.customer.thana || "Gulshan",
            address_line: input.customer.address,
            updated_at: new Date().toISOString(),
          }).eq("id", existingAddresses[0].id);
        }
      } catch (addrErr) {
        console.warn("Auto-saving address warning:", addrErr);
      }
    }

    // 10. Update Coupon Usage if applicable
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

    // 11. Automated Transactional SMS Trigger (Controlled via Notification Matrix)
    if (input.customer.phone) {
      const liveBase = await getLiveBaseUrl();
      sendSmsNotification({
        recipientPhone: input.customer.phone,
        eventType: "order_created",
        variables: {
          customer_name: input.customer.name,
          order_number: order.order_number,
          total: total.toString(),
          tracking_url: `${liveBase}/account/track?order=${order.order_number}`,
        },
      }).catch((e) => console.error("SMS notification trigger failed:", e));
    }

    if (input.customer.phone) {
      markLeadConverted(input.customer.phone).catch(() => null);
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

const DEMO_ADMIN_ORDERS = [
  {
    id: "ord-demo-001",
    order_number: "ORD-2026-8941",
    customer_id: "cust-demo-1",
    guest_phone: "01712345678",
    status: "processing",
    payment_status: "pending",
    payment_method: "cod",
    subtotal: 1850,
    shipping_amount: 70,
    discount_amount: 0,
    tax_amount: 0,
    total: 1920,
    advance_paid: 0,
    shipping_method: "Inside Dhaka Delivery",
    consignment_id: "SF-8941-DH",
    courier_name: "SteadFast Courier",
    tracking_code: "SF-8941-DH",
    fraud_score: 95,
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    shipping_address_snapshot: {
      name: "Tanvir Ahmed",
      phone: "01712345678",
      email: "tanvir.ahmed@example.com",
      division: "Dhaka",
      district: "Dhaka City",
      thana: "Dhanmondi",
      address: "House 42, Road 7/A, Dhanmondi, Dhaka",
      notes: "Please call before delivery",
      consignment_id: "SF-8941-DH",
      courier_name: "SteadFast Courier",
    },
    order_items: [
      {
        id: "item-001",
        product_id: "men-01",
        variant_id: "m-01-l",
        product_name_snapshot: "Royal Oxford Classic Formal Shirt - Sky Blue / L",
        sku_snapshot: "AZ-SH-01-SKY-L",
        unit_price: 1850,
        quantity: 1,
        total: 1850,
      },
    ],
    order_status_history: [
      {
        id: "hist-001",
        status: "processing",
        note: "Order confirmed and booked with Steadfast Courier (SF-8941-DH)",
        created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      },
      {
        id: "hist-002",
        status: "pending",
        note: "Order placed via website checkout (Cash on Delivery)",
        created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      },
    ],
  },
  {
    id: "ord-demo-002",
    order_number: "ORD-2026-8942",
    customer_id: "cust-demo-2",
    guest_phone: "01819876543",
    status: "shipped",
    payment_status: "paid",
    payment_method: "bkash",
    subtotal: 2450,
    shipping_amount: 130,
    discount_amount: 100,
    tax_amount: 0,
    total: 2480,
    advance_paid: 2480,
    shipping_method: "Outside Dhaka Express",
    consignment_id: "PTH-8942-CTG",
    courier_name: "Pathao Courier",
    tracking_code: "PTH-8942-CTG",
    fraud_score: 98,
    created_at: new Date(Date.now() - 3600 * 1000 * 14).toISOString(),
    shipping_address_snapshot: {
      name: "Nusrat Jahan",
      phone: "01819876543",
      email: "nusrat.jahan@example.com",
      division: "Chattogram",
      district: "Chattogram",
      thana: "Panchlaish",
      address: "Flat 4B, Green View Tower, Nasirabad, Chattogram",
      notes: "bKash TrxID: 9J48KL2910",
      consignment_id: "PTH-8942-CTG",
      courier_name: "Pathao Courier",
    },
    order_items: [
      {
        id: "item-002",
        product_id: "women-01",
        variant_id: "w-01-m",
        product_name_snapshot: "Floral Fusion Georgette Kurti - Emerald Green / M",
        sku_snapshot: "AZ-KR-01-EMR-M",
        unit_price: 2450,
        quantity: 1,
        total: 2450,
      },
    ],
    order_status_history: [
      {
        id: "hist-003",
        status: "shipped",
        note: "Dispatched with Pathao Courier Hub Nasirabad",
        created_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
      },
      {
        id: "hist-004",
        status: "confirmed",
        note: "bKash payment verified (BDT 2,480)",
        created_at: new Date(Date.now() - 3600 * 1000 * 14).toISOString(),
      },
    ],
  },
  {
    id: "ord-demo-003",
    order_number: "ORD-2026-8943",
    customer_id: "cust-demo-3",
    guest_phone: "01911223344",
    status: "pending",
    payment_status: "pending",
    payment_method: "cod",
    subtotal: 3200,
    shipping_amount: 0,
    discount_amount: 0,
    tax_amount: 0,
    total: 3200,
    advance_paid: 0,
    shipping_method: "Free Nationwide Shipping",
    consignment_id: "",
    courier_name: "",
    tracking_code: "",
    fraud_score: 90,
    created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    shipping_address_snapshot: {
      name: "Sabbir Hossain",
      phone: "01911223344",
      email: "sabbir.h@example.com",
      division: "Dhaka",
      district: "Dhaka City",
      thana: "Uttara",
      address: "Sector 3, Road 12, House 15, Uttara, Dhaka",
      notes: "After 4 PM preferred",
    },
    order_items: [
      {
        id: "item-003",
        product_id: "men-05",
        variant_id: "m-05-42",
        product_name_snapshot: "Festive Premium Embroidered Panjabi - Slate Teal / 42",
        sku_snapshot: "AZ-PJ-05-STL-42",
        unit_price: 3200,
        quantity: 1,
        total: 3200,
      },
    ],
    order_status_history: [
      {
        id: "hist-005",
        status: "pending",
        note: "Order placed via website checkout (Cash on Delivery)",
        created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      },
    ],
  },
  {
    id: "ord-demo-004",
    order_number: "ORD-2026-8944",
    customer_id: "cust-demo-4",
    guest_phone: "01615566778",
    status: "delivered",
    payment_status: "paid",
    payment_method: "cod",
    subtotal: 2150,
    shipping_amount: 70,
    discount_amount: 0,
    tax_amount: 0,
    total: 2220,
    advance_paid: 0,
    shipping_method: "Inside Dhaka Delivery",
    consignment_id: "SF-8930-DH",
    courier_name: "SteadFast Courier",
    tracking_code: "SF-8930-DH",
    fraud_score: 99,
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    shipping_address_snapshot: {
      name: "Farhana Akter",
      phone: "01615566778",
      email: "farhana.akter@example.com",
      division: "Dhaka",
      district: "Dhaka City",
      thana: "Gulshan",
      address: "Road 103, House 18, Gulshan-2, Dhaka",
      consignment_id: "SF-8930-DH",
      courier_name: "SteadFast Courier",
    },
    order_items: [
      {
        id: "item-004",
        product_id: "women-03",
        variant_id: "w-03-l",
        product_name_snapshot: "Luxe Satin Wrap Midi Dress - Teal Ombre / L",
        sku_snapshot: "AZ-DR-03-TMB-L",
        unit_price: 2150,
        quantity: 1,
        total: 2150,
      },
    ],
    order_status_history: [
      {
        id: "hist-006",
        status: "delivered",
        note: "Parcel successfully delivered to customer by Steadfast rider",
        created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
      },
    ],
  },
];

function getDemoAdminOrders(statusFilter?: string) {
  if (statusFilter && statusFilter !== "all") {
    return DEMO_ADMIN_ORDERS.filter((o) => o.status === statusFilter);
  }
  return DEMO_ADMIN_ORDERS;
}

export async function getOrderById(orderId: string) {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Automatic Real-Time Live Courier Sync on Order View
    const { data: initialOrder } = await supabaseAdmin
      .from("orders")
      .select("id, consignment_id, tracking_code, status, shipping_address_snapshot")
      .eq("id", orderId)
      .maybeSingle();

    const cid = initialOrder?.consignment_id || initialOrder?.tracking_code || initialOrder?.shipping_address_snapshot?.consignment_id;
    if (cid && initialOrder && initialOrder.status !== "cancelled" && initialOrder.status !== "delivered") {
      try {
        const { syncLiveCourierStatus } = await import("@/features/logistics/actions");
        await syncLiveCourierStatus(orderId);
      } catch (syncErr) {
        // Non-blocking
      }
    }

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

    if (!error && order) {
      const isPaid = order.payment_status === "paid";
      const advancePaid = Number(order.advance_paid) || 0;
      const total = Number(order.total) || 0;
      const amountToCollect = isPaid ? 0 : Math.max(0, total - advancePaid);

      return {
        ...order,
        advance_paid: advancePaid,
        amount_to_collect: amountToCollect,
      };
    }
  } catch {
    // Gracefully handle unconfigured Supabase in local development
  }

  // Fallback to Demo Order
  const demo = DEMO_ADMIN_ORDERS.find((o) => o.id === orderId || o.order_number === orderId);
  if (demo) {
    const isPaid = demo.payment_status === "paid";
    const advancePaid = Number(demo.advance_paid) || 0;
    const total = Number(demo.total) || 0;
    const amountToCollect = isPaid ? 0 : Math.max(0, total - advancePaid);
    return {
      ...demo,
      advance_paid: advancePaid,
      amount_to_collect: amountToCollect,
    };
  }

  return null;
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

  let ordersData: any[] = [];
  try {
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      ordersData = data;
    } else {
      ordersData = getDemoAdminOrders(statusFilter);
    }
  } catch {
    ordersData = getDemoAdminOrders(statusFilter);
  }

  // Enrich with dynamic calculation & risk scoring
  const { computeCustomerRiskProfile, calculateOrderFinancials } = await import("@/types/orders");

  return ordersData.map((order) => {
    const advancePaid = Number(order.advance_paid) || 0;
    const grossTotal = Number(order.total) || 0;
    const financials = calculateOrderFinancials(
      order.subtotal || 0,
      order.shipping_amount || 0,
      order.discount_amount || 0,
      order.tax_amount || 0,
      advancePaid
    );

    const isPaid = order.payment_status === "paid";
    const amountToCollect = isPaid ? 0 : Math.max(0, grossTotal - advancePaid);

    const phone = order.shipping_address_snapshot?.phone || order.guest_phone || "";
    const riskProfile = computeCustomerRiskProfile({
      phone,
      district: order.shipping_address_snapshot?.district || "",
      orderTotal: grossTotal,
      advancePaid,
      isBlacklisted: Boolean(order.fraud_score && order.fraud_score < 20),
    });

    const addrSnap = order.shipping_address_snapshot || {};
    const cid =
      order.consignment_id ||
      order.tracking_code ||
      order.tracking_id ||
      addrSnap.consignment_id ||
      addrSnap.tracking_id ||
      addrSnap.tracking_code ||
      "";
    const courierName =
      order.courier_name ||
      order.shipping_method ||
      addrSnap.courier_name ||
      (cid.startsWith("PTH") || cid.startsWith("DE") ? "Pathao Courier" : cid.startsWith("SF") ? "SteadFast Courier" : "");
    const trackingUrl = buildCourierTrackingUrl(courierName, cid, order.tracking_url || addrSnap.tracking_url);

    const historyList = (order.order_status_history || []).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latestCourierHistory = historyList.find((h: any) =>
      h.note?.toLowerCase().includes("webhook") ||
      h.note?.toLowerCase().includes("steadfast") ||
      h.note?.toLowerCase().includes("pathao") ||
      h.note?.toLowerCase().includes("courier") ||
      h.note?.toLowerCase().includes("rto")
    );
    const isCourierReturned =
      order.status === "returned" ||
      (order.status === "failed" && Boolean(cid)) ||
      Boolean(latestCourierHistory?.note?.toLowerCase().includes("returned") || latestCourierHistory?.note?.toLowerCase().includes("rto")) ||
      Boolean(addrSnap.is_courier_returned);
    const isCourierCancelled =
      order.status === "cancelled" &&
      (Boolean(cid) || Boolean(latestCourierHistory?.note?.toLowerCase().includes("cancelled")) || Boolean(addrSnap.is_courier_cancelled));

    return {
      ...order,
      consignment_id: cid,
      courier_name: courierName,
      tracking_code: order.tracking_code || cid,
      tracking_id: order.tracking_id || cid,
      tracking_url: trackingUrl,
      advance_paid: advancePaid,
      amount_to_collect: amountToCollect,
      payment_status: order.payment_status || financials.payment_status,
      risk_profile: riskProfile,
      courier_webhook_note: latestCourierHistory?.note || addrSnap.courier_webhook_note || null,
      is_courier_returned: isCourierReturned,
      is_courier_cancelled: isCourierCancelled,
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
    const isNowActive = [
      "processing",
      "confirmed",
      "on-hold",
      "on_hold",
      "packed",
      "ready_for_pickup",
      "shipped",
      "in_transit",
      "out_for_delivery",
      "completed",
      "delivered",
    ].includes(newStatus);

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

  // Automated Transactional SMS Trigger on Order Status Changes (Admin Matrix Controlled)
  let snapshot: any = data.shipping_address_snapshot;
  if (typeof snapshot === "string") {
    try {
      snapshot = JSON.parse(snapshot);
    } catch {}
  }

  const phone = data.guest_phone || snapshot?.phone || data.customer_phone || data.phone;
  const customerName = data.guest_name || snapshot?.name || data.customer_name || "Dear Customer";

  if (phone) {
    const liveBase = await getLiveBaseUrl();
    if (newStatus === "shipped") {
      sendSmsNotification({
        recipientPhone: phone,
        eventType: "order_shipped",
        variables: {
          customer_name: customerName,
          order_number: data.order_number,
          courier_name: data.courier_name || "SteadFast Courier",
          tracking_id: data.consignment_id || data.tracking_code || data.order_number,
          tracking_url: data.tracking_url ? await ensureAbsoluteUrl(data.tracking_url) : `${liveBase}/account/track?order=${data.order_number}`,
        },
      }).catch((e) => console.error("Shipped SMS trigger failed:", e));
    } else if (newStatus === "delivered" || newStatus === "completed") {
      sendSmsNotification({
        recipientPhone: phone,
        eventType: "order_delivered",
        variables: {
          customer_name: customerName,
          order_number: data.order_number,
          store_name: "Azonno",
        },
      }).catch((e) => console.error("Delivered SMS trigger failed:", e));
    } else if (newStatus === "cancelled") {
      sendSmsNotification({
        recipientPhone: phone,
        eventType: "order_cancelled",
        variables: {
          customer_name: customerName,
          order_number: data.order_number,
          store_name: "Azonno",
        },
      }).catch((e) => console.error("Cancelled SMS trigger failed:", e));
    } else if (newStatus === "refunded") {
      sendSmsNotification({
        recipientPhone: phone,
        eventType: "refund_approved",
        variables: {
          customer_name: customerName,
          order_number: data.order_number,
          store_name: "Azonno",
        },
      }).catch((e) => console.error("Refunded SMS trigger failed:", e));
    }
  }

  // 3. Automated EMQ 9.0+ Meta & TikTok Conversions API (CAPI) Purchase Trigger
  await triggerStatusGatedPurchaseCapi(orderId, newStatus, data, authData?.user?.id || null, supabaseAdmin);

  return { success: true, order: data };
}

/**
 * Dispatches Server-Side EMQ 9.0+ Purchase / CompletePayment to Meta CAPI & TikTok Events API
 * when order reaches the admin-configured trigger status (e.g. "completed" / "delivered").
 */
export async function triggerStatusGatedPurchaseCapi(
  orderId: string,
  newStatus: string,
  orderData: any,
  authUserId: string | null,
  supabaseAdmin: any
) {
  try {
    const { getMarketingAnalyticsSettings, dispatchAdvancedPurchaseCapi } = await import("@/features/marketing/meta-actions");
    const marketingConfig = await getMarketingAnalyticsSettings();

    const isStatusGated = marketingConfig.purchase_tracking_mode !== "immediate";
    if (!isStatusGated) return;

    const targetTriggerStatus = marketingConfig.purchase_trigger_status || "completed";
    const isPaymentPaid = orderData?.payment_status === "paid" || newStatus === "paid";
    const isTriggerMatched =
      isPaymentPaid ||
      newStatus === targetTriggerStatus ||
      ((targetTriggerStatus === "completed" || targetTriggerStatus === "delivered") &&
        (newStatus === "completed" || newStatus === "delivered")) ||
      ((targetTriggerStatus === "processing" || targetTriggerStatus === "confirmed") &&
        (newStatus === "processing" || newStatus === "confirmed"));

    const addressSnap = orderData?.shipping_address_snapshot || {};
    const alreadyFired = Boolean(addressSnap.purchase_capi_fired_at);

    if (isTriggerMatched && !alreadyFired) {
      // Ensure we have order_items
      let fullOrder = orderData;
      if (!fullOrder?.order_items || fullOrder.order_items.length === 0) {
        const { data: fetchedOrder } = await supabaseAdmin
          .from("orders")
          .select("*, order_items(*)")
          .eq("id", orderId)
          .single();
        if (fetchedOrder) fullOrder = fetchedOrder;
      }

      if (fullOrder) {
        const capiResults = await dispatchAdvancedPurchaseCapi(fullOrder, newStatus);

        const updatedSnapshot = {
          ...addressSnap,
          purchase_capi_fired_at: new Date().toISOString(),
          purchase_capi_results: {
            meta_success: capiResults.meta?.success ?? false,
            tiktok_success: capiResults.tiktok?.success ?? false,
            meta_trace_id: capiResults.meta?.fbTraceId || null,
            tiktok_request_id: capiResults.tiktok?.requestId || null,
          },
        };

        await supabaseAdmin
          .from("orders")
          .update({ shipping_address_snapshot: updatedSnapshot })
          .eq("id", orderId);

        await supabaseAdmin.from("order_status_history").insert({
          order_id: orderId,
          status: newStatus,
          note: `🎯 [CAPI Purchase Fired]: Server-Side EMQ 9.0+ Purchase Event dispatched for Meta & TikTok. Status: ${newStatus.toUpperCase()}`,
          created_by: authUserId || null,
        });
      }
    }
  } catch (capiErr) {
    console.warn("[CAPI Trigger Non-Fatal Warning]:", capiErr);
  }
}

/**
 * Admin Action to Manually Trigger CAPI Purchase for an Order (with EMQ 9.0+ Verification)
 */
export async function triggerManualOrderCapiPurchase(orderId: string) {
  const supabaseAdmin = createAdminClient();
  const supabaseUser = await createClient();
  const { data: authData } = await supabaseUser.auth.getUser();

  const { data: fullOrder, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (error || !fullOrder) {
    return { success: false, error: "Order not found" };
  }

  const { dispatchAdvancedPurchaseCapi } = await import("@/features/marketing/meta-actions");
  const capiResults = await dispatchAdvancedPurchaseCapi(fullOrder, fullOrder.status || "manual");

  const addressSnap = fullOrder.shipping_address_snapshot || {};
  const updatedSnapshot = {
    ...addressSnap,
    purchase_capi_fired_at: new Date().toISOString(),
    purchase_capi_results: {
      meta_success: capiResults.meta?.success ?? false,
      tiktok_success: capiResults.tiktok?.success ?? false,
      meta_trace_id: capiResults.meta?.fbTraceId || null,
      tiktok_request_id: capiResults.tiktok?.requestId || null,
    },
  };

  await supabaseAdmin
    .from("orders")
    .update({ shipping_address_snapshot: updatedSnapshot })
    .eq("id", orderId);

  await supabaseAdmin.from("order_status_history").insert({
    order_id: orderId,
    status: fullOrder.status,
    note: `🎯 [Manual CAPI Purchase Fired]: Admin manual CAPI trigger executed with EMQ 9.0+ parameters.`,
    created_by: authData?.user?.id || null,
  });

  revalidatePath(`/admin/orders`);
  revalidatePath(`/admin/orders/${orderId}`);

  return { success: true, results: capiResults };
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
  publicNote?: string;
  payment_method?: string;
  payment_status?: string;
  shipping_amount?: number;
  discount_amount?: number;
  total?: number;
  shipping_address_snapshot?: any;
  courier_name?: string;
  consignment_id?: string;
  tracking_code?: string;
  tracking_url?: string;
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
  if (payload.internalNote !== undefined) updateData.internal_note = payload.internalNote;
  if (payload.publicNote !== undefined) updateData.public_note = payload.publicNote;
  if (payload.courier_name !== undefined) updateData.courier_name = payload.courier_name;
  if (payload.consignment_id !== undefined) updateData.consignment_id = payload.consignment_id;
  if (payload.tracking_code !== undefined) updateData.tracking_code = payload.tracking_code;
  if (payload.tracking_url !== undefined) updateData.tracking_url = payload.tracking_url;

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

  if (payload.status) {
    // WooCommerce Idempotent Inventory Synchronization
    try {
      const isNowCancelledOrRefunded = ["cancelled", "refunded", "failed", "returned"].includes(payload.status);
      const isNowActive = [
        "processing",
        "confirmed",
        "on-hold",
        "on_hold",
        "packed",
        "ready_for_pickup",
        "shipped",
        "in_transit",
        "out_for_delivery",
        "completed",
        "delivered",
      ].includes(payload.status);

      if (isNowCancelledOrRefunded) {
        await restoreOrderStock(orderId, supabaseAdmin);
      } else if (isNowActive) {
        await reduceOrderStock(orderId, supabaseAdmin);
      }
    } catch (invErr) {
      console.warn("Inventory sync warning (non-fatal):", invErr);
    }
  }

  if (payload.status || payload.note) {
    await supabaseAdmin.from("order_status_history").insert({
      order_id: orderId,
      status: payload.status || data.status,
      note: payload.note || `Order modified by admin`,
      created_by: authData?.user?.id || null,
    });

    // Automated Transactional SMS Trigger on Order Status Changes (Admin Matrix Controlled)
    let snapshot: any = data.shipping_address_snapshot;
    if (typeof snapshot === "string") {
      try {
        snapshot = JSON.parse(snapshot);
      } catch {}
    }

    const phone = data.guest_phone || snapshot?.phone || data.customer_phone || data.phone;
    const customerName = data.guest_name || snapshot?.name || data.customer_name || "Dear Customer";

    if (phone) {
      const liveBase = await getLiveBaseUrl();
      if (payload.status === "shipped") {
        sendSmsNotification({
          recipientPhone: phone,
          eventType: "order_shipped",
          variables: {
            customer_name: customerName,
            order_number: data.order_number,
            courier_name: data.courier_name || "SteadFast Courier",
            tracking_id: data.consignment_id || data.tracking_code || data.order_number,
            tracking_url: data.tracking_url ? await ensureAbsoluteUrl(data.tracking_url) : `${liveBase}/account/track?order=${data.order_number}`,
          },
        }).catch((e) => console.error("Shipped SMS trigger failed:", e));
      } else if (payload.status === "delivered" || payload.status === "completed") {
        sendSmsNotification({
          recipientPhone: phone,
          eventType: "order_delivered",
          variables: {
            customer_name: customerName,
            order_number: data.order_number,
            store_name: "Azonno",
          },
        }).catch((e) => console.error("Delivered SMS trigger failed:", e));
      } else if (payload.status === "cancelled") {
        sendSmsNotification({
          recipientPhone: phone,
          eventType: "order_cancelled",
          variables: {
            customer_name: customerName,
            order_number: data.order_number,
            store_name: "Azonno",
          },
        }).catch((e) => console.error("Cancelled SMS trigger failed:", e));
      } else if (payload.status === "refunded") {
        sendSmsNotification({
          recipientPhone: phone,
          eventType: "refund_approved",
          variables: {
            customer_name: customerName,
            order_number: data.order_number,
            store_name: "Azonno",
          },
        }).catch((e) => console.error("Refunded SMS trigger failed:", e));
      }
    }

    // Automated EMQ 9.0+ Meta & TikTok Conversions API (CAPI) Purchase Trigger
    if (payload.status || payload.payment_status === "paid" || data?.payment_status === "paid") {
      await triggerStatusGatedPurchaseCapi(orderId, payload.status || data?.status, data, authData?.user?.id || null, supabaseAdmin);
    }
  }

  return { success: true, order: data };
}

export async function trackOrder(orderNumber: string, phone: string) {
  const isTrackingEnabled = await isModuleEnabled("live_tracking");
  if (!isTrackingEnabled) {
    return { error: "Live order tracking is currently disabled by store administrator." };
  }

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

  // 1. Automatic Real-Time Live Courier Sync on Customer Tracking Query
  const cid = order.consignment_id || order.tracking_code || order.shipping_address_snapshot?.consignment_id;
  if (cid && order.status !== "cancelled" && order.status !== "delivered") {
    try {
      const { syncLiveCourierStatus } = await import("@/features/logistics/actions");
      const syncRes = await syncLiveCourierStatus(order.id);
      if (syncRes.success) {
        // Re-fetch latest updated order data with history
        const { data: refreshedOrder } = await supabase
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
          .eq("id", order.id)
          .single();
        if (refreshedOrder) {
          return { order: refreshedOrder };
        }
      }
    } catch (syncErr) {
      console.warn("Real-time courier query auto-sync note:", syncErr);
    }
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

    // Automated Transactional SMS for order cancellation
    const phone = order.guest_phone || order.shipping_address_snapshot?.phone;
    if (phone) {
      sendSmsNotification({
        recipientPhone: phone,
        eventType: "order_cancelled",
        variables: {
          customer_name: order.guest_name || order.shipping_address_snapshot?.name || "Dear Customer",
          order_number: order.order_number,
          store_name: "Azonno",
        },
      }).catch((e) => console.error("Cancel customer SMS trigger failed:", e));
    }

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

/**
 * Send Advance Delivery Charge Request SMS
 */
export async function sendAdvanceDeliveryRequestSms(input: {
  phone: string;
  customerName: string;
  orderNumber: string;
  advanceAmount: number | string;
}) {
  const res = await sendSmsNotification({
    recipientPhone: input.phone,
    eventType: "advance_requested",
    variables: {
      customer_name: input.customerName || "Dear Customer",
      order_number: input.orderNumber,
      advance_amount: String(input.advanceAmount),
    },
  });

  return res;
}

