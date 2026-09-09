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
  { value: "admin", label: "Super Admin", labelBn: "সুপার অ্যাডমিন", desc: "Full access to settings, finance, products, orders & team", descBn: "সেটিংস, ফিন্যান্স, পণ্য, অর্ডার ও টিমের পূর্ণ অ্যাক্সেস" },
  { value: "moderator", label: "Moderator", labelBn: "মডারেটর", desc: "Catalog, reviews moderation, customer Q&A, and orders", descBn: "ক্যাটালগ, রিভিউ মডারেশন, প্রশ্নোত্তর ও অর্ডার" },
  { value: "catalog_manager", label: "Catalog Manager", labelBn: "ক্যাটালগ ম্যানেজার", desc: "Products, categories, brands, inventory & media", descBn: "পণ্য, ক্যাটাগরি, ব্র্যান্ড, ইনভেন্টরি ও মিডিয়া" },
  { value: "logistics_coordinator", label: "Logistics Coordinator", labelBn: "লজিস্টিকস সমন্বয়ক", desc: "Orders, courier consignment booking, SMS dispatch", descBn: "অর্ডার, কুরিয়ার পার্সেল বুকিং ও এসএমএস প্রেরণ" },
  { value: "staff", label: "Support Staff", labelBn: "সাপোর্ট স্টাফ", desc: "Customer profiles, order tracking & returns", descBn: "গ্রাহক প্রোফাইল, অর্ডার ট্র্যাকিং ও রিটার্ন" },
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
        alert((isBn ? "ভূমিকা পরিবর্তন ব্যর্থ হয়েছে: " : "Failed to update role: ") + res.error);
      }
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(isBn ? "অনুগ্রহ করে একটি ইমেইল অ্যাড্রেস লিখুন" : "Please enter an email address");
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
            lastLogin: isBn ? "আমন্ত্রণ পাঠানো হয়েছে" : "Pending Invite",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setShowAddModal(false);
        setName("");
        setEmail("");
        setPhone("");
      } else {
        setError(res.error || (isBn ? "টিম মেম্বার যুক্ত করতে ব্যর্থ হয়েছে" : "Failed to add team member"));
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
            {isBn ? "টিম ভূমিকা ও অ্যাক্সেস পারমিশন" : "Team Roles & Access Permissions"}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {isBn
              ? "অ্যাডমিনিস্ট্রেটিভ কর্মী, দায়িত্ব ভিত্তিক অ্যাক্সেস নিয়ন্ত্রণ এবং সিস্টেম পারমিশন পরিচালনা করুন।"
              : "Manage administrative staff, granular role permissions, and system access levels in Supabase."}
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)} size="sm" className="shrink-0 text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          {isBn ? "টিম মেম্বার যুক্ত করুন" : "Add / Invite Team Member"}
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-bold text-text">
            {isBn ? "প্রশাসনিক কর্মী তালিকা" : "Administrative Staff Directory"}
          </h2>
          <span className="text-xs text-text-muted">
            {users.length} {isBn ? "জন সদস্য" : "members"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/60 text-text-muted uppercase font-bold border-b border-border">
              <tr>
                <th className="px-4 py-3">{isBn ? "টিম মেম্বার" : "Team Member"}</th>
                <th className="px-4 py-3">{isBn ? "নির্ধারিত ভূমিকা" : "Assigned Role"}</th>
                <th className="px-4 py-3">{isBn ? "অ্যাক্সেস পরিধি" : "Access Scope"}</th>
                <th className="px-4 py-3">{isBn ? "সর্বশেষ সক্রিয়" : "Last Active"}</th>
                <th className="px-4 py-3">{isBn ? "স্ট্যাটাস" : "Status"}</th>
                <th className="px-4 py-3 text-right">{isBn ? "অ্যাকশন" : "Actions"}</th>
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
                      {user.status === "Active" ? (isBn ? "সক্রিয়" : "Active") : user.status}
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
                        title={isBn ? "ভূমিকা পরিবর্তন করুন" : "Change user role"}
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
                {isBn ? "প্রশাসনিক টিম মেম্বার যোগ করুন" : "Add Administrative Team Member"}
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
                <Label htmlFor="mem-name">{isBn ? "পূর্ণ নাম" : "Full Name"}</Label>
                <Input
                  id="mem-name"
                  placeholder={isBn ? "যেমন: নুসরাত জাহান" : "e.g. Nusrat Jahan"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mem-email">{isBn ? "কর্মক্ষেত্রের ইমেইল" : "Work Email"}</Label>
                <Input
                  id="mem-email"
                  type="email"
                  placeholder={isBn ? "যেমন: nusrat@ecomxbd.com" : "e.g. nusrat@blushbudget.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mem-role">
                  {isBn ? "প্রশাসনিক ভূমিকা ও দায়িত্বের পরিধি" : "Administrative Role & Scope"}
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
                <Label htmlFor="mem-phone">{isBn ? "ফোন নম্বর (ঐচ্ছিক)" : "Phone Number (Optional)"}</Label>
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
                  {isBn ? "বাতিল" : "Cancel"}
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting
                    ? (isBn ? "যোগ হচ্ছে..." : "Adding...")
                    : (isBn ? "টিম মেম্বার যুক্ত করুন" : "Add Team Member")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
