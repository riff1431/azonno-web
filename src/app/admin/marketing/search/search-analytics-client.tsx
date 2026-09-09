"use client";

import React, { useState, useTransition } from "react";
import {
  Search,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  PackageCheck,
  PackageX,
  RefreshCw,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Layers,
  FlaskConical,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Tag,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import {
  fetchSearchAnalytics,
  addSynonymAction,
  deleteSynonymAction,
  seedSampleTrafficAction,
  clearSearchLogsAction,
} from "@/features/marketing/search-actions";
import type { SearchAnalyticsSummary, SearchSynonym } from "@/lib/analytics/search-analytics-service";

interface SearchAnalyticsClientProps {
  initialSummary: SearchAnalyticsSummary;
  publishedProductsCount: number;
}

export function SearchAnalyticsClient({
  initialSummary,
  publishedProductsCount,
}: SearchAnalyticsClientProps) {
  const [summary, setSummary] = useState<SearchAnalyticsSummary>(initialSummary);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("30d");
  const [activeTab, setActiveTab] = useState<"all" | "trending" | "zero" | "high_intent">("all");
  const [filterText, setFilterText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Synonyms Modal state
  const [synonymModalOpen, setSynonymModalOpen] = useState(false);
  const [newSynTerm, setNewSynTerm] = useState("");
  const [newSynMapsTo, setNewSynMapsTo] = useState("");
  const [newSynNotes, setNewSynNotes] = useState("");
  const [isSavingSyn, setIsSavingSyn] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRefresh = (range = timeRange) => {
    startTransition(async () => {
      try {
        const data = await fetchSearchAnalytics(range);
        setSummary(data);
        showToast("Search analytics refreshed in real-time");
      } catch (e: any) {
        showToast("Failed to refresh search analytics", "error");
      }
    });
  };

  const handleRangeChange = (range: "24h" | "7d" | "30d" | "all") => {
    setTimeRange(range);
    handleRefresh(range);
  };

  const handleAddSynonym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSynTerm.trim() || !newSynMapsTo.trim()) {
      showToast("Term and Target Mapping are required", "error");
      return;
    }

    setIsSavingSyn(true);
    try {
      const res = await addSynonymAction(newSynTerm, newSynMapsTo, newSynNotes);
      if (res.success) {
        showToast(`Synonym '${newSynTerm}' → '${newSynMapsTo}' added successfully!`);
        setNewSynTerm("");
        setNewSynMapsTo("");
        setNewSynNotes("");
        handleRefresh();
      } else {
        showToast(res.error || "Failed to add synonym", "error");
      }
    } finally {
      setIsSavingSyn(false);
    }
  };

  const handleDeleteSynonym = async (id: string, term: string) => {
    try {
      const res = await deleteSynonymAction(id);
      if (res.success) {
        showToast(`Synonym '${term}' removed.`);
        handleRefresh();
      }
    } catch {
      showToast("Failed to delete synonym", "error");
    }
  };

  const handleSeedData = () => {
    startTransition(async () => {
      try {
        await seedSampleTrafficAction();
        showToast("Sample real-world search traffic generated!");
        handleRefresh();
      } catch {
        showToast("Failed to generate sample traffic", "error");
      }
    });
  };

  const handleExportCSV = () => {
    if (summary.zeroResultQueries.length === 0) {
      showToast("No zero-result search terms to export", "error");
      return;
    }

    const headers = ["Search Query", "Search Volume", "Procurement Suggestion", "Last Searched"];
    const rows = summary.zeroResultQueries.map((item) => [
      `"${item.query.replace(/"/g, '""')}"`,
      item.volume,
      `"${item.procurementSuggestion.replace(/"/g, '""')}"`,
      `"${new Date(item.lastSearched).toISOString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `unfulfilled_demand_search_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Unfulfilled demand CSV exported successfully!");
  };

  // Filter top searches by tab and search text
  const filteredSearches = summary.topSearches.filter((item) => {
    const matchesFilter =
      !filterText.trim() ||
      item.query.toLowerCase().includes(filterText.toLowerCase()) ||
      item.procurementSuggestion.toLowerCase().includes(filterText.toLowerCase());

    if (!matchesFilter) return false;

    if (activeTab === "trending") return item.volume >= 2;
    if (activeTab === "zero") return item.matchesCount === 0;
    if (activeTab === "high_intent") {
      const ctrVal = parseInt(item.ctr) || 0;
      return ctrVal >= 45;
    }
    return true;
  });

  const maxVolume = Math.max(...summary.topSearches.map((s) => s.volume), 1);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl transition-all ${
            toast.type === "success"
              ? "bg-slate-900 border-emerald-500/50 text-white"
              : "bg-red-950 border-red-500/50 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Search Analytics & Consumer Demand
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Stream
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time tracking of customer skincare queries compared against your active inventory ({publishedProductsCount} published products).
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time range pills */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-medium border border-gray-200">
            {(["24h", "7d", "30d", "all"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => handleRangeChange(range)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeRange === range
                    ? "bg-white text-gray-900 font-bold shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {range === "24h"
                  ? "24h"
                  : range === "7d"
                  ? "7 Days"
                  : range === "30d"
                  ? "30 Days"
                  : "All Time"}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRefresh()}
            disabled={isPending}
            className="text-xs border-gray-200 hover:bg-gray-50 text-gray-700 bg-white shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isPending ? "animate-spin text-rose-500" : "text-gray-400"}`} />
            Refresh
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSynonymModalOpen(true)}
            className="text-xs border-gray-200 hover:bg-gray-50 text-gray-700 bg-white shadow-xs"
          >
            <Tag className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
            Synonyms ({summary.synonyms?.length || 0})
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs border-gray-200 hover:bg-gray-50 text-gray-700 bg-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
            Export Demand CSV
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSeedData}
            title="Seed realistic search activity"
            className="text-xs border-dashed border-gray-300 text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          >
            <FlaskConical className="h-3.5 w-3.5 mr-1" />
            Simulate
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-gray-500 font-medium">Sampled Search Queries</span>
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            {summary.totalSearches.toLocaleString()}
          </p>
          <div className="flex items-center text-[11px] text-emerald-600 font-semibold">
            <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> High Storefront Intent
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-gray-500 font-medium">Catalog Coverage</span>
          <p className="text-2xl font-black text-emerald-600 tracking-tight">
            {summary.catalogCoveragePct}%
          </p>
          <p className="text-[11px] text-gray-400">Queries with matched inventory</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-gray-500 font-medium">Unfulfilled Demand (Zero Results)</span>
          <p className="text-2xl font-black text-amber-600 tracking-tight">
            {summary.zeroResultsPct}%
          </p>
          <p className="text-[11px] text-amber-700 font-semibold">
            Procurement expansion opportunities
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-gray-500 font-medium">Avg. Search Click CTR</span>
          <p className="text-2xl font-black text-rose-600 tracking-tight">
            {summary.avgCtrPct}%
          </p>
          <p className="text-[11px] text-gray-400">Conversion to product view</p>
        </div>
      </div>

      {/* Demand & Ingredient Intelligence Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Search Trend & Ingredient breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-rose-500" />
              <h2 className="text-sm font-bold text-gray-900">
                Top Skincare Ingredients & Actives In Demand
              </h2>
            </div>
            <span className="text-[11px] text-gray-400">Aggregated from search volume</span>
          </div>

          <div className="space-y-3 pt-1">
            {summary.ingredientDemand.slice(0, 6).map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    {item.name}
                  </span>
                  <span className="font-bold text-gray-600">{item.count} searches ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-rose-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, item.percentage * 2.2 + 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Category Demand */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-bold text-gray-900">Category Demand</h2>
            </div>
            <span className="text-[11px] text-gray-400">Share %</span>
          </div>

          <div className="space-y-3 pt-1">
            {summary.categoryDemand.slice(0, 5).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50/70 border border-gray-100">
                <span className="font-medium text-gray-700">{cat.name}</span>
                <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                  {cat.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Searches Intelligence Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        {/* Table Header & Tabs */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/60">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Storefront Search Terms & Live Catalog Matches
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Identifies which beauty products customers look for and matches against real active catalog items.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            {/* Filter search box */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter search terms..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-2xs"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center overflow-x-auto bg-gray-200/80 p-0.5 rounded-xl text-xs font-medium border border-gray-300/60 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === "all" ? "bg-white text-gray-900 font-bold shadow-2xs" : "text-gray-600"
                }`}
              >
                All ({summary.topSearches.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("trending")}
                className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === "trending" ? "bg-white text-gray-900 font-bold shadow-2xs" : "text-gray-600"
                }`}
              >
                🔥 Trending
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("zero")}
                className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === "zero"
                    ? "bg-amber-500 text-white font-bold shadow-2xs"
                    : "text-amber-800 hover:text-amber-900"
                }`}
              >
                ⚠️ Zero ({summary.zeroResultQueries.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("high_intent")}
                className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === "high_intent" ? "bg-white text-gray-900 font-bold shadow-2xs" : "text-gray-600"
                }`}
              >
                🎯 High CTR
              </button>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-gray-500 uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Search Query</th>
                <th className="px-4 py-3">Volume</th>
                <th className="px-4 py-3">Catalog Matches</th>
                <th className="px-4 py-3">Click-Through Rate</th>
                <th className="px-4 py-3">Procurement Opportunity & Recommendation</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSearches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No search terms found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredSearches.map((item) => (
                  <tr key={item.query} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span>&ldquo;{item.query}&rdquo;</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="font-extrabold text-gray-900 block">
                          {item.volume} searches
                        </span>
                        <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-rose-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (item.volume / maxVolume) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                          item.matchesCount > 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-300 shadow-2xs"
                        }`}
                      >
                        {item.matchesCount > 0 ? (
                          <>
                            <PackageCheck className="h-3 w-3" />
                            {item.matchesCount} active product{item.matchesCount > 1 ? "s" : ""}
                          </>
                        ) : (
                          <>
                            <PackageX className="h-3 w-3 text-amber-600" />
                            0 matches (Demand gap)
                          </>
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-gray-800 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 font-mono text-[11px]">
                        {item.ctr}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-gray-600 max-w-sm">
                      {item.matchesCount === 0 ? (
                        <span className="text-amber-800 font-medium">
                          {item.procurementSuggestion}
                        </span>
                      ) : (
                        <span>{item.procurementSuggestion}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/shop?q=${encodeURIComponent(item.query)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium transition"
                          title="Test search on public shop"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Test
                        </a>

                        {item.matchesCount === 0 && (
                          <a
                            href={`/admin/products/new?name=${encodeURIComponent(item.query)}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition"
                            title="Add product to catalog for this keyword"
                          >
                            <Plus className="h-3 w-3" />
                            Add Product
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Synonyms & Redirects Modal */}
      {synonymModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Search Synonyms & Merchandising Aliases
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Map alternative words or misspellings so shoppers find the right products effortlessly.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSynonymModalOpen(false)}
                className="h-8 w-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Add Synonym Form */}
              <form onSubmit={handleAddSynonym} className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-800 block">
                  Add New Synonym / Search Alias:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      If Customer Searches:
                    </label>
                    <input
                      type="text"
                      value={newSynTerm}
                      onChange={(e) => setNewSynTerm(e.target.value)}
                      placeholder="e.g. suncream, cica, boj"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Map / Expand To:
                    </label>
                    <input
                      type="text"
                      value={newSynMapsTo}
                      onChange={(e) => setNewSynMapsTo(e.target.value)}
                      placeholder="e.g. sunscreen, centella, beauty of joseon"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Notes (Optional):
                  </label>
                  <input
                    type="text"
                    value={newSynNotes}
                    onChange={(e) => setNewSynNotes(e.target.value)}
                    placeholder="e.g. K-Beauty acronym, typo alias"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingSyn}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {isSavingSyn ? "Adding..." : "Add Synonym"}
                  </Button>
                </div>
              </form>

              {/* Active Synonyms List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-800 block">
                  Configured Search Synonyms ({summary.synonyms?.length || 0}):
                </span>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                  {summary.synonyms?.length === 0 ? (
                    <p className="p-4 text-center text-xs text-gray-500">
                      No synonyms configured yet. Add your first above!
                    </p>
                  ) : (
                    summary.synonyms?.map((syn) => (
                      <div
                        key={syn.id}
                        className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md font-mono">
                            {syn.term}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md font-mono">
                            {syn.mapsTo}
                          </span>
                          {syn.notes && (
                            <span className="text-[11px] text-gray-400 ml-2">
                              ({syn.notes})
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSynonym(syn.id, syn.term)}
                          className="h-7 w-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition"
                          title="Delete synonym"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
