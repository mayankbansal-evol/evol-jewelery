import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProducts, deleteProduct } from "@/lib/productsApi";
import type {
  ProductFilters,
  ProductRecord,
  ProductWithPricing,
  ProductStoneWithPricing,
  FixedSettings,
  Slab,
} from "@/lib/types";

// ─── Pricing helpers (mirrors CalculatorView logic) ───────────────────────────

function resolveAutoSlab(slabs: Slab[], weight: number, quantity: number): Slab | null {
  if (weight <= 0 || slabs.length === 0) return null;
  const pieces = Math.max(1, quantity);
  const perPieceWeight = weight / pieces;
  return slabs.find((sl) => perPieceWeight >= sl.fromWeight && perPieceWeight < sl.toWeight) ?? null;
}

function calculateMakingCharge(netGoldWeight: number, flatRate: number, perGramRate: number): number {
  if (netGoldWeight <= 0) return 0;
  if (netGoldWeight < 2) return flatRate;
  return netGoldWeight * perGramRate;
}

function computePricing(product: ProductRecord, settings: FixedSettings): ProductWithPricing {
  const purityPercentage = settings.purityPercentages[product.purity] ?? 100;
  const goldRate = Math.round(settings.goldRate24k * (purityPercentage / 100));
  const goldCost = product.net_gold_weight * goldRate;
  const makingCost = calculateMakingCharge(
    product.net_gold_weight,
    settings.makingChargeFlat,
    settings.makingChargePerGram
  );

  const stoneDetails: ProductStoneWithPricing[] = product.stones.map((s) => {
    const stoneType = settings.stoneTypes.find((st) => st.stoneId === s.stoneTypeId);
    const slabs = stoneType?.slabs ?? [];
    const slab = resolveAutoSlab(slabs, s.weight, s.quantity);
    const pricePerCarat = slab?.pricePerCarat ?? 0;
    return {
      ...s,
      pricePerCarat,
      cost: pricePerCarat * s.weight,
      slabCode: slab?.code ?? null,
    };
  });

  const stoneCostTotal = stoneDetails.reduce((sum, s) => sum + s.cost, 0);
  const subTotal = goldCost + makingCost + stoneCostTotal;
  const gst = subTotal * settings.gstRate;
  const total = subTotal + gst;

  return {
    ...product,
    goldRate,
    goldCost,
    makingCost,
    stoneCostTotal,
    subTotal,
    gst,
    total,
    stoneDetails,
  };
}

// ─── Default filters ─────────────────────────────────────────────────────────

const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  purities: [],
  stoneTypeIds: [],
  goldWeightMin: "",
  goldWeightMax: "",
  priceMin: "",
  priceMax: "",
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProducts(settings: FixedSettings) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);

  const queryKey = ["products", filters] as const;

  const { data: rawData, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchProducts(filters),
    select: (res) => res.data,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Compute dynamic pricing for every product using current settings
  const products = useMemo<ProductWithPricing[]>(() => {
    if (!rawData) return [];
    let computed = rawData.map((p) => computePricing(p, settings));

    // Price range filter — client-side only (prices not stored in DB)
    if (filters.priceMin !== "") {
      const min = parseFloat(filters.priceMin);
      computed = computed.filter((p) => p.total >= min);
    }
    if (filters.priceMax !== "") {
      const max = parseFloat(filters.priceMax);
      computed = computed.filter((p) => p.total <= max);
    }

    return computed;
  }, [rawData, settings, filters.priceMin, filters.priceMax]);

  const removeProduct = useCallback(
    async (id: string) => {
      const result = await deleteProduct(id);
      if (!result.error) {
        // Optimistic update — remove instantly then re-sync
        queryClient.setQueryData(queryKey, (old: ProductRecord[] | undefined) =>
          old ? old.filter((p) => p.id !== id) : old
        );
        queryClient.invalidateQueries({ queryKey: ["products"] });
      }
      return result;
    },
    [queryClient, queryKey]
  );

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  return {
    products,
    isLoading,
    isError,
    error: error?.message ?? null,
    filters,
    setFilters,
    resetFilters,
    refetch,
    removeProduct,
  };
}
