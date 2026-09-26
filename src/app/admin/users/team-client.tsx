"use client";

import { useState } from "react";
import { Shield, UserCheck, Key, Mail, Lock, Plus, Edit2, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { updateStaffRole, addStaffMember, type TeamMember } from "@/features/users/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface TeamClientProps {
  initialUsers: TeamMember[];
}

const ROLES = [
  { value: "admin", label: "Super Admin", labelBn: "Super Admin", desc: "Full access to settings, finance, products, orders & team", descBn: "Settings, Finance, Products, Order and full team access" },
  { value: "moderator", label: "Moderator", labelBn: "Moderator", desc: "Catalog, reviews moderation, customer Q&A, and orders", descBn: "Catalog, Reviews Moderation, Q&A  Order" },
  { value: "catalog_manager", label: "Catalog Manager", labelBn: "Catalog ", desc: "Products, categories, brands, inventory & media", descBn: "Products, Category, Brand,   " },
  { value: "logistics_coordinator", label: "Logistics Coordinator", labelBn: "items ", desc: "Orders, courier consignment booking, SMS dispatch", descBn: "Order, Courier    SMS " },
  { value: "staff", label: "Support Staff", labelBn: " :00", desc: "Customer profiles, order tracking & returns", descBn: " Profile, Order Tracking  Return" },
];

export function TeamClient({ initialUsers }: TeamClientProps) {
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const [users, setUsers] = useState<TeamMember[]>(initialUsers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("staff");
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  // Add form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("moderator");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSavingRoleId(userId);
    try {
      const res = await updateStaffRole(userId, newRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setEditingUserId(null);
      } else {
        alert((isBn ? "  Failed successfully: " : "Failed to update role: ") + res.error);
      }
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(isBn ? "Please  items Email  " : "Please enter an email address");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await addStaffMember({
        email,
        fullName: name,
        role,
        phone,
      });

      if (res.success) {
        // Optimistically add or update
        setUsers((prev) => [
          {
            id: `temp-${Date.now()}`,
            name: name || email.split("@")[0],
            email,
            role,
            permissions: (isBn ? ROLES.find((r) => r.value === role)?.descBn : ROLES.find((r) => r.value === role)?.desc) || "Staff access",
            status: "Active",
            lastLogin: isBn ? "  successfully" : "Pending Invite",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setShowAddModal(false);
        setName("");
        setEmail("");
        setPhone("");
      } else {
        setError(res.error || (isBn ? "items  added  Failed successfully" : "Failed to add team member"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {isBn ? "items    " : "Team Roles & Access Permissions"}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {isBn
              ? "items ,     and    ।"
              : "Manage administrative staff, granular role permissions, and system access levels in Supabase."}
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)} size="sm" className="shrink-0 text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          {isBn ? "items  added " : "Add / Invite Team Member"}
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-bold text-text">
            {isBn ? "  " : "Administrative Staff Directory"}
          </h2>
          <span className="text-xs text-text-muted">
            {users.length} {isBn ? " " : "members"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/60 text-text-muted uppercase font-bold border-b border-border">
              <tr>
                <th className="px-4 py-3">{isBn ? "items " : "Team Member"}</th>
                <th className="px-4 py-3">{isBn ? " " : "Assigned Role"}</th>
                <th className="px-4 py-3">{isBn ? " " : "Access Scope"}</th>
                <th className="px-4 py-3">{isBn ? " Active" : "Last Active"}</th>
                <th className="px-4 py-3">{isBn ? "Status" : "Status"}</th>
                <th className="px-4 py-3 text-right">{isBn ? "Action" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-surface-secondary/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <p className="font-bold text-text">{user.name}</p>
                        <p className="text-[11px] text-text-muted flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {editingUserId === user.id ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="rounded-lg border border-border px-2 py-1 text-xs text-text bg-white"
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {isBn ? r.labelBn : r.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRoleChange(user.id, selectedRole)}
                          disabled={savingRoleId === user.id}
                          className="p-1 text-emerald-600 hover:text-emerald-700"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="p-1 text-text-muted hover:text-text"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                          user.role === "admin" || user.role === "superadmin"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : user.role === "moderator"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {user.role}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-text-secondary text-[11px] max-w-70">
                    {user.permissions}
                  </td>

                  <td className="px-4 py-3 text-text-secondary text-[11px] whitespace-nowrap">
                    {user.lastLogin}
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {user.status === "Active" ? (isBn ? "Active" : "Active") : user.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    {editingUserId !== user.id && (
                      <button
                        onClick={() => {
                          setEditingUserId(user.id);
                          setSelectedRole(user.role);
                        }}
                        className="text-text-muted hover:text-primary-600 transition-colors p-1"
                        title={isBn ? "  " : "Change user role"}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite / Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary-600" />
                {isBn ? " items  Add to Cart" : "Add Administrative Team Member"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
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

            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="mem-name">{isBn ? " Name" : "Full Name"}</Label>
                <Input
                  id="mem-name"
                  placeholder={isBn ? "e.g.: PM " : "e.g. Nusrat Jahan"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mem-email">{isBn ? " Email" : "Work Email"}</Label>
                <Input
                  id="mem-email"
                  type="email"
                  placeholder={isBn ? "e.g.: nusrat@ecomxbd.com" : "e.g. nusrat@blushbudget.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mem-role">
                  {isBn ? "    " : "Administrative Role & Scope"}
                </Label>
                <select
                  id="mem-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {isBn ? `${r.labelBn} — ${r.descBn}` : `${r.label} — ${r.desc}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mem-phone">{isBn ? "Phone Number ()" : "Phone Number (Optional)"}</Label>
                <Input
                  id="mem-phone"
                  placeholder="e.g. +880 17XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  {isBn ? "Cancel" : "Cancel"}
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting
                    ? (isBn ? "Add ..." : "Adding...")
                    : (isBn ? "items  added " : "Add Team Member")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
