"use client";

import { useState } from "react";
import { Building, Phone, Mail, MapPin, Plus, Edit2, Trash2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { DataTable, type Column } from "@/components/admin/data-table";
import { saveSupplier, deleteSupplier, type SupplierItem } from "./actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface SupplierListClientProps {
  initialSuppliers: SupplierItem[];
}

export function SupplierListClient({ initialSuppliers }: SupplierListClientProps) {
  const { t } = useAdminLang();
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(initialSuppliers);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [error, setError] = useState("");

  const openAddModal = () => {
    setEditingSupplier(null);
    setCompany("");
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setStatus("active");
    setError("");
    setShowModal(true);
  };

  const openEditModal = (s: SupplierItem) => {
    setEditingSupplier(s);
    setCompany(s.company);
    setName(s.name);
    setPhone(s.phone);
    setEmail(s.email);
    setAddress(s.address);
    setNotes(s.notes);
    setStatus(s.status);
    setError("");
    setShowModal(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) {
      setError("Please enter the company/distributor name");
      return;
    }
    if (!phone.trim()) {
      setError("Please provide a contact phone number");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const updated = await saveSupplier({
        id: editingSupplier?.id,
        company,
        name: name || "Primary Representative",
        phone,
        email,
        address: address || "International",
        status,
        notes: notes || "Skincare procurement partner",
      });
      setSuppliers(updated);
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to save supplier");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("Are you sure you want to remove this supplier from the directory?")) return;
    setDeletingId(id);
    try {
      const updated = await deleteSupplier(id);
      setSuppliers(updated);
    } catch (err: any) {
      alert("Failed to delete supplier: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const columns: Column<SupplierItem>[] = [
    {
      key: "company",
      header: t("supplier_name"),
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-text text-xs flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-primary-600 shrink-0" />
            {row.company}
          </span>
          <span className="text-[11px] text-text-muted">{t("contact_person")}: {row.name}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: t("column_phone"),
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="flex items-center gap-1 text-text">
            <Phone className="h-3 w-3 text-text-muted shrink-0" /> {row.phone}
          </span>
          {row.email && (
            <span className="flex items-center gap-1 text-text-muted text-[11px]">
              <Mail className="h-3 w-3 shrink-0" /> {row.email}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "address",
      header: t("store_address"),
      cell: (row) => (
        <span className="text-xs text-text-secondary flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-text-muted shrink-0" />
          {row.address}
        </span>
      ),
    },
    {
      key: "notes",
      header: t("payment_terms"),
      cell: (row) => (
        <p className="max-w-70 text-xs text-text-secondary leading-relaxed">
          {row.notes}
        </p>
      ),
    },
    {
      key: "status",
      header: t("column_status"),
      sortable: true,
      cell: (row) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
            row.status === "active"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-gray-100 text-gray-600 border-gray-200"
          }`}
        >
          {row.status === "active" ? t("active") : row.status}
        </span>
      ),
    },
    {
      key: "id",
      header: t("column_actions"),
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEditModal(row)}
            className="text-text-muted hover:text-primary-600 transition-colors p-1"
            title={t("action_edit")}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteSupplier(row.id)}
            disabled={deletingId === row.id}
            className="text-text-muted hover:text-red-600 transition-colors p-1"
            title={t("action_delete")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text">{t("supplier_management")}</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {t("supplier_desc")}
          </p>
        </div>

        <Button onClick={openAddModal} size="sm" className="shrink-0 text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          {t("add_supplier")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        searchKey="company"
        searchPlaceholder={t("search_table")}
        emptyMessage={t("no_suppliers")}
      />

      {/* Add / Edit Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Building className="h-4 w-4 text-primary-600" />
                {editingSupplier ? "Edit Skincare Supplier" : "Register New Supplier"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="sup-company">Company / Distributor Name</Label>
                <Input
                  id="sup-company"
                  placeholder="e.g. Seoul Cosmetics Wholesale Ltd"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="sup-name">Contact Person</Label>
                  <Input
                    id="sup-name"
                    placeholder="e.g. Kim Min-jun"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sup-status">Partnership Status</Label>
                  <select
                    id="sup-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="sup-phone">Phone / WhatsApp</Label>
                  <Input
                    id="sup-phone"
                    placeholder="e.g. +82-2-1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sup-email">Email Address</Label>
                  <Input
                    id="sup-email"
                    type="email"
                    placeholder="e.g. supply@seoulcosmetics.kr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="sup-addr">Origin Country & Logistics Hub</Label>
                <Input
                  id="sup-addr"
                  placeholder="e.g. Gangnam-gu, Seoul, South Korea"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sup-notes">Procurement Scope & Authorized Brands</Label>
                <textarea
                  id="sup-notes"
                  rows={2}
                  placeholder="e.g. Direct authorized distributor for COSRX and Beauty of Joseon..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white p-2 text-xs text-text focus:border-primary-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Supplier"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
