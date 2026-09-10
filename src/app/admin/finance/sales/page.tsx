import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";
import { DollarSign, TrendingUp, ShoppingBag, Tag, CreditCard } from "lucide-react";
import { FinanceSubNav } from "@/components/admin/finance/finance-sub-nav";

export const metadata = {
  title: "Sales Reports — Finance",
};

export default async function AdminFinanceSalesPage() {
  const supabase = createAdminClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, total, subtotal, shipping_amount, discount_amount, payment_method, status, created_at")
    .order("created_at", { ascending: false });

  const orderList = orders || [];
  const grossRevenue = orderList.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalDiscounts = orderList.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0);
  const totalShipping = orderList.reduce((sum, o) => sum + Number(o.shipping_amount || 0), 0);
  const aov = orderList.length > 0 ? Math.round(grossRevenue / orderList.length) : 0;

  const codOrders = orderList.filter((o) => o.payment_method === "cod").length;

  return (
    <div className="space-y-6">
      <FinanceSubNav />

      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-text">Sales & Revenue Reports</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Real-time gross revenue, order volume, discounts, and payment methods breakdown.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <span className="text-xs text-text-muted font-medium">Gross Revenue</span>
          <p className="text-2xl font-extrabold text-text">{formatPrice(grossRevenue)}</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <span className="text-xs text-text-muted font-medium">Total Orders</span>
          <p className="text-2xl font-extrabold text-text">{orderList.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-xs text-text-muted font-medium">Average Order Value</span>
          <p className="text-2xl font-extrabold text-text">{formatPrice(aov)}</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Tag className="h-5 w-5" />
          </div>
          <span className="text-xs text-text-muted font-medium">Discounts Redeemed</span>
          <p className="text-2xl font-extrabold text-text">{formatPrice(totalDiscounts)}</p>
        </div>
      </div>

      {/* Orders Ledger */}
      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-bold text-text">Recent Orders Transactions</h2>
          <span className="text-xs text-text-muted font-semibold">
            COD Share: {Math.round((codOrders / (orderList.length || 1)) * 100)}%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/60 text-text-muted uppercase font-bold border-b border-border">
              <tr>
                <th className="px-4 py-3">Order Number</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Subtotal</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3 font-extrabold text-text">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orderList.map((ord) => (
                <tr key={ord.id} className="hover:bg-surface-secondary/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-primary-600">
                    {ord.order_number}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(ord.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3 uppercase font-semibold text-text">
                    {ord.payment_method}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{formatPrice(ord.subtotal)}</td>
                  <td className="px-4 py-3 text-emerald-600 font-semibold">
                    {ord.discount_amount > 0 ? `-${formatPrice(ord.discount_amount)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {ord.shipping_amount === 0 ? "FREE" : formatPrice(ord.shipping_amount)}
                  </td>
                  <td className="px-4 py-3 font-extrabold text-text text-sm">
                    {formatPrice(ord.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
