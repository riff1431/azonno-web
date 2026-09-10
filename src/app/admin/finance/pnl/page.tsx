import { getDetailedPnL } from "@/features/finance/actions";
import { PnLClient } from "./pnl-client";

export const metadata = {
  title: "Profit & Loss (P&L) — Finance",
  description: "Live real-time profit and loss statement with dynamic COGS, operational expenses, courier fees, and gross margins.",
};

export default async function AdminFinancePnlPage() {
  const pnlData = await getDetailedPnL("all");

  return <PnLClient initialData={pnlData} />;
}
