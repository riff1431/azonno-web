"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { Truck, MapPin, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { formatPrice } from "@/lib/utils";
import { saveShippingZone, deleteShippingZone, type ShippingZoneItem } from "@/features/logistics/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface ZonesClientProps {
  initialZones: ShippingZoneItem[];
}

export function ZonesClient({ initialZones }: ZonesClientProps) {
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const [zones, setZones] = useState<ShippingZoneItem[]>(initialZones);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZoneItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [regions, setRegions] = useState("");
  const [charge, setCharge] = useState("");
  const [freeThreshold, setFreeThreshold] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [sfRate, setSfRate] = useState("");
  const [pathaoRate, setPathaoRate] = useState("");
  const [error, setError] = useState("");

  const openAddModal = () => {
    setEditingZone(null);
    setName("");
    setRegions("");
    setCharge("60");
    setFreeThreshold("2500");
    setDeliveryTime(isBn ? "২৪-৪৮ ঘণ্টা" : "24-48 Hours");
    setEnabled(true);
    setSfRate("60");
    setPathaoRate("70");
    setError("");
    setShowModal(true);
  };

  const openEditModal = (zone: ShippingZoneItem) => {
    setEditingZone(zone);
    setName(zone.name);
    setRegions(zone.regions);
    setCharge(String(zone.charge));
    setFreeThreshold(String(zone.freeThreshold));
    setDeliveryTime(zone.deliveryTime);
    setEnabled(zone.enabled);
    setSfRate(String(zone.courierRates?.steadfast || zone.charge));
    setPathaoRate(String(zone.courierRates?.pathao || zone.charge + 10));
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isBn ? "জোনের নাম প্রদান করুন" : "Please provide a zone name");
      return;
    }
    if (!charge || Number(charge) < 0) {
      setError(isBn ? "সঠিক ডেলিভারি চার্জ প্রদান করুন" : "Please provide a valid delivery charge");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const updated = await saveShippingZone({
        id: editingZone?.id,
        name,
        regions,
        charge: Number(charge),
        freeThreshold: Number(freeThreshold || 0),
        deliveryTime: deliveryTime || "2-3 Days",
        enabled,
        courierRates: {
          steadfast: Number(sfRate || charge),
          pathao: Number(pathaoRate || charge),
          redx: Number(sfRate || charge),
        },
      });
      setZones(updated);
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || (isBn ? "শিপিং জোন সংরক্ষণ ব্যর্থ হয়েছে" : "Failed to save shipping zone"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isBn ? "আপনি কি নিশ্চিত যে এই শিপিং জোনটি মুছে ফেলতে চান?" : "Are you sure you want to delete this shipping zone?")) return;
    setDeletingId(id);
    try {
      const updated = await deleteShippingZone(id);
      setZones(updated);
    } catch (err: any) {
      alert((isBn ? "জোন মুছতে ব্যর্থ হয়েছে: " : "Failed to delete zone: ") + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <ModuleHeader
          title={isBn ? "ভৌগোলিক শিপিং জোন ও ডেলিভারি চার্জ" : "Geographic Shipping Zones & Delivery Rates"}
          description={
            isBn
              ? "বাংলাদেশের বিভিন্ন অঞ্চলের পার্সেল ডেলিভারি চার্জ, ট্রানজিট সময় এবং ফ্রি ডেলিভারি থ্রেশহোল্ড নির্ধারণ করুন।"
              : "Configure regional parcel delivery fees, estimated transit days, and free delivery thresholds for Bangladesh."
          }
          iconName="MapPin"
          isCore
        />

        <Button onClick={openAddModal} size="sm" className="text-xs shrink-0">
          <Plus className="h-3.5 w-3.5 mr-1" />
          {isBn ? "শিপিং জোন যোগ করুন" : "Add Shipping Zone"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-text">{zone.name}</h3>
                  {zone.enabled ? (
                    <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-bold uppercase border border-emerald-200">
                      {isBn ? "সক্রিয় জোন" : "Active Zone"}
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-secondary text-text-muted px-2.5 py-0.5 text-[10px] font-bold uppercase border border-border">
                      {isBn ? "নিষ্ক্রিয়" : "Disabled"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary-600 shrink-0" />
                  {zone.regions}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(zone)}
                  className="text-xs h-8 px-3"
                >
                  <Edit2 className="h-3 w-3 mr-1 text-primary-600" />
                  {isBn ? "চার্জ পরিবর্তন" : "Edit Rates"}
                </Button>
                <button
                  onClick={() => handleDelete(zone.id)}
                  disabled={deletingId === zone.id}
                  className="p-1.5 text-text-muted hover:text-red-600 transition-colors"
                  title={isBn ? "জোন মুছুন" : "Delete zone"}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-border bg-surface-secondary/40 p-3 space-y-1">
                <span className="text-text-muted font-medium text-[11px] block">
                  {isBn ? "গ্রাহক ডেলিভারি ফি" : "Customer Delivery Fee"}
                </span>
                <span className="text-base font-extrabold text-primary-600">
                  {formatPrice(zone.charge)}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-surface-secondary/40 p-3 space-y-1">
                <span className="text-text-muted font-medium text-[11px] block">
                  {isBn ? "ফ্রি শিপিং প্রযোজ্য" : "Free Shipping Above"}
                </span>
                <span className="text-base font-extrabold text-emerald-600">
                  {formatPrice(zone.freeThreshold)}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-surface-secondary/40 p-3 space-y-1">
                <span className="text-text-muted font-medium text-[11px] block">
                  {isBn ? "আনুমানিক সময়" : "Estimated Transit"}
                </span>
                <span className="text-sm font-bold text-text flex items-center gap-1 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-text-muted" />
                  {zone.deliveryTime}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-surface-secondary/40 p-3 space-y-1">
                <span className="text-text-muted font-medium text-[11px] block">
                  {isBn ? "কুরিয়ার আনুমানিক খরচ" : "Courier Cost Est."}
                </span>
                <span className="text-xs font-mono text-text block">
                  SF: ৳{zone.courierRates?.steadfast || zone.charge} | Pathao: ৳{zone.courierRates?.pathao || zone.charge + 10}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Zone Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-border animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-600" />
                {editingZone
                  ? (isBn ? "শিপিং জোন রেট সম্পাদনা" : "Edit Shipping Zone Rates")
                  : (isBn ? "নতুন শিপিং জোন তৈরি" : "Create Shipping Zone")}
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
                <Label htmlFor="zone-name">{isBn ? "জোনের নাম" : "Zone Title"}</Label>
                <Input
                  id="zone-name"
                  placeholder={isBn ? "যেমন: ঢাকা সিটির ভিতরে (এক্সপ্রেস)" : "e.g. Inside Dhaka City (Express)"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="zone-regions">{isBn ? "অন্তর্ভুক্ত জেলা বা এলাকাসমূহ" : "Included Districts / Areas"}</Label>
                <textarea
                  id="zone-regions"
                  rows={2}
                  placeholder={
                    isBn
                      ? "যেমন: ঢাকা উত্তর, ঢাকা দক্ষিণ, গুলশান, বনানী, ধানমন্ডি..."
                      : "e.g. Dhaka North, Dhaka South, Gulshan, Banani, Dhanmondi..."
                  }
                  value={regions}
                  onChange={(e) => setRegions(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white p-2.5 text-xs text-text focus:border-primary-500 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="zone-charge">{isBn ? "গ্রাহক ডেলিভারি ফি (৳)" : "Customer Delivery Fee (৳)"}</Label>
                  <Input
                    id="zone-charge"
                    type="number"
                    value={charge}
                    onChange={(e) => setCharge(e.target.value)}
                    min={0}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="zone-free">{isBn ? "ফ্রি ডেলিভারি প্রযোজ্য হবে (৳)" : "Free Delivery Above (৳)"}</Label>
                  <Input
                    id="zone-free"
                    type="number"
                    value={freeThreshold}
                    onChange={(e) => setFreeThreshold(e.target.value)}
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="zone-time">{isBn ? "আনুমানিক ট্রানজিট সময়" : "Estimated Transit"}</Label>
                  <Input
                    id="zone-time"
                    placeholder={isBn ? "যেমন: ২৪-৪৮ ঘণ্টা" : "e.g. 24-48 Hours"}
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="zone-enabled">{isBn ? "স্ট্যাটাস" : "Status"}</Label>
                  <select
                    id="zone-enabled"
                    value={enabled ? "active" : "disabled"}
                    onChange={(e) => setEnabled(e.target.value === "active")}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none"
                  >
                    <option value="active">{isBn ? "সক্রিয় জোন" : "Active Zone"}</option>
                    <option value="disabled">{isBn ? "নিষ্ক্রিয়" : "Disabled"}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border">
                <div className="space-y-1">
                  <Label htmlFor="zone-sf">{isBn ? "স্টিডফাস্ট রেট (৳)" : "SteadFast Rate (৳)"}</Label>
                  <Input
                    id="zone-sf"
                    type="number"
                    value={sfRate}
                    onChange={(e) => setSfRate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="zone-pathao">{isBn ? "পাঠাও রেট (৳)" : "Pathao Rate (৳)"}</Label>
                  <Input
                    id="zone-pathao"
                    type="number"
                    value={pathaoRate}
                    onChange={(e) => setPathaoRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting
                    ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...")
                    : (isBn ? "জোন রেট সংরক্ষণ করুন" : "Save Zone Rates")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
