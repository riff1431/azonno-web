"use client";

import { useState } from "react";
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  X,
  Lock,
  Loader2,
  Sparkles,
  Info,
  RefreshCw,
  Database,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import {
  CLEARABLE_FEATURES,
  type DataClearableFeature,
} from "@/features/system/clear-data-types";
import { clearFeatureData } from "@/features/system/clear-data-actions";

export function ClearDataSection() {
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>(
    CLEARABLE_FEATURES?.[0]?.id || "pixels_tracking"
  );
  const [showModal, setShowModal] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);

  const currentFeature =
    CLEARABLE_FEATURES.find((f) => f.id === selectedFeatureId) || CLEARABLE_FEATURES[0];

  const handleOpenModal = () => {
    setAcknowledged(false);
    setConfirmInput("");
    setResultMessage(null);
    setShowModal(true);
  };

  const handleExecuteClear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) return;
    if (confirmInput.trim().toUpperCase() !== "DELETE" && confirmInput.trim().toUpperCase() !== "CONFIRM") {
      return;
    }

    setLoading(true);
    try {
      const res = await clearFeatureData(currentFeature.id, confirmInput);
      if (res.success) {
        setResultMessage({
          success: true,
          message: res.message || "Data successfully cleared।",
          timestamp: res.timestamp,
        });
        setTimeout(() => {
          setShowModal(false);
          setConfirmInput("");
          setAcknowledged(false);
        }, 2200);
      } else {
        setResultMessage({
          success: false,
          message: res.error || "Failed to clear data।",
        });
      }
    } catch (err: any) {
      setResultMessage({
        success: false,
        message: err.message || "Server Error successfully।",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border-2 border-red-200 bg-linear-to-br from-red-50/40 via-white to-orange-50/30 p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-red-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white shadow-xs">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text">
                :00 Reset    (Selective Data Wiper)
              </h2>
              <span className="text-[10px] font-black uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-300">
                Admin Control
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
                :00 (e.g.: Pixel Tracking, , Order , Reviews)  2-  from Complete Delete।
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
          2-Step Safety Guard
        </span>
      </div>

      {resultMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in-0 ${
            resultMessage.success
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {resultMessage.success ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <div className="flex-1">
            <p>{resultMessage.message}</p>
            {resultMessage.timestamp && (
              <span className="text-[10px] text-emerald-700 font-mono">Time: {resultMessage.timestamp}</span>
            )}
          </div>
        </div>
      )}

      {/* Feature Selector & Action Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-8 space-y-1.5">
          <label className="block text-xs font-bold text-gray-800">
              :00    :
          </label>
          <select
            value={selectedFeatureId}
            onChange={(e) => {
              setSelectedFeatureId(e.target.value);
              setResultMessage(null);
            }}
            className="w-full rounded-2xl border-2 border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-red-500 focus:outline-none shadow-2xs"
          >
            {CLEARABLE_FEATURES.map((feat) => (
              <option key={feat.id} value={feat.id} className="font-semibold text-gray-800">
                [{feat.category}] {feat.nameBn}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4 flex items-center justify-end">
          <Button
            type="button"
            onClick={handleOpenModal}
            className="w-full h-10 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Trash2 className="h-4 w-4" />
            <span>:00  </span>
          </Button>
        </div>
      </div>

      {/* Selected Feature Preview Detail Card */}
      <div className="rounded-2xl border border-red-100 bg-white p-4 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-black text-gray-900 text-xs">
            {currentFeature.nameBn}
          </span>
          <span
            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
              currentFeature.severity === "critical"
                ? "bg-red-100 text-red-800 border-red-300"
                : currentFeature.severity === "high"
                ? "bg-orange-100 text-orange-800 border-orange-300"
                : currentFeature.severity === "medium"
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-blue-100 text-blue-800 border-blue-300"
            }`}
          >
            Severity: {currentFeature.severity}
          </span>
        </div>

        <p className="text-gray-600 font-medium leading-relaxed">
          {currentFeature.descriptionBn}
        </p>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-700 bg-red-50/80 p-2 rounded-xl border border-red-200">
          <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
          <span>: {currentFeature.impactWarning}</span>
        </div>
      </div>

      {/* 2-STEP SAFETY CONFIRMATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border-2 border-red-500 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    Step 2 of 2: Safety Verification
                  </span>
                  <h3 className="text-base font-black text-gray-900 mt-0.5">
                    Are you sure you want to Confirmedpermanently  :00 want to delete?
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Target Item Highlight */}
            <div className="bg-red-50 p-3.5 rounded-2xl border border-red-200 space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase text-red-500 block">
                :00 :
              </span>
              <p className="font-extrabold text-red-950 text-sm">
                {currentFeature.nameBn}
              </p>
              <p className="text-red-700 text-[11px] leading-relaxed">
                {currentFeature.descriptionBn}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleExecuteClear} className="space-y-4 text-xs">
              {/* Checkbox Acknowledgment */}
              <label className="flex items-start gap-3 p-3 rounded-2xl border border-gray-200 bg-gray-50/70 hover:bg-gray-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-red-600 focus:ring-red-500 accent-red-600 shrink-0"
                />
                <span className="font-bold text-gray-800 leading-snug">
                     Confirmed    :00items permanently   and     ।
                </span>
              </label>

              {/* Text Confirmation Input */}
              <div className="space-y-1.5">
                <label className="block font-bold text-gray-700">
                  Security Confirmed    <span className="font-mono text-red-600 font-extrabold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">DELETE</span> :
                </label>
                <Input
                  type="text"
                  placeholder="DELETE"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="font-mono font-bold tracking-widest text-center uppercase border-2 focus:border-red-500 text-sm h-11"
                  required
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="text-xs h-9 font-semibold cursor-pointer"
                >
                  Cancel  (Cancel)
                </Button>

                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !acknowledged ||
                    (confirmInput.trim().toUpperCase() !== "DELETE" && confirmInput.trim().toUpperCase() !== "CONFIRM")
                  }
                  className="text-xs h-9 px-4 font-bold bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>  ...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>permanently Delete (Permanent Delete)</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
