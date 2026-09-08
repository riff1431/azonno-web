import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  Phone,
  Truck,
  CheckCircle2,
  Printer,
  ExternalLink,
  AlertOctagon,
} from "lucide-react";
import { getCustomerOrderById } from "@/features/account/actions";
import { formatPrice, formatCustomerLogEntry } from "@/lib/utils";
import { Button } from "@/components/shared/ui/button";
import { OrderCancelDialog } from "./order-cancel-dialog";

export const metadata = {
  title: "Order Details — My Account",
};

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getCustomerOrderById(id);

  if (!order) {
    notFound();
  }

  const address = order.shipping_address_snapshot || {};
  const items = order.order_items || [];
  const history = order.order_status_history || [];

  const isCancelled = order.status === "cancelled";
  const canCancel =
    ["pending", "confirmed", "processing"].includes(order.status) &&
    !order.consignment_id;

  const statusSteps = [
    { key: "pending", label: "Order Placed" },
    { key: "confirmed", label: "Confirmed" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "In Transit" },
    { key: "delivered", label: "Delivered" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "processing":
      case "packed":
      case "ready_for_pickup":
        return 2;
      case "shipped":
      case "in_transit":
      case "out_for_delivery":
        return 3;
      case "delivered":
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/account/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text flex items-center gap-2">
              <span>Order {order.order_number}</span>
              <span
                className={`rounded-full text-xs px-2.5 py-0.5 border uppercase font-extrabold ${
                  isCancelled
                    ? "bg-red-50 text-red-700 border-red-200"
                    : order.status === "delivered"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-primary-50 text-primary-700 border-primary-200"
                }`}
              >
                {order.status}
              </span>
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Placed on {new Date(order.created_at).toLocaleString("en-GB")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canCancel && (
            <OrderCancelDialog orderId={order.id} orderNumber={order.order_number} />
          )}
          <Link href={`/orders/${order.id}/invoice`} target="_blank">
            <Button variant="outline" size="sm" className="text-xs font-bold text-gray-800 hover:text-black">
              <Printer className="h-3.5 w-3.5 mr-1 text-[#e91e63]" />
              Print / Download Invoice
            </Button>
          </Link>
          <Link href={`/track-order`}>
            <Button size="sm" className="text-xs font-bold bg-[#e91e63] hover:bg-sg-pink-hover text-white shadow-xs">
              <Truck className="h-3.5 w-3.5 mr-1" />
              Live Tracking
            </Button>
          </Link>
        </div>
      </div>

      {/* Cancelled Banner if cancelled */}
      {isCancelled && (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-red-900">This order has been cancelled</h2>
            <p className="text-xs text-red-700 mt-0.5">
              All reserved items have been restored to store inventory. If you were charged or need assistance, please reach out to our customer support team.
            </p>
          </div>
        </div>
      )}

      {/* 5-step status progress bar */}
      {!isCancelled && (
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Delivery Progress
          </h2>

          <div className="grid grid-cols-5 gap-1 text-center">
            {statusSteps.map((step, idx) => {
              const isCompleted = idx <= currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={step.key} className="space-y-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isCompleted ? "bg-primary-600" : "bg-zinc-200"
                    }`}
                  />
                  <span
                    className={`block text-[11px] leading-tight ${
                      isCurrent
                        ? "font-extrabold text-primary-600"
                        : isCompleted
                        ? "font-bold text-text"
                        : "text-text-muted"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {history.length > 0 && (
            <div className="pt-4 border-t border-border space-y-2">
              <h3 className="text-xs font-bold text-text">Fulfillment Timeline</h3>
              <div className="space-y-2 text-xs">
                {history.map((h: any) => {
                  const view = formatCustomerLogEntry(
                    { status: h.status, note: h.note, courier_name: order.courier_name },
                    "en"
                  );
                  return (
                    <div key={h.id} className="flex items-start gap-2 text-text-secondary">
                      <div className="h-2 w-2 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-text">
                          {view.title}: <span className="font-normal text-text-secondary">{view.description}</span>
                        </p>
                        <span className="text-[10px] text-text-muted">
                          {new Date(h.created_at).toLocaleString("en-GB")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {isCancelled && history.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-3">
          <h3 className="text-xs font-bold text-text uppercase tracking-wider">Order History</h3>
          <div className="space-y-2 text-xs">
            {history.map((h: any) => {
              const view = formatCustomerLogEntry(
                { status: h.status, note: h.note, courier_name: order.courier_name },
                "en"
              );
              return (
                <div key={h.id} className="flex items-start gap-2 text-text-secondary">
                  <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-text">
                      {view.title}: <span className="font-normal text-text-secondary">{view.description}</span>
                    </p>
                    <span className="text-[10px] text-text-muted">
                      {new Date(h.created_at).toLocaleString("en-GB")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Line Items */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-white shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border">
            <h2 className="text-sm font-bold text-text">Ordered Products ({items.length})</h2>
          </div>

          <div className="divide-y divide-border">
            {items.map((it: any) => (
              <div key={it.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-text-muted">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-text text-sm">{it.product_name_snapshot}</p>
                    <p className="text-text-muted mt-0.5">
                      Quantity: {it.quantity} × {formatPrice(it.unit_price)}
                    </p>
                  </div>
                </div>

                <span className="font-extrabold text-text text-sm">
                  {formatPrice(it.total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Address & Summary */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-3 text-xs">
            <h2 className="text-sm font-bold text-text flex items-center gap-2 border-b border-border pb-2">
              <MapPin className="h-4 w-4 text-primary-600" />
              Delivery Destination
            </h2>
            <p className="font-bold text-text">{address.name}</p>
            <p className="text-text-secondary">{address.phone}</p>
            <p className="text-text-secondary">{address.address}</p>
            <p className="text-text-secondary">{address.thana}, {address.district}</p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-3 text-xs">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2">
              Financial Summary
            </h2>
            <div className="space-y-2 text-text-secondary">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-text">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-text">
                  {order.shipping_amount === 0 ? "FREE" : formatPrice(order.shipping_amount)}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-extrabold text-sm text-text">
                <span>Total Amount</span>
                <span className="text-primary-700">{formatPrice(order.total)}</span>
              </div>
              <div className="pt-2 border-t border-dashed border-border flex justify-between uppercase font-bold text-[10px]">
                <span>Payment</span>
                <span className="text-emerald-700">{order.payment_method} ({order.payment_status})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
