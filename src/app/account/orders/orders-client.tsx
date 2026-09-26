"use client";

import Link from "next/link";
import { ShoppingBag, Eye } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/shared/ui/button";
import { useLanguage } from "@/context/language-context";

interface OrdersClientProps {
  orders: any[];
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const { language, toBn, formatPriceBn } = useLanguage();
  const isBn = language === "bn";

  const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
    shipped: "bg-purple-50 text-purple-700 border-purple-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  const getStatusText = (status: string) => {
    if (!isBn) return status;
    const statusMap: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancel",
      returned: "",
    };
    return statusMap[status.toLowerCase()] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">
            {isBn ? " Order" : "My Orders"}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            {isBn
              ? " Order  View, Delivery    Invoice  ।"
              : "Review past orders, track delivery status, and view invoices."}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white p-8 sm:p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50/60 text-[#1D6474]">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-text">
            {isBn ? " Order  Tracking" : "No orders placed yet"}
          </h2>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            {isBn
              ? "your  Order । Order      Delivery Status  ।"
              : "Once you place an order, you will be able to track its live delivery status here."}
          </p>
          <Link href="/products" className="inline-block mt-2">
            <Button size="sm" className="bg-[#1D6474] hover:bg-[#d81557] text-white text-xs font-bold rounded-xl px-5">
              {isBn ? "Products View" : "Explore Products"}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = order.order_items || [];
            return (
              <div
                key={order.id}
                className="rounded-3xl border border-border bg-white p-5 shadow-card space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3 text-xs">
                  <div>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="font-mono font-extrabold text-primary-600 text-sm block hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <span className="text-text-muted">
                      {isBn
                        ? `Order Date: ${toBn(new Date(order.created_at).toLocaleDateString("en-GB"))}`
                        : `Placed on ${new Date(order.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-0.5 font-bold uppercase border text-[11px] ${
                        statusColors[order.status] || "bg-surface-secondary text-text"
                      }`}
                    >
                      {getStatusText(order.status)}
                    </span>
                    <Link href={`/orders/${order.id}/invoice`} target="_blank">
                      <Button variant="outline" size="sm" className="text-xs font-semibold text-gray-700 hover:text-black rounded-xl">
                        <ShoppingBag className="h-3.5 w-3.5 mr-1 text-[#1D6474]" />
                        {isBn ? "" : "Invoice"}
                      </Button>
                    </Link>
                    <Link href={`/account/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl">
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        {isBn ? "" : "Details"}
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="space-y-2 text-xs">
                  {items.map((it: any) => (
                    <div key={it.id} className="flex justify-between text-text-secondary">
                      <span>
                        {isBn ? `${toBn(it.quantity)}x ` : `${it.quantity}x `}
                        {it.product_name_snapshot}
                      </span>
                      <span className="font-semibold text-text">
                        {isBn ? formatPriceBn(it.total) : formatPrice(it.total)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Total */}
                <div className="flex items-center justify-between border-t border-dashed border-border pt-3 text-xs">
                  <div className="text-text-muted">
                    <span>{isBn ? "Payment : " : "Payment: "}</span>
                    <strong className="text-text uppercase font-semibold">
                      {order.payment_method === "cash_on_delivery" || order.payment_method === "cod"
                        ? (isBn ? "Cash  Delivery" : "Cash on Delivery")
                        : order.payment_method}
                    </strong>
                  </div>
                  <div className="text-sm font-extrabold text-text">
                    {isBn ? "Total: " : "Total: "}
                    <span className="text-primary-700">
                      {isBn ? formatPriceBn(order.total) : formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
