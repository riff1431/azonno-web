"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Copy,
  Download,
  RefreshCw,
  MoreVertical,
  Check,
  X,
  ArrowUpDown,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { DataTable, RowActions, RowAction, type Column } from "@/components/admin/data-table";
import {
  getProducts,
  deleteProduct,
  restoreProduct,
  permanentDeleteProduct,
  bulkDeleteProducts,
  bulkUpdateProductStatus,
  duplicateProduct,
  quickUpdateProductStock,
  quickUpdateProductPrice,
} from "@/features/products/actions";
import { getBrands } from "@/features/brands/actions";
import { getCategories } from "@/features/categories/actions";
import { formatPrice, cn, formatShortProductId } from "@/lib/utils";
import { useAdminLang } from "@/lib/admin-lang-context";

interface ProductMediaItem {
  id?: string;
  is_primary?: boolean;
  display_order?: number;
  media?: {
    id?: string;
    url: string;
    thumbnail_url?: string;
    alt_text?: string;
  } | null;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  product_type: string;
  status: string;
  regular_price: number;
  sale_price: number | null;
  cost_price?: number | null;
  is_featured: boolean;
  shipping_class?: string | null;
  og_image_url?: string | null;
  created_at: string;
  deleted_at?: string | null;
  brand_id?: string | null;
  brands: { id?: string; name: string } | null;
  product_categories?: Array<{ category_id: string; categories: { id: string; name: string } | null }>;
  product_media?: ProductMediaItem[];
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
  const [actionMsg, setActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Quick edit modal state
  const [quickEditProduct, setQuickEditProduct] = useState<ProductRow | null>(null);
  const [quickStock, setQuickStock] = useState<number>(0);
  const [quickRegularPrice, setQuickRegularPrice] = useState<number>(0);
  const [quickSalePrice, setQuickSalePrice] = useState<string>("");
  const [quickSaving, setQuickSaving] = useState(false);

  // Delete confirm modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    productId?: string;
    productName?: string;
    isPermanent: boolean;
    isBulk: boolean;
    bulkIds?: string[];
    clearSelection?: () => void;
  }>({
    isOpen: false,
    isPermanent: false,
    isBulk: false,
  });

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

  const showNotification = (text: string, isError = false) => {
    setActionMsg({ text, isError });
    setTimeout(() => setActionMsg(null), 4000);
  };

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

