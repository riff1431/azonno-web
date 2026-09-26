"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar,
  Download,
  Printer,
  Package,
  Truck,
  MessageSquare,
  Box,
  Plane,
  Building,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { FinanceSubNav } from "@/components/admin/finance/finance-sub-nav";
import { getDetailedPnL, type DetailedPnLData } from "@/features/finance/actions";

interface PnLClientProps {
  initialData: DetailedPnLData;
}

export function PnLClient({ initialData }: PnLClientProps) {
  const [data, setData] = useState<DetailedPnLData>(initialData);
  const [dateRange, setDateRange] = useState<string>(initialData.dateRange || "all");
  const [loading, setLoading] = useState(false);

  const handleRangeChange = async (range: string) => {
    setDateRange(range);
    setLoading(true);
    try {
      const res = await getDetailedPnL(range);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch P&L data for range:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <FinanceSubNav />

      {/* Header with Date Range Filter & Print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Profit & Loss (P&L) Statement</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Real-time gross margins, product procurement costs (COGS), operational expenses, and net profit.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl border border-border bg-surface-secondary/50 p-1 text-xs font-semibold">
            {[
              { id: "all", label: "All Time" },
              { id: "this_month", label: "This Month" },
              { id: "7d", label: "Last 7 Days" },
              { id: "today", label: "Today" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleRangeChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  dateRange === tab.id
                    ? "bg-white text-text font-bold shadow-xs border border-border/80"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5 h-8 cursor-pointer shrink-0"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print P&L</span>
          </Button>
        </div>
      </div>

      {/* 4 Core Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium">Gross Revenue</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-text">{formatPrice(data.grossRevenue)}</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {data.orderCount} Orders Invoiced
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium">Cost of Goods (COGS)</span>
            <div className="h-7 w-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-red-600">-{formatPrice(data.cogsTotal)}</p>
          <span className="text-[11px] text-text-muted">Procurement & Product Landing</span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium">Gross Profit</span>
            <div className="h-7 w-7 rounded-lg bg-teal-50/60 text-[#1D6474] flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-text">{formatPrice(data.grossProfit)}</p>
          <span className="text-[11px] text-[#1D6474] font-bold">
            {data.grossMarginPct}% Gross Margin
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Net Profit (EBITDA)</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{formatPrice(data.netProfit)}</p>
          <span className="text-[11px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-300 inline-block shadow-2xs">
            {data.netMarginPct}% Net Margin
          </span>
        </div>
      </div>

      {/* Detailed P&L Financial Statement Breakdown */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-bold text-text">
            Detailed Financial Statement Breakdown
          </h2>
          {loading && (
            <span className="text-xs text-text-muted flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#1D6474]" /> Recalculating...
            </span>
          )}
        </div>

        <div className="divide-y divide-border text-xs">
          {/* 1. Operating Revenue */}
          <div className="py-3 flex justify-between font-bold text-text text-sm bg-surface-secondary/40 px-3 rounded-xl">
            <span>1. Operating Revenue</span>
            <span className="font-mono">{formatPrice(data.grossRevenue)}</span>
          </div>

          <div className="py-2.5 flex justify-between text-text-secondary pl-6 pr-3">
            <span>Product Sales Gross Subtotal</span>
            <span className="font-mono">{formatPrice(data.productSalesSubtotal)}</span>
          </div>

          <div className="py-2.5 flex justify-between text-text-secondary pl-6 pr-3">
            <span>Delivery Fees Collected from Buyers</span>
            <span className="font-mono">{formatPrice(data.deliveryCollected)}</span>
          </div>

          {data.discountsTotal > 0 && (
            <div className="py-2.5 flex justify-between text-emerald-600 pl-6 pr-3 font-semibold">
              <span>Promo Discounts & Vouchers Subsidized</span>
              <span className="font-mono">-{formatPrice(data.discountsTotal)}</span>
            </div>
          )}

          {/* 2. Cost of Sales (COGS) */}
          <div className="py-3 flex justify-between font-bold text-red-600 text-sm bg-red-50/50 px-3 rounded-xl mt-2">
            <span>2. Cost of Sales (COGS)</span>
            <span className="font-mono">-{formatPrice(data.cogsTotal)}</span>
          </div>

          <div className="py-2.5 flex justify-between text-text-secondary pl-6 pr-3">
            <span>Direct Product Sourcing & Wholesale Landed Cost (55%)</span>
            <span className="font-mono">-{formatPrice(data.cogsTotal)}</span>
          </div>

          {/* Gross Operating Profit */}
          <div className="py-3 flex justify-between font-extrabold text-sm text-text bg-surface-secondary/70 px-3 rounded-xl my-2 border border-border">
            <span>Gross Operating Profit</span>
            <span className="font-mono">{formatPrice(data.grossProfit)}</span>
          </div>

          {/* 3. Operating & Marketing Expenses (OPEX) */}
          <div className="py-3 flex justify-between font-bold text-red-600 text-sm bg-red-50/50 px-3 rounded-xl mt-2">
            <span>3. Operating & Marketing Expenses (OPEX)</span>
            <span className="font-mono">-{formatPrice(data.expensesTotal)}</span>
          </div>

          <div className="py-2.5 flex justify-between text-text-secondary pl-6 pr-3">
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-text-muted" />
              Courier Dispatch & Shipping Carrier Charges (SteadFast / Pathao)
            </span>
            <span className="font-mono">-{formatPrice(data.shippingCarrierExpenses)}</span>
          </div>

          <div className="py-2.5 flex justify-between text-text-secondary pl-6 pr-3">
            <span className="flex items-center gap-1.5">
              <Plane className="h-3.5 w-3.5 text-text-muted" />
              Air Freight & Customs Import Clearance
            </span>
            <span className="font-mono">-{formatPrice(data.freightAndCustomsExpenses)}</span>
          </div>

          <div className="py-2.5 flex justify-between text-text-secondary pl-6 pr-3">
            <span className="flex items-center gap-1.5">
              <Box className="h-3.5 w-3.5 text-text-muted" />
              Packaging Materials (Branded Mailers, Bubble Wrap, Tape)
            </span>
            <span className="font-mono">-{formatPrice(data.packagingExpenses)}</span>
          </div>

          <div className="py-2.5 flex justify-between text-text-secondary pl-6 pr-3">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-text-muted" />
              SMS Gateway & Marketing Ad Spend (Meta / TikTok / SMS)
            </span>
            <span className="font-mono">-{formatPrice(data.smsAndMarketingExpenses)}</span>
          </div>

          {data.otherOperatingExpenses > 0 && (
            <div className="py-2.5 flex justify-between text-text-secondary pl-6 pr-3">
              <span className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-text-muted" />
                Office Utilities, Cloud Infrastructure & Operations
              </span>
              <span className="font-mono">-{formatPrice(data.otherOperatingExpenses)}</span>
            </div>
          )}

          {/* Final EBITDA Net Income */}
          <div className="py-3.5 flex justify-between font-extrabold text-base text-emerald-800 bg-emerald-100/90 px-4 rounded-xl border border-emerald-300 mt-3 shadow-xs">
            <span>Net Operating Income (EBITDA)</span>
            <span className="font-mono text-lg">{formatPrice(data.netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
