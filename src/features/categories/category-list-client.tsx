"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { DataTable, RowActions, RowAction, type Column } from "@/components/admin/data-table";
import { getCategories, deleteCategory } from "@/features/categories/actions";
import { cn } from "@/lib/utils";
import { useAdminLang } from "@/lib/admin-lang-context";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  status: string;
  sort_order: number;
  image_url: string | null;
  created_at: string;
}

export default function CategoryListClient() {
  const router = useRouter();
  const { t } = useAdminLang();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const data = await getCategories();
    setCategories(data as CategoryRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    const result = await deleteCategory(id);
    if (result.error) {
      alert(result.error);
      return;
    }
    fetchData();
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return "—";
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name ?? "—";
  };

  const columns: Column<CategoryRow>[] = [
    {
      key: "name",
      header: t("column_category"),
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.image_url ? (
            <img src={row.image_url} alt={row.name} className="h-8 w-8 rounded-lg object-cover border border-border" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-secondary text-text-muted">
              <FolderTree className="h-4 w-4" />
            </div>
          )}
          <div>
            <p className="font-medium text-text">{row.name}</p>
            <p className="text-xs text-text-muted">/{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "parent_id",
      header: "Parent",
      cell: (row) => <span className="text-text-secondary">{getParentName(row.parent_id)}</span>,
    },
    {
      key: "sort_order",
      header: "Order",
      sortable: true,
      cell: (row) => <span className="text-text-secondary">{row.sort_order}</span>,
    },
    {
      key: "status",
      header: t("column_status"),
      sortable: true,
      cell: (row) => (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
            row.status === "active"
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-600"
          )}
        >
          {row.status === "active" ? t("active") : row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t("categories")}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {t("category_desc")}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        searchPlaceholder={t("search_table")}
        searchKey="name"
        getRowId={(row) => row.id}
        emptyMessage={t("no_categories")}
        emptyIcon={<FolderTree className="h-6 w-6" />}
        headerActions={
          <Link href="/admin/categories/create">
            <Button>
              <Plus className="h-4 w-4" />
              {t("add_category")}
            </Button>
          </Link>
        }
        actions={(row) => (
          <RowActions>
            <RowAction onClick={() => router.push(`/admin/categories/${row.id}/edit`)}>
              <Pencil className="h-3.5 w-3.5" />
              {t("action_edit")}
            </RowAction>
            <RowAction variant="danger" onClick={() => handleDelete(row.id, row.name)}>
              <Trash2 className="h-3.5 w-3.5" />
              {t("action_delete")}
            </RowAction>
          </RowActions>
        )}
      />
    </div>
  );
}
