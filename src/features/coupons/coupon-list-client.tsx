"use client";

import { useState } from "react";
import { Tag, Plus, Trash2, X, Loader2 } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Button } from "@/components/shared/ui/button";
import { formatPrice } from "@/lib/utils";
import { createCoupon, deleteCoupon } from "./actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface CouponListClientProps {
  initialCoupons: any[];
}

export function CouponListClient({ initialCoupons }: CouponListClientProps) {
  const { t } = useAdminLang();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed" | "free_shipping",
    value: 10,
    max_discount: 200,
    min_cart_amount: 1000,
    usage_limit: 500,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createCoupon(form);
    if (res.success && res.coupon) {
      setCoupons([res.coupon, ...coupons]);
      setShowModal(false);
      setForm({
        code: "",
        type: "percentage",
        value: 10,
        max_discount: 200,
        min_cart_amount: 1000,
        usage_limit: 500,
      });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    const res = await deleteCoupon(id);
    if (res.success) {
      setCoupons(coupons.filter((c) => c.id !== id));
    }
  };

  const columns: Column<any>[] = [
    {
      key: "code",
      header: t("column_code"),
      sortable: true,
      cell: (row: any) => (
        <span className="font-mono font-extrabold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200">
          {row.code}
        </span>
      ),
    },
    {
      key: "type",
      header: t("discount_type"),
      cell: (row: any) => (
        <span className="text-xs font-semibold capitalize text-text">
          {row.type === "percentage"
            ? `${row.value}% OFF`
            : row.type === "fixed"
            ? `৳${row.value} Fixed`
            : t("free_shipping_label")}
        </span>
      ),
    },
    {
      key: "min_order",
      header: t("min_order"),
      cell: (row: any) => (
        <span className="text-xs text-text-muted">
          {row.min_cart_amount ? formatPrice(row.min_cart_amount) : "—"}
        </span>
      ),
    },
    {
      key: "max_discount",
      header: t("max_discount"),
      cell: (row: any) => (
        <span className="text-xs text-text-muted">
          {row.max_discount ? formatPrice(row.max_discount) : "—"}
        </span>
      ),
    },
    {
      key: "usage",
      header: t("column_usage"),
      cell: (row: any) => (
        <span className="text-xs font-semibold text-text">
          {row.usage_count || 0} / {row.usage_limit || "∞"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("column_status"),
      cell: (row: any) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
            row.status === "active"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("column_actions"),
      cell: (row: any) => (
        <button
          onClick={() => handleDelete(row.id)}
          className="p-1 text-text-muted hover:text-red-600 transition-colors"
          title={t("delete")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t("coupon_management")}</h1>
          <p className="text-sm text-text-secondary">
            {t("coupon_desc")}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          {t("create_coupon")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        searchKey="code"
        searchPlaceholder={t("search_coupons")}
        emptyMessage={t("no_coupons")}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary-600" />
                Create New Coupon
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-text-muted hover:bg-surface-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-text mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full rounded-xl border border-border px-3 py-2 uppercase font-mono font-bold text-text focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full rounded-xl border border-border px-3 py-2 text-text focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">Value</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border px-3 py-2 text-text focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text mb-1">Min Order (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.min_cart_amount}
                    onChange={(e) => setForm({ ...form, min_cart_amount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border px-3 py-2 text-text focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">Max Cap (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.max_discount}
                    onChange={(e) => setForm({ ...form, max_discount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border px-3 py-2 text-text focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Usage Limit</label>
                <input
                  type="number"
                  min={1}
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border px-3 py-2 text-text focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Coupon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
