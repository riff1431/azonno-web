"use client";

import { useState, useEffect } from "react";
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  Sliders,
  X,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { DataTable, RowActions, RowAction, type Column } from "@/components/admin/data-table";
import { getInventory, adjustStock, getInventoryMovements } from "@/features/inventory/actions";
import { cn } from "@/lib/utils";
import { useAdminLang } from "@/lib/admin-lang-context";

interface InventoryRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  on_hand: number;
  reserved: number;
  available: number;
  sold: number;
  returned: number;
  damaged: number;
  incoming: number;
  low_stock_threshold: number;
  updated_at: string;
  products: {
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    regular_price: number;
  } | null;
  product_variants: {
    id: string;
    sku: string | null;
    regular_price: number;
  } | null;
}

interface MovementRow {
  id: string;
  type: string;
  quantity_change: number;
  notes: string | null;
  created_at: string;
  products: { name: string; sku: string | null } | null;
  profiles: { full_name: string; email: string } | null;
}

export default function InventoryListClient() {
  const { t } = useAdminLang();
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");

  // Adjustment Modal
  const [adjustTarget, setAdjustTarget] = useState<InventoryRow | null>(null);
  const [adjustType, setAdjustType] = useState<"purchase" | "adjustment" | "damage" | "return" | "manual">("adjustment");
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  // Movements Modal
  const [movementsTarget, setMovementsTarget] = useState<InventoryRow | null>(null);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    const data = await getInventory({
      stock_status: statusFilter === "all" ? undefined : statusFilter,
    });
    setInventory(data as unknown as InventoryRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, [statusFilter]);

  const handleAdjustSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adjustTarget || adjustQty === 0) return;
    setAdjusting(true);
    setAdjustError("");

    const res = await adjustStock({
      inventory_id: adjustTarget.id,
      type: adjustType,
      quantity_change: adjustQty,
      notes: adjustNotes || undefined,
    });

    if (res.error) {
      setAdjustError(res.error);
      setAdjusting(false);
      return;
    }

    setAdjusting(false);
    setAdjustTarget(null);
    setAdjustQty(0);
    setAdjustNotes("");
    fetchInventory();
  };

  const openMovements = async (row: InventoryRow) => {
    setMovementsTarget(row);
    setLoadingMovements(true);
    const moves = await getInventoryMovements(row.id);
    setMovements(moves as unknown as MovementRow[]);
    setLoadingMovements(false);
  };

  // Metrics
  const totalOnHand = inventory.reduce((sum, item) => sum + item.on_hand, 0);
  const lowStockCount = inventory.filter((item) => item.available > 0 && item.available <= (item.low_stock_threshold || 5)).length;
  const outOfStockCount = inventory.filter((item) => item.available <= 0).length;

  const columns: Column<InventoryRow>[] = [
    {
      key: "product",
      header: t("column_product"),
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-secondary text-text-muted">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-text">{row.products?.name || "Unnamed Product"}</p>
            <p className="text-xs text-text-muted">
              SKU: {row.product_variants?.sku || row.products?.sku || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "on_hand",
      header: t("column_on_hand"),
      sortable: true,
      cell: (row) => <span className="font-medium text-text">{row.on_hand}</span>,
    },
    {
      key: "reserved",
      header: t("column_reserved"),
      sortable: true,
      cell: (row) => <span className="text-text-secondary">{row.reserved}</span>,
    },
    {
      key: "available",
      header: t("column_available"),
      sortable: true,
      cell: (row) => {
        const isOut = row.available <= 0;
        const isLow = row.available > 0 && row.available <= (row.low_stock_threshold || 5);
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              isOut
                ? "bg-red-50 text-red-700 border border-red-200"
                : isLow
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            )}
          >
            {isOut ? <XCircle className="h-3 w-3" /> : isLow ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            {row.available} units
          </span>
        );
      },
    },
    {
      key: "damaged",
      header: t("damage"),
      cell: (row) => (
        <span className={cn(row.damaged > 0 ? "text-red-600 font-medium" : "text-text-muted")}>
          {row.damaged}
        </span>
      ),
    },
    {
      key: "sold",
      header: t("column_orders_count"),
      cell: (row) => <span className="text-text-secondary">{row.sold}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">{t("inventory_management")}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {t("inventory_desc")}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">{t("column_on_hand")}</span>
            <Boxes className="h-5 w-5 text-primary-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text">{totalOnHand}</p>
          <span className="text-xs text-text-muted">{t("column_available")}</span>
        </div>

        <div className="rounded-xl border border-border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">{t("filter_low_stock")}</span>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{lowStockCount}</p>
          <span className="text-xs text-text-muted">{t("column_threshold")}</span>
        </div>

        <div className="rounded-xl border border-border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">{t("filter_out_of_stock")}</span>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-red-600">{outOfStockCount}</p>
          <span className="text-xs text-text-muted">{t("filter_out_of_stock")}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={statusFilter === "all" ? "default" : "outline"}
          onClick={() => setStatusFilter("all")}
        >
          {t("filter_all")}
        </Button>
        <Button
          size="sm"
          variant={statusFilter === "in_stock" ? "default" : "outline"}
          onClick={() => setStatusFilter("in_stock")}
        >
          {t("filter_in_stock")}
        </Button>
        <Button
          size="sm"
          variant={statusFilter === "low_stock" ? "default" : "outline"}
          onClick={() => setStatusFilter("low_stock")}
        >
          {t("filter_low_stock")}
        </Button>
        <Button
          size="sm"
          variant={statusFilter === "out_of_stock" ? "default" : "outline"}
          onClick={() => setStatusFilter("out_of_stock")}
        >
          {t("filter_out_of_stock")}
        </Button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={inventory}
        loading={loading}
        searchPlaceholder={t("search_inventory")}
        getRowId={(row) => row.id}
        emptyMessage={t("no_inventory")}
        emptyIcon={<Boxes className="h-6 w-6" />}
        actions={(row) => (
          <RowActions>
            <RowAction onClick={() => { setAdjustTarget(row); setAdjustQty(0); setAdjustError(""); }}>
              <Sliders className="h-3.5 w-3.5" /> {t("adjust_stock")}
            </RowAction>
            <RowAction onClick={() => openMovements(row)}>
              <History className="h-3.5 w-3.5" /> {t("stock_history")}
            </RowAction>
          </RowActions>
        )}
      />

      {/* Stock Adjustment Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">Adjust Stock Level</h2>
              <button
                onClick={() => setAdjustTarget(null)}
                className="rounded-lg p-1 text-text-muted hover:bg-surface-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-text-secondary">
              Adjusting stock for <span className="font-semibold text-text">{adjustTarget.products?.name}</span>
            </p>

            <div className="rounded-lg bg-surface-secondary p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Current On Hand:</span>
                <span className="font-semibold text-text">{adjustTarget.on_hand}</span>
              </div>
              <div className="flex justify-between">
                <span>Currently Available:</span>
                <span className="font-semibold text-emerald-600">{adjustTarget.available}</span>
              </div>
            </div>

            {adjustError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as typeof adjustType)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                >
                  <option value="adjustment">Inventory Adjustment</option>
                  <option value="purchase">New Stock Purchase (+)</option>
                  <option value="return">Customer Return (+)</option>
                  <option value="damage">Damaged Goods (-)</option>
                  <option value="manual">Manual Correction</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Quantity Change (+ or -)</Label>
                <Input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  placeholder="e.g. +10 or -5"
                  required
                />
                <p className="text-xs text-text-muted">
                  Use positive numbers to add stock, negative to reduce.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Notes / Reason</Label>
                <Input
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g., Supplier batch #402 receive"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAdjustTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={adjusting}>
                  {adjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Adjustment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movements Ledger Modal */}
      {movementsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-white p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text">Stock Movement Ledger</h2>
                <p className="text-xs text-text-secondary">
                  Audit trail for {movementsTarget.products?.name}
                </p>
              </div>
              <button
                onClick={() => setMovementsTarget(null)}
                className="rounded-lg p-1 text-text-muted hover:bg-surface-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingMovements ? (
                <div className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-text-muted" />
                  <p className="mt-2 text-xs text-text-muted">Loading movements...</p>
                </div>
              ) : movements.length === 0 ? (
                <div className="py-12 text-center text-sm text-text-muted">
                  No movement logs recorded yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-surface-secondary text-text-muted">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Change</th>
                      <th className="px-3 py-2">Notes</th>
                      <th className="px-3 py-2">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-surface-secondary/50">
                        <td className="px-3 py-2 text-text-muted">
                          {new Date(m.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 capitalize font-medium text-text">
                          {m.type}
                        </td>
                        <td className="px-3 py-2 font-semibold">
                          <span
                            className={cn(
                              "inline-flex items-center gap-0.5",
                              m.quantity_change > 0 ? "text-emerald-600" : "text-red-600"
                            )}
                          >
                            {m.quantity_change > 0 ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            )}
                            {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-text-secondary">{m.notes || "—"}</td>
                        <td className="px-3 py-2 text-text-muted">
                          {m.profiles?.full_name || m.profiles?.email || "System"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setMovementsTarget(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
