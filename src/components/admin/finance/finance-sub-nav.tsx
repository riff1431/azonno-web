"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Landmark,
  Truck,
  Users,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FINANCE_NAV_ITEMS = [
  {
    href: "/admin/finance/sales",
    labelBn: "বিক্রয় রিপোর্ট",
    labelEn: "Sales & Revenue",
    icon: BarChart3,
  },
  {
    href: "/admin/finance/pnl",
    labelBn: "লাভ-ক্ষতি (P&L)",
    labelEn: "Profit & Loss",
    icon: TrendingUp,
  },
  {
    href: "/admin/finance/costs",
    labelBn: "খরচ (Expenses)",
    labelEn: "Expenses & OPEX",
    icon: Receipt,
  },
  {
    href: "/admin/finance/accounting",
    labelBn: "হিসাব (Accounts)",
    labelEn: "Bank & MFS Ledger",
    icon: Landmark,
  },
  {
    href: "/admin/finance/suppliers",
    labelBn: "সাপ্লায়ার",
    labelEn: "Suppliers & POs",
    icon: Building2,
  },
  {
    href: "/admin/finance/dues",
    labelBn: "বকেয়া ম্যানেজার",
    labelEn: "Dues & Remittance",
    icon: Truck,
  },
  {
    href: "/admin/finance/investors",
    labelBn: "বিনিয়োগকারী",
    labelEn: "Investors & Equity",
    icon: Users,
  },
];

export function FinanceSubNav() {
  const pathname = usePathname();

  return (
    <div className="w-full bg-white border-b border-border/80 sticky top-0 z-20 backdrop-blur-md bg-white/95 px-1 py-1.5 -mt-2 mb-6">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-0.5">
        {FINANCE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin/finance/sales" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border shrink-0 select-none",
                isActive
                  ? "bg-[#e91e63] text-white border-[#e91e63] shadow-xs shadow-pink-500/20"
                  : "bg-surface-secondary/40 text-text-secondary border-transparent hover:border-border hover:bg-surface-secondary hover:text-text"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-white" : "text-text-muted")} />
              <span>{item.labelBn}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
