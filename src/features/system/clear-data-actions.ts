"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateSettingsCache, updateGroupSettings } from "@/lib/settings/config-service";
import { logIntegrationEvent } from "@/features/modules/actions";
import { revalidatePath } from "next/cache";
import type { DataClearableFeature } from "./clear-data-types";
export type { DataClearableFeature };

export async function clearFeatureData(featureId: string, confirmationWord: string) {
  if (confirmationWord.trim().toUpperCase() !== "DELETE" && confirmationWord.trim().toUpperCase() !== "CONFIRM") {
    return {
      success: false,
      error: "নিরাপত্তা নিশ্চিত করতে 'DELETE' শব্দটি সঠিকভাবে লিখুন।",
    };
  }

  const supabase = createAdminClient();
  let clearedCount = 0;
  let message = "";

  try {
    switch (featureId) {
      case "pixels_tracking": {
        // Reset pixel configs in module_settings
        await supabase
          .from("module_settings")
          .delete()
          .in("module_key", ["meta_pixel", "meta_capi", "tiktok_pixel", "tiktok_events_api", "gtm", "ga4"]);

        // Reset in settings table
        await supabase
          .from("settings")
          .delete()
          .in("group", ["marketing_meta", "marketing_tiktok", "marketing_google", "custom_scripts"]);

        clearedCount += 6;
        message = "সব মেটা পিক্সেল, টিকটক পিক্সেল এবং কনভার্সন API টোকেন সফলভাবে মুছে ফেলা হয়েছে।";
        break;
      }

      case "marketing_logs": {
        const { error, count } = await supabase
          .from("integration_logs")
          .delete()
          .in("module_key", ["meta_pixel", "tiktok_pixel", "meta_capi", "tiktok_events_api", "marketing", "gtm"]);

        clearedCount = count || 1;
        message = "সব মার্কেটিং ও পিক্সেল ইভেন্ট লগ সম্পূর্ণ মুছে ফেলা হয়েছে।";
        break;
      }

      case "abandoned_checkouts": {
        // Purge stored JSON checkouts in store_settings
        await updateGroupSettings("abandoned_checkouts_store", { leads: [] });

        // If incomplete_orders table exists, delete
        try {
          await supabase.from("incomplete_orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } catch {}

        clearedCount = 1;
        message = "সব অসম্পূর্ণ চেকআউট ও লিড রেকর্ড মুছে দেওয়া হয়েছে।";
        break;
      }

      case "orders_transactions": {
        // Delete order items
        await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        // Delete order status history
        await supabase.from("order_status_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        // Delete coupon usage
        await supabase.from("coupon_usage").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        // Delete orders
        const { count } = await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        clearedCount = count || 0;
        message = "সব অর্ডার ও পেমেন্ট হিস্ট্রি সম্পূর্ণ মুছে দেওয়া হয়েছে।";
        break;
      }

      case "reviews_qa": {
        try {
          await supabase.from("reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase.from("product_qa").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } catch {}

        clearedCount = 1;
        message = "সব কাস্টমার রিভিউ ও প্রশ্ন-উত্তর মুছে ফেলা হয়েছে।";
        break;
      }

      case "coupons_vouchers": {
        await supabase.from("coupon_usage").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        const { count } = await supabase.from("coupons").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        clearedCount = count || 0;
        message = "সব কুপন কোড ও ডিসকাউন্ট হিস্ট্রি মুছে ফেলা হয়েছে।";
        break;
      }

      case "finance_expenses_dues": {
        await updateGroupSettings("finance", {
          expenses: [],
          dues: [],
        });
        clearedCount = 2;
        message = "রেকর্ডকৃত সব অপারেশনাল খরচ ও বকেয়া খাতা রিসেট করা হয়েছে।";
        break;
      }

      case "system_cache": {
        invalidateSettingsCache();
        clearedCount = 1;
        message = "সিস্টেমের সব ইন-মেমোরি ক্যাশ সম্পূর্ণ রিফ্রেশ করা হয়েছে।";
        break;
      }

      default:
        return { success: false, error: "অপরিচিত ফিচার সিলেক্ট করা হয়েছে।" };
    }

    // Log the data clear event in audit log
    await logIntegrationEvent({
      provider: "SYSTEM_DATA_WIPER",
      moduleKey: featureId,
      event: "data_cleared_permanently",
      status: "success",
      message: `Admin permanently cleared data for feature '${featureId}'. Purged successfully.`,
    });

    // Invalidate caches & revalidate paths
    invalidateSettingsCache();
    revalidatePath("/admin");
    revalidatePath("/admin/settings/system-health");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/finance/sales");
    revalidatePath("/admin/finance/pnl");
    revalidatePath("/admin/finance/costs");
    revalidatePath("/admin/finance/dues");
    revalidatePath("/checkout");
    revalidatePath("/");

    return {
      success: true,
      clearedFeature: featureId,
      clearedCount,
      message,
      timestamp: new Date().toLocaleTimeString("en-GB"),
    };
  } catch (err: any) {
    console.error("Data clear error:", err);
    return {
      success: false,
      error: err.message || "ডেটা মুছতে গিয়ে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    };
  }
}
