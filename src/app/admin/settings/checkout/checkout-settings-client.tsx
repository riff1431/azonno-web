"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Save,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Banknote,
  Truck,
  ShieldAlert,
  Clock,
  Tag,
  Radio,
  MapPin,
} from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { Button } from "@/components/shared/ui/button";
import { saveCheckoutSettings } from "@/features/settings/actions";
import { saveCheckoutAndFraudSettings } from "@/features/settings/checkout-settings-actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface CheckoutSettingsClientProps {
  initialSettings: Record<string, any>;
}

export function CheckoutSettingsClient({ initialSettings }: CheckoutSettingsClientProps) {
  const { t } = useAdminLang();
  const [formData, setFormData] = useState({
    // Basic Access
    guest_checkout_enabled: initialSettings.guest_checkout_enabled ?? true,
    allow_customer_registration: initialSettings.allow_customer_registration ?? true,
    cod_enabled: initialSettings.cod_enabled ?? true,
    cod_max_amount: initialSettings.cod_max_amount ? Number(initialSettings.cod_max_amount) : 20000,
    min_order_amount: initialSettings.min_order_amount ? Number(initialSettings.min_order_amount) : 0,
    require_phone: initialSettings.require_phone ?? true,
    require_email: initialSettings.require_email ?? false,
    order_notes_enabled: initialSettings.order_notes_enabled ?? true,
    show_location_hierarchy: initialSettings.show_location_hierarchy !== false,

    // Dynamic Delivery Charges (BDT)
    inside_dhaka_rate: initialSettings.inside_dhaka_rate ? Number(initialSettings.inside_dhaka_rate) : 70,
    sub_dhaka_rate: initialSettings.sub_dhaka_rate ? Number(initialSettings.sub_dhaka_rate) : 100,
    outside_dhaka_rate: initialSettings.outside_dhaka_rate ? Number(initialSettings.outside_dhaka_rate) : 130,
    free_shipping_threshold: initialSettings.free_shipping_threshold ? Number(initialSettings.free_shipping_threshold) : 2500,
    enable_free_shipping_meter: initialSettings.enable_free_shipping_meter !== false,

    // Anti-Fraud & OTP Rules
    require_otp_all_orders: Boolean(initialSettings.require_otp_all_orders),
    enable_courier_ratio_otp: initialSettings.enable_courier_ratio_otp !== false,
    courier_ratio_otp_threshold: initialSettings.courier_ratio_otp_threshold ? Number(initialSettings.courier_ratio_otp_threshold) : 60,
    enable_cod_otp: initialSettings.enable_cod_otp !== false,
    cod_otp_threshold: initialSettings.cod_otp_threshold ? Number(initialSettings.cod_otp_threshold) : 3000,
    enable_duplicate_blocker: initialSettings.enable_duplicate_blocker !== false,
    duplicate_window_minutes: initialSettings.duplicate_window_minutes ? Number(initialSettings.duplicate_window_minutes) : 5,

    // Abandoned Cart
    enable_abandoned_cart_capture: initialSettings.enable_abandoned_cart_capture !== false,
    abandoned_cart_recovery_hours: initialSettings.abandoned_cart_recovery_hours ? Number(initialSettings.abandoned_cart_recovery_hours) : 2,
    abandoned_cart_discount_code: initialSettings.abandoned_cart_discount_code || "SAVE5",
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      await Promise.all([
        saveCheckoutSettings({
          guest_checkout_enabled: formData.guest_checkout_enabled,
          allow_customer_registration: formData.allow_customer_registration,
          cod_enabled: formData.cod_enabled,
          cod_max_amount: formData.cod_max_amount,
          min_order_amount: formData.min_order_amount,
          require_phone: formData.require_phone,
          require_email: formData.require_email,
          order_notes_enabled: formData.order_notes_enabled,
          show_location_hierarchy: formData.show_location_hierarchy,
        }),
        saveCheckoutAndFraudSettings({
          inside_dhaka_rate: formData.inside_dhaka_rate,
          sub_dhaka_rate: formData.sub_dhaka_rate,
          outside_dhaka_rate: formData.outside_dhaka_rate,
          free_shipping_threshold: formData.free_shipping_threshold,
          enable_free_shipping_meter: formData.enable_free_shipping_meter,
          require_otp_all_orders: formData.require_otp_all_orders,
          enable_courier_ratio_otp: formData.enable_courier_ratio_otp,
          courier_ratio_otp_threshold: formData.courier_ratio_otp_threshold,
          enable_cod_otp: formData.enable_cod_otp,
          cod_otp_threshold: formData.cod_otp_threshold,
          enable_duplicate_blocker: formData.enable_duplicate_blocker,
          duplicate_window_minutes: formData.duplicate_window_minutes,
          enable_abandoned_cart_capture: formData.enable_abandoned_cart_capture,
          abandoned_cart_recovery_hours: formData.abandoned_cart_recovery_hours,
          abandoned_cart_discount_code: formData.abandoned_cart_discount_code,
          show_location_hierarchy: formData.show_location_hierarchy,
        }),
      ]);

      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <ModuleHeader
        title={t("checkout_settings_title")}
        description={t("checkout_settings_desc")}
        icon={ShoppingCart}
        isCore
      />

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 animate-in fade-in-0">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{t("store_settings_success")}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* 1. Dynamic Delivery Charges (BDT) */}
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
          <div className="border-b border-border pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#1D6474]" />
              Bangladesh Dynamic Delivery Charges (BDT)
            </h2>
            <span className="text-[11px] font-bold text-[#1D6474] bg-teal-50/60 px-2.5 py-0.5 rounded-full border border-teal-200">
              Location Auto-Calculated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border-2 border-teal-200 bg-teal-50/60/30 space-y-1.5">
              <label className="block font-bold text-text text-xs">
                Inside Dhaka Rate (৳)
              </label>
              <input
                type="number"
                min={0}
                value={formData.inside_dhaka_rate}
                onChange={(e) =>
                  setFormData({ ...formData, inside_dhaka_rate: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-bold text-text focus:outline-none focus:border-primary-500"
              />
              <span className="text-[10px] text-text-muted block">
                Applied for Dhaka Metropolitan areas. Controls the price on the &ldquo;Inside Dhaka&rdquo; checkout button.
              </span>
            </div>

            <div className="p-4 rounded-2xl border-2 border-teal-200 bg-teal-50/60/30 space-y-1.5">
              <label className="block font-bold text-text text-xs">
                Outside Dhaka / Nationwide Rate (৳)
              </label>
              <input
                type="number"
                min={0}
                value={formData.outside_dhaka_rate}
                onChange={(e) =>
                  setFormData({ ...formData, outside_dhaka_rate: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-bold text-text focus:outline-none focus:border-primary-500"
              />
              <span className="text-[10px] text-text-muted block">
                Applied for all 63 districts nationwide. Controls the price on the &ldquo;Outside Dhaka&rdquo; checkout button.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
            <div>
              <label className="block font-bold text-text mb-1">
                Free Nationwide Delivery Threshold (৳)
              </label>
              <input
                type="number"
                min={0}
                value={formData.free_shipping_threshold}
                onChange={(e) =>
                  setFormData({ ...formData, free_shipping_threshold: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-emerald-700 focus:outline-none"
              />
              <span className="text-[10px] text-text-muted mt-1 block">
                Cart subtotal needed to grant free delivery (Set to 0 to disable free delivery).
              </span>
            </div>

            <div className="flex items-center pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_free_shipping_meter}
                  onChange={(e) =>
                    setFormData({ ...formData, enable_free_shipping_meter: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-border text-[#1D6474] focus:ring-[#1D6474] accent-[#1D6474]"
                />
                <div>
                  <span className="font-bold text-text block">
                    Show Free Shipping Progress Bar
                  </span>
                  <span className="text-[10px] text-text-muted">
                    Displays animated progress bar in cart drawer &amp; checkout.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 2. Anti-Fraud & Risk Protection (Bangladesh COD Verification) */}
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
          <div className="border-b border-border pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#1D6474]" />
              Anti-Fraud &amp; COD Verification Shield
            </h2>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 uppercase">
              RTO / Return Reducer
            </span>
          </div>

          <div className="space-y-3">
            {/* Option 1: Require OTP on ALL Orders */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-surface-secondary/40 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-text text-xs sm:text-sm block">
                  Verify Phone Number with SMS OTP on ALL Orders
                </span>
                <span className="text-text-muted text-[11px]">
                  When enabled, every single order requires a 4-digit SMS OTP code sent to the customer's phone before confirming the order.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.require_otp_all_orders}
                onChange={(e) =>
                  setFormData({ ...formData, require_otp_all_orders: e.target.checked })
                }
                className="h-5 w-5 rounded border-border text-[#1D6474] focus:ring-[#1D6474] accent-[#1D6474]"
              />
            </label>

            {/* Option 2: Require OTP if BDCourier Ratio is Low */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-surface-secondary/40 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-text text-xs sm:text-sm block">
                  Verify Phone with SMS if BDCourier Delivery Ratio is Below Threshold
                </span>
                <span className="text-text-muted text-[11px]">
                  Cross-checks customer's courier delivery history. If success ratio is less than {formData.courier_ratio_otp_threshold}%, automatically prompts for SMS verification.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.enable_courier_ratio_otp}
                onChange={(e) =>
                  setFormData({ ...formData, enable_courier_ratio_otp: e.target.checked })
                }
                className="h-5 w-5 rounded border-border text-[#1D6474] focus:ring-[#1D6474] accent-[#1D6474]"
              />
            </label>

            {formData.enable_courier_ratio_otp && (
              <div className="p-4 rounded-2xl bg-surface-secondary/50 border border-border space-y-2">
                <label className="block font-bold text-text">
                  BDCourier Ratio OTP Trigger Threshold (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.courier_ratio_otp_threshold}
                  onChange={(e) =>
                    setFormData({ ...formData, courier_ratio_otp_threshold: Number(e.target.value) })
                  }
                  className="w-full sm:w-64 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-text focus:outline-none"
                />
                <span className="text-[10px] text-text-muted block">
                  Customers with a courier delivery success rate below this percentage (e.g. 60%) must complete SMS verification.
                </span>
              </div>
            )}

            {/* Option 3: COD OTP Toggle */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-surface-secondary/40 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-text text-xs sm:text-sm block">
                  Enable SMS OTP Verification for High-Value COD Orders
                </span>
                <span className="text-text-muted text-[11px]">
                  Requires a 4-digit SMS OTP code for Cash on Delivery orders exceeding the threshold amount.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.enable_cod_otp}
                onChange={(e) =>
                  setFormData({ ...formData, enable_cod_otp: e.target.checked })
                }
                className="h-5 w-5 rounded border-border text-[#1D6474] focus:ring-[#1D6474] accent-[#1D6474]"
              />
            </label>

            {formData.enable_cod_otp && (
              <div className="p-4 rounded-2xl bg-surface-secondary/50 border border-border space-y-2">
                <label className="block font-bold text-text">
                  Trigger OTP for COD Orders Above Amount (৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.cod_otp_threshold}
                  onChange={(e) =>
                    setFormData({ ...formData, cod_otp_threshold: Number(e.target.value) })
                  }
                  className="w-full sm:w-64 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-text focus:outline-none"
                />
                <span className="text-[10px] text-text-muted block">
                  Orders exceeding this BDT amount will be prompted for instant SMS OTP verification.
                </span>
              </div>
            )}

            {/* Note: If all disabled */}
            {!formData.require_otp_all_orders && !formData.enable_courier_ratio_otp && !formData.enable_cod_otp && (
              <div className="p-3 rounded-2xl bg-zinc-100 border border-zinc-200 text-[11px] text-zinc-600 font-medium">
                ℹ️ <strong>All SMS verification rules are currently turned OFF.</strong> Customers can place orders directly without receiving any SMS OTP codes.
              </div>
            )}

            {/* Duplicate Order Blocker */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-surface-secondary/40 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-text text-xs sm:text-sm block">
                  Duplicate Order Blocker
                </span>
                <span className="text-text-muted text-[11px]">
                  Prevents customers from accidentally submitting multiple identical orders from the same phone number within {formData.duplicate_window_minutes} minutes.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.enable_duplicate_blocker}
                onChange={(e) =>
                  setFormData({ ...formData, enable_duplicate_blocker: e.target.checked })
                }
                className="h-5 w-5 rounded border-border text-[#1D6474] focus:ring-[#1D6474] accent-[#1D6474]"
              />
            </label>
          </div>
        </div>

        {/* 3. Abandoned Cart Live Capture */}
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
          <div className="border-b border-border pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#1D6474]" />
              Real-Time Abandoned Cart Capture &amp; Recovery
            </h2>
            <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 uppercase">
              Sales Recovery
            </span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-surface-secondary/40 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-text text-xs sm:text-sm block">
                  Live Capture Abandoned Checkouts
                </span>
                <span className="text-text-muted text-[11px]">
                  Automatically saves customer phone number and cart contents in real-time as soon as typed into checkout fields before final submission.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.enable_abandoned_cart_capture}
                onChange={(e) =>
                  setFormData({ ...formData, enable_abandoned_cart_capture: e.target.checked })
                }
                className="h-5 w-5 rounded border-border text-[#1D6474] focus:ring-[#1D6474] accent-[#1D6474]"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-bold text-text mb-1">
                  Recovery SMS Delay (Hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={48}
                  value={formData.abandoned_cart_recovery_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      abandoned_cart_recovery_hours: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-text mb-1">
                  Incentive Voucher Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SAVE5"
                  value={formData.abandoned_cart_discount_code}
                  onChange={(e) =>
                    setFormData({ ...formData, abandoned_cart_discount_code: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Customer Access & Login Requirements */}
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#1D6474]" />
            Customer Account &amp; Order Permissions
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-surface-secondary/40 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-text text-xs sm:text-sm block">
                  Allow Guest Checkout
                </span>
                <span className="text-text-muted text-[11px]">
                  When enabled, customers can buy in 1-click without creating a password.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.guest_checkout_enabled}
                onChange={(e) =>
                  setFormData({ ...formData, guest_checkout_enabled: e.target.checked })
                }
                className="h-5 w-5 rounded border-border text-[#1D6474] focus:ring-[#1D6474] accent-[#1D6474]"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-surface-secondary/40 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-text text-xs sm:text-sm block">
                  Require Email Address (Optional for fast mobile buy)
                </span>
                <span className="text-text-muted text-[11px]">
                  When unchecked, only phone number is required for fast Bangladesh mobile orders.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.require_email}
                onChange={(e) =>
                  setFormData({ ...formData, require_email: e.target.checked })
                }
                className="h-5 w-5 rounded border-border text-[#1D6474] focus:ring-[#1D6474] accent-[#1D6474]"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-surface-secondary/40 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-text text-xs sm:text-sm block flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#1D6474]" />
                  Show Division, District &amp; Thana (Division, District, Thana / Upazila) Selectors
                </span>
                <span className="text-text-muted text-[11px]">
                  When enabled, customers pick Division, District, and Thana from dropdown lists during checkout. When disabled, customers only choose Inside/Outside Dhaka and enter their complete street address.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.show_location_hierarchy}
                onChange={(e) =>
                  setFormData({ ...formData, show_location_hierarchy: e.target.checked })
                }
                className="h-5 w-5 rounded border-border text-[#1D6474] focus:ring-[#1D6474] accent-[#1D6474]"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-[#1D6474] hover:bg-[#164E63] text-white font-extrabold px-8 py-3 text-xs shadow-lg transition-all active:scale-95"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? t("saving_changes_btn") : t("save_checkout_btn")}
          </Button>
        </div>
      </form>
    </div>
  );
}
