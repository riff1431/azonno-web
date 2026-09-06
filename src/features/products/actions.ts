"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/services/activity-log";

export async function getNextProductSerial(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("sku")
    .is("deleted_at", null);

  if (error || !data || data.length === 0) return 1;

  let maxSerial = 0;
  for (const item of data) {
    if (item.sku) {
      const trimmed = String(item.sku).trim().replace(/^#/, "");
      if (/^\d+$/.test(trimmed)) {
        const parsed = parseInt(trimmed, 10);
        if (!isNaN(parsed) && parsed > maxSerial) {
          maxSerial = parsed;
        }
      }
    }
  }

  return maxSerial > 0 ? maxSerial + 1 : data.length + 1;
}

export async function getProducts(filters?: {
  status?: string;
  brand_id?: string;
  category_id?: string;
  search?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*, brands(name), inventory(on_hand, available)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.brand_id) query = query.eq("brand_id", filters.brand_id);
  if (filters?.search) {
    const cleanSearch = filters.search.trim().replace(/^#/, "");
    query = query.or(`name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getProductById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      brands(id, name),
      product_categories(category_id, categories(id, name)),
      product_tags(tag_id, tags(id, name)),
      product_variants(*, variant_attribute_values(attribute_value_id, attribute_values(id, value, color_hex, attribute_id, product_attributes(name)))),
      product_media(*, media(*)),
      inventory(*)
    `)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Schema-resilience cache: keeps track of columns that don't exist in the current Supabase
 * 'products' schema cache (e.g., if a migration hasn't been executed yet in the live database).
 */
const missingProductColumns = new Set<string>();

function parseMissingColumn(errorMessage?: string | null): string | null {
  if (!errorMessage) return null;
  const matchPostgrest = errorMessage.match(/Could not find the '([^']+)' column/i);
  if (matchPostgrest) return matchPostgrest[1];
  const matchPg = errorMessage.match(/column "?([a-zA-Z0-9_]+)"? (?:of relation [^\s]+ )?does not exist/i);
  if (matchPg) return matchPg[1];
  return null;
}

function stripMissingColumns(payload: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...payload };
  for (const col of missingProductColumns) {
    delete sanitized[col];
  }
  return sanitized;
}

export async function createProduct(input: {
  product: Record<string, unknown>;
  category_ids?: string[];
  tag_names?: string[];
  variants?: Array<{
    sku?: string;
    regular_price?: number;
    sale_price?: number;
    cost_price?: number;
    weight?: number;
    image_url?: string;
    status: string;
    attribute_value_ids: string[];
  }>;
  initial_stock?: number;
}) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Determine SKU / Product ID: use admin-provided value or auto-generate sequential number (1, 2, 3...)
  let sku = input.product.sku ? String(input.product.sku).trim() : "";
  if (!sku) {
    const nextSerial = await getNextProductSerial();
    sku = String(nextSerial);
  }

  // Insert product with beauty taxonomy
  // Strip client-only / not-yet-migrated fields before writing to DB
  const { authenticity_verified: _av, ...safeProductInsert } = input.product as Record<string, unknown>;
  void _av;

  const rawInsertPayload: Record<string, unknown> = {
    ...safeProductInsert,
    sku: sku,
    skin_type: input.product.skin_type || null,
    skin_concern: input.product.skin_concern || null,
    key_actives: input.product.key_actives || null,
    origin_country: input.product.origin_country || input.product.country || null,
    batch_number: input.product.batch_number || null,
    expiry_date: input.product.expiry_date || null,
    routine_step: input.product.routine_step || null,
    created_by: user?.id,
    updated_by: user?.id,
  };

  let insertPayload = stripMissingColumns(rawInsertPayload);
  let product: any = null;
  let prodError: any = null;

  for (let attempt = 0; attempt < 12; attempt++) {
    const res = await supabase
      .from("products")
      .insert(insertPayload)
      .select()
      .single();

    if (!res.error) {
      product = res.data;
      prodError = null;
      break;
    }

    const missingCol = parseMissingColumn(res.error.message);
    if (missingCol && missingCol in insertPayload) {
      console.warn(`[products/actions] Column '${missingCol}' missing from 'products' table. Auto-omitting and retrying insert.`);
      missingProductColumns.add(missingCol);
      delete insertPayload[missingCol];
      prodError = res.error;
      continue;
    }

    prodError = res.error;
    break;
  }

  if (prodError || !product) return { error: prodError?.message || "Failed to create product" };

  // Assign categories
  if (input.category_ids?.length) {
    const { error: catError } = await supabase.from("product_categories").insert(
      input.category_ids.map((cid) => ({ product_id: product.id, category_id: cid }))
    );
    if (catError) return { error: catError.message };
  }

  // Create or find tags
  if (input.tag_names?.length) {
    for (const tagName of input.tag_names) {
      const slug = tagName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      let tagId: string;

      const { data: existing } = await supabase
        .from("tags")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        tagId = existing.id;
      } else {
        const { data: newTag, error: tagErr } = await supabase
          .from("tags")
          .insert({ name: tagName, slug })
          .select("id")
          .single();
        if (tagErr) continue;
        tagId = newTag.id;
      }

      await supabase.from("product_tags").insert({ product_id: product.id, tag_id: tagId });
    }
  }

  // Create variants (for variable products)
  if (input.variants?.length) {
    for (let idx = 0; idx < input.variants.length; idx++) {
      const variant = input.variants[idx];
      const { attribute_value_ids, ...variantData } = variant;
      const variantSku = variant.sku && variant.sku.trim()
        ? variant.sku.trim()
        : `${sku}-${idx + 1}`;

      const { data: v, error: vErr } = await supabase
        .from("product_variants")
        .insert({ ...variantData, sku: variantSku, product_id: product.id })
        .select()
        .single();

      if (vErr) continue;

      // Assign attribute values
      if (attribute_value_ids.length) {
        await supabase.from("variant_attribute_values").insert(
          attribute_value_ids.map((avid) => ({
            variant_id: v.id,
            attribute_value_id: avid,
          }))
        );
      }

      // Create inventory for variant
      await supabase.from("inventory").insert({
        product_id: product.id,
        variant_id: v.id,
        on_hand: 0,
        reserved: 0,
        available: 0,
        low_stock_threshold: 5,
      });
    }
  } else {
    // Create inventory for simple product
    const stock = input.initial_stock ?? 0;
    await supabase.from("inventory").insert({
      product_id: product.id,
      variant_id: null,
      on_hand: stock,
      reserved: 0,
      available: stock,
      low_stock_threshold: 5,
    });
  }

  await logActivity({
    action: "product.create",
    targetType: "product",
    targetId: product.id,
    afterData: product as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/products");
  return { data: product };
}

export async function updateProduct(
  id: string,
  input: {
    product: Record<string, unknown>;
    category_ids?: string[];
    tag_names?: string[];
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const raw = input.product as Record<string, unknown>;

  // Resolve SKU
  let sku = raw.sku !== undefined ? String(raw.sku || "").trim() : undefined;
  if (sku === "") {
    const nextSerial = await getNextProductSerial();
    sku = String(nextSerial);
  }

  // Build a safe payload containing ONLY columns that exist in the products table.
  // Beauty taxonomy columns (batch_number, expiry_date, skin_type, skin_concern,
  // key_actives, routine_step, origin_country) are included and will be saved once
  // migration 009_add_beauty_taxonomy_columns.sql has been run in Supabase.
  const safeUpdate: Record<string, unknown> = {
    // Core fields (always present)
    ...(raw.name !== undefined && { name: raw.name }),
    ...(raw.slug !== undefined && { slug: raw.slug }),
    ...(sku !== undefined && { sku }),
    ...(raw.barcode !== undefined && { barcode: raw.barcode }),
    ...(raw.product_type !== undefined && { product_type: raw.product_type }),
    ...(raw.brand_id !== undefined && { brand_id: raw.brand_id }),
    ...(raw.status !== undefined && { status: raw.status }),
    ...(raw.is_featured !== undefined && { is_featured: raw.is_featured }),
    ...(raw.short_description !== undefined && { short_description: raw.short_description }),
    ...(raw.description !== undefined && { description: raw.description }),
    ...(raw.benefits !== undefined && { benefits: raw.benefits }),
    ...(raw.usage !== undefined && { usage: raw.usage }),
    ...(raw.ingredients_specifications !== undefined && { ingredients_specifications: raw.ingredients_specifications }),
    ...(raw.country !== undefined && { country: raw.country }),
    ...(raw.origin_country !== undefined && { origin_country: raw.origin_country }),
    ...(raw.warranty !== undefined && { warranty: raw.warranty }),
    // Pricing
    ...(raw.cost_price !== undefined && { cost_price: raw.cost_price }),
    ...(raw.regular_price !== undefined && { regular_price: raw.regular_price }),
    ...(raw.sale_price !== undefined && { sale_price: raw.sale_price }),
    ...(raw.sale_start !== undefined && { sale_start: raw.sale_start }),
    ...(raw.sale_end !== undefined && { sale_end: raw.sale_end }),
    // Physical
    ...(raw.weight !== undefined && { weight: raw.weight }),
    ...(raw.length !== undefined && { length: raw.length }),
    ...(raw.width !== undefined && { width: raw.width }),
    ...(raw.height !== undefined && { height: raw.height }),
    ...(raw.shipping_class !== undefined && { shipping_class: raw.shipping_class }),
    // SEO
    ...(raw.seo_title !== undefined && { seo_title: raw.seo_title }),
    ...(raw.seo_description !== undefined && { seo_description: raw.seo_description }),
    ...(raw.canonical_override !== undefined && { canonical_override: raw.canonical_override }),
    ...(raw.og_image_url !== undefined && { og_image_url: raw.og_image_url }),
    ...(raw.is_indexed !== undefined && { is_indexed: raw.is_indexed }),
    // Beauty taxonomy (available after migration 009)
    ...(raw.skin_type !== undefined && { skin_type: raw.skin_type }),
    ...(raw.skin_concern !== undefined && { skin_concern: raw.skin_concern }),
    ...(raw.key_actives !== undefined && { key_actives: raw.key_actives }),
    ...(raw.routine_step !== undefined && { routine_step: raw.routine_step }),
    ...(raw.batch_number !== undefined && { batch_number: raw.batch_number }),
    ...(raw.expiry_date !== undefined && { expiry_date: raw.expiry_date || null }),
    // Audit
    updated_by: user?.id,
  };

  let updatePayload = stripMissingColumns(safeUpdate);
  let product: any = null;
  let updateError: any = null;

  for (let attempt = 0; attempt < 12; attempt++) {
    const res = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (!res.error) {
      product = res.data;
      updateError = null;
      break;
    }

    const missingCol = parseMissingColumn(res.error.message);
    if (missingCol && missingCol in updatePayload) {
      console.warn(`[products/actions] Column '${missingCol}' missing from 'products' table. Auto-omitting and retrying update.`);
      missingProductColumns.add(missingCol);
      delete updatePayload[missingCol];
      updateError = res.error;
      continue;
    }

    updateError = res.error;
    break;
  }

  if (updateError || !product) return { error: updateError?.message || "Failed to update product" };

  // Sync categories
  if (input.category_ids) {
    await supabase.from("product_categories").delete().eq("product_id", id);
    if (input.category_ids.length) {
      await supabase.from("product_categories").insert(
        input.category_ids.map((cid) => ({ product_id: id, category_id: cid }))
      );
    }
  }

  // Sync tags
  if (input.tag_names) {
    await supabase.from("product_tags").delete().eq("product_id", id);
    for (const tagName of input.tag_names) {
      const slug = tagName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      let tagId: string;

      const { data: existing } = await supabase
        .from("tags")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        tagId = existing.id;
      } else {
        const { data: newTag, error: tagErr } = await supabase
          .from("tags")
          .insert({ name: tagName, slug })
          .select("id")
          .single();
        if (tagErr) continue;
        tagId = newTag.id;
      }

      await supabase.from("product_tags").insert({ product_id: id, tag_id: tagId });
    }
  }

  await logActivity({
    action: "product.update",
    targetType: "product",
    targetId: id,
    afterData: product as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/products");
  return { data: product };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();

  // Soft delete
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), status: "archived" })
    .eq("id", id);

  if (error) return { error: error.message };

  await logActivity({ action: "product.delete", targetType: "product", targetId: id });
  revalidatePath("/admin/products");
  return { success: true };
}

export async function bulkUpdateProductStatus(ids: string[], status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ status })
    .in("id", ids);

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  return { success: true };
}
