"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, X, ArrowUpDown, ArrowUp, ArrowDown,
  MoreHorizontal, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/shared/ui/input";
import { Button } from "@/components/shared/ui/button";
import { useAdminLang } from "@/lib/admin-lang-context";

// --- Types ---

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  cell: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchKey?: keyof T;
  onSearch?: (query: string) => void;
  pageSize?: number;
  actions?: (row: T) => React.ReactNode;
  bulkActions?: React.ReactNode | ((selectedIds: string[], clearSelection: () => void) => React.ReactNode);
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
  getRowId?: (row: T) => string;
}

// --- Component ---

export function DataTable<T>({
  columns,
  data,
  loading = false,
  searchPlaceholder = "Search...",
  searchKey,
  onSearch,
  pageSize = 20,
  actions,
  bulkActions,
  emptyMessage = "No results found.",
  emptyIcon,
  headerActions,
  getRowId,
}: DataTableProps<T>) {
  const { t } = useAdminLang();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Search filter
  const filtered = useMemo(() => {
    if (!search || !searchKey) return data;
    const q = search.toLowerCase().trim();
    const cleanQ = q.replace(/^#/, "");
    return data.filter((row) => {
      const val = row[searchKey];
      if (typeof val === "string" && val.toLowerCase().includes(q)) return true;
      const anyRow = row as Record<string, unknown>;
      if (typeof anyRow.sku === "string") {
        const skuStr = anyRow.sku.toLowerCase();
        if (skuStr === cleanQ || skuStr.includes(cleanQ)) return true;
      }
      return false;
    });
  }, [data, search, searchKey]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleAll = () => {
    if (!getRowId) return;
    if (selected.size === paged.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map(getRowId)));
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
    onSearch?.(value);
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3.5 w-3.5 text-text-muted" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
    );
  };

  return (
    <div className="rounded-xl border border-border bg-white shadow-card">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 pr-8 h-9 w-full"
            />
            {search && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {selected.size > 0 && bulkActions && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-secondary bg-surface-secondary px-2 py-1 rounded-md border border-border">
                {selected.size} {t("results")}
              </span>
              {typeof bulkActions === "function" ? bulkActions(Array.from(selected), () => setSelected(new Set())) : bulkActions}
            </div>
          )}
        </div>
        {headerActions && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">{headerActions}</div>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              {getRowId && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selected.size === paged.length}
                    onChange={toggleAll}
                    className="rounded border-border"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted",
                    col.sortable && "cursor-pointer select-none hover:text-text",
                    col.width
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && <SortIcon col={col.key} />}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="w-16 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                  {t("column_actions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (getRowId ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-text-muted" />
                  <p className="mt-2 text-sm text-text-muted">{t("loading")}</p>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (getRowId ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-12 text-center">
                  {emptyIcon && <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary text-text-muted">{emptyIcon}</div>}
                  <p className="text-sm text-text-muted">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => {
                const rowId = getRowId?.(row) ?? String(idx);
                return (
                  <tr
                    key={rowId}
                    className={cn(
                      "transition-colors hover:bg-surface-secondary/50",
                      selected.has(rowId) && "bg-primary-50"
                    )}
                  >
                    {getRowId && (
                      <td className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(rowId)}
                          onChange={() => toggleRow(rowId)}
                          className="rounded border-border"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-text">
                        {col.cell(row)}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3 text-right">
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="text-xs text-text-muted text-center sm:text-left">
          {sorted.length === 0
            ? t("no_data")
            : `${t("showing")} ${page * pageSize + 1}–${Math.min((page + 1) * pageSize, sorted.length)} ${t("of")} ${sorted.length}`}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => setPage(0)} disabled={page === 0}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 text-xs text-text-secondary font-medium">
            {page + 1} / {totalPages}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Row Action Dropdown ---

export function RowActions({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = React.useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 150;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const right = Math.max(12, window.innerWidth - rect.right);

    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      // Flip upward
      setCoords({
        bottom: window.innerHeight - rect.top + 6,
        right,
      });
    } else {
      // Open downward
      setCoords({
        top: rect.bottom + 6,
        right,
      });
    }
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) {
      updatePosition();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  React.useEffect(() => {
    if (!open) return;

    const handleScrollOrResize = () => {
      setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          "rounded-lg p-1.5 text-text-muted hover:bg-surface-secondary hover:text-text transition-colors focus:outline-none",
          open && "bg-surface-secondary text-text ring-2 ring-primary-500/20"
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && mounted && typeof document !== "undefined" &&
        ReactPortalWrapper(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[9998] bg-black/10 sm:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            />

            {/* Dropdown Menu (Portal into body) */}
            <div
              style={{
                position: "fixed",
                ...(coords?.top !== undefined ? { top: `${coords.top}px` } : {}),
                ...(coords?.bottom !== undefined ? { bottom: `${coords.bottom}px` } : {}),
                right: `${coords?.right ?? 16}px`,
              }}
              onClick={(e) => e.stopPropagation()}
              className="z-[9999] min-w-44 max-w-[calc(100vw-24px)] rounded-xl border border-border bg-white p-1.5 shadow-dropdown animate-in fade-in-0 zoom-in-95 duration-100 ring-1 ring-black/5"
            >
              {React.Children.map(children, (child) =>
                React.isValidElement(child)
                  ? React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
                      onClick: () => {
                        setOpen(false);
                        (child.props as { onClick?: () => void }).onClick?.();
                      },
                    })
                  : child
              )}
            </div>
          </>
        )}
    </div>
  );
}

function ReactPortalWrapper(children: React.ReactNode) {
  if (typeof document === "undefined") return null;
  const { createPortal } = require("react-dom");
  return createPortal(children, document.body);
}

export function RowAction({
  children,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors select-none",
        variant === "danger"
          ? "text-red-600 hover:bg-red-50 active:bg-red-100"
          : "text-text hover:bg-surface-secondary active:bg-surface-tertiary"
      )}
    >
      {children}
    </button>
  );
}
