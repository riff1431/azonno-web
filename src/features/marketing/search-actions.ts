"use server";

import {
  getSearchAnalyticsSummary,
  getSearchSynonyms,
  saveSearchSynonyms,
  saveRawSearchLogs,
  getRawSearchLogs,
  type SearchAnalyticsSummary,
  type SearchSynonym,
  type SearchLogEntry,
} from "@/lib/analytics/search-analytics-service";
import { revalidatePath } from "next/cache";

export async function fetchSearchAnalytics(
  timeRange: "24h" | "7d" | "30d" | "all" = "30d"
): Promise<SearchAnalyticsSummary> {
  return await getSearchAnalyticsSummary(timeRange);
}

export async function addSynonymAction(term: string, mapsTo: string, notes?: string) {
  if (!term.trim() || !mapsTo.trim()) {
    return { success: false, error: "Term and Target Mapping are required" };
  }

  const synonyms = await getSearchSynonyms();
  const normalizedTerm = term.trim().toLowerCase();
  const existingIdx = synonyms.findIndex((s) => s.term.toLowerCase() === normalizedTerm);

  const newSyn: SearchSynonym = {
    id: `syn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    term: normalizedTerm,
    mapsTo: mapsTo.trim().toLowerCase(),
    notes: notes?.trim() || "",
    createdAt: Date.now(),
  };

  let updated: SearchSynonym[];
  if (existingIdx !== -1) {
    updated = [...synonyms];
    updated[existingIdx] = newSyn;
  } else {
    updated = [newSyn, ...synonyms];
  }

  await saveSearchSynonyms(updated);
  revalidatePath("/admin/marketing/search");
  return { success: true };
}

export async function deleteSynonymAction(id: string) {
  const synonyms = await getSearchSynonyms();
  const updated = synonyms.filter((s) => s.id !== id);
  await saveSearchSynonyms(updated);
  revalidatePath("/admin/marketing/search");
  return { success: true };
}

export async function clearSearchLogsAction() {
  await saveRawSearchLogs([]);
  revalidatePath("/admin/marketing/search");
  return { success: true };
}

export async function seedSampleTrafficAction() {
  const sampleData: Omit<SearchLogEntry, "id">[] = [
    {
      query: "cosrx snail 96",
      normalizedQuery: "cosrx snail 96",
      resultsCount: 2,
      hasMatches: true,
      matchedCategories: ["Essence & Serums"],
      matchedBrands: ["COSRX"],
      matchedIngredients: ["Snail Mucin"],
      clicked: true,
      timestamp: Date.now() - 1000 * 60 * 10,
    },
    {
      query: "cerave hydrating cleanser",
      normalizedQuery: "cerave hydrating cleanser",
      resultsCount: 0,
      hasMatches: false,
      matchedCategories: ["Cleansers"],
      matchedBrands: ["CeraVe"],
      matchedIngredients: ["Ceramides", "Hyaluronic Acid"],
      clicked: false,
      timestamp: Date.now() - 1000 * 60 * 30,
    },
    {
      query: "beauty of joseon relief sun",
      normalizedQuery: "beauty of joseon relief sun",
      resultsCount: 2,
      hasMatches: true,
      matchedCategories: ["Sunscreen & Sun Care"],
      matchedBrands: ["Beauty of Joseon"],
      matchedIngredients: ["Rice Extract", "Probiotics"],
      clicked: true,
      timestamp: Date.now() - 1000 * 60 * 60,
    },
    {
      query: "anua dark spot serum",
      normalizedQuery: "anua dark spot serum",
      resultsCount: 1,
      hasMatches: true,
      matchedCategories: ["Essence & Serums"],
      matchedBrands: ["ANUA"],
      matchedIngredients: ["Niacinamide", "TXA"],
      clicked: true,
      timestamp: Date.now() - 1000 * 60 * 90,
    },
    {
      query: "retinol anti aging night cream",
      normalizedQuery: "retinol anti aging night cream",
      resultsCount: 0,
      hasMatches: false,
      matchedCategories: ["Anti-Aging"],
      matchedBrands: [],
      matchedIngredients: ["Retinol / Retinoids"],
      clicked: false,
      timestamp: Date.now() - 1000 * 60 * 150,
    },
    {
      query: "skin1004 hyalu-cica sun serum",
      normalizedQuery: "skin1004 hyalu-cica sun serum",
      resultsCount: 1,
      hasMatches: true,
      matchedCategories: ["Sunscreen & Sun Care"],
      matchedBrands: ["SKIN1004"],
      matchedIngredients: ["Centella Asiatica (Cica)", "Hyaluronic Acid"],
      clicked: true,
      timestamp: Date.now() - 1000 * 60 * 200,
    },
    {
      query: "the ordinary salicylic acid 2% solution",
      normalizedQuery: "the ordinary salicylic acid 2% solution",
      resultsCount: 1,
      hasMatches: true,
      matchedCategories: ["Exfoliators & Peels"],
      matchedBrands: ["The Ordinary"],
      matchedIngredients: ["Salicylic Acid (BHA)"],
      clicked: true,
      timestamp: Date.now() - 1000 * 60 * 250,
    },
    {
      query: "purito mighty bamboo panthenol cream",
      normalizedQuery: "purito mighty bamboo panthenol cream",
      resultsCount: 1,
      hasMatches: true,
      matchedCategories: ["Moisturizers"],
      matchedBrands: ["PURITO SEOUL"],
      matchedIngredients: ["Panthenol", "Bamboo"],
      clicked: false,
      timestamp: Date.now() - 1000 * 60 * 320,
    },
    {
      query: "haruharu wonder black rice toner",
      normalizedQuery: "haruharu wonder black rice toner",
      resultsCount: 0,
      hasMatches: false,
      matchedCategories: ["Toners & Mists"],
      matchedBrands: ["Haruharu Wonder"],
      matchedIngredients: ["Rice Extract", "Hyaluronic Acid"],
      clicked: false,
      timestamp: Date.now() - 1000 * 60 * 400,
    },
  ];

  const logs = sampleData.map((item, idx) => ({
    ...item,
    id: `log-${Date.now()}-${idx}`,
  }));

  await saveRawSearchLogs(logs);
  revalidatePath("/admin/marketing/search");
  return { success: true };
}
