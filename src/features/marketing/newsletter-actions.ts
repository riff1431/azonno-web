"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface SubscribeResult {
  success: boolean;
  message: string;
}

/**
 * Persists a subscriber's email to the database and ensures it's available for admin marketing/export.
 */
export async function subscribeNewsletter(email: string, lang: "en" | "bn" = "bn"): Promise<SubscribeResult> {
  if (!email || !email.includes("@") || email.length < 5) {
    return {
      success: false,
      message: lang === "bn" ? "Please enter a valid email Address Enter।" : "Please enter a valid email address.",
    };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const supabase = createAdminClient();

    // 1. Try to upsert into newsletter_subscribers table
    try {
      const { error: insertErr } = await supabase
        .from("newsletter_subscribers")
        .upsert(
          {
            email: cleanEmail,
            source: "footer_newsletter",
            subscribed_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );

      if (!insertErr) {
        return {
          success: true,
          message: lang === "bn" ? "Congratulations! your Subscription permanently Completed successfully।" : "Congratulations! You have successfully subscribed.",
        };
      }
    } catch {
      // Table may not exist yet, fallback to settings storage
    }

    // 2. Fallback: store in system settings under marketing group
    const { data: existing } = await supabase
      .from("settings")
      .select("value")
      .eq("group", "marketing")
      .eq("key", "newsletter_subscribers")
      .single();

    let list: Array<{ email: string; date: string }> = [];
    if (existing?.value) {
      try {
        list = typeof existing.value === "string" ? JSON.parse(existing.value) : existing.value;
      } catch {
        list = [];
      }
    }

    if (!list.some((item) => item.email === cleanEmail)) {
      list.push({ email: cleanEmail, date: new Date().toISOString() });
      await supabase.from("settings").upsert(
        {
          group: "marketing",
          key: "newsletter_subscribers",
          value: JSON.stringify(list),
          type: "json",
        },
        { onConflict: "group,key" }
      );
    }

    return {
      success: true,
      message: lang === "bn" ? "Congratulations! your Subscription permanently Completed successfully।" : "Congratulations! You have successfully subscribed.",
    };
  } catch (error: any) {
    console.error("Newsletter subscription error:", error);
    return {
      success: false,
      message: lang === "bn" ? " Invalid successfully। Please     :00 ।" : "Something went wrong. Please try again shortly.",
    };
  }
}

/**
 * Returns all newsletter subscribers for the admin panel
 */
export async function getNewsletterSubscribers(): Promise<Array<{ email: string; date: string }>> {
  try {
    const supabase = createAdminClient();

    // Try table first
    const { data: tableRows } = await supabase
      .from("newsletter_subscribers")
      .select("email, subscribed_at")
      .order("subscribed_at", { ascending: false });

    if (tableRows && tableRows.length > 0) {
      return tableRows.map((r: any) => ({
        email: r.email,
        date: r.subscribed_at || new Date().toISOString(),
      }));
    }

    // Fallback to settings
    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("group", "marketing")
      .eq("key", "newsletter_subscribers")
      .single();

    if (setting?.value) {
      const parsed = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      return Array.isArray(parsed) ? parsed : [];
    }

    return [];
  } catch {
    return [];
  }
}