  const getThumbnail = (product: ProductRow) => {
    if (product.og_image_url) return product.og_image_url;
    if (product.product_media && product.product_media.length > 0) {
      const primary = product.product_media.find((pm) => pm.is_primary);
      const first = primary || product.product_media[0];
      return first?.media?.thumbnail_url || first?.media?.url || null;
    }
    return null;
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

  // Active Filters Count
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

  // Quick Duplicate Handler
  const handleDuplicate = async (id: string, name: string) => {
    setBulkLoading(true);
    try {
      const res = await duplicateProduct(id);
      if (res.error) {
        showNotification(res.error, true);
      } else {
        showNotification(`Duplicated "${name}" successfully as draft copy!`);
        await fetchData();
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to duplicate product", true);
    } finally {
      setBulkLoading(false);
    }
  };

  // Quick Stock & Price Save
  const handleSaveQuickEdit = async () => {
    if (!quickEditProduct) return;
    setQuickSaving(true);
    try {
      const saleVal = quickSalePrice.trim() !== "" ? Number(quickSalePrice) : null;
      await Promise.all([
        quickUpdateProductStock(quickEditProduct.id, quickStock),
        quickUpdateProductPrice(quickEditProduct.id, quickRegularPrice, saleVal),
      ]);
      showNotification(`Updated stock & pricing for "${quickEditProduct.name}"!`);
      setQuickEditProduct(null);
      await fetchData();
    } catch (err: any) {
      showNotification(err.message || "Failed to save quick updates", true);
    } finally {
      setQuickSaving(false);
    }
  };

  // Confirmed Delete / Restore Execution
  const executeDeleteAction = async () => {
    const { isBulk, isPermanent, productId, bulkIds, clearSelection } = deleteConfirm;
    setBulkLoading(true);

    try {
      if (isBulk && bulkIds && bulkIds.length > 0) {
        const res = await bulkDeleteProducts(bulkIds, isPermanent);
        if (res.error) {
          showNotification(res.error, true);
        } else {
          showNotification(
            isPermanent
              ? `Permanently deleted ${bulkIds.length} products!`
              : `Archived ${bulkIds.length} products!`
          );
          if (clearSelection) clearSelection();
          await fetchData();
        }
      } else if (productId) {
        const res = isPermanent
          ? await permanentDeleteProduct(productId)
          : await deleteProduct(productId);

        if (res.error) {
          showNotification(res.error, true);
        } else {
          showNotification(
            isPermanent ? "Product permanently removed!" : "Product archived successfully!"
          );
          await fetchData();
        }
      }
    } catch (err: any) {
      showNotification(err.message || "Action failed", true);
    } finally {
      setBulkLoading(false);
      setDeleteConfirm({ isOpen: false, isPermanent: false, isBulk: false });
    }
  };

  // Restore Action
  const handleRestore = async (id: string, name: string) => {
    setBulkLoading(true);
    try {
      const res = await restoreProduct(id);
      if (res.error) {
        showNotification(res.error, true);
      } else {
        showNotification(`Restored "${name}" back to Drafts!`);
        await fetchData();
      }
    } catch (err: any) {
      showNotification(err.message || "Restore failed", true);
    } finally {
      setBulkLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredProducts.length === 0) {
      showNotification("No products to export", true);
      return;
    }

    const headers = ["ID", "SKU", "Name", "Brand", "Categories", "Regular Price", "Sale Price", "Stock", "Status", "Created At"];
    const rows = filteredProducts.map((p) => [
      `"${p.id}"`,
      `"${p.sku || ""}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.brands?.name || ""}"`,
      `"${(p.product_categories || []).map((c) => c.categories?.name).filter(Boolean).join("; ")}"`,
      p.regular_price,
      p.sale_price || "",
      getStock(p.inventory).available,
      `"${p.status}"`,
      `"${new Date(p.created_at).toISOString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `blush_budget_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`Exported ${filteredProducts.length} products to CSV!`);
  };

  const columns: Column<ProductRow>[] = [
    {
      key: "sku",
      header: t("column_sku"),
      sortable: true,
      width: "105px",
      cell: (row) => (
        <span className="font-mono font-bold text-xs bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg text-gray-800 inline-block shadow-2xs">
          #{row.sku ? formatShortProductId(row.sku) : "—"}
        </span>
      ),
    },
    {
      key: "name",
      header: t("column_product"),
      sortable: true,
      cell: (row) => {
        const thumb = getThumbnail(row);
        return (
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 border border-gray-200/80 overflow-hidden shadow-2xs group">
              {thumb ? (
                <Image
                  src={thumb}
                  alt={row.name}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <Package className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/admin/products/${row.id}/edit`}
                className="font-bold text-xs md:text-sm text-gray-900 hover:text-[#e91e63] truncate block max-w-xs transition-colors"
              >
                {row.name}
              </Link>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                <span className="capitalize text-[11px] font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                  {row.product_type}
                </span>
                {row.is_featured && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-yellow-50 border border-yellow-200 px-1.5 py-0.2 text-yellow-800 font-bold text-[10px]">
                    <Sparkles className="h-2.5 w-2.5 text-yellow-600" /> {t("product_featured", "Featured")}
                  </span>
                )}
                {row.shipping_class === "free_shipping" && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-pink-50 border border-pink-200 px-1.5 py-0.2 text-[#e91e63] font-bold text-[10px]">
                    <Truck className="h-2.5 w-2.5" /> {t("product_free_shipping", "Free Delivery")}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "brand",
      header: t("column_brand"),
      cell: (row) => (
        <span className="text-gray-700 text-xs font-bold bg-gray-50 px-2 py-1 rounded-md border border-gray-200/60 inline-block">
          {row.brands?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "category",
      header: t("column_category", "Category"),
      cell: (row) => {
        const catList = row.product_categories || [];
        if (catList.length === 0) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <div className="flex flex-wrap gap-1 max-w-[140px]">
            {catList.slice(0, 2).map((c, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold bg-pink-50 text-[#e91e63] px-1.5 py-0.5 rounded-md border border-pink-100 truncate"
              >
                {c.categories?.name || "Category"}
              </span>
            ))}
            {catList.length > 2 && (
              <span className="text-[10px] text-gray-500 font-bold">+{catList.length - 2}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "regular_price",
      header: t("column_price"),
      sortable: true,
      cell: (row) => (
        <div>
          {row.sale_price ? (
            <div className="flex flex-col">
              <span className="font-black text-gray-900 text-xs md:text-sm">{formatPrice(row.sale_price)}</span>
              <span className="text-[11px] text-gray-400 line-through">{formatPrice(row.regular_price)}</span>
            </div>
          ) : (
            <span className="font-bold text-gray-900 text-xs md:text-sm">{formatPrice(row.regular_price)}</span>
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
          <button
            type="button"
            onClick={() => {
              setQuickEditProduct(row);
              setQuickStock(stock.available);
              setQuickRegularPrice(row.regular_price);
              setQuickSalePrice(row.sale_price ? String(row.sale_price) : "");
            }}
            title="Click to Quick Edit Stock / Price"
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-2xs",
              stock.available > 5
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : stock.available > 0
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            )}
          >
            {stock.available > 5 ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            ) : stock.available > 0 ? (
              <AlertTriangle className="h-3 w-3 text-amber-600" />
            ) : (
              <XCircle className="h-3 w-3 text-rose-600" />
            )}
            <span>{stock.available} {t("available_stock", "in stock")}</span>
          </button>
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
            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize",
            row.deleted_at || row.status === "archived"
              ? "bg-gray-200 text-gray-700 border border-gray-300"
              : row.status === "active"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-amber-100 text-amber-800 border border-amber-200"
          )}
        >
          {row.deleted_at || row.status === "archived"
            ? t("archive", "Archived")
            : row.status === "active"
            ? t("product_active", "Active")
            : t("product_draft", "Draft")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-[#e91e63]" />
            {t("products", "Product Catalog")}
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            {t("product_list_desc", "Manage products, inventory, pricing, and live status.")} ({products.length} {t("products", "products")})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="rounded-2xl font-bold text-xs h-9 border-gray-300 hover:bg-gray-50 gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-gray-600" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-2xl font-bold text-xs h-9 border-gray-300 hover:bg-gray-50 gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-gray-600", loading && "animate-spin")} />
            Refresh
          </Button>

          <Link href="/admin/products/create">
            <Button className="bg-[#e91e63] hover:bg-pink-700 text-white font-bold rounded-2xl text-xs h-9 px-4 shadow-sm hover:shadow-md transition-all gap-1.5">
              <Plus className="h-4 w-4" /> {t("add_product", "Add Product")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Floating Action Notifications */}
      {actionMsg && (
        <div
          className={cn(
            "p-4 rounded-2xl flex items-center gap-2 font-bold text-xs shadow-md animate-in fade-in slide-in-from-top-2",
            actionMsg.isError
              ? "bg-rose-50 border border-rose-200 text-rose-800"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          )}
        >
          {actionMsg.isError ? (
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all select-none",
            statusFilter === "all"
              ? "bg-[#e91e63] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/80"
          )}
        >
          <span>{t("filter_all", "All Products")}</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black",
              statusFilter === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
            )}
          >
            {counts.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("active")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all select-none",
            statusFilter === "active"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200/80"
          )}
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <span>{t("product_active", "Active")}</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black",
              statusFilter === "active" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800"
            )}
          >
            {counts.active}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("draft")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all select-none",
            statusFilter === "draft"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-amber-50 hover:text-amber-700 border border-gray-200/80"
          )}
        >
          <span className="flex h-2 w-2 rounded-full bg-amber-400" />
          <span>{t("product_draft", "Draft")}</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black",
              statusFilter === "draft" ? "bg-white/20 text-white" : "bg-amber-50 text-amber-800"
            )}
          >
            {counts.draft}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("archived")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all select-none",
            statusFilter === "archived"
              ? "bg-gray-800 text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/80"
          )}
        >
          <Archive className="h-3.5 w-3.5" />
          <span>{t("archive", "Archived / Trash")}</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black",
              statusFilter === "archived" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
            )}
          >
            {counts.archived}
          </span>
        </button>
      </div>

      {/* Filter Options Bar */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#e91e63]" />
            <span className="text-xs font-black uppercase tracking-wider text-gray-900">
              {t("filter", "Product Filters")}
            </span>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-50 text-[#e91e63] border border-pink-200">
                {activeFiltersCount} active
              </span>
            )}
          </div>

          {(activeFiltersCount > 0 || statusFilter !== "all") && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t("reset_filters", "Reset All Filters")}</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Stock Level Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center gap-1">
              <Boxes className="h-3 w-3 text-[#e91e63]" />
              <span>{t("column_stock", "Stock Status")}</span>
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full text-xs font-medium rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-gray-800 focus:border-[#e91e63] focus:bg-white focus:outline-hidden transition-all"
            >
              <option value="all">{t("filter_all_stock", "All Stock Levels")}</option>
              <option value="in_stock">{t("filter_in_stock", "In Stock (>5)")}</option>
              <option value="low_stock">{t("filter_low_stock", "Low Stock (1-5)")}</option>
              <option value="out_of_stock">{t("filter_out_of_stock", "Out of Stock (0)")}</option>
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center gap-1">
              <Tag className="h-3 w-3 text-[#e91e63]" />
              <span>{t("column_brand", "Brand")}</span>
            </label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-gray-800 focus:border-[#e91e63] focus:bg-white focus:outline-hidden transition-all"
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
            <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center gap-1">
              <Layers className="h-3 w-3 text-[#e91e63]" />
              <span>{t("column_category", "Category")}</span>
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-gray-800 focus:border-[#e91e63] focus:bg-white focus:outline-hidden transition-all"
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
            <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center gap-1">
              <Package className="h-3 w-3 text-[#e91e63]" />
              <span>{t("product_type", "Product Type")}</span>
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full text-xs font-medium rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-gray-800 focus:border-[#e91e63] focus:bg-white focus:outline-hidden transition-all"
            >
              <option value="all">{t("filter_all_types", "All Types")}</option>
              <option value="simple">Simple Product</option>
              <option value="variable">Variable Product</option>
            </select>
          </div>

          {/* Badges / Options Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#e91e63]" />
              <span>{t("filter_badges", "Features & Delivery")}</span>
            </label>
            <select
              value={featureFilter}
              onChange={(e) => setFeatureFilter(e.target.value as any)}
              className="w-full text-xs font-medium rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-gray-800 focus:border-[#e91e63] focus:bg-white focus:outline-hidden transition-all"
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
        searchPlaceholder={t("search_products", "Search by product name, SKU, or barcode...")}
        searchKey="name"
        getRowId={(row) => row.id}
        emptyMessage={t("no_products", "No products match the selected filters.")}
        emptyIcon={<Package className="h-8 w-8 text-gray-400" />}
        bulkActions={(selectedIds, clearSelection) => (
          <div className="flex flex-wrap items-center gap-2">
            {statusFilter !== "archived" ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkLoading}
                  onClick={async () => {
                    setBulkLoading(true);
                    await bulkUpdateProductStatus(selectedIds, "active");
                    clearSelection();
                    await fetchData();
                    setBulkLoading(false);
                    showNotification(`Activated ${selectedIds.length} products!`);
                  }}
                  className="h-8 text-xs font-bold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  {t("activate", "Activate")} ({selectedIds.length})
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkLoading}
                  onClick={async () => {
                    setBulkLoading(true);
                    await bulkUpdateProductStatus(selectedIds, "draft");
                    clearSelection();
                    await fetchData();
                    setBulkLoading(false);
                    showNotification(`Moved ${selectedIds.length} products to Draft!`);
                  }}
                  className="h-8 text-xs font-bold text-amber-700 hover:bg-amber-50 hover:border-amber-300 rounded-xl"
                >
                  <FileEdit className="h-3.5 w-3.5 mr-1" />
                  {t("product_draft", "Draft")} ({selectedIds.length})
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkLoading}
                  onClick={() => {
                    setDeleteConfirm({
                      isOpen: true,
                      isPermanent: false,
                      isBulk: true,
                      bulkIds: selectedIds,
                      clearSelection,
                    });
                  }}
                  className="h-8 text-xs font-bold text-rose-700 hover:bg-rose-50 hover:border-rose-300 rounded-xl"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" />
                  {t("delete", "Delete / Archive")} ({selectedIds.length})
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkLoading}
                  onClick={async () => {
                    setBulkLoading(true);
                    await bulkUpdateProductStatus(selectedIds, "draft");
                    clearSelection();
                    await fetchData();
                    setBulkLoading(false);
                    showNotification(`Restored ${selectedIds.length} products!`);
                  }}
                  className="h-8 text-xs font-bold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Restore Selected ({selectedIds.length})
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkLoading}
                  onClick={() => {
                    setDeleteConfirm({
                      isOpen: true,
                      isPermanent: true,
                      isBulk: true,
                      bulkIds: selectedIds,
                      clearSelection,
                    });
                  }}
                  className="h-8 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl border-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Permanently Delete ({selectedIds.length})
                </Button>
              </>
            )}
          </div>
        )}
        actions={(row) => {
          const isArchived = Boolean(row.deleted_at || row.status === "archived");
          return (
            <RowActions>
              <RowAction onClick={() => router.push(`/admin/products/${row.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5 text-primary-600" /> {t("action_edit", "Edit Product")}
              </RowAction>

              <RowAction onClick={() => window.open(`/products/${row.slug}`, "_blank")}>
                <Eye className="h-3.5 w-3.5 text-blue-600" /> {t("action_view", "View on Storefront")}
              </RowAction>

              <RowAction onClick={() => handleDuplicate(row.id, row.name)}>
                <Copy className="h-3.5 w-3.5 text-indigo-600" /> Duplicate / Clone Product
              </RowAction>

              <RowAction
                onClick={() => {
                  setQuickEditProduct(row);
                  setQuickStock(getStock(row.inventory).available);
                  setQuickRegularPrice(row.regular_price);
                  setQuickSalePrice(row.sale_price ? String(row.sale_price) : "");
                }}
              >
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Quick Stock & Price Edit
              </RowAction>

              {!isArchived ? (
                <>
                  {row.status === "active" ? (
                    <RowAction
                      onClick={async () => {
                        await bulkUpdateProductStatus([row.id], "draft");
                        await fetchData();
                        showNotification(`Moved "${row.name}" to Draft!`);
                      }}
                    >
                      <FileEdit className="h-3.5 w-3.5 text-amber-600" /> {t("set_to_draft", "Move to Draft")}
                    </RowAction>
                  ) : (
                    <RowAction
                      onClick={async () => {
                        await bulkUpdateProductStatus([row.id], "active");
                        await fetchData();
                        showNotification(`Activated "${row.name}"!`);
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {t("activate", "Activate Product")}
                    </RowAction>
                  )}

                  <RowAction
                    variant="danger"
                    onClick={() => {
                      setDeleteConfirm({
                        isOpen: true,
                        productId: row.id,
                        productName: row.name,
                        isPermanent: false,
                        isBulk: false,
                      });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {t("delete", "Delete / Archive Product")}
                  </RowAction>
                </>
              ) : (
                <>
                  <RowAction onClick={() => handleRestore(row.id, row.name)}>
                    <RotateCcw className="h-3.5 w-3.5 text-emerald-600" /> Restore Product
                  </RowAction>

                  <RowAction
                    variant="danger"
                    onClick={() => {
                      setDeleteConfirm({
                        isOpen: true,
                        productId: row.id,
                        productName: row.name,
                        isPermanent: true,
                        isBulk: false,
                      });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Permanent Delete (Cannot Undo)
                  </RowAction>
                </>
              )}
            </RowActions>
          );
        }}
      />

      {/* QUICK STOCK & PRICE EDIT MODAL */}
      {quickEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-pink-50 text-[#e91e63] rounded-xl">
                  <DollarSign className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Quick Inventory & Price Edit</h3>
                  <p className="text-[11px] text-gray-500 truncate max-w-[240px]">{quickEditProduct.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditProduct(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Stock on Hand / Available</label>
                <input
                  type="number"
                  min="0"
                  value={quickStock}
                  onChange={(e) => setQuickStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold focus:border-[#e91e63] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Regular Price (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={quickRegularPrice}
                    onChange={(e) => setQuickRegularPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold focus:border-[#e91e63] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Sale Price (৳ Optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="None"
                    value={quickSalePrice}
                    onChange={(e) => setQuickSalePrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold focus:border-[#e91e63] outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickEditProduct(null)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={quickSaving}
                onClick={handleSaveQuickEdit}
                className="bg-[#e91e63] hover:bg-pink-700 text-white rounded-xl text-xs font-bold px-4"
              >
                {quickSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE / ARCHIVE CONFIRMATION MODAL */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">
                  {deleteConfirm.isPermanent
                    ? "Permanent Product Deletion"
                    : "Archive Product"}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {deleteConfirm.isPermanent
                    ? "This action is irreversible and permanently removes database records."
                    : "This product will be moved to the Archived tab."}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-2xl border border-gray-100">
              {deleteConfirm.isBulk ? (
                <span>
                  Are you sure you want to {deleteConfirm.isPermanent ? "permanently delete" : "archive"}{" "}
                  <strong>{deleteConfirm.bulkIds?.length} selected products</strong>?
                </span>
              ) : (
                <span>
                  Are you sure you want to {deleteConfirm.isPermanent ? "permanently delete" : "archive"}{" "}
                  <strong>&quot;{deleteConfirm.productName}&quot;</strong>?
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm({ isOpen: false, isPermanent: false, isBulk: false })}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={bulkLoading}
                onClick={executeDeleteAction}
                className={cn(
                  "rounded-xl text-xs font-bold px-4 text-white",
                  deleteConfirm.isPermanent ? "bg-rose-700 hover:bg-rose-800" : "bg-rose-600 hover:bg-rose-700"
                )}
              >
                {bulkLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                {deleteConfirm.isPermanent ? "Confirm Permanent Delete" : "Confirm Archive"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
