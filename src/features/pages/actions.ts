"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { type CMSPageItem, DEFAULT_CMS_PAGES } from "./types";

const PAGES_STORE_KEY = "cms_pages_store";

async function getFallbackStore<T>(key: string, defaultVal: T): Promise<T> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("store_settings").select("value").eq("key", key).single();
    if (data && data.value) {
      return data.value as T;
    }
  } catch (err) {}
  return defaultVal;
}

async function setFallbackStore<T>(key: string, value: T): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("store_settings").upsert(
      {
        key,
        value: value as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  } catch (err) {}
}

export async function getDefaultCMSPages(): Promise<CMSPageItem[]> {
  return DEFAULT_CMS_PAGES;
}

export async function getCMSPages(): Promise<CMSPageItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      // Merge with DEFAULT_CMS_PAGES to ensure default policies have full rich content if DB has dummy placeholder
      const merged = data.map((item: any) => {
        const defaultMatch = DEFAULT_CMS_PAGES.find(
          (d) => d.slug === item.slug || d.id === item.id
        );
        if (
          defaultMatch &&
          (!item.content ||
            item.content.length < 350 ||
            item.content.includes("ecomXbangladesh") ||
            item.content.includes("Your privacy is of the utmost"))
        ) {
          // Asynchronously update Supabase in background
          try {
            const adminClient = createAdminClient();
            adminClient
              .from("pages")
              .update({
                title: defaultMatch.title,
                content: defaultMatch.content,
                seo_title: defaultMatch.seo_title,
                seo_description: defaultMatch.seo_description,
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.id);
          } catch (e) {}
          return { ...item, ...defaultMatch };
        }
        return item as CMSPageItem;
      });

      // Also ensure all default pages exist in the list
      for (const def of DEFAULT_CMS_PAGES) {
        if (!merged.some((m: any) => m.slug === def.slug)) {
          merged.push(def);
        }
      }
      return merged as CMSPageItem[];
    }
  } catch (e) {}

  const fallbackPages = await getFallbackStore<CMSPageItem[]>(PAGES_STORE_KEY, DEFAULT_CMS_PAGES);
  return fallbackPages;
}

const ALIAS_CLUSTERS: Record<string, string[]> = {
  privacy: ["privacy", "privacy-policy"],
  terms: ["terms", "terms-of-service", "terms-and-conditions", "terms-conditions"],
  returns: ["returns", "return-policy", "refund-policy"],
  faq: ["faq", "faqs", "help"],
  about: ["about", "about-us"],
};

export async function getCMSPageBySlug(slug: string): Promise<CMSPageItem | null> {
  const cleanSlug = slug.toLowerCase().trim();
  
  let candidates: string[] = [cleanSlug];
  for (const cluster of Object.values(ALIAS_CLUSTERS)) {
    if (cluster.includes(cleanSlug)) {
      candidates = Array.from(new Set([...cluster, cleanSlug]));
      break;
    }
  }

  const defaultMatch = DEFAULT_CMS_PAGES.find((p) => candidates.includes(p.slug.toLowerCase().trim()));

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .in("slug", candidates)
      .eq("status", "published")
      .limit(1);

    if (!error && data && data.length > 0) {
      const page = data[0] as CMSPageItem;
      // If DB has short placeholder dummy text, override and sync with real comprehensive content
      if (
        defaultMatch &&
        (!page.content ||
          page.content.length < 350 ||
          page.content.includes("ecomXbangladesh") ||
          page.content.includes("Your privacy is of the utmost"))
      ) {
        try {
          const adminClient = createAdminClient();
          adminClient
            .from("pages")
            .update({
              title: defaultMatch.title,
              content: defaultMatch.content,
              seo_title: defaultMatch.seo_title,
              seo_description: defaultMatch.seo_description,
              updated_at: new Date().toISOString(),
            })
            .eq("id", page.id);
        } catch (e) {}
        return {
          ...page,
          title: defaultMatch.title,
          content: defaultMatch.content,
          seo_title: defaultMatch.seo_title,
          seo_description: defaultMatch.seo_description,
        };
      }
      return page;
    }
  } catch (e) {}

  if (defaultMatch) {
    return defaultMatch;
  }

  const pages = await getCMSPages();
  const found = pages.find((p) => candidates.includes(p.slug.toLowerCase().trim()));
  return found || null;
}

