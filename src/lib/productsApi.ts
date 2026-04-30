import { supabase } from "./supabase";
import type { ProductFilters, ProductRecord, ProductStoneEntry } from "./types";

export interface SaveSearchEstimatePayload {
  barcodeId: string;
  slug?: string | null;
  productName: string;
  productImageUrl: string | null;
  purity: string;
  netGoldWeight: number;
  stones: ProductStoneEntry[];
}

function normalizeWeight(value: number) {
  return Number(value.toFixed(3));
}

function normalizeStone(stone: ProductStoneEntry) {
  return {
    stoneTypeId: stone.stoneTypeId,
    quantity: stone.quantity,
    weight: normalizeWeight(stone.weight),
  };
}

function normalizeStones(stones: ProductStoneEntry[]) {
  return stones
    .map(normalizeStone)
    .sort((a, b) => {
      if (a.stoneTypeId !== b.stoneTypeId) {
        return a.stoneTypeId.localeCompare(b.stoneTypeId);
      }
      if (a.quantity !== b.quantity) {
        return a.quantity - b.quantity;
      }
      return a.weight - b.weight;
    });
}

function snapshotsMatch(existing: ProductRecord, payload: SaveSearchEstimatePayload) {
  return (
    existing.purity === payload.purity &&
    normalizeWeight(existing.net_gold_weight) ===
      normalizeWeight(payload.netGoldWeight) &&
    JSON.stringify(normalizeStones(existing.stones)) ===
      JSON.stringify(normalizeStones(payload.stones))
  );
}

async function insertSearchEstimate(payload: SaveSearchEstimatePayload) {
  const now = new Date().toISOString();
  const row = {
    barcode_id: payload.barcodeId,
    slug: payload.slug ?? null,
    search_count: 1,
    first_searched_at: now,
    last_searched_at: now,
    product_name: payload.productName.trim(),
    product_image_url: payload.productImageUrl,
    purity: payload.purity,
    net_gold_weight: payload.netGoldWeight,
    stones: payload.stones,
  };

  return supabase.from("products").insert(row).select().single();
}

export async function saveSearchEstimate(
  payload: SaveSearchEstimatePayload,
): Promise<{ data: ProductRecord | null; error: string | null }> {
  if (!payload.barcodeId.trim()) {
    return { data: null, error: "Barcode is required to save search history." };
  }

  if (!payload.productName.trim()) {
    return { data: null, error: "Product name is required to save search history." };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("products")
    .select("*")
    .eq("barcode_id", payload.barcodeId)
    .maybeSingle();

  if (lookupError) {
    console.error("[productsApi] Lookup failed:", lookupError.message);
    return { data: null, error: lookupError.message };
  }

  if (!existing) {
    const { data, error } = await insertSearchEstimate(payload);

    if (error) {
      if (error.code === "23505") {
        return saveSearchEstimate(payload);
      }
      console.error("[productsApi] Insert failed:", error.message);
      return { data: null, error: error.message };
    }

    return { data: data as ProductRecord, error: null };
  }

  if (!snapshotsMatch(existing as ProductRecord, payload)) {
    return {
      data: null,
      error: "Saved barcode data conflicts with the latest catalogue result.",
    };
  }

  const nextCount = (existing.search_count ?? 0) + 1;
  const { data, error } = await supabase
    .from("products")
    .update({
      search_count: nextCount,
      last_searched_at: new Date().toISOString(),
    })
    .eq("barcode_id", payload.barcodeId)
    .select()
    .single();

  if (error) {
    console.error("[productsApi] Update failed:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as ProductRecord, error: null };
}

export async function fetchProducts(
  filters: ProductFilters,
): Promise<{ data: ProductRecord[]; error: string | null }> {
  let query = supabase
    .from("products")
    .select("*")
    .order("last_searched_at", { ascending: false });

  if (filters.search.trim()) {
    const search = filters.search.trim();
    query = query.or(
      `product_name.ilike.%${search}%,barcode_id.ilike.%${search}%`,
    );
  }

  if (filters.purities.length > 0) {
    query = query.in("purity", filters.purities);
  }

  if (filters.goldWeightMin !== "") {
    query = query.gte("net_gold_weight", parseFloat(filters.goldWeightMin));
  }
  if (filters.goldWeightMax !== "") {
    query = query.lte("net_gold_weight", parseFloat(filters.goldWeightMax));
  }

  const { data, error } = await query;

  if (error) {
    console.error("[productsApi] Fetch failed:", error.message);
    return { data: [], error: error.message };
  }

  let results = (data ?? []) as ProductRecord[];

  if (filters.stoneTypeIds.length > 0) {
    results = results.filter((product) =>
      product.stones.some((stone) => filters.stoneTypeIds.includes(stone.stoneTypeId)),
    );
  }

  return { data: results, error: null };
}
