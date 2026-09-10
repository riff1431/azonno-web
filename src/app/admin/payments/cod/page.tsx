import { getPaymentGatewayConfig, savePaymentGatewayConfig } from "@/features/payments/actions";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { Banknote, Save, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { revalidatePath } from "next/cache";

export const metadata = {
  title: "Cash on Delivery (COD) Settings — Admin Dashboard",
};

export default async function AdminCodPage() {
  const { isEnabled, status, settings } = await getPaymentGatewayConfig("cod");

  async function handleSave(formData: FormData) {
    "use server";
    const enabled = formData.get("is_enabled") === "on";
    const minAmount = Number(formData.get("min_amount") || 0);
    const maxAmount = Number(formData.get("max_amount") || 20000);
    const codCharge = Number(formData.get("cod_charge") || 0);
    const allowGuest = formData.get("allow_guest") === "on";
    const blockFraudScore = Number(formData.get("block_fraud_score") || 70);

    await savePaymentGatewayConfig("cod", {
      min_amount: { value: minAmount, valueType: "number" },
      max_amount: { value: maxAmount, valueType: "number" },
      cod_charge: { value: codCharge, valueType: "number" },
      allow_guest: { value: allowGuest, valueType: "boolean" },
      block_fraud_score: { value: blockFraudScore, valueType: "number" },
    }, enabled);

    revalidatePath("/admin/payments/cod");
    revalidatePath("/admin/payments");
    revalidatePath("/checkout");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <ModuleHeader
        title="Cash on Delivery (COD) Rules & Safeguards"
        description="Configure order limits, courier handling charges, guest buyer permissions, and automated fraud prevention thresholds for cash payments."
        iconName="Banknote"
        status={isEnabled ? "active" : "inactive"}
        backHref="/admin/payments"
      />

      <form action={handleSave} className="space-y-6 text-xs">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-card flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-text">Enable Cash on Delivery (COD)</h3>
            <p className="text-text-muted text-[11px] mt-0.5">
              Allow storefront customers to select Cash on Delivery and pay when products are delivered.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="is_enabled"
              defaultChecked={isEnabled}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-primary-600" />
            Monetary Thresholds & Surcharges
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">
                Minimum Order Amount (৳)
              </label>
              <input
                type="number"
                name="min_amount"
                defaultValue={settings.min_amount || 0}
                min={0}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">
                Maximum Order Limit (৳)
              </label>
              <input
                type="number"
                name="max_amount"
                defaultValue={settings.max_amount || 20000}
                min={100}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">
                Extra COD Processing Fee (৳)
              </label>
              <input
                type="number"
                name="cod_charge"
                defaultValue={settings.cod_charge || 0}
                min={0}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary-600" />
            Fraud Protection & Block Rules
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-text mb-1">
                Block COD when Customer Risk Score exceeds
              </label>
              <input
                type="number"
                name="block_fraud_score"
                defaultValue={settings.block_fraud_score || 70}
                min={10}
                max={100}
                className="w-48 rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
              />
              <span className="text-[10px] text-text-muted mt-0.5 block">
                Customers with courier return abuse or fake order flags above this threshold must prepay online.
              </span>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-surface-secondary/40 cursor-pointer">
              <div>
                <span className="font-semibold text-text block">Allow COD for Guest Buyers</span>
                <span className="text-text-muted text-[11px]">
                  Allows unregistered guest users to place COD orders with phone OTP verification.
                </span>
              </div>
              <input
                type="checkbox"
                name="allow_guest"
                defaultChecked={settings.allow_guest ?? true}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" className="text-xs">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save COD Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
