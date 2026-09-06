"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { DataTable, RowActions, RowAction, type Column } from "@/components/admin/data-table";
import { getBrands, deleteBrand } from "@/features/brands/actions";
import { cn } from "@/lib/utils";
import { useAdminLang } from "@/lib/admin-lang-context";

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  status: string;
  created_at: string;
}

export default function BrandListClient() {
  const router = useRouter();
  const { t } = useAdminLang();
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const data = await getBrands();
    setBrands(data as BrandRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    const result = await deleteBrand(id);
    if (result.error) { alert(result.error); return; }
    fetchData();
  };

  const columns: Column<BrandRow>[] = [
    {
      key: "name",
      header: t("column_brand"),
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.logo_url ? (
            <img src={row.logo_url} alt={row.name} className="h-8 w-8 rounded-lg object-contain border border-border bg-white" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-secondary text-text-muted">
              <Tag className="h-4 w-4" />
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
      key: "status",
      header: t("column_status"),
      sortable: true,
      cell: (row) => (
        <span className={cn(
          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
          row.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
        )}>
          {row.status === "active" ? t("active") : row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t("brands")}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t("brand_desc")}</p>
      </div>
      <DataTable
        columns={columns}
        data={brands}
        loading={loading}
        searchPlaceholder={t("search_table")}
        searchKey="name"
        getRowId={(row) => row.id}
        emptyMessage={t("no_brands")}
        emptyIcon={<Tag className="h-6 w-6" />}
        headerActions={
          <Link href="/admin/brands/create">
            <Button><Plus className="h-4 w-4" /> {t("add_brand")}</Button>
          </Link>
        }
        actions={(row) => (
          <RowActions>
            <RowAction onClick={() => router.push(`/admin/brands/${row.id}/edit`)}>
              <Pencil className="h-3.5 w-3.5" /> {t("action_edit")}
            </RowAction>
            <RowAction variant="danger" onClick={() => handleDelete(row.id, row.name)}>
              <Trash2 className="h-3.5 w-3.5" /> {t("action_delete")}
            </RowAction>
          </RowActions>
        )}
      />
    </div>
  );
}
