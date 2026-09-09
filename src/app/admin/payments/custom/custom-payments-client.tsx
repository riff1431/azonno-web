"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { Building, Plus, CheckCircle2, Edit2, Trash2, X, AlertCircle, QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { saveCustomPaymentMethod, deleteCustomPaymentMethod, type CustomPaymentMethodItem } from "@/features/payments/actions";

interface CustomPaymentsClientProps {
  initialMethods: CustomPaymentMethodItem[];
}

export function CustomPaymentsClient({ initialMethods }: CustomPaymentsClientProps) {
  const [methods, setMethods] = useState<CustomPaymentMethodItem[]>(initialMethods);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<CustomPaymentMethodItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [instructions, setInstructions] = useState("");
  const [requiresProof, setRequiresProof] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState("");

  const openAddModal = () => {
    setEditingMethod(null);
    setName("");
    setAccountName("");
    setAccountNumber("");
    setBankName("");
    setRoutingNumber("");
    setInstructions("Transfer total order amount and input Order ID as transaction memo.");
    setRequiresProof(true);
    setEnabled(true);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (m: CustomPaymentMethodItem) => {
    setEditingMethod(m);
    setName(m.name);
    setAccountName(m.accountName);
    setAccountNumber(m.accountNumber);
    setBankName(m.bankName);
    setRoutingNumber(m.routingNumber || "");
    setInstructions(m.instructions);
    setRequiresProof(m.requiresProof);
    setEnabled(m.enabled);
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !accountNumber.trim()) {
      setError("Please fill out the method name and account number");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const updated = await saveCustomPaymentMethod({
        id: editingMethod?.id,
        name,
        accountName,
        accountNumber,
        bankName,
        routingNumber,
        instructions,
        requiresProof,
        enabled,
      });
      setMethods(updated);
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to save payment method");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this payment method?")) return;
    setDeletingId(id);
    try {
      const updated = await deleteCustomPaymentMethod(id);
      setMethods(updated);
    } catch (err: any) {
      alert("Failed to delete method: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <ModuleHeader
          title="Custom & Manual Payment Methods"
          description="Configure offline manual payment options like Bank Wire Transfers, Manual bKash/Nagad transfers, and QR Code payments."
          iconName="Building"
          backHref="/admin/payments"
        />

        <Button onClick={openAddModal} size="sm" className="text-xs shrink-0">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Custom Payment Method
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {methods.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-text">{m.name}</h3>
                  {m.enabled ? (
                    <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-bold uppercase border border-emerald-200">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-secondary text-text-muted px-2.5 py-0.5 text-[10px] font-bold uppercase border border-border">
                      Disabled
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-muted mt-0.5 block">
                  {m.bankName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(m)}
                  className="text-xs h-8 px-3"
                >
                  <Edit2 className="h-3 w-3 mr-1 text-primary-600" />
                  Edit Details
                </Button>
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  className="p-1.5 text-text-muted hover:text-red-600 transition-colors"
                  title="Delete payment method"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 rounded-xl border border-border bg-surface-secondary/40 p-3.5">
                <span className="text-text-muted font-medium text-[11px] block">Account Title / Holder</span>
                <span className="font-bold text-text">{m.accountName}</span>
                <span className="text-text-muted font-medium text-[11px] block pt-2">Account Number</span>
                <span className="font-mono font-bold text-primary-700 text-sm">{m.accountNumber}</span>
                {m.routingNumber && (
                  <span className="text-[11px] text-text-muted block">Routing No: {m.routingNumber}</span>
                )}
              </div>

              <div className="space-y-2 rounded-xl border border-border bg-surface-secondary/40 p-3.5">
                <span className="text-text-muted font-medium text-[11px] block">Customer Payment Instructions</span>
                <p className="text-xs text-text-secondary leading-relaxed">{m.instructions}</p>
                {m.requiresProof && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                    <ShieldCheck className="h-3 w-3" /> Requires Slip / TrxID Proof
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Method Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Building className="h-4 w-4 text-primary-600" />
                {editingMethod ? "Edit Payment Method" : "Add Custom Payment Method"}
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

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="pm-name">Method Title</Label>
                <Input
                  id="pm-name"
                  placeholder="e.g. Direct Bank Wire Transfer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pm-bank">Bank or Provider Name</Label>
                  <Input
                    id="pm-bank"
                    placeholder="e.g. City Bank PLC"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="pm-holder">Account Name</Label>
                  <Input
                    id="pm-holder"
                    placeholder="e.g. Blush & Budget Ltd."
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pm-number">Account Number</Label>
                  <Input
                    id="pm-number"
                    placeholder="e.g. 2050 1829 0192 0001"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="pm-routing">Routing Number (Optional)</Label>
                  <Input
                    id="pm-routing"
                    placeholder="e.g. 225272341"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="pm-inst">Customer Instructions</Label>
                <textarea
                  id="pm-inst"
                  rows={2}
                  placeholder="e.g. Transfer total order amount and input Order ID as transaction memo."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white p-2.5 text-xs text-text focus:border-primary-500 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-secondary/40">
                <div>
                  <span className="font-bold text-text block">Require Transaction Receipt</span>
                  <span className="text-[10px] text-text-muted">Customer must enter TrxID or upload payment receipt</span>
                </div>
                <input
                  type="checkbox"
                  checked={requiresProof}
                  onChange={(e) => setRequiresProof(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary-600"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-secondary/40">
                <div>
                  <span className="font-bold text-text block">Enable in Checkout</span>
                  <span className="text-[10px] text-text-muted">Display this payment method to buyers</span>
                </div>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary-600"
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
                  {submitting ? "Saving..." : "Save Payment Method"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
