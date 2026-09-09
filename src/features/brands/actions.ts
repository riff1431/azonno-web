"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { brandSchema, type BrandFormData } from "@/validators";
import { logActivity } from "@/services/activity-log";

export interface StorefrontBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  product_count: number;
}

export async function getStorefrontBrands(): Promise<StorefrontBrand[]> {
  try {
    const supabase = await createClient();
    const { data: brands, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, description, products(count)")
      .eq("status", "active")
      .order("name");

    if (error || !brands) return [];

    return brands.map((b: any) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logo_url: b.logo_url || `/images/brands/${b.slug}.svg`,
      description: b.description,
      product_count: Number(b.products?.[0]?.count) || 0,
    }));
  } catch {
    return [];
  }
}

export async function getBrands() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getBrandById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createBrand(formData: BrandFormData) {
  const parsed = brandSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (existing) return { error: { slug: ["This slug is already in use"] } };

  const { data, error } = await supabase
    .from("brands")
    .insert(parsed.data)
    .select()
    .single();
  if (error) return { error: { _form: [error.message] } };

  await logActivity({ action: "brand.create", targetType: "brand", targetId: data.id, afterData: data as unknown as Record<string, unknown> });
  revalidatePath("/admin/brands");
  return { data };
}

export async function updateBrand(id: string, formData: BrandFormData) {
  const parsed = brandSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", parsed.data.slug)
    .neq("id", id)
    .maybeSingle();
  if (existing) return { error: { slug: ["This slug is already in use"] } };

  const { data, error } = await supabase
    .from("brands")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();
  if (error) return { error: { _form: [error.message] } };

  await logActivity({ action: "brand.update", targetType: "brand", targetId: id, afterData: data as unknown as Record<string, unknown> });
  revalidatePath("/admin/brands");
  return { data };
}

export async function deleteBrand(id: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("brand_id", id);

  if (count && count > 0) {
    return { error: `Cannot delete: ${count} product(s) are assigned to this brand.` };
  }

  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return { error: error.message };

  await logActivity({ action: "brand.delete", targetType: "brand", targetId: id });
  revalidatePath("/admin/brands");
  return { success: true };
}
