"use client";

import { useState } from "react";
import Link from "next/link";
import { Truck, CheckCircle2, Settings, ExternalLink, ShieldCheck, RefreshCw, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { DataTable, type Column } from "@/components/admin/data-table";
import { formatPrice } from "@/lib/utils";
import { useAdminLang } from "@/lib/admin-lang-context";

interface CourierListClientProps {
  initialCouriers: any[];
  initialShipments: any[];
}

export function CourierListClient({ initialCouriers, initialShipments }: CourierListClientProps) {
  const { lang } = useAdminLang();
  const isBn = lang === "bn";
  const [couriers] = useState(initialCouriers);
  const [shipments, setShipments] = useState(initialShipments);

  const shipmentColumns: Column<any>[] = [
    {
      key: "consignment",
      header: isBn ? "কনসাইনমেন্ট / ট্র্যাকিং" : "Consignment / Tracking",
      sortable: true,
      cell: (row: any) => (
        <div>
          <span className="font-mono font-extrabold text-primary-600 block text-xs">
            {row.consignment_id}
          </span>
          <span className="text-[10px] text-text-muted font-mono">
            {row.tracking_id}
          </span>
        </div>
      ),
    },
    {
      key: "courier",
      header: isBn ? "কুরিয়ার পার্টনার" : "Courier Partner",
      sortable: true,
      cell: (row: any) => (
        <span className="text-xs font-semibold text-text flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-primary-600" />
          {row.courier_name}
        </span>
      ),
    },
    {
      key: "order",
      header: isBn ? "অর্ডার রেফারেন্স" : "Order Reference",
      cell: (row: any) => (
        <span className="text-xs font-mono font-bold text-text">
          {row.order_number || row.orders?.order_number || "ORD-2026"}
        </span>
      ),
    },
    {
      key: "cod",
      header: isBn ? "সিওডি বকেয়া" : "COD Receivable",
      sortable: true,
      cell: (row: any) => (
        <span className="text-xs font-extrabold text-text">
          {formatPrice(row.cod_amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: isBn ? "স্ট্যাটাস" : "Status",
      cell: (row: any) => (
        <span className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-[10px] font-bold uppercase border border-blue-200">
          {row.delivery_status}
        </span>
      ),
    },
    {
      key: "booked",
      header: isBn ? "ডিসপ্যাচ সময়" : "Dispatched",
      sortable: true,
      cell: (row: any) => (
        <span className="text-xs text-text-muted">
          {new Date(row.booked_at).toLocaleDateString(isBn ? "bn-BD" : "en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">
            {isBn ? "ডেলিভারি পার্টনার ও লজিস্টিকস" : "Delivery Partners & Logistics"}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            {isBn
              ? "স্টিডফাস্ট, পাঠাও এবং রেডএক্স কুরিয়ার ইন্টিগ্রেশন পরিচালনা করুন এবং লাইভ পার্সেল মনিটর করুন।"
              : "Manage SteadFast, Pathao, and RedX courier integrations and monitor live consignments."}
          </p>
        </div>
      </div>

      {/* Couriers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {couriers.map((courier) => (
          <div
            key={courier.id}
            className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-4 relative"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text">{courier.name}</h3>
                  <span
                    className={`inline-block rounded-full px-2 py-0.2 text-[10px] font-bold uppercase ${
                      courier.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {courier.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-border pt-3">
              <div>
                <span className="text-text-muted block text-[11px]">{isBn ? "মোট পার্সেল" : "Total Shipments"}</span>
                <strong className="text-text font-bold text-sm">
                  {courier.shipments_count ?? 0}
                </strong>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">{isBn ? "সফলতার হার" : "Success Rate"}</span>
                <strong className="text-emerald-700 font-bold text-sm">
                  {courier.success_rate || "N/A"}
                </strong>
              </div>
            </div>

            <div className="pt-2 border-t border-dashed border-border flex items-center justify-between text-xs">
              <span className="text-text-muted">{isBn ? "অটো-বুকিং:" : "Auto-Booking:"}</span>
              <span className="font-semibold text-text">
                {courier.config?.auto_booking
                  ? (isBn ? "সক্রিয়" : "Enabled")
                  : (isBn ? "ম্যানুয়াল ডিসপ্যাচ" : "Manual Dispatch")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Shipments Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-text">
            {isBn ? "চলমান কুরিয়ার পার্সেল তালিকা" : "Active Courier Consignments"}
          </h2>
          <span className="text-xs text-text-muted font-semibold">
            {isBn ? "রিয়েল-টাইম ডেলিভারি সিঙ্ক" : "Real-time delivery synchronization"}
          </span>
        </div>

        <DataTable
          columns={shipmentColumns}
          data={shipments}
          searchKey="consignment_id"
          searchPlaceholder={isBn ? "কনসাইনমেন্ট আইডি খুঁজুন..." : "Search consignment ID..."}
          emptyMessage={isBn ? "কোন সক্রিয় কুরিয়ার পার্সেল পাওয়া যায়নি।" : "No active courier shipments found."}
        />
      </div>
    </div>
  );
}
