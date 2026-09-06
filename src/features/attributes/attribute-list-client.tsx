"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Palette, X, GripVertical } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { DataTable, RowActions, RowAction, type Column } from "@/components/admin/data-table";
import {
  getAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from "@/features/attributes/actions";
import { generateSlug } from "@/lib/utils";
import { useAdminLang } from "@/lib/admin-lang-context";

interface AttrRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  sort_order: number;
  attribute_values: Array<{
    id: string;
    value: string;
    slug: string;
    color_hex: string | null;
    sort_order: number;
  }>;
}

export default function AttributeListClient() {
  const router = useRouter();
  const { t } = useAdminLang();
  const [attrs, setAttrs] = useState<AttrRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formType, setFormType] = useState("select");
  const [formValues, setFormValues] = useState<Array<{ value: string; color_hex?: string }>>([]);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const data = await getAttributes();
    setAttrs(data as AttrRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormName("");
    setFormSlug("");
    setFormType("select");
    setFormValues([]);
    setFormError("");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (attr: AttrRow) => {
    setFormName(attr.name);
    setFormSlug(attr.slug);
    setFormType(attr.type);
    setFormValues(attr.attribute_values.map((v) => ({ value: v.value, color_hex: v.color_hex ?? undefined })));
    setEditingId(attr.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { setFormError("Name is required"); return; }
    setSaving(true);
    setFormError("");

    const slug = formSlug || generateSlug(formName);
    const input = { name: formName, slug, type: formType, values: formValues };

    const result = editingId
      ? await updateAttribute(editingId, input)
      : await createAttribute(input);

    if (result.error) {
      setFormError(typeof result.error === "string" ? result.error : "Failed to save");
      setSaving(false);
      return;
    }

    resetForm();
    fetchData();
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete attribute "${name}" and all its values?`)) return;
    const result = await deleteAttribute(id);
    if (result.error) { alert(result.error); return; }
    fetchData();
  };

  const addValue = () => setFormValues([...formValues, { value: "" }]);
  const removeValue = (idx: number) => setFormValues(formValues.filter((_, i) => i !== idx));
  const updateValue = (idx: number, key: string, val: string) => {
    setFormValues(formValues.map((v, i) => (i === idx ? { ...v, [key]: val } : v)));
  };

  const columns: Column<AttrRow>[] = [
    {
      key: "name",
      header: t("attributes"),
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-text">{row.name}</p>
          <p className="text-xs text-text-muted">Type: {row.type}</p>
        </div>
      ),
    },
    {
      key: "values",
      header: "Values",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.attribute_values.slice(0, 8).map((v) => (
            <span
              key={v.id}
              className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-secondary"
            >
              {v.color_hex && (
                <span
                  className="h-3 w-3 rounded-full border border-border"
                  style={{ backgroundColor: v.color_hex }}
                />
              )}
              {v.value}
            </span>
          ))}
          {row.attribute_values.length > 8 && (
            <span className="text-xs text-text-muted">+{row.attribute_values.length - 8} more</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t("attribute_management")}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t("attribute_desc")}</p>
      </div>

      {/* Inline Create/Edit Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">
              {editingId ? "Edit Attribute" : "New Attribute"}
            </h2>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {formError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">{formError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingId) setFormSlug(generateSlug(e.target.value));
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={formSlug} onChange={(e) => setFormSlug(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                >
                  <option value="select">Select</option>
                  <option value="color">Color</option>
                  <option value="text">Text</option>
                </select>
              </div>
            </div>

            {/* Values */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Values</Label>
                <Button type="button" variant="outline" size="sm" onClick={addValue}>
                  <Plus className="h-3.5 w-3.5" /> Add Value
                </Button>
              </div>
              <div className="space-y-2">
                {formValues.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 text-text-muted" />
                    <Input
                      value={val.value}
                      onChange={(e) => updateValue(idx, "value", e.target.value)}
                      placeholder="Value name"
                      className="flex-1"
                    />
                    {formType === "color" && (
                      <input
                        type="color"
                        value={val.color_hex || "#000000"}
                        onChange={(e) => updateValue(idx, "color_hex", e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded border border-border"
                      />
                    )}
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeValue(idx)}>
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {editingId ? "Update" : "Create"} Attribute
              </Button>
            </div>
          </form>
        </div>
      )}

      <DataTable
        columns={columns}
        data={attrs}
        loading={loading}
        searchPlaceholder={t("search_table")}
        searchKey="name"
        getRowId={(row) => row.id}
        emptyMessage={t("no_attributes")}
        emptyIcon={<Palette className="h-6 w-6" />}
        headerActions={
          !showForm ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> {t("add_attribute")}
            </Button>
          ) : null
        }
        actions={(row) => (
          <RowActions>
            <RowAction onClick={() => startEdit(row)}>
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
