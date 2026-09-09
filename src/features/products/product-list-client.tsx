"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Archive,
  Eye,
  Truck,
  Filter,
  RotateCcw,
  Sparkles,
  Boxes,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileEdit,
  Layers,
  Tag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { DataTable, RowActions, RowAction, type Column } from "@/components/admin/data-table";
import { getProducts, deleteProduct, bulkUpdateProductStatus } from "@/features/products/actions";
import { getBrands } from "@/features/brands/actions";
import { getCategories } from "@/features/categories/actions";
import { formatPrice, cn, formatShortProductId } from "@/lib/utils";
import { useAdminLang } from "@/lib/admin-lang-context";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  product_type: string;
  status: string;
  regular_price: number;
  sale_price: number | null;
  is_featured: boolean;
  shipping_class?: string | null;
  created_at: string;
  brand_id?: string | null;
  brands: { id?: string; name: string } | null;
  product_categories?: Array<{ category_id: string; categories: { id: string; name: string } | null }>;
  inventory: Array<{ on_hand: number; available: number }>;
}

interface BrandOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

export default function ProductListClient() {
  const router = useRouter();
  const { t } = useAdminLang();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "archived">("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "simple" | "variable">("all");
  const [featureFilter, setFeatureFilter] = useState<"all" | "free_shipping" | "featured">("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, brandsData, categoriesData] = await Promise.all([
        getProducts(),
        getBrands().catch(() => []),
        getCategories().catch(() => []),
      ]);
      setProducts((productsData || []) as ProductRow[]);
      if (Array.isArray(brandsData)) {
        setBrands(brandsData.map((b) => ({ id: b.id, name: b.name })));
      }
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData.map((c) => ({ id: c.id, name: c.name })));
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStock = (inv: Array<{ on_hand: number; available: number }>) => {
    if (!inv || inv.length === 0) return { on_hand: 0, available: 0 };
    return inv.reduce(
      (acc, i) => ({
        on_hand: acc.on_hand + (i.on_hand || 0),
        available: acc.available + (i.available || 0),
      }),
      { on_hand: 0, available: 0 }
    );
  };

  // Status Counts
  const counts = useMemo(() => {
    const total = products.length;
    let active = 0;
    let draft = 0;
    let archived = 0;

    for (const p of products) {
      if (p.status === "active") active++;
      else if (p.status === "draft") draft++;
      else if (p.status === "archived") archived++;
    }

    return { total, active, draft, archived };
  }, [products]);

  // Active Filters Count (excluding status tabs)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (stockFilter !== "all") count++;
    if (brandFilter !== "all") count++;
    if (categoryFilter !== "all") count++;
    if (typeFilter !== "all") count++;
    if (featureFilter !== "all") count++;
    return count;
  }, [stockFilter, brandFilter, categoryFilter, typeFilter, featureFilter]);

  const resetAllFilters = () => {
    setStatusFilter("all");
    setStockFilter("all");
    setBrandFilter("all");
    setCategoryFilter("all");
    setTypeFilter("all");
    setFeatureFilter("all");
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((row) => {
      // 1. Status Filter
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }

      // 2. Stock Filter
      if (stockFilter !== "all") {
        const stock = getStock(row.inventory);
        if (stockFilter === "in_stock" && stock.available <= 5) return false;
        if (stockFilter === "low_stock" && (stock.available <= 0 || stock.available > 5)) return false;
        if (stockFilter === "out_of_stock" && stock.available > 0) return false;
      }

      // 3. Brand Filter
      if (brandFilter !== "all") {
        const brandMatch =
          row.brand_id === brandFilter ||
          row.brands?.id === brandFilter ||
          row.brands?.name === brandFilter;
        if (!brandMatch) return false;
      }

      // 4. Category Filter
      if (categoryFilter !== "all") {
        const hasCategory = row.product_categories?.some(
          (pc) => pc.category_id === categoryFilter || pc.categories?.id === categoryFilter
        );
        if (!hasCategory) return false;
      }

      // 5. Product Type
      if (typeFilter !== "all" && row.product_type !== typeFilter) {
        return false;
      }

      // 6. Feature / Badges Filter
      if (featureFilter === "free_shipping" && row.shipping_class !== "free_shipping") {
        return false;
      }
      if (featureFilter === "featured" && !row.is_featured) {
        return false;
      }

      return true;
    });
  }, [products, statusFilter, stockFilter, brandFilter, categoryFilter, typeFilter, featureFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Archive "${name}"? This will soft-delete the product.`)) return;
    const result = await deleteProduct(id);
    if (result.error) {
      alert(result.error);
      return;
    }
    fetchData();
  };

  const handleBulkStatusChange = async (
    ids: string[],
    newStatus: string,
    clearSelection: () => void
  ) => {
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      const result = await bulkUpdateProductStatus(ids, newStatus);
      if (result.error) {
        alert(result.error);
      } else {
        clearSelection();
        await fetchData();
      }
    } catch (err) {
      console.error("Bulk update failed:", err);
    } finally {
      setBulkLoading(false);
    }
  };

  const columns: Column<ProductRow>[] = [
    {
      key: "sku",
      header: t("column_sku"),
      sortable: true,
      width: "110px",
      cell: (row) => (
        <span className="font-mono font-bold text-xs bg-surface-secondary border border-border px-2.5 py-1 rounded-md text-text inline-block">
          #{row.sku ? formatShortProductId(row.sku) : "—"}
        </span>
      ),
    },
    {
      key: "name",
      header: t("column_product"),
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-text-muted border border-border/60">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-text truncate max-w-xs">{row.name}</p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted mt-0.5">
              <span className="capitalize">{row.product_type}</span>
              {row.is_featured && (
                <span className="inline-flex items-center gap-0.5 rounded bg-yellow-50 border border-yellow-200 px-1.5 py-0.2 text-yellow-800 font-semibold text-[10px]">
                  <Sparkles className="h-2.5 w-2.5 text-yellow-600" /> {t("product_featured")}
                </span>
              )}
              {row.shipping_class === "free_shipping" && (
                <span className="inline-flex items-center gap-1 rounded bg-pink-50 border border-pink-200 px-1.5 py-0.2 text-[#e91e63] font-bold text-[10px]">
                  <Truck className="h-2.5 w-2.5" /> {t("product_free_shipping")}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "brand",
      header: t("column_brand"),
      cell: (row) => (
        <span className="text-text-secondary text-xs font-medium">
          {row.brands?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "regular_price",
      header: t("column_price"),
      sortable: true,
      cell: (row) => (
        <div>
          {row.sale_price ? (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-text text-sm">{formatPrice(row.sale_price)}</span>
              <span className="text-xs text-text-muted line-through">{formatPrice(row.regular_price)}</span>
            </div>
          ) : (
            <span className="font-semibold text-text text-sm">{formatPrice(row.regular_price)}</span>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: t("column_stock"),
      cell: (row) => {
        const stock = getStock(row.inventory);
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              stock.available > 5
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : stock.available > 0
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            )}
          >
            {stock.available > 5 ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : stock.available > 0 ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {stock.available} {t("available_stock")}
          </span>
        );
      },
    },
    {
      key: "status",
      header: t("column_status"),
      sortable: true,
      cell: (row) => (
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
            row.status === "active"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : row.status === "draft"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-gray-100 text-gray-700 border border-gray-200"
          )}
        >
          {row.status === "active"
            ? t("product_active")
            : row.status === "draft"
            ? t("product_draft")
            : row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight">{t("products")}</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            {t("product_list_desc")} ({products.length} {t("products")})
          </p>
        </div>
        <Link href="/admin/products/create">
          <Button className="shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" /> {t("add_product")}
          </Button>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={cn(
            "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none",
            statusFilter === "all"
              ? "bg-primary-600 text-white shadow-sm"
              : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary hover:text-text"
          )}
        >
          <span>{t("filter_all", "All Products")}</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[11px] font-bold",
              statusFilter === "all" ? "bg-white/25 text-white" : "bg-border text-text-muted"
            )}
          >
            {counts.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("active")}
          className={cn(
            "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none",
            statusFilter === "active"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-surface-secondary text-text-secondary hover:bg-emerald-50 hover:text-emerald-700"
          )}
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <span>{t("product_active", "Active")}</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[11px] font-bold",
              statusFilter === "active" ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-800"
            )}
          >
            {counts.active}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("draft")}
          className={cn(
            "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none",
            statusFilter === "draft"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-surface-secondary text-text-secondary hover:bg-amber-50 hover:text-amber-700"
          )}
        >
          <span className="flex h-2 w-2 rounded-full bg-amber-400" />
          <span>{t("product_draft", "Draft")}</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[11px] font-bold",
              statusFilter === "draft" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-800"
            )}
          >
            {counts.draft}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("archived")}
          className={cn(
            "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none",
            statusFilter === "archived"
              ? "bg-gray-700 text-white shadow-sm"
              : "bg-surface-secondary text-text-secondary hover:bg-gray-200 hover:text-gray-900"
          )}
        >
          <Archive className="h-3.5 w-3.5 opacity-70" />
          <span>{t("archive", "Archived")}</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[11px] font-bold",
              statusFilter === "archived" ? "bg-white/25 text-white" : "bg-gray-200 text-gray-700"
            )}
          >
            {counts.archived}
          </span>
        </button>
      </div>

      {/* Filter Options Bar */}
      <div className="bg-white rounded-xl border border-border p-3.5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-text">
              {t("filter", "Product Filters")}
            </span>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
                {activeFiltersCount} active
              </span>
            )}
          </div>

          {(activeFiltersCount > 0 || statusFilter !== "all") && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-red-600 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t("reset_filters", "Reset All Filters")}</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Stock Level Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1">
              <Boxes className="h-3 w-3" />
              <span>{t("column_stock", "Stock Status")}</span>
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full text-xs font-medium rounded-lg border border-border bg-surface-secondary/40 px-2.5 py-1.5 text-text focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
            >
              <option value="all">{t("filter_all_stock", "All Stock Levels")}</option>
              <option value="in_stock">{t("filter_in_stock", "In Stock (>5)")}</option>
              <option value="low_stock">{t("filter_low_stock", "Low Stock (1-5)")}</option>
              <option value="out_of_stock">{t("filter_out_of_stock", "Out of Stock (0)")}</option>
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>{t("column_brand", "Brand")}</span>
            </label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-border bg-surface-secondary/40 px-2.5 py-1.5 text-text focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
            >
              <option value="all">{t("filter_all_brands", "All Brands")}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1">
              <Layers className="h-3 w-3" />
              <span>{t("column_category", "Category")}</span>
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-border bg-surface-secondary/40 px-2.5 py-1.5 text-text focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
            >
              <option value="all">{t("filter_all_categories", "All Categories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span>{t("product_type", "Product Type")}</span>
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full text-xs font-medium rounded-lg border border-border bg-surface-secondary/40 px-2.5 py-1.5 text-text focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
            >
              <option value="all">{t("filter_all_types", "All Types")}</option>
              <option value="simple">Simple</option>
              <option value="variable">Variable</option>
            </select>
          </div>

          {/* Badges / Options Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>{t("filter_badges", "Features & Delivery")}</span>
            </label>
            <select
              value={featureFilter}
              onChange={(e) => setFeatureFilter(e.target.value as any)}
              className="w-full text-xs font-medium rounded-lg border border-border bg-surface-secondary/40 px-2.5 py-1.5 text-text focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
            >
              <option value="all">{t("filter_all_features", "All Features")}</option>
              <option value="free_shipping">{t("product_free_shipping", "Free Delivery")}</option>
              <option value="featured">{t("product_featured", "Featured Products")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        searchPlaceholder={t("search_products", "Search by name or SKU...")}
        searchKey="name"
        getRowId={(row) => row.id}
        emptyMessage={t("no_products", "No products match the selected filters.")}
        emptyIcon={<Package className="h-6 w-6" />}
        bulkActions={(selectedIds, clearSelection) => (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={bulkLoading}
              onClick={() => handleBulkStatusChange(selectedIds, "active", clearSelection)}
              className="h-8 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            >
              {bulkLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Eye className="h-3.5 w-3.5 mr-1" />
              )}
              {t("activate", "Activate")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkLoading}
              onClick={() => handleBulkStatusChange(selectedIds, "draft", clearSelection)}
              className="h-8 text-xs font-semibold text-amber-700 hover:bg-amber-50 hover:border-amber-300"
            >
              <FileEdit className="h-3.5 w-3.5 mr-1" />
              {t("product_draft", "Draft")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkLoading}
              onClick={() => handleBulkStatusChange(selectedIds, "archived", clearSelection)}
              className="h-8 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-300"
            >
              <Archive className="h-3.5 w-3.5 mr-1" />
              {t("archive", "Archive")}
            </Button>
          </div>
        )}
        actions={(row) => (
          <RowActions>
            <RowAction onClick={() => router.push(`/admin/products/${row.id}/edit`)}>
              <Pencil className="h-3.5 w-3.5 text-primary-600" /> {t("action_edit", "Edit Product")}
            </RowAction>
            <RowAction onClick={() => window.open(`/products/${row.slug}`, "_blank")}>
              <Eye className="h-3.5 w-3.5 text-blue-600" /> {t("action_view", "View on Storefront")}
            </RowAction>
            {row.status === "active" ? (
              <RowAction
                onClick={() =>
                  bulkUpdateProductStatus([row.id], "draft").then(() => fetchData())
                }
              >
                <FileEdit className="h-3.5 w-3.5 text-amber-600" /> {t("set_to_draft", "Move to Draft")}
              </RowAction>
            ) : (
              <RowAction
                onClick={() =>
                  bulkUpdateProductStatus([row.id], "active").then(() => fetchData())
                }
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {t("activate", "Activate Product")}
              </RowAction>
            )}
            <RowAction variant="danger" onClick={() => handleDelete(row.id, row.name)}>
              <Trash2 className="h-3.5 w-3.5" /> {t("archive", "Archive")}
            </RowAction>
          </RowActions>
        )}
      />
    </div>
  );
}