export async function saveCMSPage(pageData: Partial<CMSPageItem>) {
  const supabase = createAdminClient();
  const slug = pageData.slug || pageData.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "new-page";

  const payload: Record<string, any> = {
    title: pageData.title || "Untitled Page",
    slug,
    content: pageData.content || "",
    seo_title: pageData.seo_title || pageData.title,
    seo_description: pageData.seo_description || "",
    status: pageData.status || "published",
    updated_at: new Date().toISOString(),
  };

  try {
    if (pageData.id && !pageData.id.startsWith("page-")) {
      await supabase.from("pages").update(payload).eq("id", pageData.id);
    } else {
      await supabase.from("pages").insert([payload]);
    }
  } catch (e) {}

  // Fallback store
  const pages = await getCMSPages();
  if (pageData.id) {
    const idx = pages.findIndex((p) => p.id === pageData.id);
    if (idx >= 0) pages[idx] = { ...pages[idx], ...payload } as CMSPageItem;
    else pages.push({ ...payload, id: pageData.id, created_at: new Date().toISOString() } as CMSPageItem);
  } else {
    pages.unshift({
      ...payload,
      id: `page-${Date.now()}`,
      created_at: new Date().toISOString(),
    } as CMSPageItem);
  }
  await setFallbackStore(PAGES_STORE_KEY, pages);

  revalidatePath("/admin/pages");
  revalidatePath(`/page/${slug}`);
  revalidatePath(`/${slug}`);
  return { success: true };
}

export async function togglePageStatus(id: string, currentStatus: "draft" | "published") {
  const supabase = createAdminClient();
  const nextStatus = currentStatus === "published" ? "draft" : "published";

  try {
    if (!id.startsWith("page-")) {
      await supabase.from("pages").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", id);
    }
  } catch (e) {}

  const pages = await getCMSPages();
  const target = pages.find((p) => p.id === id);
  if (target) {
    target.status = nextStatus;
    target.updated_at = new Date().toISOString();
    await setFallbackStore(PAGES_STORE_KEY, pages);
  }

  revalidatePath("/admin/pages");
  return { success: true, status: nextStatus };
}

export async function deleteCMSPage(id: string) {
  try {
    const supabase = createAdminClient();
    if (!id.startsWith("page-")) {
      await supabase.from("pages").delete().eq("id", id);
    }
  } catch (e) {}

  const pages = await getCMSPages();
  const updated = pages.filter((p) => p.id !== id);
  await setFallbackStore(PAGES_STORE_KEY, updated);

  revalidatePath("/admin/pages");
  return { success: true };
}

export async function syncAllOfficialTemplates(): Promise<{ success: boolean; message: string; pages: CMSPageItem[] }> {
  try {
    const supabase = createAdminClient();
    for (const def of DEFAULT_CMS_PAGES) {
      const payload = {
        title: def.title,
        slug: def.slug,
        content: def.content,
        seo_title: def.seo_title,
        seo_description: def.seo_description,
        status: "published",
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase.from("pages").select("id").eq("slug", def.slug).limit(1);
      if (existing && existing.length > 0) {
        await supabase.from("pages").update(payload).eq("id", existing[0].id);
      } else {
        await supabase.from("pages").insert([payload]);
      }
    }

    await setFallbackStore(PAGES_STORE_KEY, DEFAULT_CMS_PAGES);
    revalidatePath("/admin/pages");
    revalidatePath("/page/[slug]", "page");
    return { success: true, message: "অফিসিয়াল পলিসি টেমপ্লেট ডাটাবেজে সফলভাবে সিঙ্ক হয়েছে!", pages: DEFAULT_CMS_PAGES };
  } catch (err: any) {
    return { success: false, message: err?.message || "সিঙ্ক করতে ব্যর্থ হয়েছে", pages: DEFAULT_CMS_PAGES };
  }
}
