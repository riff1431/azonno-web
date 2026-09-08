"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getCustomerDashboardData() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) return null;

  const adminClient = createAdminClient();

  // Fetch Orders
  const { data: orders } = await adminClient
    .from("orders")
    .select("id, order_number, total, status, created_at, order_items(id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orderList = orders || [];
  const totalOrders = orderList.length;
  const pendingOrders = orderList.filter((o) =>
    ["pending", "confirmed", "processing", "packed"].includes(o.status)
  ).length;
  const deliveredOrders = orderList.filter((o) => o.status === "delivered").length;
  const latestOrder = orderList[0] || null;

  // Fetch Profile Role
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "customer";

  return {
    user,
    role,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    latestOrder,
  };
}

export async function getCustomerOrders() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) return [];

  const adminClient = createAdminClient();
  const { data: orders } = await adminClient
    .from("orders")
    .select(`
      id,
      order_number,
      total,
      subtotal,
      shipping_amount,
      discount_amount,
      status,
      payment_method,
      payment_status,
      created_at,
      shipping_method,
      order_items (
        id,
        product_name_snapshot,
        unit_price,
        quantity,
        total
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return orders || [];
}

export async function getCustomerOrderById(orderId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) return null;

  const adminClient = createAdminClient();

  // Automatic Real-Time Live Courier Sync on Customer View
  const { data: initialOrder } = await adminClient
    .from("orders")
    .select("id, consignment_id, tracking_code, status, shipping_address_snapshot")
    .eq("id", orderId)
    .eq("user_id", user.id)
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

  const { data: order, error } = await adminClient
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
    .eq("user_id", user.id)
    .single();

  if (error || !order) return null;
  return order;
}

export async function getCustomerAddresses() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) return [];

  const adminClient = createAdminClient();
  const { data: addresses } = await adminClient
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });

  return addresses || [];
}

export async function saveCustomerAddress(input: {
  id?: string;
  name: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  address_line: string;
  postal_code?: string;
  is_default?: boolean;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) return { error: "Authentication required" };

  const adminClient = createAdminClient();

  if (input.is_default) {
    // Reset other addresses is_default to false
    await adminClient
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  if (input.id) {
    // Update
    const { data, error } = await adminClient
      .from("addresses")
      .update({
        name: input.name,
        phone: input.phone,
        division: input.division,
        district: input.district,
        area: input.area,
        address_line: input.address_line,
        postal_code: input.postal_code || null,
        is_default: input.is_default || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath("/account/addresses");
    return { success: true, address: data };
  } else {
    // Insert
    const { data, error } = await adminClient
      .from("addresses")
      .insert({
        user_id: user.id,
        name: input.name,
        phone: input.phone,
        division: input.division,
        district: input.district,
        area: input.area,
        address_line: input.address_line,
        postal_code: input.postal_code || null,
        is_default: input.is_default || false,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath("/account/addresses");
    return { success: true, address: data };
  }
}

export async function deleteCustomerAddress(addressId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) return { error: "Authentication required" };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/account/addresses");
  return { success: true };
}

export async function registerUserAccount(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const fullName = input.fullName.trim();
  const phone = input.phone?.trim() || null;

  if (!email || !password || !fullName) {
    return { error: "Please fill in all required fields." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  try {
    const adminClient = createAdminClient();

    // Create user via Admin API - auto confirms email and bypasses public email rate limits
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
      },
    });

    if (createError) {
      if (
        createError.message.toLowerCase().includes("already registered") ||
        createError.message.toLowerCase().includes("unique constraint") ||
        createError.message.toLowerCase().includes("user already exists")
      ) {
        return { error: "An account with this email address already exists. Please sign in instead." };
      }
      return { error: createError.message };
    }

    const userId = userData.user.id;

    // Upsert into profiles table
    await adminClient.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        phone,
        role: "customer",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    return { success: true, userId };
  } catch (err: any) {
    console.error("Registration server action error:", err);
    return { error: err?.message || "An unexpected error occurred during account creation." };
  }
}

/**
 * Resolve user identifier (phone number or email) to corresponding Supabase auth email
 */
export async function resolveUserAuthEmail(identifier: string): Promise<string> {
  const cleanId = identifier.trim();
  if (cleanId.includes("@")) {
    return cleanId.toLowerCase();
  }

  // Treat as Bangladeshi phone number: extract digits
  const digits = cleanId.replace(/\D/g, "");
  const cleanPhone = digits.startsWith("880")
    ? `0${digits.slice(3)}`
    : digits.startsWith("88")
    ? digits.slice(2)
    : digits;

  try {
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("email")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (profile?.email) {
      return profile.email.toLowerCase();
    }
  } catch {
    // Fallback to synthetic phone email
  }

  return `${cleanPhone}@customer.blushandbudget.com`.toLowerCase();
}


