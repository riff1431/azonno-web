"use client";

import { useState } from "react";
import {
  Truck,
  Search,
  RefreshCw,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Phone,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import type { ShipmentTrackingItem } from "@/features/orders/tracking-actions";
import Link from "next/link";
import { useAdminLang } from "@/lib/admin-lang-context";

interface TrackingClientProps {
  initialShipments: ShipmentTrackingItem[];
}

export function TrackingClient({ initialShipments }: TrackingClientProps) {
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const [shipments, setShipments] = useState<ShipmentTrackingItem[]>(initialShipments);
  const [searchQuery, setSearchQuery] = useState("");
  const [courierFilter, setCourierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedShipment, setSelectedShipment] = useState<ShipmentTrackingItem | null>(initialShipments[0] || null);
  const [refreshing, setRefreshing] = useState(false);

  const handleSyncAll = async () => {
    setRefreshing(true);
    try {
      const { syncAllActiveShipmentsAction } = await import("@/features/orders/tracking-actions");
      await syncAllActiveShipmentsAction();
    } catch (err) {
      console.warn("Tracking sync notice:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    const matchesCourier = courierFilter === "all" || s.courier_name.toLowerCase() === courierFilter;
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesSearch =
      s.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.consignment_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tracking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customer_phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourier && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: ShipmentTrackingItem["status"]) => {
    switch (status) {
      case "pending_pickup":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> {isBn ? "Pickup Pending" : "Pickup Pending"}
          </span>
        );
      case "in_transit":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
            <Truck className="h-3 w-3" /> {isBn ? "In Transit" : "In Transit"}
          </span>
        );
      case "out_for_delivery":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200">
            <MapPin className="h-3 w-3" /> {isBn ? "Delivery for  successfully" : "Out for Delivery"}
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> {isBn ? "Delivered" : "Delivered"}
          </span>
        );
      case "returned":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200">
            <AlertTriangle className="h-3 w-3" /> {isBn ? ":00 / Cancel" : "Returned / Cancelled"}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ModuleHeader
          title={isBn ? "items  Order  " : "Logistics & Order Tracking Hub"}
          description={
            isBn
              ? "items, Pathao and - Delivery      ।"
              : "Live dispatch tracking across SteadFast, Pathao, and in-house delivery fleets with milestone telemetry."
          }
          icon={Truck}
          badgeLabel={
            isBn
              ? `${filteredShipments.length} items Active `
              : `${filteredShipments.length} Active Shipments`
          }
        />

        <Button
          onClick={handleSyncAll}
          disabled={refreshing}
          size="sm"
          className="text-xs shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing
            ? (isBn ? " ..." : "Syncing APIs...")
            : (isBn ? "Courier :00  " : "Sync Couriers Now")}
        </Button>
      </div>

      {/* Main 2-Column Dashboard View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Search & Shipments List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-border shadow-card space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder={
                  isBn
                    ? "Order Number,  Code, Phone or Name  Search..."
                    : "Search by Order #, Consignment Code, Phone, or Name..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-secondary/50 pl-9 pr-4 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border text-xs">
              {/* Courier Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                {["all", "steadfast", "pathao", "in-house express"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCourierFilter(c)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      courierFilter === c
                        ? "bg-primary-600 text-white"
                        : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
                    }`}
                  >
                    {c === "all" ? (isBn ? "All Courier" : "All") : c}
                  </button>
                ))}
              </div>

              {/* Status filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: "all", label: isBn ? "All Status" : "All" },
                  { key: "out_for_delivery", label: isBn ? "Delivery for  successfully" : "Out for delivery" },
                  { key: "in_transit", label: isBn ? "In Transit" : "In transit" },
                  { key: "delivered", label: isBn ? "Delivered" : "Delivered" },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setStatusFilter(st.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                      statusFilter === st.key
                        ? "bg-slate-800 text-white"
                        : "text-text-muted hover:bg-surface-secondary"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Shipment Items */}
          <div className="space-y-3">
            {filteredShipments.map((shipment) => {
              const isSelected = selectedShipment?.id === shipment.id;
              return (
                <div
                  key={shipment.id}
                  onClick={() => {
                    setSelectedShipment(shipment);
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      document.getElementById("tracking-telemetry-detail")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className={`cursor-pointer rounded-2xl border bg-white p-4 sm:p-5 shadow-card transition-all hover:border-primary-400 ${
                    isSelected ? "border-primary-600 ring-2 ring-primary-500/10" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary-600 text-sm">{shipment.order_number}</span>
                        <span className="text-xs text-text-muted">•</span>
                        <span className="text-xs font-semibold text-text">{shipment.customer_name}</span>
                      </div>
                      <p className="text-xs text-text-secondary">{shipment.delivery_address}</p>
                    </div>

                    <div className="text-right space-y-1">
                      {getStatusBadge(shipment.status)}
                      <p className="text-[11px] font-mono text-text-muted">
                        {isBn ? "Code" : "Code"}: {shipment.tracking_code}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                    <span className="flex items-center gap-1 font-semibold text-text">
                      <Truck className="h-3.5 w-3.5 text-primary-600" />
                      {shipment.courier_name} ({isBn ? "Cash  Delivery" : "COD"}: ৳{shipment.cod_amount.toLocaleString()})
                    </span>

                    <span className="text-[11px] text-primary-600 font-semibold flex items-center gap-0.5">
                      {isBn ? " View" : "View Timeline"} <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredShipments.length === 0 && (
              <div className="p-12 text-center bg-white rounded-2xl border border-border space-y-2">
                <Truck className="h-8 w-8 text-text-muted mx-auto" />
                <h3 className="text-sm font-bold text-text">
                  {isBn ? "   Tracking" : "No active shipments matching criteria"}
                </h3>
                <p className="text-xs text-text-secondary">
                  {isBn
                    ? "  Code    or :00  ।"
                    : "Try searching for another consignment code or resetting filters."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Detailed Telemetry Timeline Card */}
        <div id="tracking-telemetry-detail" className="space-y-4">
          {selectedShipment ? (
            <div className="bg-white rounded-3xl border border-border p-5 sm:p-6 shadow-card space-y-6 sticky top-6">
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                    {selectedShipment.courier_name} {isBn ? "" : "Dispatch"}
                  </span>
                  <h3 className="text-base font-bold text-text mt-0.5">{selectedShipment.order_number}</h3>
                  <p className="text-xs font-mono text-text-muted">
                    {isBn ? "" : "Consignment"}: {selectedShipment.consignment_id}
                  </p>
                </div>
                {getStatusBadge(selectedShipment.status)}
              </div>

              {/* Recipient summary */}
              <div className="bg-surface-secondary/50 rounded-2xl p-4 border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text">{selectedShipment.customer_name}</span>
                  <a
                    href={`tel:${selectedShipment.customer_phone}`}
                    className="flex items-center gap-1 text-primary-600 font-semibold hover:underline"
                  >
                    <Phone className="h-3 w-3" /> {selectedShipment.customer_phone}
                  </a>
                </div>
                <p className="text-text-secondary leading-relaxed">{selectedShipment.delivery_address}</p>
                <div className="pt-2 border-t border-border flex justify-between font-semibold">
                  <span className="text-text-muted">{isBn ? "Add :" : "Collectible COD:"}</span>
                  <span className="text-emerald-700 font-bold">৳{selectedShipment.cod_amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Timeline checkpoints */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-text uppercase tracking-wider">
                  {isBn ? " " : "Milestone Telemetry"}
                </h4>
                <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {selectedShipment.timeline.map((step, idx) => (
                    <div key={idx} className="relative pl-7 text-xs">
                      <div
                        className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          step.completed
                            ? "bg-primary-600 border-primary-600 text-white"
                            : "bg-white border-border text-transparent"
                        }`}
                      >
                        {step.completed && <CheckCircle2 className="h-3 w-3" />}
                      </div>

                      <div className="space-y-0.5">
                        <p className={`font-semibold ${step.completed ? "text-text" : "text-text-muted"}`}>
                          {step.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-text-muted">
                          <span>{step.timestamp}</span>
                          {step.location && (
                            <>
                              <span>•</span>
                              <span>{step.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-border p-12 text-center text-text-muted text-xs">
              {isBn
                ? "  from    items   ।"
                : "Select a shipment on the left to view detailed tracking telemetry."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
